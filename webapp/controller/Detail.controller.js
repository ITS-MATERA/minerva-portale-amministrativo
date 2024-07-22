sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("portaleamministrativo.controller.Detail", {
    onInit: function () {
      this.getRouter().getRoute("Detail").attachPatternMatched(this._onObjectMatched, this);
    },

    _onObjectMatched: function (oEvent) {
      var oArguments = oEvent.getParameter("arguments");

      this.setModel(
        new JSONModel({
          Edit: oArguments.Id ? false : true,
        }),
        "Item"
      );
    },

    onBack: function () {
      this.getRouter().navTo("RouteHome");
    },
  });
});
