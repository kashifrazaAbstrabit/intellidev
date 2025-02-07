export interface IUser {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  user_type: string;
  auth_type: string;
  country: string;
  invitationToken?: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  token: string;
}

export interface ResetPasswordBody {
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordBody {
  email: string;
  reset_password_token_expires: number;
}

export interface UpdatePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface User {
  id: number;
  is_verified: boolean;
  verification_token_expiry: Date;

  email: string;
  first_name: string;
  last_name: string;
}
