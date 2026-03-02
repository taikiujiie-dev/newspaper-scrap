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

export default function Home() {
  const [screen, setScreen] = useState<'home' | 'result' | 'scrapbook' | 'detail'>('home');
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [current, setCurrent] = useState<Scrap | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<{ title: string; summary: string; imageUrl: string } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [searchTag, setSearchTag] = useState('すべて');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchScraps();
  }, []);

  const fetchScraps = async () => {
    const { data } = await supabase.from('scraps').select('*').order('created_at', { ascending: false });
    if (data) setScraps(data);
  };

  const handleFile = useCallback(async (file: File) => {
    setAnalyzing(true);
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
      } catch {
        setAnalyzed({ title: '読み取りに失敗しました', summary: 'もう一度お試しください。', imageUrl: e.target?.result as string });
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = async () => {
    if (!analyzed) return;
    const { error } = await supabase.from('scraps').insert({
      title: analyzed.title,
      summary: analyzed.summary,
      memo,
      tags: selectedTags.join(','),
      image_url: analyzed.imageUrl,
    });
    if (!error) {
      await fetchScraps();
      setSelectedTags([]);
      setMemo('');
      setAnalyzed(null);
      setScreen('scrapbook');
    }
  };

  const filtered = searchTag === 'すべて' ? scraps : scraps.filter(s => s.tags?.includes(searchTag));

  const s = {
    app: { fontFamily: "'Hiragino Sans', sans-serif", minHeight: '100vh', background: '#f5f0e8', color: '#1a1208' },
    header: { background: '#1a1208', color: '#f5f0e8', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #c8a04a' },
    logo: { fontSize: '18px', fontWeight: 700, letterSpacing: '0.05em' },
    body: { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' },
    card: { background: '#fffdf7', border: '1px solid #d4c5a0', borderRadius: '4px', padding: '20px', marginBottom: '16px', boxShadow: '2px 2px 8px rgba(0,0,0,0.06)' },
    capture: { border: '2px dashed #c8a04a', borderRadius: '4px', padding: '48px 20px', textAlign: 'center' as const, background: '#fffdf7', cursor: 'pointer' },
    btn: (v = 'primary') => ({ padding: '10px 24px', background: v === 'primary' ? '#1a1208' : 'transparent', color: v === 'primary' ? '#f5f0e8' : '#1a1208', border: v === 'primary' ? 'none' : '1px solid #1a1208', borderRadius: '2px', cursor: 'pointer', fontSize: '14px' }),
    tag: (active: boolean) => ({ padding: '4px 12px', border: `1px solid ${active ? '#c8a04a' : '#aaa'}`, background: active ? '#c8a04a' : 'transparent', color: active ? '#1a1208' : '#555', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', margin: '4px', display: 'inline-block' }),
    scrapCard: { background: '#fffdf7', border: '1px solid #d4c5a0', borderRadius: '4px', padding: '16px', marginBottom: '12px', cursor: 'pointer', boxShadow: '2px 2px 6px rgba(0,0,0,0.05)' },
    navBtn: { padding: '6px 14px', border: '1px solid #f5f0e8', background: 'transparent', color: '#f5f0e8', borderRadius: '2px', cursor: 'pointer', fontSize: '13px' },
  };

  if (screen === 'home') return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.logo}>📰 新聞スクラップ帳</div>
        <button style={s.navBtn} onClick={() => setScreen('scrapbook')}>スクラップ一覧</button>
      </header>
      <div style={s.body}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>気になった記事を、残そう。</h2>
          <p style={{ color: '#555', fontSize: '14px' }}>新聞の写真を撮るだけで、AIが内容を読み取り関連ニュースを検索。メモやタグで整理できます。</p>
        </div>
        <div style={s.capture} onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>記事を撮影する</div>
          <div style={{ fontSize: '13px', color: '#888' }}>タップして写真を選択</div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>最近のスクラップ</h3>
          {scraps.slice(0, 3).map(sc => (
            <div key={sc.id} style={s.scrapCard} onClick={() => { setCurrent(sc); setScreen('detail'); }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>{sc.title}</div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>{sc.created_at?.slice(0, 10)}</div>
              <div style={{ fontSize: '13px', color: '#444' }}>{sc.summary?.slice(0, 60)}…</div>
              <div style={{ marginTop: '8px' }}>{sc.tags?.split(',').map(t => <span key={t} style={s.tag(false)}>{t}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === 'result') return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.logo}>📰 新聞スクラップ帳</div>
        <button style={s.navBtn} onClick={() => setScreen('home')}>← 戻る</button>
      </header>
      <div style={s.body}>
        {analyzing ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '16px' }}>AIが記事を読み取っています…</div>
          </div>
        ) : analyzed ? (
          <>
            <div style={s.card}>
              {analyzed.imageUrl && <img src={analyzed.imageUrl} alt="記事" style={{ width: '100%', borderRadius: '2px', marginBottom: '16px', objectFit: 'cover', maxHeight: '200px' }} />}
              <h2 style={{ fontSize: '18px', marginBottom: '12px', lineHeight: 1.6 }}>{analyzed.title}</h2>
              <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }}>{analyzed.summary}</p>
            </div>
            <div style={s.card}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>🔖 タグを選ぶ</h3>
              {TAGS.map(t => <span key={t} style={s.tag(selectedTags.includes(t))} onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>{t}</span>)}
            </div>
            <div style={s.card}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>📝 メモ</h3>
              <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="感想や考察をメモ…" style={{ width: '100%', minHeight: '80px', border: '1px solid #d4c5a0', borderRadius: '2px', padding: '10px', fontSize: '14px', background: '#fffdf7', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={s.btn('secondary')} onClick={() => setScreen('home')}>キャンセル</button>
              <button style={s.btn('primary')} onClick={handleSave}>スクラップに保存</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  if (screen === 'scrapbook') return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.logo}>📰 新聞スクラップ帳</div>
        <button style={s.navBtn} onClick={() => setScreen('home')}>← ホーム</button>
      </header>
      <div style={s.body}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>スクラップ一覧</h2>
        <div style={{ marginBottom: '16px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {['すべて', ...TAGS].map(t => <span key={t} style={s.tag(searchTag === t)} onClick={() => setSearchTag(t)}>{t}</span>)}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>スクラップがありません</div>}
        {filtered.map(sc => (
          <div key={sc.id} style={s.scrapCard} onClick={() => { setCurrent(sc); setScreen('detail'); }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{sc.title}</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{sc.created_at?.slice(0, 10)}</div>
            <div style={{ fontSize: '13px', color: '#444' }}>{sc.summary?.slice(0, 80)}…</div>
            <div style={{ marginTop: '8px' }}>{sc.tags?.split(',').filter(Boolean).map(t => <span key={t} style={s.tag(false)}>{t}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (screen === 'detail' && current) return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.logo}>📰 新聞スクラップ帳</div>
        <button style={s.navBtn} onClick={() => setScreen('scrapbook')}>← 一覧へ</button>
      </header>
      <div style={s.body}>
        <div style={s.card}>
          {current.image_url && <img src={current.image_url} alt="記事" style={{ width: '100%', borderRadius: '2px', marginBottom: '16px', objectFit: 'cover', maxHeight: '220px' }} />}
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{current.created_at?.slice(0, 10)}</div>
          <h2 style={{ fontSize: '19px', lineHeight: 1.6, marginBottom: '12px' }}>{current.title}</h2>
          <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.9 }}>{current.summary}</p>
        </div>
        {current.tags && <div style={s.card}><h3 style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>🔖 タグ</h3>{current.tags.split(',').filter(Boolean).map(t => <span key={t} style={s.tag(true)}>{t}</span>)}</div>}
        {current.memo && <div style={s.card}><h3 style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>📝 メモ</h3><p style={{ fontSize: '14px', lineHeight: 1.8 }}>{current.memo}</p></div>}
      </div>
    </div>
  );

  return null;
}
