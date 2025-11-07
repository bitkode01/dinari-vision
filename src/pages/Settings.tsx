import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { BudgetManagement } from "@/components/BudgetManagement";
import { RecurringTransactionManagement } from "@/components/RecurringTransactionManagement";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Loader2, LogOut, Trash2, User, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { transactions } = useTransactions();
  const [activeTab, setActiveTab] = useState("settings");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!user,
  });

  const handleDeleteAllData = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Semua data transaksi berhasil dihapus');
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Error deleting data:', error);
      toast.error('Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "add") {
      setAddDialogOpen(true);
    }
    setActiveTab(tab);
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola akun dan preferensi Anda</p>
      </div>

      {/* Main Content */}
      <div className="space-y-4 px-6">
        {/* Recurring Transactions Management */}
        <RecurringTransactionManagement />

        {/* Budget Management */}
        <BudgetManagement />

        {/* Profile Card */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Informasi Akun</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium text-foreground">
                  {profile?.full_name || 'User'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Card */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Statistik</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terdaftar Sejak</p>
              <p className="text-sm font-medium text-foreground">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                    })
                  : '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-5 w-5" />
            Hapus Semua Data Transaksi
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </Button>
        </div>

        {/* App Info */}
        <Card className="p-5 bg-muted/30">
          <p className="text-center text-sm text-muted-foreground">
            Dinari Wallet v1.0
          </p>
          <p className="text-center text-xs text-muted-foreground mt-1">
            Kelola keuangan dengan mudah
          </p>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua transaksi Anda secara permanen dan tidak dapat
              dibatalkan. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllData}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
