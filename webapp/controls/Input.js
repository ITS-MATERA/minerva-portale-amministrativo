sap.ui.define(["sap/m/Input", "sap/m/Label"], function (Input, Label) {
  "use strict";

  return Input.extend("portaleamministrativo.controls.Input", {
    metadata: {
      properties: {
        label: {
          type: "string",
          defaultValue: "",
        },
        required: {
          type: "boolean",
          defaultValue: false,
        },
      },
      aggregations: {
        _label: { type: "sap.m.Label", multiple: false, visibility: "hidden" },
      },
    },

    init: function () {
      Input.prototype.init.call(this);

      this.setAggregation("_label", new Label());
    },

    renderer: function (oRm, oInput) {
      oInput._createLabel(oRm, oInput);

      sap.m.InputRenderer.render(oRm, oInput);
    },

    getLabel: function () {
      return this.getProperty("label");
    },

    getRequired: function () {
      return this.getProperty("required");
    },

    setLabel: function (sValue) {
      this.setProperty("label", sValue);
      return this;
    },

    setRequired: function (sValue) {
      this.setProperty("required", sValue);
      return this;
    },

    _createLabel: function (oRm, oInput) {
      if (!oInput.getAggregation("_label").getText() && oInput.getLabel()) {
        oRm.renderControl(oInput.getAggregation("_label"));
      }

      oInput.getAggregation("_label").setRequired(oInput.getRequired());
      oInput.getAggregation("_label").setVisible(oInput.getLabel() ? true : false);
      oInput.getAggregation("_label").setText(oInput.getLabel());
    },
  });
});
