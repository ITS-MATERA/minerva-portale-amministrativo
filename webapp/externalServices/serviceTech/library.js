sap.ui.define(["sap/ui/base/ManagedObject", "sap/ui/core/BusyIndicator"], function (ManagedObject, BusyIndicator) {
  "use strict";

  return ManagedObject.extend("portaleamministrativo.externalServices.serviceTech.library", {
    getTickets: function (self, sSkip) {
      return;
      var sMethod = "odata/v4/log/Ticket?$top=200&$skip=" + sSkip + "&$expand=allegato,stato_ticket";

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
            reject(error);
          });
      });
    },

    getTicket: function (self, sId) {
      var sMethod = "odata/v4/log/Ticket(" + sId + ")?$expand=allegato,stato_ticket";

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
            resolve(response);
          })
          .fail(function (error) {
            BusyIndicator.hide();
            reject([]);
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
          });
      });
    },

    uploadFile: function (self, sTicketId, oFile) {
      var that = this;
      var reader = new FileReader();

      reader.onload = function (event) {
        var sBase64 = event.target.result.split(",")[1];
        var oPayload = {
          File_Name: oFile.name,
          Documento: sBase64,
          ticket_ID: sTicketId,
        };
        var settings = {
          url: that._getUrl(self, "odata/v4/log/Allegati"),
          method: "POST",
          timeout: 0,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          processData: false,
          data: JSON.stringify(oPayload),
        };
        return new Promise(async function (resolve, reject) {
          $.ajax(settings)
            .done(function (response) {
              resolve(true);
            })
            .fail(function (error) {
              reject(false);
            });
        });
      };
      reader.readAsDataURL(oFile);
    },

    _resolveTicket: function (oTicket) {
      // var oDate = new sap.ui.model.type.Date({
      //   pattern: "yyyy/MM/dd"
      // });

      // var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
      //   format: "yyyyMMdd"
      // });
      // oDateFormat.format(UI5Date.getInstance());

      return {
        // "ID": "",
        Codice_BP: oTicket.account,
        Cognome: oTicket.contact_surname,
        Nome: oTicket.contact_name,
        Email: oTicket.contact,
        Telefono: null,
        Classificazione: null,
        Dettaglio: null,
        Descrizione_Problema: oTicket.description,
        Data_Apertura: oTicket.dataStart ? oTicket.dataStart : null,
        Data_Chiusura: oTicket.dataEnd ? oTicket.dataEnd : null,
        stato_ticket_ID: 1,
      };
    },

    send: function (self, oTicket) {
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
            resolve(response);
          })
          .fail(function (error) {
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
