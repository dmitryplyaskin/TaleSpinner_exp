import { useUnit } from "effector-react";
import { useMemo, useState, useEffect } from "react";
import { IconButton, HStack, Alert, VStack } from "@chakra-ui/react";
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
  $hasUnsavedChanges,
  setActivePresetId,
  saveAllForms,
  resetAllForms,
} from "../../model/api-settings-model";
import { BlockCard } from "../parts/block-card";
import { RenameDialog } from "../modals/rename-dialog";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { userModel } from "@/entities/user";

export const GlobalPresetBlock = () => {
  const [presets, activeId, activePreset, currentUser, hasUnsavedChanges] =
    useUnit([
      presetsModel.$presets,
      $activePresetId,
      $activePreset,
      userModel.$currentUser,
      $hasUnsavedChanges,
    ]);
  const [
    setActive,
    updatePreset,
    deletePreset,
    createPreset,
    createDefault,
    saveAll,
    resetAll,
  ] = useUnit([
    setActivePresetId,
    presetsModel.editPreset,
    presetsModel.removePreset,
    presetsModel.addPreset,
    presetsModel.addDefaultPreset,
    saveAllForms,
    resetAllForms,
  ]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [switchPresetOpen, setSwitchPresetOpen] = useState(false);
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
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
    if (!hasUnsavedChanges) {
      toaster.create({
        title: "Нет изменений для сохранения",
        type: "info",
      });
      return;
    }

    saveAll();
    toaster.create({
      title: "Сохранение изменений...",
      type: "info",
    });
  };

  const handlePresetSwitch = (newPresetId: string) => {
    if (hasUnsavedChanges) {
      setPendingPresetId(newPresetId);
      setSwitchPresetOpen(true);
    } else {
      setActive(newPresetId);
    }
  };

  const handleSwitchConfirm = () => {
    if (pendingPresetId) {
      // Reset all forms before switching
      resetAll();
      setActive(pendingPresetId);
      setPendingPresetId(null);
      setSwitchPresetOpen(false);
    }
  };

  const handleSwitchCancel = () => {
    setPendingPresetId(null);
    setSwitchPresetOpen(false);
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
              disabled={!hasUnsavedChanges}
              colorPalette={hasUnsavedChanges ? "blue" : undefined}
              aria-label="Save"
              title="Сохранить изменения"
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
        <VStack gap={3} align="stretch">
          <SelectRoot
            collection={collection}
            value={activeId ? [activeId] : []}
            onValueChange={(e) => handlePresetSwitch(e.value[0])}
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

          {hasUnsavedChanges && (
            <Alert.Root status="warning" variant="subtle">
              <Alert.Indicator />
              <Alert.Title>
                Пресет требует сохранения, иначе данные будут утеряны после
                перезагрузки или смены пресета
              </Alert.Title>
            </Alert.Root>
          )}
        </VStack>
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

          <ConfirmDialog
            open={switchPresetOpen}
            onOpenChange={setSwitchPresetOpen}
            title="Несохраненные изменения"
            message="У вас есть несохраненные изменения. При смене пресета они будут утеряны. Продолжить?"
            onConfirm={handleSwitchConfirm}
            onCancel={handleSwitchCancel}
            confirmText="Продолжить"
            cancelText="Отмена"
            colorPalette="orange"
          />
        </>
      )}
    </>
  );
};
