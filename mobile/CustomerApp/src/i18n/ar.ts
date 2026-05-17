// ترجمات التطبيق - العربية
export const ar = {
  // Auth
  auth: {
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني (اختياري)',
    forgotPassword: 'نسيت كلمة المرور؟',
    otpVerification: 'التحقق من الهاتف',
    otpSent: 'تم إرسال رمز التحقق',
    enterOtp: 'أدخل الرمز المرسل إلى',
    resendOtp: 'إعادة إرسال الرمز',
    verify: 'تحقق',
    verifyNow: 'تحقق الآن',
    haveAccount: 'لديك حساب بالفعل؟',
    noAccount: 'ليس لديك حساب؟',
    loginNow: 'سجل الدخول',
    registerNow: 'سجل الآن',
    welcomeBack: 'مرحباً بعودتك',
    createAccount: 'إنشاء حساب جديد',
  },

  // Home
  home: {
    findService: 'ابحث عن خدمة',
    categories: 'التصنيفات',
    nearbyTechnicians: 'فنيون قريبون',
    popularServices: 'الخدمات الشائعة',
    searchPlaceholder: 'ابحث عن سباك، كهربائي...',
    viewAll: 'عرض الكل',
    emergency: 'طارئ',
    emergencyDesc: 'طلب عاجل',
  },

  // Services
  services: {
    plumbing: 'سباكة',
    electricity: 'كهرباء',
    carpentry: 'نجارة',
    airCondition: 'تكييف وتبريد',
    painting: 'دهانات',
    cleaning: 'تنظيف',
    satellite: 'دش وأطباق',
    networks: 'إنترنت وشبكات',
    appliance: 'إصلاح أجهزة',
    aluminum: 'أعمال ألمنيوم',
    gypsum: 'جبس وديكور',
    moving: 'نقل عفش',
  },

  // Request
  request: {
    createRequest: 'طلب خدمة',
    myRequests: 'طلباتي',
    describe: 'صف المشكلة',
    selectLocation: 'اختر الموقع',
    uploadImages: 'رفع صور',
    budget: 'الميزانية المتوقعة',
    scheduleTime: 'حدد الوقت',
    instant: 'فوري',
    scheduled: 'مجدول',
    emergency: 'طارئ',
    send: 'إرسال الطلب',
    proposals: 'العروض المقدمة',
    acceptProposal: 'قبول العرض',
    rejectProposal: 'رفض',
    noProposals: 'لا توجد عروض بعد',
    waitingProposals: 'بانتظار عروض الفنيين...',
  },

  // Status
  status: {
    pending: 'معلق',
    active: 'نشط',
    accepted: 'مقبول',
    inProgress: 'جاري التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    expired: 'منتهي',
    online: 'متصل',
    offline: 'غير متصل',
    busy: 'مشغول',
  },

  // Chat
  chat: {
    title: 'المحادثة',
    typeMessage: 'اكتب رسالة...',
    send: 'إرسال',
    voiceNote: 'رسالة صوتية',
    attachImage: 'إرفاق صورة',
    sendLocation: 'إرسال الموقع',
  },

  // Wallet
  wallet: {
    title: 'المحفظة',
    balance: 'الرصيد الحالي',
    addBalance: 'إضافة رصيد',
    transactions: 'سجل المعاملات',
    egp: 'جنيه مصري',
    deposit: 'إيداع',
    withdrawal: 'سحب',
    payment: 'دفع',
    refund: 'استرداد',
    earning: 'أرباح',
  },

  // Profile
  profile: {
    title: 'حسابي',
    myProfile: 'ملفي الشخصي',
    edit: 'تعديل الملف',
    editProfile: 'تعديل البيانات',
    savedAddresses: 'مواقعي المحفوظة',
    myOrders: 'طلباتي',
    settings: 'الإعدادات',
    helpSupport: 'المساعدة والدعم',
    version: 'الإصدار',
  },

  // Common
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    edit: 'تعديل',
    back: 'رجوع',
    next: 'التالي',
    finish: 'إنهاء',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    retry: 'إعادة المحاولة',
    noData: 'لا توجد بيانات',
    egp: 'ج.م',
    km: 'كم',
    min: 'دقيقة',
    stars: 'نجوم',
    reviews: 'تقييم',
    confirm_action: 'هل أنت متأكد؟',
    yes: 'نعم',
    no: 'لا',
  },

  // Validation
  validation: {
    required: 'هذا الحقل مطلوب',
    invalidPhone: 'رقم الهاتف غير صحيح',
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    invalidOtp: 'رمز التحقق غير صحيح',
    minPassword: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    passwordMatch: 'كلمتا المرور غير متطابقتين',
    passwordMismatch: 'كلمتا المرور غير متطابقتين',
    minName: 'الاسم يجب أن يكون 3 أحرف على الأقل',
  },
};

export type Translation = typeof ar;
