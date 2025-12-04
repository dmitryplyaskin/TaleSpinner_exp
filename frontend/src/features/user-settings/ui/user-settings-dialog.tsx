import { useState } from "react";

import {
  Alert,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogPositioner,
  Portal,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useUnit } from "effector-react";

import { PasswordInput } from "@/components/ui/password-input";
import { userModel } from "@/entities/user";

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserSettingsDialog = ({
  open,
  onOpenChange,
}: UserSettingsDialogProps) => {
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [
    currentUser,
    updatePassword,
    deleteUser,
    isUpdating,
    isDeleting,
    clearSelection,
    startFlow,
    error,
  ] = useUnit([
    userModel.$currentUser,
    userModel.updatePasswordFx,
    userModel.deleteUserFx,
    userModel.updatePasswordFx.pending,
    userModel.deleteUserFx.pending,
    userModel.clearSelection,
    userModel.startUsersFlow,
    userModel.$error,
  ]);

  if (!currentUser) return null;

  const onClose = () => {
    onOpenChange(false);
    setPassword("");
  };

  const handlePasswordSave = () => {
    updatePassword({
      userId: currentUser.id,
      password: password.trim() || undefined,
    })
      .then(onClose)
      .catch(() => null);
  };

  const handleDelete = () => {
    deleteUser(currentUser.id)
      .then(() => {
        onClose();
        clearSelection();
        startFlow();
      })
      .catch(() => null);
  };

  const handleSwitchUser = () => {
    onClose();
    clearSelection();
    startFlow();
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent
            maxW="480px"
            w="90vw"
            borderRadius="xl"
            boxShadow="2xl"
            gap={0}
          >
            <DialogCloseTrigger />
            <DialogHeader>
              <DialogTitle>Управление пользователем</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={5}>
                <VStack align="stretch" gap={3}>
                  <Text fontWeight="medium">Текущий пользователь</Text>
                  <Text color="fg" fontWeight="semibold" fontSize="lg">
                    {currentUser.name}
                  </Text>
                </VStack>

                <VStack align="stretch" gap={3}>
                  <Text fontWeight="medium">Установить/сменить пароль</Text>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Новый пароль (оставьте пустым, чтобы удалить)"
                  />
                  <HStack justify="flex-end">
                    <Button
                      variant="solid"
                      colorPalette="brand"
                      onClick={handlePasswordSave}
                      loading={isUpdating}
                    >
                      Сохранить пароль
                    </Button>
                  </HStack>
                </VStack>

                <VStack align="stretch" gap={3}>
                  <Text fontWeight="medium">Опасные действия</Text>
                  {!confirmDelete ? (
                    <Button
                      variant="outline"
                      colorPalette="red"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Удалить пользователя
                    </Button>
                  ) : (
                    <Alert.Root status="warning" borderRadius="md">
                      <Alert.Indicator />
                      <Alert.Content>
                        <VStack align="stretch" gap={3}>
                          <Text>
                            Удалить пользователя «{currentUser.name}»? Все его
                            данные и чаты будут безвозвратно удалены.
                          </Text>
                          <HStack justify="flex-end" gap={2}>
                            <Button
                              variant="ghost"
                              onClick={() => setConfirmDelete(false)}
                              disabled={isDeleting}
                            >
                              Отмена
                            </Button>
                            <Button
                              variant="solid"
                              colorPalette="red"
                              onClick={handleDelete}
                              loading={isDeleting}
                            >
                              Подтвердить удаление
                            </Button>
                          </HStack>
                        </VStack>
                      </Alert.Content>
                    </Alert.Root>
                  )}
                </VStack>

                {error && (
                  <Alert.Root status="error" borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Content>{error}</Alert.Content>
                  </Alert.Root>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Stack direction="row" gap={3} w="full" justify="space-between">
                <Button variant="ghost" onClick={handleSwitchUser}>
                  Сменить пользователя
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Закрыть
                </Button>
              </Stack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </DialogRoot>
  );
};
