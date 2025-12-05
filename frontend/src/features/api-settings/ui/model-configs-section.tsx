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
import { LuPlus, LuTrash2 } from "react-icons/lu";

import { modelConfigsModel } from "@/entities/llm-config";
import type { ModelConfig } from "@/entities/llm-config";
import { ModelConfigForm } from "./model-config-form";

interface ModelConfigsSectionProps {
  userId: string;
}

export const ModelConfigsSection = ({ userId }: ModelConfigsSectionProps) => {
  const [showForm, setShowForm] = useState(false);

  const [configs, isLoading, removeConfig, isDeleting] = useUnit([
    modelConfigsModel.$modelConfigs,
    modelConfigsModel.$modelConfigsLoading,
    modelConfigsModel.removeModelConfig,
    modelConfigsModel.$modelConfigDeleting,
  ]);

  const handleDelete = (configId: string) => {
    removeConfig({ userId, configId });
  };

  if (isLoading) {
    return (
      <VStack py={4}>
        <Spinner size="sm" />
        <Text color="fg.muted" fontSize="sm">
          Loading model configurations...
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {configs.length === 0 && !showForm ? (
        <Text color="fg.muted" fontSize="sm" textAlign="center" py={4}>
          No model configurations yet. Create one to get started.
        </Text>
      ) : (
        <VStack gap={2} align="stretch">
          {configs.map((config) => (
            <ModelConfigItem
              key={config.id}
              config={config}
              onDelete={() => handleDelete(config.id)}
              isDeleting={isDeleting}
            />
          ))}
        </VStack>
      )}

      {showForm ? (
        <VStack gap={4} align="stretch" p={4} borderRadius="md" bg="bg.subtle">
          <Text fontWeight="medium">New Model Configuration</Text>
          <ModelConfigForm
            userId={userId}
            onSuccess={() => setShowForm(false)}
          />
          <Button variant="ghost" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </VStack>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <LuPlus />
          New Configuration
        </Button>
      )}
    </VStack>
  );
};

interface ModelConfigItemProps {
  config: ModelConfig;
  onDelete: () => void;
  isDeleting: boolean;
}

const ModelConfigItem = ({
  config,
  onDelete,
  isDeleting,
}: ModelConfigItemProps) => {
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
          <Text fontWeight="medium">{config.name}</Text>
          <Badge colorPalette="blue" size="sm">
            {config.provider}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          Model: {config.model_id}
        </Text>
        <HStack fontSize="xs" color="fg.muted" gap={3}>
          <Text>T: {config.temperature}</Text>
          <Text>Top P: {config.top_p}</Text>
          <Text>Max: {config.max_tokens}</Text>
        </HStack>
      </VStack>
      <IconButton
        aria-label="Delete configuration"
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
