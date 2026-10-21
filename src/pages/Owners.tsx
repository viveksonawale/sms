import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Search, Plus, Users, ChevronRight, Building2, Phone, Store } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Owners() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const owners = useStore((state) => state.owners);
  const payments = useStore((state) => state.payments);
  const language = useStore((state) => state.language);
  const theme = useStore((state) => state.theme);
  const fetchOwners = useStore((state) => state.fetchOwners);
  const fetchPayments = useStore((state) => state.fetchPayments);
  const [_loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchOwners();
        await fetchPayments();
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Precompute set of ownerIds who have paid this month (checking both paidOn and month string)
  const paidThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const currentMonthLabel = format(now, 'MMMM yyyy');
    const s = new Set<string>();

    payments.forEach((p) => {
      if (p.status !== 'paid') return;
      const d = p.paidOn ? new Date(p.paidOn) : null;
      if (d && d >= monthStart && d <= monthEnd) {
        s.add(p.ownerId);
      } else if (p.month && p.month.includes(currentMonthLabel)) {
        s.add(p.ownerId);
      }
    });

    return s;
  }, [payments]);

  const paidCount = useMemo(() => {
    return owners.filter((o) => paidThisMonth.has(o.id)).length;
  }, [owners, paidThisMonth]);

  const pendingCount = owners.length - paidCount;

  const filteredOwners = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return owners.filter((o) => {
      const matchesSearch =
        o.name.toLowerCase().includes(s) ||
        o.flat.toLowerCase().includes(s) ||
        (o.phone && o.phone.toLowerCase().includes(s)) ||
        (o.nameMr && o.nameMr.toLowerCase().includes(s));

      if (!matchesSearch) return false;

      const hasPaid = paidThisMonth.has(o.id);
      if (statusFilter === 'paid') return hasPaid;
      if (statusFilter === 'pending') return !hasPaid;
      return true;
    });
  }, [owners, searchTerm, statusFilter, paidThisMonth]);

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';
  const cardShadow = isDark
    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)';

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, marginBottom: '2px' }}>
            {t('owners')}
          </h1>
          <p style={{ fontSize: '13px', color: textSecondary }}>
            {owners.length} registered residents ({paidCount} paid, {pendingCount} pending)
          </p>
        </div>
        <button
          onClick={() => navigate('/owners/add')}
          className="btn-primary flex-shrink-0"
          style={{ padding: '9px 16px' }}
        >
          <Plus size={17} />
          {t('addOwner')}
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div style={{ position: 'relative', flex: 1 }}>
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

        {/* Status Filter Tabs */}
        <div
          className="flex items-center p-1 rounded-xl self-start sm:self-auto"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${borderColor}`,
          }}
        >
          {(['all', 'paid', 'pending'] as const).map((tab) => {
            const isActive = statusFilter === tab;
            const count = tab === 'all' ? owners.length : tab === 'paid' ? paidCount : pendingCount;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{tab === 'all' ? 'All' : tab === 'paid' ? t('paid') : t('pending')}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-black/25 text-white' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
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
              backgroundColor: 'rgba(249, 115, 22,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Users size={28} style={{ color: '#f97316' }} />
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
            const hasPaid = paidThisMonth.has(owner.id);
            const initials = owner.name
              .split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

            const colors = ['#f97316', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
            const colorIdx = owner.name.charCodeAt(0) % colors.length;
            const avatarColor = colors[colorIdx];
            const isShop = owner.flat.toLowerCase().includes('shop');
            const flatDisplay = owner.flat.toLowerCase().startsWith('flat') || owner.flat.toLowerCase().startsWith('shop')
              ? owner.flat
              : `Flat ${owner.flat}`;

            return (
              <div
                key={owner.id}
                id={`owner-card-${owner.id}`}
                onClick={() => navigate(`/owners/${owner.id}`)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 active:scale-[0.99]"
                style={{
                  backgroundColor: cardBg,
                  padding: '16px 18px',
                  boxShadow: cardShadow,
                  border: `1px solid ${borderColor}`,
                  touchAction: 'manipulation',
                }}
              >
                {/* Top Row: Avatar + Unit Badge + Status */}
                <div>
                  <div className="flex items-center justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${avatarColor}28, ${avatarColor}12)`,
                          border: `1px solid ${avatarColor}40`,
                          color: avatarColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: `0 2px 8px ${avatarColor}20`,
                        }}
                      >
                        {initials}
                      </div>

                      {/* Unit Tag */}
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide"
                        style={{
                          backgroundColor: isDark ? 'rgba(249,115,22,0.14)' : 'rgba(249,115,22,0.08)',
                          color: '#f97316',
                          border: '1px solid rgba(249,115,22,0.25)',
                        }}
                      >
                        {isShop ? <Store size={12} /> : <Building2 size={12} />}
                        <span className="truncate max-w-[110px]">{flatDisplay}</span>
                      </span>
                    </div>

                    {/* Status Badge */}
                    {hasPaid ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.14)' : 'rgba(34, 197, 94, 0.1)',
                          color: '#22c55e',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {t('paid')}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.1)',
                          color: isDark ? '#fbbf24' : '#b45309',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t('pending')}
                      </span>
                    )}
                  </div>

                  {/* Name & Subtitle */}
                  <div className="mb-3">
                    <h3
                      style={{ color: textPrimary, fontSize: '15px', fontWeight: 700, lineHeight: 1.35 }}
                      className="group-hover:text-orange-500 transition-colors line-clamp-1"
                      title={owner.name}
                    >
                      {language === 'mr' && owner.nameMr ? owner.nameMr : owner.name}
                    </h3>
                    {owner.nameMr && language !== 'mr' ? (
                      <p style={{ color: textSecondary, fontSize: '12px', marginTop: '2px' }} className="truncate">
                        {owner.nameMr}
                      </p>
                    ) : (
                      <p style={{ color: textSecondary, fontSize: '12px', marginTop: '2px' }} className="truncate">
                        {owner.email || (isShop ? 'Commercial Unit' : 'Residential Unit')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer: Phone + Monthly Fee + Action */}
                <div
                  className="pt-2.5 flex items-center justify-between text-xs"
                  style={{
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5" style={{ color: textSecondary }}>
                    <Phone size={12} className="opacity-70 text-orange-500/80" />
                    <span className="font-medium tracking-wide">{owner.phone || '—'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] block leading-none font-medium opacity-60" style={{ color: textSecondary }}>
                        Monthly
                      </span>
                      <span className="text-xs font-bold text-orange-500">
                        ₹{owner.monthlyAmount?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center transition-all group-hover:bg-orange-500/10 group-hover:text-orange-500"
                      style={{
                        color: textSecondary,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      }}
                    >
                      <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
