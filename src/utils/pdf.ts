import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Payment, Owner } from '../store/useStore';

const PRIMARY = '#2F8D46';
const SECONDARY = '#1F1F1F';
const NEUTRAL = '#5F6368';

export const generateReceiptPDF = (
  payment: Payment,
  owner: Owner,
  societyName: string
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // ================= HEADER =================
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(SECONDARY);
  doc.text(societyName.toUpperCase(), pageW / 2, y, { align: 'center' });

  y += 8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(SECONDARY);
  doc.text('MAINTENANCE RECEIPT', pageW / 2, y, { align: 'center' });

  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(NEUTRAL);
  doc.text(`Receipt No: ${payment.receiptNumber}`, pageW / 2, y, {
    align: 'center',
  });

  y += 10;

  // Divider
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);

  y += 12;

  // ================= FIELD HELPER =================
  const drawField = (label: string, value: string, x: number, yPos: number) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(NEUTRAL);
    doc.text(label.toUpperCase(), x, yPos);

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(SECONDARY);
    doc.text(value, x, yPos + 5);
  };

  const col1 = margin;
  const col2 = pageW / 2 + 10;

  // ================= DETAILS =================
  // Row 1
  drawField('Receipt Number', String(payment.receiptNumber), col1, y);
  drawField('Date', format(new Date(payment.paidOn), 'dd MMM yyyy'), col2, y);

  y += 14;

  // Row 2
  drawField('Received From', owner.name, col1, y);
  drawField('Flat No.', owner.flat, col2, y);

  y += 14;

  // Row 3
  drawField('For Month', payment.month, col1, y);
  drawField('Contact', `+${owner.phone}`, col2, y);

  y += 14;

  // Thin Divider
  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  y += 16;

  // ================= AMOUNT BOX =================
  const boxWidth = 90;
  const boxHeight = 28;
  const boxX = (pageW - boxWidth) / 2;

  // Light background
  doc.setFillColor(249, 249, 249);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'F');

  // Primary border
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'S');

  // Amount label
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(NEUTRAL);
  doc.text('AMOUNT RECEIVED', pageW / 2, y + 9, { align: 'center' });

  // Amount value (centered, strong emphasis, no spaces, no /-)
  doc.setFont('courier', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(PRIMARY);
  doc.text(`₹${payment.amount}`, pageW / 2, y + 20, { align: 'center' });

  y += boxHeight + 12;

  // ================= STATUS =================
  const badgeWidth = 32;
  const badgeHeight = 9;
  const badgeX = (pageW - badgeWidth) / 2;

  // Light green pill background
  doc.setFillColor(232, 245, 233);
  doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 4.5, 4.5, 'F');

  // Text "PAID"
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(PRIMARY);
  doc.text('PAID', pageW / 2, y + 6, { align: 'center' });

  y += 24;

  // ================= FOOTER =================
  // Thin primary divider
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);

  y += 8;

  doc.setFont('courier', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(NEUTRAL);
  doc.text('Thank you for your timely payment.', pageW / 2, y, {
    align: 'center',
  });

  y += 6;

  doc.setFontSize(8);
  doc.text(
    `Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`,
    pageW / 2,
    y,
    { align: 'center' }
  );

  // ================= SAVE =================
  doc.save(`Receipt_${payment.receiptNumber}.pdf`);
};
