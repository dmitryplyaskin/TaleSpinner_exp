import { useUnit } from "effector-react";
import { useMemo, useState } from "react";
import {
  IconButton,
  HStack,
  Stack,
  Center,
  Spinner,
  Text,
  Input,
} from "@chakra-ui/react";
import { LuSave, LuCopy, LuTrash, LuPencil, LuPlus } from "react-icons/lu";
import { createListCollection, Field } from "@chakra-ui/react";

import { BlockCard } from "../parts/block-card";
import { ProviderSelect } from "../parts/provider-select";
import { ModelSelect } from "../parts/model-select";
import { TokenSelect } from "../parts/token-select";
import { ConnectionSettings } from "../parts/connection-settings";
import type { ConfigFormInstance } from "../../model/form-factory";
import type {
  EmbeddingConfig,
  EmbeddingConfigUpdate,
  ProviderType,
} from "@/entities/llm-config/types";
import { embeddingConfigsModel } from "@/entities/llm-config";
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

interface EmbeddingConfigBlockProps {
  title: string;
  form: ConfigFormInstance<EmbeddingConfig, EmbeddingConfigUpdate>;
  configId: string | null;
  onConfigChange: (newId: string) => void;
  onManageTokens?: (provider: ProviderType) => void;
}

export const EmbeddingConfigBlock = ({
  title,
  form,
  configId,
  onConfigChange,
  onManageTokens,
}: EmbeddingConfigBlockProps) => {
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
    embeddingConfigsModel.$embeddingConfigs,
    userModel.$currentUser,
  ]);
  const [createConfig, deleteConfig, updateConfig] = useUnit([
    embeddingConfigsModel.addEmbeddingConfig,
    embeddingConfigsModel.removeEmbeddingConfig,
    embeddingConfigsModel.editEmbeddingConfig,
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
    createConfig({
      userId: currentUser.id,
      data: {
        name: "New Embedding Config",
        provider: "ollama",
        model_id: "",
        token_ids: [],
        batch_size: 32,
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

  if (!config) {
    return (
      <BlockCard title={title} actions={renderActions()}>
        <Center p={4}>
          {configId ? <Spinner /> : <Text>Выберите конфигурацию</Text>}
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
                  value: parseInt(e.target.value) || null,
                })
              }
            />
          </Field.Root>
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
