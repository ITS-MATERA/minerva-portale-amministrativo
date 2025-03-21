sap.ui.define(["sap/ui/base/ManagedObject", "sap/ui/core/BusyIndicator"], function (ManagedObject, BusyIndicator) {
  "use strict";

  return ManagedObject.extend("portaleamministrativo.externalServices.serviceNow.library", {
    getTickets: function (self, sOffset = "0", sQuery) {
      var sMethod = `api/sn_customerservice/case/btp_fornitori_get?sysparm_offset=${sOffset}&sysparm_limit=200`;

      if (sQuery) {
        sMethod = `${sMethod}&sysparm_query=${sQuery}`;
      }

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
            const headers = header.getAllResponseHeaders();
            const totalCountMatch = headers.match(/x-total-count:\s*(\d+)/i);
            const totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : 0;
            resolve({
              results: response.result,
              count: totalCount,
            });
          })
          .fail(function (error) {
            BusyIndicator.hide();
            reject(error);
          });
      });
    },

    downloadFile: function (self, sFileId, sFileName) {
      var sMethod = "sys_attachment.do?sys_id=" + sFileId;

      var oA = document.createElement("a");

      oA.href = this._getUrl(self, sMethod);
      oA.download = sFileName;

      document.body.appendChild(oA);
      oA.click();
      document.body.removeChild(oA);
    },

    uploadFile: function (self, sTicketId, oFile) {
      var oForm = new FormData();

      oForm.append("table_name", "x_fsts2_btp_fornit_btp_fornitori_case");
      oForm.append("table_sys_id", sTicketId);
      oForm.append("uploadFile", oFile, oFile.name);

      var settings = {
        url: this._getUrl(self, "api/now/attachment/upload"),
        method: "POST",
        timeout: 0,
        headers: {
          Accept: "application/json",
        },
        processData: false,
        mimeType: "multipart/oForm-data",
        contentType: false,
        data: oForm,
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
    },

    send: function (self, oTicket) {
      var sMethod = "api/sn_customerservice/case/btp_fornitori_post";
      var oSettings = {
        url: this._getUrl(self, sMethod),
        method: "POST",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(oTicket),
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

    postComments: function (self, oData, id) {
      var sMethod = "api/sn_customerservice/case/btp_fornitori_put/" + id;
      var oSettings = {
        url: this._getUrl(self, sMethod),
        method: "PUT",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(oData),
      };
      return new Promise(async function (resolve, reject) {
        $.ajax(oSettings)
          .done(function (response) {
            resolve(true);
          })
          .fail(function (error) {
            reject(false);
          });
      });
    },
  });
});
