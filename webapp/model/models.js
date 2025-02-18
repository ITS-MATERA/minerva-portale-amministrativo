sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function (JSONModel, Device) {
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

    createUserModel: async function () {
      var sUrl = window.location.href;

      if (!sUrl.includes("workspaces-ws-")) {
        sUrl = sUrl.split("/index.html")[0];

        var sUrlCurrentUser = sUrl + "/user-api/currentUser";

        try {
          var oResponse = await fetch(sUrlCurrentUser);
          var oUser = await oResponse.json();
          var sLoginName = await this.getLoginName(oUser.email).catch((error) => {
            console.log("dentro", error);
            throw new Error(error);
          });

          if (!sLoginName) {
            throw new Error("Utente non profilato");
          }

          oUser = { ...oUser, bp: sLoginName };
          return new JSONModel(oUser);
        } catch (error) {
          sap.m.MessageBox.error("Utente non profilato");
        }
      }
    },

    getLoginName: async function (sEmail) {
      var sUrl = window.location.href;

      if (!sUrl.includes("workspaces-ws-")) {
        sUrl = sUrl.split("/index.html")[0];
        sUrl = `${sUrl}/cis-manager/ias/v1/getLoginName(email='${sEmail}')`;

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
});
