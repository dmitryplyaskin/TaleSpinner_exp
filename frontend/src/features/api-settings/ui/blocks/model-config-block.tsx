import { useUnit } from "effector-react";
import { useMemo, useState } from "react";
import {
  IconButton,
  HStack,
  Stack,
  Center,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Switch } from "@chakra-ui/react";
import { LuSave, LuCopy, LuTrash, LuPencil, LuPlus } from "react-icons/lu";
import { createListCollection } from "@chakra-ui/react";

import { BlockCard } from "../parts/block-card";
import { ProviderSelect } from "../parts/provider-select";
import { ModelSelect } from "../parts/model-select";
import { TokenSelect } from "../parts/token-select";
import { ConnectionSettings } from "../parts/connection-settings";
import { SamplerSettings } from "../parts/sampler-settings";
import type { ConfigFormInstance } from "../../model/form-factory";
import type {
  ModelConfig,
  ModelConfigUpdate,
  ProviderType,
} from "@/entities/llm-config/types";
import { modelConfigsModel } from "@/entities/llm-config";
import { RenameDialog } from "../modals/rename-dialog";
import { ConfirmDialog } from "../modals/confirm-dialog";

import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import { userModel } from "@/entities/user";

interface ModelConfigBlockProps {
  title: string;
  form: ConfigFormInstance<ModelConfig, ModelConfigUpdate>;
  configId: string | null;
  onConfigChange: (newId: string) => void;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  onManageTokens?: (provider: ProviderType) => void;
}

export const ModelConfigBlock = ({
  title,
  form,
  configId,
  onConfigChange,
  enabled = true,
  onToggle,
  onManageTokens,
}: ModelConfigBlockProps) => {
  const [config, isDirty, saveStatus] = useUnit([
    form.$config,
    form.$isDirty,
    form.$saveStatus,
  ]);
  const [fieldChanged, save, duplicate] = useUnit([
    form.fieldChanged,
    form.saveTriggered,
    form.duplicateTriggered,
  ]);

  const [allConfigs, currentUser] = useUnit([
    modelConfigsModel.$modelConfigs,
    userModel.$currentUser,
  ]);
  const [createConfig, deleteConfig, updateConfig] = useUnit([
    modelConfigsModel.addModelConfig,
    modelConfigsModel.removeModelConfig,
    modelConfigsModel.editModelConfig,
  ]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const configCollection = useMemo(() => {
    return createListCollection({
      items: allConfigs,
      itemToString: (item) => item.name,
      itemToValue: (item) => item.id,
    });
  }, [allConfigs]);

  const handleCreate = () => {
    if (!currentUser) return;
    // Create a minimal default config
    createConfig({
      userId: currentUser.id,
      data: {
        name: `New ${title} Config`,
        provider: "openrouter",
        model_id: "",
        token_ids: [],
      },
    });
    toaster.create({ title: "Config created", type: "success" });
  };

  const handleSave = () => {
    save();
  };

  const handleRename = () => {
    if (!config) return;
    setRenameOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (!currentUser || !config) return;
    updateConfig({
      userId: currentUser.id,
      configId: config.id,
      data: { name: newName },
    });
    toaster.create({ title: "Config renamed", type: "success" });
  };

  const handleDuplicate = () => {
    if (!config) return;
    const newName = `${config.name} (Copy)`;
    duplicate(newName);
    toaster.create({ title: "Config duplicated", type: "success" });
  };

  const handleDelete = () => {
    if (!config) return;
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!currentUser || !config) return;
    deleteConfig({ userId: currentUser.id, configId: config.id });
    toaster.create({ title: "Config deleted", type: "success" });
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
        onClick={handleCreate}
        aria-label="New"
        title="Create new config"
      >
        <LuPlus />
      </IconButton>
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
      <IconButton
        size="xs"
        variant="ghost"
        onClick={handleRename}
        disabled={!config}
        aria-label="Rename"
        title="Rename config"
      >
        <LuPencil />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        onClick={handleDuplicate}
        disabled={!config}
        aria-label="Duplicate"
        title="Duplicate config"
      >
        <LuCopy />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        onClick={handleDelete}
        disabled={!config}
        aria-label="Delete"
        title="Delete config"
      >
        <LuTrash />
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

  if (!config) {
    return (
      <BlockCard title={title} actions={renderActions()}>
        <Center p={4}>
          {configId ? (
            <Spinner />
          ) : (
            <Text color="fg.muted">Пресет не выбран или не настроен</Text>
          )}
        </Center>
      </BlockCard>
    );
  }

  return (
    <>
      <BlockCard title={title} actions={renderActions()}>
        <Stack gap={4}>
          {/* Config Select */}
          <SelectRoot
            collection={configCollection}
            value={configId ? [configId] : []}
            onValueChange={(e) => onConfigChange(e.value[0])}
            size="sm"
          >
            <SelectLabel>Пресет конфигурации</SelectLabel>
            <SelectTrigger>
              <SelectValueText placeholder="Выберите конфигурацию" />
            </SelectTrigger>
            <SelectContent>
              {configCollection.items.map((item) => (
                <SelectItem key={item.id} item={item}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>

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
              onBaseUrlChange={(v) =>
                fieldChanged({ key: "base_url", value: v })
              }
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
            temperature={config.temperature}
            topP={config.top_p}
            maxTokens={config.max_tokens}
            frequencyPenalty={config.frequency_penalty}
            presencePenalty={config.presence_penalty}
            onChange={(k, v) =>
              fieldChanged({ key: k as keyof ModelConfig, value: v })
            }
          />
        </Stack>
      </BlockCard>

      {config && (
        <>
          <RenameDialog
            open={renameOpen}
            onOpenChange={setRenameOpen}
            currentName={config.name}
            onConfirm={handleRenameConfirm}
            title="Rename Config"
          />

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete Config"
            message={`Are you sure you want to delete "${config.name}"?`}
            onConfirm={handleDeleteConfirm}
            confirmText="Delete"
            colorPalette="red"
          />
        </>
      )}
    </>
  );
};
