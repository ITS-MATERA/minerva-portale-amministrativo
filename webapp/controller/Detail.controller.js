sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"],
  function (BaseController, JSONModel, MessageBox) {
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

      onSend: function () {
        MessageBox.success(this.getResourceBundle().getText("msgTicketSended"), {
          onClose: function () {
            this.getRouter().navTo("RouteHome");
          }.bind(this),
        });
      },
    });
  }
);
