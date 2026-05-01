import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  ArrowLeft, Trash2, Download, MessageCircle, FileText,
  Pencil, X, CheckCircle2, ChevronLeft, ChevronRight,
  Phone, Mail, Calendar, IndianRupee, Home,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateReceiptPDF } from '../utils/pdf';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const PAGE_SIZE = 10;

export default function OwnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const owner = useStore((state) => state.owners.find((o) => o.id === id));
  const allPayments = useStore((state) => state.payments);
  const ownerPayments = useMemo(() => allPayments.filter((p) => p.ownerId === id), [allPayments, id]);
  const addPayment = useStore((state) => state.addPayment);
  const deleteOwner = useStore((state) => state.deleteOwner);
  const updateOwner = useStore((state) => state.updateOwner);
  const nextReceiptNumber = useStore((state) => state.nextReceiptNumber);
  const societyName = useStore((state) => state.societyName);
  const language = useStore((state) => state.language);
  const theme = useStore((state) => state.theme);

  const [paymentFromDate, setPaymentFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [paymentToDate, setPaymentToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [paymentAmount, setPaymentAmount] = useState(owner?.monthlyAmount ?? 0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';
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
  const colors = ['#00a76f', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
  const avatarColor = colors[owner.name.charCodeAt(0) % colors.length];

  const handleMarkAsPaid = (e: React.FormEvent) => {
    e.preventDefault();
    const period = `${format(new Date(paymentFromDate), 'dd MMM yyyy')} - ${format(new Date(paymentToDate), 'dd MMM yyyy')}`;
    if (ownerPayments.some((p) => p.month === period && p.status === 'paid')) {
      toast(`Payment for ${period} is already recorded.`, 'error');
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
              {t('flat')}: <span style={{ color: '#00a76f', fontWeight: 700 }}>{owner.flat}</span>
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
                  backgroundColor: isEditing ? '#f4f6f8' : 'rgba(0,167,111,0.1)',
                  color: isEditing ? '#637381' : '#00a76f',
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
                    <input
                      type={type}
                      value={String(editForm[key as keyof typeof editForm] || '')}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="input-field"
                      required={required !== false}
                    />
                  </div>
                ))}
                <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: '4px' }}>
                  {t('save')} Changes
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { icon: Phone, label: t('phone'), value: owner.phone },
                  { icon: Mail, label: t('email'), value: owner.email },
                  { icon: IndianRupee, label: t('monthlyAmount'), value: `₹${owner.monthlyAmount.toLocaleString('en-IN')}` },
                  { icon: Calendar, label: t('joinedDate'), value: format(new Date(owner.joinedDate), 'dd MMMM yyyy') },
                  { icon: Home, label: t('flat'), value: owner.flat },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: 'rgba(0,167,111,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: '#00a76f' }} />
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
            border: '1px solid rgba(0,167,111,0.2)',
            boxShadow: cardShadow, overflow: 'hidden',
          }}>
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #007867, #00a76f, #5be49b)' }} />
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(0,167,111,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={15} style={{ color: '#00a76f' }} />
                </div>
                {t('markAsPaid')}
              </h2>
              <form onSubmit={handleMarkAsPaid} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label">{t('fromDate')}</label>
                    <input type="date" value={paymentFromDate} onChange={(e) => setPaymentFromDate(e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">{t('toDate')}</label>
                    <input type="date" value={paymentToDate} onChange={(e) => setPaymentToDate(e.target.value)} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="label">{t('amount')} (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <IndianRupee size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }} />
                    <input
                      type="number" value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="input-field" style={{ paddingLeft: '36px', fontWeight: 700, fontSize: '16px' }}
                      min={0} required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full justify-center" style={{ marginTop: '4px', padding: '12px' }}>
                  <CheckCircle2 size={15} />
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
            <div style={{ backgroundColor: cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: cardShadow, border: `1px solid rgba(0,167,111,0.2)` }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #007867, #00a76f, #5be49b)' }} />
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
                      padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(0,184,217,0.4)',
                      backgroundColor: 'rgba(0,184,217,0.08)', color: '#006c9c',
                      fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <MessageCircle size={14} />
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
                backgroundColor: 'rgba(0,167,111,0.1)', color: '#00a76f', borderRadius: '20px',
              }}>
                {sortedPayments.length} records
              </span>
            </div>

            {sortedPayments.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  backgroundColor: 'rgba(0,167,111,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <FileText size={24} style={{ color: '#00a76f' }} />
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
                        <tr key={payment.id}>
                          <td className="table-td" style={{ fontWeight: 700, color: '#00a76f', whiteSpace: 'nowrap' }}>{payment.receiptNumber}</td>
                          <td className="table-td" style={{ whiteSpace: 'nowrap', maxWidth: '180px' }}>{payment.month}</td>
                          <td className="table-td" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>₹{payment.amount.toLocaleString('en-IN')}</td>
                          <td className="table-td" style={{ color: textSecondary, whiteSpace: 'nowrap' }}>
                            {format(new Date(payment.paidOn), 'dd MMM yyyy')}
                          </td>
                          <td className="table-td">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <button
                                onClick={() => { generateReceiptPDF(payment, owner, societyName); toast(t('receiptGenerated'), 'success'); }}
                                title={t('downloadReceipt')}
                                style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#919eab' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,167,111,0.1)'; e.currentTarget.style.color = '#00a76f'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#919eab'; }}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => sendWhatsApp(payment)}
                                title={t('sendViaWhatsapp')}
                                style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#919eab' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,184,217,0.1)'; e.currentTarget.style.color = '#006c9c'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#919eab'; }}
                              >
                                <MessageCircle size={14} />
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
                            backgroundColor: page === currentPage ? '#00a76f' : 'transparent',
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
    </div>
  );
}
