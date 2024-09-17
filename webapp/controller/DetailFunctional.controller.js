sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "portaleamministrativo/externalServices/serviceNow/library",
    "portaleamministrativo/model/constants",
    "portaleamministrativo/model/formatter",
    "sap/ui/core/BusyIndicator",
    "sap/m/library",
    "sap/ui/core/Element",
  ],
  function (BaseController, JSONModel, serviceNow, constants, formatter, BusyIndicator, sapMLib, Element) {
    "use strict";

    const { TextArea, Button, DialogType, Dialog, ButtonType, MessageToast, MessageBox } = sapMLib;

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
        var oArguments = oEvent.getParameter("arguments");

        this.setModel(new JSONModel(this.initTicket()), "Ticket");
        this.setModel(new JSONModel({}), "Supplier");
        this.getModel("Ticket").setProperty("/config/edit", oArguments.Number ? false : true);

        this._sNumber = oArguments.Number;
        if (!this._sNumber) {
          return;
        }

        //Recupero i dati del Ticket
        var oTicket = await this.serviceNow.getTickets(this, "0", "number=" + this._sNumber);
        oTicket.results[0].attachments = formatter.formatAttachments(oTicket);
        oTicket.results[0].commentResults = formatter.formatComments(oTicket);
        this.setModel(new JSONModel(oTicket.results[0]), "Ticket");

        console.log(oTicket.results[0]);

        //Recupero i dati dell'utente
        if (oTicket?.results[0]?.accountId) {
          this.setModel(new JSONModel(await this.getSupplier(oTicket.results[0]?.accountId)), "Supplier");
        }
      },

      onBack: function () {
        this.getRouter().navTo("Home");
      },

      onSend: async function () {
        var oTicket = this.getModel("Ticket").getData();

        console.log(oTicket);

        //Caricamento allegati
        BusyIndicator.show(0);
        await Promise.all(
          oTicket.attachments?.map(
            async function (x) {
              if (!x.file_id) {
                this.serviceNow.uploadFile(this, oTicket.sys_id, x.file);
              }
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

      onRemoveContact: async function () {
        var oModelTicket = this.getModel("Ticket");
        var oTicket = oModelTicket.getData();

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

      onReopenTicket: async function () {
        this._oDialogTextArea = new Dialog({
          title: this.getResourceBundle().getText("labelMessage"),
          type: DialogType.Message,
          content: [
            new TextArea("textArea", {
              width: "100%",
              cols: 100,
              rows: 4,
              value: null,
            }),
          ],
          beginButton: new Button({
            type: ButtonType.Emphasized,
            text: this.getResourceBundle().getText("labelSave"),
            press: async function () {
              var oModelTicket = this.getModel("Ticket");
              var oTicket = oModelTicket.getData();
              var sValue = Element.getElementById("textArea").getValue();

              this._oDialogTextArea.destroy();
              this._oDialogTextArea = undefined;

              var oData = { comments: "" };

              oData.comments = this.getResourceBundle().getText("msgReopenTicket");

              await this.serviceNow.postComments(this, oData, oTicket.sys_id).then(
                async function (response) {
                  //Ridefinisco oTicket perchè non me lo vedo, non so il perchè :-(
                  var oTicket = oModelTicket.getData();

                  if (!response) {
                    MessageToast.show(this.getResourceBundle().getText("msgCommentPostFailure"));
                    return;
                  }
                  oData.comments = sValue;

                  await this.serviceNow.postComments(this, oData, oTicket.sys_id);

                  MessageToast.show(this.getResourceBundle().getText("msgCommentPostSuccess"));
                  var oTicket = await this.serviceNow.getTickets(this, "0", "number=" + oTicket.number);
                  oModelTicket.setProperty("/commentResults", formatter.formatComments(oTicket));
                }.bind(this)
              );
            }.bind(this),
          }),
          endButton: new Button({
            text: this.getResourceBundle().getText("labelClose"),
            press: function () {
              this._oDialogTextArea.destroy();
              this._oDialogTextArea = undefined;
            }.bind(this),
          }),
        });

        this._oDialogTextArea.open();
      },
    });
  }
);
