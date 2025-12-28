import { useUnit } from "effector-react";
import { Button, Heading, HStack, Spinner, Text, Textarea, VStack } from "@chakra-ui/react";

import {
  $hitlAnswers,
  $hitlCanContinue,
  $hitlError,
  $hitlPhase,
  $hitlQuestions,
  $hitlStage,
  hitlContinueClicked,
  hitlFreeTextChanged,
  hitlOptionSelected,
  prevStep,
} from "../../model/create-world-model";

interface HitlStepProps {
  onCancel: () => void;
}

export const HitlStep = ({ onCancel }: HitlStepProps) => {
  const [
    phase,
    stage,
    error,
    questions,
    answers,
    canContinue,
    goBack,
    selectOption,
    changeText,
    continueClicked,
  ] = useUnit([
    $hitlPhase,
    $hitlStage,
    $hitlError,
    $hitlQuestions,
    $hitlAnswers,
    $hitlCanContinue,
    prevStep,
    hitlOptionSelected,
    hitlFreeTextChanged,
    hitlContinueClicked,
  ]);

  if (error) {
    return (
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={2}>
          <Heading size="lg">Ошибка</Heading>
          <Text color="fg.muted">{error}</Text>
        </VStack>
        <HStack justify="space-between" pt={4}>
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="outline" onClick={goBack}>
            Назад
          </Button>
        </HStack>
      </VStack>
    );
  }

  const stageTitle = (() => {
    switch (stage) {
      case "analyzing":
        return "Агент анализирует ввод…";
      case "asking":
        return "Агент формулирует вопросы…";
      case "waiting_for_answers":
        return "Ожидаю ваши ответы…";
      case "building":
        return "Агент собирает скелет мира…";
      case "finalizing":
        return "Финализирую…";
      default:
        return "Агент работает…";
    }
  })();

  const stageDescription =
    stage === "analyzing"
      ? "Проверяю, достаточно ли информации, чтобы сразу собрать скелет мира."
      : stage === "building"
        ? "Собираю итоговый контекст и подробное описание мира."
        : "Пожалуйста, подождите…";

  if (phase === "thinking") {
    return (
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={2}>
          <Heading size="lg">{stageTitle}</Heading>
          <Text color="fg.muted">{stageDescription}</Text>
        </VStack>

        <HStack gap={3}>
          <Spinner />
          <Text color="fg.muted">Пожалуйста, подождите…</Text>
        </HStack>

        <HStack justify="space-between" gap={3} pt={4}>
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="outline" onClick={goBack}>
            Назад
          </Button>
        </HStack>
      </VStack>
    );
  }

  if (phase === "done") {
    return (
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={2}>
          <Heading size="lg">Готово</Heading>
          <Text color="fg.muted">
            Скелет мира готов. Перехожу к шагу редактирования…
          </Text>
        </VStack>
        <HStack gap={3}>
          <Spinner />
          <Text color="fg.muted">Пожалуйста, подождите…</Text>
        </HStack>
      </VStack>
    );
  }

  // phase === "questions"
  return (
    <VStack align="stretch" gap={6}>
      <VStack align="stretch" gap={2}>
        <Heading size="lg">Ответьте на вопросы</Heading>
        <Text color="fg.muted">
          Можно выбрать вариант или написать свой ответ. Чтобы продолжить, нужно
          ответить на каждый вопрос.
        </Text>
      </VStack>

      <VStack align="stretch" gap={4}>
        {questions.map((q) => {
          const selected = answers[q.id]?.selectedOptionId ?? null;
          const freeText = answers[q.id]?.freeText ?? "";

          return (
            <Card.Root key={q.id} variant="outline">
              <Card.Body p={5}>
                <VStack align="stretch" gap={3}>
                  <Text fontWeight="semibold">{q.question}</Text>

                  <HStack gap={2} wrap="wrap">
                    {q.options.map((opt) => {
                      const isSelected = selected === opt.id;
                      return (
                        <Button
                          key={opt.id}
                          variant={isSelected ? "solid" : "outline"}
                          colorPalette={isSelected ? "brand" : undefined}
                          onClick={() =>
                            selectOption({ questionId: q.id, optionId: opt.id })
                          }
                        >
                          {opt.label}
                        </Button>
                      );
                    })}
                  </HStack>

                  <Textarea
                    value={freeText}
                    onChange={(e) =>
                      changeText({ questionId: q.id, text: e.target.value })
                    }
                    placeholder="Свой ответ (необязательно, если выбран вариант)…"
                    minH="90px"
                    autoresize
                  />
                </VStack>
              </Card.Body>
            </Card.Root>
          );
        })}
      </VStack>

      <HStack justify="space-between" gap={3} pt={4}>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <HStack gap={3}>
          <Button variant="outline" onClick={goBack}>
            Назад
          </Button>
          <Button
            colorPalette="brand"
            variant="solid"
            onClick={continueClicked}
            disabled={!canContinue}
          >
            Продолжить
          </Button>
        </HStack>
      </HStack>
    </VStack>
  );
};


