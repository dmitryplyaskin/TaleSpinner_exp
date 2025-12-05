import {
  Box,
  VStack,
  IconButton,
  Text,
  HStack,
  Separator,
} from "@chakra-ui/react";
import {
  LuAmbulance,
  LuSettings,
  LuChevronLeft,
  LuChevronRight,
  LuGlobe,
  LuKey,
} from "react-icons/lu";
import { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { SettingsDrawer } from "@/features/settings/ui/settings-drawer";
import { ApiSettingsDrawer } from "@/features/api-settings";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({
  icon: Icon,
  label,
  collapsed,
  active,
  onClick,
}: NavItemProps) => {
  return (
    <Tooltip
      content={label}
      disabled={!collapsed}
      positioning={{ placement: "right" }}
    >
      <HStack
        as="button"
        onClick={onClick}
        w="full"
        py={3}
        px={collapsed ? 3 : 4}
        justify={collapsed ? "center" : "flex-start"}
        align="center"
        gap={3}
        borderRadius="md"
        color={active ? "brand.500" : "fg.muted"}
        bg={active ? "brand.500/10" : "transparent"}
        _hover={{ bg: "bg.subtle", color: "fg" }}
        transition="all 0.2s"
        cursor="pointer"
        outline="none"
      >
        <Icon size={20} />
        {!collapsed && (
          <Text fontWeight="medium" fontSize="sm" truncate>
            {label}
          </Text>
        )}
      </HStack>
    </Tooltip>
  );
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);

  return (
    <>
      <Box
        as="nav"
        h="100vh"
        w={collapsed ? "64px" : "240px"}
        bg="bg.canvas"
        borderRight="1px solid"
        borderColor="border.subtle"
        transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        pos="sticky"
        top="0"
        display="flex"
        flexDirection="column"
        py={4}
        px={2}
        zIndex="sticky"
        boxShadow="soft"
      >
        <VStack gap={6} flex="1">
          {/* Logo / Brand */}
          <HStack justify={collapsed ? "center" : "space-between"} px={2}>
            {!collapsed && (
              <Text fontWeight="bold" fontSize="lg" color="brand.500">
                TaleSpinner
              </Text>
            )}
            <IconButton
              variant="ghost"
              size="xs"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand" : "Collapse"}
              color="fg.muted"
            >
              {collapsed ? <LuChevronRight /> : <LuChevronLeft />}
            </IconButton>
          </HStack>

          <Separator borderColor="border.subtle" />

          {/* Nav Items */}
          <VStack gap={1} w="full" align="stretch">
            <NavItem
              icon={LuAmbulance}
              label="Home"
              collapsed={collapsed}
              active
            />
            <NavItem icon={LuGlobe} label="My Worlds" collapsed={collapsed} />
          </VStack>
        </VStack>

        {/* Bottom Actions */}
        <VStack gap={1} w="full" align="stretch">
          <Separator borderColor="border.subtle" mb={2} />
          <NavItem
            icon={LuKey}
            label="API Settings"
            collapsed={collapsed}
            onClick={() => setApiSettingsOpen(true)}
          />
          <NavItem
            icon={LuSettings}
            label="Settings"
            collapsed={collapsed}
            onClick={() => setSettingsOpen(true)}
          />
        </VStack>
      </Box>

      <ApiSettingsDrawer
        open={apiSettingsOpen}
        onOpenChange={(e) => setApiSettingsOpen(e.open)}
      />
      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={(e) => setSettingsOpen(e.open)}
      />
    </>
  );
};
