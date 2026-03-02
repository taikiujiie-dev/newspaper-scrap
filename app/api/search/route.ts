import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [
          {
            role: 'user',
            content: `「${query}」に関連する記事を3件探してください。ニュース・コラム・解説・意見記事など、読んで役立つものなら何でもOKです。以下のJSON形式のみで返してください。余分なテキスト不要。
[
  {"title": "タイトル", "description": "80字以内の概要", "url": "URL"},
  {"title": "タイトル", "description": "80字以内の概要", "url": "URL"},
  {"title": "タイトル", "description": "80字以内の概要", "url": "URL"}
]`,
          },
        ],
      }),
    });

    const data = await res.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
    const text = textBlock?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const results = JSON.parse(clean);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
