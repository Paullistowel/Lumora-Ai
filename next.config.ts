import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages ship native binaries or read files off disk at runtime, so
  // they must stay outside the bundler and be required at runtime instead.
  serverExternalPackages: [
    "@xenova/transformers",
    "onnxruntime-node",
    "sharp",
    "pdf-parse",
    "mammoth",
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  experimental: {
    serverActions: {
      // Assignment uploads: matches MAX_FILE_BYTES in src/lib/documents.ts.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
