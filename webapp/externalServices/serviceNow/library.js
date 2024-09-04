sap.ui.define(["sap/ui/base/ManagedObject", "sap/ui/core/BusyIndicator"], function (ManagedObject, BusyIndicator) {
  "use strict";

  return ManagedObject.extend("portaleamministrativo.externalServices.serviceNow.library", {
    getTicketsList: function (self) {
      this.getAuthToken(self);
      return;

      var settings = {
        url: this.getUrl(self, "api/sn_customerservice/case/btp_fornitori_get?sysparm_limit=200"),
        method: "GET",
        timeout: 0,
        headers: {
          Accept: "application/json",
          Authorization: "",
        },
      };

      BusyIndicator.show(0);
      $.ajax(settings).done(function (response) {
        BusyIndicator.hide();
        console.log(response);
      });
    },

    getAuthToken: function (self) {
      var settings = {
        url: this.getUrl(self, "oauth_token.do"),
        method: "POST",
        timeout: 0,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: {
          grant_type: "password",
          client_id: "dd392b0e26f706107706589fbb6b2ba0",
          client_secret: "3gh5#g#!Vs",
          username: "btp_user",
          password: "pIruztPKl[a=jFt){qf*exQQ*1!q_fq[u(KI2le5{>q&BoJVn6-n6H;KpFd-O+X^-?v039T-4Ho.9yG14zF&PLr<X+Gb]Y",
        },
      };

      BusyIndicator.show(0);
      $.ajax(settings).done(function (response) {
        BusyIndicator.hide();
        console.log(response);
      });
    },

    getUrl: function (self, sMethod) {
      var sAppId = self.getOwnerComponent().getMetadata().getManifest()["sap.app"].id;
      var sUrl;
      var sLocation = window.location;
      var sBaseUrl = sLocation.href;
      var sFlpDestinationurl = jQuery.sap.getModulePath(sAppId + "/service-now");

      if (sBaseUrl.includes("workspaces-ws-")) {
        sUrl = "/service-now" + "/" + sMethod;
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
  });
});
