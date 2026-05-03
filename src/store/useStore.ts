import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Owner {
  id: string;
  name: string;
  nameMr?: string;
  flat: string;
  phone: string;
  email: string;
  monthlyAmount: number;
  joinedDate: string;
  avatar: string | null;
}

export interface Payment {
  id: string;
  ownerId: string;
  month: string;
  amount: number;
  paidOn: string;
  receiptNumber: string;
  status: 'paid' | 'pending';
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  note: string;
  addedOn: string;
}

interface StoreState {
  owners: Owner[];
  payments: Payment[];
  expenses: Expense[];
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'mr';
  societyName: string;
  receiptCounter: number;
  sidebarCollapsed: boolean;
  setAuth: (status: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'mr') => void;
  setSocietyName: (name: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addOwner: (owner: Owner) => void;
  updateOwner: (id: string, updated: Partial<Owner>) => void;
  deleteOwner: (id: string) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updated: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  nextReceiptNumber: () => string;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updated: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
}

const seedOwners: Owner[] = [
  { id: '1', name: 'Rahul Sharma', nameMr: 'राहुल शर्मा', flat: 'A-101', phone: '919876543210', email: 'rahul@example.com', monthlyAmount: 1500, joinedDate: '2023-01-15', avatar: null },
  { id: '2', name: 'Priya Desai', nameMr: 'प्रिया देसाई', flat: 'A-102', phone: '919876543211', email: 'priya@example.com', monthlyAmount: 1500, joinedDate: '2023-02-20', avatar: null },
  { id: '3', name: 'Amit Patel', nameMr: 'अमित पटेल', flat: 'B-201', phone: '919876543212', email: 'amit@example.com', monthlyAmount: 2000, joinedDate: '2022-11-05', avatar: null },
  { id: '4', name: 'Sneha Joshi', nameMr: 'स्नेहा जोशी', flat: 'B-202', phone: '919876543213', email: 'sneha@example.com', monthlyAmount: 2000, joinedDate: '2024-03-10', avatar: null },
  { id: '5', name: 'Vikram Singh', nameMr: 'विक्रम सिंग', flat: 'C-301', phone: '919876543214', email: 'vikram@example.com', monthlyAmount: 2500, joinedDate: '2021-08-22', avatar: null },
  { id: '6', name: 'Anjali Kadam', nameMr: 'अंजली कदम', flat: 'C-302', phone: '919876543215', email: 'anjali@example.com', monthlyAmount: 2500, joinedDate: '2023-05-18', avatar: null },
];

const seedPayments: Payment[] = [
  { id: 'p1', ownerId: '1', month: 'April 2025', amount: 1500, paidOn: '2025-04-05T10:00:00Z', receiptNumber: 'RCP-2025-001', status: 'paid' },
  { id: 'p2', ownerId: '3', month: 'April 2025', amount: 2000, paidOn: '2025-04-10T14:30:00Z', receiptNumber: 'RCP-2025-002', status: 'paid' },
  { id: 'p3', ownerId: '5', month: 'April 2025', amount: 2500, paidOn: '2025-04-12T09:15:00Z', receiptNumber: 'RCP-2025-003', status: 'paid' },
];

const seedExpenses: Expense[] = [
  { id: 'e1', title: 'Lift Repair', category: 'Maintenance & Repair', amount: 4500, date: '2025-04-02', paidTo: 'Ganesh Electricals', note: 'Monthly service and wire replace', addedOn: '2025-04-02T10:00:00Z' },
  { id: 'e2', title: 'Sweeper Salary', category: 'Cleaning & Housekeeping', amount: 2000, date: '2025-04-05', paidTo: 'Ramesh Bhai', note: 'March 2025 Salary', addedOn: '2025-04-05T10:00:00Z' },
  { id: 'e3', title: 'Society Light Bill', category: 'Electricity', amount: 1800, date: '2025-04-10', paidTo: 'MSEDCL', note: 'Bill for common areas', addedOn: '2025-04-10T10:00:00Z' },
  { id: 'e4', title: 'Diwali Decoration', category: 'Festival & Events', amount: 3200, date: '2024-11-10', paidTo: 'Local Shop', note: 'Lights and flowers', addedOn: '2024-11-10T10:00:00Z' },
  { id: 'e5', title: 'Watchman Salary', category: 'Security', amount: 5000, date: '2025-04-05', paidTo: 'Suresh Patil', note: 'March 2025 Salary', addedOn: '2025-04-05T10:00:00Z' },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      owners: seedOwners,
      payments: seedPayments,
      expenses: seedExpenses,
      isAuthenticated: false,
      theme: 'light',
      language: 'en',
      societyName: 'Shri Sai Apartment',
      receiptCounter: 4, // next available: RCP-2025-004
      sidebarCollapsed: false,
      setAuth: (status) => set({ isAuthenticated: status }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSocietyName: (societyName) => set({ societyName }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      addOwner: (owner) => set((state) => ({ owners: [...state.owners, owner] })),
      updateOwner: (id, updated) =>
        set((state) => ({
          owners: state.owners.map((o) => (o.id === id ? { ...o, ...updated } : o)),
        })),
      deleteOwner: (id) =>
        set((state) => ({
          owners: state.owners.filter((o) => o.id !== id),
          payments: state.payments.filter((p) => p.ownerId !== id),
        })),
      addPayment: (payment) =>
        set((state) => ({ payments: [...state.payments, payment] })),
      updatePayment: (id, updated) =>
        set((state) => ({
          payments: state.payments.map((p) => (p.id === id ? { ...p, ...updated } : p)),
        })),
      deletePayment: (id) =>
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        })),
      nextReceiptNumber: () => {
        // Pure read — counter incremented separately via addPayment wrapper
        const counter = get().receiptCounter;
        const year = new Date().getFullYear();
        return `RCP-${year}-${String(counter).padStart(3, '0')}`;
      },
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      updateExpense: (id, updated) =>
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updated } : e)),
        })),
      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'society-storage',
    }
  )
);
