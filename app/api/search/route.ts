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
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [
          {
            role: 'user',
            content: `「${query}」に関連する最新ニュースを3件検索して、以下のJSON形式のみで返してください。他のテキストは不要です。
[
  {"title": "記事タイトル", "description": "100字以内の概要", "url": "URL"},
  {"title": "記事タイトル", "description": "100字以内の概要", "url": "URL"},
  {"title": "記事タイトル", "description": "100字以内の概要", "url": "URL"}
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
