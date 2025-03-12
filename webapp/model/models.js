sap.ui.define(
  ["sap/ui/model/json/JSONModel", "sap/ui/Device", "portaleamministrativo/util/generalUtils"],
  function (JSONModel, Device, generalUtils) {
    "use strict";

    return {
      /**
       * Provides runtime info for the device the UI5 app is running on as JSONModel
       */
      createDeviceModel: function () {
        var oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
      },

      createUserModel: async function (self) {
        var sUrl = window.location.href;

        if (!sUrl.includes("workspaces-ws-")) {
          const sUrl = generalUtils.getDestinationUrl("user-api", "currentUser");

          try {
            var oResponse = await fetch(sUrl);
            var oUser = await oResponse.json();
            var sLoginName = await this.getLoginName(self, oUser.email);

            // if (!sLoginName) {
            //   throw new Error("Utente non profilato");
            // }

            oUser = { ...oUser, bp: sLoginName };
            return new JSONModel(oUser);
          } catch (error) {
            // sap.m.MessageBox.error("Utente non profilato");
          }
        }
      },

      getLoginName: async function (self, sEmail) {
        var sUrl = window.location.href;

        if (!sUrl.includes("workspaces-ws-")) {
          const sUrl = generalUtils.getDestinationUrl("cis-manager", `ias/v1/getLoginName(email='${sEmail}')`);

          try {
            var oResponse = await fetch(sUrl);
            oResponse = await oResponse.json();
          } catch (error) {
            console.log(error);
          }

          return oResponse?.value;
        }
      },
    };
  }
);
