sap.ui.define([], function () {
  "use strict";

  return {
    getQuery: function (oFilters) {
      var sQuery = "";

      sQuery = oFilters.Number ? sQuery + "number=" + oFilters.Number + "^" : sQuery + "";
      sQuery = oFilters.Account ? sQuery + "account.registration_code=" + oFilters.Account + "^" : sQuery + "";
      sQuery = oFilters.Contact ? sQuery + "contact.name=" + oFilters.Contact + "^" : sQuery + "";
      sQuery = oFilters.Priority ? sQuery + "priority=" + oFilters.Priority + "^" : sQuery + "";
      sQuery = oFilters.State ? sQuery + "state=" + oFilters.State + "^" : sQuery + "";

      return sQuery;
    },
  };
});
