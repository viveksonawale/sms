import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Users, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Owners() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const owners = useStore((state) => state.owners);
  const language = useStore((state) => state.language);
  const theme = useStore((state) => state.theme);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredOwners = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return owners.filter(
      (o) => o.name.toLowerCase().includes(s) || o.flat.toLowerCase().includes(s)
    );
  }, [owners, searchTerm]);

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, marginBottom: '3px' }}>
            {t('owners')}
          </h1>
          <p style={{ fontSize: '13px', color: textSecondary }}>
            Manage and view all registered society members
          </p>
        </div>
        <button
          onClick={() => navigate('/owners/add')}
          className="btn-primary w-full sm:w-auto justify-center"
        >
          <Plus size={17} />
          {t('addOwner')}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
        />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '42px' }}
        />
      </div>

      {/* Owner Grid */}
      {filteredOwners.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            backgroundColor: cardBg
          }}
        >
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '16px',
              backgroundColor: 'rgba(0,167,111,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Users size={28} style={{ color: '#00a76f' }} />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>
            {searchTerm ? t('noResultsFound') : t('noOwners')}
          </p>
          <p style={{ fontSize: '13px', color: textSecondary }}>
            {searchTerm ? t('tryDifferentSearch') : t('addFirstOwner')}
          </p>
          {!searchTerm && (
            <button onClick={() => navigate('/owners/add')} className="btn-primary" style={{ marginTop: '20px' }}>
              <Plus size={16} />
              {t('addOwner')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOwners.map((owner) => {
            const initials = owner.name
              .split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

            const colors = ['#00a76f', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
            const colorIdx = owner.name.charCodeAt(0) % colors.length;
            const avatarColor = colors[colorIdx];

            return (
              <div
                key={owner.id}
                onClick={() => navigate(`/owners/${owner.id}`)}
                className="card p-5 cursor-pointer transition-all hover:-translate-y-1"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    style={{
                      width: '46px', height: '46px', borderRadius: '12px',
                      backgroundColor: `${avatarColor}20`,
                      color: avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, lineHeight: 1.3 }} className="truncate">
                        {language === 'mr' && owner.nameMr ? owner.nameMr : owner.name}
                      </h3>
                      <ChevronRight size={15} style={{ color: '#c4cdd5', flexShrink: 0, marginTop: '2px' }} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="badge badge-paid"
                        style={{ fontSize: '10px' }}
                      >
                        {owner.flat}
                      </span>
                      <span style={{ fontSize: '11px', color: textSecondary }} className="truncate">
                        {owner.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '16px', paddingTop: '14px',
                    borderTop: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '11px', color: textSecondary, marginBottom: '2px' }}>Monthly Bill</p>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: textPrimary }}>
                      ₹{owner.monthlyAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: '#00a76f' }}>View Details →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
