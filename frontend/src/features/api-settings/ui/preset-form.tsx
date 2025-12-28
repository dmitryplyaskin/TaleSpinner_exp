import { useState } from "react";
import {
  Button,
  Checkbox,
  Field,
  HStack,
  Input,
  Textarea,
  VStack,
  Text,
} from "@chakra-ui/react";
import { useUnit } from "effector-react";
import type {
  ConfigPresetCreate,
  GlobalConfigSchema,
} from "@/entities/llm-config";
import { presetsModel } from "@/entities/llm-config";

interface PresetFormProps {
  userId: string;
  onSuccess?: () => void;
}

// Helper to create default config_data structure
const createDefaultConfigData = (): GlobalConfigSchema => ({
  main_model: {
    provider: "openrouter",
    model_id: "",
    token_ids: [],
    token_selection_strategy: "failover",
    sampler_settings: {
      temperature: 0.7,
      top_p: 1.0,
      top_k: null,
      max_tokens: 4096,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop_sequences: [],
    },
    provider_settings: {},
    base_url: null,
    http_headers: {},
  },
  rag: {
    enabled: false,
    config: null,
  },
  guard: {
    enabled: false,
    config: null,
  },
  storytelling: {
    enabled: false,
    config: null,
  },
  embedding: {
    provider: "ollama",
    model_id: "",
    token_ids: [],
    dimensions: null,
    batch_size: 100,
    provider_settings: {},
    base_url: null,
    http_headers: {},
  },
});

export const PresetForm = ({ userId, onSuccess }: PresetFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [addPreset, isSaving] = useUnit([
    presetsModel.addPreset,
    presetsModel.$presetSaving,
  ]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const data: ConfigPresetCreate = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      config_data: createDefaultConfigData(),
    };

    addPreset({ userId, data });
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsDefault(false);
  };

  const isValid = name.trim();

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

      <Text color="fg.muted" fontSize="sm">
        A new preset will be created with default configuration. You can edit
        all settings after creation.
      </Text>

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
