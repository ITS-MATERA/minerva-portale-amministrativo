sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "portaleamministrativo/externalServices/serviceNow/library",
  ],
  function (BaseController, JSONModel, MessageBox, serviceNow) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.Detail", {
      serviceNow: new serviceNow(),
      onInit: function () {
        this.getRouter().getRoute("Detail").attachPatternMatched(this._onObjectMatched, this);

        var oModelSelect = {
          ItilClassification: [{ Key: "SERVICE REQUEST", Text: "SERVICE REQUEST" }],
          Conduction: [{ Key: "Tecnica", Text: "Tecnica" }],
          Environment: [{ Key: "Produzione", Text: "Produzione" }],
          RequestType: [{ Key: "Supporto specialistisco", Text: "Supporto specialistisco" }],
          Type: [{ Key: "ASSISTENZA SW", Text: "ASSISTENZA SW" }],
          Application: [
            { Key: "MALF-POR", Text: "Malfunzionamento Portale" },
            { Key: "RICH-INF", Text: "Richiesta di informazioni su Ordine di Pagamento" },
            { Key: "CERT-UNI", Text: "Certificazione unica" },
            { Key: "ALTRO", Text: "Altro non specificato in elenco" },
            { Key: "FATT-BLO", Text: "Fattura bloccata al pagamento" },
            { Key: "ENTR-MER", Text: "Entrata Merci non presente al portale" },
            { Key: "QUES-NAT", Text: "Quesito di natura contrattuale/negoziale" },
          ],
        };

        this.setModel(new JSONModel(oModelSelect), "Select");
      },

      _onObjectMatched: async function (oEvent) {
        var oArguments = oEvent.getParameter("arguments");

        this.setModel(
          new JSONModel({
            Edit: oArguments.Number ? false : true,
          }),
          "Item"
        );

        if (!oArguments.Number) {
          return;
        }

        var oTicket = await this.serviceNow.getTickets(this, "0", "number=" + oArguments.Number);

        console.log(oTicket);
      },

      onBack: function () {
        this.getRouter().navTo("Home");
      },

      onSend: function () {
        MessageBox.success(this.getResourceBundle().getText("msgTicketSended"), {
          onClose: function () {
            this.getRouter().navTo("Home");
          }.bind(this),
        });
      },

      onApplicationChange: function (oEvent) {
        var sKey = oEvent.getParameter("selectedItem").getProperty("key");

        if (sKey === "FATT-BLO" || sKey === "ENTR-MER" || sKey === "QUES-NAT") {
          MessageBox.warning(this.getResourceBundle().getText("msgContactContracualReferent"));
        }
      },
    });
  }
);
