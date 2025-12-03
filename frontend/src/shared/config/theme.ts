import { createSystem, defaultConfig } from "@chakra-ui/react"

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: "system-ui, sans-serif" },
        body: { value: "system-ui, sans-serif" },
      },
    },
  },
})

