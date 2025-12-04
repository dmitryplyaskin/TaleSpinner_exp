import { Button, Center, Heading, Text, VStack } from "@chakra-ui/react";

import { GlassCard } from "@/components/ui/glass-card";
import type { User } from "@/entities/user";

interface SelectUserProps {
  users: User[];
  onSelect: (userId: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export const SelectUser = ({
  users,
  onSelect,
  onCreate,
  isLoading = false,
}: SelectUserProps) => {
  return (
    <Center w="full" h="full" minH="80vh" px={4}>
      <GlassCard w="full" maxW="md" p={8}>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch" gap={2}>
            <Heading size="lg">Выберите пользователя</Heading>
            <Text color="fg.muted">
              Продолжите работу под выбранным пользователем или создайте нового.
            </Text>
          </VStack>

          <VStack align="stretch" gap={2}>
            {users.map((user) => (
              <Button
                key={user.id}
                variant="surface"
                colorPalette="brand"
                justifyContent="space-between"
                onClick={() => onSelect(user.id)}
                disabled={isLoading}
              >
                {user.name}
                {user.hasPassword && (
                  <Text fontSize="sm" color="fg.muted">
                    пароль задан
                  </Text>
                )}
              </Button>
            ))}
          </VStack>

          <Button
            variant="outline"
            colorPalette="brand"
            onClick={onCreate}
            disabled={isLoading}
          >
            Создать нового пользователя
          </Button>
        </VStack>
      </GlassCard>
    </Center>
  );
};
