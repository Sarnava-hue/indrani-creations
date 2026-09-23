export type UserRole =
  | "CUSTOMER"
  | "ADMIN";

export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
};

export type SessionPayload = {
  userId: number;
  email: string;
  role: UserRole;
};