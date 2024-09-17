sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "portaleamministrativo/externalServices/serviceNow/library",
    "portaleamministrativo/externalServices/serviceTech/library",
    "sap/ui/core/BusyIndicator",
    "portaleamministrativo/model/constants",
  ],
  function (BaseController, JSONModel, MessageBox, serviceNow, serviceTech, BusyIndicator, constants) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.NewTicket", {
      serviceNow: new serviceNow(),
      serviceTech: new serviceTech(),
      onInit: function () {
        var oBundle = this.getResourceBundle();
        this.getRouter().getRoute("NewTicket").attachPatternMatched(this._onObjectMatched, this);

        var oModelSelect = {
          Companies: [],
          Priorities: [
            { Key: "1", Text: oBundle.getText("labelPriorityLow") }, //tecnico
            { Key: "2", Text: oBundle.getText("labelPriorityNormal") },
            { Key: "3", Text: oBundle.getText("labelPriorityHigh") },
            { Key: "4", Text: oBundle.getText("labelPriorityCritical") },
          ],
          Categories: [
            { Text: oBundle.getText("labelCatMalfPor"), Type: constants.TABBAR_TECHNICIAN_KEY }, //tecnico
            { Text: oBundle.getText("labelCatRichInf"), Type: constants.TABBAR_FUNCTIONAL_KEY },
            { Text: oBundle.getText("labelCatCertUni"), Type: constants.TABBAR_FUNCTIONAL_KEY },
            { Text: oBundle.getText("labelCatAltro"), Type: constants.TABBAR_FUNCTIONAL_KEY },
            { Text: oBundle.getText("labelCatFattBlo"), Type: "" }, //no ticket + messaggio "contattare referente contrattuale"
            { Text: oBundle.getText("labelCatEntrMerc"), Type: "" }, //no ticket + messaggio "contattare referente contrattuale"
            { Text: oBundle.getText("labelCatQuesNat"), Type: "" }, //no ticket + messaggio "contattare referente contrattuale"
          ],
        };

        this.setModel(new JSONModel(oModelSelect), "Select");
      },

      _onObjectMatched: async function (oEvent) {
        var oArguments = oEvent.getParameter("arguments");
        var sNumber = oArguments.Number;
        var lifnr = "0100000002"; //TODO:Da canc

        var oSupplier = await this.getSupplier(lifnr);
        this.setModel(new JSONModel(oSupplier), "Supplier");
        this.getModel("Select").setProperty("/Companies", oSupplier.CompanyDataSet.results);

        this.setModel(new JSONModel(this.initTicket()), "Ticket");
        this.getModel("Ticket").setProperty("/config/edit", sNumber ? false : true);
      },

      onBack: function (oEvent) {
        var self = this;
        self.setModel(new JSONModel(self.initTicket()), "Ticket");
        self.getRouter().navTo("Home");
      },

      onSend: async function (oEvent) {
        var self = this,
          oSupplier = self.getModel("Supplier").getData();

        self.getModel("Ticket").setProperty("/account", oSupplier.ID);
        // self.getModel("Ticket").setProperty("/contact", oSupplier.Email); //"nuovocontatto3@test.tt", mail fornitore preso da mdg
        // self.getModel("Ticket").setProperty("/contact_name", oSupplier.Nome); //"Mario", presi da mdg
        // self.getModel("Ticket").setProperty("/contact_surname", oSupplier.RagioneSociale);
        //TODO:da recupare in base all'utente loggato
        self.getModel("Ticket").setProperty("/contact", "gianni.lecci@innovatesapp.com"); //"nuovocontatto3@test.tt", mail fornitore preso da mdg
        self.getModel("Ticket").setProperty("/contact_name", "Gianni");
        self.getModel("Ticket").setProperty("/contact_surname", "Lecci");

        var oTicket = self.getModel("Ticket").getData();
        if (
          !oTicket.company ||
          !oTicket.category ||
          !oTicket.priority ||
          !oTicket.description ||
          !oTicket.short_description
        ) {
          MessageBox.warning(self.getResourceBundle().getText("msgRequiredField"));
          return false;
        }

        var sType = self.getModel("Ticket").getProperty("/config/ticketType");
        var oTicketWithouAttachments = self.copyWithoutRef(oTicket);
        BusyIndicator.show(0);
        delete oTicketWithouAttachments.attachments;
        delete oTicketWithouAttachments.config;

        if (sType === constants.TABBAR_TECHNICIAN_KEY) {
          oTicketWithouAttachments.dataStart = self.formatter.formatDate(new Date());
          await self.serviceTech.send(self, oTicketWithouAttachments).then(
            async (response) => {
              oTicket.ID = response.ID;
              await Promise.all(
                oTicket.attachments?.map(
                  async function (x) {
                    self.serviceTech.uploadFile(self, oTicket.ID, x.file);
                  }.bind(this)
                )
              );
              BusyIndicator.hide();
              MessageBox.success(self.getResourceBundle().getText("msgTicketSended"), {
                onClose: function () {
                  self.getRouter().navTo("Home");
                }.bind(self),
              });
            },
            (error) => {
              BusyIndicator.hide();
              console.log(error);
              var errorText = error.responseJSON?.error?.detail;
              MessageBox.error(
                !errorText ? self.getResourceBundle().getText("msgGenericErrorOnSednServiceNow") : errorText
              );
              return false;
            }
          );
        } else {
          //Ticket Funzionali

          delete oTicketWithouAttachments.dataStart;
          delete oTicketWithouAttachments.dataEnd;

          await this.serviceNow.send(this, oTicketWithouAttachments).then(
            async (response) => {
              oTicket.sys_id = response.result.sys_id;
              await Promise.all(
                oTicket.attachments?.map(
                  async function (x) {
                    console.log(oTicket.sys_id);
                    this.serviceNow.uploadFile(this, oTicket.sys_id, x.file);
                  }.bind(this)
                )
              );
              BusyIndicator.hide();
              MessageBox.success(this.getResourceBundle().getText("msgTicketSended"), {
                onClose: function () {
                  this.getRouter().navTo("Home");
                }.bind(this),
              });
            },
            (error) => {
              BusyIndicator.hide();
              console.log(error);
              var errorText = error.responseJSON?.error?.detail;
              MessageBox.error(
                !errorText ? self.getResourceBundle().getText("msgGenericErrorOnSednServiceNow") : errorText
              );
              return false;
            }
          );
        }
      },

      onCategoryChange: function (oEvent) {
        var oModelTicket = this.getModel("Ticket");
        var sKey = oEvent.getParameter("selectedItem").getProperty("key");
        var sType = oEvent.getParameters().selectedItem.data("type");

        oModelTicket.setProperty("/config/ticketType", sType);

        if (
          sKey === this.getResourceBundle().getText("labelCatFattBlo") ||
          sKey === this.getResourceBundle().getText("labelCatEntrMerc") ||
          sKey === this.getResourceBundle().getText("labelCatQuesNat")
        ) {
          oModelTicket.setProperty("/config/sendEnabled", false);
          MessageBox.warning(this.getResourceBundle().getText("msgContactContracualReferent"));
          return false;
        }

        oModelTicket.setProperty("/config/sendEnabled", true);
      },

      onAttachManager: async function (oEvent) {
        switch (oEvent.getSource().data("button")) {
          case "Open":
            if (!this._oDialogFileUploader) {
              this._oDialogFileUploader = await this.loadFragment("portaleamministrativo.view.fragment.FileUploader");
            }

            this._oDialogFileUploader.open();
            break;
          case "Close":
            this._oDialogFileUploader.destroy();
            this._oDialogFileUploader = undefined;
            break;
          case "Upload":
            var oFileUploader = this.byId("fileUploader");

            oFileUploader
              .checkFileReadable()
              .then(
                async function () {
                  var oModelTicket = this.getModel("Ticket");
                  var oTicket = oModelTicket.getData();

                  var oAttach = {
                    id: oTicket.attachments.length,
                    file_id: null,
                    file_name: oFileUploader.oFileUpload.files[0].name,
                    file_url: null,
                    file: oFileUploader.oFileUpload.files[0],
                    new: true,
                  };

                  oTicket.attachments.push(oAttach);
                  oModelTicket.setProperty("/attachments", oTicket.attachments);

                  this._oDialogFileUploader.destroy();
                  this._oDialogFileUploader = undefined;
                }.bind(this),
                function (error) {
                  MessageBox.error(this.getResourceBundle().getText("msgTheFileCannotBeRead"));
                }.bind(this)
              )
              .then(
                function () {
                  oFileUploader.clear();
                }.bind(this)
              );

            break;
          case "Delete":
            var iId = oEvent.getSource().data("id");
            var oModelTicket = this.getModel("Ticket");
            var oTicket = oModelTicket.getData();
            var oAttach = oTicket.attachments.filter((x) => x.id === iId)[0];

            console.log(oTicket.attachments);

            if (oAttach.new) {
              var aNoDeleted = oTicket.attachments.filter((x) => x.id !== iId);

              oModelTicket.setProperty("/attachments", aNoDeleted);
            } else {
            }
            break;
          case "Download":
            var sFileId = oEvent.getSource().data("fileId");
            var sFileName = oEvent.getSource().data("fileName");

            this.serviceNow.downloadFile(this, sFileId, sFileName);
            break;
        }
      },
    });
  }
);
