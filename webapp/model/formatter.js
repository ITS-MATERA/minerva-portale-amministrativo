sap.ui.define([], function () {
  "use strict";

  return {
    formatDate: function (sDate) {
      if (!sDate || sDate === "" || sDate === null) return null;

      var oDate = new Date(sDate);
      if (oDate) {
        var sDay = oDate.getDate().toString(),
          sMonth = (oDate.getMonth() + 1).toString(),
          sYear = oDate.getFullYear().toString();

        if (sDay.length === 1) {
          sDay = "0" + sDay;
        }

        if (sMonth.length === 1) {
          sMonth = "0" + sMonth;
        }

        return sYear + "-" + sMonth + "-" + sDay;
      }
      return null;
    },

    formatStringToDateString: function (sStirng) {
      if (!sStirng) return null;
      var oDate = new Date(sStirng);
      if (oDate) {
        var sDay = oDate.getDate().toString(),
          sMonth = (oDate.getMonth() + 1).toString(),
          sYear = oDate.getFullYear().toString();

        if (sDay.length === 1) {
          sDay = "0" + sDay;
        }

        if (sMonth.length === 1) {
          sMonth = "0" + sMonth;
        }

        return sDay + "." + sMonth + "." + sYear;
      } else return null;
    },

    formatAttachments: function (oTicket) {
      var aAttachments = [];

      oTicket.results[0].attachments?.map((x, index) => {
        aAttachments.push({
          id: index,
          file_id: x.file_id,
          file_name: x.file_name,
          file_url: x.file_url,
          file_uploader: null,
          new: false,
        });
      });

      return aAttachments;
    },

    formatComments: function (oTicket) {
      var results = [];
      var array = oTicket.results[0].comments.split("\n\n");
      array?.map((x) => {
        if (x && x !== "") {
          results.push({
            Comment: x,
          });
        }
      });

      return results;
    },
  };
});
