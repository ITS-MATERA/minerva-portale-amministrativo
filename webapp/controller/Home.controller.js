sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "portaleamministrativo/externalServices/serviceNow/library",
    "portaleamministrativo/externalServices/serviceTech/library",
    "sap/m/library",
    "portaleamministrativo/model/constants",
    "sap/m/MessageBox",
    "portaleamministrativo/util/ticketUtils",
  ],

  function (BaseController, JSONModel, serviceNow, serviceTech, sapMLib, constants, MessageBox, ticketUtils) {
    "use strict";

    const { Text, Button, DialogType, Dialog } = sapMLib;

    return BaseController.extend("portaleamministrativo.controller.Home", {
      serviceNow: new serviceNow(),
      serviceTech: new serviceTech(),

      onInit: async function () {
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
        var oUser = await this.getModel("user");
        var oModelFilters = this.getModel("TicketFilters");

        this.sBp = oUser?.getData()?.bp ?? "";

        if (this.sBp) {
          this.byId("iptHomeAccount").setEnabled(false);
          oModelFilters.setProperty("/Account", this.sBp);
        }

        try {
          this._sQuery = ticketUtils.getQuery(oModelFilters.getData());

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
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.responseText);
        }
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
        try {
          var oModelTickets = this.getModel("TicketsFunz");
          var oTickets = await this.serviceNow.getTickets(this, oModelTickets.getProperty("/Skip"), this._sQuery);

          oModelTickets.setProperty("/List", oTickets.results);
          oModelTickets.setProperty("/Records", oTickets.count);
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.responseText);
        }
      },

      onPaginatorTechChange: async function () {
        try {
          var oModelTickets = this.getModel("TicketsTech");
          var oTickets = await this.serviceTech.getTickets(this, oModelTickets.getProperty("/Skip"));

          oModelTickets.setProperty("/List", oTickets.results);
          oModelTickets.setProperty("/Records", await this.serviceTech.getCount(this));
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.responseText);
        }
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
        try {
          var oModelTickets = this.getModel("TicketsFunz");
          var oFilters = this.getModel("TicketFilters").getData();

          this._sQuery = ticketUtils.getQuery(oFilters);

          var oTickets = await this.serviceNow.getTickets(this, "0", this._sQuery);

          oModelTickets.setProperty("/List", oTickets.results);
          oModelTickets.setProperty("/Records", oTickets.count);
          oModelTickets.setProperty("/Skip", 0);
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.responseText);
        }
      },

      onRefresh: async function () {
        try {
          var oModelTickets = this.getModel("TicketsFunz");
          var oModelFilters = this.getModel("TicketFilters");

          oModelFilters.setProperty("/Account", this.sBp);
          oModelFilters.setProperty("/Contact", "");
          oModelFilters.setProperty("/Number", "");
          oModelFilters.setProperty("/Priority", "");
          oModelFilters.setProperty("/State", "");

          this._sQuery = ticketUtils.getQuery(oModelFilters.getData());

          var oTickets = await this.serviceNow.getTickets(this, "0", this._sQuery);

          oModelTickets.setProperty("/List", oTickets.results);
          oModelTickets.setProperty("/Records", oTickets.count);
          oModelTickets.setProperty("/Skip", 0);
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.responseText);
        }
      },
    });
  }
);
