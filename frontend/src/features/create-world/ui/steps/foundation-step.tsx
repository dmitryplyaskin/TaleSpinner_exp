import { useUnit } from "effector-react";
import {
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import {
  $foundationCanContinue,
  $isGlobalConflictEnabled,
  $plotType,
  $plotTypeCustom,
  $worldDescription,
  nextStep,
  setGlobalConflictEnabled,
  setPlotType,
  setPlotTypeCustom,
  setWorldDescription,
} from "../../model/create-world-model";
import type { PlotTypeOption } from "../../model/types";

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

const plotTypeOptions: PlotTypeOption[] = [
  {
    id: "adventure",
    label: "Приключение",
    hint: "Поиск, путешествия, опасности, цели и награды.",
  },
  {
    id: "mystery",
    label: "Детектив",
    hint: "Улики, тайны, расследование, раскрытие правды.",
  },
  {
    id: "exploration",
    label: "Исследование",
    hint: "Открытие мира, неизвестное, экспедиции, находки.",
  },
  {
    id: "survival",
    label: "Выживание",
    hint: "Ресурсы, риски, ограниченность, моральный выбор.",
  },
  {
    id: "political_intrigue",
    label: "Интриги",
    hint: "Влияние, договоры, предательства, власть.",
  },
  {
    id: "heist",
    label: "Ограбление",
    hint: "План, команда, проникновение, побег, последствия.",
  },
  {
    id: "slice_of_life",
    label: "Повседневность",
    hint: "Дела, отношения, развитие персонажей, эпизоды.",
  },
  {
    id: "horror",
    label: "Хоррор",
    hint: "Напряжение, неизвестное, уязвимость, страх.",
  },
  {
    id: "romance",
    label: "Романтика",
    hint: "Отношения, драма, выборы, эмоциональные ставки.",
  },
  {
    id: "war_campaign",
    label: "Военная кампания",
    hint: "Операции, фронт, тактика, цена победы.",
  },
  {
    id: "comedy",
    label: "Комедия",
    hint: "Лёгкий тон, абсурд, ситуации, юмор.",
  },
  {
    id: "custom",
    label: "Свой вариант",
    hint: "Опиши одним предложением, какой сюжет хочешь играть.",
  },
];

export const FoundationStep = ({ onCancel }: FoundationStepProps) => {
  const [
    worldDescription,
    plotType,
    plotTypeCustom,
    isGlobalConflictEnabled,
    canContinue,
    handleSetDescription,
    handleSetPlotType,
    handleSetPlotTypeCustom,
    handleSetGlobalConflictEnabled,
    handleNext,
  ] = useUnit([
    $worldDescription,
    $plotType,
    $plotTypeCustom,
    $isGlobalConflictEnabled,
    $foundationCanContinue,
    setWorldDescription,
    setPlotType,
    setPlotTypeCustom,
    setGlobalConflictEnabled,
    nextStep,
  ]);

  const handleContinue = () => {
    if (!canContinue) return;
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

      <Field.Root required>
        <Field.Label>Какой сюжет вы хотите играть?</Field.Label>
        <Field.HelperText>
          Это не “жанр мира”, а формат истории: детектив, выживание, интриги и т.д.
        </Field.HelperText>

        <VStack align="stretch" gap={2} pt={2}>
          <HStack gap={2} wrap="wrap">
            {plotTypeOptions.map((opt) => {
              const isSelected = plotType === opt.id;
              return (
                <Button
                  key={opt.id}
                  variant={isSelected ? "solid" : "outline"}
                  colorPalette={isSelected ? "brand" : undefined}
                  onClick={() => handleSetPlotType(opt.id)}
                  title={opt.hint}
                >
                  {opt.label}
                </Button>
              );
            })}
          </HStack>

          {plotType && plotType !== "custom" && (
            <Text fontSize="sm" color="fg.muted">
              {plotTypeOptions.find((o) => o.id === plotType)?.hint ?? ""}
            </Text>
          )}

          {plotType === "custom" && (
            <Textarea
              value={plotTypeCustom}
              onChange={(e) => handleSetPlotTypeCustom(e.target.value)}
              placeholder="Например: “детективное приключение с моральными выборами”"
              minH="90px"
              autoresize
            />
          )}
        </VStack>
      </Field.Root>

      <Field.Root>
        <Field.Label>Нужен ли глобальный конфликт?</Field.Label>
        <Field.HelperText>
          Если выключить — сюжет будет строиться на локальных проблемах и
          эпизодах (подходит для повседневности и камерных историй).
        </Field.HelperText>

        <HStack justify="space-between" pt={2}>
          <Text fontSize="sm" color="fg.muted">
            {isGlobalConflictEnabled ? "Да, нужен" : "Нет, не нужен"}
          </Text>

          <Switch.Root
            checked={isGlobalConflictEnabled}
            onCheckedChange={(e) => handleSetGlobalConflictEnabled(!!e.checked)}
            size="md"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
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
          disabled={!canContinue}
        >
          Продолжить
        </Button>
      </HStack>
    </VStack>
  );
};


