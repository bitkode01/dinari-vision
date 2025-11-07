import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  next_run_date: string;
  last_run_date: string | null;
  notes: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting process-recurring-transactions');

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('Processing recurring transactions for date:', today);

    // Fetch all active recurring transactions that are due today or earlier
    const { data: recurringTransactions, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_date', today);

    if (fetchError) {
      console.error('Error fetching recurring transactions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringTransactions?.length || 0} recurring transactions to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each recurring transaction
    for (const recurring of recurringTransactions || []) {
      try {
        console.log(`Processing recurring transaction: ${recurring.id} - ${recurring.title}`);

        // Create the actual transaction
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: recurring.user_id,
            title: recurring.title,
            amount: recurring.amount,
            type: recurring.type,
            category: recurring.category,
            date: new Date().toISOString(),
            notes: recurring.notes ? `${recurring.notes} (Auto-generated)` : 'Auto-generated',
          });

        if (insertError) {
          console.error(`Error creating transaction for ${recurring.id}:`, insertError);
          errorCount++;
          continue;
        }

        // Calculate next run date based on frequency
        const currentDate = new Date(recurring.next_run_date);
        let nextRunDate: Date;

        switch (recurring.frequency) {
          case 'daily':
            nextRunDate = new Date(currentDate);
            nextRunDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            nextRunDate = new Date(currentDate);
            nextRunDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            nextRunDate = new Date(currentDate);
            nextRunDate.setMonth(currentDate.getMonth() + 1);
            break;
          default:
            nextRunDate = new Date(currentDate);
            nextRunDate.setDate(currentDate.getDate() + 1);
        }

        // Update the recurring transaction
        const { error: updateError } = await supabase
          .from('recurring_transactions')
          .update({
            last_run_date: today,
            next_run_date: nextRunDate.toISOString().split('T')[0],
          })
          .eq('id', recurring.id);

        if (updateError) {
          console.error(`Error updating recurring transaction ${recurring.id}:`, updateError);
          errorCount++;
          continue;
        }

        processedCount++;
        console.log(`Successfully processed: ${recurring.title}`);
      } catch (err) {
        console.error(`Error processing recurring transaction ${recurring.id}:`, err);
        errorCount++;
      }
    }

    const result = {
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: recurringTransactions?.length || 0,
      timestamp: new Date().toISOString(),
    };

    console.log('Process completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Fatal error in process-recurring-transactions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
