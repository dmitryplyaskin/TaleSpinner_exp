import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerCloseTrigger,
} from "@/components/ui/drawer"
import { ColorModeButton } from "@/components/ui/color-mode"
import { HStack, Text, VStack } from "@chakra-ui/react"

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (details: { open: boolean }) => void
}

export const SettingsDrawer = ({ open, onOpenChange }: SettingsDrawerProps) => {
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
            {/* Future settings can go here */}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  )
}

