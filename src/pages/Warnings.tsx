import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { format, startOfMonth, isSameMonth, eachMonthOfInterval } from 'date-fns';
import { MessageSquareWarning, Copy, CheckCircle2, AlertCircle, Search, ChevronRight, Calendar, ChevronLeft } from 'lucide-react';

// Improved WhatsApp Brand Icon
const WhatsAppBrandIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.006L0 24l6.117-1.605a11.845 11.845 0 005.928 1.586h.005c6.632 0 12.028-5.396 12.031-12.03a11.83 11.83 0 00-3.522-8.508z"/>
  </svg>
);

export default function Warnings() {
  const { t } = useTranslation();
  const owners = useStore((state) => state.owners);
  const payments = useStore((state) => state.payments);
  const language = useStore((state) => state.language);
  const theme = useStore((state) => state.theme);
  const fetchOwners = useStore((state) => state.fetchOwners);
  const fetchPayments = useStore((state) => state.fetchPayments);

  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [warningLang, setWarningLang] = useState<'en' | 'mr'>(language);
  const [copied, setCopied] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [warningFromDate, setWarningFromDate] = useState(format(new Date(), 'yyyy-MM'));
  const [warningToDate, setWarningToDate] = useState(format(new Date(), 'yyyy-MM'));
  const [isManualDateOverride, setIsManualDateOverride] = useState(false);

  // Reset override on owner change
  useEffect(() => {
    setIsManualDateOverride(false);
    setWarningFromDate(format(new Date(), 'yyyy-MM'));
    setWarningToDate(format(new Date(), 'yyyy-MM'));
  }, [selectedOwnerId]);

  useEffect(() => {
    fetchOwners();
    fetchPayments();
  }, [fetchOwners, fetchPayments]);

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';

  // --- Custom Month Picker Component ---
  const MonthYearPicker = ({ 
    label, value, onChange, minDate, existingPayments, allowFuture, align = 'left'
  }: { 
    label: string, value: string, onChange: (val: string) => void,
    minDate?: string, existingPayments: any[], allowFuture?: boolean,
    align?: 'left' | 'right'
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
 
      if (viewYear < MIN_YEAR) return true;
 
      if (!allowFuture) {
        if (viewYear > todayYear || (viewYear === todayYear && idx > todayMonthIdx)) return true;
      }
 
      if (minDate) {
        const [minY, minM] = minDate.split('-').map(Number);
        const toValue = viewYear * 12 + (idx + 1);
        const fromValue = minY * 12 + minM;
        if (toValue < fromValue) return true;
      }
 
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
        <label className="label" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '4px' }}>{label}</label>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="input-field"
          style={{ 
            paddingLeft: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
            borderColor: isOpen ? '#f97316' : undefined,
            boxShadow: isOpen ? '0 0 0 3px rgba(249, 115, 22, 0.16)' : undefined,
            userSelect: 'none',
            position: 'relative'
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
              position: 'absolute', top: 'calc(100% + 8px)', 
              left: align === 'left' ? 0 : 'auto',
              right: align === 'right' ? 0 : 'auto',
              zIndex: 999,
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

  const filteredOwners = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return owners.filter(
      (o) => o.name.toLowerCase().includes(s) || o.flat.toLowerCase().includes(s)
    );
  }, [owners, searchTerm]);

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId);

  const pendingDetails = useMemo(() => {
    if (!selectedOwner) return null;
    
    const ownerPayments = payments.filter((p) => p.ownerId === selectedOwner.id);
    const explicitPending = ownerPayments.filter((p) => p.status === 'pending');
    
    const currentMonthStr = new Date().toLocaleString('en-US', { month: 'long' }) + ' ' + new Date().getFullYear();
    const hasPaidCurrentMonth = ownerPayments.some(
      (p) => p.status === 'paid' && p.month.includes(currentMonthStr)
    );
    const hasExplicitPendingCurrentMonth = explicitPending.some(p => p.month.includes(currentMonthStr));

    let totalAmount = explicitPending.reduce((sum, p) => sum + p.amount, 0);
    let pendingCount = explicitPending.length;
    let monthsList = explicitPending.map((p) => p.month).join(', ');

    if (!hasPaidCurrentMonth && !hasExplicitPendingCurrentMonth) {
      totalAmount += selectedOwner.monthlyAmount;
      pendingCount += 1;
      if (monthsList) {
        monthsList += `, ${currentMonthStr}`;
      } else {
        monthsList = currentMonthStr;
      }
    }

    if (pendingCount === 0) return null;

    return { monthsList, totalAmount, pendingCount };
  }, [selectedOwner, payments]);

  const manualPendingDetails = useMemo(() => {
    if (!selectedOwner) return null;
    try {
      const start = new Date(warningFromDate + '-01T12:00:00');
      const end = new Date(warningToDate + '-01T12:00:00');
      if (start > end) return null;
      const count = eachMonthOfInterval({ start, end }).length;
      const period = isSameMonth(start, end)
        ? format(start, 'MMMM yyyy')
        : `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
      return {
        monthsList: period,
        pendingCount: count,
        totalAmount: count * selectedOwner.monthlyAmount
      };
    } catch {
      return null;
    }
  }, [warningFromDate, warningToDate, selectedOwner]);

  const activePendingDetails = isManualDateOverride ? manualPendingDetails : pendingDetails;

  const getAutoGeneratedMessage = (amount: number, details: any) => {
    if (!selectedOwner || !details) return '';
    const name = (warningLang === 'mr' && selectedOwner.nameMr) ? selectedOwner.nameMr : selectedOwner.name;
    const { monthsList, pendingCount } = details;

    if (warningLang === 'mr') {
      return `प्रिय ${name},\n\nतुमचे खालील महिन्यांचे देखभाल शुल्क प्रलंबित आहे:\nमहिने: ${monthsList}\nएकूण प्रलंबित महिने: ${pendingCount}\nएकूण रक्कम: ₹${amount.toLocaleString('en-IN')}\n\nकृपया भविष्यातील गैरसोय टाळण्यासाठी तुमचे देखभाल शुल्क वेळेवर भरा. धन्यवाद.`;
    } else {
      return `Dear ${name},\n\nYour maintenance for the following months is pending:\nMonths: ${monthsList}\nTotal pending months: ${pendingCount}\nTotal amount due: ₹${amount.toLocaleString('en-IN')}\n\nPlease pay the maintenance on time to avoid inconvenience. Thank you.`;
    }
  };

  useEffect(() => {
    if (activePendingDetails) {
      setCustomAmount(0);
      setCustomMessage(getAutoGeneratedMessage(0, activePendingDetails));
    } else {
      setCustomAmount(0);
      setCustomMessage('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwnerId, pendingDetails, manualPendingDetails, isManualDateOverride, warningLang]);

  const handleAmountChange = (newAmount: number) => {
    setCustomAmount(newAmount);
    setCustomMessage(getAutoGeneratedMessage(newAmount, activePendingDetails));
  };

  const handleCopy = async () => {
    if (!customMessage) return;
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedOwner || !customMessage) return;
    const encodedMessage = encodeURIComponent(customMessage);
    // Assuming owner.phone might have '91' prefix or not, we should ensure it starts with 91
    let phone = selectedOwner.phone.replace(/\D/g, '');
    if (!phone.startsWith('91') && phone.length === 10) {
      phone = '91' + phone;
    }
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Direct native app scheme
      window.location.href = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
      
      // Fallback: If custom scheme isn't handled within 300ms, redirect to the universal api link
      setTimeout(() => {
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`, '_blank');
      }, 300);
    } else {
      // Desktop: Open standard WhatsApp API link in new tab
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, marginBottom: '3px' }}>
            {t('warnings')}
          </h1>
          <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.4 }}>
            Issue complaints or warnings for pending maintenance dues
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Selection */}
        <div className="space-y-6 flex flex-col">
          <div className="card p-5 flex flex-col" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, maxHeight: '500px' }}>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#919eab' }}
              />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '42px', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb' }}
              />
            </div>
            
            <div className="overflow-y-auto pr-2 mobile-scroll flex-1 space-y-3">
              {filteredOwners.length === 0 ? (
                <p style={{ fontSize: '13px', color: textSecondary, textAlign: 'center', padding: '20px 0' }}>
                  {searchTerm ? t('noResultsFound') : 'No owners found.'}
                </p>
              ) : (
                filteredOwners.map((owner) => {
                  const initials = owner.name
                    .split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                  const colors = ['#f97316', '#00b8d9', '#ffab00', '#ff5630', '#8e33ff'];
                  const avatarColor = colors[owner.name.charCodeAt(0) % colors.length];
                  const isSelected = selectedOwnerId === owner.id;

                  return (
                    <div
                      key={owner.id}
                      onClick={() => setSelectedOwnerId(owner.id)}
                      className="p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3"
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: isSelected 
                          ? (isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.08)') 
                          : (isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb'),
                        border: `1px solid ${isSelected ? '#f97316' : borderColor}`,
                        boxShadow: isSelected ? '0 4px 12px rgba(249, 115, 22, 0.12)' : 'none',
                        paddingLeft: '16px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(249, 115, 22, 0.04)';
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(249, 115, 22, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb';
                          e.currentTarget.style.borderColor = borderColor;
                        }
                      }}
                    >
                      {/* Left vertical indicator stripe */}
                      {isSelected && (
                        <div 
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            backgroundColor: '#f97316',
                          }}
                        />
                      )}

                      <div
                        style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          backgroundColor: `${avatarColor}20`,
                          color: avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, lineHeight: 1.3 }} className="truncate">
                          {language === 'mr' && owner.nameMr ? owner.nameMr : owner.name}
                        </h3>
                        <div className="flex items-center mt-1.5">
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
                            }}
                          >
                            {t('flat')}: {owner.flat}
                          </span>
                        </div>
                      </div>
                      
                      {isSelected && <ChevronRight size={16} style={{ color: '#f97316' }} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedOwner && (
            <div className="card p-5 animate-in fade-in zoom-in-95 duration-300" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, overflow: 'visible' }}>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={20} style={{ color: '#ff5630' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Pending Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <MonthYearPicker 
                  label={t('fromMonth')} 
                  value={warningFromDate} 
                  onChange={(val) => {
                    setIsManualDateOverride(true);
                    setWarningFromDate(val);
                    if (warningToDate < val) setWarningToDate(val);
                  }}
                  existingPayments={[]} // Do not block paid months for warnings if admin wants to send them anyway
                />
                <MonthYearPicker 
                  label={t('toMonth')} 
                  value={warningToDate} 
                  onChange={(val) => {
                    setIsManualDateOverride(true);
                    setWarningToDate(val);
                  }}
                  minDate={warningFromDate}
                  existingPayments={[]}
                  allowFuture
                  align="right"
                />
              </div>
              
              {activePendingDetails ? (
                <div className="space-y-4 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                  <div>
                    <p style={{ fontSize: '12px', color: textSecondary, marginBottom: '2px' }}>{t('monthsRemaining')}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>{activePendingDetails.pendingCount} ({activePendingDetails.monthsList})</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: textSecondary, marginBottom: '4px' }}>{t('totalAmount')} (₹)</p>
                    <input
                      type="number"
                      value={customAmount || ''}
                      onChange={(e) => handleAmountChange(Number(e.target.value))}
                      className="input-field"
                      style={{ 
                        fontWeight: 700, fontSize: '16px', color: '#ff5630',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
                        padding: '8px 12px',
                        maxWidth: '150px'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#00a76f', fontWeight: 600 }}>{t('noPendingDues')}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Preview and Actions */}
        <div className="card p-5 flex flex-col h-full" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>{t('preview')}</h3>
            
            {/* Language Switcher */}
            <div className="flex items-center gap-1" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => setWarningLang('en')}
                style={{
                  padding: '4px 10px', fontSize: '12px', fontWeight: 600, borderRadius: '6px',
                  backgroundColor: warningLang === 'en' ? (isDark ? '#333d48' : '#ffffff') : 'transparent',
                  color: warningLang === 'en' ? textPrimary : textSecondary,
                  boxShadow: warningLang === 'en' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                EN
              </button>
              <button
                onClick={() => setWarningLang('mr')}
                style={{
                  padding: '4px 10px', fontSize: '12px', fontWeight: 600, borderRadius: '6px',
                  backgroundColor: warningLang === 'mr' ? (isDark ? '#333d48' : '#ffffff') : 'transparent',
                  color: warningLang === 'mr' ? textPrimary : textSecondary,
                  boxShadow: warningLang === 'mr' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                MR
              </button>
            </div>
          </div>

          <div
            className="flex-1 rounded-xl mb-5 flex flex-col"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
              border: `1px solid ${borderColor}`,
              minHeight: '220px',
            }}
          >
            {customMessage || selectedOwner ? (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full h-full resize-none p-4 mobile-scroll"
                style={{ 
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px', 
                  color: textPrimary, 
                  lineHeight: 1.6 
                }}
                placeholder="Warning message..."
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4" style={{ color: textSecondary }}>
                <MessageSquareWarning size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px' }}>Select an owner with pending dues to generate warning message</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <button
              disabled={!customMessage}
              onClick={handleCopy}
              className="flex-1 flex justify-center items-center gap-2 rounded-xl transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f4f6f8',
                color: textPrimary,
                padding: '12px',
                fontWeight: 600, fontSize: '14px',
                opacity: !customMessage ? 0.5 : 1,
                cursor: !customMessage ? 'not-allowed' : 'pointer'
              }}
            >
              {copied ? <CheckCircle2 size={18} color="#00a76f" /> : <Copy size={18} />}
              {copied ? t('textCopied') : t('copyText')}
            </button>
            
            <button
              disabled={!customMessage}
              onClick={handleSendWhatsApp}
              className="flex-1 flex justify-center items-center gap-2 rounded-xl transition-all"
              style={{
                border: '1px solid rgba(37,211,102,0.4)',
                backgroundColor: isDark ? 'rgba(37,211,102,0.08)' : 'rgba(37,211,102,0.05)',
                color: isDark ? '#25d366' : '#1e9f4d',
                padding: '12px',
                fontWeight: 700, fontSize: '14px',
                opacity: !customMessage ? 0.5 : 1,
                cursor: !customMessage ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (customMessage) {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(37,211,102,0.16)' : 'rgba(37,211,102,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (customMessage) {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(37,211,102,0.08)' : 'rgba(37,211,102,0.05)';
                }
              }}
            >
              <WhatsAppBrandIcon size={18} />
              {t('sendViaWhatsapp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
