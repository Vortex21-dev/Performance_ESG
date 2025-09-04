import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CollectionPeriod, IndicatorValue, ValueHistory } from '../types/collection';
import toast from 'react-hot-toast';

interface CollectionStore {
  periods: CollectionPeriod[];
  values: IndicatorValue[];
  history: ValueHistory[];
  loading: boolean;
  selectedPeriod: string | null;
  fetchPeriods: (organizationName: string) => Promise<void>;
  fetchValues: (periodId: string) => Promise<void>;
  fetchHistory: (valueId: string) => Promise<void>;
  updateValue: (value: Partial<IndicatorValue> & { id: string }) => Promise<void>;
  submitValues: (valueIds: string[]) => Promise<void>;
  validateValues: (valueIds: string[], approved: boolean, comment?: string) => Promise<void>;
  setSelectedPeriod: (periodId: string | null) => void;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  periods: [],
  values: [],
  history: [],
  loading: false,
  selectedPeriod: null,

  setSelectedPeriod: (periodId) => set({ selectedPeriod: periodId }),

  fetchPeriods: async (organizationName) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('collection_periods')
        .select('*')
        .eq('organization_name', organizationName)
        .order('year', { ascending: false })
        .order('period_number', { ascending: false });

      if (error) throw error;
      set({ periods: data || [] });
    } catch (err) {
      console.error('Error fetching periods:', err);
      toast.error('Erreur lors du chargement des périodes');
    } finally {
      set({ loading: false });
    }
  },

  fetchValues: async (periodId) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('indicator_values')
        .select('*')
        .eq('period_id', periodId);

      if (error) throw error;
      set({ values: data || [] });
    } catch (err) {
      console.error('Error fetching values:', err);
      toast.error('Erreur lors du chargement des valeurs');
    } finally {
      set({ loading: false });
    }
  },

  fetchHistory: async (valueId) => {
    try {
      const { data, error } = await supabase
        .from('value_history')
        .select('*')
        .eq('indicator_value_id', valueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ history: data || [] });
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Erreur lors du chargement de l\'historique');
    }
  },

  updateValue: async (value) => {
    try {
      const { error } = await supabase
        .from('indicator_values')
        .update(value)
        .eq('id', value.id);

      if (error) throw error;
      
      const { values } = get();
      set({
        values: values.map(v => 
          v.id === value.id ? { ...v, ...value } : v
        )
      });
      
      toast.success('Valeur mise à jour avec succès');
    } catch (err) {
      console.error('Error updating value:', err);
      toast.error('Erreur lors de la mise à jour de la valeur');
    }
  },

  submitValues: async (valueIds) => {
    try {
      const { error } = await supabase
        .from('indicator_values')
        .update({
          status: 'submitted',
          submitted_by: (await supabase.auth.getUser()).data.user?.email,
          submitted_at: new Date().toISOString()
        })
        .in('id', valueIds);

      if (error) throw error;

      const { values } = get();
      set({
        values: values.map(v => 
          valueIds.includes(v.id) 
            ? { 
                ...v, 
                status: 'submitted',
                submitted_by: (supabase.auth.getUser() as any).data.user?.email,
                submitted_at: new Date().toISOString()
              } 
            : v
        )
      });

      toast.success('Valeurs soumises avec succès');
    } catch (err) {
      console.error('Error submitting values:', err);
      toast.error('Erreur lors de la soumission des valeurs');
    }
  },

  validateValues: async (valueIds, approved, comment) => {
    try {
      const { error } = await supabase
        .from('indicator_values')
        .update({
          status: approved ? 'validated' : 'rejected',
          validated_by: (await supabase.auth.getUser()).data.user?.email,
          validated_at: new Date().toISOString(),
          comment: comment
        })
        .in('id', valueIds);

      if (error) throw error;

      const { values } = get();
      set({
        values: values.map(v => 
          valueIds.includes(v.id)
            ? {
                ...v,
                status: approved ? 'validated' : 'rejected',
                validated_by: (supabase.auth.getUser() as any).data.user?.email,
                validated_at: new Date().toISOString(),
                comment: comment
              }
            : v
        )
      });

      toast.success(approved ? 'Valeurs validées avec succès' : 'Valeurs rejetées');
    } catch (err) {
      console.error('Error validating values:', err);
      toast.error('Erreur lors de la validation des valeurs');
    }
  }
}));