sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "portaleamministrativo/externalServices/serviceNow/library",
    "portaleamministrativo/externalServices/serviceTech/library",
    "sap/m/library",
  ],

  function (BaseController, JSONModel, serviceNow, serviceTech, sapMLib) {
    "use strict";

    const { Text, Button, DialogType, Dialog } = sapMLib;

    return BaseController.extend("portaleamministrativo.controller.Home", {
      serviceNow: new serviceNow(),
      serviceTech: new serviceTech(),

      onInit: function () {
        this._sQuery = "";

        var oModelFilters = {
          Account: "",
          Contact: "",
          Number: "",
        };

        this.setModel(new JSONModel(oModelFilters), "TicketFilters");

        this.getRouter().getRoute("Home").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: async function (oEvent) {
        var oTickets = await this.serviceNow.getTickets(this, "0", this._sQuery);

        var oModelTickets = {
          Top: 200,
          Skip: 0,
          Records: oTickets.count,
          List: oTickets.results,
        };

        this.byId("paginator").setVisible(!!oTickets.count);

        this.setModel(new JSONModel(oModelTickets), "Tickets");

        await this.serviceTech.getTickets(this);
      },

      onDetail: function (oEvent) {
        this.getRouter().navTo("Detail", { Number: oEvent.getSource().data("number") });
      },

      onNewTicket: function () {
        this.getRouter().navTo("Detail");
      },

      onPaginatorChange: async function () {
        var oModelTickets = this.getModel("Tickets");
        var oTickets = await this.serviceNow.getTickets(this, oModelTickets.getProperty("/Skip"), this._sQuery);

        console.log(oTickets.results);

        oModelTickets.setProperty("/List", oTickets.results);
        oModelTickets.setProperty("/Records", oTickets.count);
      },

      onComments: function (oEvent) {
        this._oDialogComments = new Dialog({
          title: this.getResourceBundle().getText("labelComments"),
          type: DialogType.Message,
          content: [
            new Text("text", {
              text: oEvent.getSource().data("comments"),
            }),
          ],
          endButton: new Button({
            text: this.getResourceBundle().getText("labelClose"),
            press: function () {
              this._oDialogComments.destroy();
              this._oDialogComments = undefined;
            }.bind(this),
          }),
        });

        this._oDialogComments.open();
      },

      onStart: async function () {
        var oModelTickets = this.getModel("Tickets");
        var oFilters = this.getModel("TicketFilters").getData();

        var sQuery = "";

        sQuery = oFilters.Number ? sQuery + "number=" + oFilters.Number + "^" : sQuery + "";
        sQuery = oFilters.Account ? sQuery + "account.name=" + oFilters.Account + "^" : sQuery + "";
        sQuery = oFilters.Contact ? sQuery + "contact.name=" + oFilters.Contact + "^" : sQuery + "";

        this._sQuery = sQuery;

        var oTickets = await this.serviceNow.getTickets(this, "0", this._sQuery);

        oModelTickets.setProperty("/List", oTickets.results);
        oModelTickets.setProperty("/Records", oTickets.count);
        oModelTickets.setProperty("/Skip", 0);
      },
    });
  }
);
