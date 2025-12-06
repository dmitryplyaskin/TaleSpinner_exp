import { useState } from "react";
import {
  Button,
  Field,
  HStack,
  Input,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { useUnit } from "effector-react";

import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";
import type { ProviderType, TokenCreate } from "@/entities/llm-config";
import { providersModel, tokensModel } from "@/entities/llm-config";

interface TokenFormProps {
  userId: string;
  onSuccess?: () => void;
}

export const TokenForm = ({ userId, onSuccess }: TokenFormProps) => {
  const [provider, setProvider] = useState<ProviderType | "">("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");

  const [providers, addToken, isSaving] = useUnit([
    providersModel.$providers,
    tokensModel.addToken,
    tokensModel.$tokenSaving,
  ]);

  const providersRequiringKey = providers.filter((p) => p.requires_api_key);

  const providerCollection = createListCollection({
    items: providersRequiringKey.map((p) => ({
      label: p.name,
      value: p.id,
    })),
  });

  const handleSubmit = () => {
    if (!provider || !name.trim() || !token.trim()) return;

    const data: TokenCreate = {
      provider: provider as ProviderType,
      name: name.trim(),
      token: token.trim(),
    };

    addToken({ userId, data });
    setProvider("");
    setName("");
    setToken("");
    onSuccess?.();
  };

  const isValid = provider && name.trim() && token.trim();

  return (
    <VStack gap={4} align="stretch">
      <Field.Root>
        <Field.Label>Provider</Field.Label>
        <SelectRoot
          collection={providerCollection}
          value={provider ? [provider] : []}
          onValueChange={(e) => setProvider(e.value[0] as ProviderType)}
        >
          <SelectTrigger>
            <SelectValueText placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providerCollection.items.map((item) => (
              <SelectItem key={item.value} item={item}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </Field.Root>

      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My API Key"
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>API Token</Field.Label>
        <PasswordInput
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="sk-..."
        />
      </Field.Root>

      <HStack justify="flex-end">
        <Button
          colorPalette="brand"
          onClick={handleSubmit}
          disabled={!isValid}
          loading={isSaving}
        >
          Add Token
        </Button>
      </HStack>
    </VStack>
  );
};

