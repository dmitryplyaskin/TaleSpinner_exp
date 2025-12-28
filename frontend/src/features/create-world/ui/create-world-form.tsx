import { useUnit } from "effector-react";
import { Center, VStack, Steps, Box } from "@chakra-ui/react";

import { GlassCard } from "@/components/ui/glass-card";
import {
  $currentStep,
  closeCreateWorldForm,
} from "../model/create-world-model";
import { FoundationStep } from "./steps/foundation-step";
import { HitlStep } from "./steps/hitl-step";
import { ReviewStep } from "./steps/review-step";
import { ComingSoonStep } from "./steps/coming-soon-step";

interface CreateWorldFormProps {
  onCancel?: () => void;
}

const wizardSteps = [
  { title: "Заложить основу", implemented: true },
  { title: "Уточнить с агентом", implemented: true },
  { title: "Проверить скелет", implemented: true },
  { title: "Детали мира", implemented: false },
  { title: "Фракции и силы", implemented: false },
  { title: "Старт кампании", implemented: false },
] as const;

export const CreateWorldForm = ({ onCancel }: CreateWorldFormProps) => {
  const [currentStep, handleClose] = useUnit([
    $currentStep,
    closeCreateWorldForm,
  ]);

  const handleCancel = () => {
    handleClose();
    onCancel?.();
  };

  return (
    <Center w="full" h="full" minH="100vh" px={4} py={8} bg="bg.subtle">
      <GlassCard w="full" maxW="4xl" p={8}>
        <Steps.Root
          count={wizardSteps.length}
          step={currentStep}
          colorPalette="brand"
        >
          <VStack align="stretch" gap={8}>
            {/* Steps */}
            <Steps.List>
              {wizardSteps.map((s, index) => (
                <Steps.Item key={s.title} index={index}>
                  <Steps.Indicator />
                  <Box opacity={s.implemented ? 1 : 0.6}>
                    <Steps.Title>{s.title}</Steps.Title>
                  </Box>
                  <Steps.Separator />
                </Steps.Item>
              ))}
            </Steps.List>

            {/* Step Content */}
            <Steps.Content index={currentStep}>
              {currentStep === 0 && <FoundationStep onCancel={handleCancel} />}
              {currentStep === 1 && <HitlStep onCancel={handleCancel} />}
              {currentStep === 2 && <ReviewStep onCancel={handleCancel} />}
              {currentStep >= 3 && <ComingSoonStep onCancel={handleCancel} />}
            </Steps.Content>
          </VStack>
        </Steps.Root>
      </GlassCard>
    </Center>
  );
};
