import { useState, useEffect } from "react";
import {
  Button,
  Field,
  HStack,
  Input,
  Slider,
  VStack,
  createListCollection,
  Text,
} from "@chakra-ui/react";
import { useUnit } from "effector-react";

import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import type { ProviderType, ModelConfigCreate } from "@/entities/llm-config";
import {
  providersModel,
  tokensModel,
  modelConfigsModel,
} from "@/entities/llm-config";

interface ModelConfigFormProps {
  userId: string;
  onSuccess?: () => void;
}

export const ModelConfigForm = ({
  userId,
  onSuccess,
}: ModelConfigFormProps) => {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<ProviderType | "">("");
  const [modelId, setModelId] = useState("");
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [temperature, setTemperature] = useState([0.7]);
  const [topP, setTopP] = useState([1.0]);
  const [maxTokens, setMaxTokens] = useState("4096");
  const [frequencyPenalty, setFrequencyPenalty] = useState([0.0]);
  const [presencePenalty, setPresencePenalty] = useState([0.0]);

  const [
    providers,
    providerModels,
    loadProviderModels,
    tokens,
    addModelConfig,
    isSaving,
  ] = useUnit([
    providersModel.$llmProviders,
    providersModel.$providerModels,
    providersModel.loadProviderModels,
    tokensModel.$tokens,
    modelConfigsModel.addModelConfig,
    modelConfigsModel.$modelConfigSaving,
  ]);

  // Load models when provider changes
  useEffect(() => {
    if (provider) {
      loadProviderModels({ providerId: provider, modelType: "llm" });
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
    ? providerModels[provider]?.llm ?? []
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

    const data: ModelConfigCreate = {
      name: name.trim(),
      provider: provider as ProviderType,
      model_id: modelId,
      token_ids: selectedTokenIds,
      temperature: temperature[0],
      top_p: topP[0],
      max_tokens: parseInt(maxTokens, 10) || 4096,
      frequency_penalty: frequencyPenalty[0],
      presence_penalty: presencePenalty[0],
    };

    addModelConfig({ userId, data });
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setName("");
    setProvider("");
    setModelId("");
    setSelectedTokenIds([]);
    setTemperature([0.7]);
    setTopP([1.0]);
    setMaxTokens("4096");
    setFrequencyPenalty([0.0]);
    setPresencePenalty([0.0]);
  };

  const isValid = name.trim() && provider && modelId;

  return (
    <VStack gap={4} align="stretch">
      <Field.Root>
        <Field.Label>Configuration Name</Field.Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Config"
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
            <SelectValueText placeholder="Select model" />
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

      <VStack gap={4} align="stretch" pt={2}>
        <Text fontWeight="medium" fontSize="sm">
          Sampler Settings
        </Text>

        <Field.Root>
          <HStack justify="space-between">
            <Field.Label>Temperature</Field.Label>
            <Text fontSize="sm" color="fg.muted">
              {temperature[0].toFixed(2)}
            </Text>
          </HStack>
          <Slider.Root
            value={temperature}
            onValueChange={(e) => setTemperature(e.value)}
            min={0}
            max={2}
            step={0.1}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>

        <Field.Root>
          <HStack justify="space-between">
            <Field.Label>Top P</Field.Label>
            <Text fontSize="sm" color="fg.muted">
              {topP[0].toFixed(2)}
            </Text>
          </HStack>
          <Slider.Root
            value={topP}
            onValueChange={(e) => setTopP(e.value)}
            min={0}
            max={1}
            step={0.05}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label>Max Tokens</Field.Label>
          <Input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            min={1}
            max={200000}
          />
        </Field.Root>

        <Field.Root>
          <HStack justify="space-between">
            <Field.Label>Frequency Penalty</Field.Label>
            <Text fontSize="sm" color="fg.muted">
              {frequencyPenalty[0].toFixed(2)}
            </Text>
          </HStack>
          <Slider.Root
            value={frequencyPenalty}
            onValueChange={(e) => setFrequencyPenalty(e.value)}
            min={-2}
            max={2}
            step={0.1}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>

        <Field.Root>
          <HStack justify="space-between">
            <Field.Label>Presence Penalty</Field.Label>
            <Text fontSize="sm" color="fg.muted">
              {presencePenalty[0].toFixed(2)}
            </Text>
          </HStack>
          <Slider.Root
            value={presencePenalty}
            onValueChange={(e) => setPresencePenalty(e.value)}
            min={-2}
            max={2}
            step={0.1}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
        </Field.Root>
      </VStack>

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

