import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, isSameMonth, eachMonthOfInterval, addMonths } from 'date-fns';
import {
  ArrowLeft, Trash2, Download, FileText,
  Pencil, X, Check, ChevronLeft, ChevronRight,
  Phone, Calendar, IndianRupee, Building2,
  List, LayoutGrid, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useStore, isShopUnit, getCoveredMonthsForPayment } from '../store/useStore';

import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { ReceiptService } from '../api/receipt.service';


// Improved WhatsApp Brand Icon
const WhatsAppBrandIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.845 11.845 0 005.928 1.586h.005c6.632 0 12.028-5.396 12.031-12.03a11.83 11.83 0 00-3.522-8.508z" />
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

  const owner = useStore((state) => state.owners.find((o) => o.id === id));
  const isShop = isShopUnit(owner?.flat);
  const standardMonthlyRate = isShop
    ? 200
    : (owner?.monthlyAmount && ![1200, 2500, 3000].includes(owner.monthlyAmount)
      ? owner.monthlyAmount
      : 500);

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

      // Future validation  only block future months when allowFuture is NOT set
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

      // Payment history validation  only for non-future months
      const d = new Date(dateStr + '-01');
      const alreadyPaid = existingPayments.some(p => {
        if (p.status !== 'paid') return false;
        const covered = getCoveredMonthsForPayment(p, standardMonthlyRate);
        return covered.some(cm => isSameMonth(cm, d));
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
              width: '260px', maxWidth: 'calc(100vw - 32px)', backgroundColor: cardBg, borderRadius: '16px',
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
  const fetchOwners = useStore((state) => state.fetchOwners);
  const fetchPayments = useStore((state) => state.fetchPayments);
  const [loading, setLoading] = useState(true);

  // Fetch owner data on mount to ensure it's loaded
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
  }, [id]);

  const [paymentFromDate, setPaymentFromDate] = useState(format(new Date(), 'yyyy-MM'));
  const [paymentToDate, setPaymentToDate] = useState(format(new Date(), 'yyyy-MM'));
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');

  const handlePaymentAmountChange = (valStr: string) => {
    if (valStr === '') {
      setPaymentAmount('');
      return;
    }
    const val = Number(valStr);
    setPaymentAmount(val);

    // If admin enters a lump sum, calculate how many months it covers and sync To Month
    if (standardMonthlyRate > 0 && val >= standardMonthlyRate) {
      const covered = Math.floor(val / standardMonthlyRate);
      if (covered >= 1) {
        const start = new Date(paymentFromDate + '-01T12:00:00');
        const newEnd = addMonths(start, covered - 1);
        setPaymentToDate(format(newEnd, 'yyyy-MM'));
      }
    }
  };

  const totalMonthsPaid = useMemo(() => {
    try {
      const start = new Date(paymentFromDate + '-01T12:00:00');
      const end = new Date(paymentToDate + '-01T12:00:00');
      if (start > end) return 0;
      return eachMonthOfInterval({ start, end }).length;
    } catch {
      return 0;
    }
  }, [paymentFromDate, paymentToDate]);

  // Automatically update payment amount when months or owner standard rate changes
  useEffect(() => {
    if (totalMonthsPaid > 0) {
      setPaymentAmount(totalMonthsPaid * standardMonthlyRate);
    }
  }, [totalMonthsPaid, standardMonthlyRate]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState<typeof ownerPayments[0] | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<typeof ownerPayments[0] | null>(null);
  const [lastPayment, setLastPayment] = useState<typeof ownerPayments[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleDownloadReceipt = async (payment: typeof ownerPayments[0]) => {
    if (payment.status !== 'paid') {
      toast('No receipt available  payment is not marked as paid.', 'error');
      return;
    }
    try {
      toast('Downloading receipt from server...', 'info');
      const receipt = await ReceiptService.getReceiptByMaintenance(Number(payment.id));
      await ReceiptService.downloadReceiptPdf(receipt.id);
      toast('Receipt downloaded successfully.', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Receipt not found on server.';
      toast(msg, 'error');
    }
  };

  const [showDeleteReceiptModal, setShowDeleteReceiptModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    try {
      const receipt = await ReceiptService.getReceiptByMaintenance(Number(receiptToDelete));
      await ReceiptService.deleteReceipt(receipt.id);
      toast('Receipt deleted. Payment reset to pending.', 'success');
      setShowDeleteReceiptModal(false);
      setReceiptToDelete(null);
      await fetchPayments();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete receipt.';
      toast(msg, 'error');
      setShowDeleteReceiptModal(false);
    }
  };

  const [editForm, setEditForm] = useState({
    name: owner?.name ?? '',
    nameMr: owner?.nameMr ?? '',
    flat: owner?.flat ?? '',
    phone: owner?.phone ?? '',
    email: owner?.email ?? '',
    monthlyAmount: owner?.monthlyAmount ?? 0,
    joinedDate: owner?.joinedDate ?? '',
  });

  const [historyYear, setHistoryYear] = useState<string>('all');
  const [historyMonth, setHistoryMonth] = useState<string>('all');
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'matrix'>('list');

  // Available Years dynamically gathered from this owner's payment history + current/recent years
  const availableHistoryYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const curY = new Date().getFullYear();
    yearsSet.add(String(curY));
    yearsSet.add(String(curY - 1));

    ownerPayments.forEach((p) => {
      if (p.paidOn) {
        const y = new Date(p.paidOn).getFullYear();
        if (!isNaN(y)) yearsSet.add(String(y));
      }
      if (p.fromDate) {
        const y = p.fromDate.split('-')[0];
        if (y) yearsSet.add(y);
      }
      if (p.month) {
        const matches = p.month.match(/\d{4}/g);
        if (matches) matches.forEach((m) => yearsSet.add(m));
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [ownerPayments]);

  // Check if a payment matches selected year and month
  const matchesYearAndMonth = (p: typeof ownerPayments[0], yFilter: string, mFilter: string) => {
    if (yFilter === 'all' && mFilter === 'all') return true;

    const covered = getCoveredMonthsForPayment(p, standardMonthlyRate);
    if (covered.length === 0) {
      if (p.paidOn) {
        const d = new Date(p.paidOn);
        if (!isNaN(d.getTime())) {
          if (yFilter !== 'all' && String(d.getFullYear()) !== yFilter) return false;
          if (mFilter !== 'all' && String(d.getMonth() + 1) !== mFilter) return false;
          return true;
        }
      }
      return true;
    }

    return covered.some((d) => {
      const yMatches = yFilter === 'all' || String(d.getFullYear()) === yFilter;
      const mMatches = mFilter === 'all' || String(d.getMonth() + 1) === mFilter;
      return yMatches && mMatches;
    });
  };

  const sortedPayments = useMemo(
    () => [...ownerPayments].sort((a, b) => {
      const timeA = a.paidOn ? new Date(a.paidOn).getTime() : 0;
      const timeB = b.paidOn ? new Date(b.paidOn).getTime() : 0;
      return timeB - timeA;
    }),
    [ownerPayments]
  );

  const filteredPayments = useMemo(() => {
    return sortedPayments.filter((p) => matchesYearAndMonth(p, historyYear, historyMonth));
  }, [sortedPayments, historyYear, historyMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Target Year for 12-Month Matrix
  const targetMatrixYear = historyYear === 'all' ? new Date().getFullYear() : Number(historyYear);

  const monthsMatrix = useMemo(() => {
    const list = [];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Pre-calculate covered months for each paid payment using standard monthly rate
    const coveredByPayment = ownerPayments
      .filter((p) => p.status === 'paid')
      .map((p) => ({
        payment: p,
        coveredMonths: getCoveredMonthsForPayment(p, standardMonthlyRate),
      }));

    for (let idx = 0; idx < 12; idx++) {
      const monthStart = new Date(targetMatrixYear, idx, 1);
      const monthKey = format(monthStart, 'yyyy-MM');
      const monthName = months[idx];

      // Find matching payment that covers this month
      const match = coveredByPayment.find((item) =>
        item.coveredMonths.some((d) => isSameMonth(d, monthStart))
      );

      const isFuture = monthStart > new Date();

      list.push({
        monthIndex: idx,
        monthName,
        monthKey,
        isPaid: !!match,
        payment: match ? match.payment : null,
        isFuture,
        amount: standardMonthlyRate, // Always show the standard monthly rate (₹200 for shop, ₹500 for flat)!
      });
    }

    return list;
  }, [targetMatrixYear, ownerPayments, standardMonthlyRate]);

  // Statistics for this specific resident
  const historyStats = useMemo(() => {
    const totalCollected = filteredPayments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const monthsPaidInYear = monthsMatrix.filter((m) => m.isPaid).length;
    const monthsPendingInYear = monthsMatrix.filter((m) => !m.isPaid && !m.isFuture).length;
    const totalDuesInYear = monthsPendingInYear * standardMonthlyRate;

    return {
      totalCollected,
      monthsPaidInYear,
      monthsPendingInYear,
      totalDuesInYear,
    };
  }, [filteredPayments, monthsMatrix, standardMonthlyRate]);

  // Handle pre-filling month from matrix to mark as paid
  const handleSelectMonthToPay = (monthKey: string) => {
    setPaymentFromDate(monthKey);
    setPaymentToDate(monthKey);
    setPaymentAmount(standardMonthlyRate);
    toast(`Selected ${format(new Date(monthKey + '-01'), 'MMMM yyyy')} in payment form below.`, 'info');
  };

  const cardShadow = isDark
    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #f97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '14px', color: textSecondary }}>Loading owner details...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!owner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', gap: '16px' }}>
        <FileText size={48} style={{ color: '#c4cdd5' }} />
        <p style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>Owner not found</p>
        <button onClick={() => navigate('/owners')} className="btn-primary">{t('owners')}</button>
      </div>
    );
  }

  const initials = (owner.name || 'Owner')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'OW';
  const colors = ['#f97316', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
  const avatarColor = colors[(owner.name || 'O').charCodeAt(0) % colors.length];

  const handleMarkAsPaid = async (e: React.FormEvent) => {
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

    // Calculate how many months the payment amount actually covers
    const coveredMonthsCount = Math.max(1, Math.floor(Number(paymentAmount) / standardMonthlyRate));
    const finalEnd = addMonths(start, coveredMonthsCount - 1);
    const finalEndKey = format(finalEnd, 'yyyy-MM');

    const period = isSameMonth(start, finalEnd)
      ? format(start, 'MMMM yyyy')
      : `${format(start, 'MMM yyyy')} - ${format(finalEnd, 'MMM yyyy')}`;

    // Collect all months that are already marked as PAID for this owner.
    const paidMonthKeys = new Set<string>();
    ownerPayments.forEach((p) => {
      if (p.status !== 'paid') return;
      getCoveredMonthsForPayment(p, standardMonthlyRate).forEach((d) => {
        paidMonthKeys.add(format(d, 'yyyy-MM'));
      });
    });

    // Enumerate every month in the requested range and check for duplicates.
    const requestedMonths = eachMonthOfInterval({ start, end: finalEnd });
    const duplicateMonth = requestedMonths.find((m) =>
      paidMonthKeys.has(format(m, 'yyyy-MM'))
    );

    if (duplicateMonth) {
      toast('Maintenance already marked as PAID for this month', 'error');
      return;
    }

    const rcpNum = nextReceiptNumber();
    useStore.setState((s) => ({ receiptCounter: s.receiptCounter + 1 }));
    const tempPayment = {
      id: '',  // placeholder  will be replaced with real backend ID after fetch
      ownerId: owner.id, month: period,
      amount: Number(paymentAmount), paidOn: new Date().toISOString(),
      receiptNumber: rcpNum, status: 'paid' as const,
      transactionId: paymentTransactionId || undefined,
    };
    try {
      await addPayment(tempPayment, { fromDate: startKey, toDate: finalEndKey });
      // After fetchPayments completes inside addPayment, get the real payment from the store
      // by finding the most recently added paid payment for this owner
      const freshPayments = useStore.getState().payments;
      const freshOwnerPayments = freshPayments.filter(
        (p) => p.ownerId === owner.id && p.status === 'paid'
      );
      // Pick the payment that best matches: same fromDate month
      const matched = freshOwnerPayments.find((p) => {
        const monthStr = p.month || '';
        return monthStr.includes(format(start, 'MMM yyyy')) ||
          monthStr.startsWith(format(start, 'MMMM yyyy'));
      }) || freshOwnerPayments[freshOwnerPayments.length - 1];
      setLastPayment(matched || null);
      toast(t('paymentConfirmed'), 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to record payment.';
      toast(msg, 'error');
    }
    setCurrentPage(1);
    setPaymentTransactionId('');
  };

  const handleDelete = () => { deleteOwner(owner.id); toast(`${owner.name} has been removed.`, 'success'); navigate('/'); };
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOwner(owner.id, { ...editForm, monthlyAmount: Number(editForm.monthlyAmount) });
    setIsEditing(false);
    toast(t('save') + ' successful!', 'success');
  };
  const sendWhatsApp = async (payment: typeof ownerPayments[0]) => {
    if (payment.status !== 'paid') {
      toast('No receipt available  payment is not marked as paid.', 'error');
      return;
    }

    // Build a clean E.164 phone number always prefixed with 91
    const rawDigits = owner.phone.replace(/\D/g, '');
    const e164Phone = rawDigits.startsWith('91') && rawDigits.length > 10
      ? rawDigits
      : `91${rawDigits}`;

    const msgText = `Dear ${owner.name} (Flat ${owner.flat}),\n\nYour society maintenance has been received successfully.\n\nPeriod: ${payment.month}\nAmount Paid: ₹${payment.amount.toLocaleString('en-IN')}\n\nThank you!\n${societyName}`;
    const encodedText = encodeURIComponent(msgText);

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const triggerWhatsAppRedirect = () => {
      if (isMobile) {
        // Direct native app scheme
        window.location.href = `whatsapp://send?phone=${e164Phone}&text=${encodedText}`;

        // Fallback: If custom scheme isn't handled within 300ms, redirect to the universal api link
        setTimeout(() => {
          window.open(`https://api.whatsapp.com/send?phone=${e164Phone}&text=${encodedText}`, '_blank');
        }, 300);
      } else {
        // Desktop: Open standard WhatsApp API link in new tab
        window.open(`https://api.whatsapp.com/send?phone=${e164Phone}&text=${encodedText}`, '_blank');
      }
    };

    try {
      toast('Fetching receipt PDF...', 'info');
      const receipt = await ReceiptService.getReceiptByMaintenance(Number(payment.id));
      const { blob, filename } = await ReceiptService.getReceiptBlob(receipt.id);

      // Always download the PDF so the admin can attach it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Try Web Share API with file (works on Android/iOS when supported)
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Receipt  ${payment.receiptNumber}`,
            text: msgText,
            files: [file],
          });
          toast('Receipt shared successfully!', 'success');
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return; // User dismissed  not an error
          // Fall through to wa.me redirect
        }
      }

      // Redirect to WhatsApp (opens the app on mobile, web on desktop)
      triggerWhatsAppRedirect();
      toast('PDF downloaded! Open WhatsApp and attach the PDF to send it.', 'success');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('WhatsApp share error:', err);
      // Final fallback: open WhatsApp with pre-filled text even without the PDF
      triggerWhatsAppRedirect();
      toast('Could not download PDF. Opening WhatsApp with text only.', 'error');
    }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.08)',
                  color: '#f97316',
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                }}
              >
                {t('flat')}: {owner.flat}
              </span>
            </div>
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
                {/* Full Name */}
                <div>
                  <label className="label">{t('fullName')}</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                {/* Name in Marathi */}
                <div>
                  <label className="label">Name in Marathi</label>
                  <input
                    type="text"
                    value={editForm.nameMr}
                    onChange={(e) => setEditForm({ ...editForm, nameMr: e.target.value })}
                    className="input-field"
                  />
                </div>
                {/* Flat */}
                <div>
                  <label className="label">{t('flat')}</label>
                  <input
                    type="text"
                    value={editForm.flat}
                    onChange={(e) => setEditForm({ ...editForm, flat: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                {/* Phone with +91 prefix */}
                <div>
                  <label className="label">{t('phone')}</label>
                  <div style={{ display: 'flex' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '0 14px', borderRadius: '8px 0 0 8px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#dfe3e8'}`,
                      borderRight: 'none',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f6f8',
                      color: textSecondary,
                      fontSize: '14px', fontWeight: 600,
                      userSelect: 'none', whiteSpace: 'nowrap',
                    }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editForm.phone.replace(/\D/g, '').replace(/^91/, '').slice(0, 10)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditForm({ ...editForm, phone: val });
                      }}
                      className="input-field"
                      style={{ flex: 1, borderRadius: '0 8px 8px 0' }}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: '4px' }}>
                  {t('save')} Changes
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { icon: Building2, label: t('flat'), value: owner.flat },
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
                      {label === t('flat') ? (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.08)',
                            color: '#f97316',
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid rgba(249, 115, 22, 0.2)',
                            marginTop: '2px'
                          }}
                        >
                          {value}
                        </span>
                      ) : (
                        <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{value}</p>
                      )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <label className="label">Total Months</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text" value={`${totalMonthsPaid} Month${totalMonthsPaid !== 1 ? 's' : ''}`}
                        readOnly
                        className="input-field" style={{ fontWeight: 700, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', color: textSecondary, cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <label className="label" style={{ whiteSpace: 'nowrap' }}>Transaction ID <span style={{ fontWeight: 400, opacity: 0.7 }}>(Optional)</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text" value={paymentTransactionId}
                        onChange={(e) => setPaymentTransactionId(e.target.value)}
                        className="input-field" style={{ fontWeight: 500 }}
                        placeholder="e.g. TXN12345"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">{t('amount')} (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <IndianRupee size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }} />
                    <input
                      type="number" value={paymentAmount}
                      onChange={(e) => handlePaymentAmountChange(e.target.value)}
                      className="input-field" style={{ paddingLeft: '36px', fontWeight: 700, fontSize: '16px' }}
                      min={1} required placeholder="0"
                    />
                  </div>
                  {paymentAmount && standardMonthlyRate > 0 && (
                    <p style={{ fontSize: '12px', color: '#f97316', marginTop: '6px', fontWeight: 600 }}>
                      ₹{standardMonthlyRate.toLocaleString('en-IN')}/mo × {Math.max(1, Math.floor(Number(paymentAmount) / standardMonthlyRate))} Month(s) = ₹{(Math.floor(Number(paymentAmount) / standardMonthlyRate) * standardMonthlyRate).toLocaleString('en-IN')}
                      {Number(paymentAmount) % standardMonthlyRate !== 0 && (
                        <span style={{ color: '#ff5630', marginLeft: '6px' }}>(Remaining ₹{Number(paymentAmount) % standardMonthlyRate} unallocated)</span>
                      )}
                    </p>
                  )}
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
                    { label: t('paidOn'), value: lastPayment.paidOn ? format(new Date(lastPayment.paidOn), 'dd MMMM yyyy') : 'Pending' },
                    { label: t('owner'), value: owner.name },
                    { label: t('flat'), value: owner.flat },
                    { label: 'Period', value: lastPayment.month },
                    { label: t('amount'), value: `₹${lastPayment.amount.toLocaleString('en-IN')}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: '11px', color: textSecondary, marginBottom: '3px' }}>{label}</p>
                      {label === t('flat') ? (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.08)',
                            color: '#f97316',
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid rgba(249, 115, 22, 0.2)',
                            marginTop: '2px'
                          }}
                        >
                          {value}
                        </span>
                      ) : (
                        <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>{value}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
                  <button
                    onClick={() => handleDownloadReceipt(lastPayment)}
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

          {/* Payment History Card with Yearly & Monthly Filter and Matrix View */}
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: cardShadow }}>
            {/* Header Toolbar */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${borderColor}`,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} style={{ color: '#f97316' }} />
                  {t('history')}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    color: '#f97316',
                    borderRadius: '16px',
                  }}
                >
                  {filteredPayments.length} of {ownerPayments.length} records
                </span>
              </div>

              {/* Filters and View Mode Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Year Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: textSecondary }}>Year:</span>
                  <select
                    value={historyYear}
                    onChange={(e) => {
                      setHistoryYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input-field text-xs font-bold cursor-pointer"
                    style={{ padding: '4px 10px', height: '32px', minWidth: '95px', width: 'auto' }}
                  >
                    <option value="all">All Years</option>
                    {availableHistoryYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: textSecondary }}>Month:</span>
                  <select
                    value={historyMonth}
                    onChange={(e) => {
                      setHistoryMonth(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input-field text-xs font-semibold cursor-pointer"
                    style={{ padding: '4px 10px', height: '32px', minWidth: '105px', width: 'auto' }}
                  >
                    <option value="all">{t('allMonths')}</option>
                    {[
                      { val: '1', name: 'Jan' }, { val: '2', name: 'Feb' }, { val: '3', name: 'Mar' },
                      { val: '4', name: 'Apr' }, { val: '5', name: 'May' }, { val: '6', name: 'Jun' },
                      { val: '7', name: 'Jul' }, { val: '8', name: 'Aug' }, { val: '9', name: 'Sep' },
                      { val: '10', name: 'Oct' }, { val: '11', name: 'Nov' }, { val: '12', name: 'Dec' },
                    ].map((m) => (
                      <option key={m.val} value={m.val}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* View Switcher (List vs Matrix) */}
                <div
                  className="flex p-0.5 rounded-lg border"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f6f8',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setHistoryViewMode('list')}
                    title="List View"
                    style={{
                      padding: '5px 9px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: historyViewMode === 'list' ? '#f97316' : 'transparent',
                      color: historyViewMode === 'list' ? '#ffffff' : textSecondary,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <List size={13} />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryViewMode('matrix')}
                    title="12-Month Matrix"
                    style={{
                      padding: '5px 9px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: historyViewMode === 'matrix' ? '#f97316' : 'transparent',
                      color: historyViewMode === 'matrix' ? '#ffffff' : textSecondary,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <LayoutGrid size={13} />
                    <span>12-Month Ledger</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Resident Financial Snapshot Bar */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                borderBottom: `1px solid ${borderColor}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <p style={{ fontSize: '10px', color: textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                  Filtered Paid
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>
                  ₹{(historyStats?.totalCollected || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                  {targetMatrixYear} Paid
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginTop: '2px' }}>
                  {historyStats.monthsPaidInYear} / 12 Months
                </p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                  {targetMatrixYear} Pending Dues
                </p>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: historyStats.totalDuesInYear > 0 ? '#ff5630' : '#22c55e',
                    marginTop: '2px',
                  }}
                >
                  {historyStats.totalDuesInYear > 0
                    ? `₹${(historyStats.totalDuesInYear || 0).toLocaleString('en-IN')}`
                    : 'All Clear'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                  Standard Rate
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: textSecondary, marginTop: '2px' }}>
                  ₹{(standardMonthlyRate).toLocaleString('en-IN')}/mo
                </p>
              </div>
            </div>

            {/* 12-MONTH MATRIX VIEW */}
            {historyViewMode === 'matrix' ? (
              <div style={{ padding: '20px' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} style={{ color: '#f97316' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                      Annual {targetMatrixYear} Monthly Ledger for Flat {owner?.flat ?? ''}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: textSecondary }}>
                    {historyStats.monthsPaidInYear} Cleared • {historyStats.monthsPendingInYear} Pending
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {monthsMatrix.map((m) => {
                    const isSelectedInFilter = historyMonth === String(m.monthIndex + 1);
                    return (
                      <div
                        key={m.monthKey}
                        className="p-3 rounded-xl border flex flex-col justify-between transition-all"
                        style={{
                          backgroundColor: isDark
                            ? isSelectedInFilter
                              ? 'rgba(249, 115, 22, 0.12)'
                              : 'rgba(255,255,255,0.02)'
                            : isSelectedInFilter
                              ? 'rgba(249, 115, 22, 0.06)'
                              : '#ffffff',
                          borderColor: isSelectedInFilter
                            ? '#f97316'
                            : m.isPaid
                              ? isDark
                                ? 'rgba(34, 197, 94, 0.25)'
                                : 'rgba(34, 197, 94, 0.3)'
                              : isDark
                                ? 'rgba(255, 86, 48, 0.2)'
                                : 'rgba(255, 86, 48, 0.25)',
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                              {m.monthName} {targetMatrixYear}
                            </span>
                            {m.isPaid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-green-500/15 text-green-500">
                                <CheckCircle2 size={11} />
                                PAID
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">
                                <AlertCircle size={11} />
                                {m.isFuture ? 'UPCOMING' : 'PENDING'}
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '14px', fontWeight: 800, color: m.isPaid ? '#22c55e' : textSecondary }}>
                            ₹{(m.amount || 0).toLocaleString('en-IN')}
                          </p>

                          {m.isPaid && m.payment ? (
                            <p style={{ fontSize: '11px', color: textSecondary, marginTop: '4px' }}>
                              <span style={{ color: '#f97316', fontWeight: 600 }}>{m.payment.receiptNumber || 'Paid'}</span>
                              {m.payment.paidOn && !isNaN(new Date(m.payment.paidOn).getTime()) && (
                                <span className="block text-[10px] opacity-75">
                                  {format(new Date(m.payment.paidOn), 'dd MMM yyyy')}
                                </span>
                              )}
                            </p>
                          ) : (
                            <p style={{ fontSize: '11px', color: '#ff5630', marginTop: '4px' }}>
                              {m.isFuture ? 'Not due yet' : 'Dues outstanding'}
                            </p>
                          )}
                        </div>

                        {/* Quick action button inside matrix tile */}
                        <div className="mt-3 pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8' }}>
                          {m.isPaid && m.payment ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDownloadReceipt(m.payment!)}
                                title="Download Receipt"
                                className="flex-1 py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1"
                                style={{
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f6f8',
                                  color: textSecondary,
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <Download size={11} />
                                PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => sendWhatsApp(m.payment!)}
                                title="WhatsApp"
                                className="py-1 px-2 text-[11px] font-bold rounded flex items-center justify-center"
                                style={{
                                  backgroundColor: 'rgba(37,211,102,0.1)',
                                  color: '#25D366',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <WhatsAppBrandIcon size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectMonthToPay(m.monthKey)}
                              className="w-full py-1 text-[11px] font-bold rounded text-orange-500 hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/15 transition-all text-center"
                            >
                              Pay This Month
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* LIST VIEW (Table of filtered receipts) */
              <>
                {filteredPayments.length === 0 ? (
                  <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(249, 115, 22, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 14px',
                      }}
                    >
                      <FileText size={24} style={{ color: '#f97316' }} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                      {ownerPayments.length === 0 ? t('noHistory') : 'No records match selected period'}
                    </p>
                    <p style={{ fontSize: '13px', color: textSecondary, marginTop: '4px' }}>
                      {ownerPayments.length === 0
                        ? 'Mark a payment to see it here.'
                        : `No payment found for Year: ${historyYear === 'all' ? 'All' : historyYear}, Month: ${historyMonth === 'all' ? 'All' : historyMonth}.`}
                    </p>
                    {ownerPayments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryYear('all');
                          setHistoryMonth('all');
                          setCurrentPage(1);
                        }}
                        className="btn-primary mt-4 text-xs"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
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
                              <td className="table-td" style={{ whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                {payment.month}
                              </td>
                              <td className="table-td" style={{ fontWeight: 700, whiteSpace: 'nowrap', color: '#22c55e' }}>
                                ₹{payment.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="table-td" style={{ color: textSecondary, whiteSpace: 'nowrap' }}>
                                {payment.paidOn ? format(new Date(payment.paidOn), 'dd MMM yyyy') : 'Pending'}
                              </td>
                              <td className="table-td">
                                <div
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleDownloadReceipt(payment)}
                                    title={t('downloadReceipt')}
                                    disabled={payment.status !== 'paid'}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      cursor: payment.status !== 'paid' ? 'not-allowed' : 'pointer',
                                      color: payment.status !== 'paid' ? '#c4cdd5' : '#919eab',
                                      opacity: payment.status !== 'paid' ? 0.4 : 1,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (payment.status === 'paid') {
                                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22,0.1)';
                                        e.currentTarget.style.color = '#f97316';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (payment.status === 'paid') {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#919eab';
                                      }
                                    }}
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => sendWhatsApp(payment)}
                                    title={t('sendViaWhatsapp')}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      color: '#919eab',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(37,211,102,0.1)';
                                      e.currentTarget.style.color = '#25D366';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = '#919eab';
                                    }}
                                  >
                                    <WhatsAppBrandIcon size={14} />
                                  </button>
                                  <button
                                    onClick={() => setEditingPayment(payment)}
                                    title={t('edit')}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      color: '#919eab',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22,0.1)';
                                      e.currentTarget.style.color = '#f97316';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = '#919eab';
                                    }}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  {payment.status === 'paid' && (
                                    <button
                                      onClick={() => {
                                        setReceiptToDelete(payment.id);
                                        setShowDeleteReceiptModal(true);
                                      }}
                                      title="Delete Receipt"
                                      style={{
                                        padding: '6px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        color: '#919eab',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,171,0,0.1)';
                                        e.currentTarget.style.color = '#ffab00';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#919eab';
                                      }}
                                    >
                                      <FileText size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setPaymentToDelete(payment.id);
                                      setShowDeletePaymentModal(true);
                                    }}
                                    title={t('delete')}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      color: '#919eab',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(255,86,48,0.1)';
                                      e.currentTarget.style.color = '#ff5630';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = '#919eab';
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                              borderTop: `1px solid ${borderColor}`,
                              fontWeight: 700,
                            }}
                          >
                            <td className="table-td" colSpan={2} style={{ color: textPrimary }}>
                              Filtered Total ({filteredPayments.length} records)
                            </td>
                            <td className="table-td" style={{ color: '#22c55e', fontWeight: 800 }}>
                              ₹{(historyStats?.totalCollected || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="table-td" colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div
                        style={{
                          padding: '12px 20px',
                          borderTop: `1px solid ${borderColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <p style={{ fontSize: '12px', color: textSecondary }}>
                          Page {currentPage} of {totalPages}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              color: textSecondary,
                              opacity: currentPage === 1 ? 0.3 : 1,
                            }}
                          >
                            <ChevronLeft size={15} />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700,
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
                              padding: '6px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              color: textSecondary,
                              opacity: currentPage === totalPages ? 0.3 : 1,
                            }}
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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

      <Modal
        isOpen={showDeleteReceiptModal}
        onClose={() => { setShowDeleteReceiptModal(false); setReceiptToDelete(null); }}
        onConfirm={handleDeleteReceipt}
        title="Delete Receipt"
        message="Are you sure you want to delete this receipt? The payment will be reset to PENDING and can be re-recorded."
        confirmLabel="Delete Receipt"
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
                value={editingPayment.paidOn ? format(new Date(editingPayment.paidOn), 'yyyy-MM-dd') : ''}
                onChange={(e) => setEditingPayment({ ...editingPayment, paidOn: e.target.value ? new Date(e.target.value).toISOString() : '' })}
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
                  { label: 'Status', value: selectedPayment.status === 'paid' ? 'Paid' : 'Pending', isBadge: true, mono: false },
                  { label: 'Amount', value: `₹${selectedPayment.amount.toLocaleString('en-IN')}`, bold: true, mono: false },
                  { label: 'Period', value: selectedPayment.month, mono: false },
                  { label: 'Paid On', value: selectedPayment.paidOn ? format(new Date(selectedPayment.paidOn), 'dd MMMM yyyy') : 'Pending', mono: false },
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
                onClick={() => handleDownloadReceipt(selectedPayment)}
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
