sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "portaleamministrativo/externalServices/serviceNow/library",
    "sap/m/MessageToast",
    "portaleamministrativo/model/constants",
    "portaleamministrativo/model/formatter",
  ],
  function (BaseController, JSONModel, MessageBox, serviceNow, MessageToast, constants, formatter) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.DetailFunctional", {
      serviceNow: new serviceNow(),
      formatter: formatter,
      onInit: function () {
        var oBundle = this.getResourceBundle();
        this.getRouter().getRoute("DetailFunctional").attachPatternMatched(this._onObjectMatched, this);

        var oModelSelect = {
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
        oTicket.results[0].attachments = formatter.formatAttachments(oTicket);
        oTicket.results[0].commentResults = formatter.formatComments(oTicket);
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

      onSaveComment: async function (oEvent) {
        var oModelTicket = this.getModel("Ticket");
        var oTicket = oModelTicket.getData();
        var sValue = oEvent.getParameter("value");

        var oData = {
          comments: sValue.trimStart().trimEnd(),
        };

        if (!(await this.serviceNow.postComments(this, oData, oTicket.sys_id))) {
          MessageToast.show(this.getResourceBundle().getText("msgCommentPostFailure"));
          return;
        }

        MessageToast.show(this.getResourceBundle().getText("msgCommentPostSuccess"));
        var oTicket = await this.serviceNow.getTickets(this, "0", "number=" + oTicket.number);
        oModelTicket.setProperty("/commentResults", formatter.formatComments(oTicket));
      },

      onRemoveContact: async function (oEvent) {
        var oModelTicket = this.getModel("Ticket");
        var oTicket = oModelTicket.getData();
        var sValue = oEvent.getParameter("value");

        var oData = {
          comments:
            "Commento generato da BTP: utente eliminato, le comunicazioni vanno inviate al contatto del fornitore generico",
        };

        if (!(await this.serviceNow.postComments(this, oData, oTicket.sys_id))) {
          MessageToast.show(this.getResourceBundle().getText("msgCommentPostFailure"));
          return;
        }

        MessageToast.show(this.getResourceBundle().getText("msgCommentPostSuccess"));
        var oTicket = await this.serviceNow.getTickets(this, "0", "number=" + oTicket.number);
        oModelTicket.setProperty("/commentResults", formatter.formatComments(oTicket));
      },
    });
  }
);
