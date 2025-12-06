import { useState } from "react";
import {
  Badge,
  Button,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useUnit } from "effector-react";
import { LuPlus, LuTrash2, LuStar } from "react-icons/lu";

import { presetsModel } from "@/entities/llm-config";
import type { ConfigPreset } from "@/entities/llm-config";
import { PresetForm } from "./preset-form";

interface PresetsSectionProps {
  userId: string;
}

export const PresetsSection = ({ userId }: PresetsSectionProps) => {
  const [showForm, setShowForm] = useState(false);

  const [presets, isLoading, removePreset, isDeleting] = useUnit([
    presetsModel.$presets,
    presetsModel.$presetsLoading,
    presetsModel.removePreset,
    presetsModel.$presetDeleting,
  ]);

  const handleDelete = (presetId: string) => {
    removePreset({ userId, presetId });
  };

  if (isLoading) {
    return (
      <VStack py={4}>
        <Spinner size="sm" />
        <Text color="fg.muted" fontSize="sm">
          Loading presets...
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {presets.length === 0 && !showForm ? (
        <Text color="fg.muted" fontSize="sm" textAlign="center" py={4}>
          No presets configured. Create one to combine your model
          configurations.
        </Text>
      ) : (
        <VStack gap={2} align="stretch">
          {presets.map((preset) => (
            <PresetItem
              key={preset.id}
              preset={preset}
              onDelete={() => handleDelete(preset.id)}
              isDeleting={isDeleting}
            />
          ))}
        </VStack>
      )}

      {showForm ? (
        <VStack gap={4} align="stretch" p={4} borderRadius="md" bg="bg.subtle">
          <Text fontWeight="medium">New Preset</Text>
          <PresetForm userId={userId} onSuccess={() => setShowForm(false)} />
          <Button variant="ghost" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </VStack>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <LuPlus />
          New Preset
        </Button>
      )}
    </VStack>
  );
};

interface PresetItemProps {
  preset: ConfigPreset;
  onDelete: () => void;
  isDeleting: boolean;
}

const PresetItem = ({ preset, onDelete, isDeleting }: PresetItemProps) => {
  const enabledModels = [
    preset.storytelling_enabled && "Storytelling",
    preset.rag_enabled && "RAG",
    preset.guard_enabled && "Guard",
  ].filter(Boolean);

  return (
    <HStack
      justify="space-between"
      p={3}
      borderRadius="md"
      bg="bg.subtle"
      _hover={{ bg: "bg.muted" }}
    >
      <VStack align="flex-start" gap={1}>
        <HStack>
          <Text fontWeight="medium">{preset.name}</Text>
          {preset.is_default && (
            <Badge colorPalette="yellow" size="sm">
              <LuStar size={10} />
              Default
            </Badge>
          )}
        </HStack>
        {preset.description && (
          <Text fontSize="xs" color="fg.muted">
            {preset.description}
          </Text>
        )}
        <HStack fontSize="xs" color="fg.muted" gap={2} flexWrap="wrap">
          <Badge size="sm" colorPalette="blue">
            Main
          </Badge>
          <Badge size="sm" colorPalette="purple">
            Embedding
          </Badge>
          {enabledModels.map((model) => (
            <Badge key={model} size="sm" colorPalette="green">
              {model}
            </Badge>
          ))}
        </HStack>
      </VStack>
      <IconButton
        aria-label="Delete preset"
        variant="ghost"
        colorPalette="red"
        size="sm"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <LuTrash2 />
      </IconButton>
    </HStack>
  );
};

