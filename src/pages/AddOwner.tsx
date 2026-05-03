import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, ArrowLeft, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../context/ToastContext';

export default function AddOwner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addOwner = useStore((state) => state.addOwner);
  const theme = useStore((state) => state.theme);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    nameMr: '',
    flat: '',
    phone: '',
    email: '',
    monthlyAmount: '',
    joinedDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required.';
    if (!formData.flat.trim()) newErrors.flat = 'Flat number is required.';
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be exactly 10 digits.';
    if (!formData.email.includes('@')) newErrors.email = 'Enter a valid email address.';
    if (!formData.monthlyAmount || Number(formData.monthlyAmount) <= 0)
      newErrors.monthlyAmount = 'Enter a valid monthly amount.';
    if (!formData.joinedDate) newErrors.joinedDate = 'Joined date is required.';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const newOwner = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      nameMr: formData.nameMr.trim() || undefined,
      flat: formData.flat.trim().toUpperCase(),
      phone: `91${formData.phone}`,
      email: formData.email.trim().toLowerCase(),
      monthlyAmount: Number(formData.monthlyAmount),
      joinedDate: formData.joinedDate,
      avatar: null,
    };
    addOwner(newOwner);
    toast(`${newOwner.name} has been added!`, 'success');
    navigate('/');
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1c252e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1c252e';
  const textSecondary = isDark ? '#919eab' : '#637381';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#f4f6f8';
  const cardShadow = isDark
    ? '0 0 2px 0 rgba(0,0,0,0.3), 0 12px 24px -4px rgba(0,0,0,0.2)'
    : '0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)';

  const fields = [
    { id: 'name', label: t('fullName'), type: 'text', key: 'name', placeholder: 'e.g. Rahul Sharma', span2: true, required: true },
    { id: 'nameMr', label: t('fullNameMr'), type: 'text', key: 'nameMr', placeholder: 'e.g. राहुल शर्मा (Optional)', span2: true, required: false },
    { id: 'flat', label: t('flat'), type: 'text', key: 'flat', placeholder: 'e.g. A-101', span2: false, required: true },
    { id: 'email', label: t('email'), type: 'email', key: 'email', placeholder: 'owner@example.com', span2: false, required: true },
    { id: 'monthlyAmount', label: `${t('monthlyAmount')} (₹)`, type: 'number', key: 'monthlyAmount', placeholder: '1500', span2: false, required: true },
    { id: 'joinedDate', label: t('joinedDate'), type: 'date', key: 'joinedDate', placeholder: '', span2: false, required: true },
  ];

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="space-y-6 page-enter">
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
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: textPrimary }}>{t('addOwner')}</h1>
          <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>{t('fillDetailsBelow')}</p>
        </div>
      </div>

      {/* Form Card */}
      <div style={{ backgroundColor: cardBg, borderRadius: '12px', boxShadow: cardShadow, overflow: 'hidden' }}>
        {/* Card top accent */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #007867, #00a76f, #5be49b)' }} />

        <div style={{ padding: '28px' }}>
          {/* Card header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            paddingBottom: '20px', marginBottom: '24px',
            borderBottom: `1px solid ${borderColor}`,
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: 'rgba(0,167,111,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={20} style={{ color: '#00a76f' }} />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>{t('newOwnerRegistration')}</p>
              <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>{t('requiredFieldsNotice')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {fields.map(({ id, label, type, key, placeholder, span2, required }) => (
                <div key={id} style={{ gridColumn: span2 ? '1 / -1' : undefined }}>
                  <label htmlFor={id} className="label">
                    {label}{required && <span style={{ color: '#ff5630', marginLeft: '2px' }}>*</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id={id}
                      type={type}
                      placeholder={placeholder}
                      value={String(formData[key as keyof typeof formData])}
                      onChange={(e) => {
                        setFormData({ ...formData, [key]: e.target.value });
                        if (errors[key]) setErrors({ ...errors, [key]: '' });
                      }}
                      className="input-field"
                      style={{
                        ...(errors[key] ? { borderColor: '#ff5630' } : {}),
                        ...(type === 'date' ? { paddingLeft: '36px' } : {})
                      }}
                    />
                    {type === 'date' && <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#919eab', pointerEvents: 'none', zIndex: 10 }} />}
                  </div>
                  {errors[key] && (
                    <p style={{ fontSize: '12px', color: '#ff5630', marginTop: '5px' }}>{errors[key]}</p>
                  )}
                </div>
              ))}

              {/* Phone with +91 prefix */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="phone" className="label">
                  {t('phone')}<span style={{ color: '#ff5630', marginLeft: '2px' }}>*</span>
                </label>
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
                    id="phone"
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: val });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className="input-field"
                    style={{
                      flex: 1,
                      borderRadius: '0 8px 8px 0',
                      ...(errors.phone ? { borderColor: '#ff5630' } : {}),
                    }}
                  />
                </div>
                {errors.phone && (
                  <p style={{ fontSize: '12px', color: '#ff5630', marginTop: '5px' }}>{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
              paddingTop: '24px', marginTop: '8px',
              borderTop: `1px solid ${borderColor}`,
            }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-ghost"
              >
                {t('cancel')}
              </button>
              <button type="submit" className="btn-primary">
                <UserPlus size={15} />
                {t('save')} Owner
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
