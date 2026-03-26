import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUDGET = 5.0;      // 購入したクレジット $5
const COST_PER_SHOT = 0.01; // 1回あたり約$0.01

export async function GET() {
  try {
    const { count } = await supabase
      .from('scraps')
      .select('*', { count: 'exact', head: true });

    const used = (count || 0) * COST_PER_SHOT;
    const remaining = Math.max(0, BUDGET - used);
    const shots = Math.floor(remaining / COST_PER_SHOT);

    return NextResponse.json({ remaining: remaining.toFixed(2), shots });
  } catch {
    return NextResponse.json({ remaining: null, shots: null });
  }
}