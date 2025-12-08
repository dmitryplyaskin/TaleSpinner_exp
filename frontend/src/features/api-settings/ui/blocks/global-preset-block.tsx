import { useUnit } from "effector-react";
import { useMemo, useState, useEffect } from "react";
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
  const [setActive, updatePreset, deletePreset, createPreset, createDefault] =
    useUnit([
      setActivePresetId,
      presetsModel.editPreset,
      presetsModel.removePreset,
      presetsModel.addPreset,
      presetsModel.addDefaultPreset,
    ]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDuplicateName, setPendingDuplicateName] = useState<
    string | null
  >(null);

  const collection = useMemo(() => {
    return createListCollection({
      items: presets,
      itemToString: (item) => item.name,
      itemToValue: (item) => item.id,
    });
  }, [presets]);

  // Select duplicated preset after creation
  useEffect(() => {
    if (pendingDuplicateName && presets.length > 0) {
      const duplicatedPreset = presets.find(
        (p) => p.name === pendingDuplicateName
      );
      if (duplicatedPreset) {
        setActive(duplicatedPreset.id);
        setPendingDuplicateName(null);
      }
    }
  }, [presets, pendingDuplicateName, setActive]);

  const handleCreate = () => {
    if (!currentUser) return;
    createDefault({ userId: currentUser.id });
    toaster.create({
      title: "Creating default preset...",
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
    setPendingDuplicateName(newName);
    createPreset({
      userId: currentUser.id,
      data: {
        name: newName,
        description: activePreset.description || undefined,
        config_data: activePreset.config_data,
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
              title={
                presets.length <= 1
                  ? "Cannot delete the last preset"
                  : "Delete preset"
              }
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

          <SelectContent portalled={false}>
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
