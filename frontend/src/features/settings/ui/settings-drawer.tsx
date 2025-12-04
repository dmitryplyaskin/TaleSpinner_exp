import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerCloseTrigger,
} from "@/components/ui/drawer";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Button, HStack, Text, VStack } from "@chakra-ui/react";

import { userSettingsModel } from "@/features/user-settings";
import { useUnit } from "effector-react";

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}

export const SettingsDrawer = ({ open, onOpenChange }: SettingsDrawerProps) => {
  const toggleUserSettings = useUnit(userSettingsModel.toggleUserSettings);

  return (
    <DrawerRoot open={open} onOpenChange={onOpenChange} placement="start">
      <DrawerBackdrop />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerCloseTrigger />
        </DrawerHeader>
        <DrawerBody>
          <VStack gap={6} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="medium">Appearance</Text>
              <ColorModeButton />
            </HStack>

            <VStack align="stretch" gap={3}>
              <Text fontWeight="medium">Пользователь</Text>
              <Button
                colorPalette="brand"
                variant="outline"
                onClick={() => toggleUserSettings(true)}
              >
                Управление текущим пользователем
              </Button>
            </VStack>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
};
