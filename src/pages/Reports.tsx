import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  Search,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Receipt,
  Building2,
  Store,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useStore, type Payment, type Expense, getCoveredMonthsForPayment, isShopUnit } from '../store/useStore';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { ReceiptService } from '../api/receipt.service';
import { generateReceiptPDF } from '../utils/pdf';

const EXPENSE_CATEGORIES = [
  'All',
  'Maintenance & Repair',
  'Cleaning & Housekeeping',
  'Security',
  'Electricity',
  'Water',
  'Garden & Landscaping',
  'Administrative',
  'Festival & Events',
  'Other',
];

export const getCategoryBadgeStyle = (category: string, isDark: boolean) => {
  switch (category) {
    case 'Maintenance & Repair':
      return {
        bg: isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.09)',
        color: '#f97316',
        border: isDark ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(249,115,22,0.25)',
      };
    case 'Security':
      return {
        bg: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.09)',
        color: isDark ? '#c084fc' : '#9333ea',
        border: isDark ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(168,85,247,0.25)',
      };
    case 'Electricity':
      return {
        bg: isDark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.1)',
        color: isDark ? '#facc15' : '#ca8a04',
        border: isDark ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(234,179,8,0.25)',
      };
    case 'Water':
      return {
        bg: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.09)',
        color: isDark ? '#38bdf8' : '#0284c7',
        border: isDark ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(14,165,233,0.25)',
      };
    case 'Cleaning & Housekeeping':
      return {
        bg: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.09)',
        color: isDark ? '#4ade80' : '#16a34a',
        border: isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(34,197,94,0.25)',
      };
    case 'Festival & Events':
      return {
        bg: isDark ? 'rgba(244,63,94,0.15)' : 'rgba(244,63,94,0.09)',
        color: isDark ? '#fb7185' : '#e11d48',
        border: isDark ? '1px solid rgba(244,63,94,0.3)' : '1px solid rgba(244,63,94,0.25)',
      };
    case 'Garden & Landscaping':
      return {
        bg: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.09)',
        color: isDark ? '#2dd4bf' : '#0d9488',
        border: isDark ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(20,184,166,0.25)',
      };
    case 'Administrative':
      return {
        bg: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.09)',
        color: isDark ? '#818cf8' : '#4f46e5',
        border: isDark ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.25)',
      };
    default:
      return {
        bg: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.1)',
        color: isDark ? '#cbd5e1' : '#475569',
        border: isDark ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(148,163,184,0.25)',
      };
  }
};

export default function Reports() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const societyName = useStore((state) => state.societyName);
  const owners = useStore((state) => state.owners);
  const payments = useStore((state) => state.payments);
  const expenses = useStore((state) => state.expenses);

  const fetchOwners = useStore((state) => state.fetchOwners);
  const fetchPayments = useStore((state) => state.fetchPayments);
  const fetchExpenses = useStore((state) => state.fetchExpenses);

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';

  useEffect(() => {
    const loadData = async () => {
      await fetchOwners();
      await fetchPayments();
      await fetchExpenses();
    };
    loadData();
  }, [fetchOwners, fetchPayments, fetchExpenses]);

  // Current date
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-based

  // Available Years - dynamically include all years from payments, expenses & defaults
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear, currentYear - 1, currentYear + 1]);
    payments.forEach((p) => {
      if (p.fromDate) {
        const y = parseInt(p.fromDate.split('-')[0], 10);
        if (!isNaN(y)) years.add(y);
      }
      if (p.toDate) {
        const y = parseInt(p.toDate.split('-')[0], 10);
        if (!isNaN(y)) years.add(y);
      }
      if (p.paidOn) {
        const y = new Date(p.paidOn).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
      if (p.month) {
        const matches = p.month.match(/\d{4}/g);
        if (matches) matches.forEach((m) => years.add(parseInt(m, 10)));
      }
    });
    expenses.forEach((e) => {
      if (e.date) {
        const y = new Date(e.date).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, payments, expenses]);

  // Determine latest year that actually has payments or expenses recorded
  const recordedDataYear = useMemo(() => {
    const yearsWithData: number[] = [];
    payments.forEach((p) => {
      if (p.fromDate) {
        const y = parseInt(p.fromDate.split('-')[0], 10);
        if (!isNaN(y)) yearsWithData.push(y);
      }
      if (p.paidOn) {
        const y = new Date(p.paidOn).getFullYear();
        if (!isNaN(y)) yearsWithData.push(y);
      }
    });
    if (yearsWithData.length > 0) {
      yearsWithData.sort((a, b) => b - a);
      return yearsWithData[0];
    }
    return currentYear;
  }, [payments, currentYear]);

  // Primary page filter state - Calendar Year (January to December)
  const [selectedBaseYear, setSelectedBaseYear] = useState<number>(currentYear);
  const [hasUserChangedYear, setHasUserChangedYear] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '0' - '11'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null);
  const { toast } = useToast();
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<string | null>(null);

  // Download single receipt with backend API and client jsPDF fallback
  const handleDownloadReceipt = async (p: Payment, ownerObj?: (typeof owners)[0]) => {
    if (p.status && p.status.toLowerCase() === 'pending') {
      toast('No receipt available – payment is pending.', 'error');
      return;
    }
    const pid = String(p.id);
    setDownloadingPaymentId(pid);
    toast('Downloading receipt...', 'info');

    try {
      // 1. Attempt to fetch receipt from server
      const receipt = await ReceiptService.getReceiptByMaintenance(Number(p.id));
      await ReceiptService.downloadReceiptPdf(receipt.id);
      toast('Receipt downloaded successfully.', 'success');
    } catch {
      // 2. Fallback to client-side jsPDF generator
      const targetOwner = ownerObj || owners.find((o) => String(o.id) === String(p.ownerId));
      if (targetOwner) {
        try {
          generateReceiptPDF(p, targetOwner, societyName || 'Co-operative Housing Society');
          toast('Receipt generated & downloaded.', 'success');
        } catch {
          toast('Failed to download receipt.', 'error');
        }
      } else {
        toast('Receipt not found on server.', 'error');
      }
    } finally {
      setDownloadingPaymentId(null);
    }
  };

  // Download all receipts for an owner
  const handleDownloadAllReceipts = async (paymentsList: Payment[], ownerObj: (typeof owners)[0]) => {
    if (paymentsList.length === 0) return;
    toast(`Downloading ${paymentsList.length} receipt(s)...`, 'info');
    for (let i = 0; i < paymentsList.length; i++) {
      const p = paymentsList[i];
      await handleDownloadReceipt(p, ownerObj);
      if (i < paymentsList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  };

  // If initial load finishes and payments exist in a previous year (e.g. 2025), default to that year
  useEffect(() => {
    if (!hasUserChangedYear && recordedDataYear && recordedDataYear !== currentYear) {
      setSelectedBaseYear(recordedDataYear);
    }
  }, [recordedDataYear, hasUserChangedYear, currentYear]);

  // Member Payment Ledger Table State
  const [ledgerRangeMode, setLedgerRangeMode] = useState<'yearly' | 'monthly'>('yearly');
  const [ledgerMonth, setLedgerMonth] = useState<string>(String(currentMonthIdx));

  // Expense Table State
  const [expenseRangeMode, setExpenseRangeMode] = useState<'yearly' | 'monthly'>('yearly');
  const [expenseMonth, setExpenseMonth] = useState<string>(String(currentMonthIdx));
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('All');
  const [expenseSortOrder, setExpenseSortOrder] = useState<'desc' | 'asc'>('desc');

  // Print & Export Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printRangeMode, setPrintRangeMode] = useState<'yearly' | 'custom'>('yearly');
  const [printBaseYear, setPrintBaseYear] = useState<number>(currentYear);
  const [customFromMonth, setCustomFromMonth] = useState<string>(
    `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`
  );
  const [customToMonth, setCustomToMonth] = useState<string>(
    `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`
  );
  const [includeMemberLedger, setIncludeMemberLedger] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);

  // Helper: compute start & end Date for calendar year (Jan 1 to Dec 31) or a specific month
  const getPeriodInterval = (baseYear: number, monthVal: string) => {
    if (monthVal === 'all') {
      const start = startOfMonth(new Date(baseYear, 0, 1));
      const end = endOfMonth(new Date(baseYear, 11, 1));
      return { start, end };
    }
    const mIdx = parseInt(monthVal, 10);
    const start = startOfMonth(new Date(baseYear, mIdx, 1));
    const end = endOfMonth(new Date(baseYear, mIdx, 1));
    return { start, end };
  };

  // Helper: check if a payment overlaps with interval
  const isPaymentInInterval = (payment: Payment, start: Date, end: Date) => {
    // If explicitly marked pending, do not include
    if (payment.status && payment.status.toLowerCase() === 'pending') return false;

    // 1. If explicit fromDate / toDate exist (yyyy-MM-dd format)
    if (payment.fromDate) {
      const fromParts = payment.fromDate.split('-').map(Number);
      const pFrom = fromParts.length >= 2
        ? startOfMonth(new Date(fromParts[0], fromParts[1] - 1, 1))
        : new Date(payment.fromDate + 'T00:00:00');

      let pTo: Date;
      if (payment.toDate) {
        const toParts = payment.toDate.split('-').map(Number);
        pTo = toParts.length >= 2
          ? endOfMonth(new Date(toParts[0], toParts[1] - 1, 1))
          : new Date(payment.toDate + 'T23:59:59');
      } else {
        pTo = endOfMonth(pFrom);
      }

      if (!isNaN(pFrom.getTime()) && !isNaN(pTo.getTime())) {
        if (pFrom <= end && pTo >= start) return true;
      }
    }

    // 2. Fallback to month string parsing (e.g. "January 2025" or "Apr 2025 - Jun 2025")
    if (payment.month && payment.month !== 'Maintenance') {
      const parts = payment.month.split(/\s*[-–]\s*/);
      const pStart = startOfMonth(new Date(parts[0]));
      const pEnd = parts.length === 2 ? endOfMonth(new Date(parts[1])) : endOfMonth(pStart);
      if (!isNaN(pStart.getTime()) && !isNaN(pEnd.getTime())) {
        if (pStart <= end && pEnd >= start) return true;
      }
    }

    // 3. Fallback to covered months
    const owner = owners.find((o) => String(o.id) === String(payment.ownerId));
    const isShop = isShopUnit(owner?.flat);
    const standardRate = isShop ? 200 : (owner?.monthlyAmount || 500);
    const covered = getCoveredMonthsForPayment(payment, standardRate);
    if (covered.length > 0) {
      if (covered.some((d) => d <= end && endOfMonth(d) >= start)) return true;
    }

    // 4. Fallback to paidOn date
    if (payment.paidOn) {
      const pDate = new Date(payment.paidOn);
      if (!isNaN(pDate.getTime())) {
        if (isWithinInterval(pDate, { start, end })) return true;
      }
    }

    return false;
  };

  // Helper: check if expense is in interval
  const isExpenseInInterval = (expense: Expense, start: Date, end: Date) => {
    if (!expense.date) return false;
    const eDate = parseISO(expense.date);
    if (isNaN(eDate.getTime())) return false;
    return isWithinInterval(eDate, { start, end });
  };

  // Active interval for on-screen dashboard view
  const activeInterval = useMemo(() => {
    return getPeriodInterval(selectedBaseYear, selectedMonth);
  }, [selectedBaseYear, selectedMonth]);

  // Months list for the selected year (Calendar Year: January to December)
  const yearMonths = useMemo(() => {
    const list: { label: string; value: string; year: number; monthIdx: number }[] = [];
    for (let m = 0; m <= 11; m++) {
      const d = new Date(selectedBaseYear, m, 1);
      list.push({ label: format(d, 'MMMM yyyy'), value: String(m), year: selectedBaseYear, monthIdx: m });
    }
    return list;
  }, [selectedBaseYear]);

  // Filtered Payments & Expenses for Active On-Screen View
  const periodPayments = useMemo(() => {
    return payments.filter((p) => isPaymentInInterval(p, activeInterval.start, activeInterval.end));
  }, [payments, activeInterval]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => isExpenseInInterval(e, activeInterval.start, activeInterval.end));
  }, [expenses, activeInterval]);

  // Overall Financial Stats
  const financialStats = useMemo(() => {
    const totalCollected = periodPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netBalance = totalCollected - totalExpenses;

    // Monthly comparisons
    const currentMonthInterval = {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
    const currentMonthCollected = payments
      .filter((p) => isPaymentInInterval(p, currentMonthInterval.start, currentMonthInterval.end))
      .reduce((acc, p) => acc + p.amount, 0);

    const currentMonthExpenses = expenses
      .filter((e) => isExpenseInInterval(e, currentMonthInterval.start, currentMonthInterval.end))
      .reduce((acc, e) => acc + e.amount, 0);

    return {
      totalCollected,
      totalExpenses,
      netBalance,
      currentMonthCollected,
      currentMonthExpenses,
    };
  }, [periodPayments, periodExpenses, payments, expenses, now]);

  // Table 1: Member Ledger Interval & Payments
  const ledgerInterval = useMemo(() => {
    const monthVal = selectedMonth !== 'all' ? selectedMonth : (ledgerRangeMode === 'yearly' ? 'all' : ledgerMonth);
    return getPeriodInterval(selectedBaseYear, monthVal);
  }, [selectedBaseYear, selectedMonth, ledgerRangeMode, ledgerMonth]);

  const ledgerPayments = useMemo(() => {
    return payments.filter((p) => isPaymentInInterval(p, ledgerInterval.start, ledgerInterval.end));
  }, [payments, ledgerInterval, isPaymentInInterval]);

  // Member Payment Ledger (STRICTLY ONLY PEOPLE WHO PAID)
  const memberLedger = useMemo(() => {
    return owners
      .map((owner) => {
        const ownerPayments = ledgerPayments.filter((p) => String(p.ownerId) === String(owner.id));
        const totalPaid = ownerPayments.reduce((acc, p) => acc + p.amount, 0);

        const monthsCovered = ownerPayments
          .map((p) => p.month)
          .filter(Boolean)
          .join(', ');

        return {
          owner,
          totalPaid,
          monthsCovered: monthsCovered || 'Maintenance',
          payments: ownerPayments,
        };
      })
      .filter((m) => m.totalPaid > 0); // Only show people who actually paid!
  }, [owners, ledgerPayments]);

  const ledgerTotalCollected = useMemo(() => {
    return memberLedger.reduce((sum, m) => sum + m.totalPaid, 0);
  }, [memberLedger]);

  const filteredMembers = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return memberLedger.filter(
      (m) =>
        m.owner.name.toLowerCase().includes(s) ||
        m.owner.flat.toLowerCase().includes(s) ||
        (m.owner.nameMr && m.owner.nameMr.toLowerCase().includes(s)) ||
        (m.owner.phone && m.owner.phone.includes(s))
    );
  }, [memberLedger, searchTerm]);

  // Table 2: Expense Table Interval & Filtered List
  const expenseTableInterval = useMemo(() => {
    const monthVal = selectedMonth !== 'all' ? selectedMonth : (expenseRangeMode === 'yearly' ? 'all' : expenseMonth);
    return getPeriodInterval(selectedBaseYear, monthVal);
  }, [selectedBaseYear, selectedMonth, expenseRangeMode, expenseMonth]);

  const filteredTableExpenses = useMemo(() => {
    const list = expenses.filter((e) => isExpenseInInterval(e, expenseTableInterval.start, expenseTableInterval.end));
    return list
      .filter((e) => {
        const matchesCat = expenseCategory === 'All' || e.category === expenseCategory;
        const s = expenseSearch.toLowerCase();
        const matchesSearch =
          !s ||
          e.title.toLowerCase().includes(s) ||
          e.paidTo.toLowerCase().includes(s) ||
          (e.note && e.note.toLowerCase().includes(s));
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return expenseSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [expenses, expenseTableInterval, expenseCategory, expenseSearch, expenseSortOrder]);

  const tableExpenseTotal = useMemo(() => {
    return filteredTableExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredTableExpenses]);

  // Interval calculation for Print Mode
  const printInterval = useMemo(() => {
    if (printRangeMode === 'yearly') {
      return getPeriodInterval(printBaseYear, 'all');
    } else {
      const [fY, fM] = customFromMonth.split('-').map(Number);
      const [tY, tM] = customToMonth.split('-').map(Number);
      const start = startOfMonth(new Date(fY, fM - 1, 1));
      const end = endOfMonth(new Date(tY, tM - 1, 1));
      return { start, end };
    }
  }, [printRangeMode, printBaseYear, customFromMonth, customToMonth]);

  // Period label for print report
  const printPeriodLabel = useMemo(() => {
    if (printRangeMode === 'yearly') {
      return `Calendar Year: January ${printBaseYear} - December ${printBaseYear}`;
    } else {
      const [fY, fM] = customFromMonth.split('-').map(Number);
      const [tY, tM] = customToMonth.split('-').map(Number);
      const start = new Date(fY, fM - 1, 1);
      const end = new Date(tY, tM - 1, 1);
      return `${format(start, 'MMMM yyyy')} - ${format(end, 'MMMM yyyy')}`;
    }
  }, [printRangeMode, printBaseYear, customFromMonth, customToMonth]);

  // Print Data Calculations
  const printPayments = useMemo(() => {
    return payments.filter((p) => isPaymentInInterval(p, printInterval.start, printInterval.end));
  }, [payments, printInterval, isPaymentInInterval]);

  const printExpenses = useMemo(() => {
    return expenses.filter((e) => isExpenseInInterval(e, printInterval.start, printInterval.end));
  }, [expenses, printInterval]);

  const printTotalCollected = useMemo(() => {
    return printPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [printPayments]);

  const printTotalExpenses = useMemo(() => {
    return printExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [printExpenses]);

  const printNetBalance = printTotalCollected - printTotalExpenses;

  // Print Member Ledger  only members who have paid at least something
  const printMemberLedger = useMemo(() => {
    return owners
      .map((owner) => {
        const oPayments = printPayments.filter((p) => String(p.ownerId) === String(owner.id));
        const totalPaid = oPayments.reduce((acc, p) => acc + p.amount, 0);

        const monthsCovered = oPayments
          .map((p) => p.month)
          .filter(Boolean)
          .join(', ');

        const receiptNumbers = oPayments.map((p) => p.receiptNumber).filter(Boolean).join(', ');
        return {
          owner,
          totalPaid,
          monthsCovered: monthsCovered || '',
          receiptNumbers: receiptNumbers || '',
          paymentsCount: oPayments.length,
          payments: oPayments,
        };
      })
      .filter((m) => m.totalPaid > 0); // Only show members who paid
  }, [owners, printPayments]);

  // Execute Print
  const handleTriggerPrint = () => {
    setIsPrintModalOpen(false);
    const htmlEl = document.documentElement;
    const hadDark = htmlEl.classList.contains('dark');

    // Temporarily switch to light mode during printing so print preview is 100% clean white paper
    if (hadDark) {
      htmlEl.classList.remove('dark');
    }

    let restored = false;
    const restoreDark = () => {
      if (hadDark && !restored) {
        restored = true;
        htmlEl.classList.add('dark');
      }
      window.removeEventListener('afterprint', restoreDark);
    };

    window.addEventListener('afterprint', restoreDark);

    // Give browser 250ms to close the modal and update DOM before opening print dialog
    setTimeout(() => {
      window.print();
      // Fallback timeout in case afterprint does not fire in some desktop/mobile browsers
      setTimeout(restoreDark, 2000);
    }, 250);
  };

  // CSV Export Function
  const handleExportCSV = () => {
    const headers = ['Flat Number', 'Owner Name', 'Total Paid (INR)', 'Months Covered', 'Receipts'];
    const rows = printMemberLedger.map((m) => [
      `"${m.owner.flat}"`,
      `"${m.owner.name}${m.owner.nameMr ? ` (${m.owner.nameMr})` : ''}"`,
      m.totalPaid,
      `"${m.monthsCovered}"`,
      `"${printPayments.filter((p) => p.ownerId === m.owner.id).map((p) => p.receiptNumber).filter(Boolean).join('; ')}"`,
    ]);

    const csvContent = [
      `"Society: ${societyName}"`,
      `"Report: Annual Calendar Year Financial & Maintenance Ledger"`,
      `"Period: ${printPeriodLabel}"`,
      `"Total Collected: INR ${printTotalCollected}"`,
      `"Total Expenses: INR ${printTotalExpenses}"`,
      `"Net Balance: INR ${printNetBalance}"`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Society_Financial_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsPrintModalOpen(false);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* ========================================================
          SCREEN VIEW: Header & Print Trigger
          ======================================================== */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary }}>
              {t('reports')}
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                color: '#f97316',
              }}
            >
              Audited
            </span>
          </div>
          <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>
            {t('yearlyAndMonthlySummary')}
          </p>
        </div>

        {/* PRINT BUTTON ON THE RIGHT SIDE OF SCREEN */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            id="btn-print-report"
            onClick={() => setIsPrintModalOpen(true)}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 shadow-md hover:shadow-lg transition-all"
            style={{ fontSize: '14px', borderRadius: '10px', touchAction: 'manipulation' }}
          >
            <Printer size={18} />
            <span>{t('printReport')}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SCREEN VIEW: Filter Controls Toolbar
          ======================================================== */}
      <div
        className="no-print p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        style={{
          backgroundColor: cardBg,
          boxShadow: isDark
            ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
            : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
        }}
      >
        <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Year Dropdown */}
            <select
              value={selectedBaseYear}
              onChange={(e) => {
                setHasUserChangedYear(true);
                setSelectedBaseYear(Number(e.target.value));
              }}
              className="input-field cursor-pointer flex-1 sm:w-auto"
              style={{
                padding: '7px 10px',
                fontSize: '13px',
                fontWeight: 700,
                minWidth: '120px',
              }}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            {/* Month Dropdown Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field cursor-pointer flex-1 sm:w-auto"
              style={{
                padding: '7px 10px',
                fontSize: '13px',
                fontWeight: 600,
                minWidth: '130px',
              }}
            >
              <option value="all">{t('allMonths')}</option>
              {yearMonths.map((ym) => (
                <option key={ym.value} value={ym.value}>
                  {ym.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Active Label */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 self-start sm:self-auto">
          <Calendar size={14} />
          <span>
            Year {selectedBaseYear}
            {selectedMonth !== 'all' && ` • ${yearMonths.find((m) => m.value === selectedMonth)?.label}`}
          </span>
        </div>
      </div>

      {/* ========================================================
          SCREEN VIEW: Top Financial KPI Summary Cards
          ======================================================== */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Yearly / Period Collections */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: isDark
              ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
              : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', fontWeight: 600, color: textSecondary }}>
              {selectedMonth === 'all' ? t('yearlyCollection') : t('monthlyCollection')}
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} style={{ color: '#22c55e' }} />
            </div>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, marginTop: '12px' }}>
            ₹{financialStats.totalCollected.toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>
            {periodPayments.length} maintenance receipts
          </p>
        </div>

        {/* Card 2: Yearly / Period Expenses */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: isDark
              ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
              : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', fontWeight: 600, color: textSecondary }}>
              {selectedMonth === 'all' ? t('yearlyExpense') : t('monthlyExpense')}
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingDown size={18} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, marginTop: '12px' }}>
            ₹{financialStats.totalExpenses.toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>
            {periodExpenses.length} society expense vouchers
          </p>
        </div>

        {/* Card 3: Net Balance (Surplus / Deficit) */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: isDark
              ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
              : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', fontWeight: 600, color: textSecondary }}>
              {t('netBalance')} (Surplus)
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor:
                  financialStats.netBalance >= 0 ? 'rgba(0, 184, 217, 0.12)' : 'rgba(255, 86, 48, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IndianRupee
                size={18}
                style={{ color: financialStats.netBalance >= 0 ? '#00b8d9' : '#ff5630' }}
              />
            </div>
          </div>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: financialStats.netBalance >= 0 ? textPrimary : '#ff5630',
              marginTop: '12px',
            }}
          >
            ₹{financialStats.netBalance.toLocaleString('en-IN')}
          </p>
          <p
            style={{
              fontSize: '11px',
              color: financialStats.netBalance >= 0 ? '#00b8d9' : '#ff5630',
              marginTop: '4px',
              fontWeight: 600,
            }}
          >
            {financialStats.netBalance >= 0 ? 'Positive Reserve' : 'Deficit in Period'}
          </p>
        </div>

        {/* Card 4: Current Month Active Snapshot */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: isDark
              ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
              : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', fontWeight: 600, color: textSecondary }}>
              Current Month ({format(now, 'MMM yyyy')})
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={18} style={{ color: '#f97316' }} />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: textSecondary }}>Collected:</span>
              <span className="font-bold text-green-500">
                ₹{financialStats.currentMonthCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: textSecondary }}>Expenses:</span>
              <span className="font-bold text-red-500">
                ₹{financialStats.currentMonthExpenses.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SCREEN VIEW: Member Payment Ledger (PAID MEMBERS ONLY)
          ======================================================== */}
      <div
        className="no-print rounded-xl overflow-hidden"
        style={{
          backgroundColor: cardBg,
          boxShadow: isDark
            ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
            : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          border: `1px solid ${borderColor}`,
        }}
      >
        <div className="p-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3" style={{ borderColor }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                {t('memberLedger')} (Paid Members Only)
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                {filteredMembers.length} Paid
              </span>
            </div>
            <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
              Showing only residents who paid maintenance for the selected period
            </p>
          </div>

          {/* Controls: Yearly/Monthly switch + Month Picker + Search */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Yearly / Monthly Toggle */}
            <div
              className="flex p-0.5 rounded-lg border text-xs shrink-0"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f6f8',
                borderColor,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setLedgerRangeMode('yearly');
                  setSelectedMonth('all');
                }}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  (selectedMonth === 'all' && ledgerRangeMode === 'yearly')
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Yearly
              </button>
              <button
                type="button"
                onClick={() => {
                  setLedgerRangeMode('monthly');
                  if (selectedMonth === 'all') setSelectedMonth(ledgerMonth);
                }}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  (selectedMonth !== 'all' || ledgerRangeMode === 'monthly')
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Month selector if Monthly */}
            {(selectedMonth !== 'all' || ledgerRangeMode === 'monthly') && (
              <select
                value={selectedMonth !== 'all' ? selectedMonth : ledgerMonth}
                onChange={(e) => {
                  setLedgerMonth(e.target.value);
                  setSelectedMonth(e.target.value);
                }}
                className="input-field text-xs font-semibold cursor-pointer shrink-0 !w-auto"
                style={{
                  height: '36px',
                  padding: '6px 28px 6px 12px',
                  lineHeight: 'normal',
                  minWidth: '130px',
                }}
              >
                {yearMonths.map((ym) => (
                  <option key={ym.value} value={ym.value}>
                    {ym.label}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-52 shrink-0">
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
              />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field text-xs"
                style={{ paddingLeft: '32px', height: '36px', lineHeight: 'normal' }}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                  borderBottom: `1px solid ${borderColor}`,
                  color: textSecondary,
                }}
              >
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '13%' }}>{t('flat')}</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '27%' }}>{t('owner')}</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '25%' }}>Period Covered</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-right" style={{ width: '15%' }}>{t('totalPaid')}</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-center" style={{ width: '20%' }}>{t('receipt')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm" style={{ color: textSecondary }}>
                    <Receipt size={32} className="mx-auto mb-2 opacity-40 text-orange-500" />
                    <p className="font-semibold">No payments recorded for this selected period</p>
                    <p className="text-xs opacity-75 mt-0.5">Only residents who paid in this timeframe are listed here.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map(({ owner, totalPaid, monthsCovered, payments: oPayments }) => {
                  const isExpanded = expandedOwnerId === owner.id;
                  const isShop = owner.flat.toLowerCase().includes('shop');
                  return (
                    <>
                      <tr
                        key={owner.id}
                        style={{
                          borderBottom: `1px solid ${borderColor}`,
                        }}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap tracking-wide"
                            style={{
                              backgroundColor: isShop
                                ? (isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.09)')
                                : (isDark ? 'rgba(56,189,248,0.14)' : 'rgba(14,165,233,0.08)'),
                              color: isShop ? '#f97316' : (isDark ? '#38bdf8' : '#0284c7'),
                              border: isShop
                                ? (isDark ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(249,115,22,0.25)')
                                : (isDark ? '1px solid rgba(56,189,248,0.28)' : '1px solid rgba(14,165,233,0.22)'),
                            }}
                          >
                            {isShop ? <Store size={12} className="shrink-0" /> : <Building2 size={12} className="shrink-0" />}
                            <span>{owner.flat}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[13.5px] leading-snug" style={{ color: textPrimary }}>
                            {owner.name}
                          </div>
                          {owner.nameMr && (
                            <div className="text-[11.5px] mt-0.5 font-normal opacity-75" style={{ color: textSecondary }}>
                              {owner.nameMr}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium max-w-full"
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}`,
                              color: textPrimary,
                            }}
                            title={monthsCovered}
                          >
                            <Calendar size={12} style={{ color: '#f97316', flexShrink: 0 }} />
                            <span className="truncate">
                              {monthsCovered.replace(/\s*[-–]\s*/g, ' – ') || 'Maintenance'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-md font-bold text-sm tracking-tight"
                            style={{
                              backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                              color: isDark ? '#4ade80' : '#15803d',
                              border: isDark ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(34,197,94,0.2)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            ₹{totalPaid.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div
                            className="inline-flex items-center justify-center rounded-lg border shadow-sm divide-x overflow-hidden whitespace-nowrap"
                            style={{
                              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
                              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                            }}
                          >
                            {/* Expand/Collapse Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setExpandedOwnerId(isExpanded ? null : owner.id)}
                              className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-orange-500/10 hover:text-orange-500"
                              style={{ color: isExpanded ? '#f97316' : textPrimary }}
                              title={isExpanded ? "Collapse receipts" : "View receipt breakdown"}
                            >
                              <Receipt size={13} style={{ color: isExpanded ? '#f97316' : '#919eab' }} />
                              <span>{oPayments.length} {oPayments.length === 1 ? 'Receipt' : 'Receipts'}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Direct Download Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (oPayments.length === 1) {
                                  handleDownloadReceipt(oPayments[0], owner);
                                } else {
                                  handleDownloadAllReceipts(oPayments, owner);
                                }
                              }}
                              disabled={downloadingPaymentId !== null}
                              className="px-2.5 py-1.5 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer hover:bg-orange-500 hover:text-white disabled:opacity-50"
                              style={{
                                backgroundColor: isDark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)',
                                color: '#f97316',
                              }}
                              title={oPayments.length === 1 ? "Download Receipt PDF" : `Download all ${oPayments.length} receipts`}
                            >
                              {downloadingPaymentId && oPayments.some((p) => String(p.id) === downloadingPaymentId) ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Download size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded History Details */}
                      {isExpanded && (
                        <tr
                          key={`expanded-${owner.id}`}
                          style={{
                            backgroundColor: isDark ? 'rgba(249,115,22,0.025)' : '#fdfaf8',
                            borderBottom: `1px solid ${borderColor}`,
                          }}
                        >
                          <td colSpan={5} className="p-4 sm:p-5">
                            <div className="pl-4 border-l-4 border-orange-500 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Receipt size={15} className="text-orange-500" />
                                  <span className="text-xs font-extrabold uppercase tracking-wider text-orange-500">
                                    Receipt Breakdown:
                                  </span>
                                  <span className="text-xs font-bold" style={{ color: textPrimary }}>
                                    {owner.name} ({owner.flat})
                                  </span>
                                </div>
                                {oPayments.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadAllReceipts(oPayments, owner)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer hover:shadow-sm hover:brightness-105"
                                    style={{
                                      borderColor: 'rgba(249,115,22,0.4)',
                                      backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed',
                                      color: '#f97316',
                                    }}
                                    title="Download all receipts for this member"
                                  >
                                    <Download size={13} />
                                    <span>Download All Receipts ({oPayments.length})</span>
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {oPayments.map((p) => {
                                  const isDownloading = downloadingPaymentId === String(p.id);
                                  return (
                                    <div
                                      key={p.id}
                                      className="p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
                                      style={{
                                        backgroundColor: cardBg,
                                        borderColor: isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0',
                                      }}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between font-bold">
                                          <span
                                            className="px-2 py-0.5 rounded font-mono font-bold text-xs"
                                            style={{
                                              backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed',
                                              color: '#f97316',
                                              border: '1px solid rgba(249,115,22,0.25)',
                                            }}
                                          >
                                            {p.receiptNumber || `RCP-${p.id}`}
                                          </span>
                                          <span className="font-extrabold text-sm" style={{ color: isDark ? '#4ade80' : '#15803d' }}>
                                            ₹{p.amount.toLocaleString('en-IN')}
                                          </span>
                                        </div>

                                        <div className="mt-2.5 flex items-center gap-1.5 font-semibold" style={{ color: textPrimary }}>
                                          <Calendar size={13} style={{ color: '#f97316', flexShrink: 0 }} />
                                          <span>{p.month}</span>
                                        </div>

                                        <div className="mt-1.5 flex items-center justify-between text-[11px]" style={{ color: textSecondary }}>
                                          <span>Date: {p.paidOn ? format(new Date(p.paidOn), 'dd MMM yyyy') : 'Recorded'}</span>
                                          {p.transactionId && (
                                            <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                                              UTR: {p.transactionId}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div
                                        className="mt-3 pt-2.5 border-t flex items-center justify-between"
                                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}
                                      >
                                        <span
                                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                          style={{
                                            backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
                                            color: '#16a34a',
                                          }}
                                        >
                                          {p.status || 'PAID'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadReceipt(p, owner)}
                                          disabled={isDownloading}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm hover:brightness-105 active:scale-95 disabled:opacity-50"
                                          style={{
                                            backgroundColor: '#f97316',
                                            color: '#ffffff',
                                          }}
                                          title="Download Receipt PDF"
                                        >
                                          {isDownloading ? (
                                            <>
                                              <Loader2 size={12} className="animate-spin" />
                                              <span>Downloading...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Download size={12} />
                                              <span>Download Receipt</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
            {filteredMembers.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    fontWeight: 800,
                  }}
                >
                  <td colSpan={3} className="py-3.5 px-4 font-bold text-sm" style={{ color: textPrimary }}>
                    <div className="flex items-center gap-2">
                      <span>Total:</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-extrabold"
                        style={{
                          backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed',
                          color: '#f97316',
                        }}
                      >
                        {filteredMembers.length} Members Paid
                      </span>
                      <span className="text-xs font-medium" style={{ color: textSecondary }}>
                        ({ledgerRangeMode === 'yearly' ? 'Whole Year' : 'Selected Month'})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md font-extrabold text-sm"
                      style={{
                        backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
                        color: isDark ? '#4ade80' : '#15803d',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ₹{ledgerTotalCollected.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                        color: textSecondary,
                      }}
                    >
                      <Receipt size={12} className="text-orange-500" />
                      <span>{filteredMembers.reduce((acc, m) => acc + m.payments.length, 0)} Total Receipts</span>
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================
          SCREEN VIEW: Society Operational Expenses Table
          ======================================================== */}
      <div
        className="no-print rounded-xl overflow-hidden"
        style={{
          backgroundColor: cardBg,
          boxShadow: isDark
            ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
            : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          border: `1px solid ${borderColor}`,
        }}
      >
        <div className="p-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3" style={{ borderColor }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                Society Operational Expenses
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                {filteredTableExpenses.length} Vouchers
              </span>
            </div>
            <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
              Itemized maintenance and society expenditure vouchers
            </p>
          </div>

          {/* Controls: Yearly/Monthly switch + Month Picker + Category + Search */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Yearly / Monthly Toggle */}
            <div
              className="flex p-0.5 rounded-lg border text-xs shrink-0"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f6f8',
                borderColor,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setExpenseRangeMode('yearly');
                  setSelectedMonth('all');
                }}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  (selectedMonth === 'all' && expenseRangeMode === 'yearly')
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Yearly
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpenseRangeMode('monthly');
                  if (selectedMonth === 'all') setSelectedMonth(expenseMonth);
                }}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  (selectedMonth !== 'all' || expenseRangeMode === 'monthly')
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Month selector if Monthly */}
            {(selectedMonth !== 'all' || expenseRangeMode === 'monthly') && (
              <select
                value={selectedMonth !== 'all' ? selectedMonth : expenseMonth}
                onChange={(e) => {
                  setExpenseMonth(e.target.value);
                  setSelectedMonth(e.target.value);
                }}
                className="input-field text-xs font-semibold cursor-pointer shrink-0 !w-auto"
                style={{
                  height: '36px',
                  padding: '6px 28px 6px 12px',
                  lineHeight: 'normal',
                  minWidth: '130px',
                }}
              >
                {yearMonths.map((ym) => (
                  <option key={ym.value} value={ym.value}>
                    {ym.label}
                  </option>
                ))}
              </select>
            )}

            {/* Category Dropdown */}
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="input-field text-xs font-semibold cursor-pointer shrink-0 !w-auto"
              style={{
                height: '36px',
                padding: '6px 28px 6px 12px',
                lineHeight: 'normal',
                minWidth: '140px',
              }}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-52 shrink-0">
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
              />
              <input
                type="text"
                placeholder="Search title, vendor..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="input-field text-xs"
                style={{ paddingLeft: '32px', height: '36px', lineHeight: 'normal' }}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                  borderBottom: `1px solid ${borderColor}`,
                  color: textSecondary,
                }}
              >
                <th
                  onClick={() => setExpenseSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer select-none group transition-colors hover:text-orange-500"
                  style={{ width: '16%' }}
                  title={`Date sorted ${expenseSortOrder === 'desc' ? 'Newest to Oldest (Descending)' : 'Oldest to Newest (Ascending)'}. Click to toggle.`}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>Date</span>
                    <span
                      className="p-1 rounded transition-colors"
                      style={{
                        backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed',
                        color: '#f97316',
                      }}
                    >
                      {expenseSortOrder === 'desc' ? (
                        <ArrowDown size={13} />
                      ) : (
                        <ArrowUp size={13} />
                      )}
                    </span>
                    <span className="text-[10px] font-normal lowercase tracking-normal text-zinc-400">
                      ({expenseSortOrder === 'desc' ? 'desc' : 'asc'})
                    </span>
                  </div>
                </th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '32%' }}>Title / Description</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '23%' }}>Category</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '15%' }}>Paid To</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-right" style={{ width: '15%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm" style={{ color: textSecondary }}>
                    <TrendingDown size={32} className="mx-auto mb-2 opacity-40 text-red-500" />
                    <p className="font-semibold">No expenses recorded for this selected period</p>
                    <p className="text-xs opacity-75 mt-0.5">Try changing the period filter or category above.</p>
                  </td>
                </tr>
              ) : (
                filteredTableExpenses.map((exp) => {
                  const badgeStyle = getCategoryBadgeStyle(exp.category, isDark);
                  return (
                    <tr
                      key={exp.id}
                      style={{
                        borderBottom: `1px solid ${borderColor}`,
                      }}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}`,
                            color: textPrimary,
                          }}
                        >
                          <Calendar size={12} style={{ color: '#f97316', flexShrink: 0 }} />
                          <span>{exp.date ? format(parseISO(exp.date), 'dd MMM yyyy') : '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[13.5px] leading-snug" style={{ color: textPrimary }}>
                          {exp.title}
                        </div>
                        {exp.note && (
                          <div className="text-[11.5px] mt-0.5 font-normal opacity-75" style={{ color: textSecondary }}>
                            {exp.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap tracking-wide"
                          style={{
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: badgeStyle.border,
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium" style={{ color: textSecondary }}>
                          {exp.paidTo || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-md font-bold text-sm tracking-tight"
                          style={{
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                            color: isDark ? '#f87171' : '#dc2626',
                            border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(239, 68, 68, 0.2)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTableExpenses.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    fontWeight: 800,
                  }}
                >
                  <td colSpan={4} className="py-3.5 px-4 font-bold text-sm" style={{ color: textPrimary }}>
                    <div className="flex items-center gap-2">
                      <span>Total:</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-extrabold"
                        style={{
                          backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                          color: isDark ? '#f87171' : '#dc2626',
                        }}
                      >
                        {filteredTableExpenses.length} Expense Vouchers
                      </span>
                      <span className="text-xs font-medium" style={{ color: textSecondary }}>
                        ({expenseRangeMode === 'yearly' ? 'Whole Year' : 'Selected Month'})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md font-extrabold text-sm"
                      style={{
                        backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                        color: isDark ? '#f87171' : '#dc2626',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ₹{tableExpenseTotal.toLocaleString('en-IN')}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================
          PRINT & EXPORT MODAL (Triggered on Print button click)
          ======================================================== */}
      {isPrintModalOpen && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={t('printOptions')}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5">
            {/* Range Mode Selection */}
            <div>
              <label className="label" style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                1. Select Audit Period / Range:
              </label>
              <div
                className="flex p-1 rounded-lg mt-2"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8' }}
              >
                <button
                  type="button"
                  onClick={() => setPrintRangeMode('yearly')}
                  className="flex-1 py-2 text-xs font-bold rounded-md"
                  style={{
                    backgroundColor: printRangeMode === 'yearly' ? '#f97316' : 'transparent',
                    color: printRangeMode === 'yearly' ? '#ffffff' : textSecondary,
                  }}
                >
                  Full Calendar Year (Jan - Dec)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRangeMode('custom')}
                  className="flex-1 py-2 text-xs font-bold rounded-md"
                  style={{
                    backgroundColor: printRangeMode === 'custom' ? '#f97316' : 'transparent',
                    color: printRangeMode === 'custom' ? '#ffffff' : textSecondary,
                  }}
                >
                  {t('customRange')} (Month to Month)
                </button>
              </div>
            </div>

            {/* Yearly Configuration */}
            {printRangeMode === 'yearly' ? (
              <div className="p-3.5 rounded-lg border" style={{ borderColor }}>
                <label className="text-xs font-semibold block mb-1" style={{ color: textSecondary }}>
                  Calendar Year:
                </label>
                <select
                  value={printBaseYear}
                  onChange={(e) => setPrintBaseYear(Number(e.target.value))}
                  className="input-field text-xs font-bold cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Custom Range Configuration */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg border" style={{ borderColor }}>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: textSecondary }}>
                    {t('fromMonth')}:
                  </label>
                  <input
                    type="month"
                    value={customFromMonth}
                    onChange={(e) => setCustomFromMonth(e.target.value)}
                    className="input-field text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: textSecondary }}>
                    {t('toMonth')}:
                  </label>
                  <input
                    type="month"
                    value={customToMonth}
                    onChange={(e) => setCustomToMonth(e.target.value)}
                    className="input-field text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {/* Include Checkboxes */}
            <div>
              <label className="label" style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                2. Report Sections to Include:
              </label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer" style={{ color: textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includeMemberLedger}
                    onChange={(e) => setIncludeMemberLedger(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Member Maintenance Payment Ledger (Paid Members Only)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer" style={{ color: textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includeExpenses}
                    onChange={(e) => setIncludeExpenses(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Society Operational Expenditure Table</span>
                </label>
              </div>
            </div>

            {/* Quick Live Preview Box */}
            <div
              className="p-3.5 rounded-lg text-xs space-y-1.5"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                border: `1px dashed ${borderColor}`,
              }}
            >
              <div className="flex justify-between">
                <span style={{ color: textSecondary }}>Selected Scope:</span>
                <span className="font-bold" style={{ color: textPrimary }}>{printPeriodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: textSecondary }}>Total Collections in Scope:</span>
                <span className="font-bold text-green-500">₹{printTotalCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: textSecondary }}>Total Expenses in Scope:</span>
                <span className="font-bold text-red-500">₹{printTotalExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1" style={{ borderColor }}>
                <span style={{ color: textPrimary }}>Net Surplus:</span>
                <span style={{ color: printNetBalance >= 0 ? '#00b8d9' : '#ff5630' }}>
                  ₹{printNetBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t" style={{ borderColor }}>
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn-white w-full sm:w-auto flex items-center justify-center gap-2 text-xs"
              >
                <FileSpreadsheet size={15} />
                <span>{t('downloadCsv')}</span>
              </button>
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-xs"
              >
                <Printer size={15} />
                <span>{t('printNow')}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          PRINT ONLY VIEW (Styled exclusively for Paper & PDF via @media print)
          ======================================================== */}
      <div
        className="print-only"
        style={{
          backgroundColor: '#ffffff',
          color: '#1c252e',
          padding: '0',
          margin: '0',
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        {/* ── LETTERHEAD ── */}
        <div
          style={{
            borderBottom: '3px solid #f97316',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              height: '6px',
              background: 'linear-gradient(90deg, #f97316 0%, #fb923c 60%, #fdba74 100%)',
              borderRadius: '4px 4px 0 0',
              marginBottom: '14px',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Society Info */}
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: '22pt',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  margin: 0,
                  color: '#f97316',
                  letterSpacing: '0.8px',
                  lineHeight: 1.1,
                }}
              >
                {societyName}
              </h1>
              <p
                style={{
                  fontSize: '9.5pt',
                  margin: '5px 0 0 0',
                  fontWeight: 600,
                  color: '#637381',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                Co-operative Housing Society · Maharashtra
              </p>
              <p
                style={{
                  fontSize: '9pt',
                  margin: '2px 0 0 0',
                  color: '#637381',
                }}
              >
                Reg. under Maharashtra Co-operative Societies Act, 1960
              </p>
            </div>

            {/* Report Badge */}
            <div
              style={{
                textAlign: 'right',
                minWidth: '200px',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '8pt',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                Financial Audit Report
              </div>
              <p style={{ fontSize: '9pt', margin: '6px 0 0 0', color: '#1c252e', fontWeight: 700 }}>
                Period: {printPeriodLabel}
              </p>
              <p style={{ fontSize: '8pt', color: '#637381', margin: '2px 0 0 0' }}>
                Generated: {format(new Date(), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: FINANCIAL SUMMARY BOX ── */}
        <div className="print-break-inside-avoid" style={{ marginBottom: '22px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '18px',
                backgroundColor: '#f97316',
                borderRadius: '2px',
                flexShrink: 0,
              }}
            />
            <h2
              style={{
                fontSize: '11pt',
                fontWeight: 800,
                margin: 0,
                color: '#f97316',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Section 1  Financial Overview
            </h2>
          </div>

          {/* 3-column summary boxes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                border: '1.5px solid #d1fae5',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: '#fff7ed',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '8pt', color: '#15803d', fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Total Collected</p>
              <p style={{ fontSize: '14pt', fontWeight: 900, color: '#15803d', margin: 0 }}>
                ₹{printTotalCollected.toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '7.5pt', color: '#637381', margin: '3px 0 0 0' }}>
                {printPayments.length} receipts · {printMemberLedger.length} members
              </p>
            </div>
            <div
              style={{
                border: '1.5px solid #fee2e2',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '8pt', color: '#b91c1c', fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Total Expenses</p>
              <p style={{ fontSize: '14pt', fontWeight: 900, color: '#b91c1c', margin: 0 }}>
                ₹{printTotalExpenses.toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '7.5pt', color: '#637381', margin: '3px 0 0 0' }}>
                {printExpenses.length} vouchers recorded
              </p>
            </div>
            <div
              style={{
                border: `1.5px solid ${printNetBalance >= 0 ? '#fed7aa' : '#fee2e2'}`,
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: printNetBalance >= 0 ? '#fff7ed' : '#fef2f2',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '8pt',
                  color: printNetBalance >= 0 ? '#f97316' : '#b91c1c',
                  fontWeight: 700,
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                }}
              >
                Net Balance
              </p>
              <p
                style={{
                  fontSize: '14pt',
                  fontWeight: 900,
                  color: printNetBalance >= 0 ? '#f97316' : '#b91c1c',
                  margin: 0,
                }}
              >
                ₹{printNetBalance.toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize: '7.5pt', fontWeight: 700, color: printNetBalance >= 0 ? '#15803d' : '#b91c1c', margin: '3px 0 0 0' }}>
                {printNetBalance >= 0 ? 'Surplus Reserve' : 'Deficit in Period'}
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: MEMBER PAYMENT LEDGER ── */}
        {includeMemberLedger && (
          <div className="print-break-inside-avoid" style={{ marginBottom: '22px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '4px',
                    height: '18px',
                    backgroundColor: '#15803d',
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                />
                <h2
                  style={{
                    fontSize: '11pt',
                    fontWeight: 800,
                    margin: 0,
                    color: '#f97316',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Section 2  Member Maintenance Payment Ledger
                </h2>
              </div>
              <span
                style={{
                  fontSize: '8pt',
                  fontWeight: 700,
                  color: '#15803d',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #d1fae5',
                  padding: '3px 10px',
                  borderRadius: '12px',
                }}
              >
                {printMemberLedger.length} Members Paid
              </span>
            </div>

            <table
              className="print-table"
              style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f97316' }}>
                  <th
                    style={{
                      width: '8%',
                      padding: '8px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '8.5pt',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Flat
                  </th>
                  <th
                    style={{
                      width: '30%',
                      padding: '8px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '8.5pt',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Member Name
                  </th>
                  <th
                    style={{
                      width: '14%',
                      padding: '8px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '8.5pt',
                      textAlign: 'right',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Total Paid (₹)
                  </th>
                  <th
                    style={{
                      width: '12%',
                      padding: '8px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '8.5pt',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Receipts
                  </th>
                  <th
                    style={{
                      width: '36%',
                      padding: '8px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '8.5pt',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Months Covered
                  </th>
                </tr>
              </thead>
              <tbody>
                {printMemberLedger.map((m, idx) => (
                  <tr
                    key={m.owner.id}
                    style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fff7ed' }}
                  >
                    <td
                      style={{
                        fontWeight: 800,
                        padding: '7px 10px',
                        border: '1px solid #e5e7eb',
                        color: '#f97316',
                        fontSize: '9pt',
                      }}
                    >
                      {m.owner.flat}
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        border: '1px solid #e5e7eb',
                        color: '#1c252e',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '9.5pt' }}>{m.owner.name}</span>
                      {m.owner.nameMr && (
                        <span
                          style={{
                            fontSize: '8pt',
                            color: '#637381',
                            display: 'block',
                            marginTop: '1px',
                          }}
                        >
                          {m.owner.nameMr}
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 900,
                        padding: '7px 10px',
                        border: '1px solid #e5e7eb',
                        color: '#15803d',
                        fontSize: '10pt',
                      }}
                    >
                      ₹{m.totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '7px 10px',
                        border: '1px solid #e5e7eb',
                        color: '#1c252e',
                        fontSize: '9pt',
                        fontWeight: 600,
                      }}
                    >
                      {m.paymentsCount}
                    </td>
                    <td
                      style={{
                        fontSize: '8.5pt',
                        padding: '7px 10px',
                        border: '1px solid #e5e7eb',
                        color: '#1c252e',
                        lineHeight: '1.4',
                      }}
                    >
                      {m.monthsCovered}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f97316' }}>
                  <td
                    colSpan={2}
                    style={{
                      padding: '9px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '9.5pt',
                      textTransform: 'uppercase',
                    }}
                  >
                    Grand Total  {printMemberLedger.length} Members
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '9px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#ffffff',
                      fontSize: '11pt',
                      fontWeight: 900,
                    }}
                  >
                    ₹{printTotalCollected.toLocaleString('en-IN')}
                  </td>
                  <td
                    colSpan={2}
                    style={{
                      padding: '9px 10px',
                      border: '1px solid #ea6c0a',
                      color: '#fed7aa',
                      fontSize: '8.5pt',
                      fontWeight: 700,
                    }}
                  >
                    {printPayments.length} total receipts cleared
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── SECTION 3: SOCIETY EXPENSES ── */}
        {includeExpenses && (
          <div className="print-break-inside-avoid" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '4px',
                  height: '18px',
                  backgroundColor: '#b91c1c',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
              />
              <h2
                style={{
                  fontSize: '11pt',
                  fontWeight: 800,
                  margin: 0,
                  color: '#f97316',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Section 3  Society Operational Expenditure
              </h2>
            </div>

            <table
              className="print-table"
              style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}
            >
              <thead>
                <tr style={{ backgroundColor: '#1c252e' }}>
                  {["Date", "Expense Title", "Category", "Paid To", "Amount (₹)"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 10px',
                        border: '1px solid #1c252e',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '8.5pt',
                        textAlign: h === 'Amount (₹)' ? 'right' : 'left',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: 'center',
                        fontStyle: 'italic',
                        padding: '14px',
                        border: '1px solid #e5e7eb',
                        color: '#637381',
                        backgroundColor: '#fef2f2',
                      }}
                    >
                      No expenses recorded for this period.
                    </td>
                  </tr>
                ) : (
                  printExpenses.map((e, idx) => (
                    <tr key={e.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fff7ed' }}>
                      <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', color: '#1c252e', fontSize: '8.5pt', whiteSpace: 'nowrap' }}>
                        {e.date ? format(new Date(e.date), 'dd MMM yyyy') : ''}
                      </td>
                      <td style={{ fontWeight: 700, padding: '7px 10px', border: '1px solid #e5e7eb', color: '#1c252e', fontSize: '9pt' }}>
                        {e.title}
                      </td>
                      <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', color: '#1c252e', fontSize: '8.5pt' }}>
                        {e.category}
                      </td>
                      <td style={{ padding: '7px 10px', border: '1px solid #e5e7eb', color: '#1c252e', fontSize: '8.5pt' }}>
                        {e.paidTo}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, padding: '7px 10px', border: '1px solid #e5e7eb', color: '#b91c1c', fontSize: '9.5pt' }}>
                        ₹{e.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#1c252e' }}>
                  <td
                    colSpan={4}
                    style={{
                      padding: '9px 10px',
                      border: '1px solid #1c252e',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '9.5pt',
                      textTransform: 'uppercase',
                    }}
                  >
                    Total Expenditure  {printExpenses.length} Vouchers
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '9px 10px',
                      border: '1px solid #1c252e',
                      color: '#fca5a5',
                      fontSize: '11pt',
                      fontWeight: 900,
                    }}
                  >
                    ₹{printTotalExpenses.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── FOOTER: Declaration + Signatories ── */}
        <div
          className="print-break-inside-avoid"
          style={{
            marginTop: '40px',
            borderTop: '2px solid #f97316',
            paddingTop: '18px',
          }}
        >
          {/* Declaration */}
          <p
            style={{
              fontSize: '8pt',
              color: '#637381',
              fontStyle: 'italic',
              textAlign: 'center',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
            }}
          >
            This financial statement has been prepared based on the maintenance collections and expenditure records of {societyName} for the period {printPeriodLabel}.
            The undersigned certify that the information contained herein is true and correct to the best of their knowledge.
          </p>

          {/* Signatories */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              textAlign: 'center',
            }}
          >
            {['Chairman', 'Secretary', 'Treasurer'].map((role) => (
              <div key={role}>
                <div
                  style={{
                    height: '48px',
                    borderBottom: '2px solid #f97316',
                    marginBottom: '6px',
                  }}
                />
                <p style={{ fontSize: '9.5pt', fontWeight: 800, color: '#f97316', margin: '0 0 2px 0' }}>{role}</p>
                <p style={{ fontSize: '8pt', color: '#637381', margin: 0 }}>{societyName}</p>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              height: '4px',
              background: 'linear-gradient(90deg, #f97316 0%, #fb923c 60%, #fdba74 100%)',
              borderRadius: '0 0 4px 4px',
              marginTop: '20px',
            }}
          />
        </div>
      </div>
    </div>
  );
}
