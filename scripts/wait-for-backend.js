#!/usr/bin/env node

const http = require("http")
const https = require("https")
const path = require("path")
const fs = require("fs")

const loadEnvFile = (filename) => {
  const envPath = path.join(__dirname, "..", filename)
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, "utf8")
  content.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) return

    const equalIndex = trimmed.indexOf("=")
    if (equalIndex === -1) return

    const key = trimmed.slice(0, equalIndex).trim()
    const value = trimmed.slice(equalIndex + 1).trim().replace(/^["']|["']$/g, "")

    if (key && value && !process.env[key]) {
      process.env[key] = value
    }
  })
}

loadEnvFile(".env.local")
loadEnvFile(".env")

const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const keyExchangeUrl = `${backendUrl}/key-exchange`
const timeout = 1200
const retryInterval = 5000

const checkBackend = (url) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const makeRequest = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)

      if (elapsed > timeout) {
        reject(new Error(`Timeout: Backend not ready within ${timeout} seconds`))
        return
      }

      const urlObj = new URL(url)
      const isHttps = urlObj.protocol === "https:"
      const client = isHttps ? https : http

      const req = client.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: "GET",
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode === 200) {
            console.log("Backend is ready!")
            resolve()
          } else {
            retry(elapsed)
          }
        }
      )

      req.on("error", () => retry(elapsed))
      req.on("timeout", () => {
        req.destroy()
        retry(elapsed)
      })

      req.end()
    }

    const retry = (elapsed) => {
      console.log(
        `Waiting for backend at ${url}... Elapsed: ${elapsed}s`
      )
      setTimeout(makeRequest, retryInterval)
    }

    makeRequest()
  })
}

checkBackend(keyExchangeUrl)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message)
    process.exit(1)
  })

