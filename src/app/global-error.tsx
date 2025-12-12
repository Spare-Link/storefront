"use client"

import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
          <h1 className="text-2xl-semi text-ui-fg-base">
            Something went wrong!
          </h1>
          <p className="text-small-regular text-ui-fg-base">
            An error occurred while processing your request.
          </p>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="flex gap-x-1 items-center group px-4 py-2 rounded-md border border-ui-border-base hover:bg-ui-bg-subtle-hover"
            >
              <Text className="text-ui-fg-interactive">Try again</Text>
            </button>
            <Link className="flex gap-x-1 items-center group" href="/">
              <Text className="text-ui-fg-interactive">Go to frontpage</Text>
              <ArrowUpRightMini
                className="group-hover:rotate-45 ease-in-out duration-150"
                color="var(--fg-interactive)"
              />
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
