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
                configId={activePreset?.main_model_config_id}
                onConfigChange={(id) =>
                  updatePreset({ main_model_config_id: id })
                }
                onManageTokens={setTokenModalProvider}
              />

              <ModelConfigBlock
                title="RAG Model"
                form={ragModelForm}
                configId={activePreset?.rag_model_config_id}
                onConfigChange={(id) =>
                  updatePreset({ rag_model_config_id: id })
                }
                enabled={activePreset?.rag_enabled ?? false}
                onToggle={(enabled) => updatePreset({ rag_enabled: enabled })}
                onManageTokens={setTokenModalProvider}
              />

              <ModelConfigBlock
                title="Guard Model"
                form={guardModelForm}
                configId={activePreset?.guard_model_config_id}
                onConfigChange={(id) =>
                  updatePreset({ guard_model_config_id: id })
                }
                enabled={activePreset?.guard_enabled ?? false}
                onToggle={(enabled) => updatePreset({ guard_enabled: enabled })}
                onManageTokens={setTokenModalProvider}
              />

              <ModelConfigBlock
                title="Storytelling Model"
                form={storytellingModelForm}
                configId={activePreset?.storytelling_model_config_id}
                onConfigChange={(id) =>
                  updatePreset({ storytelling_model_config_id: id })
                }
                enabled={activePreset?.storytelling_enabled ?? false}
                onToggle={(enabled) =>
                  updatePreset({ storytelling_enabled: enabled })
                }
                onManageTokens={setTokenModalProvider}
              />

              <EmbeddingConfigBlock
                title="Embedding"
                form={embeddingForm}
                configId={activePreset?.embedding_config_id}
                onConfigChange={(id) =>
                  updatePreset({ embedding_config_id: id })
                }
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
