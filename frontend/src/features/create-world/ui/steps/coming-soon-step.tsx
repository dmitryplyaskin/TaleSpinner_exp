import { useUnit } from "effector-react";
import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";

import { $currentStep, nextStep, prevStep } from "../../model/create-world-model";

interface ComingSoonStepProps {
  onCancel: () => void;
}

export const ComingSoonStep = ({ onCancel }: ComingSoonStepProps) => {
  const [step, goBack, goNext] = useUnit([$currentStep, prevStep, nextStep]);

  return (
    <VStack align="stretch" gap={6}>
      <VStack align="stretch" gap={2}>
        <Heading size="lg">Скоро</Heading>
        <Text color="fg.muted">
          Шаг {step + 1} пока в разработке. Мы уже подготовили каркас мастера —
          дальше появятся детали мира, фракции и старт кампании.
        </Text>
      </VStack>

      <HStack justify="space-between" gap={3} pt={4}>
        <Button variant="ghost" onClick={onCancel}>
          Закрыть
        </Button>
        <HStack gap={3}>
          <Button variant="outline" onClick={goBack} disabled={step === 0}>
            Назад
          </Button>
          <Button
            colorPalette="brand"
            variant="solid"
            onClick={goNext}
            disabled={step >= 5}
          >
            Продолжить
          </Button>
        </HStack>
      </HStack>
    </VStack>
  );
};


