import { useEffect } from "react";
import { Accordion, Span } from "@chakra-ui/react";
import { useUnit } from "effector-react";
import { LuKey, LuCpu, LuDatabase, LuPackage } from "react-icons/lu";

import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerCloseTrigger,
} from "@/components/ui/drawer";
import { userModel } from "@/entities/user";

import { TokensSection } from "./tokens-section";
import { ModelConfigsSection } from "./model-configs-section";
import { EmbeddingConfigsSection } from "./embedding-configs-section";
import { PresetsSection } from "./presets-section";
import { initApiSettings } from "../model/api-settings-model";

interface ApiSettingsDrawerProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
}

export const ApiSettingsDrawer = ({
  open,
  onOpenChange,
}: ApiSettingsDrawerProps) => {
  const [currentUser, init] = useUnit([
    userModel.$currentUser,
    initApiSettings,
  ]);

  useEffect(() => {
    if (open && currentUser) {
      init(currentUser.id);
    }
  }, [open, currentUser, init]);

  if (!currentUser) return null;

  return (
    <DrawerRoot
      open={open}
      onOpenChange={onOpenChange}
      placement="start"
      size="lg"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>API Settings</DrawerTitle>
          <DrawerCloseTrigger />
        </DrawerHeader>
        <DrawerBody>
          <Accordion.Root
            collapsible
            multiple
            defaultValue={["tokens"]}
            variant="enclosed"
          >
            <Accordion.Item value="tokens">
              <Accordion.ItemTrigger>
                <LuKey />
                <Span flex="1">API Tokens</Span>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>
                  <TokensSection userId={currentUser.id} />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="model-configs">
              <Accordion.ItemTrigger>
                <LuCpu />
                <Span flex="1">Model Configurations</Span>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>
                  <ModelConfigsSection userId={currentUser.id} />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="embedding-configs">
              <Accordion.ItemTrigger>
                <LuDatabase />
                <Span flex="1">Embedding Configurations</Span>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>
                  <EmbeddingConfigsSection userId={currentUser.id} />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="presets">
              <Accordion.ItemTrigger>
                <LuPackage />
                <Span flex="1">Presets</Span>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>
                  <PresetsSection userId={currentUser.id} />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
};
