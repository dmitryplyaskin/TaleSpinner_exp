import { Box, Flex } from "@chakra-ui/react"
import { Sidebar } from "@/widgets/sidebar/ui/sidebar"
import { HomePage } from "@/pages/home/ui/home-page"

function App() {
  return (
    <Flex w="full" minH="100vh" bg="bg.subtle">
      <Sidebar />
      <Box flex="1" overflow="auto">
        <HomePage />
      </Box>
    </Flex>
  )
}

export default App
