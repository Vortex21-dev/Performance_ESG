// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Profile } from '../types/auth';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  impersonatedOrganization: string | null;
  logoUrl: string | null; // ← nouveau

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setImpersonatedOrganization: (orgName: string | null) => void;
  setLogoUrl: (url: string | null) => void; // ← nouveau

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, companyName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeSession: () => Promise<void>;

  // synchronisation auto du logo
  fetchLogoUrl: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      impersonatedOrganization: null,
      logoUrl: null,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setImpersonatedOrganization: (orgName) => set({ impersonatedOrganization: orgName }),
      setLogoUrl: (url) => set({ logoUrl: url }),

      /* --- Session initiale --- */
      initializeSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            set({ loading: false });
            return;
          }

          const [{ data: userData }, { data: profileData }] = await Promise.all([
            supabase.from('users').select('*').eq('email', session.user.email).single(),
            supabase.from('profiles').select('*').eq('email', session.user.email).single(),
          ]);

          // création profil si absent
          let finalProfile = profileData;
          if (!profileData) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({ email: session.user.email, role: 'contributor' })
              .select()
              .single();
            if (createError) throw createError;
            finalProfile = newProfile;
          }

          // récupération du logo
          const orgName = get().impersonatedOrganization || finalProfile?.company_name || userData?.entreprise;
          if (orgName) {
            const { data: org } = await supabase
              .from('organizations')
              .select('logo_url')
              .eq('name', orgName)
              .single();
            if (org?.logo_url) {
              set({ logoUrl: org.logo_url });
            }
          }

          set({ user: userData, profile: finalProfile, loading: false });
        } catch (err) {
          console.error(err);
          set({ loading: false });
        }
      },

      /* --- Sign-in --- */
      signIn: async (email, password) => {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        const [{ data: userData }, { data: profileData }] = await Promise.all([
          supabase.from('users').select('*').eq('email', email).single(),
          supabase.from('profiles').select('*').eq('email', email).single(),
        ]);

        const orgName = profileData?.company_name || userData?.entreprise;
        if (orgName) {
          const { data: org } = await supabase
            .from('organizations')
            .select('logo_url')
            .eq('name', orgName)
            .single();
          if (org?.logo_url) {
            set({ logoUrl: org.logo_url });
          }
        }

        set({ user: userData, profile: profileData, loading: false });
      },

      /* --- Sign-up --- */
      signUp: async (email, password, companyName) => {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        await supabase.from('users').insert([{ email, entreprise: companyName }]);
        await supabase.from('profiles').insert([{ email, role: 'enterprise', company_name: companyName }]);
      },

      /* --- Sign-out --- */
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // on purge tout
        set({ user: null, profile: null, loading: false, impersonatedOrganization: null, logoUrl: null });
      },

      /* --- Récupération du logo --- */
      fetchLogoUrl: async () => {
        const orgName = get().impersonatedOrganization || get().profile?.company_name || get().user?.entreprise;
        if (!orgName) return;
        
        const { data, error } = await supabase
          .from('organizations')
          .select('logo_url')
          .eq('name', orgName)
          .single();
        
        if (!error && data?.logo_url) {
          set({ logoUrl: data.logo_url });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        impersonatedOrganization: state.impersonatedOrganization,
        logoUrl: state.logoUrl,
      }),
    },
  ),
);