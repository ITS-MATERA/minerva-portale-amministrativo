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
  };
});
