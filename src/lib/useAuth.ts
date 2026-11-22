'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface AuthUser {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  name: string;
  age?: number | null;
  sex?: string | null;
  bloodGroup?: string | null;
  isDefault: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  profiles: Profile[];
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchProfile: (p: Profile) => void;
  refreshProfiles: () => Promise<void>;
}

import { createContext as rc } from 'react';
export const AuthContext = rc<AuthContextValue>({} as AuthContextValue);

export function useAuth() {
  return useContext(AuthContext);
}
