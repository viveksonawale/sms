import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Expense } from '../store/useStore';
import { ChevronLeft, Save, Receipt, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { useToast } from '../context/ToastContext';

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

export default function AddExpense() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'dark';
  const expenses = useStore((state) => state.expenses);
  const addExpense = useStore((state) => state.addExpense);
  const updateExpense = useStore((state) => state.updateExpense);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paidTo, setPaidTo] = useState('');
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      const expense = expenses.find(e => e.id === id);
      if (expense) {
        setTitle(expense.title);
        setCategory(expense.category);
        setAmount(expense.amount.toString());
        setDate(expense.date);
        setPaidTo(expense.paidTo);
        setNote(expense.note);
        setIsEditing(true);
      }
    }
  }, [id, expenses]);

  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date || !paidTo) {
      toast('Please fill all required fields', 'error');
      return;
    }

    const expenseData: Expense = {
      id: id || crypto.randomUUID(),
      title,
      category,
      amount: Number(amount),
      date,
      paidTo,
      note,
      addedOn: isEditing ? (expenses.find(e => e.id === id)?.addedOn || new Date().toISOString()) : new Date().toISOString()
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateExpense(expenseData.id, expenseData);
        toast('Expense updated', 'success');
      } else {
        await addExpense(expenseData);
        toast('Expense added', 'success');
      }
      navigate('/expenses');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save expense. Please try again.';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/expenses')}
          className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: textSecondary }}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary }}>
            {isEditing ? 'Edit Expense' : t('addExpense')}
          </h1>
          <p style={{ fontSize: '14px', color: textSecondary, marginTop: '2px' }}>
            {isEditing ? 'Update the details of this society expense' : 'Record a new society expense entry'}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ backgroundColor: cardBg, borderRadius: '16px' }}>
        {/* Top accent bar */}
        <div style={{ height: '6px', background: 'linear-gradient(90deg, #f97316, #fdba74)' }} />
        
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div 
              style={{ 
                width: '48px', height: '48px', borderRadius: '12px', 
                backgroundColor: 'rgba(249, 115, 22, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}
            >
              <Receipt size={24} style={{ color: '#f97316' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>Expense Information</h3>
              <p style={{ fontSize: '13px', color: textSecondary }}>Enter the payment and vendor details below</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label">{t('expenseTitle')} *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  placeholder="" 
                />
              </div>

              <div>
                <label className="label">{t('category')} *</label>
                <select 
                  className="input-field" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  required
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Amount (₹) *</label>
                <div className="relative">
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: textSecondary, fontSize: '14px' }}>₹</span>
                  <input 
                    type="number" 
                    min="0" 
                    className="input-field pl-9" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    required 
                    placeholder="" 
                  />
                </div>
              </div>

              <div>
                <label className="label">Date *</label>
                <div
                  className="input-field"
                  onClick={() => dateInputRef.current?.showPicker()}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '36px', position: 'relative', userSelect: 'none' }}
                >
                  <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#919eab', pointerEvents: 'none' }} />
                  <span style={{ flex: 1 }}>
                    {date ? format(parseISO(date), 'dd/MM/yyyy') : 'DD/MM/YYYY'}
                  </span>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('paidTo')} *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={paidTo} 
                  onChange={e => setPaidTo(e.target.value)} 
                  required 
                  placeholder="" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">{t('note')}</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  placeholder="" 
                  maxLength={200} 
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-end border-top" style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '24px' }}>
              <button 
                type="button" 
                onClick={() => navigate('/expenses')} 
                className="btn-ghost px-8 justify-center"
              >
                {t('cancel')}
              </button>
              <button 
                type="submit" 
                className="btn-primary px-8 justify-center"
                disabled={submitting}
              >
                <Save size={18} />
                {submitting ? 'Saving...' : (isEditing ? 'Update Expense' : 'Save Expense')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
