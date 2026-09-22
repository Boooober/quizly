#!/usr/bin/env bash
# Imports the catalog JSONL into a Discovery Engine data store and waits for the
# long-running operation. There is no Pulumi resource for documents:import.
set -euo pipefail
PROJECT=$1 STORE=$2 URI=$3
TOKEN=$(gcloud auth print-access-token)
BASE="https://discoveryengine.googleapis.com/v1/projects/${PROJECT}/locations/global/collections/default_collection/dataStores/${STORE}"

OP=$(curl -sS --fail-with-body -X POST -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  "${BASE}/branches/0/documents:import" \
  -d "{\"gcsSource\":{\"inputUris\":[\"${URI}\"],\"dataSchema\":\"custom\"},\"reconciliationMode\":\"FULL\"}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["name"])')
echo "import operation: ${OP}"

for _ in $(seq 1 60); do
  RESP=$(curl -sS -H "Authorization: Bearer ${TOKEN}" "https://discoveryengine.googleapis.com/v1/${OP}")
  if python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin).get("done") else 1)' <<<"${RESP}"; then
    python3 -c '
import json, sys
d = json.load(sys.stdin)
if "error" in d:
    print("import failed:", d["error"], file=sys.stderr); sys.exit(1)
m = d.get("metadata", {})
print("imported:", m.get("successCount", "?"), "failed:", m.get("failureCount", "0"))
' <<<"${RESP}"
    exit 0
  fi
  sleep 10
done
echo "import did not finish in 10 minutes" >&2
exit 1
