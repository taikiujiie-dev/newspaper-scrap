'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TAGS = ['経済', '政治', '社会', '国際', '科学', 'スポーツ', '文化', 'IT'];

type Scrap = {
  id: number;
  title: string;
  summary: string;
  memo: string;
  tags: string;
  image_url: string;
  created_at: string;
};

type NewsResult = {
  title: string;
  description: string;
  url: string;
};

export default function Home() {
  const [screen, setScreen] = useState<'home' | 'result' | 'scrapbook' | 'detail'>('home');
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [current, setCurrent] = useState<Scrap | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<{ title: string; summary: string; imageUrl: string } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [searchTag, setSearchTag] = useState('すべて');
  const [newsResults, setNewsResults] = useState<NewsResult[]>([]);
  const [searchingNews, setSearchingNews] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchScraps(); }, []);

  const fetchScraps = async () => {
    const { data } = await supabase.from('scraps').select('*').order('created_at', { ascending: false });
    if (data) setScraps(data);
  };

  const searchNews = async (title: string) => {
    setSearchingNews(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title }),
      });
      const data = await res.json();
      setNewsResults(data.results || []);
    } catch {
      setNewsResults([]);
    }
    setSearchingNews(false);
  };

  const handleFile = useCallback(async (file: File) => {
    setAnalyzing(true);
    setNewsResults([]);
    setScreen('result');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mediaType: file.type }),
        });
        const data = await res.json();
        setAnalyzed({ ...data, imageUrl: e.target?.result as string });
        searchNews(data.title);
      } catch {
        setAnalyzed({ title: '読み取りに失敗しました', summary: 'もう一度お試しください。', imageUrl: e.target?.result as string });
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = async () => {
    if (!analyzed) return;
    await supabase.from('scraps').insert({
      title: analyzed.title,
      summary: analyzed.summary,
      memo,
      tags: selectedTags.join(','),
      image_url: analyzed.imageUrl,
    });
    await fetchScraps();
    setSelectedTags([]);
    setMemo('');
    setAnalyzed(null);
    setNewsResults([]);
    setScreen('scrapbook');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このスクラップを削除しますか？')) return;
    setDeleting(true);
    await supabase.from('scraps').delete().eq('id', id);
    await fetchScraps();
    setDeleting(false);
    setScreen('scrapbook');
  };

  const filtered = searchTag === 'すべて' ? scraps : scraps.filter(s => s.tags?.includes(searchTag));

  const g = {
    page: { fontFamily: "'Helvetica Neue', 'Hiragino Sans', sans-serif", minHeight: '100vh', background: '#fafafa', color: '#111' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #ebebeb', background: '#fff', position: 'sticky' as const, top: 0, zIndex: 10 },
    logo: { fontSize: '15px', fontWeight: 600, letterSpacing: '0.02em' },
    navBtn: { fontSize: '13px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' },
    body: { maxWidth: '520px', margin: '0 auto', padding: '32px 24px' },
    h1: { fontSize: '22px', fontWeight: 500, marginBottom: '8px', lineHeight: 1.4 },
    sub: { fontSize: '13px', color: '#888', lineHeight: 1.7, marginBottom: '32px' },
    uploadBox: { border: '1px dashed #ccc', borderRadius: '8px', padding: '48px 24px', textAlign: 'center' as const, cursor: 'pointer', background: '#fff' },
    section: { marginBottom: '28px' },
    sectionTitle: { fontSize: '11px', fontWeight: 600, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '12px' },
    card: { background: '#fff', border: '1px solid #ebebeb', borderRadius: '8px', padding: '20px', marginBottom: '12px' },
    articleTitle: { fontSize: '17px', fontWeight: 600, lineHeight: 1.5, marginBottom: '10px' },
    articleBody: { fontSize: '13px', color: '#555', lineHeight: 1.8 },
    tag: (active: boolean) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', margin: '3px', cursor: 'pointer', border: active ? '1px solid #111' : '1px solid #ddd', background: active ? '#111' : '#fff', color: active ? '#fff' : '#555' }),
    textarea: { width: '100%', minHeight: '80px', border: '1px solid #ebebeb', borderRadius: '6px', padding: '12px', fontSize: '13px', background: '#fff', resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#111' },
    btnPrimary: { width: '100%', padding: '13px', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '10px' },
    btnSecondary: { width: '100%', padding: '13px', background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', marginBottom: '10px' },
    btnDanger: { width: '100%', padding: '13px', background: '#fff', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' },
    newsItem: { padding: '14px 0', borderBottom: '1px solid #f0f0f0' },
    newsTitle: { fontSize: '13px', fontWeight: 600, marginBottom: '4px', lineHeight: 1.5 },
    newsDesc: { fontSize: '12px', color: '#888', lineHeight: 1.6, marginBottom: '4px' },
    newsLink: { fontSize: '11px', color: '#aaa', textDecoration: 'none' },
    scrapCard: { background: '#fff', border: '1px solid #ebebeb', borderRadius: '8px', padding: '18px', marginBottom: '10px', cursor: 'pointer' },
    scrapTitle: { fontSize: '15px', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 },
    scrapDate: { fontSize: '11px', color: '#bbb', marginBottom: '8px' },
    scrapBody: { fontSize: '13px', color: '#777', lineHeight: 1.6 },
    dot: { width: '6px', height: '6px', borderRadius: '50%', background: '#111', display: 'inline-block', margin: '0 4px' },
  };

  if (screen === 'home') return (
    <div style={g.page}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
      <header style={g.header}>
        <span style={g.logo}>新聞スクラップ帳</span>
        <button style={g.navBtn} onClick={() => setScreen('scrapbook')}>一覧 →</button>
      </header>
      <div style={g.body}>
        <h1 style={g.h1}>気になった記事を、<br />残そう。</h1>
        <p style={g.sub}>写真を撮るだけでAIが読み取り、関連ニュースを検索。タグとメモで整理できます。</p>
        <div style={g.uploadBox} onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>↑</div>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>記事を撮影 / 選択</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>JPG・PNG・HEIC対応</div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        {scraps.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <div style={g.sectionTitle}>最近のスクラップ</div>
            {scraps.slice(0, 3).map(sc => (
              <div key={sc.id} style={g.scrapCard} onClick={() => { setCurrent(sc); setScreen('detail'); }}>
                <div style={g.scrapTitle}>{sc.title}</div>
                <div style={g.scrapDate}>{sc.created_at?.slice(0, 10)}</div>
                <div style={g.scrapBody}>{sc.summary?.slice(0, 60)}…</div>
                <div style={{ marginTop: '10px' }}>{sc.tags?.split(',').filter(Boolean).map(t => <span key={t} style={g.tag(false)}>{t}</span>)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (screen === 'result') return (
    <div style={g.page}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
      <header style={g.header}>
        <span style={g.logo}>新聞スクラップ帳</span>
        <button style={g.navBtn} onClick={() => setScreen('home')}>← 戻る</button>
      </header>
      <div style={g.body}>
        {analyzing ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#888' }}>AIが読み取っています</div>
            <div>
              {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ ...g.dot, animation: `pulse 1.2s ${d}s infinite` }} />)}
            </div>
          </div>
        ) : analyzed ? (
          <>
            <div style={{ ...g.card, marginBottom: '24px' }}>
              {analyzed.imageUrl && <img src={analyzed.imageUrl} alt="記事" style={{ width: '100%', borderRadius: '4px', marginBottom: '16px', objectFit: 'cover', maxHeight: '180px' }} />}
              <div style={g.articleTitle}>{analyzed.title}</div>
              <div style={g.articleBody}>{analyzed.summary}</div>
            </div>
            <div style={g.section}>
              <div style={g.sectionTitle}>タグ</div>
              <div>{TAGS.map(t => <span key={t} style={g.tag(selectedTags.includes(t))} onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>{t}</span>)}</div>
            </div>
            <div style={g.section}>
              <div style={g.sectionTitle}>メモ</div>
              <textarea style={g.textarea} value={memo} onChange={e => setMemo(e.target.value)} placeholder="感想や考察…" />
            </div>
            <div style={g.section}>
              <div style={g.sectionTitle}>関連ニュース</div>
              {searchingNews ? (
                <div style={{ fontSize: '13px', color: '#aaa', padding: '12px 0' }}>検索中…</div>
              ) : newsResults.length > 0 ? (
                newsResults.map((n, i) => (
                  <div key={i} style={g.newsItem}>
                    <div style={g.newsTitle}>{n.title}</div>
                    <div style={g.newsDesc}>{n.description?.slice(0, 80)}…</div>
                    <a href={n.url} target="_blank" rel="noopener noreferrer" style={g.newsLink}>
                      {(() => { try { return new URL(n.url).hostname; } catch { return n.url; } })()}
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: '#aaa', padding: '12px 0' }}>関連ニュースが見つかりませんでした</div>
              )}
            </div>
            <button style={g.btnPrimary} onClick={handleSave}>スクラップに保存</button>
            <button style={g.btnSecondary} onClick={() => setScreen('home')}>キャンセル</button>
          </>
        ) : null}
      </div>
    </div>
  );

  if (screen === 'scrapbook') return (
    <div style={g.page}>
      <header style={g.header}>
        <span style={g.logo}>新聞スクラップ帳</span>
        <button style={g.navBtn} onClick={() => setScreen('home')}>← ホーム</button>
      </header>
      <div style={g.body}>
        <div style={{ marginBottom: '24px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {['すべて', ...TAGS].map(t => <span key={t} style={g.tag(searchTag === t)} onClick={() => setSearchTag(t)}>{t}</span>)}
        </div>
        {filtered.length === 0 && <div style={{ fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '60px 0' }}>スクラップがありません</div>}
        {filtered.map(sc => (
          <div key={sc.id} style={g.scrapCard} onClick={() => { setCurrent(sc); setScreen('detail'); }}>
            <div style={g.scrapTitle}>{sc.title}</div>
            <div style={g.scrapDate}>{sc.created_at?.slice(0, 10)}</div>
            <div style={g.scrapBody}>{sc.summary?.slice(0, 80)}…</div>
            <div style={{ marginTop: '10px' }}>{sc.tags?.split(',').filter(Boolean).map(t => <span key={t} style={g.tag(false)}>{t}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (screen === 'detail' && current) return (
    <div style={g.page}>
      <header style={g.header}>
        <span style={g.logo}>新聞スクラップ帳</span>
        <button style={g.navBtn} onClick={() => setScreen('scrapbook')}>← 一覧</button>
      </header>
      <div style={g.body}>
        <div style={g.card}>
          {current.image_url && <img src={current.image_url} alt="記事" style={{ width: '100%', borderRadius: '4px', marginBottom: '16px', objectFit: 'cover', maxHeight: '200px' }} />}
          <div style={g.scrapDate}>{current.created_at?.slice(0, 10)}</div>
          <div style={g.articleTitle}>{current.title}</div>
          <div style={g.articleBody}>{current.summary}</div>
        </div>
        {current.tags && (
          <div style={g.section}>
            <div style={g.sectionTitle}>タグ</div>
            {current.tags.split(',').filter(Boolean).map(t => <span key={t} style={g.tag(true)}>{t}</span>)}
          </div>
        )}
        {current.memo && (
          <div style={g.section}>
            <div style={g.sectionTitle}>メモ</div>
            <div style={{ ...g.card, fontSize: '13px', lineHeight: 1.8, color: '#555' }}>{current.memo}</div>
          </div>
        )}
        <button
          style={{ ...g.btnDanger, opacity: deleting ? 0.5 : 1 }}
          onClick={() => handleDelete(current.id)}
          disabled={deleting}
        >
          {deleting ? '削除中…' : 'このスクラップを削除'}
        </button>
      </div>
    </div>
  );

  return null;
}
