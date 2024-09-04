sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "portaleamministrativo/externalServices/serviceNow/library"],
  function (BaseController, JSONModel, serviceNow) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.Home", {
      serviceNow: new serviceNow(),
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

        var oTickets = {
          Top: 50,
          Skip: 0,
          Records: 100,
        };

        this.setModel(new JSONModel(oTickets), "Tickets");

        this.getRouter().getRoute("Home").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function (oEvent) {
        this.serviceNow.getTicketsList(this);
      },

      onDetail: function () {
        this.getRouter().navTo("Detail", { Id: 1 });
      },

      onNewTicket: function () {
        this.getRouter().navTo("Detail");
      },

      onPaginatorChange: function () {},
    });
  }
);
