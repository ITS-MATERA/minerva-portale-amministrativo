sap.ui.define(["sap/ui/base/ManagedObject", "sap/ui/core/BusyIndicator"], function (ManagedObject, BusyIndicator) {
  "use strict";

  return ManagedObject.extend("portaleamministrativo.externalServices.serviceNow.library", {
    getTickets: function (self, sOffset = "0", sQuery) {
      var sMethod = "api/sn_customerservice/case/btp_fornitori_get?sysparm_offset=" + sOffset + "&sysparm_limit=200";

      if (sQuery) {
        sMethod = "api/sn_customerservice/case/btp_fornitori_get?sysparm_query=" + sQuery;
      }

      var oSettings = {
        url: this.getUrl(self, sMethod),
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
            console.log();
            resolve({
              results: response.result,
              count: parseInt(header.getAllResponseHeaders().split("x-total-count: ")[1].split("\r")[0]),
            });
          })
          .fail(function (error) {
            BusyIndicator.hide();
            reject([]);
            console.log(error);
          });
      });
    },

    getUrl: function (self, sMethod) {
      var sAppId = self.getOwnerComponent().getMetadata().getManifest()["sap.app"].id;
      var sUrl;
      var sLocation = window.location;
      var sBaseUrl = sLocation.href;
      var sUrl = jQuery.sap.getModulePath(sAppId + "/service-now");
      var sFlpDestinationurl = jQuery.sap.getModulePath(sAppId + "/service-now" + "/");

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
      sUrl = sUrl + "service-now" + "/" + sMethod;
      return sUrl;
    },

    getAttachment: function (self, sFileId) {
      var sMethod = "api/now/attachment/" + sFileId + "/file";

      var oSettings = {
        url: this.getUrl(self, sMethod),
        method: "GET",
        timeout: 0,
      };

      BusyIndicator.show(0);
      return new Promise(async function (resolve, reject) {
        $.ajax(oSettings)
          .done(function (response, status, header) {
            BusyIndicator.hide();
            console.log(response);
          })
          .fail(function (error) {
            BusyIndicator.hide();
            console.log(error);
          });
      });
    },
  });
});
