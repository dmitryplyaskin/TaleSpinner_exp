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

import { tokensModel } from "@/entities/llm-config";
import type { Token } from "@/entities/llm-config";
import { TokenForm } from "./token-form";

interface TokensSectionProps {
  userId: string;
}

export const TokensSection = ({ userId }: TokensSectionProps) => {
  const [showForm, setShowForm] = useState(false);

  const [tokens, isLoading, removeToken, isDeleting] = useUnit([
    tokensModel.$tokens,
    tokensModel.$tokensLoading,
    tokensModel.removeToken,
    tokensModel.$tokenDeleting,
  ]);

  const handleDelete = (tokenId: string) => {
    removeToken({ userId, tokenId });
  };

  if (isLoading) {
    return (
      <VStack py={4}>
        <Spinner size="sm" />
        <Text color="fg.muted" fontSize="sm">
          Loading tokens...
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {tokens.length === 0 && !showForm ? (
        <Text color="fg.muted" fontSize="sm" textAlign="center" py={4}>
          No API tokens configured. Add one to get started.
        </Text>
      ) : (
        <VStack gap={2} align="stretch">
          {tokens.map((token) => (
            <TokenItem
              key={token.id}
              token={token}
              onDelete={() => handleDelete(token.id)}
              isDeleting={isDeleting}
            />
          ))}
        </VStack>
      )}

      {showForm ? (
        <VStack gap={4} align="stretch" p={4} borderRadius="md" bg="bg.subtle">
          <Text fontWeight="medium">Add New Token</Text>
          <TokenForm userId={userId} onSuccess={() => setShowForm(false)} />
          <Button variant="ghost" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </VStack>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <LuPlus />
          Add Token
        </Button>
      )}
    </VStack>
  );
};

interface TokenItemProps {
  token: Token;
  onDelete: () => void;
  isDeleting: boolean;
}

const TokenItem = ({ token, onDelete, isDeleting }: TokenItemProps) => {
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
          <Text fontWeight="medium">{token.name}</Text>
          <Badge colorPalette={token.is_active ? "green" : "gray"} size="sm">
            {token.is_active ? "Active" : "Inactive"}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          Provider: {token.provider}
        </Text>
      </VStack>
      <IconButton
        aria-label="Delete token"
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

