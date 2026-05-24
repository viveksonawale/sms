// --- Auth ---
export interface AuthRequest {
  username?: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

// --- Dashboard ---
export interface DashboardResponse {
  totalOwners: number;
  totalCollected: number;
  totalPending: number;
  totalExpenses: number;
  currentMonthCollection: number;
  currentMonthExpenses: number;
}

// --- Expense ---
export interface ExpenseRequest {
  title: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  note?: string;
}

export interface ExpenseResponse {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  note?: string;
}

// --- Maintenance ---
export interface MaintenanceRequest {
  ownerId: number;
  fromDate: string; // LocalDate (yyyy-MM-dd)
  toDate: string; // LocalDate (yyyy-MM-dd)
  amount: number;
}

export interface MaintenanceResponse {
  id: number;
  ownerId: number;
  ownerName: string;
  flatNumber: string;
  fromDate: string; // LocalDate (yyyy-MM-dd)
  toDate: string; // LocalDate (yyyy-MM-dd)
  numberOfMonths: number;
  amount: number;
  status: string; // PENDING, PAID, OVERDUE
  paymentDate?: string; // LocalDate (yyyy-MM-dd)
  transactionId?: string;
}

// --- Owner ---
export interface OwnerRequest {
  name: string;
  nameInMarathi?: string;
  flatNumber: string;
  phoneNo: string;
}

export interface OwnerResponse {
  id: number;
  name: string;
  nameInMarathi?: string;
  flatNumber: string;
  phoneNo: string;
}

// --- Receipt ---
export interface ReceiptResponse {
  id: number;
  receiptNumber: string;
  generatedAt: string; // LocalDateTime
  ownerName: string;
  flatNumber: string;
  fromDate: string; // LocalDate (yyyy-MM-dd)
  toDate: string; // LocalDate (yyyy-MM-dd)
  amount: number;
}
