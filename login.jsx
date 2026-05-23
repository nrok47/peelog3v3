// login.jsx — Login / Register screen
// ใช้ design system เดิม: --void, --gold, --bone

function LoginScreen({ onLogin }) {
  const [mode,  setMode]  = React.useState('login');  // 'login' | 'register'
  const [email, setEmail] = React.useState('');
  const [pass,  setPass]  = React.useState('');
  const [user,  setUser]  = React.useState('');
  const [err,   setErr]   = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg,   setMsg]   = React.useState('');

  async function handleSubmit() {
    setErr(''); setMsg(''); setLoading(true);
    try {
      if (mode === 'register') {
        const r = await SpiritDB.Auth.signUp(email, pass, user || email.split('@')[0]);
        if (r?.status === 'confirm_email') {
          setMsg('📧 ตรวจสอบ email เพื่อยืนยันบัญชี แล้วกลับมา login');
          setMode('login');
        } else {
          await onLogin();
        }
      } else {
        await SpiritDB.Auth.signIn(email, pass);
        await onLogin();
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('already registered'))   setErr('email นี้มีบัญชีแล้ว — กด Login');
      else if (msg.includes('Invalid login'))   setErr('email หรือ รหัสผ่านไม่ถูกต้อง');
      else if (msg.includes('Email not confirmed')) setErr('กรุณายืนยัน email ก่อน login');
      else setErr(msg);
    }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', background: 'rgba(0,0,0,0.5)',
    border: '1px solid var(--hairline-strong)',
    color: 'var(--bone)', fontFamily: 'var(--f-body)',
    fontSize: 14, padding: '10px 12px', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontFamily: 'var(--f-mono)', fontSize: 9,
    color: 'var(--bone-mute)', letterSpacing: 0.15,
    display: 'block', marginBottom: 4, marginTop: 14,
  };

  return (
    <div className="screen" style={{
      background: 'radial-gradient(ellipse 80% 60% at 50% 20%, #1a0828, var(--void) 65%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 28px',
    }}>
      <div className="noise" />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <svg viewBox="0 0 80 80" width="64" height="64" style={{ marginBottom: 8 }}>
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--gold)" strokeWidth="0.8" opacity="0.6" />
          <circle cx="40" cy="40" r="28" fill="none" stroke="var(--gold)" strokeWidth="0.4" strokeDasharray="3 5" opacity="0.4" />
          {[0,72,144,216,288].map((d,i) => (
            <g key={i} transform={`rotate(${d} 40 40)`}>
              <line x1="40" y1="4" x2="40" y2="12" stroke="var(--gold)" strokeWidth="0.8" />
            </g>
          ))}
          <text x="40" y="46" textAnchor="middle" fill="var(--gold-glow)"
            fontFamily="Bai Jamjuree" fontSize="20" fontWeight="700">☽</text>
        </svg>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, color: 'var(--gold-soft)', lineHeight: 1.1 }}>
          จอมขมังเวทน้อย
        </div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--bone-mute)', marginTop: 4, letterSpacing: 0.2 }}>
          SPIRIT MASTER · ผีไทยป่วนเมือง
        </div>
      </div>

      <Ornament />

      {/* Tab */}
      <div style={{ display: 'flex', gap: 0, width: '100%', marginTop: 18, marginBottom: 16 }}>
        {['login','register'].map(m => (
          <button key={m} onClick={() => { setMode(m); setErr(''); setMsg(''); }} style={{
            flex: 1, padding: '9px 0',
            background: mode === m ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.3)',
            border: '1px solid ' + (mode === m ? 'var(--gold)' : 'var(--hairline)'),
            color: mode === m ? 'var(--gold-soft)' : 'var(--bone-mute)',
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: 0.15,
            cursor: 'pointer',
          }}>
            {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครใหม่'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ width: '100%' }}>
        {mode === 'register' && (
          <>
            <label style={labelStyle}>ชื่อจอมขมังเวท · USERNAME</label>
            <input style={inputStyle} placeholder="ตั้งชื่อผู้เล่น"
              value={user} onChange={e => setUser(e.target.value)} />
          </>
        )}
        <label style={labelStyle}>EMAIL</label>
        <input style={inputStyle} type="email" placeholder="your@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <label style={labelStyle}>รหัสผ่าน · PASSWORD</label>
        <input style={inputStyle} type="password" placeholder="••••••••"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
      </div>

      {/* Error / Message */}
      {err && (
        <div style={{ width: '100%', marginTop: 10, padding: '7px 10px',
          background: 'rgba(192,38,211,0.12)', border: '1px solid var(--corruption-soft)',
          fontSize: 11, color: 'var(--corruption-soft)' }}>
          ⚠ {err}
        </div>
      )}
      {msg && (
        <div style={{ width: '100%', marginTop: 10, padding: '7px 10px',
          background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold)',
          fontSize: 11, color: 'var(--gold-soft)' }}>
          {msg}
        </div>
      )}

      {/* CTA */}
      <button onClick={handleSubmit} disabled={loading} style={{
        width: '100%', marginTop: 18,
        background: loading
          ? 'rgba(212,175,55,0.2)'
          : 'linear-gradient(180deg, #ffd470, var(--gold) 60%)',
        border: '1px solid var(--gold-deep)',
        color: loading ? 'var(--gold-soft)' : 'var(--ink)',
        fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 14,
        padding: '12px 16px', letterSpacing: 0.3, cursor: loading ? 'wait' : 'pointer',
        boxShadow: loading ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 16px rgba(212,175,55,0.3)',
      }}>
        {loading ? '⏳ กำลังโหลด...' : mode === 'login' ? '✦ เข้าสู่โลกวิญญาณ' : '✦ เริ่มการเดินทาง'}
      </button>

      <div style={{ marginTop: 20, fontSize: 9, color: 'var(--bone-mute)', textAlign: 'center', lineHeight: 1.6 }}>
        Spirit Master v0.2 · Supabase · Thai Ghost RPG
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
