import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"
import { system } from "@/shared/config/theme"
import { ReactNode } from "react"

export function Provider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </ChakraProvider>
  )
}

