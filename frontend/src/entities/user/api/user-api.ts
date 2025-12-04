import { request } from "@/shared/api/client";

export interface UserDto {
  id: string;
  name: string;
  has_password: boolean;
}

export interface User {
  id: string;
  name: string;
  hasPassword: boolean;
}

export interface CreateUserPayload {
  name: string;
  password?: string;
}

export interface UpdatePasswordPayload {
  userId: string;
  password?: string;
}

const mapUser = (dto: UserDto): User => ({
  id: dto.id,
  name: dto.name,
  hasPassword: dto.has_password,
});

export const fetchUsers = async (): Promise<User[]> => {
  const data = await request<UserDto[]>("/api/v1/users");
  return data.map(mapUser);
};

export const fetchUser = async (userId: string): Promise<User> => {
  const data = await request<UserDto>(`/api/v1/users/${userId}`);
  return mapUser(data);
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const data = await request<UserDto>("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapUser(data);
};

export const updatePassword = async ({
  userId,
  password,
}: UpdatePasswordPayload): Promise<User> => {
  const data = await request<UserDto>(`/api/v1/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password: password ?? null }),
  });
  return mapUser(data);
};

export const deleteUser = async (userId: string): Promise<void> => {
  await request<void>(`/api/v1/users/${userId}`, { method: "DELETE" });
};
