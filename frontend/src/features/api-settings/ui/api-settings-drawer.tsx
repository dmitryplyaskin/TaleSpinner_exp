import { useEffect, useState } from "react";
import { useUnit } from "effector-react";
import { Stack } from "@chakra-ui/react";

import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerCloseTrigger,
} from "@/components/ui/drawer";
import { userModel } from "@/entities/user";
import type { ProviderType } from "@/entities/llm-config/types";

import { GlobalPresetBlock } from "./blocks/global-preset-block";
import { ModelConfigBlock } from "./blocks/model-config-block";
import { EmbeddingConfigBlock } from "./blocks/embedding-config-block";
import { TokenManagementModal } from "./modals/token-management-modal";

import {
  initApiSettings,
  $activePreset,
  updateActivePreset,
  mainModelForm,
  ragModelForm,
  guardModelForm,
  storytellingModelForm,
  embeddingForm,
} from "../model/api-settings-model";

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
  const activePreset = useUnit($activePreset);
  const updatePreset = useUnit(updateActivePreset);

  const [tokenModalProvider, setTokenModalProvider] =
    useState<ProviderType | null>(null);

  useEffect(() => {
    if (open && currentUser) {
      init(currentUser.id);
    }
  }, [open, currentUser, init]);

  if (!currentUser) return null;

  return (
    <>
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
            <Stack gap={6} pb={8}>
              <GlobalPresetBlock />

              <ModelConfigBlock
                title="Main Model"
                form={mainModelForm}
                onManageTokens={setTokenModalProvider}
              />

              <ModelConfigBlock
                title="RAG Model"
                form={ragModelForm}
                enabled={activePreset?.config_data.rag.enabled ?? false}
                onToggle={(enabled) => {
                  if (!activePreset) return;
                  updatePreset({
                    config_data: {
                      ...activePreset.config_data,
                      rag: {
                        ...activePreset.config_data.rag,
                        enabled,
                      },
                    },
                  });
                }}
                onManageTokens={setTokenModalProvider}
              />

              <ModelConfigBlock
                title="Guard Model"
                form={guardModelForm}
                enabled={activePreset?.config_data.guard.enabled ?? false}
                onToggle={(enabled) => {
                  if (!activePreset) return;
                  updatePreset({
                    config_data: {
                      ...activePreset.config_data,
                      guard: {
                        ...activePreset.config_data.guard,
                        enabled,
                      },
                    },
                  });
                }}
                onManageTokens={setTokenModalProvider}
              />

              <ModelConfigBlock
                title="Storytelling Model"
                form={storytellingModelForm}
                enabled={
                  activePreset?.config_data.storytelling.enabled ?? false
                }
                onToggle={(enabled) => {
                  if (!activePreset) return;
                  updatePreset({
                    config_data: {
                      ...activePreset.config_data,
                      storytelling: {
                        ...activePreset.config_data.storytelling,
                        enabled,
                      },
                    },
                  });
                }}
                onManageTokens={setTokenModalProvider}
              />

              <EmbeddingConfigBlock
                title="Embedding"
                form={embeddingForm}
                onManageTokens={setTokenModalProvider}
              />
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>

      <TokenManagementModal
        open={!!tokenModalProvider}
        onOpenChange={() => setTokenModalProvider(null)}
        provider={tokenModalProvider}
      />
    </>
  );
};
