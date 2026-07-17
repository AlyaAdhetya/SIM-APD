import { Inbox } from 'lucide-react';

export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {icon || <Inbox size={40} strokeWidth={1.5} color="#94a3b8" />}
      </div>
      <h3 style={{ fontSize: 15, color: 'var(--gray-700)' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
    </div>
  );
}
