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

import { embeddingConfigsModel } from "@/entities/llm-config";
import type { EmbeddingConfig } from "@/entities/llm-config";
import { EmbeddingConfigForm } from "./embedding-config-form";

interface EmbeddingConfigsSectionProps {
  userId: string;
}

export const EmbeddingConfigsSection = ({
  userId,
}: EmbeddingConfigsSectionProps) => {
  const [showForm, setShowForm] = useState(false);

  const [configs, isLoading, removeConfig, isDeleting] = useUnit([
    embeddingConfigsModel.$embeddingConfigs,
    embeddingConfigsModel.$embeddingConfigsLoading,
    embeddingConfigsModel.removeEmbeddingConfig,
    embeddingConfigsModel.$embeddingConfigDeleting,
  ]);

  const handleDelete = (configId: string) => {
    removeConfig({ userId, configId });
  };

  if (isLoading) {
    return (
      <VStack py={4}>
        <Spinner size="sm" />
        <Text color="fg.muted" fontSize="sm">
          Loading embedding configurations...
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {configs.length === 0 && !showForm ? (
        <Text color="fg.muted" fontSize="sm" textAlign="center" py={4}>
          No embedding configurations yet. Create one to get started.
        </Text>
      ) : (
        <VStack gap={2} align="stretch">
          {configs.map((config) => (
            <EmbeddingConfigItem
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
          <Text fontWeight="medium">New Embedding Configuration</Text>
          <EmbeddingConfigForm
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

interface EmbeddingConfigItemProps {
  config: EmbeddingConfig;
  onDelete: () => void;
  isDeleting: boolean;
}

const EmbeddingConfigItem = ({
  config,
  onDelete,
  isDeleting,
}: EmbeddingConfigItemProps) => {
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
          <Badge colorPalette="purple" size="sm">
            {config.provider}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          Model: {config.model_id}
        </Text>
        <HStack fontSize="xs" color="fg.muted" gap={3}>
          {config.dimensions && <Text>Dim: {config.dimensions}</Text>}
          <Text>Batch: {config.batch_size}</Text>
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
