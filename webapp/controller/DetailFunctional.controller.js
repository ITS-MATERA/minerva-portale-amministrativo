sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "portaleamministrativo/externalServices/serviceNow/library",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
  ],
  function (BaseController, JSONModel, MessageBox, serviceNow, BusyIndicator, MessageToast) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.DetailFunctional", {
      serviceNow: new serviceNow(),
      onInit: function () {
        this.getRouter().getRoute("DetailFunctional").attachPatternMatched(this._onObjectMatched, this);

        var oModelSelect = {
          ItilClassification: [{ Key: "SERVICE REQUEST", Text: "SERVICE REQUEST" }],
          Conduction: [{ Key: "Tecnica", Text: "Tecnica" }],
          Environment: [{ Key: "Produzione", Text: "Produzione" }],
          RequestType: [{ Key: "Supporto specialistisco", Text: "Supporto specialistisco" }],
          Type: [{ Key: "ASSISTENZA SW", Text: "ASSISTENZA SW" }],
          Application: [
            { Key: "MALF-POR", Text: "Malfunzionamento Portale" },
            { Key: "RICH-INF", Text: "Richiesta di informazioni su Ordine di Pagamento" },
            { Key: "CERT-UNI", Text: "Certificazione unica" },
            { Key: "ALTRO", Text: "Altro non specificato in elenco" },
            { Key: "FATT-BLO", Text: "Fattura bloccata al pagamento" },
            { Key: "ENTR-MER", Text: "Entrata Merci non presente al portale" },
            { Key: "QUES-NAT", Text: "Quesito di natura contrattuale/negoziale" },
          ],
        };

        this.setModel(new JSONModel(oModelSelect), "Select");
      },

      _onObjectMatched: async function (oEvent) {
        var self = this,
          oArguments = oEvent.getParameter("arguments");

        self.setModel(new JSONModel(this.initTicket()), "Ticket");
        self.setModel(new JSONModel({}), "Supplier");
        self.getModel("Ticket").setProperty("/config/edit", oArguments.Number ? false : true);

        this._sNumber = oArguments.Number;
        if (!this._sNumber) {
          return;
        }

        //Recupero i dati del Ticket
        var oTicket = await this.serviceNow.getTickets(this, "0", "number=" + this._sNumber);
        oTicket.results[0].attachments = this._formatAttachments(oTicket);
        oTicket.results[0].commentResults = this._formatComments(oTicket);
        this.setModel(new JSONModel(oTicket.results[0]), "Ticket");
        
        //Recupero i dati dell'utente
        if (oTicket?.results[0]?.accountId) {
          this.setModel(new JSONModel(await this._getSupplier(oTicket.results[0]?.accountId)), "Supplier");
        }
      },

      onBack: function () {
        this.getRouter().navTo("Home");
      },

      onSend: async function () {
        var oTicket = this.getModel("Ticket").getData();

        //Caricamento allegati
        BusyIndicator.show(0);
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

      onApplicationChange: function (oEvent) {
        var sKey = oEvent.getParameter("selectedItem").getProperty("key");

        if (sKey === "FATT-BLO" || sKey === "ENTR-MER" || sKey === "QUES-NAT") {
          MessageBox.warning(this.getResourceBundle().getText("msgContactContracualReferent"));
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
                  var oTicket = oModelTicket.getData("Ticket");

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

      _formatComments: function (oTicket) {
        var results = [];
        var array = oTicket.results[0].comments.split("\n\n");
        array?.map((x, index) => {
          if (x && x !== "") {
            results.push({
              Comment: x,
            });
          }
        });

        return results;
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

        console.log("oSupplier", oSupplier.data);
        return oSupplier.data;
      },

      onPostComments: async function (oEvent) {
        var self = this,
          oModel = self.getModel("Ticket"),
          _sNumber = oModel.getProperty("/number"),
          sValue = oEvent.getParameter("value");
        console.log(oModel);

        var id = oModel.getProperty("/sys_id");
        var data = {
          comments: sValue.trimStart().trimEnd(),
        };

        if (await self.serviceNow.postComments(self, data, id)) {
          MessageToast.show(self.getResourceBundle().getText("msgCommentPostSuccess"));
          //TODO entrare per ticket-id e ricaricare solo i comments
          var oTicket = await self.serviceNow.getTickets(self, "0", "number=" + _sNumber);
          self.getView().getModel("Ticket").setProperty("/commentResults", self._formatComments(oTicket));
          
        } else {
          MessageToast.show(self.getResourceBundle().getText("msgCommentPostFailure"));
        }

      },
    });
  }
);
