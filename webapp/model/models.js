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
      var oUser, oResponse;
      var sUrl = window.location.href;

      if (!sUrl.includes("workspaces-ws-")) {
        sUrl = sUrl.split("/index.html")[0];

        var sUrlCurrentUser = sUrl + "/user-api/currentUser";

        try {
          oResponse = await fetch(sUrlCurrentUser);
          oUser = await oResponse.json();
        } catch (error) {
          console.log(error);
        }

        return new JSONModel(oUser);
      }
    },
  };
});
