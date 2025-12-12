import Medusa from "@medusajs/js-sdk"

export function getBackendUrl(): string {
  return process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
}

const MEDUSA_BACKEND_URL = getBackendUrl()

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
