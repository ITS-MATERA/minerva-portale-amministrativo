sap.ui.define(["sap/ui/base/ManagedObject", "sap/ui/core/BusyIndicator"], function (ManagedObject, BusyIndicator) {
  "use strict";

  return ManagedObject.extend("portaleamministrativo.externalServices.serviceNow.library", {
    getTicketsList: function (self) {
      // this.getAuthToken(self);
      // return;

      var settings = {
        url: this.getUrl(self, "api/sn_customerservice/case/btp_fornitori_get?sysparm_limit=200"),
        method: "GET",
        timeout: 0,
        headers: {
          //Accept: "application/json",
          "Content-Type": "application/json",
          //"Authorization": "Bearer akvCUJ3zWZ0EXn6ndLOSwM55J6XWa0rciiAgniDTrrkP7ssGK228xxLnfB9p3-CgK8DOyV5ciGzs_Q9-gXo5FA"
        },
      };
      console.log(settings);
      BusyIndicator.show(0);
      $.ajax(settings).done(function (response) {
        BusyIndicator.hide();
        console.log(response);
      });
    },

    // getAuthToken: function (self) {
    //   var settings = {
    //     url: this.getUrl(self, "oauth_token.do"),
    //     method: "POST",
    //     timeout: 0,
    //     headers: {
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     data: {
    //       grant_type: "password",
    //       client_id: "dd392b0e26f706107706589fbb6b2ba0",
    //       client_secret: "3gh5#g#!Vs",
    //       username: "btp_user",
    //       password: "pIruztPKl[a=jFt){qf*exQQ*1!q_fq[u(KI2le5{>q&BoJVn6-n6H;KpFd-O+X^-?v039T-4Ho.9yG14zF&PLr<X+Gb]Y",
    //     },
    //   };
    //   console.log(settings);
    //   BusyIndicator.show(0);
    //   $.ajax(settings).done(function (response) {
    //     BusyIndicator.hide();
    //     console.log(response);
    //   });
    // },

    getUrl: function (self, sMethod) {
      var sAppId = self.getOwnerComponent().getMetadata().getManifest()["sap.app"].id;
      var sUrl;
      var sLocation = window.location;
      var sBaseUrl = sLocation.href;
      var sUrl = jQuery.sap.getModulePath(sAppId + "/service-now");
      var flpDestinationurl = jQuery.sap.getModulePath(sAppId + "/service-now" + "/");
      //var sServiceUrl = jQuery.sap.getModulePath(applicationId) + "/go2doc/v2/setDocument"; //byfra
      //return "https://fstechdev.service-now.com/api/sn_customerservice/case/btp_fornitori_get";
      if (sBaseUrl.includes("workspaces-ws-")) {
        sUrl = sUrl + "/" + sMethod;
        return sUrl;
      }

      // if (sBaseUrl.includes("cp.portal/ui5appruntime.html")) {
      //   sUrl = sLocation.protocol + "//" + sLocation.hostname + sFlpDestinationurl + "/" + sMethod;
      //   return sUrl;
      // }

      sUrl = sLocation.protocol + "//" + sLocation.hostname + sLocation.pathname;
      sUrl = sUrl.replace("index.html", "");
      sUrl = sUrl + "service-now" + "/" + sMethod;
      return sUrl;
    },
  });
});
