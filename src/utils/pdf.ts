import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Payment, Owner } from '../store/useStore';

const PRIMARY = '#2F8D46';
const SECONDARY = '#1F1F1F';
const NEUTRAL = '#5F6368';

export const generateReceiptPDF = (payment: Payment, owner: Owner) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Society Name
  doc.setFont('courier', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(SECONDARY);
  doc.text('SHREE GANESH SOCIETY', pageW / 2, 18, { align: 'center' });

  // Receipt sub-heading
  doc.setFont('courier', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(SECONDARY);
  doc.text('MAINTENANCE RECEIPT', pageW / 2, 27, { align: 'center' });

  // Receipt number badge in header
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(NEUTRAL);
  doc.text(`RCP-${payment.receiptNumber}`, pageW / 2, 37, { align: 'center' });

  // === DIVIDER ===
  let y = 45;
  doc.setDrawColor(47, 141, 70); // #2F8D46
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageW - margin, y);
  y += 15;

  // === BODY FIELDS ===
  const drawField = (label: string, value: string, x: number, cy: number) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(NEUTRAL);
    doc.text(label.toUpperCase(), x, cy);

    doc.setFont('courier', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(SECONDARY);
    doc.text(value, x, cy + 6);
  };

  // Row 1: Receipt No + Date
  drawField('Receipt Number', `RCP-${payment.receiptNumber}`, margin, y);
  drawField('Date', format(new Date(payment.paidOn), 'dd MMMM yyyy'), pageW / 2, y);
  y += 22;

  // Divider line
  doc.setDrawColor(224, 224, 224); // #E0E0E0
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Row 2: Owner Name + Flat
  drawField('Received From', owner.name, margin, y);
  drawField('Flat No.', owner.flat, pageW / 2, y);
  y += 22;

  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Row 3: Month + Phone
  drawField('For the Month of', payment.month, margin, y);
  drawField('Contact', `+${owner.phone}`, pageW / 2, y);
  y += 22;

  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // === AMOUNT BOX ===
  const boxY = y;
  doc.setFillColor(249, 249, 249); // #F9F9F9
  doc.roundedRect(margin, boxY, pageW - margin * 2, 24, 3, 3, 'F');
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, boxY, pageW - margin * 2, 24, 3, 3, 'S');

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(NEUTRAL);
  doc.text('AMOUNT RECEIVED', margin + 8, boxY + 8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(PRIMARY);
  doc.text(`\u20B9${payment.amount.toLocaleString('en-IN')}/-`, margin + 8, boxY + 19);

  doc.setFont('courier', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(NEUTRAL);
  doc.text('Society Maintenance Payment', pageW - margin - 5, boxY + 14, { align: 'right' });

  y = boxY + 35;

  // === STATUS BADGE ===
  doc.setFillColor(232, 245, 233); // #E8F5E9
  doc.roundedRect(margin, y, 35, 9, 2, 2, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(47, 141, 70); // #2F8D46
  doc.text('✓  PAID', margin + 5, y + 6);

  y += 20;

  // === FOOTER ===
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('courier', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(NEUTRAL);
  doc.text('Thank you for your timely payment.', pageW / 2, y, { align: 'center' });

  y += 7;
  doc.setFontSize(8);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageW / 2, y, { align: 'center' });

  doc.save(`${payment.receiptNumber}.pdf`);
};
