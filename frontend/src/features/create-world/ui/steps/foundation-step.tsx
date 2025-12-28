import { useUnit } from "effector-react";
import {
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import {
  $worldDescription,
  nextStep,
  setWorldDescription,
} from "../../model/create-world-model";

interface FoundationStepProps {
  onCancel: () => void;
}

const exampleDescriptions = [
  {
    title: "Фэнтези мир",
    text: "Средневековый фэнтези мир с магией, драконами и эльфами. Магия доступна только избранным, а драконы охраняют древние артефакты.",
  },
  {
    title: "Киберпанк вселенная",
    text: "Будущее мегаполиса, где технологии и человечество слились. Корпорации правят миром, киборги ходят по улицам, а хакеры взламывают виртуальную реальность.",
  },
  {
    title: "Постапокалипсис",
    text: "Мир после глобальной катастрофы. Выжившие сражаются за ресурсы, мутанты бродят по пустошам, а остатки цивилизации пытаются восстановить порядок.",
  },
];

export const FoundationStep = ({ onCancel }: FoundationStepProps) => {
  const [worldDescription, handleSetDescription, handleNext] = useUnit([
    $worldDescription,
    setWorldDescription,
    nextStep,
  ]);

  const handleContinue = () => {
    if (!worldDescription.trim()) return;
    handleNext();
  };

  return (
    <VStack align="stretch" gap={6}>
      <VStack align="stretch" gap={2}>
        <Heading size="lg">Опишите ваш мир</Heading>
        <Text color="fg.muted">
          Расскажите о мире, который вы хотите создать. Чем подробнее описание,
          тем лучше система сможет помочь вам в создании.
        </Text>
      </VStack>

      <Field.Root required>
        <Field.Label>Описание мира</Field.Label>
        <Textarea
          value={worldDescription}
          onChange={(e) => handleSetDescription(e.target.value)}
          placeholder="Опишите мир, который вы хотите создать. Например: фэнтези вселенная с магией, драконами и эльфами..."
          minH="200px"
          autoresize
          variant="outline"
          autoFocus
        />
        <Field.HelperText>
          Опишите жанр, магию/технологии, общество, конфликты и т.д.
        </Field.HelperText>
      </Field.Root>

      <VStack align="stretch" gap={3}>
        <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
          Примеры описаний:
        </Text>
        <VStack align="stretch" gap={2}>
          {exampleDescriptions.map((example) => (
            <Card.Root
              key={example.title}
              variant="outline"
              cursor="pointer"
              _hover={{ borderColor: "brand.500", bg: "bg.subtle" }}
              onClick={() => handleSetDescription(example.text)}
            >
              <Card.Body p={4}>
                <VStack align="stretch" gap={1}>
                  <Text fontWeight="semibold" fontSize="sm">
                    {example.title}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" noOfLines={2}>
                    {example.text}
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      </VStack>

      <HStack justify="flex-end" gap={3} pt={4}>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          colorPalette="brand"
          variant="solid"
          onClick={handleContinue}
          disabled={!worldDescription.trim()}
        >
          Продолжить
        </Button>
      </HStack>
    </VStack>
  );
};


