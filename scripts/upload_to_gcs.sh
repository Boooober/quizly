#!/usr/bin/env bash
set -e

PROJECT_ID="team3-507508"
BUCKET_NAME="team3-507508-quizly-images"
LOCATION="us-central1"

echo "=== 1. Checking / Creating Cloud Storage Bucket: gs://${BUCKET_NAME} ==="
if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" &>/dev/null; then
    echo "Creating bucket gs://${BUCKET_NAME} in ${LOCATION}..."
    gcloud storage buckets create "gs://${BUCKET_NAME}" --project="${PROJECT_ID}" --location="${LOCATION}" --uniform-bucket-level-access
else
    echo "Bucket gs://${BUCKET_NAME} already exists."
fi

echo "=== 2. Setting Public Read Permissions on Bucket ==="
# Allow public read so browser try-on and catalog images load directly
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
    --member="allUsers" \
    --role="roles/storage.objectViewer" || true

echo "=== 3. Uploading Transparent PNG Images ==="
gcloud storage cp images/*.png "gs://${BUCKET_NAME}/" --cache-control="public, max-age=86400"

echo "=== 4. Uploading Catalog Dataset (sunglasses.jsonl) ==="
gcloud storage cp sunglasses.jsonl "gs://${BUCKET_NAME}/sunglasses.jsonl"

echo "=== 5. Verification ==="
echo "Uploaded objects:"
gcloud storage ls "gs://${BUCKET_NAME}/"

echo "All images and catalog successfully uploaded to https://storage.googleapis.com/${BUCKET_NAME}/"
