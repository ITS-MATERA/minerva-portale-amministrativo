sap.ui.define(["sap/ui/base/ManagedObject", "sap/ui/core/BusyIndicator"], function (ManagedObject, BusyIndicator) {
  "use strict";

  return ManagedObject.extend("portaleamministrativo.externalServices.serviceTech.library", {
    getTickets: function (self, sOffset = "0", sQuery) {
      var sMethod = "odata/v4/log/Ticket?$expand=stato_ticket";

      var oSettings = {
        url: this._getUrl(self, sMethod),
        method: "GET",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
        },
      };

      BusyIndicator.show(0);
      return new Promise(async function (resolve, reject) {
        $.ajax(oSettings)
          .done(function (response, status, header) {
            BusyIndicator.hide();
            resolve({
              results: response.value,
            });
          })
          .fail(function (error) {
            BusyIndicator.hide();
            reject([]);
            console.log(error);
          });
      });
    },

    getCount: function (self) {
      var sMethod = "odata/v4/log/Ticket_Count";

      var oSettings = {
        url: this._getUrl(self, sMethod),
        method: "GET",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
        },
      };

      BusyIndicator.show(0);
      return new Promise(async function (resolve, reject) {
        $.ajax(oSettings)
          .done(function (response, status, header) {
            BusyIndicator.hide();
            resolve(response.value[0]?.Totale_Ticket);
          })
          .fail(function (error) {
            BusyIndicator.hide();
            reject(null);
            console.log(error);
          });
      });
    },

    _resolveTicket: function(oTicket) {
      return {
        // "ID": "",
        "Codice_BP": oTicket.account,
        "Cognome": oTicket.contact_surname,
        "Nome": oTicket.contact_name,
        "Email": oTicket.contact,
        "Telefono": null,
        "Classificazione": null,
        "Dettaglio": null,
        "Descrizione_Problema": oTicket.description,
        "Data_Apertura": null, //new Date(),
        "Data_Chiusura": null, 
        "stato_ticket_ID": 1 
    };
    },

    send: function (self, oTicket) {
      //TODO: implementazione della logica
      var sMethod = "odata/v4/log/Ticket";
      var oTicketResolved = this._resolveTicket(oTicket);
      var oSettings = {
        url: this._getUrl(self, sMethod),
        method: "POST",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(oTicketResolved),
      };
      return new Promise(async function (resolve, reject) {
        $.ajax(oSettings)
          .done(function (response) {
            console.log(response);
            resolve(response);
          })
          .fail(function (error) {
            console.log(error)
            reject(error);
          });
      });
    },

    _getUrl: function (self, sMethod) {
      var sAppId = self.getOwnerComponent().getMetadata().getManifest()["sap.app"].id;
      var sUrl;
      var sLocation = window.location;
      var sBaseUrl = sLocation.href;
      var sUrl = jQuery.sap.getModulePath(sAppId + "/service-tech");
      var sFlpDestinationurl = jQuery.sap.getModulePath(sAppId + "/service-tech" + "/");

      if (sBaseUrl.includes("workspaces-ws-")) {
        sUrl = sUrl + "/" + sMethod;
        return sUrl;
      }

      if (sBaseUrl.includes("cp.portal/ui5appruntime.html")) {
        sUrl = sLocation.protocol + "//" + sLocation.hostname + sFlpDestinationurl + "/" + sMethod;
        return sUrl;
      }

      sUrl = sLocation.protocol + "//" + sLocation.hostname + sLocation.pathname;
      sUrl = sUrl.replace("index.html", "");
      sUrl = sUrl + "service-tech" + "/" + sMethod;
      return sUrl;
    },
  });
});