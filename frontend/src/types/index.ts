export interface User {
  id: string;
  name: string;
  email: string;
  forcePasswordChange?: boolean;
}

export type Role = 'head_admin' | 'admin' | 'sub_admin' | 'merchant';