sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/Priority"],
  function (BaseController, JSONModel, Priority) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.Home", {
      onInit: function () {
        this.setModel(
          new JSONModel([
            {
              Ticket: "HDFS_579147",
              Object: "Ceritificazione unica",
              State: "Chiuso",
              CreationDate: new Date(),
              ClosingDate: new Date(),
              Priority: "Alta",
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
  }
);
