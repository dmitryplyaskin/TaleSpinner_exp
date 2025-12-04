import { Box, Flex } from "@chakra-ui/react";
import { Sidebar } from "@/widgets/sidebar/ui/sidebar";
import { UserGate } from "@/widgets/user-gate";
import { HomePage } from "@/pages/home/ui/home-page";
import { UserSettingsHost } from "@/features/user-settings";

function App() {
  return (
    <UserGate>
      <Flex w="full" minH="100vh" bg="bg.subtle">
        <Sidebar />
        <Box flex="1" overflow="auto">
          <HomePage />
        </Box>
      </Flex>
      <UserSettingsHost />
    </UserGate>
  );
}

export default App;
