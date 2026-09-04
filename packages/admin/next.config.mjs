import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

function normalizeBasePath(raw) {
  if (!raw || raw === "/") return "";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/$/, "");
}

const adminBasePath = normalizeBasePath(
  process.env.ADMIN_BASE_PATH ?? process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? ""
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(adminBasePath ? { basePath: adminBasePath } : {}),
  env: {
    NEXT_PUBLIC_ADMIN_BASE_PATH: adminBasePath,
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
