sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Questa funzione restituisce l'URL di destinazione per una richiesta specifica in base all'ambiente in cui l'applicazione è eseguita.
     * Viene utilizzata per determinare l'URL corretto in base al nome della destinazione (sDestinationName) e al metodo (sMethod).
     *
     * Parametri:
     * @param {object} self - Il componente o controller corrente che invoca la funzione (necessario per ottenere l'ID dell'app).
     * @param {string} sDestinationName - Il nome della destinazione da utilizzare per generare l'URL.
     * @param {string} sMethod - Il metodo da invocare sulla destinazione (ad esempio, un'azione o un endpoint specifico).
     *
     * Restituisce:
     * {string} - L'URL di destinazione per l'azione/method specificato, in base all'ambiente di esecuzione (SAP Work Zone, FLP, standalone).
     */
    getDestinationUrl: function (sDestinationName, sMethod) {
      // Ottiene l'ID dell'applicazione dal manifesto del componente
      const sAppId = "portaleamministrativo";

      const sLocation = window.location;
      const sBaseUrl = sLocation.href;

      let sUrl = jQuery.sap.getModulePath(`${sAppId}/${sDestinationName}`);
      const sFlpDestinationUrl = jQuery.sap.getModulePath(`${sAppId}/${sDestinationName}/`);

      // Verifica se l'applicazione è in esecuzione sul servizio CAP
      if (sBaseUrl.includes("port4004")) {
        return `${sBaseUrl.split(".sap/")[0]}.sap/${sMethod}`;
      }

      // Verifica se l'applicazione è in esecuzione in un ambiente specifico, come SAP Work Zone
      if (sBaseUrl.includes("workspaces-ws-")) {
        return `${sUrl}/${sMethod}`;
      }

      // Verifica se l'applicazione è in esecuzione nel Fiori Launchpad (FLP)
      if (sBaseUrl.includes("cp.portal/ui5appruntime.html")) {
        return `${sLocation.protocol}//${sLocation.hostname}${sFlpDestinationUrl}/${sMethod}`;
      }

      // Comportamento predefinito per altri ambienti (ad esempio, applicazione standalone)
      sUrl = `${sLocation.protocol}//${sLocation.hostname}${sLocation.pathname}`;
      sUrl = sUrl.replace("index.html", "") + `${sDestinationName}/${sMethod}`;

      return sUrl;
    },
  };
});
