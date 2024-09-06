sap.ui.define(
  ["sap/m/OverflowToolbar", "sap/m/ToolbarSpacer", "sap/m/Label", "sap/m/Button"],
  function (OverflowToolbar, ToolbarSpacer, Label, Button) {
    "use strict";

    return OverflowToolbar.extend("portaleamministrativo.controls.Paginator", {
      metadata: {
        properties: {
          style: {
            type: "string",
            defaultValue: "Clear",
          },
          top: {
            type: "int",
            defaultValue: 100,
          },
          skip: {
            type: "int",
            defaultValue: 0,
          },
          records: {
            type: "int",
          },
          pages: {
            type: "boolean",
            defaultValue: true,
          },
          align: {
            type: "string",
            defaultValue: "End",
          },
        },
        events: {
          press: {},
        },
      },

      init: function (a) {
        OverflowToolbar.prototype.init.call(this);

        var sId = this._getId(this);

        this.addContent(new ToolbarSpacer(sId + "beginSpacer"));
        this.addContent(
          new Button(sId + "firstButton", {
            icon: "sap-icon://close-command-field",
            tooltip: "{i18n>labelFirst}",
            press: this._onFirst.bind(this),
          })
        );
        this.addContent(
          new Button(sId + "backButton", {
            icon: "sap-icon://slim-arrow-left",
            tooltip: "{i18n>labelBack}",
            press: this._onBack.bind(this),
          })
        );
        this.addContent(new Label(sId + "label"));
        this.addContent(
          new Button(sId + "nextButton", {
            icon: "sap-icon://slim-arrow-right",
            tooltip: "{i18n>labelNext}",
            press: this._onNext.bind(this),
          })
        );
        this.addContent(
          new Button(sId + "lastButton", {
            icon: "sap-icon://open-command-field",
            tooltip: "{i18n>labelLast}",
            press: this._onLast.bind(this),
          })
        );
        this.addContent(new ToolbarSpacer(sId + "endSpacer"));
      },

      renderer: function (oRm, oToolbar) {
        sap.m.OverflowToolbarRenderer.render(oRm, oToolbar);

        oToolbar._setVisibleByRecords();
        oToolbar._setLabel();
        oToolbar._setBackEnabled();
        oToolbar._setNextEnabled();
        oToolbar._setToolbarAlign();
      },

      getTop: function () {
        return this.getProperty("top");
      },

      getSkip: function () {
        return this.getProperty("skip");
      },

      getRecords: function () {
        return this.getProperty("records");
      },

      setTop: function (sValue) {
        this.setProperty("top", sValue);
        return this;
      },

      setSkip: function (sValue) {
        this.setProperty("skip", sValue);
        return this;
      },

      getPages: function () {
        return this.getProperty("pages");
      },

      getAlign: function () {
        return this.getProperty("align");
      },

      _setVisibleByRecords: function () {
        var bVisible = this.getRecords() ? true : false;

        this.setVisible(bVisible);
      },

      _setLabel: function () {
        var oLabel = this.getContent().filter((x) => x.getId() === this._getId(this) + "label")[0];
        var sLabel = "";

        if (this.getPages()) {
          var sCurrentPage = this.getSkip() / this.getTop() + 1;
          var sTotalPage = Math.floor(this.getRecords() / this.getTop());
          var sRemainder = this.getRecords() % this.getTop();

          sTotalPage = sRemainder !== 0 ? sTotalPage + 1 : sTotalPage;
          sLabel = sCurrentPage + " di " + sTotalPage;
        } else {
          var sFrom = this.getSkip() + 1;
          var sTo = this.getSkip() + this.getTop();

          sTo = sTo < this.getRecords() ? sTo : this.getRecords();
          sLabel = sFrom + " - " + sTo;
        }

        oLabel.setText(sLabel);
      },

      _setBackEnabled: function () {
        var oButton = this.getContent().filter((x) => x.getId() === this._getId(this) + "backButton")[0];
        oButton.setEnabled(this.getSkip() > 0);

        oButton = this.getContent().filter((x) => x.getId() === this._getId(this) + "firstButton")[0];
        oButton.setEnabled(this.getSkip() > 0);
      },

      _setNextEnabled: function () {
        var oButton = this.getContent().filter((x) => x.getId() === this._getId(this) + "nextButton")[0];
        oButton.setEnabled(this.getTop() + this.getSkip() < this.getRecords());

        oButton = this.getContent().filter((x) => x.getId() === this._getId(this) + "lastButton")[0];
        oButton.setEnabled(this.getTop() + this.getSkip() < this.getRecords());
      },

      _onNext: function () {
        this.setSkip(this.getSkip() + this.getTop());
        this.firePress();
      },

      _onBack: function () {
        this.setSkip(this.getSkip() - this.getTop());
        this.firePress();
      },

      _onFirst: function () {
        this.setSkip(0);
        this.firePress();
      },

      _onLast: function () {
        this.setSkip(Math.floor(this.getRecords() / this.getTop()) * this.getTop());
        this.firePress();
      },

      _setToolbarAlign: function () {
        var oBeginSpacer = this.getContent().filter((x) => x.getId() === this._getId(this) + "beginSpacer")[0];
        var oEndSpacer = this.getContent().filter((x) => x.getId() === this._getId(this) + "endSpacer")[0];

        switch (this.getAlign()) {
          case "Begin":
            oBeginSpacer.setVisible(false);
            oEndSpacer.setVisible(true);
            break;
          case "Center":
            oBeginSpacer.setVisible(true);
            oEndSpacer.setVisible(true);
            break;
          default:
            oBeginSpacer.setVisible(true);
            oEndSpacer.setVisible(false);
            break;
        }
      },

      _getId: function (self) {
        return self.getId().split("-").pop();
      },
    });
  }
);
