'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TAGS = ['経済', '政治', '社会', '国際', '科学', 'スポーツ', '文化', 'IT'];

const TAG_COLORS: Record<string, string> = {
  '経済': '#ffeb3b', '政治': '#ff7043', '社会': '#66bb6a',
  '国際': '#42a5f5', '科学': '#ab47bc', 'スポーツ': '#26c6da',
  '文化': '#ff7043', 'IT': '#78909c',
};

const ROTATIONS = [-2.5, 1.8, -1.2, 2.1, -0.8, 1.5, -2.0, 0.9];

type Scrap = {
  id: number;
  title: string;
  summary: string;
  memo: string;
  tags: string;
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
  const [analyzed, setAnalyzed] = useState<{ title: string; summary: string } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [searchTag, setSearchTag] = useState('すべて');
  const [newsResults, setNewsResults] = useState<NewsResult[]>([]);
  const [searchingNews, setSearchingNews] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shots, setShots] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchScraps();
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/usage');
      const data = await res.json();
      setShots(data.shots);
    } catch {
      setShots(null);
    }
  };

  const fetchScraps = async () => {
    const { data } = await supabase
      .from('scraps')
      .select('id, title, summary, memo, tags, created_at')
      .order('created_at', { ascending: false });
    if (data) setScraps(data as Scrap[]);
  };

  const searchNews = async (title: string) => {
    setSearchingNews(true);
    setNewsResults([]);
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
        setAnalyzed(data);
        searchNews(data.title);
        fetchUsage(); // 撮影後に残高更新
      } catch {
        setAnalyzed({ title: '読み取りに失敗しました', summary: 'もう一度お試しください。' });
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = async () => {
    if (!analyzed) return;
    const { data } = await supabase.from('scraps').insert({
      title: analyzed.title,
      summary: analyzed.summary,
      memo,
      tags: selectedTags.join(','),
    }).select('id, title, summary, memo, tags, created_at').single();
    if (data) setScraps(prev => [data as Scrap, ...prev]);
    setSelectedTags([]);
    setMemo('');
    setAnalyzed(null);
    setNewsResults([]);
    setScreen('scrapbook');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このスクラップを削除しますか？')) return;
    setDeleting(true);
    setScraps(prev => prev.filter(s => s.id !== id));
    setScreen('scrapbook');
    await supabase.from('scraps').delete().eq('id', id);
    setDeleting(false);
  };

  const handleOpenDetail = async (sc: Scrap) => {
    setCurrent(sc);
    setNewsResults([]);
    setScreen('detail');
    searchNews(sc.title);
  };

  const filtered = searchTag === 'すべて' ? scraps : scraps.filter(s => s.tags?.includes(searchTag));

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Bebas+Neue&family=Noto+Sans+JP:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0ebe0; }

    .page {
      font-family: 'Noto Sans JP', sans-serif;
      min-height: 100vh;
      background: #f0ebe0;
      background-image:
        repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(0,0,0,0.04) 28px),
        repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(0,0,0,0.04) 28px);
      color: #1a1209;
    }

    .header {
      background: #1a1209;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 52px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 22px;
      color: #f0ebe0;
      letter-spacing: 0.1em;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .shots-badge {
      font-size: 10px;
      color: #f0ebe0;
      opacity: 0.7;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .shots-badge span {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 14px;
      color: #ffeb3b;
      opacity: 1;
      margin-right: 2px;
    }

    .nav-btn {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 11px;
      color: #f0ebe0;
      background: none;
      border: 1px solid rgba(240,235,224,0.3);
      cursor: pointer;
      padding: 5px 12px;
      letter-spacing: 0.08em;
    }

    .body { max-width: 540px; margin: 0 auto; padding: 32px 20px; }

    .hero-title {
      font-family: 'Noto Serif JP', serif;
      font-size: 42px;
      font-weight: 900;
      line-height: 1.15;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }

    .hero-sub {
      font-size: 11px;
      color: #7a6e5f;
      line-height: 1.8;
      margin-bottom: 32px;
      letter-spacing: 0.04em;
    }

    .upload-area {
      border: 2px dashed #b5a99a;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      background: rgba(255,255,255,0.5);
      position: relative;
      transition: background 0.2s;
    }
    .upload-area:hover { background: rgba(255,255,255,0.75); }

    .upload-icon { font-size: 36px; margin-bottom: 10px; display: block; }
    .upload-label {
      font-family: 'Noto Serif JP', serif;
      font-size: 18px;
      font-weight: 700;
      display: block;
      margin-bottom: 4px;
    }
    .upload-hint { font-size: 10px; color: #9a8e7f; letter-spacing: 0.06em; }

    .section-label {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 13px;
      letter-spacing: 0.2em;
      color: #9a8e7f;
      margin-bottom: 14px;
      margin-top: 36px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-label::after { content: ''; flex: 1; height: 1px; background: #c8bfb0; }

    .scrap-card {
      background: #fff;
      padding: 16px 18px;
      margin-bottom: 14px;
      cursor: pointer;
      box-shadow: 3px 3px 0 #1a1209;
      border: 1px solid #1a1209;
      position: relative;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .scrap-card:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #1a1209; }

    .tape {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 48px;
      height: 18px;
      background: rgba(255, 235, 100, 0.65);
      border: 1px solid rgba(200, 180, 50, 0.3);
    }

    .card-date { font-size: 9px; letter-spacing: 0.12em; color: #9a8e7f; margin-bottom: 6px; font-family: 'Bebas Neue', sans-serif; }
    .card-title { font-family: 'Noto Serif JP', serif; font-size: 20px; font-weight: 700; line-height: 1.4; margin-bottom: 8px; }
    .card-body { font-size: 11px; color: #5a4e3f; line-height: 1.75; }
    .card-tags { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px; }

    .tag-chip {
      font-size: 9px;
      font-weight: 500;
      padding: 2px 8px;
      letter-spacing: 0.06em;
      border: 1px solid #1a1209;
      cursor: pointer;
    }

    .article-box {
      background: #fff;
      border: 1px solid #1a1209;
      box-shadow: 4px 4px 0 #1a1209;
      padding: 22px;
      margin-bottom: 24px;
      position: relative;
    }

    .article-title { font-family: 'Noto Serif JP', serif; font-size: 26px; font-weight: 900; line-height: 1.35; margin-bottom: 12px; letter-spacing: -0.01em; }
    .article-body { font-size: 12px; color: #3a2e1f; line-height: 1.9; }

    .tag-selector { display: flex; flex-wrap: wrap; gap: 5px; }
    .tag-active { background: #1a1209 !important; color: #f0ebe0 !important; }

    .memo-area {
      width: 100%;
      min-height: 80px;
      border: 1px solid #1a1209;
      padding: 12px;
      font-size: 12px;
      font-family: 'Noto Sans JP', sans-serif;
      background: #fffdf5;
      resize: vertical;
      outline: none;
      color: #1a1209;
      line-height: 1.8;
    }

    .btn-primary { width: 100%; padding: 14px; background: #1a1209; color: #f0ebe0; border: none; font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 10px; letter-spacing: 0.05em; }
    .btn-secondary { width: 100%; padding: 13px; background: transparent; color: #1a1209; border: 1px solid #1a1209; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; cursor: pointer; margin-bottom: 10px; }
    .btn-danger { width: 100%; padding: 13px; background: transparent; color: #c0392b; border: 1px solid #c0392b; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; cursor: pointer; }

    .news-item { padding: 14px 0; border-bottom: 1px dashed #c8bfb0; }
    .news-title { font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 700; margin-bottom: 4px; line-height: 1.5; }
    .news-desc { font-size: 11px; color: #7a6e5f; line-height: 1.7; margin-bottom: 4px; }
    .news-link { font-size: 10px; color: #9a8e7f; text-decoration: none; letter-spacing: 0.04em; }

    .filter-bar { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 24px; }

    .dot-loader { display: flex; gap: 6px; justify-content: center; align-items: center; padding: 60px 0; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #1a1209; animation: bounce 1.2s infinite; }
    .dot:nth-child(2) { animation-delay: 0.15s; }
    .dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} }

    .analyzing-label { font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.2em; color: #9a8e7f; text-align: center; margin-bottom: 16px; }
    .empty { font-size: 12px; color: #b5a99a; text-align: center; padding: 60px 0; letter-spacing: 0.06em; }
  `;

  const TagChip = ({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) => (
    <span
      className={`tag-chip${active ? ' tag-active' : ''}`}
      style={{ background: active ? '#1a1209' : TAG_COLORS[tag] || '#eee' }}
      onClick={onClick}
    >
      {tag}
    </span>
  );

  const RelatedContent = () => (
    <>
      <div className="section-label">関連コンテンツ</div>
      {searchingNews ? (
        <div style={{ fontSize: '11px', color: '#9a8e7f', padding: '12px 0', letterSpacing: '0.06em' }}>検索中…</div>
      ) : newsResults.length > 0 ? (
        newsResults.map((n, i) => (
          <div key={i} className="news-item">
            <div className="news-title">{n.title}</div>
            <div className="news-desc">{n.description?.slice(0, 80)}</div>
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="news-link">
              {(() => { try { return new URL(n.url).hostname; } catch { return n.url; } })()}
            </a>
          </div>
        ))
      ) : (
        <div style={{ fontSize: '11px', color: '#9a8e7f', padding: '12px 0' }}>関連コンテンツが見つかりませんでした</div>
      )}
    </>
  );

  const Header = ({ backLabel, backScreen }: { backLabel?: string; backScreen?: 'home' | 'scrapbook' }) => (
    <header className="header">
      <span className="logo">SCRAP BOOK</span>
      <div className="header-right">
        {shots !== null && (
          <span className="shots-badge">あと<span>{shots}</span>枚撮れます</span>
        )}
        {backScreen ? (
          <button className="nav-btn" onClick={() => setScreen(backScreen)}>{backLabel}</button>
        ) : (
          <button className="nav-btn" onClick={() => setScreen('scrapbook')}>一覧 →</button>
        )}
      </div>
    </header>
  );

  return (
    <div className="page">
      <style>{css}</style>

      {screen === 'home' && (
        <>
          <Header />
          <div className="body">
            <h1 className="hero-title">気になった<br />記事を、<br />残そう。</h1>
            <p className="hero-sub">写真を撮るだけでAIが読み取り、関連コンテンツを検索。<br />タグとメモで整理できます。</p>
            <div className="upload-area" onClick={() => fileRef.current?.click()}>
              <span className="upload-icon">✂</span>
              <span className="upload-label">記事を切り抜く</span>
              <span className="upload-hint">JPG · PNG · HEIC 対応</span>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            {scraps.length > 0 && (
              <>
                <div className="section-label">最近のスクラップ</div>
                {scraps.slice(0, 3).map((sc, i) => (
                  <div key={sc.id} className="scrap-card" style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)`, marginTop: i === 0 ? '18px' : '20px' }} onClick={() => handleOpenDetail(sc)}>
                    <div className="tape" />
                    <div className="card-date">{sc.created_at?.slice(0, 10)}</div>
                    <div className="card-title">{sc.title}</div>
                    <div className="card-body">{sc.summary?.slice(0, 60)}…</div>
                    <div className="card-tags">{sc.tags?.split(',').filter(Boolean).map(t => <span key={t} className="tag-chip" style={{ background: TAG_COLORS[t] || '#eee' }}>{t}</span>)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {screen === 'result' && (
        <>
          <Header backLabel="← 戻る" backScreen="home" />
          <div className="body">
            {analyzing ? (
              <>
                <div className="analyzing-label">AI が記事を読み取っています</div>
                <div className="dot-loader"><div className="dot" /><div className="dot" /><div className="dot" /></div>
              </>
            ) : analyzed ? (
              <>
                <div className="article-box" style={{ transform: 'rotate(-0.8deg)' }}>
                  <div className="tape" />
                  <div className="article-title">{analyzed.title}</div>
                  <div className="article-body">{analyzed.summary}</div>
                </div>
                <div className="section-label">タグ</div>
                <div className="tag-selector">
                  {TAGS.map(t => <TagChip key={t} tag={t} active={selectedTags.includes(t)} onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} />)}
                </div>
                <div className="section-label">メモ</div>
                <textarea className="memo-area" value={memo} onChange={e => setMemo(e.target.value)} placeholder="感想や考察をメモ…" />
                <RelatedContent />
                <div style={{ marginTop: '28px' }}>
                  <button className="btn-primary" onClick={handleSave}>✂ スクラップに保存</button>
                  <button className="btn-secondary" onClick={() => setScreen('home')}>キャンセル</button>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}

      {screen === 'scrapbook' && (
        <>
          <Header backLabel="← ホーム" backScreen="home" />
          <div className="body">
            <div className="filter-bar">
              {['すべて', ...TAGS].map(t => (
                <span key={t} className={`tag-chip${searchTag === t ? ' tag-active' : ''}`} style={{ background: searchTag === t ? '#1a1209' : (TAG_COLORS[t] || '#eee') }} onClick={() => setSearchTag(t)}>{t}</span>
              ))}
            </div>
            {filtered.length === 0 && <div className="empty">スクラップがありません</div>}
            {filtered.map((sc, i) => (
              <div key={sc.id} className="scrap-card" style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)`, marginTop: i === 0 ? '18px' : '20px' }} onClick={() => handleOpenDetail(sc)}>
                <div className="tape" />
                <div className="card-date">{sc.created_at?.slice(0, 10)}</div>
                <div className="card-title">{sc.title}</div>
                <div className="card-body">{sc.summary?.slice(0, 80)}…</div>
                <div className="card-tags">{sc.tags?.split(',').filter(Boolean).map(t => <span key={t} className="tag-chip" style={{ background: TAG_COLORS[t] || '#eee' }}>{t}</span>)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {screen === 'detail' && current && (
        <>
          <Header backLabel="← 一覧" backScreen="scrapbook" />
          <div className="body">
            <div className="article-box" style={{ transform: 'rotate(-0.5deg)' }}>
              <div className="tape" />
              <div className="card-date">{current.created_at?.slice(0, 10)}</div>
              <div className="article-title">{current.title}</div>
              <div className="article-body">{current.summary}</div>
            </div>
            {current.tags && (
              <>
                <div className="section-label">タグ</div>
                <div className="tag-selector">{current.tags.split(',').filter(Boolean).map(t => <span key={t} className="tag-chip" style={{ background: TAG_COLORS[t] || '#eee' }}>{t}</span>)}</div>
              </>
            )}
            {current.memo && (
              <>
                <div className="section-label">メモ</div>
                <div style={{ background: '#fffdf5', border: '1px solid #1a1209', padding: '16px', fontSize: '12px', lineHeight: 1.9, color: '#3a2e1f' }}>{current.memo}</div>
              </>
            )}
            <RelatedContent />
            <div style={{ marginTop: '28px' }}>
              <button className="btn-danger" style={{ opacity: deleting ? 0.5 : 1 }} onClick={() => handleDelete(current.id)} disabled={deleting}>このスクラップを削除</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
