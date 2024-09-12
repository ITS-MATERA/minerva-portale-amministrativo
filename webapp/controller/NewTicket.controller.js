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
  function (BaseController, JSONModel, MessageBox, serviceNow, serviceTech, BusyIndicator, constants ) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.NewTicket", {
      serviceNow: new serviceNow(),
      serviceTech: new serviceTech(),
      onInit: function () {
        this.getRouter().getRoute("NewTicket").attachPatternMatched(this._onObjectMatched, this);

        var oModelSelect = {
          Companies: [],
          // ItilClassification: [{ Key: "SERVICE REQUEST", Text: "SERVICE REQUEST" }],
          // Conduction: [{ Key: "Tecnica", Text: "Tecnica" }],
          // Environment: [{ Key: "Produzione", Text: "Produzione" }],
          // RequestType: [{ Key: "Supporto specialistisco", Text: "Supporto specialistisco" }],
          // Type: [{ Key: "ASSISTENZA SW", Text: "ASSISTENZA SW" }],
          Priorities: [
            { Key: "1", Text: this.getResourceBundle().getText("labelPriorityLow") }, //tecnico
            { Key: "2", Text: this.getResourceBundle().getText("labelPriorityNormal") },
            { Key: "3", Text: this.getResourceBundle().getText("labelPriorityHigh") },
            { Key: "4", Text: this.getResourceBundle().getText("labelPriorityCritical") },
          ],
          Categories: [
            {
              Key: "MALF-POR",
              Text: this.getResourceBundle().getText("labelCatMalfPor"),
              Type: constants.TABBAR_TECHNICIAN_KEY,
            }, //tecnico
            {
              Key: "RICH-INF",
              Text: this.getResourceBundle().getText("labelCatRichInf"),
              Type: constants.TABBAR_FUNCTIONAL_KEY,
            },
            {
              Key: "CERT-UNI",
              Text: this.getResourceBundle().getText("labelCatCertUni"),
              Type: constants.TABBAR_FUNCTIONAL_KEY,
            },
            {
              Key: "ALTRO",
              Text: this.getResourceBundle().getText("labelCatAltro"),
              Type: constants.TABBAR_FUNCTIONAL_KEY,
            },
            { Key: "FATT-BLO", Text: this.getResourceBundle().getText("labelCatFattBlo"), Type: "" }, //no ticket + messaggio "contattare referente contrattuale"
            { Key: "ENTR-MER", Text: this.getResourceBundle().getText("labelCatEntrMerc"), Type: "" }, //no ticket + messaggio "contattare referente contrattuale"
            { Key: "QUES-NAT", Text: this.getResourceBundle().getText("labelCatQuesNat"), Type: "" }, //no ticket + messaggio "contattare referente contrattuale"
          ],
        };

        this.setModel(new JSONModel(oModelSelect), "Select");
      },

      _initTicket: function () {
        var self = this;
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
          attachments: [],
          config:{
            sendEnabled:false,
            ticketType:null
          }

        };
      },

      _onObjectMatched: async function (oEvent) {
        var self = this;
        var oArguments = oEvent.getParameter("arguments");
        var lifnr = "0100000002"; //TODO:Da canc

        var oSupplier = await self._getSupplier(lifnr);
        self.setModel(new JSONModel(oSupplier), "Supplier");
        self.getModel("Select").setProperty("/Companies", oSupplier.CompanyDataSet.results);

        self.setModel(new JSONModel(self._initTicket()), "Ticket");
      },

      _getSupplier: async function (sCodiceBP) {
        var oSupplier = await this.getEntity(
          "/GeneralDataSet",
          "ZMDG_ADMIN_PORTAL_SRV",
          { ID: sCodiceBP },
          {},
          true,
          "BankDetailSet,CompanyDataSet"
        );

        console.log(oSupplier.data);
        return oSupplier.data;
      },

      onBack: function () {
        this.getRouter().navTo("Home");
      },

      onSend: async function (oEvent) {
        var self = this,
          oSupplier = self.getModel("Supplier").getData();

        self.getModel("Ticket").setProperty("/account", oSupplier.ID);
        self.getModel("Ticket").setProperty("/contact", oSupplier.Email); //"nuovocontatto3@test.tt", mail fornitore preso da mdg
        self.getModel("Ticket").setProperty("/contact_name", oSupplier.Nome); //"Mario", presi da mdg
        self.getModel("Ticket").setProperty("/contact_surname", oSupplier.RagioneSociale);

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
        console.log(oTicket); //TODO:Da canc
        delete oTicketWithouAttachments.attachments;
        delete oTicketWithouAttachments.config;   
        
        if(sType === constants.TABBAR_TECHNICIAN_KEY){
          await self.serviceTech.send(self, oTicketWithouAttachments).then(
            async (response) => {
              //TODO:da decommentare serviceTech
              oTicket.ID = response.ID;
              console.log(response);
              console.log("id", response.ID);
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
          await self.serviceNow.send(self, oTicketWithouAttachments).then(
            async (response) => {
              //TODO:da decommentare
              // oTicket.sys_id = response.sys_id;
              // console.log(response);
              // await Promise.all(
              //     oTicket.attachments?.map(
              //       async function (x) {
              //         self.serviceNow.uploadFile(self, oTicket.sys_id, x.file);
              //       }.bind(this)
              //     )
              //   );
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
        }
      },

      onCategorySelect: function (oEvent) {
        var self = this;
        var sKey = oEvent.getParameter("selectedItem").getProperty("key"),
            sType = oEvent.getParameters().selectedItem.data("type");

        self.getModel("Ticket").setProperty("/config/ticketType", sType);
        
        self.getModel("Ticket").setProperty("/category", null);
        if (sKey === "FATT-BLO" || sKey === "ENTR-MER" || sKey === "QUES-NAT") {
          self.getModel("Ticket").setProperty("/config/sendEnabled", false);
          MessageBox.warning(this.getResourceBundle().getText("msgContactContracualReferent"));
          return false;
        }
        self.getModel("Ticket").setProperty("/config/sendEnabled", true);
        self.getModel("Ticket").setProperty("/category", oEvent.getParameter("selectedItem").getProperty("text"));        
      },

      onPrioritySelect: function (oEvent) {
        var self = this;
        var sKey = oEvent.getParameter("selectedItem").getProperty("key");
        self.getModel("Ticket").setProperty("/priority", !sKey ? null : sKey);
      },

      onCompanyChange: function (oEvent) {
        var self = this;
        var sCompany = oEvent.getParameter("selectedItem").getProperty("text");
        self.getModel("Ticket").setProperty("/company", !sCompany ? null : sCompany);
        self.getModel("Ticket").setProperty("/company", "Trenitalia Treni Per Emilia Romagna");
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
                  // var oTicket = oModelTicket.getData("Ticket");
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

      _formatAttachments: function (oTicket) {
        var aAttachments = [];

        oTicket.results[0].attachments?.map((x, index) => {
          aAttachments.push({
            id: index,
            file_id: x.file_id,
            file_name: x.file_name,
            file_url: x.file_url,
            file_uploader: null,
            new: false,
          });
        });

        return aAttachments;
      },
    });
  }
);
