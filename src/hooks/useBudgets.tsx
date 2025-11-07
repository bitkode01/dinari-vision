import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetInput {
  category: string;
  amount: number;
  month: number;
  year: number;
}

export const useBudgets = (month?: number, year?: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch budgets for current user (filtered by month/year if provided)
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', user?.id, month, year],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (month !== undefined && year !== undefined) {
        query = query.eq('month', month).eq('year', year);
      }

      const { data, error } = await query.order('category', { ascending: true });

      if (error) {
        console.error('Error fetching budgets:', error);
        throw error;
      }

      return data as Budget[];
    },
    enabled: !!user,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['budgets', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Create or update budget (upsert)
  const saveBudget = useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      if (!user) throw new Error('User not authenticated');

      // Check if budget already exists
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', input.category)
        .eq('month', input.month)
        .eq('year', input.year)
        .maybeSingle();

      if (existing) {
        // Update existing budget
        const { data, error } = await supabase
          .from('budgets')
          .update({ amount: input.amount })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new budget
        const { data, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            category: input.category,
            amount: input.amount,
            month: input.month,
            year: input.year,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget berhasil disimpan');
    },
    onError: (error: any) => {
      console.error('Error saving budget:', error);
      toast.error('Gagal menyimpan budget');
    },
  });

  // Delete budget
  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget berhasil dihapus');
    },
    onError: (error: any) => {
      console.error('Error deleting budget:', error);
      toast.error('Gagal menghapus budget');
    },
  });

  return {
    budgets,
    isLoading,
    saveBudget: saveBudget.mutate,
    deleteBudget: deleteBudget.mutate,
    isSaving: saveBudget.isPending,
    isDeleting: deleteBudget.isPending,
  };
};
