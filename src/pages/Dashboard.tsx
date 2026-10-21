import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Search, Plus, Users, ChevronRight, Building2, TrendingUp, TrendingDown, ArrowRight, Phone, Store } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const owners = useStore((state) => state.owners);
  const payments = useStore((state) => state.payments);
  const expenses = useStore((state) => state.expenses);
  const language = useStore((state) => state.language);
  const theme = useStore((state) => state.theme);
  const fetchOwners = useStore((state) => state.fetchOwners);
  const fetchExpenses = useStore((state) => state.fetchExpenses);
  const fetchPayments = useStore((state) => state.fetchPayments);

  useEffect(() => {
    const load = async () => {
      await fetchOwners();
      await fetchPayments();
      fetchExpenses();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const currentMonthStr = useMemo(() => format(new Date(), 'MMMM yyyy'), []);
  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthPayments = payments.filter((p) => {
      if (p.status !== 'paid') return false;
      const d = p.paidOn ? new Date(p.paidOn) : null;
      return d && d >= monthStart && d <= monthEnd;
    });

    const collectedThisMonth = monthPayments.reduce((acc, p) => acc + p.amount, 0);
    const paidThisMonthCount = new Set(monthPayments.map((p) => p.ownerId)).size;
    const totalCollected = payments
      .filter((p) => p.status === 'paid')
      .reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    return { totalOwners: owners.length, collectedThisMonth, paidThisMonthCount, totalCollected, totalExpenses };
  }, [owners, payments, expenses, now]);

  // Performance: Precompute paid owners set for instant O(1) lookups
  const paidThisMonthOwnerIds = useMemo(() => {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const s = new Set<string>();

    payments.forEach((p) => {
      if (p.status !== 'paid') return;
      const d = p.paidOn ? new Date(p.paidOn) : null;
      if (d && d >= monthStart && d <= monthEnd) {
        s.add(p.ownerId);
      } else if (p.month && p.month.includes(currentMonthStr)) {
        s.add(p.ownerId);
      }
    });

    return s;
  }, [payments, now, currentMonthStr]);

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
  const cardShadow = isDark
    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)';
  const cardHoverShadow = isDark
    ? '0 0 0 2px rgba(249,115,22,0.25), 0 20px 40px -8px rgba(0,0,0,0.35)'
    : '0 0 0 2px rgba(249,115,22,0.2), 0 20px 40px -8px rgba(145,158,171,0.24)';

  const lift = (el: HTMLDivElement, on: boolean) => {
    el.style.transform = on ? 'translateY(-3px)' : 'translateY(0)';
    el.style.boxShadow = on ? cardHoverShadow : cardShadow;
  };

  return (
    <div className="space-y-6 page-enter">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary }}>{t('dashboard')}</h1>
        <div className="flex flex-row gap-3">
          <button
            onClick={() => navigate('/expenses/add')}
            className="btn-white flex-1 sm:w-auto justify-center px-2 sm:px-4"
            style={{ backgroundColor: isDark ? 'transparent' : '#fff', color: isDark ? '#fff' : '#1c252e', borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e0e0e0', fontSize: '13px' }}
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

      {/* ── 3 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Card 1  Total Owners → /owners */}
        <div
          onClick={() => navigate('/owners')}
          onMouseEnter={(e) => lift(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => lift(e.currentTarget as HTMLDivElement, false)}
          style={{ backgroundColor: cardBg, borderRadius: '14px', padding: '22px', cursor: 'pointer', boxShadow: cardShadow, border: `1px solid ${borderColor}`, transition: 'box-shadow 0.2s ease, transform 0.2s ease', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(0,184,217,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} style={{ color: '#00b8d9' }} />
            </div>
            <ChevronRight size={16} style={{ color: textSecondary, opacity: 0.4 }} />
          </div>
          <div>
            <p style={{ fontSize: '36px', fontWeight: 900, color: textPrimary, lineHeight: 1 }}>
              {stats.totalOwners}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: textSecondary, marginTop: '6px' }}>
              {t('totalOwners')}
            </p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#00b8d9', fontWeight: 600 }}>
            <span>View all residents</span>
            <ArrowRight size={13} style={{ strokeWidth: 2.2 }} />
          </div>
        </div>

        {/* Card 2  Monthly + Lifetime collections → /reports */}
        <div
          onClick={() => navigate('/reports')}
          onMouseEnter={(e) => lift(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => lift(e.currentTarget as HTMLDivElement, false)}
          style={{ backgroundColor: cardBg, borderRadius: '14px', padding: '22px', cursor: 'pointer', boxShadow: cardShadow, border: `1px solid ${borderColor}`, transition: 'box-shadow 0.2s ease, transform 0.2s ease', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} style={{ color: '#f97316' }} />
            </div>
            <ChevronRight size={16} style={{ color: textSecondary, opacity: 0.4 }} />
          </div>

          {/* This month */}
          <div>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#f97316', lineHeight: 1 }}>
              ₹{stats.collectedThisMonth.toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: textSecondary, marginTop: '6px' }}>
              Collected  {format(now, 'MMM yyyy')}
            </p>
          </div>

          {/* Divider + lifetime */}
          <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', color: textSecondary, fontWeight: 600, marginBottom: '3px' }}>Lifetime Total</p>
              <p style={{ fontSize: '17px', fontWeight: 800, color: textPrimary }}>
                ₹{stats.totalCollected.toLocaleString('en-IN')}
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
              {stats.paidThisMonthCount} / {stats.totalOwners} paid
            </span>
          </div>
        </div>

        {/* Card 3  Total Expenses → /expenses */}
        <div
          onClick={() => navigate('/expenses')}
          onMouseEnter={(e) => lift(e.currentTarget as HTMLDivElement, true)}
          onMouseLeave={(e) => lift(e.currentTarget as HTMLDivElement, false)}
          style={{ backgroundColor: cardBg, borderRadius: '14px', padding: '22px', cursor: 'pointer', boxShadow: cardShadow, border: `1px solid ${borderColor}`, transition: 'box-shadow 0.2s ease, transform 0.2s ease', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={20} style={{ color: '#ef4444' }} />
            </div>
            <ChevronRight size={16} style={{ color: textSecondary, opacity: 0.4 }} />
          </div>
          <div>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>
              ₹{stats.totalExpenses.toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: textSecondary, marginTop: '6px' }}>
              {t('expenses')}
            </p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#ef4444', fontWeight: 600, opacity: 0.85 }}>
            <span>{expenses.length} vouchers recorded</span>
            <ArrowRight size={13} style={{ strokeWidth: 2.2 }} />
          </div>
        </div>

      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }} />
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

      {/* ── Owner Grid ── */}
      {filteredOwners.length === 0 ? (
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '64px 24px', textAlign: 'center', boxShadow: cardShadow }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={28} style={{ color: '#f97316' }} />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>
            {searchTerm ? t('noResultsFound') : t('noOwners')}
          </p>
          <p style={{ fontSize: '13px', color: textSecondary }}>
            {searchTerm ? t('tryDifferentSearch') : t('addFirstOwner')}
          </p>
          {!searchTerm && (
            <button onClick={() => navigate('/owners/add')} className="btn-primary" style={{ marginTop: '20px' }}>
              <Plus size={16} /> {t('addOwner')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOwners.map((owner) => {
            const hasPaid = paidThisMonthOwnerIds.has(owner.id);
            const initials = owner.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
            const colors = ['#f97316', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
            const avatarColor = colors[owner.name.charCodeAt(0) % colors.length];
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
