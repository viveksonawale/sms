import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OwnerService } from '../api/owner.service';
import { ExpenseService } from '../api/expense.service';
import { MaintenanceService } from '../api/maintenance.service';

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
  transactionId?: string;
  fromDate?: string;
  toDate?: string;
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
  fetchOwners: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchPayments: () => Promise<void>;
  addOwner: (owner: Owner) => Promise<void>;
  updateOwner: (id: string, updated: Partial<Owner>) => Promise<void>;
  deleteOwner: (id: string) => Promise<void>;
  addPayment: (payment: Payment, extra?: { fromDate: string; toDate: string }) => Promise<void>;
  updatePayment: (id: string, updated: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  nextReceiptNumber: () => string;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, updated: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const isShopUnit = (flatStr?: string): boolean => {
  if (!flatStr) return false;
  const s = flatStr.trim().toLowerCase();
  return s.includes('shop') || s.startsWith('s-') || s.startsWith('s ') || /^s\d+/i.test(s);
};

export const getStandardMonthlyRate = (flatStr?: string): number => {
  return isShopUnit(flatStr) ? 1200 : 3000;
};

const mapOwnerToFrontend = (o: any): Owner => {
  const standardRate = getStandardMonthlyRate(o.flatNumber);
  const monthlyAmount = (o.monthlyAmount && Number(o.monthlyAmount) !== 2500)
    ? Number(o.monthlyAmount)
    : standardRate;

  return {
    id: String(o.id),
    name: o.name,
    nameMr: o.nameInMarathi || '',
    flat: o.flatNumber,
    phone: o.phoneNo,
    email: '',
    monthlyAmount,
    joinedDate: new Date().toISOString().split('T')[0],
    avatar: null,
  };
};

const mapExpenseToFrontend = (e: any): Expense => ({
  id: String(e.id),
  title: e.title,
  category: e.category,
  amount: Number(e.amount),
  date: e.date,
  paidTo: e.paidTo,
  note: e.note || '',
  addedOn: e.date + 'T00:00:00Z',
});

const mapMaintenanceToFrontend = (m: any): Payment => {
  let monthStr = 'Maintenance';
  if (m.fromDate) {
    // Parse fromDate string safely
    const [year, month] = m.fromDate.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    monthStr = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    if (m.toDate && m.fromDate !== m.toDate) {
      const [toYear, toMonth] = m.toDate.split('-').map(Number);
      const toD = new Date(toYear, toMonth - 1, 1);
      if (m.fromDate.substring(0, 7) !== m.toDate.substring(0, 7)) {
        monthStr = `${d.toLocaleString('en-US', { month: 'short', year: 'numeric' })} - ${toD.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
      }
    }
  }
  return {
    id: String(m.id),
    ownerId: String(m.ownerId),
    month: monthStr,
    amount: Number(m.amount),
    paidOn: m.paymentDate ? m.paymentDate + 'T12:00:00Z' : '',
    receiptNumber: m.status === 'PAID' ? `RCP-${String(m.id).padStart(4, '0')}` : '',
    status: m.status === 'PAID' ? 'paid' : 'pending',
    transactionId: m.transactionId || undefined,
    fromDate: m.fromDate || undefined,
    toDate: m.toDate || undefined,
  };
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      owners: [],
      payments: [],
      expenses: [],
      isAuthenticated: false,
      theme: 'light',
      language: 'en',
      societyName: 'Shri Sai Apartment',
      receiptCounter: 1,
      sidebarCollapsed: false,

      setAuth: (status) => set({ isAuthenticated: status }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSocietyName: (societyName) => set({ societyName }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      fetchOwners: async () => {
        try {
          const ownersData = await OwnerService.getAllOwners();
          set({ owners: ownersData.map(mapOwnerToFrontend) });
        } catch (err) {
          console.error('Failed to fetch owners:', err);
        }
      },

      fetchExpenses: async () => {
        try {
          const expensesData = await ExpenseService.getAllExpenses();
          set({ expenses: expensesData.map(mapExpenseToFrontend) });
        } catch (err) {
          console.error('Failed to fetch expenses:', err);
        }
      },

      fetchPayments: async () => {
        try {
          const owners = get().owners;
          const allMaintenances = await Promise.all(
            owners.map((o) => MaintenanceService.getByOwner(Number(o.id)).catch(() => []))
          );
          const flatMaintenances = allMaintenances.flat();
          set({ payments: flatMaintenances.map(mapMaintenanceToFrontend) });
        } catch (err) {
          console.error('Failed to fetch payments:', err);
        }
      },

      addOwner: async (owner) => {
        // Strip all non-digit characters, then remove leading country code 91 if present
        const rawDigits = owner.phone.replace(/\D/g, '');
        const phoneNo = rawDigits.startsWith('91') && rawDigits.length > 10
          ? rawDigits.slice(2)
          : rawDigits;
        const req = {
          name: owner.name,
          nameInMarathi: owner.nameMr || '',
          flatNumber: owner.flat,
          phoneNo,
        };
        await OwnerService.createOwner(req);
        await get().fetchOwners();
      },

      updateOwner: async (id, updated) => {
        const current = get().owners.find((o) => o.id === id);
        if (!current) return;
        const merged = { ...current, ...updated };
        // Strip all non-digit characters, then remove leading country code 91 if present
        const rawDigits = merged.phone.replace(/\D/g, '');
        const phoneNo = rawDigits.startsWith('91') && rawDigits.length > 10
          ? rawDigits.slice(2)
          : rawDigits;
        const req = {
          name: merged.name,
          nameInMarathi: merged.nameMr || '',
          flatNumber: merged.flat,
          phoneNo,
        };
        await OwnerService.updateOwner(Number(id), req);
        await get().fetchOwners();
      },

      deleteOwner: async (id) => {
        await OwnerService.deleteOwner(Number(id));
        await get().fetchOwners();
        await get().fetchPayments();
      },

      addPayment: async (payment, extra) => {
        if (!extra) return;
        const [tY, tM] = extra.toDate.split('-').map(Number);
        const fromDateStr = `${extra.fromDate}-01`;
        const lastDay = new Date(tY, tM, 0).getDate();
        const toDateStr = `${extra.toDate}-${String(lastDay).padStart(2, '0')}`;

        // 1. Create Maintenance
        const maintenance = await MaintenanceService.createMaintenance({
          ownerId: Number(payment.ownerId),
          fromDate: fromDateStr,
          toDate: toDateStr,
          amount: Number(payment.amount),
        });

        // 2. Mark as paid
        await MaintenanceService.markAsPaid(
          maintenance.id,
          payment.transactionId
        );

        // 3. Reload payments list from backend
        await get().fetchPayments();
      },

      updatePayment: async (id, updated) => {
        console.warn('Update payment not directly supported by backend, simulating via delete and re-create.');
        const current = get().payments.find((p) => p.id === id);
        if (!current) return;
        const merged = { ...current, ...updated };
        
        // Delete old
        await MaintenanceService.deleteMaintenance(Number(id));
        
        // Parse month range from merged.month or assume standard single month
        let fromDateStr = new Date().toISOString().split('T')[0];
        let toDateStr = fromDateStr;
        if (merged.month) {
          const parts = merged.month.split(' - ');
          const parsePart = (part: string) => {
            const date = new Date(part);
            return isNaN(date.getTime()) ? new Date() : date;
          };
          const start = parsePart(parts[0]);
          const end = parts.length === 2 ? parsePart(parts[1]) : start;
          fromDateStr = start.toISOString().split('T')[0];
          const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
          toDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }

        const maintenance = await MaintenanceService.createMaintenance({
          ownerId: Number(merged.ownerId),
          fromDate: fromDateStr,
          toDate: toDateStr,
          amount: Number(merged.amount),
        });

        await MaintenanceService.markAsPaid(maintenance.id, merged.transactionId);
        await get().fetchPayments();
      },

      deletePayment: async (id) => {
        await MaintenanceService.deleteMaintenance(Number(id));
        await get().fetchPayments();
      },

      nextReceiptNumber: () => {
        const counter = get().receiptCounter;
        const year = new Date().getFullYear();
        return `RCP-${year}-${String(counter).padStart(3, '0')}`;
      },

      addExpense: async (expense) => {
        const req = {
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          date: expense.date,
          paidTo: expense.paidTo,
          note: expense.note,
        };
        await ExpenseService.createExpense(req);
        await get().fetchExpenses();
      },

      updateExpense: async (id, updated) => {
        const current = get().expenses.find((e) => e.id === id);
        if (!current) return;
        const merged = { ...current, ...updated };
        const req = {
          title: merged.title,
          category: merged.category,
          amount: merged.amount,
          date: merged.date,
          paidTo: merged.paidTo,
          note: merged.note,
        };
        await ExpenseService.updateExpense(Number(id), req);
        await get().fetchExpenses();
      },

      deleteExpense: async (id) => {
        await ExpenseService.deleteExpense(Number(id));
        await get().fetchExpenses();
      },
    }),
    {
      name: 'society-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        language: state.language,
        societyName: state.societyName,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
