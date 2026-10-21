import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Printer,
  Search,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Receipt,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useStore, type Payment, type Expense } from '../store/useStore';
import Modal from '../components/Modal';

type YearType = 'financial' | 'calendar';

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
    fetchOwners();
    fetchPayments();
    fetchExpenses();
  }, [fetchOwners, fetchPayments, fetchExpenses]);

  // Current date
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-based

  // Available Years
  const availableYears = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  // Primary page filter state
  const [yearType, setYearType] = useState<YearType>('financial');
  // For financial year 2025 means FY 2025-2026 (Apr 2025 to Mar 2026)
  const [selectedBaseYear, setSelectedBaseYear] = useState<number>(
    currentMonthIdx >= 3 ? currentYear : currentYear - 1
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '0' - '11'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null);

  // Print & Export Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printRangeMode, setPrintRangeMode] = useState<'yearly' | 'custom'>('yearly');
  const [printYearType, setPrintYearType] = useState<YearType>('financial');
  const [printBaseYear, setPrintBaseYear] = useState<number>(selectedBaseYear);
  const [customFromMonth, setCustomFromMonth] = useState<string>(
    `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`
  );
  const [customToMonth, setCustomToMonth] = useState<string>(
    `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`
  );
  const [includeMemberLedger, setIncludeMemberLedger] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeMonthlySummary, setIncludeMonthlySummary] = useState(true);

  // Helper: compute start & end Date for a given year & type
  const getPeriodInterval = (type: YearType, baseYear: number, monthVal: string) => {
    let start: Date;
    let end: Date;

    if (type === 'financial') {
      if (monthVal === 'all') {
        start = new Date(baseYear, 3, 1, 0, 0, 0); // Apr 1
        end = new Date(baseYear + 1, 2, 31, 23, 59, 59); // Mar 31
      } else {
        const mIdx = parseInt(monthVal, 10);
        const y = mIdx >= 3 ? baseYear : baseYear + 1;
        start = startOfMonth(new Date(y, mIdx, 1));
        end = endOfMonth(new Date(y, mIdx, 1));
      }
    } else {
      if (monthVal === 'all') {
        start = new Date(baseYear, 0, 1, 0, 0, 0); // Jan 1
        end = new Date(baseYear, 11, 31, 23, 59, 59); // Dec 31
      } else {
        const mIdx = parseInt(monthVal, 10);
        start = startOfMonth(new Date(baseYear, mIdx, 1));
        end = endOfMonth(new Date(baseYear, mIdx, 1));
      }
    }
    return { start, end };
  };

  // Helper: check if a payment overlaps with interval
  const isPaymentInInterval = (payment: Payment, start: Date, end: Date) => {
    if (payment.status !== 'paid') return false;

    // 1. If explicit fromDate / toDate exist
    if (payment.fromDate) {
      const pFrom = new Date(payment.fromDate + 'T00:00:00');
      const pTo = payment.toDate ? new Date(payment.toDate + 'T23:59:59') : pFrom;
      return (pFrom <= end && pTo >= start);
    }

    // 2. Fallback to month string parsing (e.g. "January 2025" or "Apr 2025 - Jun 2025")
    if (payment.month) {
      const parts = payment.month.split(' - ');
      const pStart = startOfMonth(new Date(parts[0]));
      const pEnd = parts.length === 2 ? endOfMonth(new Date(parts[1])) : endOfMonth(pStart);
      if (!isNaN(pStart.getTime())) {
        return (pStart <= end && pEnd >= start);
      }
    }

    // 3. Fallback to paidOn date
    if (payment.paidOn) {
      const pDate = new Date(payment.paidOn);
      if (!isNaN(pDate.getTime())) {
        return isWithinInterval(pDate, { start, end });
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
    return getPeriodInterval(yearType, selectedBaseYear, selectedMonth);
  }, [yearType, selectedBaseYear, selectedMonth]);

  // Months list for the selected year
  const yearMonths = useMemo(() => {
    const list: { label: string; value: string; year: number; monthIdx: number }[] = [];
    if (yearType === 'financial') {
      // Apr (3) to Dec (11) of baseYear, then Jan (0) to Mar (2) of baseYear+1
      for (let m = 3; m <= 11; m++) {
        const d = new Date(selectedBaseYear, m, 1);
        list.push({ label: format(d, 'MMM yyyy'), value: String(m), year: selectedBaseYear, monthIdx: m });
      }
      for (let m = 0; m <= 2; m++) {
        const d = new Date(selectedBaseYear + 1, m, 1);
        list.push({ label: format(d, 'MMM yyyy'), value: String(m), year: selectedBaseYear + 1, monthIdx: m });
      }
    } else {
      // Jan (0) to Dec (11) of baseYear
      for (let m = 0; m <= 11; m++) {
        const d = new Date(selectedBaseYear, m, 1);
        list.push({ label: format(d, 'MMM yyyy'), value: String(m), year: selectedBaseYear, monthIdx: m });
      }
    }
    return list;
  }, [yearType, selectedBaseYear]);

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

  // Monthly Financial Breakdown Table
  const monthlyBreakdown = useMemo(() => {
    return yearMonths.map((ym) => {
      const mStart = startOfMonth(new Date(ym.year, ym.monthIdx, 1));
      const mEnd = endOfMonth(new Date(ym.year, ym.monthIdx, 1));

      const mPayments = payments.filter((p) => isPaymentInInterval(p, mStart, mEnd));
      const mExpenses = expenses.filter((e) => isExpenseInInterval(e, mStart, mEnd));

      const collections = mPayments.reduce((acc, p) => acc + p.amount, 0);
      const expenseTotal = mExpenses.reduce((acc, e) => acc + e.amount, 0);
      const paidMembersCount = new Set(mPayments.map((p) => p.ownerId)).size;

      return {
        ...ym,
        collections,
        expenses: expenseTotal,
        net: collections - expenseTotal,
        paidMembersCount,
      };
    });
  }, [yearMonths, payments, expenses]);

  // Category Breakdown for Expenses
  const categoryExpenses = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    periodExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: financialStats.totalExpenses > 0 ? (data.total / financialStats.totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [periodExpenses, financialStats.totalExpenses]);

  // Member Payment Ledger (Who Paid What)
  const memberLedger = useMemo(() => {
    return owners.map((owner) => {
      const ownerPayments = periodPayments.filter((p) => p.ownerId === owner.id);
      const totalPaid = ownerPayments.reduce((acc, p) => acc + p.amount, 0);

      // Estimate expected based on months in active period
      const monthsInPeriod = selectedMonth === 'all' ? 12 : 1;
      const expectedAmount = owner.monthlyAmount * monthsInPeriod;
      const pendingAmount = Math.max(0, expectedAmount - totalPaid);

      let status: 'clear' | 'partial' | 'pending' = 'clear';
      if (totalPaid === 0) status = 'pending';
      else if (totalPaid < expectedAmount) status = 'partial';

      return {
        owner,
        totalPaid,
        expectedAmount,
        pendingAmount,
        status,
        payments: ownerPayments,
      };
    });
  }, [owners, periodPayments, selectedMonth]);

  const filteredMembers = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return memberLedger.filter(
      (m) =>
        m.owner.name.toLowerCase().includes(s) ||
        m.owner.flat.toLowerCase().includes(s) ||
        (m.owner.nameMr && m.owner.nameMr.toLowerCase().includes(s))
    );
  }, [memberLedger, searchTerm]);

  // Interval calculation for Print Mode
  const printInterval = useMemo(() => {
    if (printRangeMode === 'yearly') {
      return getPeriodInterval(printYearType, printBaseYear, 'all');
    } else {
      const [fY, fM] = customFromMonth.split('-').map(Number);
      const [tY, tM] = customToMonth.split('-').map(Number);
      const start = startOfMonth(new Date(fY, fM - 1, 1));
      const end = endOfMonth(new Date(tY, tM - 1, 1));
      return { start, end };
    }
  }, [printRangeMode, printYearType, printBaseYear, customFromMonth, customToMonth]);

  // Period label for print report
  const printPeriodLabel = useMemo(() => {
    if (printRangeMode === 'yearly') {
      if (printYearType === 'financial') {
        return `Financial Year: April ${printBaseYear} - March ${printBaseYear + 1}`;
      } else {
        return `Calendar Year: January ${printBaseYear} - December ${printBaseYear}`;
      }
    } else {
      const [fY, fM] = customFromMonth.split('-').map(Number);
      const [tY, tM] = customToMonth.split('-').map(Number);
      const start = new Date(fY, fM - 1, 1);
      const end = new Date(tY, tM - 1, 1);
      return `${format(start, 'MMMM yyyy')} - ${format(end, 'MMMM yyyy')}`;
    }
  }, [printRangeMode, printYearType, printBaseYear, customFromMonth, customToMonth]);

  // Print Data Calculations
  const printPayments = useMemo(() => {
    return payments.filter((p) => isPaymentInInterval(p, printInterval.start, printInterval.end));
  }, [payments, printInterval]);

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
        const oPayments = printPayments.filter((p) => p.ownerId === owner.id);
        const totalPaid = oPayments.reduce((acc, p) => acc + p.amount, 0);
        const monthsCovered = oPayments.map((p) => p.month).filter(Boolean).join(', ');
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
    const headers = ['Flat Number', 'Owner Name', 'Contact', 'Total Paid (INR)', 'Months Covered', 'Receipts'];
    const rows = printMemberLedger.map((m) => [
      `"${m.owner.flat}"`,
      `"${m.owner.name}${m.owner.nameMr ? ` (${m.owner.nameMr})` : ''}"`,
      `"${m.owner.phone}"`,
      m.totalPaid,
      `"${m.monthsCovered}"`,
      `"${printPayments.filter((p) => p.ownerId === m.owner.id).map((p) => p.receiptNumber).filter(Boolean).join('; ')}"`,
    ]);

    const csvContent = [
      `"Society: ${societyName}"`,
      `"Report: Annual Financial & Maintenance Ledger"`,
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
          {/* Year Type Switcher - Segmented Control */}
          <div
            className="flex p-1 rounded-lg w-full sm:w-auto"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8' }}
          >
            <button
              onClick={() => setYearType('financial')}
              className="flex-1 sm:flex-initial text-center transition-all"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: yearType === 'financial' ? '#f97316' : 'transparent',
                color: yearType === 'financial' ? '#ffffff' : textSecondary,
                touchAction: 'manipulation',
              }}
            >
              {t('financialYear')}
            </button>
            <button
              onClick={() => setYearType('calendar')}
              className="flex-1 sm:flex-initial text-center transition-all"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: yearType === 'calendar' ? '#f97316' : 'transparent',
                color: yearType === 'calendar' ? '#ffffff' : textSecondary,
                touchAction: 'manipulation',
              }}
            >
              {t('calendarYear')}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Year Dropdown */}
            <select
              value={selectedBaseYear}
              onChange={(e) => setSelectedBaseYear(Number(e.target.value))}
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
                  {yearType === 'financial' ? `FY ${y}-${y + 1}` : `Year ${y}`}
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
            {yearType === 'financial'
              ? `FY ${selectedBaseYear}-${selectedBaseYear + 1}`
              : `CY ${selectedBaseYear}`}
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
          SCREEN VIEW: Monthly Breakdown Statement (12 Months)
          ======================================================== */}
      {selectedMonth === 'all' && (
        <div
          className="no-print rounded-xl overflow-hidden"
          style={{
            backgroundColor: cardBg,
            boxShadow: isDark
              ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
              : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
          }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                {t('includeMonthlySummary')}
              </h2>
              <p style={{ fontSize: '12px', color: textSecondary }}>
                Month-by-month financial summary of collections and expenses
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500">
              12 Months Breakdown
            </span>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                    borderBottom: `1px solid ${borderColor}`,
                    color: textSecondary,
                  }}
                >
                  <th className="py-3 px-4 font-semibold">{t('month')}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t('collections')}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t('expenses')}</th>
                  <th className="py-3 px-4 font-semibold text-right">{t('netBalance')}</th>
                  <th className="py-3 px-4 font-semibold text-center">Paid Flats</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((row) => (
                  <tr
                    key={row.label}
                    style={{
                      borderBottom: `1px solid ${borderColor}`,
                      transition: 'background-color 0.15s ease',
                    }}
                    className="hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <td className="py-3 px-4 font-bold" style={{ color: textPrimary }}>
                      {row.label}
                    </td>
                    <td className="py-3 px-4 font-semibold text-right text-green-500">
                      ₹{row.collections.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-right text-red-500">
                      ₹{row.expenses.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-3 px-4 font-bold text-right ${row.net >= 0 ? 'text-blue-500' : 'text-red-400'
                        }`}
                    >
                      ₹{row.net.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          backgroundColor:
                            row.paidMembersCount > 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(145, 158, 171, 0.12)',
                          color: row.paidMembersCount > 0 ? '#22c55e' : textSecondary,
                        }}
                      >
                        {row.paidMembersCount} / {owners.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                    fontWeight: 800,
                  }}
                >
                  <td className="py-3.5 px-4" style={{ color: textPrimary }}>
                    ANNUAL TOTAL
                  </td>
                  <td className="py-3.5 px-4 text-right text-green-600 dark:text-green-400">
                    ₹{financialStats.totalCollected.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right text-red-600 dark:text-red-400">
                    ₹{financialStats.totalExpenses.toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right ${financialStats.netBalance >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-500'
                      }`}
                  >
                    ₹{financialStats.netBalance.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs" style={{ color: textSecondary }}>
                    {owners.length} Total Units
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SCREEN VIEW: Member Payment Ledger ("Who Paid What")
          ======================================================== */}
      <div
        className="no-print rounded-xl overflow-hidden"
        style={{
          backgroundColor: cardBg,
          boxShadow: isDark
            ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
            : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
        }}
      >
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
              {t('memberLedger')} ({t('whoPaidWhat')})
            </h2>
            <p style={{ fontSize: '12px', color: textSecondary }}>
              Individual member maintenance payment audit for selected period
            </p>
          </div>

          {/* Search Member Filter */}
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
            />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-xs"
              style={{ paddingLeft: '32px', height: '36px' }}
            />
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '650px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  borderBottom: `1px solid ${borderColor}`,
                  color: textSecondary,
                }}
              >
                <th className="py-3 px-4 font-semibold">{t('flat')}</th>
                <th className="py-3 px-4 font-semibold">{t('owner')}</th>
                <th className="py-3 px-4 font-semibold">{t('contact')}</th>
                <th className="py-3 px-4 font-semibold text-right">{t('totalPaid')}</th>
                <th className="py-3 px-4 font-semibold text-right">Expected Dues</th>
                <th className="py-3 px-4 font-semibold text-center">{t('status')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm" style={{ color: textSecondary }}>
                    {t('noResultsFound')}
                  </td>
                </tr>
              ) : (
                filteredMembers.map(({ owner, totalPaid, expectedAmount, pendingAmount, status, payments: oPayments }) => {
                  const isExpanded = expandedOwnerId === owner.id;
                  return (
                    <>
                      <tr
                        key={owner.id}
                        style={{
                          borderBottom: `1px solid ${borderColor}`,
                        }}
                        className="hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <td className="py-3 px-4 font-bold" style={{ color: '#f97316' }}>
                          {owner.flat}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold" style={{ color: textPrimary }}>
                            {owner.name}
                          </div>
                          {owner.nameMr && (
                            <div className="text-xs" style={{ color: textSecondary }}>
                              {owner.nameMr}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono" style={{ color: textSecondary }}>
                          +{owner.phone}
                        </td>
                        <td className="py-3 px-4 font-bold text-right text-green-500">
                          ₹{totalPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-medium text-right text-xs" style={{ color: textSecondary }}>
                          ₹{expectedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {status === 'clear' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                              <CheckCircle2 size={12} />
                              {t('allClear')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                              <AlertCircle size={12} />
                              ₹{pendingAmount.toLocaleString('en-IN')} Due
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedOwnerId(isExpanded ? null : owner.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1 mx-auto"
                            style={{
                              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                              color: textSecondary,
                            }}
                          >
                            <span>{oPayments.length} Receipts</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded History Details */}
                      {isExpanded && (
                        <tr
                          key={`expanded-${owner.id}`}
                          style={{
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb',
                            borderBottom: `1px solid ${borderColor}`,
                          }}
                        >
                          <td colSpan={7} className="p-4">
                            <div className="pl-6 border-l-2 border-orange-500 space-y-2">
                              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textSecondary }}>
                                Detailed Payment Receipts for Flat {owner.flat} ({owner.name}):
                              </p>
                              {oPayments.length === 0 ? (
                                <p className="text-xs italic" style={{ color: textSecondary }}>
                                  No payment recorded in this selected timeframe.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {oPayments.map((p) => (
                                    <div
                                      key={p.id}
                                      className="p-2.5 rounded-lg border text-xs"
                                      style={{
                                        backgroundColor: cardBg,
                                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                                      }}
                                    >
                                      <div className="flex items-center justify-between font-bold">
                                        <span style={{ color: '#f97316' }}>{p.receiptNumber || `RCP-${p.id}`}</span>
                                        <span className="text-green-500">₹{p.amount.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="mt-1" style={{ color: textPrimary }}>
                                        {p.month}
                                      </div>
                                      <div className="mt-1 flex items-center justify-between text-[11px]" style={{ color: textSecondary }}>
                                        <span>Paid: {p.paidOn ? format(new Date(p.paidOn), 'dd MMM yyyy') : 'Recorded'}</span>
                                        {p.transactionId && <span className="font-mono">UTR: {p.transactionId}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          SCREEN VIEW: Society Operational Expenses Breakdown
          ======================================================== */}
      <div
        className="no-print rounded-xl overflow-hidden"
        style={{
          backgroundColor: cardBg,
          boxShadow: isDark
            ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
            : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)',
        }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
              Society Operational Expenses ({t('breakdown')})
            </h2>
            <p style={{ fontSize: '12px', color: textSecondary }}>
              Breakdown of maintenance expenditure incurred by category
            </p>
          </div>
          <span className="text-xs font-bold text-red-500">
            Total: ₹{financialStats.totalExpenses.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryExpenses.length === 0 ? (
            <p className="text-xs italic col-span-3 text-center py-4" style={{ color: textSecondary }}>
              {t('noExpenses')}
            </p>
          ) : (
            categoryExpenses.map((cat) => (
              <div
                key={cat.category}
                className="p-3.5 rounded-lg border flex flex-col justify-between"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: textPrimary }}>
                      {cat.category}
                    </span>
                    <span className="text-xs font-bold text-red-500">
                      ₹{cat.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>
                    {cat.count} voucher(s) recorded
                  </p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-right block mt-1" style={{ color: textSecondary }}>
                    {cat.percentage.toFixed(1)}% of total expenses
                  </span>
                </div>
              </div>
            ))
          )}
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
                  Yearly / Financial Year
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg border" style={{ borderColor }}>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: textSecondary }}>
                    Year Type:
                  </label>
                  <select
                    value={printYearType}
                    onChange={(e) => setPrintYearType(e.target.value as YearType)}
                    className="input-field text-xs font-semibold cursor-pointer"
                  >
                    <option value="financial">Financial Year (Apr - Mar)</option>
                    <option value="calendar">Calendar Year (Jan - Dec)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: textSecondary }}>
                    Year Selection:
                  </label>
                  <select
                    value={printBaseYear}
                    onChange={(e) => setPrintBaseYear(Number(e.target.value))}
                    className="input-field text-xs font-bold cursor-pointer"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {printYearType === 'financial' ? `${y} - ${y + 1}` : `${y}`}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <span>{t('includeMemberLedger')} (Who Paid What & Receipt audit)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer" style={{ color: textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includeExpenses}
                    onChange={(e) => setIncludeExpenses(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span>{t('includeExpenses')}</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer" style={{ color: textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includeMonthlySummary}
                    onChange={(e) => setIncludeMonthlySummary(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span>{t('includeMonthlySummary')}</span>
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

        {/* ── SECTION 3: MONTHLY SUMMARY ── */}
        {includeMonthlySummary && (
          <div className="print-break-inside-avoid" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
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
                Section 3  Monthly Financial Breakdown
              </h2>
            </div>

            <table
              className="print-table"
              style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}
            >
              <thead>
                <tr style={{ backgroundColor: '#1c252e' }}>
                  {["Month", "Collections (₹)", "Expenses (₹)", "Net (₹)", "Paid Members"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 10px',
                        border: '1px solid #1c252e',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '8.5pt',
                        textAlign: h === 'Month' || h === 'Paid Members' ? 'center' : 'right',
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
                {monthlyBreakdown.map((row, idx) => (
                  <tr key={row.label} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fff7ed' }}>
                    <td style={{ fontWeight: 700, padding: '6px 10px', border: '1px solid #e5e7eb', color: '#1c252e', fontSize: '9pt', textAlign: 'center' }}>
                      {row.label}
                    </td>
                    <td style={{ textAlign: 'right', padding: '6px 10px', border: '1px solid #e5e7eb', color: '#15803d', fontWeight: 700, fontSize: '9pt' }}>
                      ₹{row.collections.toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', padding: '6px 10px', border: '1px solid #e5e7eb', color: '#b91c1c', fontWeight: 700, fontSize: '9pt' }}>
                      ₹{row.expenses.toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', padding: '6px 10px', border: '1px solid #e5e7eb', color: row.net >= 0 ? '#f97316' : '#b91c1c', fontWeight: 800, fontSize: '9pt' }}>
                      ₹{row.net.toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 10px', border: '1px solid #e5e7eb', color: '#1c252e', fontSize: '9pt' }}>
                      {row.paidMembersCount} / {owners.length}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#1c252e' }}>
                  <td style={{ padding: '8px 10px', border: '1px solid #1c252e', color: '#ffffff', fontWeight: 900, fontSize: '9pt', textAlign: 'center' }}>ANNUAL TOTAL</td>
                  <td style={{ textAlign: 'right', padding: '8px 10px', border: '1px solid #1c252e', color: '#86efac', fontWeight: 900, fontSize: '10pt' }}>₹{printTotalCollected.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', padding: '8px 10px', border: '1px solid #1c252e', color: '#fca5a5', fontWeight: 900, fontSize: '10pt' }}>₹{printTotalExpenses.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', padding: '8px 10px', border: '1px solid #1c252e', color: printNetBalance >= 0 ? '#fed7aa' : '#fca5a5', fontWeight: 900, fontSize: '10pt' }}>₹{printNetBalance.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'center', padding: '8px 10px', border: '1px solid #1c252e', color: '#919eab', fontWeight: 700, fontSize: '9pt' }}>{owners.length} Units</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── SECTION 4: SOCIETY EXPENSES ── */}
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
                Section 4  Society Operational Expenditure
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
