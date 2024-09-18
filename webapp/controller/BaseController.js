sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "portaleamministrativo/model/constants",
    "portaleamministrativo/model/formatter",
  ],
  function (Controller, BusyIndicator, MessageBox, Fragment, constants, formatter) {
    "use strict";

    return Controller.extend("portaleamministrativo.controller.BaseController", {
      formatter: formatter,
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

      loadFragment: function (sViewName) {
        var self = this;
        var oView = this.getView();

        var oFragment = Fragment.load({
          id: oView.getId(),
          name: sViewName,
          controller: this,
        }).then(function (oFragment) {
          oFragment.setModel(self.getModel("i18n"), "i18n");
          oView.addDependent(oFragment);
          return oFragment;
        });

        return oFragment;
      },

      copyWithoutRef: function (oArray) {
        function json_deserialize_helper(key, value) {
          if (typeof value === "string") {
            var regexp;
            regexp = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.exec(value);
            if (regexp) {
              return new Date(value);
            }
          }
          return value;
        }

        return JSON.parse(JSON.stringify(oArray), json_deserialize_helper);
      },

      getSupplier: async function (sCodiceBP) {
        var oSupplier = await this.getEntity(
          "/GeneralDataSet",
          "ZMDG_ADMIN_PORTAL_SRV",
          { ID: sCodiceBP },
          {},
          true,
          "BankDetailSet,CompanyDataSet"
        );

        return oSupplier.data;
      },

      // fnGetEntitySet: async function (sService, sEntity, oExpand = {}, aFilter = [], nSkip = 0, nTop = 0) {
      //   var self = this,
      //     oModel = sService === "" ? self.getModel() : self.getModel(sService),
      //     oBind = oModel
      //       .bindList("/" + sEntity, null, [], [], {
      //         $expand: self._fnSetExpandObj(oExpand),
      //       })
      //       .filter(aFilter),
      //     oContext = await oBind.requestContexts(nSkip, nTop);
      //   return oContext.map((x) => x.getObject());
      // },

      // fnObjHasProperty: function (oElement) {
      //   if (typeof oElement === "object") for (var el in oElement) if (oElement.hasOwnProperty(el)) return true;
      //   return false;
      // },
      // _fnSetExpandObj: function (oExpand) {
      //   var self = this,
      //     oNewExpand = {};
      //   for (var el in oExpand) {
      //     if (oExpand.hasOwnProperty(el)) {
      //       if (self.fnObjHasProperty(oExpand[el])) oNewExpand[el] = { $expand: self._fnSetExpandObj(oExpand[el]) };
      //       else oNewExpand[el] = {};
      //     }
      //   }
      //   return oNewExpand;
      // },
    });
  }
);
