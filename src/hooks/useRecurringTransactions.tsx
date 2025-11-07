import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  frequency: FrequencyType;
  next_run_date: string;
  last_run_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringTransactionInput {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  frequency: FrequencyType;
  next_run_date: string;
  notes?: string;
}

export const useRecurringTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all recurring transactions for current user
  const { data: recurringTransactions = [], isLoading } = useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_run_date', { ascending: true });

      if (error) {
        console.error('Error fetching recurring transactions:', error);
        throw error;
      }

      return data as RecurringTransaction[];
    },
    enabled: !!user,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('recurring-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recurring_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recurring-transactions', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Create recurring transaction
  const createRecurringTransaction = useMutation({
    mutationFn: async (input: CreateRecurringTransactionInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: user.id,
          title: input.title,
          amount: input.amount,
          type: input.type,
          category: input.category,
          frequency: input.frequency,
          next_run_date: input.next_run_date,
          notes: input.notes,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success('Transaksi berulang berhasil dibuat');
    },
    onError: (error: any) => {
      console.error('Error creating recurring transaction:', error);
      toast.error('Gagal membuat transaksi berulang');
    },
  });

  // Update recurring transaction
  const updateRecurringTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringTransaction> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success('Transaksi berulang berhasil diperbarui');
    },
    onError: (error: any) => {
      console.error('Error updating recurring transaction:', error);
      toast.error('Gagal memperbarui transaksi berulang');
    },
  });

  // Toggle active status
  const toggleRecurringTransaction = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ is_active })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success('Status berhasil diubah');
    },
    onError: (error: any) => {
      console.error('Error toggling recurring transaction:', error);
      toast.error('Gagal mengubah status');
    },
  });

  // Delete recurring transaction
  const deleteRecurringTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success('Transaksi berulang berhasil dihapus');
    },
    onError: (error: any) => {
      console.error('Error deleting recurring transaction:', error);
      toast.error('Gagal menghapus transaksi berulang');
    },
  });

  return {
    recurringTransactions,
    isLoading,
    createRecurringTransaction: createRecurringTransaction.mutate,
    updateRecurringTransaction: updateRecurringTransaction.mutate,
    toggleRecurringTransaction: toggleRecurringTransaction.mutate,
    deleteRecurringTransaction: deleteRecurringTransaction.mutate,
    isCreating: createRecurringTransaction.isPending,
    isUpdating: updateRecurringTransaction.isPending,
    isDeleting: deleteRecurringTransaction.isPending,
  };
};
