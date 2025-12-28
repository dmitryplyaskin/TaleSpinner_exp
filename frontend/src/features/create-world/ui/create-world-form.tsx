import { useUnit } from "effector-react";
import {
  Button,
  Center,
  Field,
  Heading,
  Text,
  Textarea,
  VStack,
  Steps,
  Box,
  Card,
  HStack,
} from "@chakra-ui/react";

import { GlassCard } from "@/components/ui/glass-card";
import {
  $currentStep,
  $worldDescription,
  closeCreateWorldForm,
  nextStep,
  setWorldDescription,
} from "../model/create-world-model";

interface CreateWorldFormProps {
  onCancel?: () => void;
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

export const CreateWorldForm = ({ onCancel }: CreateWorldFormProps) => {
  const [
    currentStep,
    worldDescription,
    handleClose,
    handleNext,
    handleSetDescription,
  ] = useUnit([
    $currentStep,
    $worldDescription,
    closeCreateWorldForm,
    nextStep,
    setWorldDescription,
  ]);

  const handleCancel = () => {
    handleClose();
    onCancel?.();
  };

  const handleContinue = () => {
    if (worldDescription.trim()) {
      handleNext();
    }
  };

  return (
    <Center w="full" h="full" minH="100vh" px={4} py={8} bg="bg.subtle">
      <GlassCard w="full" maxW="4xl" p={8}>
        <Steps.Root count={1} step={currentStep} colorPalette="brand">
          <VStack align="stretch" gap={8}>
            {/* Steps */}
            <Steps.List>
              <Steps.Item index={0}>
                <Steps.Indicator>
                  <Steps.Status />
                </Steps.Indicator>
                <Box>
                  <Steps.Title>Заложить основу</Steps.Title>
                </Box>
                <Steps.Separator />
              </Steps.Item>
            </Steps.List>

            {/* Step Content */}
            <Steps.Content index={0}>
              <VStack align="stretch" gap={6}>
                <VStack align="stretch" gap={2}>
                  <Heading size="lg">Опишите ваш мир</Heading>
                  <Text color="fg.muted">
                    Расскажите о мире, который вы хотите создать. Чем подробнее
                    описание, тем лучше система сможет помочь вам в создании.
                  </Text>
                </VStack>

                <Field.Root required>
                  <Field.Label>Описание мира</Field.Label>
                  <Textarea
                    value={worldDescription}
                    onChange={(e) => handleSetDescription(e.target.value)}
                    placeholder="Опишите мир, который вы хотите создать. Например: фэнтези вселенная с магией, драконами и эльфами. Магия доступна только избранным, а драконы охраняют древние артефакты..."
                    minH="200px"
                    autoresize
                    variant="outline"
                    autoFocus
                  />
                  <Field.HelperText>
                    Чем подробнее описание, тем лучше система сможет создать ваш
                    мир. Опишите основные элементы: жанр, магию, технологии,
                    общества, конфликты и т.д.
                  </Field.HelperText>
                </Field.Root>

                {/* Examples */}
                <VStack align="stretch" gap={3}>
                  <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                    Примеры описаний:
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {exampleDescriptions.map((example, index) => (
                      <Card.Root
                        key={index}
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

                {/* Actions */}
                <HStack justify="flex-end" gap={3} pt={4}>
                  <Button variant="ghost" onClick={handleCancel}>
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
            </Steps.Content>
          </VStack>
        </Steps.Root>
      </GlassCard>
    </Center>
  );
};


