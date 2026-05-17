import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db } from './index';
import { logger } from '../logger';

// ─── helpers ────────────────────────────────────────────────────────────────

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const hoursAgo = (n: number): string => {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// ─── ids (stable so we can cross-reference) ─────────────────────────────────

const ADMIN_ID    = uuidv4();
const CAT_IDS     = Array.from({ length: 14 }, () => uuidv4());
const CUST_IDS    = Array.from({ length: 10 }, () => uuidv4());
const TECH_IDS    = Array.from({ length: 8  }, () => uuidv4());
const TECH_PRF    = Array.from({ length: 8  }, () => uuidv4()); // technician_profile rows
const REQ_IDS     = Array.from({ length: 20 }, () => uuidv4());
const PROP_IDS    = Array.from({ length: 12 }, () => uuidv4());
const REVIEW_IDS  = Array.from({ length: 8  }, () => uuidv4());
const WALLET_IDS  = [...CUST_IDS, ...TECH_IDS, ADMIN_ID].map(() => uuidv4());

// ─── 1. service categories ───────────────────────────────────────────────────

const seedCategories = async (): Promise<void> => {
  const cats = [
    ['سباكة',           'Plumbing',         '🔧', '#2196F3', 1 ],
    ['كهرباء',          'Electricity',       '⚡', '#FFC107', 2 ],
    ['نجارة',           'Carpentry',         '🪚', '#795548', 3 ],
    ['تكييف وتبريد',    'Air Conditioning',  '❄️', '#00BCD4', 4 ],
    ['دهانات',          'Painting',          '🎨', '#9C27B0', 5 ],
    ['تنظيف',           'Cleaning',          '🧹', '#4CAF50', 6 ],
    ['دش وأطباق',       'Satellite',         '📡', '#FF5722', 7 ],
    ['إنترنت وشبكات',   'Networks',          '🌐', '#3F51B5', 8 ],
    ['إصلاح أجهزة',     'Appliance Repair',  '🔌', '#607D8B', 9 ],
    ['أعمال ألمنيوم',   'Aluminum Work',     '🪟', '#9E9E9E', 10],
    ['جبس وديكور',      'Gypsum & Decor',    '🏠', '#FF9800', 11],
    ['نقل عفش',         'Moving',            '🚚', '#F44336', 12],
    ['حراسة وأمن',      'Security',          '🔐', '#212121', 13],
    ['بستنة وحدائق',    'Gardening',         '🌿', '#8BC34A', 14],
  ];

  for (let i = 0; i < cats.length; i++) {
    const [nameAr, nameEn, icon, color, sort] = cats[i];
    await db.query(
      `INSERT IGNORE INTO service_categories (id, name_ar, name_en, icon_url, color_hex, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [CAT_IDS[i], nameAr, nameEn, icon, color, sort]
    );
  }
  logger.info('✓ service_categories');
};

// ─── 2. admin user ──────────────────────────────────────────────────────────

const seedAdmin = async (hash: string): Promise<void> => {
  await db.query(
    `INSERT IGNORE INTO users (id, phone, email, password_hash, full_name, role, status, phone_verified, created_at)
     VALUES (?, ?, ?, ?, ?, 'admin', 'active', 1, ?)`,
    [ADMIN_ID, '+201000000000', 'admin@cityservices.eg', hash, 'مدير النظام', daysAgo(60)]
  );
  await db.query(
    `INSERT IGNORE INTO wallets (id, user_id, balance, total_earned) VALUES (?, ?, 1250.00, 1250.00)`,
    [WALLET_IDS[WALLET_IDS.length - 1], ADMIN_ID]
  );
  logger.info('✓ admin user  →  admin@cityservices.eg / Admin@12345');
};

// ─── 3. customers ───────────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: 'محمد أحمد السيد',   phone: '+201111111101', email: 'c1@test.eg' },
  { name: 'فاطمة علي حسن',     phone: '+201111111102', email: 'c2@test.eg' },
  { name: 'أحمد محمود عبدالله',phone: '+201111111103', email: 'c3@test.eg' },
  { name: 'سارة خالد إبراهيم', phone: '+201111111104', email: 'c4@test.eg' },
  { name: 'عمر يوسف مصطفى',    phone: '+201111111105', email: 'c5@test.eg' },
  { name: 'نور الهدى رمضان',   phone: '+201111111106', email: 'c6@test.eg' },
  { name: 'كريم عادل فتحي',    phone: '+201111111107', email: 'c7@test.eg' },
  { name: 'هبة الله سامي',     phone: '+201111111108', email: 'c8@test.eg' },
  { name: 'يوسف طارق نجيب',    phone: '+201111111109', email: 'c9@test.eg' },
  { name: 'منى إبراهيم شوقي',  phone: '+201111111110', email: 'c10@test.eg'},
];

const seedCustomers = async (hash: string): Promise<void> => {
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const c = CUSTOMERS[i];
    await db.query(
      `INSERT IGNORE INTO users (id, phone, email, password_hash, full_name, role, status, phone_verified, created_at)
       VALUES (?, ?, ?, ?, ?, 'customer', 'active', 1, ?)`,
      [CUST_IDS[i], c.phone, c.email, hash, c.name, daysAgo(50 - i * 3)]
    );
    await db.query(
      `INSERT IGNORE INTO customer_profiles (id, user_id, default_address, default_latitude, default_longitude)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), CUST_IDS[i],
       'برج العرب - الإسكندرية',
       30.8168 + (Math.random() - 0.5) * 0.05,
       29.7745 + (Math.random() - 0.5) * 0.05]
    );
    await db.query(
      `INSERT IGNORE INTO wallets (id, user_id, balance) VALUES (?, ?, ?)`,
      [WALLET_IDS[i], CUST_IDS[i], (Math.random() * 500).toFixed(2)]
    );
  }
  logger.info('✓ customers (10)');
};

// ─── 4. technicians ─────────────────────────────────────────────────────────

const TECHNICIANS = [
  { name: 'خالد عبدالرحمن',  phone: '+201222222201', cats: [0, 1],    rating: 4.8, jobs: 142, exp: 8,  status: 'approved' },
  { name: 'محمود حسني',      phone: '+201222222202', cats: [3, 1],    rating: 4.6, jobs: 98,  exp: 5,  status: 'approved' },
  { name: 'سامي الشافعي',    phone: '+201222222203', cats: [0],       rating: 4.9, jobs: 210, exp: 12, status: 'approved' },
  { name: 'أحمد الديب',      phone: '+201222222204', cats: [2, 10],   rating: 4.3, jobs: 55,  exp: 4,  status: 'approved' },
  { name: 'وليد فؤاد',       phone: '+201222222205', cats: [4, 5],    rating: 4.7, jobs: 77,  exp: 6,  status: 'approved' },
  { name: 'مصطفى النجار',    phone: '+201222222206', cats: [2],       rating: 4.5, jobs: 31,  exp: 3,  status: 'approved' },
  { name: 'حسام الدين',      phone: '+201222222207', cats: [6, 7],    rating: 4.2, jobs: 18,  exp: 2,  status: 'pending'  },
  { name: 'ياسر السيد',      phone: '+201222222208', cats: [8, 9],    rating: 0,   jobs: 0,   exp: 1,  status: 'pending'  },
];

const seedTechnicians = async (hash: string): Promise<void> => {
  for (let i = 0; i < TECHNICIANS.length; i++) {
    const t = TECHNICIANS[i];
    await db.query(
      `INSERT IGNORE INTO users (id, phone, password_hash, full_name, role, status, phone_verified, created_at)
       VALUES (?, ?, ?, ?, 'technician', ?, 1, ?)`,
      [TECH_IDS[i], t.phone, hash, t.name,
       t.status === 'approved' ? 'active' : 'pending_verification',
       daysAgo(40 - i * 4)]
    );

    await db.query(
      `INSERT IGNORE INTO technician_profiles
         (id, user_id, bio, years_experience, availability, verification_status,
          current_latitude, current_longitude, coverage_radius_km,
          rating_average, rating_count, total_jobs, completed_jobs, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 15, ?, ?, ?, ?, ?)`,
      [TECH_PRF[i], TECH_IDS[i],
       `فني متخصص في ${TECHNICIANS[i].cats.map(c => ['سباكة','كهرباء','نجارة','تكييف','دهانات','تنظيف','دش','شبكات','إصلاح','ألمنيوم','جبس','نقل','حراسة','بستنة'][c]).join(' و ')}`,
       t.exp,
       t.status === 'approved' ? 'online' : 'offline',
       t.status,
       30.8168 + (Math.random() - 0.5) * 0.08,
       29.7745 + (Math.random() - 0.5) * 0.08,
       t.rating, Math.ceil(t.jobs * 0.8), t.jobs, t.jobs,
       i < 3 ? 1 : 0]
    );

    for (const catIdx of t.cats) {
      await db.query(
        `INSERT IGNORE INTO technician_services (id, technician_id, category_id, price_from, price_to, is_primary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), TECH_PRF[i], CAT_IDS[catIdx],
         100 + catIdx * 20, 300 + catIdx * 40, t.cats.indexOf(catIdx) === 0 ? 1 : 0]
      );
    }

    const earned = t.jobs * 180;
    await db.query(
      `INSERT IGNORE INTO wallets (id, user_id, balance, total_earned)
       VALUES (?, ?, ?, ?)`,
      [WALLET_IDS[CUST_IDS.length + i], TECH_IDS[i],
       (earned * 0.3).toFixed(2), earned.toFixed(2)]
    );
  }
  logger.info('✓ technicians (8)');
};

// ─── 5. service requests ────────────────────────────────────────────────────

type ReqStatus = 'pending'|'accepted'|'in_progress'|'completed'|'cancelled'|'expired';

interface ReqDef {
  custIdx:  number;
  catIdx:   number;
  techIdx?: number;
  status:   ReqStatus;
  daysBack: number;
  price?:   number;
  type?:    'instant'|'scheduled'|'emergency';
}

const REQUESTS: ReqDef[] = [
  { custIdx:0, catIdx:0, techIdx:0, status:'completed', daysBack:30, price:250, type:'instant'   },
  { custIdx:0, catIdx:1, techIdx:1, status:'completed', daysBack:25, price:400, type:'instant'   },
  { custIdx:1, catIdx:3, techIdx:1, status:'completed', daysBack:20, price:600, type:'scheduled' },
  { custIdx:1, catIdx:0, techIdx:2, status:'completed', daysBack:18, price:180, type:'instant'   },
  { custIdx:2, catIdx:4, techIdx:4, status:'completed', daysBack:15, price:350, type:'instant'   },
  { custIdx:2, catIdx:2, techIdx:3, status:'completed', daysBack:12, price:500, type:'instant'   },
  { custIdx:3, catIdx:0, techIdx:0, status:'completed', daysBack:10, price:220, type:'emergency' },
  { custIdx:3, catIdx:5, techIdx:4, status:'completed', daysBack: 8, price:300, type:'instant'   },
  { custIdx:4, catIdx:1, techIdx:1, status:'in_progress', daysBack:1, type:'instant'             },
  { custIdx:4, catIdx:3, techIdx:1, status:'accepted',    daysBack:1, type:'scheduled'           },
  { custIdx:5, catIdx:0,            status:'pending',     daysBack:0, type:'instant'             },
  { custIdx:5, catIdx:2,            status:'pending',     daysBack:0, type:'instant'             },
  { custIdx:6, catIdx:1, techIdx:2, status:'in_progress', daysBack:1, type:'emergency'           },
  { custIdx:6, catIdx:4,            status:'pending',     daysBack:0, type:'instant'             },
  { custIdx:7, catIdx:0, techIdx:0, status:'cancelled',  daysBack:5, type:'instant'              },
  { custIdx:7, catIdx:3,            status:'expired',    daysBack:3, type:'instant'              },
  { custIdx:8, catIdx:2, techIdx:3, status:'completed',  daysBack:7, price:420, type:'instant'   },
  { custIdx:8, catIdx:5, techIdx:4, status:'completed',  daysBack:4, price:280, type:'instant'   },
  { custIdx:9, catIdx:1,            status:'pending',    daysBack:0, type:'instant'              },
  { custIdx:9, catIdx:0, techIdx:2, status:'accepted',   daysBack:1, type:'instant'              },
];

const REQUEST_TITLES = [
  'إصلاح تسريب مياه في الحمام',
  'تركيب لمبات وإصلاح دوايات',
  'صيانة مكيف سبليت',
  'سباكة مطبخ - تبديل حنفية',
  'دهان شقة كاملة',
  'تنظيف شامل قبل الانتقال',
  'إصلاح طارئ - قطع كهرباء',
  'تنظيف مكيفات موسمي',
  'تركيب نقاط كهرباء جديدة',
  'إصلاح بالوعة مسدودة',
  'دهان غرفة أطفال',
  'تركيب أبواب خشب جديدة',
  'إصلاح تكييف مركزي',
  'سباكة سطح - تسريب',
  'تنظيف خزان مياه',
  'توصيل شبكة انترنت',
  'نجارة - تصليح دولاب',
  'دهانات خارجية للمبنى',
  'كهرباء - تحديث لوحة التوزيع',
  'إصلاح مضخة مياه',
];

const seedRequests = async (): Promise<void> => {
  for (let i = 0; i < REQUESTS.length; i++) {
    const r = REQUESTS[i];
    const techUserId = r.techIdx !== undefined ? TECH_IDS[r.techIdx] : null;
    const techPrfId  = r.techIdx !== undefined ? TECH_PRF[r.techIdx]  : null;
    const proposalId = r.status !== 'pending' && r.status !== 'expired' && r.techIdx !== undefined
      ? PROP_IDS[i] : null;

    const createdAt  = daysAgo(r.daysBack);
    const expiresAt  = r.status === 'expired'
      ? daysAgo(r.daysBack - 1)
      : daysAgo(r.daysBack - 2);

    await db.query(
      `INSERT IGNORE INTO service_requests
         (id, customer_id, category_id, title, description, request_type, status,
          address, latitude, longitude, budget_from, budget_to, final_price,
          payment_method, accepted_proposal_id, accepted_technician_id,
          expires_at, completed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        REQ_IDS[i],
        CUST_IDS[r.custIdx],
        CAT_IDS[r.catIdx],
        REQUEST_TITLES[i],
        'يرجى الحضور في أسرع وقت ممكن لمعاينة المشكلة وتقديم عرض السعر.',
        r.type || 'instant',
        r.status,
        'برج العرب - الإسكندرية - شارع الجمهورية',
        30.8168 + (Math.random() - 0.5) * 0.05,
        29.7745 + (Math.random() - 0.5) * 0.05,
        100, 500,
        r.price || null,
        'cash',
        proposalId,
        techUserId,
        expiresAt,
        r.status === 'completed' ? hoursAgo(r.daysBack * 20) : null,
        createdAt,
      ]
    );

    // status history
    const historySteps: Array<[ReqStatus, string]> = [['pending', createdAt]];
    if (['accepted','in_progress','completed','cancelled'].includes(r.status))
      historySteps.push(['accepted', hoursAgo(r.daysBack * 24 - 2)]);
    if (['in_progress','completed'].includes(r.status))
      historySteps.push(['in_progress', hoursAgo(r.daysBack * 20)]);
    if (r.status === 'completed')
      historySteps.push(['completed', hoursAgo(r.daysBack * 16)]);
    if (r.status === 'cancelled')
      historySteps.push(['cancelled', hoursAgo(r.daysBack * 22)]);
    if (r.status === 'expired')
      historySteps.push(['expired', hoursAgo(r.daysBack * 20)]);

    for (const [st, at] of historySteps) {
      await db.query(
        `INSERT IGNORE INTO request_status_history (id, request_id, status, created_at)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), REQ_IDS[i], st, at]
      );
    }
  }
  logger.info('✓ service_requests (20) + status_history');
};

// ─── 6. proposals ───────────────────────────────────────────────────────────

const seedProposals = async (): Promise<void> => {
  for (let i = 0; i < REQUESTS.length; i++) {
    const r = REQUESTS[i];
    if (r.techIdx === undefined) continue;
    if (r.status === 'expired' || r.status === 'cancelled') continue;

    const propStatus = r.status === 'pending'
      ? 'pending'
      : r.status === 'accepted' || r.status === 'in_progress' || r.status === 'completed'
        ? 'accepted'
        : 'pending';

    await db.query(
      `INSERT IGNORE INTO request_proposals
         (id, request_id, technician_id, proposed_price, estimated_duration_minutes, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        PROP_IDS[i],
        REQ_IDS[i],
        TECH_IDS[r.techIdx],
        r.price ? r.price - 20 : 200,
        60 + Math.floor(Math.random() * 120),
        'يمكنني الحضور للمعاينة والبدء فوراً. أعمل باحترافية وضمان على الشغل.',
        propStatus,
        hoursAgo(r.daysBack * 24 - 3),
      ]
    );
  }
  logger.info('✓ proposals');
};

// ─── 7. reviews ─────────────────────────────────────────────────────────────

const COMMENTS = [
  'شغل ممتاز والفني محترف جداً، وصل في الوقت المحدد.',
  'سريع ونظيف، سعر معقول وأنصح بيه.',
  'تمام جداً، حل المشكلة بسرعة.',
  'متميز ودقيق، إيد شاطرة.',
  'كويس بس أتأخر شوية.',
  'ممتاز وأنصح بيه لأي حد.',
  'شغل تمام ومريح.',
  'عالي الكفاءة ومحترف.',
];

const seedReviews = async (): Promise<void> => {
  let rev = 0;
  for (let i = 0; i < REQUESTS.length && rev < REVIEW_IDS.length; i++) {
    const r = REQUESTS[i];
    if (r.status !== 'completed' || r.techIdx === undefined) continue;

    const rating = Math.min(5, Math.max(3, Math.round(TECHNICIANS[r.techIdx].rating)));
    await db.query(
      `INSERT IGNORE INTO reviews (id, request_id, customer_id, technician_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        REVIEW_IDS[rev],
        REQ_IDS[i],
        CUST_IDS[r.custIdx],
        TECH_IDS[r.techIdx],
        rating,
        COMMENTS[rev % COMMENTS.length],
        hoursAgo(r.daysBack * 12),
      ]
    );
    rev++;
  }
  logger.info(`✓ reviews (${rev})`);
};

// ─── 8. transactions ────────────────────────────────────────────────────────

const seedTransactions = async (): Promise<void> => {
  let count = 0;
  for (let i = 0; i < REQUESTS.length; i++) {
    const r = REQUESTS[i];
    if (r.status !== 'completed' || !r.price || r.techIdx === undefined) continue;

    const techWalletId  = WALLET_IDS[CUST_IDS.length + r.techIdx];
    const adminWalletId = WALLET_IDS[WALLET_IDS.length - 1];
    const commission    = +(r.price * 0.1).toFixed(2);
    const earning       = +(r.price - commission).toFixed(2);
    const at            = hoursAgo(r.daysBack * 16);

    // earning → technician wallet
    await db.query(
      `INSERT IGNORE INTO transactions
         (id, wallet_id, user_id, request_id, type, status, amount,
          balance_before, balance_after, description, created_at)
       VALUES (?, ?, ?, ?, 'earning', 'completed', ?, 0, ?, ?, ?)`,
      [uuidv4(), techWalletId, TECH_IDS[r.techIdx], REQ_IDS[i],
       earning, earning, `أرباح طلب - ${REQUEST_TITLES[i]}`, at]
    );

    // commission → admin wallet
    await db.query(
      `INSERT IGNORE INTO transactions
         (id, wallet_id, user_id, request_id, type, status, amount,
          balance_before, balance_after, description, created_at)
       VALUES (?, ?, ?, ?, 'commission', 'completed', ?, 0, ?, ?, ?)`,
      [uuidv4(), adminWalletId, ADMIN_ID, REQ_IDS[i],
       commission, commission, `عمولة منصة - ${REQUEST_TITLES[i]}`, at]
    );
    count++;
  }
  logger.info(`✓ transactions (${count * 2})`);
};

// ─── 9. notifications ───────────────────────────────────────────────────────

const seedNotifications = async (): Promise<void> => {
  const notes = [
    [CUST_IDS[0], 'request_accepted', 'تم قبول طلبك',      'وافق الفني على طلبك وسيصل قريباً',         daysAgo(25)],
    [CUST_IDS[0], 'request_completed','تم إنهاء الطلب',    'تم إنهاء العمل بنجاح. يرجى تقييم الفني',  daysAgo(24)],
    [CUST_IDS[1], 'request_accepted', 'تم قبول طلبك',      'وافق الفني على طلبك وسيصل قريباً',         daysAgo(18)],
    [CUST_IDS[4], 'new_proposal',     'عرض سعر جديد',      'تلقيت عرض سعر جديد على طلبك',              hoursAgo(20)],
    [TECH_IDS[0], 'new_request',      'طلب خدمة جديد',     'يوجد طلب سباكة جديد بالقرب منك',           hoursAgo(5)],
    [TECH_IDS[1], 'new_request',      'طلب خدمة جديد',     'يوجد طلب كهرباء جديد بالقرب منك',          hoursAgo(3)],
    [CUST_IDS[2], 'request_completed','تم إنهاء الطلب',    'تم إنهاء العمل بنجاح. يرجى تقييم الفني',  daysAgo(11)],
    [CUST_IDS[5], 'new_proposal',     'عرض سعر جديد',      'تلقيت عرض سعر جديد على طلبك',              hoursAgo(1)],
  ];

  for (const [uid, type, title, body, at] of notes) {
    await db.query(
      `INSERT IGNORE INTO notifications (id, user_id, type, title_ar, body_ar, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), uid, type, title, body, Math.random() > 0.4 ? 1 : 0, at]
    );
  }
  logger.info('✓ notifications (8)');
};

// ─── 10. withdrawal requests ────────────────────────────────────────────────

const seedWithdrawals = async (): Promise<void> => {
  const withdrawals = [
    [TECH_IDS[0], 500,  'CIB',        '1234567890', 'خالد عبدالرحمن',  'approved', daysAgo(20)],
    [TECH_IDS[2], 1000, 'Banque Misr', '9876543210','سامي الشافعي',    'approved', daysAgo(10)],
    [TECH_IDS[1], 300,  'Vodafone Cash',null,        'محمود حسني',      'pending',  hoursAgo(48)],
    [TECH_IDS[4], 200,  'InstaPay',   null,          'وليد فؤاد',       'pending',  hoursAgo(12)],
  ];

  for (const [tid, amount, bank, acc, holder, status, at] of withdrawals) {
    await db.query(
      `INSERT IGNORE INTO withdrawal_requests
         (id, technician_id, amount, bank_name, account_number, account_holder, status,
          processed_at, processed_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), tid, amount, bank, acc || null, holder, status,
       status === 'approved' ? at : null,
       status === 'approved' ? ADMIN_ID : null,
       at]
    );
  }
  logger.info('✓ withdrawal_requests (4)');
};

// ─── runner ──────────────────────────────────────────────────────────────────

const runSeed = async (): Promise<void> => {
  try {
    await db.testConnection();
    logger.info('Starting seed...');

    const hash = await bcrypt.hash('Test@12345', 10);

    await seedCategories();
    await seedAdmin(hash);
    await seedCustomers(hash);
    await seedTechnicians(hash);
    await seedRequests();
    await seedProposals();
    await seedReviews();
    await seedTransactions();
    await seedNotifications();
    await seedWithdrawals();

    logger.info('');
    logger.info('═══════════════════════════════════════════');
    logger.info('  Seed complete!');
    logger.info('  Admin  → admin@cityservices.eg / Admin@12345');
    logger.info('  Users  → phone: +20111111110X / Test@12345');
    logger.info('  Techs  → phone: +20122222220X / Test@12345');
    logger.info('═══════════════════════════════════════════');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

runSeed();
