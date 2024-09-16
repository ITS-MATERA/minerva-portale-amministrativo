sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "portaleamministrativo/externalServices/serviceNow/library",
    "portaleamministrativo/externalServices/serviceTech/library",
    "sap/m/library",
    "portaleamministrativo/model/constants",
  ],

  function (BaseController, JSONModel, serviceNow, serviceTech, sapMLib, constants) {
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
        //Gestione Ticket Funzionali
        var oTickets = await this.serviceNow.getTickets(this, "0", this._sQuery);

        var oModelTickets = {
          Top: 200,
          Skip: 0,
          Records: oTickets.count,
          List: oTickets.results,
        };

        this.byId("tblPaginatorFun").setVisible(!!oTickets.count);

        this.setModel(new JSONModel(oModelTickets), "Tickets");

        //Gestione Ticket Tecnici
        var oTicketTech = await this.serviceTech.getTickets(this);

        var oModelTicketTech = {
          Top: 200,
          Skip: 0,
          Records: await this.serviceTech.getCount(this),
          List: oTicketTech.results,
        };

        console.log(oTicketTech.results);

        this.setModel(new JSONModel(oModelTicketTech), "TicketsTech");
      },

      onDetail: function (oEvent) {
        var homeTabBar = this.getView().byId("HomeTabBar");
        if (homeTabBar.getSelectedKey() === constants.TABBAR_TECHNICIAN_KEY) {
          this.getRouter().navTo("DetailTechnician", { Number: oEvent.getSource().data("number") });
        } else {
          this.getRouter().navTo("DetailFunctional", { Number: oEvent.getSource().data("number") });
        }
      },

      onNewTicket: function () {
        this.getRouter().navTo("NewTicket");
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
