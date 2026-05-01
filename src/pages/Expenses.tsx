import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Plus, Receipt, Search, Filter, Calendar, Edit2, Trash2, IndianRupee } from 'lucide-react';
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

export default function Expenses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const expenses = useStore((state) => state.expenses);
  const deleteExpense = useStore((state) => state.deleteExpense);
  const { toast } = useToast();

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
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);

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
      const matchMonth = e.date.startsWith(selectedMonth);
      return matchSearch && matchCategory && matchMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, search, selectedCategory, selectedMonth]);

  const totalThisMonth = expenses
    .filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalThisYear = expenses
    .filter(e => e.date.startsWith(format(new Date(), 'yyyy')))
    .reduce((sum, e) => sum + e.amount, 0);

  const entriesThisMonth = expenses.filter(e => e.date.startsWith(format(new Date(), 'yyyy-MM'))).length;

  const categoryBreakdown = useMemo(() => {
    const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
    const breakdown: Record<string, number> = {};
    monthExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });
    return breakdown;
  }, [expenses, selectedMonth]);

  const mostSpentCategory = Object.keys(categoryBreakdown).length > 0 
    ? Object.keys(categoryBreakdown).reduce((a, b) => categoryBreakdown[a] > categoryBreakdown[b] ? a : b)
    : 'None';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary }}>
            {t('otherExpenses')}
          </h1>
          <p style={{ fontSize: '14px', color: textSecondary, marginTop: '4px' }}>
            Track all society expenses outside of maintenance collection
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/expenses/add')}>
          <Plus size={18} />
          {t('addExpense')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalThisMonth'), value: `₹${totalThisMonth.toLocaleString()}`, icon: IndianRupee, color: '#00a76f', bg: 'rgba(0, 167, 111, 0.16)' },
          { label: t('totalThisYear'), value: `₹${totalThisYear.toLocaleString()}`, icon: Receipt, color: '#8e33ff', bg: 'rgba(142, 51, 255, 0.16)' },
          { label: 'Entries This Month', value: entriesThisMonth, icon: Calendar, color: '#00b8d9', bg: 'rgba(0, 184, 217, 0.16)' },
          { label: 'Most Spent Category', value: mostSpentCategory, icon: Filter, color: '#ff5630', bg: 'rgba(255, 86, 48, 0.16)' },
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
      <div className="card p-4" style={{ backgroundColor: cardBg }}>
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex gap-4">
            <select
              className="input-field w-auto"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              className="input-field w-auto"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr>
                    <th style={{ padding: '16px', color: textSecondary, fontSize: '13px', fontWeight: 600, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}` }}>Date</th>
                    <th style={{ padding: '16px', color: textSecondary, fontSize: '13px', fontWeight: 600, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}` }}>Title</th>
                    <th style={{ padding: '16px', color: textSecondary, fontSize: '13px', fontWeight: 600, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}` }}>Category</th>
                    <th style={{ padding: '16px', color: textSecondary, fontSize: '13px', fontWeight: 600, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}` }}>Paid To</th>
                    <th style={{ padding: '16px', color: textSecondary, fontSize: '13px', fontWeight: 600, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}`, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '16px', color: textSecondary, fontSize: '13px', fontWeight: 600, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}`, width: '80px' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center' }}>
                        <Receipt size={32} style={{ color: textSecondary, margin: '0 auto 12px', opacity: 0.5 }} />
                        <p style={{ color: textSecondary }}>{t('noExpenses')}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((exp) => (
                      <tr key={exp.id} className="transition-colors" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8'}`, cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#28343f' : '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px', fontSize: '13px', color: textPrimary, whiteSpace: 'nowrap' }}>
                          {format(parseISO(exp.date), 'dd MMM yyyy')}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: textPrimary }}>
                          <span title={exp.note}>{exp.title}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-flex', padding: '4px 8px', borderRadius: '6px',
                            backgroundColor: 'rgba(0, 167, 111, 0.16)', color: '#00a76f',
                            fontSize: '12px', fontWeight: 700
                          }}>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: textSecondary }}>
                          {exp.paidTo}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: textPrimary, textAlign: 'right', fontFamily: 'monospace' }}>
                          ₹{exp.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="flex gap-2">
                            <button onClick={() => navigate(`/expenses/edit/${exp.id}`)} style={{ color: textSecondary }} className="hover:text-blue-500 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => confirmDelete(exp.id)} style={{ color: textSecondary }} className="hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
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
                        backgroundColor: '#00a76f',
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
