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
            { Key: "4", Text: oBundle.getText("labelPriorityLow") }, //tecnico
            { Key: "3", Text: oBundle.getText("labelPriorityNormal") },
            { Key: "2", Text: oBundle.getText("labelPriorityHigh") },
            { Key: "1", Text: oBundle.getText("labelPriorityCritical") },
          ],
          Categories: [
            { Text: oBundle.getText("labelCatMalfPor"), Type: constants.TABBAR_FUNCTIONAL_KEY },
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

      _onObjectMatched: async function () {
        var oUser = await this.getModel("user");
        var sBp = oUser.getData().bp;

        var oSupplier = await this.getSupplier(sBp);
        this.setModel(new JSONModel(oSupplier), "Supplier");
        this.getModel("Select").setProperty("/Companies", oSupplier.CompanyDataSet.results);

        this.setModel(new JSONModel(this.initTicket()), "Ticket");
      },

      onBack: function () {
        this.setModel(new JSONModel(this.initTicket()), "Ticket");
        this.getRouter().navTo("Home");
      },

      onSend: async function () {
        var oSupplier = this.getModel("Supplier")?.getData();
        var oModelTicket = this.getModel("Ticket");
        var oTicket = oModelTicket?.getData();
        var oUser = await this.getModel("user");
        oUser = oUser?.getData();

        oModelTicket.setProperty("/account", oSupplier.ID);
        oModelTicket.setProperty("/contact", oUser?.email);
        oModelTicket.setProperty("/contact_name", oUser?.name);
        oModelTicket.setProperty("/contact_surname", oUser?.lastname);

        if (
          (!oTicket.company && oTicket.category !== this.getResourceBundle().getText("labelCatMalfPor")) ||
          !oTicket.category ||
          !oTicket.priority ||
          !oTicket.description ||
          !oTicket.short_description
        ) {
          MessageBox.warning(this.getResourceBundle().getText("msgRequiredField"));
          return;
        }

        var sType = oModelTicket.getProperty("/config/type");
        var oTicketWithouAttachments = this.copyWithoutRef(oTicket);
        BusyIndicator.show(0);
        delete oTicketWithouAttachments.attachments;
        delete oTicketWithouAttachments.config;

        if (sType === constants.TABBAR_TECHNICIAN_KEY) {
          oTicketWithouAttachments.dataStart = this.formatter.formatDate(new Date());

          await this.serviceTech.send(this, oTicketWithouAttachments).then(
            async (response) => {
              oTicket.ID = response.ID;
              await Promise.all(
                oTicket.attachments?.map(
                  async function (x) {
                    this.serviceTech.uploadFile(this, oTicket.ID, x.file);
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
              var errorText = error.responseJSON?.error?.detail;
              MessageBox.error(
                !errorText ? this.getResourceBundle().getText("msgGenericErrorOnSednServiceNow") : errorText
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
              var errorText = error.responseJSON?.error?.detail;
              MessageBox.error(
                !errorText ? this.getResourceBundle().getText("msgGenericErrorOnSednServiceNow") : errorText
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

        oModelTicket.setProperty("/config/type", sType);

        if (sKey === this.getResourceBundle().getText("labelCatMalfPor")) {
          oModelTicket.setProperty("/company", null);
        }

        if (
          sKey === this.getResourceBundle().getText("labelCatFattBlo") ||
          sKey === this.getResourceBundle().getText("labelCatEntrMerc") ||
          sKey === this.getResourceBundle().getText("labelCatQuesNat")
        ) {
          oModelTicket.setProperty("/config/sendEnabled", false);
          MessageBox.warning(this.getResourceBundle().getText("msgContactContracualReferent"));
          return false;
        }
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

      initTicket: function () {
        return {
          company: null, //"Trenitalia Treni Per Emilia Romagna",società da mdg
          category: null, //"Certificazione unica",
          priority: null, //"3", bassa normale alta critica(emergency) 18n
          short_description: null, //"test case 30/08 Certificazione unica società in service", oggetto
          description: null, //"test case 30/08 corpo", descrizione
          application_code: "", //"test", da non passare quindi non input
          account: null, //"0100002118", lifnr preso da mdg
          contact: null, //"nuovocontatto3@test.tt", mail fornitore preso da mdg
          contact_name: null, //"Mario", presi da mdg
          contact_surname: null,
          dataStart: null,
          dataEnd: null,
          attachments: [],
          config: {
            sendEnabled: true,
            edit: true,
            type: null,
          },
        };
      },
    });
  }
);
