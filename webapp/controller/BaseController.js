sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/BusyIndicator", "sap/m/MessageBox"],
  function (Controller, BusyIndicator, MessageBox) {
    "use strict";

    return Controller.extend("portaleamministrativo.controller.BaseController", {
      getRouter: function () {
        return sap.ui.core.UIComponent.getRouterFor(this);
      },

      /**
       * @param {string} [sName] optional parameter
       */
      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      setModel: function (oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      /**
       * @return {sap.ui.model.resource.ResourceModel}
       */
      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      /**
       * @param {string} sPath parameter
       * @param {object} oKey parameter
       * @param {object} [oUrlParameters] optional parameter
       * @param {boolean} [bPrint] optional parameter
       * @param {string} [sExpand] optional parameter
       */
      getEntity: async function (sPath, sModel, oKey, oUrlParameters = {}, bPrint = true, sExpand = "") {
        var sKey;
        var self = this;
        var oDataModel = this.getModel(sModel);

        if (oKey) {
          sKey = oDataModel.createKey(sPath, oKey);
        } else {
          sKey = sPath;
        }

        oUrlParameters["$expand"] = sExpand;

        BusyIndicator.show(0);
        return new Promise(async function (resolve, reject) {
          await oDataModel.read(sKey, {
            urlParameters: oUrlParameters,
            success: function (data, oResponse) {
              BusyIndicator.hide();
              var oMessage = self.handlerHeaderMessage(oResponse, bPrint);
              resolve({
                success: true,
                data: data,
                message: oMessage,
              });
            },
            error: function (error) {
              BusyIndicator.hide();
              reject(error);
              resolve({
                success: false,
                data: null,
                message: null,
              });
              self.handlerError();
            },
          });
        });
      },

      /**
       * Gestione eccezioni
       */
      handlerError: function () {
        var oMessageManager = sap.ui.getCore().getMessageManager();
        var oMessageModel = oMessageManager.getMessageModel();

        this._bMessageOpen = false;

        this.oMessageModelBinding = oMessageModel.bindList(
          "/",
          undefined,
          [],
          new Filter("technical", FilterOperator.EQ, true)
        );

        this.oMessageModelBinding.attachChange(function (oEvent) {
          var aContexts = oEvent.getSource().getContexts(),
            aMessages = [];

          if (this._bMessageOpen || !aContexts.length) {
            return;
          }

          // Extract and remove the technical messages
          aContexts.forEach(function (oContext) {
            aMessages.push(oContext.getObject());
          });
          oMessageManager.removeMessages(aMessages);

          MessageBox.error(aMessages[0].message, {
            actions: [MessageBox.Action.CLOSE],
            onClose: function () {
              this._bMessageOpen = false;
            }.bind(this),
          });
        }, this);
      },

      /**
       * Gestione messaggi contenuti nella testata, lato BE nel Message Container
       */
      handlerHeaderMessage: function (oResponse, bPrint = true) {
        if (!oResponse?.headers["sap-message"]) {
          return null;
        }
        var oMessage = JSON.parse(oResponse.headers["sap-message"]);

        switch (oMessage.severity) {
          case "error":
            if (bPrint) {
              MessageBox.error(oMessage.message);
            }
            break;
          case "success":
            if (bPrint) {
              MessageBox.success(oMessage.message);
            }
            break;
          case "warning":
            if (bPrint) {
              MessageBox.warning(oMessage.message);
            }
            break;
          case "info":
            if (bPrint) {
              MessageBox.warning(oMessage.message);
            }
            break;
        }

        return { severity: oMessage.severity, message: oMessage.message };
      },
    });
  }
);
