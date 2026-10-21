import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Plus, Receipt, Search, Calendar, Edit2, Trash2, IndianRupee, ArrowUp, ArrowDown } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const CATEGORIES = [
  "Maintenance & Repair",
  "Cleaning & Housekeeping",
  "Security",
  "Electricity",
  "Water",
  "Garden & Landscaping",
  "Administrative",
  "Festival & Events",
  "Other"
];

const getCategoryBadgeStyle = (category: string, isDark: boolean) => {
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

export default function Expenses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const expenses = useStore((state) => state.expenses);
  const payments = useStore((state) => state.payments);
  const deleteExpense = useStore((state) => state.deleteExpense);
  const fetchExpenses = useStore((state) => state.fetchExpenses);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Month filter options (current + last 5 months)
  const monthOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy')
    };
  });
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';

  // Computed data
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.paidTo.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const matchMonth = selectedMonth === 'all' || e.date.startsWith(selectedMonth);
      return matchSearch && matchCategory && matchMonth;
    }).sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return dateSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [expenses, search, selectedCategory, selectedMonth, dateSortOrder]);

  const totalThisMonth = expenses
    .filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, e) => sum + e.amount, 0);

  const entriesThisMonth = expenses.filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM'))).length;


  // Total collected = all maintenance payments with status 'paid'
  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);


  const categoryBreakdown = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
    const breakdown: Record<string, number> = {};
    monthExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });
    return breakdown;
  }, [expenses, selectedMonth]);

  const maxCategoryAmount = Math.max(...Object.values(categoryBreakdown), 1);

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const confirmDelete = (id: string) => {
    setExpenseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete);
      toast('Expense deleted', 'success');
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary }}>
            {t('otherExpenses')}
          </h1>
        </div>
        <button 
          className="btn-primary flex-shrink-0" 
          onClick={() => navigate('/expenses/add')}
          style={{ padding: '8px 14px', marginTop: '4px' }}
        >
          <Plus size={18} />
          {t('addExpense')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: t('totalThisMonth'), value: `₹${totalThisMonth.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#f97316', bg: 'rgba(249, 115, 22, 0.16)' },
          { label: 'Entries This Month', value: entriesThisMonth, icon: Calendar, color: '#00b8d9', bg: 'rgba(0, 184, 217, 0.16)' },
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, icon: Receipt, color: '#8e33ff', bg: 'rgba(142, 51, 255, 0.16)' },
        ].map((stat, i) => (
          <div key={i} className="card p-5" style={{ backgroundColor: cardBg, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: '20px', fontWeight: 700, color: textPrimary }} className="truncate">{stat.value}</p>
              <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }} className="truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3.5 sm:p-4" style={{ backgroundColor: cardBg }}>
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
            <input
              type="text"
              placeholder="Search expenses by title or vendor..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full md:w-auto">
            <select
              className="input-field w-full sm:w-auto cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">All Months</option>
              {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              className="input-field w-full sm:w-auto cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card" style={{ backgroundColor: cardBg }}>
            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                      color: textSecondary,
                    }}
                  >
                    <th
                      onClick={() => setDateSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                      className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer select-none group transition-colors hover:text-orange-500"
                      style={{ width: '16%' }}
                      title={`Date sorted ${dateSortOrder === 'desc' ? 'Newest to Oldest (Descending)' : 'Oldest to Newest (Ascending)'}. Click to toggle.`}
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
                          {dateSortOrder === 'desc' ? (
                            <ArrowDown size={13} />
                          ) : (
                            <ArrowUp size={13} />
                          )}
                        </span>
                        <span className="text-[10px] font-normal lowercase tracking-normal text-zinc-400">
                          ({dateSortOrder === 'desc' ? 'desc' : 'asc'})
                        </span>
                      </div>
                    </th>
                    <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '30%' }}>Title / Description</th>
                    <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '22%' }}>Category</th>
                    <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider" style={{ width: '15%' }}>Paid To</th>
                    <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-right" style={{ width: '12%' }}>Amount</th>
                    <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-center" style={{ width: '6%' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm" style={{ color: textSecondary }}>
                        <Receipt size={32} className="mx-auto mb-2 opacity-40 text-orange-500" />
                        <p className="font-semibold text-sm">{t('noExpenses')}</p>
                        <p className="text-xs opacity-75 mt-0.5">Try adjusting your filters or search term.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((exp) => {
                      const badgeStyle = getCategoryBadgeStyle(exp.category, isDark);
                      return (
                        <tr
                          key={exp.id}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}`,
                          }}
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
                              <span>{format(parseISO(exp.date), 'dd MMM yyyy')}</span>
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
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/expenses/edit/${exp.id}`)}
                                className="p-1.5 rounded-lg border transition-all cursor-pointer hover:bg-blue-500 hover:text-white"
                                style={{
                                  borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.25)',
                                  backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
                                  color: isDark ? '#60a5fa' : '#2563eb',
                                }}
                                title="Edit Expense"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(exp.id)}
                                className="p-1.5 rounded-lg border transition-all cursor-pointer hover:bg-red-500 hover:text-white"
                                style={{
                                  borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)',
                                  backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
                                  color: isDark ? '#f87171' : '#dc2626',
                                }}
                                title="Delete Expense"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {paginatedExpenses.length > 0 && (
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
                            {filteredExpenses.length} Expense{filteredExpenses.length === 1 ? '' : 's'}
                          </span>
                          {filteredExpenses.length > ITEMS_PER_PAGE && (
                            <span className="text-xs font-medium" style={{ color: textSecondary }}>
                              (Page {currentPage} of {totalPages})
                            </span>
                          )}
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
                          ₹{paginatedExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ padding: '16px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  className="btn-white" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ opacity: currentPage === 1 ? 0.5 : 1, backgroundColor: isDark ? 'transparent' : undefined, color: isDark ? '#fff' : undefined, borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined }}
                >
                  Prev
                </button>
                <button 
                  className="btn-white" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1, backgroundColor: isDark ? 'transparent' : undefined, color: isDark ? '#fff' : undefined, borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="card p-6 h-fit" style={{ backgroundColor: cardBg }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '20px' }}>
            {t('breakdown')} ({monthOptions.find(o => o.value === selectedMonth)?.label})
          </h3>
          
          {Object.keys(categoryBreakdown).length === 0 ? (
            <p style={{ color: textSecondary, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No expenses this month</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                <div key={cat}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: '13px', color: textPrimary, fontWeight: 500 }}>{cat}</span>
                    <span style={{ fontSize: '13px', color: textSecondary }}>₹{val.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${(val / maxCategoryAmount) * 100}%`,
                        backgroundColor: '#f97316',
                        borderRadius: '4px'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        danger
      />
    </div>
  );
}
