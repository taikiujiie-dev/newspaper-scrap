'use client';

import { useState, useEffect } from 'react';
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

type Scrap = {
  id: number;
  title: string;
  summary: string;
  memo: string;
  tags: string;
  created_at: string;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [editing, setEditing] = useState<Scrap | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'scraps'>('dashboard');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (authed) fetchScraps();
  }, [authed]);

  const fetchScraps = async () => {
    const { data } = await supabase
      .from('scraps')
      .select('id, title, summary, memo, tags, created_at')
      .order('created_at', { ascending: false });
    if (data) setScraps(data as Scrap[]);
  };

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true);
      setError('');
    } else {
      setError('パスワードが違います');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    setDeleting(id);
    await supabase.from('scraps').delete().eq('id', id);
    setScraps(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    await supabase.from('scraps').update({
      title: editing.title,
      summary: editing.summary,
      memo: editing.memo,
      tags: editing.tags,
    }).eq('id', editing.id);
    setScraps(prev => prev.map(s => s.id === editing.id ? editing : s));
    setEditing(null);
    setSaving(false);
  };

  // 統計データ
  const totalScraps = scraps.length;
  const tagCounts = TAGS.map(tag => ({
    tag,
    count: scraps.filter(s => s.tags?.includes(tag)).length,
  })).sort((a, b) => b.count - a.count);
  const thisMonth = scraps.filter(s => s.created_at?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
  const withMemo = scraps.filter(s => s.memo?.trim()).length;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Bebas+Neue&family=Noto+Sans+JP:wght@400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0ebe0; }
    .page { font-family: 'Noto Sans JP', sans-serif; min-height: 100vh; background: #f0ebe0; color: #1a1209; }
    .login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .login-box { background: #fff; border: 1px solid #1a1209; box-shadow: 4px 4px 0 #1a1209; padding: 40px 32px; width: 320px; }
    .login-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.15em; margin-bottom: 24px; }
    .login-input { width: 100%; border: 1px solid #1a1209; padding: 10px 12px; font-size: 14px; font-family: inherit; outline: none; margin-bottom: 12px; background: #fffdf5; }
    .login-btn { width: 100%; padding: 12px; background: #1a1209; color: #f0ebe0; border: none; font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 700; cursor: pointer; }
    .login-error { font-size: 12px; color: #c0392b; margin-bottom: 12px; }
    .header { background: #1a1209; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 52px; position: sticky; top: 0; z-index: 100; }
    .logo { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #f0ebe0; letter-spacing: 0.1em; }
    .logout-btn { font-size: 11px; color: #f0ebe0; background: none; border: 1px solid rgba(240,235,224,0.3); cursor: pointer; padding: 5px 12px; }
    .body { max-width: 900px; margin: 0 auto; padding: 32px 20px; }
    .tabs { display: flex; gap: 0; margin-bottom: 28px; border: 1px solid #1a1209; width: fit-content; }
    .tab { padding: 8px 24px; font-size: 12px; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.12em; cursor: pointer; border: none; background: #fff; color: #1a1209; }
    .tab.active { background: #1a1209; color: #f0ebe0; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 28px; }
    @media (min-width: 600px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
    .stat-card { background: #fff; border: 1px solid #1a1209; box-shadow: 3px 3px 0 #1a1209; padding: 16px; }
    .stat-label { font-size: 9px; letter-spacing: 0.12em; color: #9a8e7f; font-family: 'Bebas Neue', sans-serif; margin-bottom: 6px; }
    .stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #1a1209; line-height: 1; }
    .stat-unit { font-size: 11px; color: #9a8e7f; margin-left: 4px; }
    .section-label { font-family: 'Bebas Neue', sans-serif; font-size: 13px; letter-spacing: 0.2em; color: #9a8e7f; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
    .section-label::after { content: ''; flex: 1; height: 1px; background: #c8bfb0; }
    .tag-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .tag-bar-label { font-size: 11px; width: 48px; flex-shrink: 0; }
    .tag-bar-bg { flex: 1; height: 8px; background: #ebebeb; }
    .tag-bar-fill { height: 8px; }
    .tag-bar-count { font-size: 11px; color: #9a8e7f; width: 24px; text-align: right; }
    .scrap-table { width: 100%; border-collapse: collapse; }
    .scrap-table th { font-family: 'Bebas Neue', sans-serif; font-size: 11px; letter-spacing: 0.12em; color: #9a8e7f; text-align: left; padding: 8px 12px; border-bottom: 2px solid #1a1209; background: #f0ebe0; }
    .scrap-table td { font-size: 12px; padding: 10px 12px; border-bottom: 1px solid #ebebeb; vertical-align: top; background: #fff; }
    .scrap-table tr:hover td { background: #fffdf5; }
    .tag-chip { font-size: 9px; padding: 2px 6px; border: 1px solid #1a1209; margin-right: 3px; display: inline-block; }
    .btn-edit { font-size: 11px; padding: 4px 10px; border: 1px solid #1a1209; background: #fff; cursor: pointer; margin-right: 4px; }
    .btn-del { font-size: 11px; padding: 4px 10px; border: 1px solid #c0392b; background: #fff; color: #c0392b; cursor: pointer; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #fff; border: 1px solid #1a1209; box-shadow: 6px 6px 0 #1a1209; padding: 28px; width: 100%; max-width: 520px; max-height: 80vh; overflow-y: auto; }
    .modal-title { font-family: 'Noto Serif JP', serif; font-size: 18px; font-weight: 700; margin-bottom: 20px; }
    .field-label { font-size: 10px; letter-spacing: 0.1em; color: #9a8e7f; font-family: 'Bebas Neue', sans-serif; margin-bottom: 6px; margin-top: 14px; }
    .field-input { width: 100%; border: 1px solid #1a1209; padding: 8px 10px; font-size: 13px; font-family: inherit; outline: none; background: #fffdf5; }
    .field-textarea { width: 100%; border: 1px solid #1a1209; padding: 8px 10px; font-size: 13px; font-family: inherit; outline: none; background: #fffdf5; resize: vertical; min-height: 80px; }
    .modal-btns { display: flex; gap: 8px; margin-top: 20px; }
    .btn-save { flex: 1; padding: 10px; background: #1a1209; color: #f0ebe0; border: none; font-family: 'Noto Serif JP', serif; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-cancel { flex: 1; padding: 10px; background: #fff; color: #1a1209; border: 1px solid #1a1209; font-size: 13px; cursor: pointer; }
    .tag-selector { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
    .tag-sel-chip { font-size: 10px; padding: 3px 10px; border: 1px solid #1a1209; cursor: pointer; background: #fff; }
    .tag-sel-active { background: #1a1209 !important; color: #f0ebe0 !important; }
  `;

  if (!authed) return (
    <div className="page">
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-title">ADMIN LOGIN</div>
          {error && <div className="login-error">{error}</div>}
          <input
            className="login-input"
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button className="login-btn" onClick={handleLogin}>ログイン</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <style>{css}</style>

      <header className="header">
        <span className="logo">SCRAP BOOK — ADMIN</span>
        <button className="logout-btn" onClick={() => setAuthed(false)}>ログアウト</button>
      </header>

      <div className="body">
        <div className="tabs">
          <button className={`tab${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>DASHBOARD</button>
          <button className={`tab${tab === 'scraps' ? ' active' : ''}`} onClick={() => setTab('scraps')}>SCRAPS ({totalScraps})</button>
        </div>

        {tab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">TOTAL SCRAPS</div>
                <div className="stat-value">{totalScraps}<span className="stat-unit">件</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-label">THIS MONTH</div>
                <div className="stat-value">{thisMonth}<span className="stat-unit">件</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-label">WITH MEMO</div>
                <div className="stat-value">{withMemo}<span className="stat-unit">件</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-label">MEMO RATE</div>
                <div className="stat-value">{totalScraps ? Math.round(withMemo / totalScraps * 100) : 0}<span className="stat-unit">%</span></div>
              </div>
            </div>

            <div className="section-label">タグ別スクラップ数</div>
            {tagCounts.map(({ tag, count }) => (
              <div key={tag} className="tag-bar-row">
                <div className="tag-bar-label">{tag}</div>
                <div className="tag-bar-bg">
                  <div className="tag-bar-fill" style={{ width: totalScraps ? `${count / totalScraps * 100}%` : '0%', background: TAG_COLORS[tag] || '#ccc' }} />
                </div>
                <div className="tag-bar-count">{count}</div>
              </div>
            ))}
          </>
        )}

        {tab === 'scraps' && (
          <>
            <div className="section-label">スクラップ一覧</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="scrap-table">
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>タイトル</th>
                    <th>タグ</th>
                    <th>メモ</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {scraps.map(sc => (
                    <tr key={sc.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: '#9a8e7f' }}>{sc.created_at?.slice(0, 10)}</td>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', lineHeight: 1.4 }}>{sc.title}</div>
                        <div style={{ fontSize: '11px', color: '#7a6e5f', lineHeight: 1.6 }}>{sc.summary?.slice(0, 60)}…</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {sc.tags?.split(',').filter(Boolean).map(t => (
                          <span key={t} className="tag-chip" style={{ background: TAG_COLORS[t] || '#eee' }}>{t}</span>
                        ))}
                      </td>
                      <td style={{ maxWidth: '150px', fontSize: '11px', color: '#7a6e5f' }}>{sc.memo?.slice(0, 40)}{sc.memo?.length > 40 ? '…' : ''}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn-edit" onClick={() => setEditing(sc)}>編集</button>
                        <button className="btn-del" onClick={() => handleDelete(sc.id)} disabled={deleting === sc.id}>
                          {deleting === sc.id ? '…' : '削除'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal">
            <div className="modal-title">スクラップを編集</div>

            <div className="field-label">タイトル</div>
            <input className="field-input" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />

            <div className="field-label">要約</div>
            <textarea className="field-textarea" value={editing.summary} onChange={e => setEditing({ ...editing, summary: e.target.value })} />

            <div className="field-label">メモ</div>
            <textarea className="field-textarea" value={editing.memo || ''} onChange={e => setEditing({ ...editing, memo: e.target.value })} placeholder="メモを入力…" />

            <div className="field-label">タグ</div>
            <div className="tag-selector">
              {TAGS.map(t => {
                const active = editing.tags?.split(',').includes(t);
                return (
                  <span
                    key={t}
                    className={`tag-sel-chip${active ? ' tag-sel-active' : ''}`}
                    style={{ background: active ? '#1a1209' : TAG_COLORS[t] || '#eee' }}
                    onClick={() => {
                      const current = editing.tags?.split(',').filter(Boolean) || [];
                      const next = active ? current.filter(x => x !== t) : [...current, t];
                      setEditing({ ...editing, tags: next.join(',') });
                    }}
                  >{t}</span>
                );
              })}
            </div>

            <div className="modal-btns">
              <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? '保存中…' : '保存'}</button>
              <button className="btn-cancel" onClick={() => setEditing(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
