import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Core labels
      owner: 'Owner',
      receipt: 'Receipt',
      history: 'History',
      paid: 'Paid',
      pending: 'Pending',
      send: 'Send',
      month: 'Month',
      fromMonth: 'From Month',
      toMonth: 'To Month',
      flat: 'Flat',
      contact: 'Contact',

      // Nav
      dashboard: 'Dashboard',
      owners: 'Owners',
      settings: 'Settings',
      logout: 'Logout',
      adminPortal: 'Admin Portal',
      quickStats: 'Quick Stats',

      // Actions
      addOwner: 'Add Owner',
      editOwner: 'Edit Owner',
      deleteOwner: 'Delete Owner',
      markAsPaid: 'Mark as Paid',
      confirmPayment: 'Confirm Payment',
      downloadReceipt: 'Download Receipt',
      sendViaWhatsapp: 'Send via WhatsApp',
      viewDetails: 'View Details',

      // Stats
      totalOwners: 'Total Owners',
      paidThisMonth: 'Paid This Month',
      totalCollected: 'Total Collected',

      // Form fields
      fullName: 'Full Name',
      fullNameMr: 'Name (Marathi)',
      phone: 'Phone',
      email: 'Email',
      monthlyAmount: 'Monthly Amount',
      joinedDate: 'Joined Date',
      amount: 'Amount',
      paidOn: 'Paid On',
      status: 'Status',
      actions: 'Actions',

      // Buttons
      cancel: 'Cancel',
      save: 'Save',
      login: 'Login',
      username: 'Username',
      password: 'Password',

      // Placeholders / hints
      searchPlaceholder: 'Search by name or flat…',
      signInPortal: 'Sign in to your admin portal',
      invalidCredentials: 'Invalid credentials',
      signingIn: 'Signing in...',

      // Empty states
      noHistory: 'No payment history yet.',
      noOwners: 'No owners found.',
      noResultsFound: 'No results found',
      tryDifferentSearch: 'Try a different name or flat number',
      addFirstOwner: 'Add your first owner to get started',

      // Titles/Text
      collectionProgress: 'Collection Progress',
      ownerInfo: 'Owner Info',
      newOwnerRegistration: 'New Owner Registration',
      requiredFieldsNotice: 'All fields marked with * are required',
      fillDetailsBelow: 'Fill in the details below',
      maintenanceReceipt: 'Maintenance Receipt',
      receiptNo: 'Receipt No.',

      // Confirm
      deleteConfirmText: 'Are you sure? This will permanently remove the owner and all their payment records.',

      // Toast messages
      receiptGenerated: 'Receipt downloaded successfully!',
      paymentConfirmed: 'Payment confirmed and recorded!',

      // Settings
      theme: 'Theme',
      language: 'Language',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      societyName: 'Society Name',
      managePreferences: 'Manage your society preferences',
      societyNameUpdated: 'Society name updated!',
      update: 'Update',
      personalizeInterface: 'Personalize your interface',
      chooseLanguage: 'Choose your language',

      // Expenses
      otherExpenses: 'Other Expenses',
      addExpense: 'Add Expense',
      expenseTitle: 'Expense Title',
      category: 'Category',
      paidTo: 'Paid To',
      note: 'Note',
      totalThisMonth: 'Total This Month',
      totalThisYear: 'Total This Year',
      breakdown: 'Breakdown by Category',
      noExpenses: 'No expenses recorded yet',

      // Warnings
      warnings: 'Warnings',
      issueWarning: 'Issue Warning',
      selectOwner: 'Select Owner',
      copyText: 'Copy Text',
      noPendingDues: 'No pending dues for this owner.',
      sendWarning: 'Send Warning',
      monthsRemaining: 'Total Months Pending',
      textCopied: 'Message copied to clipboard!',

      // Reports & Financials
      reports: 'Reports & Financials',
      financialOverview: 'Financial Overview',
      yearlyAndMonthlySummary: 'Yearly & Monthly collections, society expenses, and member payment ledger.',
      yearlyCollection: 'Yearly Collection',
      monthlyCollection: 'Monthly Collection',
      yearlyExpense: 'Yearly Expense',
      monthlyExpense: 'Monthly Expense',
      netBalance: 'Net Balance',
      memberLedger: 'Member Payment Ledger',
      whoPaidWhat: 'Who Paid What',
      printReport: 'Print / Export',
      financialYear: 'Financial Year',
      calendarYear: 'Calendar Year',
      allMonths: 'All Months',
      selectPeriod: 'Select Period',
      printOptions: 'Print & Export Options',
      customRange: 'Custom Range',
      includeMemberLedger: 'Include Member Payment History',
      includeExpenses: 'Include Society Expense Breakdown',
      includeMonthlySummary: 'Include Monthly Financial Statement',
      printNow: 'Print / Save PDF',
      downloadCsv: 'Download CSV',
      totalPaid: 'Total Paid',
      allClear: 'All Clear',
      duesPending: 'Dues Pending',
      noDataForPeriod: 'No records found for the selected period.',
      societyAuditedReport: 'Annual Financial & Maintenance Audit Statement',
    },
  },
  mr: {
    translation: {
      // Core labels
      owner: 'मालक',
      receipt: 'देयक',
      history: 'इतिहास',
      paid: 'देय',
      pending: 'थकबाकी',
      send: 'पाठवा',
      month: 'महिना',
      fromMonth: 'पासून (महिना)',
      toMonth: 'पर्यंत (महिना)',
      flat: 'फ्लॅट',
      contact: 'संपर्क',

      // Nav
      dashboard: 'डॅशबोर्ड',
      owners: 'मालक',
      settings: 'सेटिंग्ज',
      logout: 'बाहेर पडा',
      adminPortal: 'प्रशासन पोर्टल',
      quickStats: 'त्वरित आकडेवारी',

      // Actions
      addOwner: 'मालक जोडा',
      editOwner: 'मालक संपादित करा',
      deleteOwner: 'मालक हटवा',
      markAsPaid: 'देय म्हणून चिन्हांकित करा',
      confirmPayment: 'पेमेंटची पुष्टी करा',
      downloadReceipt: 'देयक डाउनलोड करा',
      sendViaWhatsapp: 'WhatsApp द्वारे पाठवा',
      viewDetails: 'तपशील पहा',

      // Stats
      totalOwners: 'एकूण मालक',
      paidThisMonth: 'या महिन्यात दिले',
      totalCollected: 'एकूण जमा',

      // Form fields
      fullName: 'पूर्ण नाव',
      fullNameMr: 'नाव (मराठी)',
      phone: 'फोन',
      email: 'ईमेल',
      monthlyAmount: 'मासिक रक्कम',
      joinedDate: 'सामील होण्याची तारीख',
      amount: 'रक्कम',
      paidOn: 'रोजी दिले',
      status: 'स्थिती',
      actions: 'क्रिया',

      // Buttons
      cancel: 'रद्द करा',
      save: 'जतन करा',
      login: 'लॉगिन',
      username: 'वापरकर्तानाव',
      password: 'पासवर्ड',

      // Placeholders
      searchPlaceholder: 'नाव किंवा फ्लॅट शोधा...',
      signInPortal: 'तुमच्या अ‍ॅडमिन पोर्टलमध्ये साइन इन करा',
      invalidCredentials: 'अवैध ओळखपत्रे. admin / society@123 वापरून पहा',
      signingIn: 'साइन इन करत आहे...',

      // Empty states
      noHistory: 'कोणताही पेमेंट इतिहास आढळला नाही.',
      noOwners: 'कोणतेही मालक आढळले नाहीत.',
      noResultsFound: 'कोणतेही निकाल आढळले नाहीत',
      tryDifferentSearch: 'वेगळे नाव किंवा फ्लॅट क्रमांक वापरून पहा',
      addFirstOwner: 'सुरुवात करण्यासाठी आपला पहिला मालक जोडा',

      // Titles/Text
      collectionProgress: 'संग्रह प्रगती',
      ownerInfo: 'मालकाची माहिती',
      newOwnerRegistration: 'नवीन मालक नोंदणी',
      requiredFieldsNotice: '* चिन्हांकित सर्व फील्ड आवश्यक आहेत',
      fillDetailsBelow: 'खालील तपशील भरा',
      maintenanceReceipt: 'देखभाल पावती',
      receiptNo: 'पावती क्र.',

      // Confirm
      deleteConfirmText: 'तुम्हाला खात्री आहे का? हे मालक आणि त्यांचे सर्व पेमेंट कायमचे हटवले जातील.',

      // Toast messages
      receiptGenerated: 'देयक यशस्वीरित्या डाउनलोड केले!',
      paymentConfirmed: 'पेमेंट पुष्टी झाले आणि नोंदवले गेले!',

      // Settings
      theme: 'थीम',
      language: 'भाषा',
      lightMode: 'लाइट मोड',
      darkMode: 'डार्क मोड',
      societyName: 'सोसायटीचे नाव',
      managePreferences: 'आपली सोसायटी प्राधान्ये व्यवस्थापित करा',
      societyNameUpdated: 'सोसायटीचे नाव अद्यतनित केले!',
      update: 'अद्यतनित करा',
      personalizeInterface: 'आपला इंटरफेस सानुकूलित करा',
      chooseLanguage: 'आपली भाषा निवडा',

      // Expenses
      otherExpenses: 'इतर खर्च',
      addExpense: 'खर्च जोडा',
      expenseTitle: 'खर्चाचे नाव',
      category: 'श्रेणी',
      paidTo: 'कोणाला दिले',
      note: 'नोंद',
      totalThisMonth: 'या महिन्याचा खर्च',
      totalThisYear: 'या वर्षाचा खर्च',
      breakdown: 'श्रेणीनुसार खर्च',
      noExpenses: 'अद्याप कोणताही खर्च नाही',

      // Warnings
      warnings: 'इशारे',
      issueWarning: 'इशारा द्या',
      selectOwner: 'मालक निवडा',
      copyText: 'मजकूर कॉपी करा',
      noPendingDues: 'या मालकाची कोणतीही थकबाकी नाही.',
      sendWarning: 'इशारा पाठवा',
      monthsRemaining: 'एकूण प्रलंबित महिने',
      textCopied: 'संदेश क्लिपबोर्डवर कॉपी केला!',

      // Reports & Financials
      reports: 'अहवाल आणि हिशोब',
      financialOverview: 'वित्तीय आढावा',
      yearlyAndMonthlySummary: 'वार्षिक आणि मासिक जमा, सोसायटीचा खर्च आणि सभासद खातेवही.',
      yearlyCollection: 'वार्षिक जमा',
      monthlyCollection: 'मासिक जमा',
      yearlyExpense: 'वार्षिक खर्च',
      monthlyExpense: 'मासिक खर्च',
      netBalance: 'शिल्लक रक्कम',
      memberLedger: 'सभासद पेमेंट खातेवही',
      whoPaidWhat: 'कोणी किती भरले',
      printReport: 'अहवाल मुद्रित करा',
      financialYear: 'आर्थिक वर्ष',
      calendarYear: 'कॅलेंडर वर्ष',
      allMonths: 'सर्व महिने',
      selectPeriod: 'कालावधी निवडा',
      printOptions: 'प्रिंट आणि एक्सपोर्ट पर्याय',
      customRange: 'सानुकूल कालावधी',
      includeMemberLedger: 'सभासद पेमेंट इतिहास समाविष्ट करा',
      includeExpenses: 'सोसायटी खर्च तपशील समाविष्ट करा',
      includeMonthlySummary: 'मासिक वित्तीय विवरण समाविष्ट करा',
      printNow: 'अहवाल प्रिंट करा',
      downloadCsv: 'CSV डाउनलोड करा',
      totalPaid: 'एकूण भरलेली रक्कम',
      allClear: 'सर्व भरले',
      duesPending: 'थकबाकी शिल्लक',
      noDataForPeriod: 'निवडलेल्या कालावधीसाठी कोणताही डेटा आढळला नाही.',
      societyAuditedReport: 'वार्षिक वित्तीय आणि देखभाल लेखापरीक्षण अहवाल',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
