import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useGameStore();

  const [mode,  setMode]  = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [name,  setName]  = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await signIn(email, pass);
      else                  await signUp(email, pass, name);
      navigate('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #060d1a 0%, #0b1120 40%, #111827 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* BG Glow orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '20%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(165,94,234,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>
          👻
        </div>
        <h1 style={{
          fontFamily: 'Bai Jamjuree, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f5c518, #fd9644)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 4,
        }}>
          Spirit Master
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          จอมขมังเวทน้อย · ผีไทยป่วนเมือง
        </p>
      </div>

      {/* Card */}
      <div className="card fade-in" style={{ width: '100%', maxWidth: 360 }}>
        {/* Tab toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-base)',
          borderRadius: 'var(--r-md)',
          padding: 3,
          marginBottom: 20,
        }}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'calc(var(--r-md) - 2px)',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === m
                  ? 'linear-gradient(135deg, #f5c518, #e09f10)'
                  : 'transparent',
                color: mode === m ? '#0b1120' : 'var(--text-muted)',
              }}
            >
              {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <div>
              <div className="label-sm" style={{ marginBottom: 5 }}>ชื่อในเกม</div>
              <input
                className="input-field"
                placeholder="ระบุชื่อผู้เล่น..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <div className="label-sm" style={{ marginBottom: 5 }}>อีเมล</div>
            <input
              className="input-field"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="label-sm" style={{ marginBottom: 5 }}>รหัสผ่าน</div>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(255,71,87,0.15)',
              border: '1px solid rgba(255,71,87,0.3)',
              borderRadius: 'var(--r-md)',
              color: 'var(--red)',
              fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-gold btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? '⏳ กำลังโหลด...' : mode === 'login' ? '⚔️ เข้าสู่เกม' : '✨ สร้างตัวละคร'}
          </button>
        </form>
      </div>

      {/* Ghost decorations */}
      <div style={{
        marginTop: 32,
        display: 'flex',
        gap: 16,
        opacity: 0.4,
        fontSize: 24,
      }}>
        {['👻','💀','🧟','✨','🔥'].map((e, i) => (
          <span key={i} style={{
            animation: `float ${2.5 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}>{e}</span>
        ))}
      </div>
    </div>
  );
}
