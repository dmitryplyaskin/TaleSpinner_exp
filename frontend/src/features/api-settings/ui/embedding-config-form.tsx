import { useState, useEffect } from "react";
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
import type {
  ProviderType,
  EmbeddingConfigCreate,
} from "@/entities/llm-config";
import {
  providersModel,
  tokensModel,
  embeddingConfigsModel,
} from "@/entities/llm-config";

interface EmbeddingConfigFormProps {
  userId: string;
  onSuccess?: () => void;
}

export const EmbeddingConfigForm = ({
  userId,
  onSuccess,
}: EmbeddingConfigFormProps) => {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<ProviderType | "">("");
  const [modelId, setModelId] = useState("");
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState("");
  const [batchSize, setBatchSize] = useState("100");

  const [
    providers,
    providerModels,
    loadProviderModels,
    tokens,
    addConfig,
    isSaving,
  ] = useUnit([
    providersModel.$embeddingProviders,
    providersModel.$providerModels,
    providersModel.loadProviderModels,
    tokensModel.$tokens,
    embeddingConfigsModel.addEmbeddingConfig,
    embeddingConfigsModel.$embeddingConfigSaving,
  ]);

  // Load models when provider changes
  useEffect(() => {
    if (provider) {
      loadProviderModels({ providerId: provider, modelType: "embedding" });
    }
    setModelId("");
  }, [provider, loadProviderModels]);

  const providerCollection = createListCollection({
    items: providers.map((p) => ({
      label: p.name,
      value: p.id,
    })),
  });

  const currentProviderModels = provider
    ? providerModels[provider]?.embedding ?? []
    : [];

  const modelCollection = createListCollection({
    items: currentProviderModels.map((m) => ({
      label: m.name,
      value: m.id,
    })),
  });

  const providerTokens = tokens.filter(
    (t) => t.provider === provider && t.is_active
  );

  const tokenCollection = createListCollection({
    items: providerTokens.map((t) => ({
      label: t.name,
      value: t.id,
    })),
  });

  const handleSubmit = () => {
    if (!name.trim() || !provider || !modelId) return;

    const data: EmbeddingConfigCreate = {
      name: name.trim(),
      provider: provider as ProviderType,
      model_id: modelId,
      token_ids: selectedTokenIds,
      dimensions: dimensions ? parseInt(dimensions, 10) : undefined,
      batch_size: parseInt(batchSize, 10) || 100,
    };

    addConfig({ userId, data });
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setName("");
    setProvider("");
    setModelId("");
    setSelectedTokenIds([]);
    setDimensions("");
    setBatchSize("100");
  };

  const isValid = name.trim() && provider && modelId;

  return (
    <VStack gap={4} align="stretch">
      <Field.Root>
        <Field.Label>Configuration Name</Field.Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Embedding Config"
        />
      </Field.Root>

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
        <Field.Label>Model</Field.Label>
        <SelectRoot
          collection={modelCollection}
          value={modelId ? [modelId] : []}
          onValueChange={(e) => setModelId(e.value[0])}
          disabled={!provider || currentProviderModels.length === 0}
        >
          <SelectTrigger>
            <SelectValueText placeholder="Select embedding model" />
          </SelectTrigger>
          <SelectContent>
            {modelCollection.items.map((item) => (
              <SelectItem key={item.value} item={item}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </Field.Root>

      {providerTokens.length > 0 && (
        <Field.Root>
          <Field.Label>API Token (optional)</Field.Label>
          <SelectRoot
            collection={tokenCollection}
            value={selectedTokenIds}
            onValueChange={(e) => setSelectedTokenIds(e.value)}
            multiple
          >
            <SelectTrigger clearable>
              <SelectValueText placeholder="Select token(s)" />
            </SelectTrigger>
            <SelectContent>
              {tokenCollection.items.map((item) => (
                <SelectItem key={item.value} item={item}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Field.Root>
      )}

      <Field.Root>
        <Field.Label>Dimensions (optional)</Field.Label>
        <Input
          type="number"
          value={dimensions}
          onChange={(e) => setDimensions(e.target.value)}
          placeholder="Auto"
        />
        <Field.HelperText>Leave empty to use model default</Field.HelperText>
      </Field.Root>

      <Field.Root>
        <Field.Label>Batch Size</Field.Label>
        <Input
          type="number"
          value={batchSize}
          onChange={(e) => setBatchSize(e.target.value)}
          min={1}
          max={1000}
        />
      </Field.Root>

      <HStack justify="flex-end" pt={2}>
        <Button
          colorPalette="brand"
          onClick={handleSubmit}
          disabled={!isValid}
          loading={isSaving}
        >
          Create Configuration
        </Button>
      </HStack>
    </VStack>
  );
};

