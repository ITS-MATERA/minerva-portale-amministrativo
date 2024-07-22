sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("portaleamministrativo.controller.BaseController", {
    getRouter: function () {
      return sap.ui.core.UIComponent.getRouterFor(this);
    },

    /**
     * @param {string} [sName] optional parameter
     */
    getModel: function (sName) {
      return this.getView().getModel(sName);
    },

    setModel: function (oModel, sName) {
      return this.getView().setModel(oModel, sName);
    },

    /**
     * @return {sap.ui.model.resource.ResourceModel}
     */
    getResourceBundle: function () {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    },
  });
});
