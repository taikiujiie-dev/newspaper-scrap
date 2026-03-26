import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 今月の使用量を取得
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr = now.toISOString().split('T')[0];

    const res = await fetch(
      `https://api.anthropic.com/v1/organizations/usage?start_date=${startStr}&end_date=${endStr}`,
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    if (!res.ok) {
      // usage APIが使えない場合はCost APIで代替
      const costRes = await fetch(
        `https://api.anthropic.com/v1/usage?start_date=${startStr}&end_date=${endStr}`,
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01',
          },
        }
      );
      if (!costRes.ok) throw new Error('API unavailable');
      const costData = await costRes.json();
      const totalCost = costData.total_cost_usd || 0;
      const remaining = Math.max(0, 5.0 - totalCost);
      const shots = Math.floor(remaining / 0.01);
      return NextResponse.json({ remaining: remaining.toFixed(2), shots });
    }

    const data = await res.json();
    const totalCost = data.total_cost_usd || 0;
    const remaining = Math.max(0, 5.0 - totalCost);
    const shots = Math.floor(remaining / 0.01);
    return NextResponse.json({ remaining: remaining.toFixed(2), shots });
  } catch {
    // API取得失敗時はnullを返す
    return NextResponse.json({ remaining: null, shots: null });
  }
}
