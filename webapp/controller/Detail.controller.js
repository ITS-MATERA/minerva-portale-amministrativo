sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"],
  function (BaseController, JSONModel, MessageBox) {
    "use strict";

    return BaseController.extend("portaleamministrativo.controller.Detail", {
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

      onApplicationChange: function (oEvent) {
        var sKey = oEvent.getParameter("selectedItem").getProperty("key");

        if (sKey === "FATT-BLO" || sKey === "ENTR-MER" || sKey === "QUES-NAT") {
          MessageBox.warning(this.getResourceBundle().getText("msgContactContracualReferent"));
        }
      },
    });
  }
);
