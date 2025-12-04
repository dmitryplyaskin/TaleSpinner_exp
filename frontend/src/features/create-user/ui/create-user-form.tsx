import { useState } from "react";

import {
  Alert,
  Button,
  Center,
  Field,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useUnit } from "effector-react";

import { GlassCard } from "@/components/ui/glass-card";
import { PasswordInput } from "@/components/ui/password-input";
import { userModel } from "@/entities/user";

interface CreateUserFormProps {
  onCancel?: () => void;
}

export const CreateUserForm = ({ onCancel }: CreateUserFormProps) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const [createUser, isCreating, error] = useUnit([
    userModel.createUserFx,
    userModel.createUserFx.pending,
    userModel.$error,
  ]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setLocalError("Введите имя пользователя");
      return;
    }

    setLocalError(null);
    createUser({
      name: trimmedName,
      password: password.trim() || undefined,
    });
  };

  return (
    <Center w="full" h="full" minH="80vh" px={4}>
      <GlassCard w="full" maxW="md" p={8}>
        <form onSubmit={handleSubmit}>
          <VStack align="stretch" gap={6}>
            <VStack align="stretch" gap={2}>
              <Heading size="lg">Создать пользователя</Heading>
              <Text color="fg.muted">
                Имя обязательно, пароль можно оставить пустым.
              </Text>
            </VStack>

            <VStack align="stretch" gap={4}>
              <Field.Root required>
                <Field.Label>Имя</Field.Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите имя"
                  autoFocus
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Пароль (опционально)</Field.Label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Оставьте пустым, если не нужен"
                />
              </Field.Root>

              {(localError || error) && (
                <Alert.Root status="error" borderRadius="md">
                  <Alert.Indicator />
                  <Alert.Content>{localError || error}</Alert.Content>
                </Alert.Root>
              )}
            </VStack>

            <VStack align="stretch" gap={3}>
              <Button
                type="submit"
                colorPalette="brand"
                variant="solid"
                loading={isCreating}
              >
                Создать
              </Button>
              {onCancel && (
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isCreating}
                >
                  Вернуться к выбору
                </Button>
              )}
            </VStack>
          </VStack>
        </form>
      </GlassCard>
    </Center>
  );
};
