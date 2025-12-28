import { Box, Button, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { useUnit } from "effector-react";
import { GlassCard } from "@/components/ui/glass-card";
import { LuPlus } from "react-icons/lu";
import {
  CreateWorldForm,
  $isFormOpen,
  openCreateWorldForm,
} from "@/features/create-world";

export const HomePage = () => {
  const [isFormOpen, handleOpenForm] = useUnit([
    $isFormOpen,
    openCreateWorldForm,
  ]);

  if (isFormOpen) {
    return <CreateWorldForm />;
  }

  return (
    <Box w="full" h="full" p={8} bg="bg.subtle" minH="100vh">
      <Center h="full" minH="80vh">
        <GlassCard p={10} maxW="md" w="full" textAlign="center">
          <VStack gap={6}>
            <Heading size="2xl" fontWeight="bold" letterSpacing="tight">
              Create Your World
            </Heading>
            <Text color="fg.muted" fontSize="lg">
              Start your journey by crafting a new universe. Define its laws,
              its people, and its destiny.
            </Text>

            <Button
              size="xl"
              colorPalette="brand"
              variant="surface"
              width="full"
              fontSize="md"
              fontWeight="semibold"
              onClick={handleOpenForm}
            >
              <LuPlus /> Create New World
            </Button>
          </VStack>
        </GlassCard>
      </Center>
    </Box>
  );
};
