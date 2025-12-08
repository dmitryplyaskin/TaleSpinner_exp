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
        {/* Provider */}
        <ProviderSelect
          value={config.provider}
          onChange={(p) => fieldChanged({ key: "provider", value: p })}
          filter={(p) => p.supports_llm}
        />

        {/* Connection Settings for OpenAI Compatible */}
        {config.provider === "openai_compatible" && (
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

        {/* Samplers */}
        <SamplerSettings
          temperature={config.sampler_settings.temperature}
          topP={config.sampler_settings.top_p}
          maxTokens={config.sampler_settings.max_tokens}
          frequencyPenalty={config.sampler_settings.frequency_penalty}
          presencePenalty={config.sampler_settings.presence_penalty}
          onChange={(k, v) => {
            fieldChanged({
              key: "sampler_settings",
              value: {
                ...config.sampler_settings,
                [k]: v,
              },
            });
          }}
        />
      </Stack>
    </BlockCard>
  );
};
