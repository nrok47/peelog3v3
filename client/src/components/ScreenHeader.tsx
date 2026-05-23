import { useNavigate } from 'react-router-dom';

interface ScreenHeaderProps {
  title: string;
  back?: boolean | string;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, back, right }: ScreenHeaderProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  }

  return (
    <div className="screen-header">
      {back && (
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-light)',
            fontSize: 20,
            cursor: 'pointer',
            padding: '4px 8px 4px 0',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ←
        </button>
      )}
      <span className="screen-title" style={{ flex: 1 }}>{title}</span>
      {right}
    </div>
  );
}
