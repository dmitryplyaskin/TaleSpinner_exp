import { useUnit } from "effector-react";
import {
  IconButton,
  HStack,
  Stack,
  Center,
  Text,
  Input,
} from "@chakra-ui/react";
import { LuSave } from "react-icons/lu";
import { Field } from "@chakra-ui/react";

import { BlockCard } from "../parts/block-card";
import { ProviderSelect } from "../parts/provider-select";
import { ModelSelect } from "../parts/model-select";
import { TokenSelect } from "../parts/token-select";
import { ConnectionSettings } from "../parts/connection-settings";
import type { ConfigDataFormInstance } from "../../model/form-factory";
import type {
  EmbeddingConfigData,
  ProviderType,
} from "@/entities/llm-config/types";
import { $activePreset } from "../../model/api-settings-model";

interface EmbeddingConfigBlockProps {
  title: string;
  form: ConfigDataFormInstance<EmbeddingConfigData>;
  onManageTokens?: (provider: ProviderType) => void;
}

export const EmbeddingConfigBlock = ({
  title,
  form,
  onManageTokens,
}: EmbeddingConfigBlockProps) => {
  const [config, isDirty, saveStatus] = useUnit([
    form.$config,
    form.$isDirty,
    form.$saveStatus,
  ]);
  const [fieldChanged, save] = useUnit([form.fieldChanged, form.saveTriggered]);

  const activePreset = useUnit($activePreset);

  const handleSave = () => {
    save();
  };

  const renderActions = () => (
    <HStack gap={1}>
      <IconButton
        size="xs"
        variant="ghost"
        onClick={handleSave}
        disabled={!isDirty}
        loading={saveStatus === "saving"}
        colorPalette={isDirty ? "blue" : undefined}
        aria-label="Save"
        title="Save changes"
      >
        <LuSave />
      </IconButton>
    </HStack>
  );

  if (!config || !activePreset) {
    return (
      <BlockCard title={title} actions={renderActions()}>
        <Center p={4}>
          <Text color="fg.muted">Пресет не выбран или не настроен</Text>
        </Center>
      </BlockCard>
    );
  }

  return (
    <BlockCard title={title} actions={renderActions()}>
      <Stack gap={4}>
        {/* Provider - supports embedding */}
        <ProviderSelect
          value={config.provider}
          onChange={(p) => fieldChanged({ key: "provider", value: p })}
          filter={(p) => p.supports_embedding}
        />

        {/* Connection Settings for OpenAI Compatible or Ollama (if needed for remote) */}
        {(config.provider === "openai_compatible" ||
          config.provider === "ollama") && (
          <ConnectionSettings
            baseUrl={config.base_url}
            headers={config.http_headers}
            onBaseUrlChange={(v) => fieldChanged({ key: "base_url", value: v })}
            onHeadersChange={(v) =>
              fieldChanged({ key: "http_headers", value: v })
            }
          />
        )}

        {/* Model Select */}
        <ModelSelect
          provider={config.provider}
          baseUrl={config.base_url}
          value={config.model_id}
          onChange={(v) => fieldChanged({ key: "model_id", value: v })}
          modelType="embedding"
        />

        {/* Token */}
        <TokenSelect
          provider={config.provider}
          value={config.token_ids}
          onChange={(v) => fieldChanged({ key: "token_ids", value: v })}
          onManageTokens={() =>
            config.provider && onManageTokens?.(config.provider)
          }
        />

        {/* Embedding Specifics */}
        <Field.Root>
          <Field.Label>Размер батча</Field.Label>
          <Input
            type="number"
            value={config.batch_size}
            onChange={(e) =>
              fieldChanged({
                key: "batch_size",
                value: parseInt(e.target.value) || 1,
              })
            }
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Размерность</Field.Label>
          <Input
            type="number"
            value={config.dimensions || ""}
            placeholder="Опционально (например, 1536)"
            onChange={(e) =>
              fieldChanged({
                key: "dimensions",
                value: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
        </Field.Root>
      </Stack>
    </BlockCard>
  );
};
