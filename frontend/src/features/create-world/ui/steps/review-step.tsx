import { useUnit } from "effector-react";
import {
  Button,
  Field,
  Heading,
  HStack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import {
  $worldDraft,
  nextStep,
  setStep,
  setWorldDraftField,
} from "../../model/create-world-model";

interface ReviewStepProps {
  onCancel: () => void;
}

export const ReviewStep = ({ onCancel }: ReviewStepProps) => {
  const [draft, setField, goNext, goToStep] = useUnit([
    $worldDraft,
    setWorldDraftField,
    nextStep,
    setStep,
  ]);

  return (
    <VStack align="stretch" gap={6}>
      <VStack align="stretch" gap={2}>
        <Heading size="lg">Скелет мира (черновик)</Heading>
        <Text color="fg.muted">
          Это результат работы агента-архитектора. Можно подправить формулировки,
          затем перейти к детализации мира.
        </Text>
      </VStack>

      <VStack align="stretch" gap={4}>
        <Field.Root>
          <Field.Label>Game prompt (основной контекст для игры)</Field.Label>
          <Textarea
            value={draft.gamePrompt}
            onChange={(e) =>
              setField({ field: "gamePrompt", value: e.target.value })
            }
            minH="140px"
            autoresize
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>World bible (подробное описание мира)</Field.Label>
          <Textarea
            value={draft.worldBible}
            onChange={(e) =>
              setField({ field: "worldBible", value: e.target.value })
            }
            minH="220px"
            autoresize
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Глобальный конфликт (опционально)</Field.Label>
          <Textarea
            value={draft.globalConflict}
            onChange={(e) =>
              setField({ field: "globalConflict", value: e.target.value })
            }
            minH="140px"
            autoresize
          />
        </Field.Root>
      </VStack>

      <HStack justify="space-between" gap={3} pt={4}>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <HStack gap={3}>
          <Button variant="outline" onClick={() => goToStep(0)}>
            Назад
          </Button>
          <Button colorPalette="brand" variant="solid" onClick={goNext}>
            Продолжить
          </Button>
        </HStack>
      </HStack>
    </VStack>
  );
};


