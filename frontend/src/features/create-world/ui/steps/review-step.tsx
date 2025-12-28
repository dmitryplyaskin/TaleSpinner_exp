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
  prevStep,
  setWorldDraftField,
} from "../../model/create-world-model";

interface ReviewStepProps {
  onCancel: () => void;
}

export const ReviewStep = ({ onCancel }: ReviewStepProps) => {
  const [draft, setField, goNext, goBack] = useUnit([
    $worldDraft,
    setWorldDraftField,
    nextStep,
    prevStep,
  ]);

  return (
    <VStack align="stretch" gap={6}>
      <VStack align="stretch" gap={2}>
        <Heading size="lg">Скелет мира (черновик)</Heading>
        <Text color="fg.muted">
          Заглушка шага 3: здесь будет ответ бэкенда. Пока можно прочитать и
          отредактировать блоки, затем перейти дальше.
        </Text>
      </VStack>

      <VStack align="stretch" gap={4}>
        <Field.Root>
          <Field.Label>Обзор</Field.Label>
          <Textarea
            value={draft.overview}
            onChange={(e) =>
              setField({ field: "overview", value: e.target.value })
            }
            minH="120px"
            autoresize
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>География</Field.Label>
          <Textarea
            value={draft.geography}
            onChange={(e) =>
              setField({ field: "geography", value: e.target.value })
            }
            minH="120px"
            autoresize
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Общества и силы</Field.Label>
          <Textarea
            value={draft.societies}
            onChange={(e) =>
              setField({ field: "societies", value: e.target.value })
            }
            minH="120px"
            autoresize
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Конфликты</Field.Label>
          <Textarea
            value={draft.conflicts}
            onChange={(e) =>
              setField({ field: "conflicts", value: e.target.value })
            }
            minH="120px"
            autoresize
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Тон и стиль</Field.Label>
          <Textarea
            value={draft.tone}
            onChange={(e) => setField({ field: "tone", value: e.target.value })}
            minH="100px"
            autoresize
          />
        </Field.Root>
      </VStack>

      <HStack justify="space-between" gap={3} pt={4}>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <HStack gap={3}>
          <Button variant="outline" onClick={goBack}>
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


