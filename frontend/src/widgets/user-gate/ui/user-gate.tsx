import { useEffect, useState } from "react";

import {
  Button,
  Center,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useUnit } from "effector-react";

import { GlassCard } from "@/components/ui/glass-card";
import { userModel } from "@/entities/user";
import { CreateUserForm } from "@/features/create-user";
import { SelectUser } from "@/features/select-user";

interface UserGateProps {
  children: React.ReactNode;
}

export const UserGate = ({ children }: UserGateProps) => {
  const [showCreate, setShowCreate] = useState(false);

  const {
    startFlow,
    selectUser,
    clearSelection,
    users,
    usersStatus,
    currentUser,
    currentUserStatus,
    error,
  } = useUnit({
    startFlow: userModel.startUsersFlow,
    selectUser: userModel.selectUser,
    clearSelection: userModel.clearSelection,
    users: userModel.$users,
    usersStatus: userModel.$usersStatus,
    currentUser: userModel.$currentUser,
    currentUserStatus: userModel.$currentUserStatus,
    error: userModel.$error,
  }) as {
    startFlow: typeof userModel.startUsersFlow;
    selectUser: typeof userModel.selectUser;
    clearSelection: typeof userModel.clearSelection;
    users: ReturnType<typeof userModel.$users.getState>;
    usersStatus: userModel.RequestStatus;
    currentUser: ReturnType<typeof userModel.$currentUser.getState>;
    currentUserStatus: userModel.RequestStatus;
    error: ReturnType<typeof userModel.$error.getState>;
  };

  const hasUsers = users.length > 0;
  const isLoading =
    usersStatus === "loading" || currentUserStatus === "loading";
  const forceCreate = usersStatus === "success" && !hasUsers;
  const showCreateForm = forceCreate || showCreate;

  useEffect(() => {
    startFlow();
  }, [startFlow]);

  const retry = () => {
    clearSelection();
    startFlow();
  };

  if (currentUser) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <FullScreenLoader message="Загружаем информацию о пользователе..." />
    );
  }

  if (error) {
    return (
      <ErrorCard
        message={error}
        actionLabel="Попробовать снова"
        onAction={retry}
      />
    );
  }

  if (showCreateForm) {
    return (
      <CreateUserForm
        onCancel={hasUsers ? () => setShowCreate(false) : undefined}
      />
    );
  }

  return (
    <SelectUser
      users={users}
      onSelect={selectUser}
      onCreate={() => setShowCreate(true)}
    />
  );
};

const FullScreenLoader = ({ message }: { message: string }) => (
  <Center w="full" h="100vh">
    <VStack gap={3}>
      <Spinner size="lg" color="brand.500" />
      <Text color="fg.muted">{message}</Text>
    </VStack>
  </Center>
);

interface ErrorCardProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

const ErrorCard = ({ message, actionLabel, onAction }: ErrorCardProps) => (
  <Center w="full" h="full" minH="80vh" px={4}>
    <GlassCard w="full" maxW="md" p={8}>
      <VStack align="stretch" gap={4}>
        <Heading size="md">Не удалось загрузить данные</Heading>
        <Text color="fg.muted">{message}</Text>
        <Button colorPalette="brand" onClick={onAction}>
          {actionLabel}
        </Button>
      </VStack>
    </GlassCard>
  </Center>
);
