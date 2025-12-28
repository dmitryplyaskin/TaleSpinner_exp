export type HitlPhase = "thinking" | "questions" | "done";

export type PlotTypeId =
  | "adventure"
  | "mystery"
  | "exploration"
  | "survival"
  | "political_intrigue"
  | "heist"
  | "horror"
  | "slice_of_life"
  | "romance"
  | "war_campaign"
  | "comedy"
  | "custom";

export interface PlotTypeOption {
  id: PlotTypeId;
  label: string;
  hint?: string;
}

export interface HitlOption {
  id: string;
  label: string;
}

export interface HitlQuestion {
  id: string;
  question: string;
  options: HitlOption[];
}

export interface HitlRound {
  id: string;
  thinkingTitle: string;
  thinkingDescription: string;
  questions: HitlQuestion[];
}

export interface HitlAnswer {
  selectedOptionId?: string;
  freeText?: string;
}

export interface WorldDraft {
  /**
   * Main game context for the in-game instruction prompt.
   */
  gamePrompt: string;
  /**
   * Detailed but concise world description for follow-up generations.
   */
  worldBible: string;
  /**
   * Optional global conflict (empty if not needed / disabled).
   */
  globalConflict: string;
}


