sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "portaleamministrativo/externalServices/serviceTech/library",
    "sap/ui/core/BusyIndicator",
    "portaleamministrativo/model/formatter",
  ],
  function (BaseController, JSONModel, MessageBox, serviceTech, BusyIndicator, formatter) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.DetailTechnician", {
      serviceTech: new serviceTech(),
      formatter: formatter,
      onInit: function () {
        this.getRouter().getRoute("DetailTechnician").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: async function (oEvent) {
        var self = this,
          oArguments = oEvent.getParameter("arguments");
        self.setModel(new JSONModel({}), "Ticket");
        self.setModel(new JSONModel({}), "Supplier");

        this._sNumber = oArguments.Number;

        this.setModel(
          new JSONModel({
            Edit: this._sNumber ? false : true,
          }),
          "Item"
        );

        if (!this._sNumber) {
          return;
        }

        //Recupero i dati del Ticket
        var oTicket = await this.serviceTech.getTickets(this, "0", "number=" + this._sNumber);
        oTicket.results[0].attachments = formatter.formatAttachments(oTicket);
        this.setModel(new JSONModel(oTicket.results[0]), "Ticket");

        //Recupero i dati dell'utente
        if (oTicket?.results[0]?.accountId) {
          this.setModel(new JSONModel(await this.getSupplier(oTicket.results[0]?.accountId)), "Supplier");
        }
      },

      onBack: function () {
        this.getRouter().navTo("Home");
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
