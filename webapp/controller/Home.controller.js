sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("portaleamministrativo.controller.Home", {
    onInit: function () {
      this.setModel(
        new JSONModel([
          {
            Column1: "Test",
          },
        ]),
        "Items"
      );
    },

    onDetail: function () {
      this.getRouter().navTo("Detail", { Id: 1 });
    },

    onNewTicket: function () {
      this.getRouter().navTo("Detail");
    },
  });
});
