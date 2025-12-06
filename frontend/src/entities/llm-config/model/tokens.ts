import { createEffect, createEvent, createStore, sample } from "effector";
import type { Token, TokenCreate, TokenUpdate, ProviderType } from "../types";
import {
  fetchTokens,
  createToken,
  updateToken,
  deleteToken,
} from "../api/llm-config-api";

// Events
export const loadTokens = createEvent<string>(); // userId
export const addToken = createEvent<{ userId: string; data: TokenCreate }>();
export const editToken = createEvent<{
  userId: string;
  tokenId: string;
  data: TokenUpdate;
}>();
export const removeToken = createEvent<{ userId: string; tokenId: string }>();
export const resetTokens = createEvent();

// Effects
export const fetchTokensFx = createEffect<string, Token[], Error>(fetchTokens);

export const createTokenFx = createEffect<
  { userId: string; data: TokenCreate },
  Token,
  Error
>(({ userId, data }) => createToken(userId, data));

export const updateTokenFx = createEffect<
  { userId: string; tokenId: string; data: TokenUpdate },
  Token,
  Error
>(({ userId, tokenId, data }) => updateToken(userId, tokenId, data));

export const deleteTokenFx = createEffect<
  { userId: string; tokenId: string },
  void,
  Error
>(({ userId, tokenId }) => deleteToken(userId, tokenId));

// Stores
export const $tokens = createStore<Token[]>([]);
export const $tokensLoading = fetchTokensFx.pending;
export const $tokenSaving = createTokenFx.pending;
export const $tokenDeleting = deleteTokenFx.pending;
export const $tokensError = createStore<string | null>(null);

// Derived stores
export const $tokensByProvider = $tokens.map((tokens) => {
  const grouped: Record<ProviderType, Token[]> = {
    openrouter: [],
    ollama: [],
  };
  tokens.forEach((token) => {
    if (grouped[token.provider]) {
      grouped[token.provider].push(token);
    }
  });
  return grouped;
});

export const $activeTokens = $tokens.map((tokens) =>
  tokens.filter((t) => t.is_active)
);

// Reducers
$tokens
  .on(fetchTokensFx.doneData, (_, tokens) => tokens)
  .on(createTokenFx.doneData, (state, token) => [...state, token])
  .on(updateTokenFx.doneData, (state, updatedToken) =>
    state.map((t) => (t.id === updatedToken.id ? updatedToken : t))
  )
  .on(deleteTokenFx.done, (state, { params }) =>
    state.filter((t) => t.id !== params.tokenId)
  )
  .reset(resetTokens);

$tokensError
  .reset([fetchTokensFx, createTokenFx, updateTokenFx, deleteTokenFx])
  .on(fetchTokensFx.failData, (_, error) => error.message)
  .on(createTokenFx.failData, (_, error) => error.message)
  .on(updateTokenFx.failData, (_, error) => error.message)
  .on(deleteTokenFx.failData, (_, error) => error.message);

// Logic
sample({
  clock: loadTokens,
  target: fetchTokensFx,
});

sample({
  clock: addToken,
  target: createTokenFx,
});

sample({
  clock: editToken,
  target: updateTokenFx,
});

sample({
  clock: removeToken,
  target: deleteTokenFx,
});

