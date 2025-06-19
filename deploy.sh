#!/bin/bash

# Impostazioni
API_ENDPOINT="https://api.cf.eu10-004.hana.ondemand.com"
MTAR_DIR="mta_archives"

# 1. Build del progetto
echo "➡️  Avvio build del progetto..."
mbt build
if [ $? -ne 0 ]; then
  echo "❌ Build fallita. Interruzione script."
  exit 1
fi

# 2. Trova il file .mtar
MTAR_FILE=$(ls $MTAR_DIR/*.mtar | head -n 1)
if [ -z "$MTAR_FILE" ]; then
  echo "❌ Nessun file .mtar trovato nella cartella $MTAR_DIR"
  exit 1
fi

echo "✅ Build completata: $MTAR_FILE"

# 3. Definizione delle org/space
declare -a DEPLOYMENTS=(
  "fsh-dev MinervaACQ"
  # "FS TECHNOLOGY S.P.A._ffss-cp-qas MinervaACQ"
  # "fsh-prd MinervaACQ"
)

# 4. Deploy su ogni org/space
for DEPLOY in "${DEPLOYMENTS[@]}"; do
  ORG=$(echo $DEPLOY | awk '{print $1}')
  SPACE=$(echo $DEPLOY | awk '{print $2}')

  echo "🚀 Deploy su Org: $ORG | Space: $SPACE"

  cf login -a "$API_ENDPOINT" -o "$ORG" -s "$SPACE" --sso
  if [ $? -ne 0 ]; then
    echo "❌ Login fallito per $ORG/$SPACE. Passo al prossimo."
    continue
  fi

  cf deploy "$MTAR_FILE" --skip-testing-phase
  if [ $? -ne 0 ]; then
    echo "❌ Deploy fallito su $ORG/$SPACE"
  else
    echo "✅ Deploy completato su $ORG/$SPACE"
  fi
done
