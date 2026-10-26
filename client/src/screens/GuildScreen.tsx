import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { GuildService } from '../db/supabase';
import type { Guild, GuildMember, GuildMessage } from '../types';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';

export default function GuildScreen() {
  const { player, myGuild, myGuildRole, createGuild, joinGuild, leaveGuild } = useGameStore();

  const [roster, setRoster] = useState<GuildMember[]>([]);
  const [browseList, setBrowseList] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [messages, setMessages] = useState<GuildMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    if (myGuild) {
      GuildService.getRoster(myGuild.id).then(r => { setRoster(r); setLoading(false); });
    } else {
      GuildService.listGuilds().then(g => { setBrowseList(g); setLoading(false); });
    }
  }, [myGuild]);

  // Guild chat: load history + subscribe realtime
  useEffect(() => {
    if (!myGuild) { setMessages([]); return; }
    GuildService.getMessages(myGuild.id).then(setMessages);
    const unsubscribe = GuildService.subscribeMessages(myGuild.id, m =>
      setMessages(prev => [...prev, m])
    );
    return unsubscribe;
  }, [myGuild]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendChat() {
    if (!player || !myGuild || !chatInput.trim()) return;
    setChatSending(true);
    try {
      await GuildService.sendMessage(myGuild.id, player.id, player.username, chatInput);
      setChatInput('');
    } catch {
      setMsg('ส่งข้อความไม่สำเร็จ');
    }
    setChatSending(false);
  }

  async function handleCreate() {
    if (!name.trim() || !tag.trim()) { setMsg('กรอกชื่อและแท็กก่อน'); return; }
    setBusy(true);
    setMsg('');
    try {
      await createGuild(name.trim(), tag.trim().toUpperCase());
    } catch (e) {
      setMsg(e instanceof Error && e.message.includes('duplicate') ? 'ชื่อหรือแท็กนี้มีคนใช้แล้ว' : 'สร้างกิลด์ไม่สำเร็จ');
    }
    setBusy(false);
  }

  async function handleJoin(guildId: string) {
    setBusy(true);
    setMsg('');
    try {
      await joinGuild(guildId);
    } catch {
      setMsg('เข้ากิลด์ไม่สำเร็จ');
    }
    setBusy(false);
  }

  async function handleLeave() {
    if (!confirm('ออกจากกิลด์นี้?')) return;
    setBusy(true);
    await leaveGuild();
    setBusy(false);
  }

  return (
    <div className="screen fade-in">
      <ScreenHeader title="🛡️ กิลด์" back="/arena" />

      <div className="screen-content">
        {myGuild ? (
          <>
            <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>[{myGuild.tag}]</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{myGuild.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {myGuildRole === 'leader' ? '👑 หัวหน้ากิลด์' : '👤 สมาชิก'} · {roster.length} คน
              </div>
            </div>

            <div className="section-hd">
              <span className="section-title">👥 สมาชิก</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>กำลังโหลด...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {roster.map(m => (
                  <div key={m.player_id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                    <span style={{ fontSize: 16 }}>{m.role === 'leader' ? '👑' : '👤'}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{m.username}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="section-hd">
              <span className="section-title">💬 แชทกิลด์</span>
            </div>
            <div className="card" style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
                    ยังไม่มีข้อความ — ทักทายสมาชิกกิลด์เลย!
                  </div>
                ) : messages.map(m => {
                  const isMe = m.player_id === player?.id;
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      {!isMe && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{m.username}</div>}
                      <div style={{
                        background: isMe ? 'var(--gold-glow)' : 'rgba(255,255,255,0.06)',
                        borderRadius: 10, padding: '6px 10px', fontSize: 13, wordBreak: 'break-word',
                      }}>
                        {m.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <input
                  className="input-field" placeholder="พิมพ์ข้อความ..." value={chatInput}
                  maxLength={300} style={{ flex: 1 }}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
                />
                <button type="button" className="btn btn-gold btn-sm" disabled={chatSending || !chatInput.trim()} onClick={handleSendChat}>
                  ส่ง
                </button>
              </div>
            </div>

            {msg && <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{msg}</div>}

            <button type="button" className="btn btn-outline btn-full" disabled={busy} onClick={handleLeave}>
              {busy ? '...' : 'ออกจากกิลด์'}
            </button>
          </>
        ) : (
          <>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>✨ สร้างกิลด์ใหม่</div>
              <input
                className="input-field" placeholder="ชื่อกิลด์" value={name}
                onChange={e => setName(e.target.value)} maxLength={30}
                style={{ width: '100%', marginBottom: 8 }}
              />
              <input
                className="input-field" placeholder="แท็ก (เช่น GHST)" value={tag}
                onChange={e => setTag(e.target.value)} maxLength={6}
                style={{ width: '100%', marginBottom: 10 }}
              />
              {msg && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>{msg}</div>}
              <button type="button" className="btn btn-gold btn-full" disabled={busy} onClick={handleCreate}>
                {busy ? '...' : 'สร้างกิลด์'}
              </button>
            </div>

            <div className="section-hd">
              <span className="section-title">🔍 กิลด์ที่เปิดรับ</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>กำลังโหลด...</div>
            ) : browseList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16, fontSize: 13 }}>
                ยังไม่มีกิลด์ — เป็นคนแรกที่สร้างเลย!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {browseList.map(g => (
                  <div key={g.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{g.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>[{g.tag}]</div>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => handleJoin(g.id)}>
                      เข้าร่วม
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
