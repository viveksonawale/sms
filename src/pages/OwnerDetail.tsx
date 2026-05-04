import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, isSameMonth, eachMonthOfInterval } from 'date-fns';
import {
  ArrowLeft, Trash2, Download, FileText,
  Pencil, X, Check, ChevronLeft, ChevronRight,
  Phone, Calendar, IndianRupee, Home,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateReceiptPDF } from '../utils/pdf';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';


// Improved WhatsApp Brand Icon
const WhatsAppBrandIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.845 11.845 0 005.928 1.586h.005c6.632 0 12.028-5.396 12.031-12.03a11.83 11.83 0 00-3.522-8.508z"/>
  </svg>
);

const PAGE_SIZE = 10;

export default function OwnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';

  // --- Custom Month Picker Component ---
  const MonthYearPicker = ({ 
    label, value, onChange, minDate, existingPayments, allowFuture 
  }: { 
    label: string, value: string, onChange: (val: string) => void,
    minDate?: string, existingPayments: any[], allowFuture?: boolean
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parseInt(value.split('-')[0]));
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = parseInt(value.split('-')[1]) - 1;
    const currentYear = parseInt(value.split('-')[0]);

    const today = new Date();
    const todayMonthIdx = today.getMonth();
    const todayYear = today.getFullYear();

    const MIN_YEAR = 2021;

    const isMonthDisabled = (idx: number) => {
      const monthStr = String(idx + 1).padStart(2, '0');
      const dateStr = `${viewYear}-${monthStr}`;

      // Block any year below 2021
      if (viewYear < MIN_YEAR) return true;

      // Future validation — only block future months when allowFuture is NOT set
      if (!allowFuture) {
        if (viewYear > todayYear || (viewYear === todayYear && idx > todayMonthIdx)) return true;
      }

      // Min date validation (To Month must be >= From Month)
      // Use numeric comparison: year*12+month so "2024-01" > "2023-12" works correctly
      if (minDate) {
        const [minY, minM] = minDate.split('-').map(Number);
        const toValue = viewYear * 12 + (idx + 1);
        const fromValue = minY * 12 + minM;
        if (toValue < fromValue) return true;
      }

      // Payment history validation — only for non-future months
      const d = new Date(dateStr + '-01');
      const alreadyPaid = existingPayments.some(p => {
        if (p.status !== 'paid') return false;
        const parts = p.month.split(' - ');
        const parsePDate = (str: string) => startOfMonth(new Date(str));
        const start = parsePDate(parts[0]);
        const end = parts.length === 2 ? parsePDate(parts[1]) : start;
        return d >= start && d <= end;
      });

      return alreadyPaid;
    };

    const handleMonthClick = (idx: number) => {
      if (isMonthDisabled(idx)) return;
      const monthStr = String(idx + 1).padStart(2, '0');
      onChange(`${viewYear}-${monthStr}`);
      setIsOpen(false);
    };

    return (
      <div style={{ position: 'relative' }}>
        <label className="label">{label}</label>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="input-field"
          style={{ 
            paddingLeft: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            borderColor: isOpen ? '#f97316' : undefined,
            boxShadow: isOpen ? '0 0 0 3px rgba(249, 115, 22, 0.16)' : undefined,
            userSelect: 'none',
            position: 'relative' // Fix flying icons
          }}
        >
          <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#919eab', zIndex: 10 }} />
          <span style={{ color: textPrimary, fontSize: '14px', fontWeight: 600 }}>
            {format(new Date(value + '-01'), 'MMMM yyyy')}
          </span>
        </div>

        {isOpen && (
          <>
            <div 
              onClick={() => setIsOpen(false)} 
              style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
            />
            <div style={{ 
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 999,
              width: '260px', backgroundColor: cardBg, borderRadius: '16px',
              boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(145, 158, 171, 0.2)',
              border: `1px solid ${borderColor}`,
              padding: '16px', overflow: 'hidden', animation: 'modalIn 0.2s ease both'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button 
                  type="button"
                  onClick={() => setViewYear(v => v - 1)}
                  disabled={viewYear <= 2021}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f6f8',
                    border: 'none', color: textSecondary,
                    cursor: viewYear <= 2021 ? 'not-allowed' : 'pointer',
                    opacity: viewYear <= 2021 ? 0.3 : 1,
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 800, color: textPrimary, fontSize: '16px' }}>{viewYear}</span>
                <button 
                  type="button" 
                  onClick={() => setViewYear(v => v + 1)}
                  disabled={!allowFuture && viewYear >= todayYear}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f6f8',
                    border: 'none', color: textSecondary, 
                    cursor: (!allowFuture && viewYear >= todayYear) ? 'not-allowed' : 'pointer',
                    opacity: (!allowFuture && viewYear >= todayYear) ? 0.3 : 1
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {months.map((m, i) => {
                  const isActive = i === currentMonthIdx && viewYear === currentYear;
                  const isDisabled = isMonthDisabled(i);
                  return (
                    <button
                      key={m} type="button"
                      disabled={isDisabled}
                      onClick={() => handleMonthClick(i)}
                      style={{
                        padding: '10px 0', border: 'none', borderRadius: '10px',
                        fontSize: '13px', fontWeight: isActive ? 800 : 600,
                        cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        backgroundColor: isActive ? '#f97316' : 'transparent',
                        color: isActive ? '#ffffff' : (isDisabled ? (isDark ? '#3d4e5c' : '#dfe3e8') : textSecondary),
                        opacity: isDisabled ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isActive && !isDisabled) {
                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : '#f4f6f8';
                          e.currentTarget.style.color = textPrimary;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive && !isDisabled) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = textSecondary;
                        }
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const owner = useStore((state) => state.owners.find((o) => o.id === id));
  const allPayments = useStore((state) => state.payments);
  const ownerPayments = useMemo(() => allPayments.filter((p) => p.ownerId === id), [allPayments, id]);
  const addPayment = useStore((state) => state.addPayment);
  const updatePayment = useStore((state) => state.updatePayment);
  const deletePayment = useStore((state) => state.deletePayment);
  const deleteOwner = useStore((state) => state.deleteOwner);
  const updateOwner = useStore((state) => state.updateOwner);
  const nextReceiptNumber = useStore((state) => state.nextReceiptNumber);
  const societyName = useStore((state) => state.societyName);
  const language = useStore((state) => state.language);

  const [paymentFromDate, setPaymentFromDate] = useState(format(new Date(), 'yyyy-MM'));
  const [paymentToDate, setPaymentToDate] = useState(format(new Date(), 'yyyy-MM'));
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState<typeof ownerPayments[0] | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<typeof ownerPayments[0] | null>(null);
  const [lastPayment, setLastPayment] = useState<typeof ownerPayments[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [editForm, setEditForm] = useState({
    name: owner?.name ?? '',
    nameMr: owner?.nameMr ?? '',
    flat: owner?.flat ?? '',
    phone: owner?.phone ?? '',
    email: owner?.email ?? '',
    monthlyAmount: owner?.monthlyAmount ?? 0,
    joinedDate: owner?.joinedDate ?? '',
  });

  const sortedPayments = useMemo(
    () => [...ownerPayments].sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime()),
    [ownerPayments]
  );

  const totalPages = Math.max(1, Math.ceil(sortedPayments.length / PAGE_SIZE));
  const paginatedPayments = sortedPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const cardShadow = isDark
    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)';

  if (!owner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', gap: '16px' }}>
        <FileText size={48} style={{ color: '#c4cdd5' }} />
        <p style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>Owner not found</p>
        <button onClick={() => navigate('/')} className="btn-primary">{t('dashboard')}</button>
      </div>
    );
  }

  const initials = owner.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const colors = ['#f97316', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
  const avatarColor = colors[owner.name.charCodeAt(0) % colors.length];

  const handleMarkAsPaid = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    if (!paymentAmount || paymentAmount <= 0) {
      toast('Amount cannot be zero or empty.', 'error');
      return;
    }

    // Compare as strings (yyyy-MM) to avoid timezone pitfalls where
    // startOfMonth(new Date()) in UTC could mismatch local date at +05:30.
    const todayKey = format(new Date(), 'yyyy-MM');
    const startKey = paymentFromDate; // already in "yyyy-MM" format
    const endKey = paymentToDate;

    // Block only if From Month is strictly in the future (not the current month).
    if (startKey > todayKey) {
      toast('From Month cannot be a future month.', 'error');
      return;
    }
    
    if (startKey > endKey) {
      toast('From Month cannot be after To Month', 'error');
      return;
    }

    // Build start/end Date objects from the validated keys (noon local time to avoid UTC-day-boundary issues)
    const start = new Date(startKey + '-01T12:00:00');
    const end = new Date(endKey + '-01T12:00:00');

    const period = isSameMonth(start, end)
      ? format(start, 'MMMM yyyy')
      : `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;

    // Build a helper that expands a stored payment's period string into
    // all the individual month-start dates it covers.
    const expandPaymentMonths = (p: typeof ownerPayments[0]): Date[] => {
      const parts = p.month.split(' - ');
      const parsePDate = (str: string) => startOfMonth(new Date(str));
      const pStart = parsePDate(parts[0]);
      const pEnd = parts.length === 2 ? parsePDate(parts[1]) : pStart;
      // Guard against invalid dates
      if (isNaN(pStart.getTime()) || isNaN(pEnd.getTime())) return [];
      return eachMonthOfInterval({ start: pStart, end: pEnd });
    };

    // Collect all months that are already marked as PAID for this owner.
    const paidMonthKeys = new Set<string>();
    ownerPayments.forEach((p) => {
      if (p.status !== 'paid') return;
      expandPaymentMonths(p).forEach((d) => {
        // Key: "YYYY-MM" for fast O(1) lookup
        paidMonthKeys.add(format(d, 'yyyy-MM'));
      });
    });

    // Enumerate every month in the requested range and check for duplicates.
    const requestedMonths = eachMonthOfInterval({ start, end });
    const duplicateMonth = requestedMonths.find((m) =>
      paidMonthKeys.has(format(m, 'yyyy-MM'))
    );

    if (duplicateMonth) {
      toast('Maintenance already marked as PAID for this month', 'error');
      return;
    }

    const rcpNum = nextReceiptNumber();
    useStore.setState((s) => ({ receiptCounter: s.receiptCounter + 1 }));
    const newPayment = {
      id: crypto.randomUUID(), ownerId: owner.id, month: period,
      amount: Number(paymentAmount), paidOn: new Date().toISOString(),
      receiptNumber: rcpNum, status: 'paid' as const,
    };
    addPayment(newPayment);
    setLastPayment(newPayment);
    toast(t('paymentConfirmed'), 'success');
    setCurrentPage(1);
  };

  const handleDelete = () => { deleteOwner(owner.id); toast(`${owner.name} has been removed.`, 'success'); navigate('/'); };
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOwner(owner.id, { ...editForm, monthlyAmount: Number(editForm.monthlyAmount) });
    setIsEditing(false);
    toast(t('save') + ' successful!', 'success');
  };
  const sendWhatsApp = (payment: typeof ownerPayments[0]) => {
    const dateStr = format(new Date(payment.paidOn), 'dd MMM yyyy');
    const text = encodeURIComponent(`Hello ${owner.name},\n\nWe have received your society maintenance payment.\n\nReceipt No: ${payment.receiptNumber}\nPeriod: ${payment.month}\nAmount: ₹${payment.amount.toLocaleString('en-IN')}\nPaid On: ${dateStr}\n\nThank you!\n— ${societyName}`);
    window.open(`https://wa.me/${owner.phone}?text=${text}`, '_blank');
  };

  const handleEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    updatePayment(editingPayment.id, {
      amount: Number(editingPayment.amount),
      month: editingPayment.month,
      paidOn: editingPayment.paidOn,
    });
    setEditingPayment(null);
    toast(t('save') + ' successful!', 'success');
  };

  const handleDeletePayment = () => {
    if (!paymentToDelete) return;
    deletePayment(paymentToDelete);
    setPaymentToDelete(null);
    setShowDeletePaymentModal(false);
    toast('Payment record deleted.', 'success');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '64px' }} className="space-y-6 page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8', color: textSecondary,
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            backgroundColor: `${avatarColor}20`, color: avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 800, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: textPrimary }}>
              {language === 'mr' && owner.nameMr ? owner.nameMr : owner.name}
            </h1>
            <p style={{ fontSize: '13px', color: textSecondary }}>
              {t('flat')}: <span style={{ color: '#f97316', fontWeight: 700 }}>{owner.flat}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Owner Info Card */}
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>{t('ownerInfo')}</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  backgroundColor: isEditing ? '#f4f6f8' : 'rgba(249, 115, 22,0.1)',
                  color: isEditing ? '#637381' : '#f97316',
                }}
              >
                {isEditing ? <><X size={12} /> Cancel</> : <><Pencil size={12} /> {t('editOwner')}</>}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: t('fullName'), key: 'name', type: 'text', required: true },
                  { label: t('fullNameMr'), key: 'nameMr', type: 'text', required: false },
                  { label: t('flat'), key: 'flat', type: 'text', required: true },
                  { label: t('phone'), key: 'phone', type: 'text' },
                  { label: t('email'), key: 'email', type: 'email' },
                  { label: `${t('monthlyAmount')} (₹)`, key: 'monthlyAmount', type: 'number' },
                  { label: t('joinedDate'), key: 'joinedDate', type: 'date' },
                ].map(({ label, key, type, required }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={type}
                        value={String(editForm[key as keyof typeof editForm] || '')}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className="input-field"
                        style={type === 'date' ? { paddingLeft: '36px' } : undefined}
                        required={required !== false}
                      />
                      {type === 'date' && <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#919eab', pointerEvents: 'none', zIndex: 10 }} />}
                    </div>
                  </div>
                ))}
                <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: '4px' }}>
                  {t('save')} Changes
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { icon: Home, label: t('flat'), value: owner.flat },
                  { icon: Phone, label: t('phone'), value: owner.phone.startsWith('91') && owner.phone.length === 12 ? `+91 ${owner.phone.slice(2)}` : `+91 ${owner.phone.replace(/^\+91\s*/, '')}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: 'rgba(249, 115, 22,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: '#f97316' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: textSecondary, marginBottom: '2px' }}>{label}</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isEditing && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,86,48,0.3)',
                    backgroundColor: 'transparent', color: '#ff5630', fontSize: '13px', fontWeight: 700,
                    cursor: 'pointer', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,86,48,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Trash2 size={14} />
                  {t('deleteOwner')}
                </button>
              </div>
            )}
          </div>

          {/* Mark as Paid */}
          <div style={{
            backgroundColor: cardBg, borderRadius: '12px',
            border: '1px solid rgba(249, 115, 22,0.2)',
            boxShadow: cardShadow, overflow: 'visible',
          }}>
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #ea580c, #f97316, #fdba74)', borderRadius: '12px 12px 0 0' }} />
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(249, 115, 22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={15} style={{ color: '#f97316' }} />
                </div>
                {t('markAsPaid')}
              </h2>
              <form onSubmit={handleMarkAsPaid} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MonthYearPicker 
                    label={t('fromMonth')} 
                    value={paymentFromDate} 
                    onChange={(val) => {
                      setPaymentFromDate(val);
                      if (paymentToDate < val) setPaymentToDate(val);
                    }}
                    existingPayments={ownerPayments}
                  />
                  <MonthYearPicker 
                    label={t('toMonth')} 
                    value={paymentToDate} 
                    onChange={setPaymentToDate}
                    minDate={paymentFromDate}
                    existingPayments={ownerPayments}
                    allowFuture
                  />
                </div>
                <div>
                  <label className="label">{t('amount')} (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <IndianRupee size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }} />
                    <input
                      type="number" value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input-field" style={{ paddingLeft: '36px', fontWeight: 700, fontSize: '16px' }}
                      min={1} required placeholder="0"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: '4px', padding: '12px' }}>
                  {t('confirmPayment')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Receipt Card */}
          {lastPayment && (
            <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: cardShadow, border: `1px solid rgba(249, 115, 22,0.2)` }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #ea580c, #f97316, #fdba74)' }} />
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <p style={{ fontSize: '10px', color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{t('receipt')}</p>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: textPrimary }}>{societyName}</h3>
                    <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>{t('maintenanceReceipt')}</p>
                  </div>
                  <button
                    onClick={() => setLastPayment(null)}
                    style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#919eab', borderRadius: '8px' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  {[
                    { label: t('receiptNo'), value: lastPayment.receiptNumber },
                    { label: t('paidOn'), value: format(new Date(lastPayment.paidOn), 'dd MMMM yyyy') },
                    { label: t('owner'), value: owner.name },
                    { label: t('flat'), value: owner.flat },
                    { label: 'Period', value: lastPayment.month },
                    { label: t('amount'), value: `₹${lastPayment.amount.toLocaleString('en-IN')}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: '11px', color: textSecondary, marginBottom: '3px' }}>{label}</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
                  <button
                    onClick={() => { generateReceiptPDF(lastPayment, owner, societyName); toast(t('receiptGenerated'), 'success'); }}
                    className="btn-primary flex-1 justify-center"
                    style={{ padding: '10px' }}
                  >
                    <Download size={14} />
                    {t('downloadReceipt')}
                  </button>
                  <button
                    onClick={() => sendWhatsApp(lastPayment)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(37,211,102,0.4)',
                      backgroundColor: 'rgba(37,211,102,0.08)', color: '#25D366',
                      fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <WhatsAppBrandIcon />
                    {t('send')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: cardShadow }}>
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${borderColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} style={{ color: '#919eab' }} />
                {t('history')}
              </h2>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                backgroundColor: 'rgba(249, 115, 22,0.1)', color: '#f97316', borderRadius: '20px',
              }}>
                {sortedPayments.length} records
              </span>
            </div>

            {sortedPayments.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  backgroundColor: 'rgba(249, 115, 22,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <FileText size={24} style={{ color: '#f97316' }} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>{t('noHistory')}</p>
                <p style={{ fontSize: '13px', color: textSecondary, marginTop: '4px' }}>Mark a payment to see it here.</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th className="table-th">Receipt No</th>
                        <th className="table-th">Period</th>
                        <th className="table-th">{t('amount')}</th>
                        <th className="table-th">{t('paidOn')}</th>
                        <th className="table-th" style={{ textAlign: 'right' }}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          onClick={() => setSelectedPayment(payment)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="table-td" style={{ fontWeight: 700, color: '#f97316', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={14} style={{ opacity: 0.5 }} />
                              {payment.receiptNumber}
                            </div>
                          </td>
                          <td className="table-td" style={{ whiteSpace: 'nowrap', maxWidth: '180px' }}>{payment.month}</td>
                          <td className="table-td" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>₹{payment.amount.toLocaleString('en-IN')}</td>
                          <td className="table-td" style={{ color: textSecondary, whiteSpace: 'nowrap' }}>
                            {format(new Date(payment.paidOn), 'dd MMM yyyy')}
                          </td>
                          <td className="table-td">
                            <div
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => { generateReceiptPDF(payment, owner, societyName); toast(t('receiptGenerated'), 'success'); }}
                                title={t('downloadReceipt')}
                                style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#919eab' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22,0.1)'; e.currentTarget.style.color = '#f97316'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#919eab'; }}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => sendWhatsApp(payment)}
                                title={t('sendViaWhatsapp')}
                                style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#919eab' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,211,102,0.1)'; e.currentTarget.style.color = '#25D366'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#919eab'; }}
                              >
                                <WhatsAppBrandIcon size={14} />
                              </button>
                              <button
                                onClick={() => setEditingPayment(payment)}
                                title={t('edit')}
                                style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#919eab' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22,0.1)'; e.currentTarget.style.color = '#f97316'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#919eab'; }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => { setPaymentToDelete(payment.id); setShowDeletePaymentModal(true); }}
                                title={t('delete')}
                                style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#919eab' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,86,48,0.1)'; e.currentTarget.style.color = '#ff5630'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#919eab'; }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div style={{
                    padding: '12px 20px', borderTop: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <p style={{ fontSize: '12px', color: textSecondary }}>Page {currentPage} of {totalPages}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          backgroundColor: 'transparent', color: textSecondary, opacity: currentPage === 1 ? 0.3 : 1,
                        }}
                      >
                        <ChevronLeft size={15} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 700,
                            backgroundColor: page === currentPage ? '#f97316' : 'transparent',
                            color: page === currentPage ? '#ffffff' : textSecondary,
                          }}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          backgroundColor: 'transparent', color: textSecondary, opacity: currentPage === totalPages ? 0.3 : 1,
                        }}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('deleteOwner')}
        message={t('deleteConfirmText')}
        confirmLabel={t('deleteOwner')}
        cancelLabel={t('cancel')}
        danger
      />

      <Modal
        isOpen={showDeletePaymentModal}
        onClose={() => setShowDeletePaymentModal(false)}
        onConfirm={handleDeletePayment}
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
      />

      {editingPayment && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPayment(null)}
          title="Edit Payment"
        >
          <form onSubmit={handleEditPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <label className="label">Period</label>
              <input
                type="text"
                value={editingPayment.month}
                onChange={(e) => setEditingPayment({ ...editingPayment, month: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                value={editingPayment.amount}
                onChange={(e) => setEditingPayment({ ...editingPayment, amount: Number(e.target.value) })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Paid On</label>
              <input
                type="date"
                value={format(new Date(editingPayment.paidOn), 'yyyy-MM-dd')}
                onChange={(e) => setEditingPayment({ ...editingPayment, paidOn: new Date(e.target.value).toISOString() })}
                className="input-field"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setEditingPayment(null)} className="btn-white flex-1 justify-center">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayment(null)}
          title="Payment Details"
          icon={IndianRupee}
        >
          <div style={{ marginTop: '16px' }}>
            <div style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
              borderRadius: '12px', padding: '16px', border: `1px solid ${borderColor}`,
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[
                  { label: 'Receipt Number', value: selectedPayment.receiptNumber, color: '#f97316', mono: true },
                  { label: 'Status', value: 'Paid', isBadge: true, mono: false },
                  { label: 'Amount', value: `₹${selectedPayment.amount.toLocaleString('en-IN')}`, bold: true, mono: false },
                  { label: 'Period', value: selectedPayment.month, mono: false },
                  { label: 'Paid On', value: format(new Date(selectedPayment.paidOn), 'dd MMMM yyyy'), mono: false },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ fontSize: '11px', color: textSecondary, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.label}
                    </p>
                    {item.isBadge ? (
                      <span className="badge badge-paid">Paid</span>
                    ) : (
                      <p style={{
                        fontSize: '14px',
                        fontWeight: item.bold ? 800 : 600,
                        color: item.color || textPrimary,
                        fontFamily: item.mono ? 'monospace' : 'inherit'
                      }}>
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <h4 style={{ fontSize: '12px', fontWeight: 700, color: textSecondary, marginBottom: '12px', textTransform: 'uppercase' }}>
              Options
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => { generateReceiptPDF(selectedPayment, owner, societyName); toast(t('receiptGenerated'), 'success'); }}
                className="btn-white w-full justify-center"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={() => sendWhatsApp(selectedPayment)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(37,211,102,0.4)',
                  backgroundColor: 'rgba(37,211,102,0.08)', color: '#25D366',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <WhatsAppBrandIcon size={14} /> WhatsApp
              </button>
              <button
                onClick={() => { setEditingPayment(selectedPayment); setSelectedPayment(null); }}
                className="btn-white w-full justify-center"
              >
                <Pencil size={14} /> Edit Record
              </button>
              <button
                onClick={() => { setPaymentToDelete(selectedPayment.id); setShowDeletePaymentModal(true); setSelectedPayment(null); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,86,48,0.2)',
                  backgroundColor: 'rgba(255,86,48,0.08)', color: '#ff5630',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Delete Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
