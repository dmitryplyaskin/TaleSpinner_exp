import { useUnit } from "effector-react";
import { IconButton, HStack, Stack, Center, Text } from "@chakra-ui/react";
import { Switch } from "@chakra-ui/react";
import { LuSave } from "react-icons/lu";

import { BlockCard } from "../parts/block-card";
import { ProviderSelect } from "../parts/provider-select";
import { ModelSelect } from "../parts/model-select";
import { TokenSelect } from "../parts/token-select";
import { ConnectionSettings } from "../parts/connection-settings";
import { SamplerSettings } from "../parts/sampler-settings";
import type { ConfigDataFormInstance } from "../../model/form-factory";
import type { LLMConfigData, ProviderType } from "@/entities/llm-config/types";
import {
  $activePreset,
  updateActivePreset,
} from "../../model/api-settings-model";

interface ModelConfigBlockProps {
  title: string;
  form: ConfigDataFormInstance<LLMConfigData>;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  onManageTokens?: (provider: ProviderType) => void;
}

export const ModelConfigBlock = ({
  title,
  form,
  enabled = true,
  onToggle,
  onManageTokens,
}: ModelConfigBlockProps) => {
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
      {onToggle && (
        <Switch.Root
          checked={enabled}
          onCheckedChange={(e) => onToggle(!!e.checked)}
          size="sm"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Включить</Switch.Label>
        </Switch.Root>
      )}

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

  if (!enabled) {
    return (
      <BlockCard title={title} actions={renderActions()} variant="subtle">
        <Text color="fg.muted" fontSize="sm">
          Эта модель отключена в текущем пресете.
        </Text>
      </BlockCard>
    );
  }

  // For optional blocks (with onToggle), show form even if config is null
  // For main model (without onToggle), require both config and activePreset
  if (!activePreset) {
    return (
      <BlockCard title={title} actions={renderActions()}>
        <Center p={4}>
          <Text color="fg.muted">Пресет не выбран или не настроен</Text>
        </Center>
      </BlockCard>
    );
  }

  // If config is null but block is enabled (optional block), use default values for display
  const displayConfig = config || {
    provider: "openrouter" as const,
    model_id: "",
    token_ids: [],
    token_selection_strategy: "failover" as const,
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
  };

  return (
    <BlockCard title={title} actions={renderActions()}>
      <Stack gap={4}>
        {/* Provider */}
        <ProviderSelect
          value={displayConfig.provider}
          onChange={(p) => fieldChanged({ key: "provider", value: p })}
          filter={(p) => p.supports_llm}
        />

        {/* Connection Settings for OpenAI Compatible */}
        {displayConfig.provider === "openai_compatible" && (
          <ConnectionSettings
            baseUrl={displayConfig.base_url}
            headers={displayConfig.http_headers}
            onBaseUrlChange={(v) => fieldChanged({ key: "base_url", value: v })}
            onHeadersChange={(v) =>
              fieldChanged({ key: "http_headers", value: v })
            }
          />
        )}

        {/* Model Select */}
        <ModelSelect
          provider={displayConfig.provider}
          baseUrl={displayConfig.base_url}
          value={displayConfig.model_id}
          onChange={(v) => fieldChanged({ key: "model_id", value: v })}
        />

        {/* Token */}
        <TokenSelect
          provider={displayConfig.provider}
          value={displayConfig.token_ids}
          onChange={(v) => fieldChanged({ key: "token_ids", value: v })}
          onManageTokens={() =>
            displayConfig.provider && onManageTokens?.(displayConfig.provider)
          }
        />

        {/* Samplers */}
        <SamplerSettings
          temperature={displayConfig.sampler_settings.temperature}
          topP={displayConfig.sampler_settings.top_p}
          maxTokens={displayConfig.sampler_settings.max_tokens}
          frequencyPenalty={displayConfig.sampler_settings.frequency_penalty}
          presencePenalty={displayConfig.sampler_settings.presence_penalty}
          onChange={(k, v) => {
            fieldChanged({
              key: "sampler_settings",
              value: {
                ...displayConfig.sampler_settings,
                [k]: v,
              },
            });
          }}
        />
      </Stack>
    </BlockCard>
  );
};
