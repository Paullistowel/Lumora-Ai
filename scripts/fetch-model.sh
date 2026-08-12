#!/usr/bin/env bash
# Downloads all-MiniLM-L6-v2 into the local model cache.
#
# transformers.js can fetch these itself on first use, but the ~23MB ONNX
# download fails on some networks. Running this up front makes the first
# submission fast and keeps CI offline-safe.
set -euo pipefail

CACHE="${MODEL_CACHE_DIR:-./.models}"
MODEL="Xenova/all-MiniLM-L6-v2"
BASE="https://huggingface.co/${MODEL}/resolve/main"
DEST="${CACHE}/${MODEL}"

mkdir -p "${DEST}/onnx"

for file in config.json tokenizer.json tokenizer_config.json special_tokens_map.json; do
  echo "  ${file}"
  curl -fsSL --retry 3 -o "${DEST}/${file}" "${BASE}/${file}"
done

echo "  onnx/model_quantized.onnx (~23MB)"
curl -fsSL --retry 3 -o "${DEST}/onnx/model_quantized.onnx" "${BASE}/onnx/model_quantized.onnx"

echo "Model cached in ${DEST}"
