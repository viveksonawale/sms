import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Search, Plus, Users, Check, Clock, IndianRupee, ChevronRight, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const owners = useStore((state) => state.owners);
  const payments = useStore((state) => state.payments);
  const language = useStore((state) => state.language);
  const theme = useStore((state) => state.theme);

  const [searchTerm, setSearchTerm] = useState('');

  const currentMonthStr = useMemo(() => format(new Date(), 'MMMM yyyy'), []);

  const stats = useMemo(() => {
    let paidThisMonth = 0;
    let pending = 0;
    owners.forEach((owner) => {
      const hasPaid = payments.some(
        (p) => p.ownerId === owner.id && p.month === currentMonthStr && p.status === 'paid'
      );
      if (hasPaid) paidThisMonth++;
      else pending++;
    });
    const totalCollected = payments.reduce((acc, curr) => acc + curr.amount, 0);
    return { totalOwners: owners.length, paidThisMonth, pending, totalCollected };
  }, [owners, payments, currentMonthStr]);

  const filteredOwners = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return owners.filter(
      (o) => o.name.toLowerCase().includes(s) || o.flat.toLowerCase().includes(s)
    );
  }, [owners, searchTerm]);

  const statCards = [
    {
      label: t('totalOwners'),
      value: String(stats.totalOwners),
      icon: Users,
      iconColor: '#00b8d9',
      iconBg: 'rgba(0, 184, 217, 0.12)',
      trend: 'All residents',
    },
    {
      label: t('paidThisMonth'),
      value: String(stats.paidThisMonth),
      icon: Check,
      iconColor: '#22c55e',
      iconBg: 'rgba(34, 197, 94, 0.12)',
      trend: `Out of ${stats.totalOwners}`,
    },
    {
      label: t('pending'),
      value: String(stats.pending),
      icon: Clock,
      iconColor: '#ffab00',
      iconBg: 'rgba(255, 171, 0, 0.12)',
      trend: 'Need attention',
    },
    {
      label: t('totalCollected'),
      value: `₹${stats.totalCollected.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      iconColor: '#00a76f',
      iconBg: 'rgba(0, 167, 111, 0.12)',
      trend: 'Lifetime',
    },
  ];

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
            {t('dashboard')}
          </h1>
          <p style={{ fontSize: '13px', color: textSecondary }}>
            {currentMonthStr} — Society Overview
          </p>
        </div>
        <div className="flex flex-row gap-3">
          <button
            onClick={() => navigate('/expenses/add')}
            className="btn-white flex-1 sm:w-auto justify-center px-2 sm:px-4"
            style={{ 
              backgroundColor: isDark ? 'transparent' : '#fff',
              color: isDark ? '#fff' : '#1c252e',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e0e0e0',
              fontSize: '13px'
            }}
          >
            <Plus size={16} />
            <span className="truncate">{t('addExpense')}</span>
          </button>
          <button
            id="btn-add-owner"
            onClick={() => navigate('/owners/add')}
            className="btn-primary flex-1 sm:w-auto justify-center px-2 sm:px-4"
            style={{ fontSize: '13px' }}
          >
            <Plus size={16} />
            <span className="truncate">{t('addOwner')}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            style={{
              backgroundColor: cardBg,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: isDark
                ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
                : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                backgroundColor: stat.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <stat.icon size={20} style={{ color: stat.iconColor }} />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '13px', color: textSecondary, marginTop: '4px' }}>
                {stat.label}
              </p>
            </div>
            <p style={{ fontSize: '11px', color: textSecondary, opacity: 0.65 }}>
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Collection Progress */}
      {stats.totalOwners > 0 && (
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: isDark
              ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
              : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
              {t('collectionProgress')} — {currentMonthStr}
            </p>
            <span
              style={{
                fontSize: '12px', fontWeight: 700, padding: '3px 10px',
                backgroundColor: 'rgba(0,167,111,0.12)',
                color: '#00a76f', borderRadius: '20px',
              }}
            >
              {Math.round((stats.paidThisMonth / stats.totalOwners) * 100)}%
            </span>
          </div>
          <div style={{ height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f4f6f8', borderRadius: '99px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(stats.paidThisMonth / stats.totalOwners) * 100}%`,
                background: 'linear-gradient(90deg, #007867, #00a76f, #5be49b)',
                borderRadius: '99px',
                transition: 'width 0.7s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: textSecondary, marginTop: '8px' }}>
            {stats.paidThisMonth} of {stats.totalOwners} owners paid this month
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
        />
        <input
          type="text"
          id="search-owners"
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
          style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '64px 24px',
            textAlign: 'center',
            boxShadow: isDark
              ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
              : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
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
            <Building2 size={28} style={{ color: '#00a76f' }} />
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
            const hasPaid = payments.some(
              (p) => p.ownerId === owner.id && p.month === currentMonthStr && p.status === 'paid'
            );
            const initials = owner.name
              .split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

            // Deterministic avatar color from name
            const colors = ['#00a76f', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
            const colorIdx = owner.name.charCodeAt(0) % colors.length;
            const avatarColor = colors[colorIdx];

            return (
              <div
                key={owner.id}
                id={`owner-card-${owner.id}`}
                onClick={() => navigate(`/owners/${owner.id}`)}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: isDark
                    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
                    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  border: `1px solid ${borderColor}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 2px ${avatarColor}30, 0 20px 40px -8px rgba(145,158,171,0.24)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
                    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
                    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)';
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
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
                        style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                          backgroundColor: 'rgba(0,167,111,0.1)', color: '#00a76f',
                          borderRadius: '6px',
                        }}
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
                    <p style={{ fontSize: '11px', color: textSecondary, marginBottom: '2px' }}>Monthly</p>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: textPrimary }}>
                      ₹{owner.monthlyAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: hasPaid ? 'rgba(34,197,94,0.12)' : 'rgba(255,171,0,0.12)',
                      color: hasPaid ? '#118d57' : '#b76e00',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: hasPaid ? '#22c55e' : '#ffab00',
                        display: 'inline-block',
                      }}
                    />
                    {hasPaid ? t('paid') : t('pending')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
