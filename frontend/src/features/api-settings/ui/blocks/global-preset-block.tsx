import { useUnit } from "effector-react";
import { useMemo, useState } from "react";
import { IconButton, HStack } from "@chakra-ui/react";
import { LuPlus, LuSave, LuCopy, LuTrash, LuPencil } from "react-icons/lu";
import { createListCollection } from "@chakra-ui/react";

import { presetsModel } from "@/entities/llm-config";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";

import {
  $activePresetId,
  $activePreset,
  setActivePresetId,
} from "../../model/api-settings-model";
import { BlockCard } from "../parts/block-card";
import { RenameDialog } from "../modals/rename-dialog";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { userModel } from "@/entities/user";

export const GlobalPresetBlock = () => {
  const [presets, activeId, activePreset, currentUser] = useUnit([
    presetsModel.$presets,
    $activePresetId,
    $activePreset,
    userModel.$currentUser,
  ]);
  const [setActive, updatePreset, deletePreset, createPreset] = useUnit([
    setActivePresetId,
    presetsModel.editPreset,
    presetsModel.removePreset,
    presetsModel.addPreset,
  ]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const collection = useMemo(() => {
    return createListCollection({
      items: presets,
      itemToString: (item) => item.name,
      itemToValue: (item) => item.id,
    });
  }, [presets]);

  const handleCreate = () => {
    // Create a default preset - we need at least one model config and embedding config
    // For simplicity, let's just show a toast for now since we need to create default configs first
    toaster.create({
      title: "Create new preset",
      description: "Please create model and embedding configs first",
      type: "info",
    });
  };

  const handleSave = () => {
    // Save is automatic on field changes, this button could trigger a manual save if needed
    toaster.create({
      title: "Changes are saved automatically",
      type: "success",
    });
  };

  const handleRename = () => {
    if (!activePreset) return;
    setRenameOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (!currentUser || !activeId) return;
    updatePreset({
      userId: currentUser.id,
      presetId: activeId,
      data: { name: newName },
    });
    toaster.create({ title: "Preset renamed", type: "success" });
  };

  const handleDuplicate = () => {
    if (!currentUser || !activePreset) return;

    // Create a copy with a new name
    const newName = `${activePreset.name} (Copy)`;
    createPreset({
      userId: currentUser.id,
      data: {
        name: newName,
        description: activePreset.description || undefined,
        main_model_config_id: activePreset.main_model_config_id,
        rag_model_config_id: activePreset.rag_model_config_id || undefined,
        rag_enabled: activePreset.rag_enabled,
        guard_model_config_id: activePreset.guard_model_config_id || undefined,
        guard_enabled: activePreset.guard_enabled,
        storytelling_model_config_id:
          activePreset.storytelling_model_config_id || undefined,
        storytelling_enabled: activePreset.storytelling_enabled,
        embedding_config_id: activePreset.embedding_config_id,
        fallback_strategy: activePreset.fallback_strategy,
      },
    });
    toaster.create({ title: "Preset duplicated", type: "success" });
  };

  const handleDelete = () => {
    if (!activePreset) return;
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!currentUser || !activeId) return;
    deletePreset({ userId: currentUser.id, presetId: activeId });
    toaster.create({ title: "Preset deleted", type: "success" });
  };

  return (
    <>
      <BlockCard
        title="Глобальный пресет"
        actions={
          <HStack gap={1}>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleCreate}
              aria-label="New"
              title="Create new preset"
            >
              <LuPlus />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleSave}
              aria-label="Save"
              title="Save (auto-saved)"
            >
              <LuSave />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleRename}
              aria-label="Rename"
              disabled={!activePreset}
              title="Rename preset"
            >
              <LuPencil />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleDuplicate}
              aria-label="Duplicate"
              disabled={!activePreset}
              title="Duplicate preset"
            >
              <LuCopy />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleDelete}
              aria-label="Delete"
              disabled={!activePreset || presets.length <= 1}
              title="Delete preset"
            >
              <LuTrash />
            </IconButton>
          </HStack>
        }
      >
        <SelectRoot
          collection={collection}
          value={activeId ? [activeId] : []}
          onValueChange={(e) => setActive(e.value[0])}
          size="sm"
        >
          <SelectLabel>Пресет</SelectLabel>
          <SelectTrigger>
            <SelectValueText placeholder="Выберите пресет" />
          </SelectTrigger>
          <SelectContent>
            {collection.items.map((preset) => (
              <SelectItem key={preset.id} item={preset}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </BlockCard>

      {activePreset && (
        <>
          <RenameDialog
            open={renameOpen}
            onOpenChange={setRenameOpen}
            currentName={activePreset.name}
            onConfirm={handleRenameConfirm}
            title="Rename Preset"
          />

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete Preset"
            message={`Are you sure you want to delete "${activePreset.name}"?`}
            onConfirm={handleDeleteConfirm}
            confirmText="Delete"
            colorPalette="red"
          />
        </>
      )}
    </>
  );
};
