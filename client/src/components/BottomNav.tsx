import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/home',    icon: '🏠', label: 'หน้าหลัก' },
  { path: '/roster',  icon: '👻', label: 'ทีม' },
  { path: '/arena',   icon: '🏆', label: 'สนามรบ' },
  { path: '/map',     icon: '🗺️', label: 'แผนที่' },
  { path: '/upgrade', icon: '🔧', label: 'อัปเกรด' },
];

export default function BottomNav() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.path}
          className={`nav-item${pathname.startsWith(item.path) ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
