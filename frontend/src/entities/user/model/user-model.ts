import { createEffect, createEvent, createStore, sample } from "effector";

import type {
  CreateUserPayload,
  UpdatePasswordPayload,
  User,
} from "../api/user-api";
import {
  createUser,
  deleteUser,
  fetchUser,
  fetchUsers,
  updatePassword,
} from "../api/user-api";
import { readString, removeKey, writeString } from "@/shared/lib/local-storage";

export type RequestStatus = "idle" | "loading" | "success" | "error";

const SELECTED_USER_KEY = "talespinner.currentUserId";

export const startUsersFlow = createEvent();
export const selectUser = createEvent<string>();
export const clearSelection = createEvent();

export const fetchUsersFx = createEffect<void, User[], Error>(fetchUsers);
export const fetchUserFx = createEffect<string, User, Error>(fetchUser);
export const createUserFx = createEffect<CreateUserPayload, User, Error>(
  createUser
);
export const updatePasswordFx = createEffect<
  UpdatePasswordPayload,
  User,
  Error
>(updatePassword);
export const deleteUserFx = createEffect<string, void, Error>(deleteUser);

export const readSelectedUserFx = createEffect<void, string | null>(() =>
  readString(SELECTED_USER_KEY)
);
export const saveSelectedUserFx = createEffect<string, void>((id) =>
  writeString(SELECTED_USER_KEY, id)
);
export const clearSelectedUserFx = createEffect<void, void>(() =>
  removeKey(SELECTED_USER_KEY)
);

export const $users = createStore<User[]>([]);
export const $currentUser = createStore<User | null>(null);
export const $selectedUserId = createStore<string | null>(null);
export const $usersStatus = createStore<RequestStatus>("idle");
export const $currentUserStatus = createStore<RequestStatus>("idle");
export const $error = createStore<string | null>(null);

$users.on(fetchUsersFx.doneData, (_, users) => users);
$users.on(createUserFx.doneData, (state, user) => [...state, user]);
$users.on(updatePasswordFx.doneData, (state, user) =>
  state.map((u) => (u.id === user.id ? user : u))
);
$users.on(deleteUserFx.done, (state, { params }) =>
  state.filter((u) => u.id !== params)
);

$selectedUserId.on(selectUser, (_, id) => id);
$selectedUserId.reset([clearSelection, fetchUserFx.fail, deleteUserFx.done]);

$currentUser.on(fetchUserFx.doneData, (_, user) => user);
$currentUser.on(createUserFx.doneData, (_, user) => user);
$currentUser.on(updatePasswordFx.doneData, (_, user) => user);
$currentUser.reset([clearSelection, fetchUserFx.fail, deleteUserFx.done]);

$usersStatus
  .on(fetchUsersFx, () => "loading")
  .on(fetchUsersFx.done, () => "success")
  .on(fetchUsersFx.fail, () => "error");

$currentUserStatus
  .on(fetchUserFx, () => "loading")
  .on(createUserFx, () => "loading")
  .on(updatePasswordFx, () => "loading")
  .on(fetchUserFx.done, () => "success")
  .on(createUserFx.done, () => "success")
  .on(updatePasswordFx.done, () => "success")
  .on(fetchUserFx.fail, () => "error")
  .on(createUserFx.fail, () => "error")
  .on(updatePasswordFx.fail, () => "error")
  .reset([clearSelection, fetchUserFx.fail, deleteUserFx.done]);

$error
  .reset([
    fetchUsersFx,
    fetchUserFx,
    createUserFx,
    updatePasswordFx,
    deleteUserFx,
    clearSelection,
  ])
  .on(fetchUsersFx.failData, (_, error) => error.message)
  .on(fetchUserFx.failData, (_, error) => error.message)
  .on(createUserFx.failData, (_, error) => error.message)
  .on(updatePasswordFx.failData, (_, error) => error.message)
  .on(deleteUserFx.failData, (_, error) => error.message);

sample({
  clock: startUsersFlow,
  target: [fetchUsersFx, readSelectedUserFx],
});

sample({
  clock: readSelectedUserFx.doneData,
  filter: (id): id is string => Boolean(id),
  target: selectUser,
});

sample({
  clock: selectUser,
  target: [saveSelectedUserFx, fetchUserFx],
});

sample({
  clock: createUserFx.doneData,
  fn: (user) => user.id,
  target: selectUser,
});

sample({
  clock: [clearSelection, fetchUserFx.fail, deleteUserFx.done],
  fn: () => undefined,
  target: clearSelectedUserFx,
});
