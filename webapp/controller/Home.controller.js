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
        var oBundle = this.getResourceBundle();
        this._sQuery = "";

        var oModelSelect = {
          Priorities: [
            { Key: "", Text: "" },
            { Key: "4", Text: oBundle.getText("labelPriorityLow") },
            { Key: "3", Text: oBundle.getText("labelPriorityNormal") },
            { Key: "2", Text: oBundle.getText("labelPriorityHigh") },
            { Key: "1", Text: oBundle.getText("labelPriorityCritical") },
          ],
          State: [
            { Key: "", Text: "" },
            { Key: "1", Text: oBundle.getText("labelNew") },
            { Key: "10", Text: oBundle.getText("labelOpen") },
            { Key: "18", Text: oBundle.getText("labelAwaitingInfo") },
            { Key: "6", Text: oBundle.getText("labelResolved") },
            { Key: "3", Text: oBundle.getText("labelClosed") },
          ],
        };

        this.setModel(new JSONModel(oModelSelect), "Select");

        var oModelFilters = {
          Account: "",
          Contact: "",
          Number: "",
          Priority: "",
          State: "",
        };

        this.setModel(new JSONModel(oModelFilters), "TicketFilters");

        this.getRouter().getRoute("Home").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: async function (oEvent) {
        var sUrl = window.location.href;

        if (!sUrl.includes("workspaces-ws-")) {
          var oUser = await this.getModel("user");
          console.log(oUser.getData());
        }

        //Gestione Ticket Funzionali
        var oTicketsFunz = await this.serviceNow.getTickets(this, "0", this._sQuery);

        var oModelTickets = {
          Top: 200,
          Skip: 0,
          Records: oTicketsFunz.count,
          List: oTicketsFunz.results,
        };

        this.byId("tblPaginatorFun").setVisible(!!oTicketsFunz.count);

        this.setModel(new JSONModel(oModelTickets), "TicketsFunz");
        console.log("Funzionali:", this.getModel("TicketsFunz").getData().List);

        //Gestione Ticket Tecnici
        var oTicketsTech = await this.serviceTech.getTickets(this, 0);
        var iTicketTechCount = await this.serviceTech.getCount(this);

        var oModelTicketTech = {
          Top: 200,
          Skip: 0,
          Records: iTicketTechCount,
          List: oTicketsTech.results,
        };

        this.byId("tblPaginatorTec").setVisible(!!iTicketTechCount);

        this.setModel(new JSONModel(oModelTicketTech), "TicketsTech");
        console.log("Tecnici:", this.getModel("TicketsTech").getData().List);
      },

      onDetail: function (oEvent) {
        var homeTabBar = this.getView().byId("HomeTabBar");
        if (homeTabBar.getSelectedKey() === constants.TABBAR_TECHNICIAN_KEY) {
          this.getRouter().navTo("DetailTechnician", { Id: oEvent.getSource().data("id") });
        } else {
          this.getRouter().navTo("DetailFunctional", { Number: oEvent.getSource().data("number") });
        }
      },

      onNewTicket: function () {
        this.getRouter().navTo("NewTicket");
      },

      onPaginatorFunzChange: async function () {
        var oModelTickets = this.getModel("TicketsFunz");
        var oTickets = await this.serviceNow.getTickets(this, oModelTickets.getProperty("/Skip"), this._sQuery);

        oModelTickets.setProperty("/List", oTickets.results);
        oModelTickets.setProperty("/Records", oTickets.count);
      },

      onPaginatorTechChange: async function () {
        var oModelTickets = this.getModel("TicketsTech");
        var oTickets = await this.serviceTech.getTickets(this, oModelTickets.getProperty("/Skip"));

        oModelTickets.setProperty("/List", oTickets.results);
        oModelTickets.setProperty("/Records", await this.serviceTech.getCount(this));
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
        var oModelTickets = this.getModel("TicketsFunz");
        var oFilters = this.getModel("TicketFilters").getData();

        var sQuery = "";

        sQuery = oFilters.Number ? sQuery + "number=" + oFilters.Number + "^" : sQuery + "";
        sQuery = oFilters.Account ? sQuery + "account.name=" + oFilters.Account + "^" : sQuery + "";
        sQuery = oFilters.Contact ? sQuery + "contact.name=" + oFilters.Contact + "^" : sQuery + "";
        sQuery = oFilters.Priority ? sQuery + "priority=" + oFilters.Priority + "^" : sQuery + "";
        sQuery = oFilters.State ? sQuery + "state=" + oFilters.State + "^" : sQuery + "";

        this._sQuery = sQuery;

        var oTickets = await this.serviceNow.getTickets(this, "0", this._sQuery);

        oModelTickets.setProperty("/List", oTickets.results);
        oModelTickets.setProperty("/Records", oTickets.count);
        oModelTickets.setProperty("/Skip", 0);
      },

      onRefresh: async function () {
        var oModelTickets = this.getModel("TicketsFunz");
        var oModelFilters = this.getModel("TicketFilters");

        oModelFilters.setProperty("/Account", "");
        oModelFilters.setProperty("/Contact", "");
        oModelFilters.setProperty("/Number", "");
        oModelFilters.setProperty("/Priority", "");
        oModelFilters.setProperty("/State", "");

        this._sQuery = "";

        var oTickets = await this.serviceNow.getTickets(this, "0", this._sQuery);

        oModelTickets.setProperty("/List", oTickets.results);
        oModelTickets.setProperty("/Records", oTickets.count);
        oModelTickets.setProperty("/Skip", 0);
      },
    });
  }
);
