import { useState } from "react";
import {
  Button,
  Checkbox,
  Field,
  HStack,
  Input,
  Textarea,
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
import type { ConfigPresetCreate } from "@/entities/llm-config";
import {
  modelConfigsModel,
  embeddingConfigsModel,
  presetsModel,
} from "@/entities/llm-config";

interface PresetFormProps {
  userId: string;
  onSuccess?: () => void;
}

export const PresetForm = ({ userId, onSuccess }: PresetFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [mainModelConfigId, setMainModelConfigId] = useState("");
  const [embeddingConfigId, setEmbeddingConfigId] = useState("");

  const [ragEnabled, setRagEnabled] = useState(false);
  const [ragModelConfigId, setRagModelConfigId] = useState("");

  const [guardEnabled, setGuardEnabled] = useState(false);
  const [guardModelConfigId, setGuardModelConfigId] = useState("");

  const [storytellingEnabled, setStorytellingEnabled] = useState(false);
  const [storytellingModelConfigId, setStorytellingModelConfigId] =
    useState("");

  const [modelConfigs, embeddingConfigs, addPreset, isSaving] = useUnit([
    modelConfigsModel.$modelConfigs,
    embeddingConfigsModel.$embeddingConfigs,
    presetsModel.addPreset,
    presetsModel.$presetSaving,
  ]);

  const modelConfigCollection = createListCollection({
    items: modelConfigs.map((c) => ({
      label: `${c.name} (${c.provider})`,
      value: c.id,
    })),
  });

  const embeddingConfigCollection = createListCollection({
    items: embeddingConfigs.map((c) => ({
      label: `${c.name} (${c.provider})`,
      value: c.id,
    })),
  });

  const handleSubmit = () => {
    if (!name.trim() || !mainModelConfigId || !embeddingConfigId) return;

    const data: ConfigPresetCreate = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      main_model_config_id: mainModelConfigId,
      embedding_config_id: embeddingConfigId,
      rag_enabled: ragEnabled,
      rag_model_config_id: ragEnabled
        ? ragModelConfigId || undefined
        : undefined,
      guard_enabled: guardEnabled,
      guard_model_config_id: guardEnabled
        ? guardModelConfigId || undefined
        : undefined,
      storytelling_enabled: storytellingEnabled,
      storytelling_model_config_id: storytellingEnabled
        ? storytellingModelConfigId || undefined
        : undefined,
    };

    addPreset({ userId, data });
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsDefault(false);
    setMainModelConfigId("");
    setEmbeddingConfigId("");
    setRagEnabled(false);
    setRagModelConfigId("");
    setGuardEnabled(false);
    setGuardModelConfigId("");
    setStorytellingEnabled(false);
    setStorytellingModelConfigId("");
  };

  const isValid = name.trim() && mainModelConfigId && embeddingConfigId;

  const hasModelConfigs = modelConfigs.length > 0;
  const hasEmbeddingConfigs = embeddingConfigs.length > 0;

  if (!hasModelConfigs || !hasEmbeddingConfigs) {
    return (
      <VStack py={4} gap={2}>
        <Text color="fg.muted" fontSize="sm" textAlign="center">
          {!hasModelConfigs && !hasEmbeddingConfigs
            ? "You need to create at least one Model Configuration and one Embedding Configuration before creating a preset."
            : !hasModelConfigs
            ? "You need to create at least one Model Configuration before creating a preset."
            : "You need to create at least one Embedding Configuration before creating a preset."}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      <Field.Root>
        <Field.Label>Preset Name</Field.Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Preset"
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Description (optional)</Field.Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description of this preset..."
          rows={2}
        />
      </Field.Root>

      <Checkbox.Root
        checked={isDefault}
        onCheckedChange={(e) => setIsDefault(!!e.checked)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Set as default preset</Checkbox.Label>
      </Checkbox.Root>

      <VStack gap={4} align="stretch" pt={2}>
        <Text fontWeight="medium" fontSize="sm">
          Required Configurations
        </Text>

        <Field.Root>
          <Field.Label>Main Model Configuration *</Field.Label>
          <SelectRoot
            collection={modelConfigCollection}
            value={mainModelConfigId ? [mainModelConfigId] : []}
            onValueChange={(e) => setMainModelConfigId(e.value[0])}
          >
            <SelectTrigger>
              <SelectValueText placeholder="Select main model" />
            </SelectTrigger>
            <SelectContent>
              {modelConfigCollection.items.map((item) => (
                <SelectItem key={item.value} item={item}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Field.Root>

        <Field.Root>
          <Field.Label>Embedding Configuration *</Field.Label>
          <SelectRoot
            collection={embeddingConfigCollection}
            value={embeddingConfigId ? [embeddingConfigId] : []}
            onValueChange={(e) => setEmbeddingConfigId(e.value[0])}
          >
            <SelectTrigger>
              <SelectValueText placeholder="Select embedding config" />
            </SelectTrigger>
            <SelectContent>
              {embeddingConfigCollection.items.map((item) => (
                <SelectItem key={item.value} item={item}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </Field.Root>
      </VStack>

      <VStack gap={4} align="stretch" pt={2}>
        <Text fontWeight="medium" fontSize="sm">
          Optional Model Configurations
        </Text>

        <VStack align="stretch" gap={2}>
          <Checkbox.Root
            checked={storytellingEnabled}
            onCheckedChange={(e) => setStorytellingEnabled(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Enable Storytelling Model</Checkbox.Label>
          </Checkbox.Root>
          {storytellingEnabled && (
            <SelectRoot
              collection={modelConfigCollection}
              value={
                storytellingModelConfigId ? [storytellingModelConfigId] : []
              }
              onValueChange={(e) => setStorytellingModelConfigId(e.value[0])}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select storytelling model" />
              </SelectTrigger>
              <SelectContent>
                {modelConfigCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )}
        </VStack>

        <VStack align="stretch" gap={2}>
          <Checkbox.Root
            checked={ragEnabled}
            onCheckedChange={(e) => setRagEnabled(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Enable RAG Model</Checkbox.Label>
          </Checkbox.Root>
          {ragEnabled && (
            <SelectRoot
              collection={modelConfigCollection}
              value={ragModelConfigId ? [ragModelConfigId] : []}
              onValueChange={(e) => setRagModelConfigId(e.value[0])}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select RAG model" />
              </SelectTrigger>
              <SelectContent>
                {modelConfigCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )}
        </VStack>

        <VStack align="stretch" gap={2}>
          <Checkbox.Root
            checked={guardEnabled}
            onCheckedChange={(e) => setGuardEnabled(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Enable Guard Model</Checkbox.Label>
          </Checkbox.Root>
          {guardEnabled && (
            <SelectRoot
              collection={modelConfigCollection}
              value={guardModelConfigId ? [guardModelConfigId] : []}
              onValueChange={(e) => setGuardModelConfigId(e.value[0])}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select guard model" />
              </SelectTrigger>
              <SelectContent>
                {modelConfigCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          )}
        </VStack>
      </VStack>

      <HStack justify="flex-end" pt={2}>
        <Button
          colorPalette="brand"
          onClick={handleSubmit}
          disabled={!isValid}
          loading={isSaving}
        >
          Create Preset
        </Button>
      </HStack>
    </VStack>
  );
};

