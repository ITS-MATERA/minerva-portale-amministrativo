sap.ui.define(["sap/ui/base/ManagedObject"], function (ManagedObject) {
  "use strict";
  /* BY MASHFROG
                      _    _
                     (o)--(o)
                    /.______.\
                    \________/
                   ./        \.
                  ( .        , )
                   \ \_\\//_/ /
                    ~~  ~~  ~~
  BY MASHFROG*/

  return ManagedObject.extend("cruscottoria.externalServices.companyRoles.library", {
    // DEV_PREFIX_URL: "workspaces-ws-n28lf.eu10.applicationstudio.cloud.sap/",
    DEV_PREFIX_URL: "workspaces-ws-",
    INDEX_PREFIX_URL: "index.html",
    FLP_PREFIX_URL: "cp.portal/ui5appruntime.html",
    DESTINATION_NAME: "user-roles",

    getUserRoles: function (applicationId) {
      var self = this,
        settings = null,
        url = null,
        arrayObject = null,
        baseUrl = window.location.href,
        isDev = false,
        flpDestinationurl = jQuery.sap.getModulePath(applicationId + "/" + self.DESTINATION_NAME + "/");

      arrayObject = self._getMockArrayObject();
      if (baseUrl.includes(self.DEV_PREFIX_URL) || baseUrl.includes("fsh-dev")) {
        arrayObject = self._getMockArrayObject();
        isDev = true;
      } else if (baseUrl.includes(self.FLP_PREFIX_URL)) {
        url =
          window.location.protocol +
          "//" +
          window.location.hostname +
          flpDestinationurl +
          "/odata/v4/catalog/MappingSocieta";
      } else {
        url = window.location.protocol + "//" + window.location.hostname + window.location.pathname;
        /*Workaround per funzionare anche nella versione deployata*/
        window.history.pushState(
          { html: "", pageTitle: document.title },
          "",
          url + "?saasApprouter=true&sap-ui-app-id=cruscottoria"
        );
        url = url.replace(self.INDEX_PREFIX_URL, "");
        url = url + self.DESTINATION_NAME + "/odata/v4/catalog/MappingSocieta";
      }

      var settings = {
        url: url,
        method: "GET",
        timeout: 0,
      };

      return new Promise(async function (resolve, reject) {
        await $.ajax(settings)
          .done(function (response) {
            //TODO:da decommentare
            if (isDev) {
              resolve(arrayObject);
            } else {
              resolve(!response || response === null ? [] : response.value);
            }
            // resolve(arrayObject);
          })
          .fail(function (response) {
            reject(response.responseJSON.error);
          });
      });
    },

    _getMockArrayObject: function () {
      var self = this;
      return [
        {
          id: 1,
          descrizione: "Italian-RFI",
          metodoComposizioneFile: "SAP2",
          codiceSocieta: "FS01",
          codiceSocietaHFM: "A01",
          sistema: "INE",
          tipoSistema: "S4",
          codiceAggregazione: "2INF",
          testoAggregazione: "Infrastrutture",
        },
        {
          id: 2,
          descrizione: "Italian-FS Corporate",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSHD",
          codiceSocietaHFM: "AAA",
          sistema: "ASE",
          tipoSistema: "S4",
          codiceAggregazione: null,
          testoAggregazione: null,
        },
        {
          id: 4,
          descrizione: "Italian-FS International",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSIN",
          codiceSocietaHFM: "AAC",
          sistema: "ASE",
          tipoSistema: "S4",
          codiceAggregazione: "2ALT",
          testoAggregazione: "Altro",
        },
        {
          id: 5,
          descrizione: "Italian=FS Technology SpA",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSTH",
          codiceSocietaHFM: "AH1",
          sistema: "ASE",
          tipoSistema: "S4",
          codiceAggregazione: "2ALT",
          testoAggregazione: "Altro",
        },
        {
          id: 6,
          descrizione: "Italian-Mercitalia Shunting & Terminal (giÃ  Serfer)",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "SFR",
          codiceSocietaHFM: "E10",
          sistema: "MEP",
          tipoSistema: "S4",
          codiceAggregazione: "2LOG",
          testoAggregazione: "Logistica",
        },
        {
          id: 7,
          descrizione: "Italian Mercitalia Intermodal (giÃ  CEMAT)",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "CE10",
          codiceSocietaHFM: "E11",
          sistema: "MEP",
          tipoSistema: "S4",
          codiceAggregazione: "2LOG",
          testoAggregazione: "Logistica",
        },
        {
          id: 8,
          descrizione: "Italian-Mercitalia Logistics",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSL",
          codiceSocietaHFM: "G02",
          sistema: "MEP",
          tipoSistema: "S4",
          codiceAggregazione: "2LOG",
          testoAggregazione: "Logistica",
        },
        {
          id: 9,
          descrizione: "Italian Ferservizi",
          metodoComposizioneFile: "SAP2",
          codiceSocieta: "FSCS",
          codiceSocietaHFM: "I01",
          sistema: "ASE",
          tipoSistema: "S4",
          codiceAggregazione: "2ALT",
          testoAggregazione: "Altro",
        },
        {
          id: 10,
          descrizione: "Italian Busitalia Sita Nord",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSTG",
          codiceSocietaHFM: "K01",
          sistema: "G4E",
          tipoSistema: "S4",
          codiceAggregazione: "2GOM",
          testoAggregazione: "Passeggeri (Gomma)",
        },
        {
          id: 11,
          descrizione: "Italian Ataf Gestioni",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "ATAF",
          codiceSocietaHFM: "K02",
          sistema: "G4E",
          tipoSistema: "S4",
          codiceAggregazione: null,
          testoAggregazione: null,
        },
        {
          id: 12,
          descrizione: "Italian Busitalia Veneto",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSVE",
          codiceSocietaHFM: "K08",
          sistema: "G4E",
          tipoSistema: "S4",
          codiceAggregazione: "2GOM",
          testoAggregazione: "Passeggeri (Gomma)",
        },
        {
          id: 13,
          descrizione: "Italian-Busitalia Rail Service",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSRS",
          codiceSocietaHFM: "K09",
          sistema: "G4E",
          tipoSistema: "S4",
          codiceAggregazione: "2GOM",
          testoAggregazione: "Passeggeri (Gomma)",
        },
        {
          id: 14,
          descrizione: "Italian-Busitalia Campania",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSCA",
          codiceSocietaHFM: "K13",
          sistema: "G4E",
          tipoSistema: "S4",
          codiceAggregazione: "2GOM",
          testoAggregazione: "Passeggeri (Gomma)",
        },
        {
          id: 15,
          descrizione: "Italian-TRENITALIA",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "ITF",
          codiceSocietaHFM: "S01",
          sistema: "RSE",
          tipoSistema: "S4",
          codiceAggregazione: "2ITF",
          testoAggregazione: "Passeggeri (Trenitalia)",
        },
        {
          id: 16,
          descrizione: "Italian FS Sistemi Urbani",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSSU",
          codiceSocietaHFM: "V01",
          sistema: "ASE600",
          tipoSistema: "S4",
          codiceAggregazione: null,
          testoAggregazione: null,
        },
        {
          id: 17,
          descrizione: "Italian-Mercitalia Rail",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "MIR",
          codiceSocietaHFM: "Y01",
          sistema: "MEP",
          tipoSistema: "S4",
          codiceAggregazione: "2LOG",
          testoAggregazione: "Logistica",
        },
        {
          id: 19,
          descrizione: "Italian FS Security",
          metodoComposizioneFile: "SAP",
          codiceSocieta: "FSSE",
          codiceSocietaHFM: "AR1",
          sistema: "ASE",
          tipoSistema: "S4",
          codiceAggregazione: "2ALT",
          testoAggregazione: "Altro",
        },
        {
          id: 21,
          descrizione: "Fondazione",
          metodoComposizioneFile: null,
          codiceSocieta: "FFSI",
          codiceSocietaHFM: null,
          sistema: null,
          tipoSistema: null,
          codiceAggregazione: "2ALT",
          testoAggregazione: "Altro",
        },
        {
          id: 22,
          descrizione: "ANAS",
          metodoComposizioneFile: null,
          codiceSocieta: "ANAS",
          codiceSocietaHFM: null,
          sistema: null,
          tipoSistema: null,
          codiceAggregazione: "2INF",
          testoAggregazione: "Infrastrutture",
        },
        {
          id: 23,
          descrizione: "Italferr",
          metodoComposizioneFile: null,
          codiceSocieta: "ITAL",
          codiceSocietaHFM: null,
          sistema: null,
          tipoSistema: null,
          codiceAggregazione: "2INF",
          testoAggregazione: "Infrastrutture",
        },
        {
          id: 24,
          descrizione: "Terminali Italia",
          metodoComposizioneFile: null,
          codiceSocieta: "TR10",
          codiceSocietaHFM: null,
          sistema: null,
          tipoSistema: null,
          codiceAggregazione: "2LOG",
          testoAggregazione: "Logistica",
        },
        {
          id: 25,
          descrizione: "Trasporti per l'Emilia Romagna",
          metodoComposizioneFile: null,
          codiceSocieta: "TER",
          codiceSocietaHFM: null,
          sistema: null,
          tipoSistema: null,
          codiceAggregazione: "2ITF",
          testoAggregazione: "Passeggeri (Trenitalia)",
        },
        {
          id: 26,
          descrizione: "Treni turistici italiani",
          metodoComposizioneFile: null,
          codiceSocieta: "TTI",
          codiceSocietaHFM: null,
          sistema: null,
          tipoSistema: null,
          codiceAggregazione: "2ITF",
          testoAggregazione: "Passeggeri (Trenitalia)",
        },
        {
          id: 27,
          descrizione: "Ferrovie del sud-est",
          metodoComposizioneFile: null,
          codiceSocieta: "FSE",
          codiceSocietaHFM: null,
          sistema: null,
          tipoSistema: null,
          codiceAggregazione: "2ITF",
          testoAggregazione: "Passeggeri (Trenitalia)",
        },
      ];
    },
  });
});
