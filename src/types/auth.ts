interface AuthContextType {
  user: User | null;
  roles: string[];        // vse vloge uporabnika
  activeRole: string;     // trenutno aktivna vloga
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: string) => void; // nova funkcija za preklop vloge
  error: string | null;
}

// Tip za uporabniške vloge
type UserRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

// Tip za uporabniške pravice
type Permission = {
  id: string;
  name: string;
  description: string;
};
