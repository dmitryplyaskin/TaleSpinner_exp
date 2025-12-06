import {
  Dialog,
  Stack,
  Input,
  Button,
  HStack,
  Text,
  IconButton,
  Separator,
} from "@chakra-ui/react";
import { Field } from "@chakra-ui/react";
import { useUnit } from "effector-react";
import { tokensModel } from "@/entities/llm-config";
import type { ProviderType, TokenCreate } from "@/entities/llm-config/types";
import { useState } from "react";
import { LuTrash } from "react-icons/lu";
import { PasswordInput } from "@/components/ui/password-input";
import { userModel } from "@/entities/user";

interface TokenManagementModalProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  provider: ProviderType | null;
}

export const TokenManagementModal = ({
  open,
  onOpenChange,
  provider,
}: TokenManagementModalProps) => {
  const [tokens, addToken, deleteToken, isSaving] = useUnit([
    tokensModel.$tokens,
    tokensModel.addToken,
    tokensModel.removeToken,
    tokensModel.$tokenSaving,
  ]);
  const currentUser = useUnit(userModel.$currentUser);

  const [newName, setNewName] = useState("");
  const [newToken, setNewToken] = useState("");

  if (!provider) return null;

  const providerTokens = tokens.filter((t) => t.provider === provider);

  const handleAdd = () => {
    if (!currentUser) return;
    if (!newName.trim()) return; // Token can be empty for some providers? Guide says "Input with token"

    const data: TokenCreate = {
      provider,
      name: newName,
      token: newToken,
    };

    addToken({ userId: currentUser.id, data });
    setNewName("");
    setNewToken("");
  };

  const handleDelete = (id: string) => {
    if (!currentUser) return;
    deleteToken({ userId: currentUser.id, tokenId: id });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Manage Tokens - {provider}</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={6}>
              {/* Add New Token */}
              <Stack gap={4} p={4} borderWidth="1px" borderRadius="md">
                <Text fontWeight="bold">Add New Token</Text>
                <Field.Root>
                  <Field.Label>Name</Field.Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My API Key"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Token / Key</Field.Label>
                  <PasswordInput
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="sk-..."
                  />
                </Field.Root>
                <Button
                  onClick={handleAdd}
                  loading={isSaving}
                  disabled={!newName.trim()}
                  colorPalette="blue"
                  alignSelf="flex-end"
                >
                  Add Token
                </Button>
              </Stack>

              <Separator />

              {/* List Tokens */}
              <Stack gap={2}>
                <Text fontWeight="bold">Saved Tokens</Text>
                {providerTokens.length === 0 ? (
                  <Text color="fg.muted" fontSize="sm">
                    No tokens found for this provider.
                  </Text>
                ) : (
                  providerTokens.map((t) => (
                    <HStack
                      key={t.id}
                      justify="space-between"
                      p={3}
                      bg="bg.subtle"
                      borderRadius="md"
                    >
                      <Stack gap={0}>
                        <Text fontWeight="medium">{t.name}</Text>
                        <Text fontSize="xs" color="fg.muted">
                          created at{" "}
                          {new Date(t.created_at).toLocaleDateString()}
                        </Text>
                      </Stack>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDelete(t.id)}
                        aria-label="Delete token"
                      >
                        <LuTrash />
                      </IconButton>
                    </HStack>
                  ))
                )}
              </Stack>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
