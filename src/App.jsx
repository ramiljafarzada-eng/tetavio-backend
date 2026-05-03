import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import logoSrc from "./assets/logo-icon.png";
import { createResetData, currency, today } from "./lib/data";
import { normalizeAppState } from "./lib/storage";
import I18N from './i18n';
import {
  apiCheckout,
  apiCreateAccountingAccount,
  apiCreateCustomer,
  apiCreateJournalEntry,
  apiCreateVendor,
  apiDeleteAccountingAccount,
  apiDeleteCustomer,
  apiDeleteJournalEntry,
  apiDeleteVendor,
  apiListAccountingAccounts,
  apiListJournalEntries,
  apiUpdateAccountingAccount,
  apiUpdateJournalEntry,
  apiAddAdminNote,
  apiAdminFlagAccount,
  apiAdminUnflagAccount,
  apiAdminGrantDemo,
  apiAdminReviewAnomaly,
  apiGetFinancialInsights,
  apiGetCashflowForecast,
  apiGetFinancialTrends,
  apiGetAdminAccountDetail,
  apiGetAdminAccounts,
  apiGetAdminAnomalies,
  apiGetAdminActivity,
  apiGetAdminFinance,
  apiGetAdminSystemHealth,
  apiGetAdminSubscriptions,
  apiGetAdminOverview,
  apiGetCompanySettings,
  apiGetCurrentSubscription,
  apiGetMyOrders,
  apiGetPlans,
  apiListCustomers,
  apiListInvoices,
  apiListVendors,
  apiListInternalSupportThreads,
  apiListSupportThreads,
  apiAddInvoicePayment,
  apiDownloadInvoicePdf,
  apiSendInvoiceEmail,
  apiListTeam,
  apiCreateTeamMember,
  apiUpdateTeamMember,
  apiDeactivateTeamMember,
  apiGetAccountsReceivableAging,
  apiCreateInvoice,
  apiDeleteInvoice,
  apiDeleteInvoicePayment,
  apiListInvoicePayments,
  apiLogin,
  apiLogout,
  apiMe,
  apiMockWebhook,
  apiRegister,
  apiRequestPasswordReset,
  apiConfirmPasswordReset,
  apiCreateSupportThread,
  apiReplyInternalSupportThread,
  apiReplySupportThread,
  apiUpdateInternalSupportThreadStatus,
  apiUpdateSupportThreadStatus,
  apiUpdateCompanySettings,
  apiUpdateCustomer,
  apiUpdateInvoice,
  apiUpdateVendor,
  apiUpgradeSubscription,
  apiSwitchToFree,
  apiSwitchToDemo,
  setApiSession,
} from "./lib/api";

const NAV = [
  { id: "home", label: "İdarəetmə paneli" },
  { id: "accountant", label: "Baş kitab", children: ["operationsJournal", "manualJournals", "chartOfAccounts"] },
  { id: "purchases", label: "Alış", children: ["vendors", "goods", "incomingGoodsServices"] },
  { id: "sales", label: "Satış", children: ["customers", "invoices"] },
  { id: "banking", label: "Bank" },
  { id: "reports", label: "Hesabatlar" },
  { id: "documents", label: "Sənədlər" },
  { id: "settings", label: "Tənzimləmələr" }
];

const BOOKS_LANDING_AUTH_VIEWS = ["signin", "signup", "forgot", "reset", "demo"];
const FUNNEL_PAGES = ["start", "demo", "pricing", "erp", "case-studies"];
const COMPLIANCE_LEGAL_PAGES = [
  {
    id: "terms-of-use",
    title: "İstifadə şərtləri",
    summary: "Bu istifadə şərtləri Tetavio mühasibat proqramından istifadə qaydalarını, istifadəçi öhdəliklərini və xidmətin təqdim olunması prinsiplərini müəyyən edir.",
    sections: [
      {
        heading: "Platformanın təyinatı",
        paragraphs: [
          "Tetavio rəqəmsal mühasibat SaaS platformasıdır və istifadəçilərə onlayn qaydada mühasibat, uçot, hesabat və abunəlik əsaslı proqram funksiyaları təqdim edir.",
          "Platforma yalnız rəqəmsal xidmət kimi təqdim olunur və istifadəçi Tetavio xidmətindən biznes, uçot və əlaqəli qanuni fəaliyyət məqsədləri üçün istifadə etməyi qəbul edir.",
        ],
      },
      {
        heading: "İstifadəçi hesabı və qanuni istifadə",
        paragraphs: [
          "İstifadəçi hesabına giriş üçün istifadə etdiyi e-poçt, şifrə və digər autentifikasiya məlumatlarının məxfiliyinə görə özü cavabdehdir.",
          "Tetavio xidmətindən qanunsuz, saxta, aldatma məqsədli, üçüncü şəxslərin hüquqlarını pozan və ya sistemin təhlükəsizliyini sarsıdan formada istifadə etmək qadağandır.",
          "İstifadəçi hesabı vasitəsilə daxil edilən məlumatların düzgünlüyü və qanunvericiliyə uyğunluğu istifadəçinin məsuliyyətindədir.",
        ],
      },
      {
        heading: "Abunəlik girişi və əqli mülkiyyət",
        paragraphs: [
          "Ödənişli planlara giriş yalnız uğurlu ödəniş və ya aktiv abunəlik olduğu halda təmin edilir və istifadəçiyə seçdiyi plan çərçivəsində məhdud istifadə hüququ verir.",
          "Tetavio platformasına aid proqram təminatı, dizayn, məzmun, loqotiplər və digər bütün elementlər Tetavio MMC-nin müstəsna əqli mülkiyyətidir və Azərbaycan Respublikasının qüvvədə olan qanunvericiliyi ilə qorunur.",
        ],
      },
      {
        heading: "Xidmətin əlçatanlığı, məsuliyyət və yeniləmələr",
        paragraphs: [
          "Tetavio xidmətin fasiləsiz işləməsi üçün səy göstərsə də, texniki xidmət, yenilənmə, inteqrasiya problemi, şəbəkə nasazlığı və fors-major hallar nəticəsində müvəqqəti əlçatanlıq problemi yarana bilər.",
          "Qanunla tələb olunan hallar istisna olmaqla, Tetavio dolayı zərər, itirilmiş gəlir, məlumat itkisi və ya üçüncü tərəf sistemlərindən qaynaqlanan nəticələrə görə tam məsuliyyət daşımır.",
          "Bu şərtlər Azərbaycan Respublikasının qanunvericiliyinə uyğun tənzimlənir.",
          "Tetavio bu istifadə şərtlərini və xidmət qaydalarını istənilən vaxt yeniləmək hüququnu özündə saxlayır.",
        ],
      },
    ],
  },
  {
    id: "payment-terms",
    title: "Ödəniş şərtləri",
    summary: "Bu səhifə Tetavio üzrə abunəlik ödənişlərinin qaydasını, ödəniş təhlükəsizliyi prinsiplərini və ödənişdən sonra plan aktivləşmə mexanizmini izah edir.",
    sections: [
      {
        heading: "Ödənişin predmeti və valyuta",
        paragraphs: [
          "Tetavio üzrə ödənişlər yalnız rəqəmsal SaaS abunəlik planlarının alınması, yenilənməsi və ya yüksəldilməsi üçündür. Fiziki məhsul satışı və fiziki çatdırılma həyata keçirilmir.",
          "Platformada göstərilən bütün qiymətlər ABŞ dolları (USD) ilə ifadə olunur.",
        ],
      },
      {
        heading: "Ödəniş üsulu və kart məlumatlarının emalı",
        paragraphs: [
          "Ödəniş bank kartı vasitəsilə PASHA Bank E-commerce / Virtual POS və ya uyğun ödəniş provayderi infrastrukturu üzərindən həyata keçirilir.",
          "İstifadəçi tərəfindən təqdim edilən ödəniş məlumatlarının düzgünlüyünə görə istifadəçi məsuliyyət daşıyır.",
          "Kart nömrəsi, CVV/CVC kodu və kartın son istifadə tarixi Tetavio serverlərində saxlanılmır, emal edilmir və Tetavio tərəfindən əldə edilmir.",
          "Kart üzrə ödəniş məlumatları yalnız bankın və ya ödəniş provayderinin təhlükəsiz ödəniş infrastrukturunda emal olunur.",
        ],
      },
      {
        heading: "Ödəniş təsdiqi və planın aktivləşməsi",
        paragraphs: [
          "Ödəniş uğurla təsdiqləndikdən sonra seçilmiş ödənişli plan istifadəçi hesabında rəqəmsal qaydada aktivləşdirilir və sistemdə müvafiq plan statusu yenilənir.",
          "Tetavio MMC ödənişlərin bank və ya ödəniş provayderi tərəfindən təsdiqlənməsinə əsaslanır və ödəniş təsdiqlənmədən xidmət aktivləşdirilmir.",
          "Ödəniş uğursuz olarsa, yarımçıq qalarsa və ya bank tərəfindən təsdiqlənməzsə, ödənişli giriş aktivləşdirilmir və istifadəçi mövcud planında qalır.",
          "İstifadəçi checkout prosesini davam etdirməzdən əvvəl ödəniş şərtləri ilə tanış olduğunu və onları qəbul etdiyini təsdiqləməlidir.",
        ],
      },
    ],
  },
  {
    id: "refund-policy",
    title: "Geri qaytarma və ləğv siyasəti",
    summary: "Bu siyasət Tetavio üzrə abunəlik ləğvi, downgrade və mümkün geri qaytarma hallarına tətbiq olunan əsas qaydaları müəyyən edir.",
    sections: [
      {
        heading: "Ləğv və downgrade qaydası",
        paragraphs: [
          "İstifadəçi abunəlik ləğvi və ya daha aşağı plana keçid barədə sorğunu dəstək və ya əlaqə kanalına müraciət etməklə təqdim edə bilər.",
          "Abunəlik ləğvi və ya downgrade, ayrıca başqa hal göstərilmədiyi təqdirdə, növbəti ödəniş dövründən etibarən tətbiq olunur.",
          "Cari aktivləşdirilmiş dövr üzrə təqdim edilmiş rəqəmsal giriş hüququ dövr sonuna qədər qüvvədə qala bilər.",
        ],
      },
      {
        heading: "Geri qaytarma prinsipləri",
        paragraphs: [
          "Tetavio rəqəmsal xidmət təqdim etdiyindən, aktivləşdirilmiş abunəlik dövrləri ümumilikdə geri qaytarılmır.",
          "Lakin təkrar ödəniş, texniki səbəbdən planın aktivləşməməsi və ya təsdiqlənmiş icazəsiz tranzaksiya hallarında geri qaytarma sorğusu ayrıca araşdırıla bilər.",
          "Geri qaytarma yalnız Tetavio tərəfindən təsdiqlənmiş əsaslı hallarda həyata keçirilir.",
          "Geri qaytarma təsdiqləndiyi halda, məbləğ mümkün olduqda eyni ödəniş üsuluna qaytarılır.",
        ],
      },
      {
        heading: "Müraciət və baxılma müddəti",
        paragraphs: [
          "Geri qaytarma müraciətində istifadəçi e-poçtu, əməliyyatın tarixi, məbləği və müraciətin səbəbi qeyd edilməlidir.",
          "Müraciətlər 5-10 iş günü ərzində baxılır və nəticə istifadəçiyə əlaqə məlumatları vasitəsilə bildirilir.",
        ],
      },
    ],
  },
  {
    id: "privacy-policy",
    title: "Məxfilik siyasəti",
    summary: "Bu siyasət Tetavio tərəfindən hansı məlumatların toplandığını, necə istifadə edildiyini və ödəniş təhlükəsizliyi üzrə əsas prinsipləri izah edir.",
    sections: [
      {
        heading: "Toplanan məlumatlar",
        paragraphs: [
          "Tetavio istifadəçidən və ya istifadəçi hesabından ad, e-poçt ünvanı, telefon nömrəsi, şirkət məlumatları, təqdim edildiyi halda VÖEN, giriş və sessiya məlumatları, abunəlik və ödəniş statusu kimi məlumatları toplaya və emal edə bilər.",
          "Bu məlumatlar hesabın idarə olunması, abunəliyin aktivləşdirilməsi, dəstək xidmətinin göstərilməsi, təhlükəsizliyin təmin edilməsi və mühasibat/hüquqi öhdəliklərin yerinə yetirilməsi məqsədilə istifadə olunur.",
        ],
      },
      {
        heading: "Kart məlumatları və paylaşım prinsipləri",
        paragraphs: [
          "Tetavio serverlərində kart nömrəsi, CVV/CVC kodu, kartın son istifadə tarixi və digər məxfi kart məlumatları saxlanılmır.",
          "Kart üzrə ödəniş məlumatları bank və ya ödəniş provayderi tərəfindən emal olunur.",
          "Məlumatlar yalnız zəruri hallarda ödəniş provayderi, hostinq və təhlükəsizlik xidmətləri təminatçıları ilə və ya qanunla tələb olunduqda səlahiyyətli dövlət orqanları ilə paylaşılır.",
        ],
      },
      {
        heading: "İstifadəçi hüquqları və təhlükəsizlik tədbirləri",
        paragraphs: [
          "İstifadəçi qanunvericiliklə mümkün olduğu həddə öz məlumatlarının düzəldilməsi, yenilənməsi və ya silinməsi barədə müraciət edə bilər.",
          "Tetavio məlumatların qorunması üçün HTTPS/TLS bağlantısı, giriş nəzarəti, parolların hash-lənməsi və digər təşkilati-texniki təhlükəsizlik tədbirlərindən istifadə edir.",
          "Platformada sessiyanın idarə olunması və istifadəçi seçimlərinin saxlanması üçün cookie və ya local storage mexanizmlərindən istifadə oluna bilər.",
        ],
      },
    ],
  },
  {
    id: "delivery-policy",
    title: "Xidmətin təqdim edilməsi / rəqəmsal aktivləşdirmə siyasəti",
    summary: "Tetavio fiziki məhsul təqdim etmir; xidmət ödənişdən sonra istifadəçi hesabında rəqəmsal olaraq aktivləşdirilir.",
    sections: [
      {
        heading: "Rəqəmsal xidmətin təqdim olunması",
        paragraphs: [
          "Tetavio rəqəmsal mühasibat SaaS xidməti təqdim edir və istifadəçi ödəniş etdikdən sonra müvafiq plan üzrə xidmətə veb hesabı vasitəsilə çıxış əldə edir.",
          "Uğurlu ödəniş təsdiqləndikdən sonra ödənişli plan adətən dərhal və ya qısa texniki emal müddəti ərzində istifadəçi hesabında aktivləşdirilir.",
        ],
      },
      {
        heading: "Fiziki çatdırılmanın olmaması",
        paragraphs: [
          "Tetavio tərəfindən heç bir fiziki məhsul göndərilmir və heç bir fiziki çatdırılma xidməti tətbiq edilmir.",
          "Xidmətin təqdim olunması yalnız rəqəmsal giriş hüququnun aktivləşdirilməsi formasında həyata keçirilir.",
        ],
      },
      {
        heading: "Aktivləşmə, dəstək və elektron sənədlər",
        paragraphs: [
          "İstifadəçi xidmətə öz veb hesabı vasitəsilə daxil olur və aktiv plan çərçivəsində təqdim olunan funksionallıqlardan istifadə edir.",
          "Ödənişdən sonra aktivləşmə baş vermədiyi hallarda istifadəçi dəstək komandası ilə əlaqə saxlaya bilər.",
          "Zərurət olduqda ödəniş, qəbz və ya faktura məlumatları elektron formada təqdim oluna bilər.",
        ],
      },
    ],
  },
  {
    id: "contact-info",
    title: "Hüquqi məlumatlar və əlaqə vasitələri",
    summary: "Bu səhifədə Tetavio MMC-nin hüquqi məlumatları və istifadəçilər üçün rəsmi əlaqə vasitələri təqdim olunur.",
    sections: [
      {
        heading: "Hüquqi məlumatlar",
        paragraphs: [
          "Hüquqi şəxs: Tetavio MMC",
          "Brend / platforma: Tetavio",
          "VÖEN: 2009752131",
          "Hüquqi ünvan: Bakı şəhəri, Xətai rayonu, Xudu Məmmədov küç., bina 6, mənzil 185",
        ],
      },
      {
        heading: "Əlaqə vasitələri",
        paragraphs: [
          "Ümumi e-poçt: info@tetavio.com",
          "Dəstək e-poçtu: support@tetavio.com",
          "Telefon: +994 10 311 91 87",
          "İş saatları: Bazar ertəsi – Cümə, 09:00 – 18:00",
          "İstifadəçilər ödəniş, geri qaytarma, ləğv, hesab girişi və texniki problemlərlə bağlı bu əlaqə vasitələri üzərindən müraciət edə bilərlər.",
        ],
      },
    ],
  },
];
const BOOKS_LANDING_LEGAL_PAGES = COMPLIANCE_LEGAL_PAGES;
const BOOKS_LANDING_VIEWS = [
  "home",
  ...BOOKS_LANDING_AUTH_VIEWS,
  ...COMPLIANCE_LEGAL_PAGES.map((page) => page.id),
];
const COMPLIANCE_LEGAL_PAGE_MAP = Object.fromEntries(
  COMPLIANCE_LEGAL_PAGES.map((page) => [page.id, page]),
);
const LEGAL_STANDALONE_PAGES = Object.fromEntries(
  COMPLIANCE_LEGAL_PAGES.map((page) => [page.id, page]),
);
const LEGAL_STANDALONE_ALIASES = {
  "company-info": "contact-info",
  contact: "contact-info",
};
const LEGAL_STANDALONE_LANGS = ["az", "en", "ru", "tr", "de"];
const LEGAL_STANDALONE_LANGUAGE_OPTIONS = [
  { code: "az", label: "AZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "tr", label: "TR" },
  { code: "de", label: "DE" },
];
const PUBLIC_MARKETING_LANGS = [
  { code: "az", label: "Azərbaycan dili", flag: "🇦🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];
const PUBLIC_MARKETING_TOPBAR_T = {
  az: {
    platform: "Mühasibat proqramı",
    nav: [
      { id: "features", label: "Üstünlüklər" },
      { id: "how", label: "Necə işləyir" },
      { id: "about", label: "Haqqımızda" },
      { id: "pricing", label: "Tariflər" },
      { id: "faq", label: "FAQ" },
    ],
    navContact: "Əlaqə",
    navMenu: "Menyu",
    navSignup: "İndi qeydiyyatdan keç →",
  },
  en: {
    platform: "Product platform",
    nav: [
      { id: "features", label: "Benefits" },
      { id: "how", label: "How it works" },
      { id: "about", label: "About us" },
      { id: "pricing", label: "Pricing" },
      { id: "faq", label: "FAQ" },
    ],
    navContact: "Contact",
    navMenu: "Menu",
    navSignup: "Register now →",
  },
  ru: {
    platform: "Платформа продукта",
    nav: [
      { id: "features", label: "Преимущества" },
      { id: "how", label: "Как это работает" },
      { id: "about", label: "О нас" },
      { id: "pricing", label: "Тарифы" },
      { id: "faq", label: "FAQ" },
    ],
    navContact: "Контакты",
    navMenu: "Меню",
    navSignup: "Зарегистрироваться →",
  },
  tr: {
    platform: "Ürün platformu",
    nav: [
      { id: "features", label: "Avantajlar" },
      { id: "how", label: "Nasıl çalışır" },
      { id: "about", label: "Hakkımızda" },
      { id: "pricing", label: "Fiyatlar" },
      { id: "faq", label: "SSS" },
    ],
    navContact: "İletişim",
    navMenu: "Menü",
    navSignup: "Hemen kayıt ol →",
  },
  de: {
    platform: "Produktplattform",
    nav: [
      { id: "features", label: "Vorteile" },
      { id: "how", label: "So funktioniert es" },
      { id: "about", label: "Über uns" },
      { id: "pricing", label: "Preise" },
      { id: "faq", label: "FAQ" },
    ],
    navContact: "Kontakt",
    navMenu: "Menü",
    navSignup: "Jetzt registrieren →",
  },
};
const LEGAL_CONTACT_SECTION_IDS = ["legal-info", "contact"];
const LEGAL_NAV_LABEL_TRANSLATIONS = {
  en: {
    "terms-of-use": "Terms of Use",
    "payment-terms": "Payment Terms",
    "refund-policy": "Refund and Cancellation Policy",
    "privacy-policy": "Privacy Policy",
    "delivery-policy": "Service Delivery / Digital Activation Policy",
    "company-info": "Legal Information",
    contact: "Contact",
  },
  ru: {
    "terms-of-use": "Условия использования",
    "payment-terms": "Условия оплаты",
    "refund-policy": "Политика возврата и отмены",
    "privacy-policy": "Политика конфиденциальности",
    "delivery-policy": "Политика предоставления услуги / цифровой активации",
    "company-info": "Юридическая информация",
    contact: "Контакты",
  },
  tr: {
    "terms-of-use": "Kullanım Şartları",
    "payment-terms": "Ödeme Şartları",
    "refund-policy": "İade ve İptal Politikası",
    "privacy-policy": "Gizlilik Politikası",
    "delivery-policy": "Hizmet Sunumu / Dijital Aktivasyon Politikası",
    "company-info": "Yasal Bilgiler",
    contact: "İletişim",
  },
  de: {
    "terms-of-use": "Nutzungsbedingungen",
    "payment-terms": "Zahlungsbedingungen",
    "refund-policy": "Rückerstattungs- und Kündigungsrichtlinie",
    "privacy-policy": "Datenschutzerklärung",
    "delivery-policy": "Richtlinie zur Leistungserbringung / digitalen Aktivierung",
    "company-info": "Rechtliche Informationen",
    contact: "Kontakt",
  },
};
const LEGAL_PAGE_TRANSLATIONS = {
  en: {
    "terms-of-use": {
      title: "Terms of Use",
      summary: "These terms of use define the rules for using Tetavio accounting software, user obligations, and the principles under which the service is provided.",
      sections: [
        {
          heading: "Purpose of the platform",
          paragraphs: [
            "Tetavio is a digital accounting SaaS platform that provides users with online accounting, bookkeeping, reporting, and subscription-based software features.",
            "The platform is provided solely as a digital service, and the user agrees to use Tetavio for business, bookkeeping, and related lawful purposes.",
          ],
        },
        {
          heading: "User account and lawful use",
          paragraphs: [
            "The user is responsible for maintaining the confidentiality of the email address, password, and other authentication information used to access the account.",
            "Using Tetavio for unlawful, fraudulent, deceptive, rights-infringing, or system-disruptive purposes is prohibited.",
            "The user is responsible for the accuracy of the information entered through the account and for compliance with applicable law.",
          ],
        },
        {
          heading: "Subscription access and intellectual property",
          paragraphs: [
            "Access to paid plans is provided only after successful payment or while a subscription is active, and grants the user a limited right of use within the selected plan.",
            "The software, design, content, logos, and all other platform elements belong exclusively to Tetavio LLC and are protected under the laws of the Republic of Azerbaijan.",
          ],
        },
        {
          heading: "Availability, liability, and updates",
          paragraphs: [
            "Tetavio seeks to keep the service available continuously, but temporary interruptions may occur due to maintenance, updates, integration issues, network failures, or force majeure events.",
            "Except where required by law, Tetavio is not fully liable for indirect damages, lost income, data loss, or outcomes caused by third-party systems.",
            "These terms are governed by the laws of the Republic of Azerbaijan.",
            "Tetavio reserves the right to update these terms of use and service rules at any time.",
          ],
        },
      ],
    },
    "payment-terms": {
      title: "Payment Terms",
      summary: "This page explains how Tetavio subscription payments work, the principles of payment security, and how plans are activated after payment.",
      sections: [
        {
          heading: "Subject of payment and currency",
          paragraphs: [
            "Payments on Tetavio apply only to the purchase, renewal, or upgrade of digital SaaS subscription plans. No physical goods are sold or delivered.",
            "All prices shown on the platform are expressed in Azerbaijani manat (AZN), unless explicitly stated otherwise.",
          ],
        },
        {
          heading: "Payment method and card data handling",
          paragraphs: [
            "Payments are processed by bank card through PASHA Bank E-commerce / Virtual POS or compatible payment provider infrastructure.",
            "The user is responsible for the accuracy of the payment information they provide.",
            "Tetavio does not store, process, or obtain card numbers, CVV/CVC codes, or card expiry dates on its servers.",
            "Card payment data is processed only within the secure payment infrastructure of the bank or payment provider.",
          ],
        },
        {
          heading: "Payment confirmation and plan activation",
          paragraphs: [
            "After successful payment confirmation, the selected paid plan is activated digitally in the user account and the relevant plan status is updated in the system.",
            "Tetavio LLC relies on confirmation from the bank or payment provider, and the service is not activated before payment is confirmed.",
            "If payment fails, remains incomplete, or is not confirmed by the bank, paid access is not activated and the user remains on the current plan.",
            "Before continuing the checkout process, the user must confirm that they have reviewed and accepted the payment terms.",
          ],
        },
      ],
    },
    "refund-policy": {
      title: "Refund and Cancellation Policy",
      summary: "This policy defines the main rules that apply to subscription cancellation, downgrade requests, and possible refund cases on Tetavio.",
      sections: [
        {
          heading: "Cancellation and downgrade rules",
          paragraphs: [
            "The user may submit a request to cancel a subscription or downgrade to a lower plan through support or the contact channel.",
            "Unless stated otherwise, cancellation or downgrade takes effect from the next billing period.",
            "Digital access already activated for the current period may remain valid until the end of that period.",
          ],
        },
        {
          heading: "Refund principles",
          paragraphs: [
            "Because Tetavio provides a digital service, activated subscription periods are generally non-refundable.",
            "However, refund requests may be reviewed separately in cases of duplicate payment, failure to activate the plan for technical reasons, or confirmed unauthorized transactions.",
            "Refunds are issued only in justified cases confirmed by Tetavio.",
            "If a refund is approved, the amount is returned to the same payment method where possible.",
          ],
        },
        {
          heading: "Requests and review period",
          paragraphs: [
            "A refund request must include the user's email address, the transaction date, the amount, and the reason for the request.",
            "Requests are reviewed within 5-10 business days and the outcome is communicated through the user's contact details.",
          ],
        },
      ],
    },
    "privacy-policy": {
      title: "Privacy Policy",
      summary: "This policy explains what information Tetavio collects, how it is used, and the main principles applied to payment security.",
      sections: [
        {
          heading: "Information collected",
          paragraphs: [
            "Tetavio may collect and process information such as name, email address, phone number, company details, tax ID when provided, login and session data, subscription status, and payment status from the user or the user account.",
            "This information is used to manage the account, activate subscriptions, provide support, ensure security, and meet accounting and legal obligations.",
          ],
        },
        {
          heading: "Card data and sharing principles",
          paragraphs: [
            "Tetavio does not store card numbers, CVV/CVC codes, expiry dates, or other sensitive card data on its servers.",
            "Card payment information is processed by the bank or payment provider.",
            "Information is shared only when necessary with payment providers, hosting and security service providers, or with authorized public authorities when required by law.",
          ],
        },
        {
          heading: "User rights and security measures",
          paragraphs: [
            "To the extent permitted by law, the user may request correction, updating, or deletion of their information.",
            "Tetavio uses HTTPS/TLS connections, access controls, password hashing, and other organizational and technical security measures to protect information.",
            "Cookies or local storage mechanisms may be used on the platform for session management and to preserve user preferences.",
          ],
        },
      ],
    },
    "delivery-policy": {
      title: "Service Delivery / Digital Activation Policy",
      summary: "Tetavio does not deliver physical goods; after payment, the service is activated digitally in the user's account.",
      sections: [
        {
          heading: "Delivery of the digital service",
          paragraphs: [
            "Tetavio provides a digital accounting SaaS service, and after payment the user receives access to the relevant plan through the web account.",
            "After successful payment confirmation, the paid plan is typically activated immediately or within a short technical processing period in the user account.",
          ],
        },
        {
          heading: "No physical delivery",
          paragraphs: [
            "Tetavio does not send any physical product and does not provide any physical delivery service.",
            "Service delivery takes place only in the form of activating a digital access right.",
          ],
        },
        {
          heading: "Activation, support, and electronic documents",
          paragraphs: [
            "The user accesses the service through the web account and uses the functionality available within the active plan.",
            "If activation does not occur after payment, the user may contact the support team.",
            "When necessary, payment, receipt, or invoice information may be provided electronically.",
          ],
        },
      ],
    },
    "contact-info": {
      title: "Legal Information and Contact Details",
      summary: "This page provides Tetavio LLC legal details and the official contact channels available to users.",
      sections: [
        {
          id: "legal-info",
          heading: "Legal information",
          paragraphs: [
            "Legal entity: Tetavio LLC",
            "Brand / platform: Tetavio",
            "Tax ID: 2009752131",
            "Legal address: Baku city, Khatai district, Khudu Mammadov str., building 6, apartment 185",
          ],
        },
        {
          id: "contact",
          heading: "Contact channels",
          paragraphs: [
            "General email: info@tetavio.com",
            "Support email: support@tetavio.com",
            "Phone: +994 10 311 91 87",
            "Business hours: Monday - Friday, 09:00 - 18:00",
            "Users may use these contact channels for payment, refunds, cancellation, account access, and technical issues.",
          ],
        },
      ],
    },
  },
  ru: {
    "terms-of-use": {
      title: "Условия использования",
      summary: "Эти условия использования определяют правила работы с бухгалтерским программным обеспечением Tetavio, обязанности пользователя и принципы предоставления сервиса.",
      sections: [
        {
          heading: "Назначение платформы",
          paragraphs: [
            "Tetavio — это цифровая SaaS-платформа для бухгалтерии, предоставляющая пользователям онлайн-инструменты для учета, отчетности и подписочного программного обеспечения.",
            "Платформа предоставляется исключительно как цифровой сервис, и пользователь соглашается использовать Tetavio только для бизнеса, учета и иных законных целей.",
          ],
        },
        {
          heading: "Учетная запись и законное использование",
          paragraphs: [
            "Пользователь несет ответственность за сохранение конфиденциальности электронной почты, пароля и иных данных аутентификации, используемых для входа в аккаунт.",
            "Запрещается использовать Tetavio в незаконных, мошеннических, вводящих в заблуждение целях, а также способами, нарушающими права третьих лиц или подрывающими безопасность системы.",
            "Пользователь отвечает за достоверность данных, вводимых через аккаунт, и за соблюдение применимого законодательства.",
          ],
        },
        {
          heading: "Доступ по подписке и интеллектуальная собственность",
          paragraphs: [
            "Доступ к платным планам предоставляется только после успешной оплаты или при наличии активной подписки и дает пользователю ограниченное право использования в рамках выбранного плана.",
            "Программное обеспечение, дизайн, контент, логотипы и все иные элементы платформы принадлежат исключительно Tetavio LLC и защищаются законодательством Азербайджанской Республики.",
          ],
        },
        {
          heading: "Доступность сервиса, ответственность и обновления",
          paragraphs: [
            "Tetavio стремится обеспечивать непрерывную работу сервиса, однако возможны временные перебои из-за технического обслуживания, обновлений, проблем интеграции, сетевых сбоев или форс-мажора.",
            "За исключением случаев, когда это требуется законом, Tetavio не несет полной ответственности за косвенные убытки, упущенную выгоду, потерю данных или последствия, вызванные системами третьих лиц.",
            "Настоящие условия регулируются законодательством Азербайджанской Республики.",
            "Tetavio оставляет за собой право обновлять настоящие условия использования и правила сервиса в любое время.",
          ],
        },
      ],
    },
    "payment-terms": {
      title: "Условия оплаты",
      summary: "На этой странице описан порядок подписочных платежей Tetavio, принципы безопасности оплаты и механизм активации плана после оплаты.",
      sections: [
        {
          heading: "Предмет оплаты и валюта",
          paragraphs: [
            "Платежи в Tetavio применяются только к покупке, продлению или повышению цифровых SaaS-подписок. Физические товары не продаются и не доставляются.",
            "Все цены на платформе указываются в азербайджанских манатах (AZN), если явно не указано иное.",
          ],
        },
        {
          heading: "Способ оплаты и обработка данных карты",
          paragraphs: [
            "Оплата осуществляется банковской картой через PASHA Bank E-commerce / Virtual POS или совместимую инфраструктуру платежного провайдера.",
            "Пользователь несет ответственность за корректность предоставленных платежных данных.",
            "Tetavio не хранит, не обрабатывает и не получает на своих серверах номер карты, CVV/CVC или срок действия карты.",
            "Данные карточного платежа обрабатываются только в защищенной платежной инфраструктуре банка или платежного провайдера.",
          ],
        },
        {
          heading: "Подтверждение оплаты и активация плана",
          paragraphs: [
            "После успешного подтверждения оплаты выбранный платный план цифровым образом активируется в аккаунте пользователя, а статус плана в системе обновляется.",
            "Tetavio LLC полагается на подтверждение от банка или платежного провайдера и не активирует сервис до подтверждения оплаты.",
            "Если платеж неудачен, не завершен или не подтвержден банком, платный доступ не активируется, и пользователь остается на текущем плане.",
            "Перед продолжением оформления заказа пользователь должен подтвердить, что ознакомился и согласен с условиями оплаты.",
          ],
        },
      ],
    },
    "refund-policy": {
      title: "Политика возврата и отмены",
      summary: "Эта политика определяет основные правила, применимые к отмене подписки, переходу на более низкий тариф и возможным случаям возврата средств в Tetavio.",
      sections: [
        {
          heading: "Правила отмены и перехода на более низкий тариф",
          paragraphs: [
            "Пользователь может подать запрос на отмену подписки или переход на более низкий тариф через поддержку или контактный канал.",
            "Если не указано иное, отмена или переход на более низкий тариф вступают в силу со следующего платежного периода.",
            "Цифровой доступ, уже активированный на текущий период, может сохраняться до конца этого периода.",
          ],
        },
        {
          heading: "Принципы возврата средств",
          paragraphs: [
            "Поскольку Tetavio предоставляет цифровой сервис, активированные периоды подписки, как правило, не подлежат возврату.",
            "Однако запросы на возврат могут рассматриваться отдельно в случаях двойной оплаты, неактивации плана по техническим причинам или подтвержденных несанкционированных транзакций.",
            "Возврат средств производится только в обоснованных случаях, подтвержденных Tetavio.",
            "Если возврат одобрен, сумма по возможности возвращается тем же способом оплаты.",
          ],
        },
        {
          heading: "Запрос и срок рассмотрения",
          paragraphs: [
            "В запросе на возврат должны быть указаны электронная почта пользователя, дата операции, сумма и причина обращения.",
            "Запросы рассматриваются в течение 5-10 рабочих дней, а результат сообщается пользователю по контактным данным.",
          ],
        },
      ],
    },
    "privacy-policy": {
      title: "Политика конфиденциальности",
      summary: "Эта политика объясняет, какие данные собирает Tetavio, как они используются и какие основные принципы применяются к безопасности платежей.",
      sections: [
        {
          heading: "Собираемая информация",
          paragraphs: [
            "Tetavio может собирать и обрабатывать такие данные, как имя, адрес электронной почты, номер телефона, данные компании, налоговый идентификатор при его предоставлении, данные входа и сессии, статус подписки и статус оплаты.",
            "Эти данные используются для управления аккаунтом, активации подписки, предоставления поддержки, обеспечения безопасности и выполнения бухгалтерских и юридических обязательств.",
          ],
        },
        {
          heading: "Данные карты и принципы передачи",
          paragraphs: [
            "Tetavio не хранит на своих серверах номера карт, CVV/CVC, сроки действия или другие конфиденциальные карточные данные.",
            "Информация о карточном платеже обрабатывается банком или платежным провайдером.",
            "Информация передается только при необходимости платежным провайдерам, поставщикам хостинга и безопасности либо уполномоченным государственным органам, если этого требует закон.",
          ],
        },
        {
          heading: "Права пользователя и меры безопасности",
          paragraphs: [
            "В пределах, разрешенных законодательством, пользователь может запросить исправление, обновление или удаление своих данных.",
            "Tetavio использует HTTPS/TLS-соединения, контроль доступа, хеширование паролей и другие организационные и технические меры для защиты информации.",
            "На платформе могут использоваться cookie или local storage для управления сессией и сохранения пользовательских предпочтений.",
          ],
        },
      ],
    },
    "delivery-policy": {
      title: "Политика предоставления услуги / цифровой активации",
      summary: "Tetavio не поставляет физические товары; после оплаты сервис активируется в аккаунте пользователя в цифровом виде.",
      sections: [
        {
          heading: "Предоставление цифровой услуги",
          paragraphs: [
            "Tetavio предоставляет цифровой бухгалтерский SaaS-сервис, и после оплаты пользователь получает доступ к соответствующему плану через веб-аккаунт.",
            "После успешного подтверждения оплаты платный план обычно активируется сразу либо в течение короткого технического периода обработки в аккаунте пользователя.",
          ],
        },
        {
          heading: "Отсутствие физической доставки",
          paragraphs: [
            "Tetavio не отправляет никакие физические товары и не оказывает услуги физической доставки.",
            "Предоставление сервиса происходит только в форме активации цифрового права доступа.",
          ],
        },
        {
          heading: "Активация, поддержка и электронные документы",
          paragraphs: [
            "Пользователь получает доступ к сервису через веб-аккаунт и использует функциональность, доступную в рамках активного плана.",
            "Если после оплаты активация не произошла, пользователь может связаться со службой поддержки.",
            "При необходимости сведения об оплате, чеке или счете могут быть предоставлены в электронном виде.",
          ],
        },
      ],
    },
    "contact-info": {
      title: "Юридическая информация и контактные данные",
      summary: "На этой странице представлены юридические данные Tetavio LLC и официальные каналы связи для пользователей.",
      sections: [
        {
          id: "legal-info",
          heading: "Юридическая информация",
          paragraphs: [
            "Юридическое лицо: Tetavio LLC",
            "Бренд / платформа: Tetavio",
            "Налоговый номер: 2009752131",
            "Юридический адрес: город Баку, Хатаинский район, ул. Худу Мамедова, дом 6, квартира 185",
          ],
        },
        {
          id: "contact",
          heading: "Контактные каналы",
          paragraphs: [
            "Общая электронная почта: info@tetavio.com",
            "Электронная почта поддержки: support@tetavio.com",
            "Телефон: +994 10 311 91 87",
            "Часы работы: понедельник - пятница, 09:00 - 18:00",
            "Пользователи могут обращаться по этим контактам по вопросам оплаты, возврата средств, отмены, доступа к аккаунту и технических проблем.",
          ],
        },
      ],
    },
  },
  tr: {
    "terms-of-use": {
      title: "Kullanım Şartları",
      summary: "Bu kullanım şartları, Tetavio muhasebe yazılımının kullanım kurallarını, kullanıcı yükümlülüklerini ve hizmetin sunulma esaslarını belirler.",
      sections: [
        {
          heading: "Platformun amacı",
          paragraphs: [
            "Tetavio, kullanıcılara çevrim içi muhasebe, kayıt, raporlama ve abonelik tabanlı yazılım özellikleri sunan dijital bir muhasebe SaaS platformudur.",
            "Platform yalnızca dijital bir hizmet olarak sunulur ve kullanıcı Tetavio'yu iş, muhasebe ve ilgili yasal amaçlarla kullanmayı kabul eder.",
          ],
        },
        {
          heading: "Kullanıcı hesabı ve yasal kullanım",
          paragraphs: [
            "Kullanıcı, hesabına girişte kullandığı e-posta, parola ve diğer kimlik doğrulama bilgilerinin gizliliğini korumaktan sorumludur.",
            "Tetavio'nun hukuka aykırı, sahte, aldatıcı, üçüncü kişilerin haklarını ihlal eden veya sistem güvenliğini bozan amaçlarla kullanılması yasaktır.",
            "Hesap üzerinden girilen bilgilerin doğruluğu ve mevzuata uygunluğu kullanıcının sorumluluğundadır.",
          ],
        },
        {
          heading: "Abonelik erişimi ve fikri mülkiyet",
          paragraphs: [
            "Ücretli planlara erişim yalnızca başarılı ödeme veya aktif abonelik sonrasında sağlanır ve kullanıcıya seçilen plan kapsamında sınırlı bir kullanım hakkı verir.",
            "Tetavio platformuna ait yazılım, tasarım, içerik, logolar ve diğer tüm unsurlar münhasıran Tetavio LLC'ye aittir ve Azerbaycan Cumhuriyeti mevzuatı ile korunur.",
          ],
        },
        {
          heading: "Hizmetin erişilebilirliği, sorumluluk ve güncellemeler",
          paragraphs: [
            "Tetavio hizmetin kesintisiz çalışması için çaba gösterse de bakım, güncelleme, entegrasyon sorunları, ağ arızaları veya mücbir sebepler nedeniyle geçici erişim sorunları oluşabilir.",
            "Kanunen zorunlu haller dışında Tetavio, dolaylı zararlar, gelir kaybı, veri kaybı veya üçüncü taraf sistemlerden kaynaklanan sonuçlar için tam sorumluluk üstlenmez.",
            "Bu şartlar Azerbaycan Cumhuriyeti mevzuatına tabidir.",
            "Tetavio, bu kullanım şartlarını ve hizmet kurallarını istediği zaman güncelleme hakkını saklı tutar.",
          ],
        },
      ],
    },
    "payment-terms": {
      title: "Ödeme Şartları",
      summary: "Bu sayfa Tetavio abonelik ödemelerinin işleyişini, ödeme güvenliği ilkelerini ve ödeme sonrası plan aktivasyon mekanizmasını açıklar.",
      sections: [
        {
          heading: "Ödemenin konusu ve para birimi",
          paragraphs: [
            "Tetavio üzerindeki ödemeler yalnızca dijital SaaS abonelik planlarının satın alınması, yenilenmesi veya yükseltilmesi içindir. Fiziksel ürün satışı ve teslimatı yapılmaz.",
            "Platformda gösterilen tüm fiyatlar aksi açıkça belirtilmedikçe Azerbaycan manatı (AZN) cinsindendir.",
          ],
        },
        {
          heading: "Ödeme yöntemi ve kart verilerinin işlenmesi",
          paragraphs: [
            "Ödemeler banka kartı ile PASHA Bank E-commerce / Virtual POS veya uyumlu ödeme sağlayıcısı altyapısı üzerinden işlenir.",
            "Kullanıcı sağladığı ödeme bilgilerinin doğruluğundan sorumludur.",
            "Tetavio kart numarası, CVV/CVC kodu veya son kullanma tarihini sunucularında saklamaz, işlemez veya elde etmez.",
            "Kart ödeme verileri yalnızca banka veya ödeme sağlayıcısının güvenli ödeme altyapısında işlenir.",
          ],
        },
        {
          heading: "Ödeme onayı ve plan aktivasyonu",
          paragraphs: [
            "Ödeme başarıyla onaylandıktan sonra seçilen ücretli plan kullanıcı hesabında dijital olarak etkinleştirilir ve sistemde ilgili plan durumu güncellenir.",
            "Tetavio LLC, bankadan veya ödeme sağlayıcısından gelen onaya dayanır ve ödeme onaylanmadan hizmeti etkinleştirmez.",
            "Ödeme başarısız olursa, yarım kalırsa veya banka tarafından onaylanmazsa ücretli erişim açılmaz ve kullanıcı mevcut planda kalır.",
            "Kullanıcı ödeme sürecine devam etmeden önce ödeme şartlarını incelediğini ve kabul ettiğini onaylamalıdır.",
          ],
        },
      ],
    },
    "refund-policy": {
      title: "İade ve İptal Politikası",
      summary: "Bu politika, Tetavio üzerindeki abonelik iptali, alt plana geçiş ve olası iade durumlarına uygulanan temel kuralları belirler.",
      sections: [
        {
          heading: "İptal ve alt plana geçiş kuralları",
          paragraphs: [
            "Kullanıcı aboneliğin iptali veya daha düşük bir plana geçiş talebini destek veya iletişim kanalı üzerinden iletebilir.",
            "Aksi belirtilmedikçe iptal veya alt plana geçiş bir sonraki ödeme döneminden itibaren uygulanır.",
            "Mevcut dönem için zaten etkinleştirilmiş dijital erişim hakkı dönem sonuna kadar geçerli kalabilir.",
          ],
        },
        {
          heading: "İade ilkeleri",
          paragraphs: [
            "Tetavio dijital hizmet sunduğu için etkinleştirilmiş abonelik dönemleri genel olarak iade edilmez.",
            "Ancak mükerrer ödeme, teknik nedenlerle planın etkinleşmemesi veya doğrulanmış yetkisiz işlemler durumunda iade talepleri ayrıca incelenebilir.",
            "İadeler yalnızca Tetavio tarafından doğrulanmış haklı durumlarda yapılır.",
            "İade onaylandığında tutar mümkünse aynı ödeme yöntemiyle geri gönderilir.",
          ],
        },
        {
          heading: "Başvuru ve inceleme süresi",
          paragraphs: [
            "İade başvurusu kullanıcının e-posta adresini, işlem tarihini, tutarı ve başvuru nedenini içermelidir.",
            "Başvurular 5-10 iş günü içinde incelenir ve sonuç kullanıcıya iletişim bilgileri üzerinden bildirilir.",
          ],
        },
      ],
    },
    "privacy-policy": {
      title: "Gizlilik Politikası",
      summary: "Bu politika, Tetavio'nun hangi bilgileri topladığını, bunları nasıl kullandığını ve ödeme güvenliği için hangi temel ilkeleri uyguladığını açıklar.",
      sections: [
        {
          heading: "Toplanan bilgiler",
          paragraphs: [
            "Tetavio kullanıcıdan veya kullanıcı hesabından ad, e-posta adresi, telefon numarası, şirket bilgileri, sağlandığında vergi numarası, giriş ve oturum bilgileri, abonelik durumu ve ödeme durumu gibi bilgileri toplayabilir ve işleyebilir.",
            "Bu bilgiler hesabın yönetimi, aboneliğin etkinleştirilmesi, destek sağlanması, güvenliğin temini ve muhasebe ile yasal yükümlülüklerin yerine getirilmesi için kullanılır.",
          ],
        },
        {
          heading: "Kart verileri ve paylaşım ilkeleri",
          paragraphs: [
            "Tetavio sunucularında kart numarası, CVV/CVC kodu, son kullanma tarihi veya diğer hassas kart verilerini saklamaz.",
            "Kart ödeme bilgileri banka veya ödeme sağlayıcısı tarafından işlenir.",
            "Bilgiler yalnızca gerekli olduğunda ödeme sağlayıcıları, barındırma ve güvenlik hizmet sağlayıcıları ile veya yasaların gerektirdiği durumlarda yetkili kamu kurumlarıyla paylaşılır.",
          ],
        },
        {
          heading: "Kullanıcı hakları ve güvenlik önlemleri",
          paragraphs: [
            "Kullanıcı, mevzuatın izin verdiği ölçüde bilgilerini düzeltme, güncelleme veya silme talebinde bulunabilir.",
            "Tetavio bilgileri korumak için HTTPS/TLS bağlantıları, erişim kontrolleri, parola hashleme ve diğer kurumsal ve teknik güvenlik önlemlerini kullanır.",
            "Platformda oturum yönetimi ve kullanıcı tercihlerinin korunması için çerezler veya local storage mekanizmaları kullanılabilir.",
          ],
        },
      ],
    },
    "delivery-policy": {
      title: "Hizmet Sunumu / Dijital Aktivasyon Politikası",
      summary: "Tetavio fiziksel ürün teslim etmez; ödeme sonrasında hizmet kullanıcı hesabında dijital olarak etkinleştirilir.",
      sections: [
        {
          heading: "Dijital hizmetin sunulması",
          paragraphs: [
            "Tetavio dijital bir muhasebe SaaS hizmeti sunar ve kullanıcı ödeme yaptıktan sonra ilgili plana web hesabı üzerinden erişim elde eder.",
            "Başarılı ödeme onayından sonra ücretli plan genellikle hemen veya kısa bir teknik işlem süresi içinde kullanıcı hesabında etkinleştirilir.",
          ],
        },
        {
          heading: "Fiziksel teslimatın olmaması",
          paragraphs: [
            "Tetavio herhangi bir fiziksel ürün göndermez ve herhangi bir fiziksel teslimat hizmeti sunmaz.",
            "Hizmet sunumu yalnızca dijital erişim hakkının etkinleştirilmesi şeklinde gerçekleşir.",
          ],
        },
        {
          heading: "Aktivasyon, destek ve elektronik belgeler",
          paragraphs: [
            "Kullanıcı hizmete web hesabı üzerinden erişir ve aktif plan kapsamında sunulan işlevleri kullanır.",
            "Ödemeden sonra aktivasyon gerçekleşmezse kullanıcı destek ekibiyle iletişime geçebilir.",
            "Gerekli olduğunda ödeme, makbuz veya fatura bilgileri elektronik ortamda sağlanabilir.",
          ],
        },
      ],
    },
    "contact-info": {
      title: "Yasal Bilgiler ve İletişim Kanalları",
      summary: "Bu sayfada Tetavio LLC'nin yasal bilgileri ve kullanıcılar için resmi iletişim kanalları yer almaktadır.",
      sections: [
        {
          id: "legal-info",
          heading: "Yasal bilgiler",
          paragraphs: [
            "Tüzel kişi: Tetavio LLC",
            "Marka / platform: Tetavio",
            "Vergi numarası: 2009752131",
            "Yasal adres: Bakü şehri, Hatai ilçesi, Khudu Mammadov caddesi, bina 6, daire 185",
          ],
        },
        {
          id: "contact",
          heading: "İletişim kanalları",
          paragraphs: [
            "Genel e-posta: info@tetavio.com",
            "Destek e-postası: support@tetavio.com",
            "Telefon: +994 10 311 91 87",
            "Çalışma saatleri: Pazartesi - Cuma, 09:00 - 18:00",
            "Kullanıcılar ödeme, iade, iptal, hesap erişimi ve teknik sorunlar için bu iletişim kanallarını kullanabilir.",
          ],
        },
      ],
    },
  },
  de: {
    "terms-of-use": {
      title: "Nutzungsbedingungen",
      summary: "Diese Nutzungsbedingungen legen die Regeln für die Nutzung der Tetavio-Buchhaltungssoftware, die Pflichten der Nutzer und die Grundsätze der Leistungserbringung fest.",
      sections: [
        {
          heading: "Zweck der Plattform",
          paragraphs: [
            "Tetavio ist eine digitale Accounting-SaaS-Plattform, die Nutzern Online-Funktionen für Buchhaltung, Aufzeichnungen, Berichte und abonnementsbasierte Software bereitstellt.",
            "Die Plattform wird ausschließlich als digitaler Dienst angeboten, und der Nutzer stimmt zu, Tetavio für geschäftliche, buchhalterische und andere rechtmäßige Zwecke zu verwenden.",
          ],
        },
        {
          heading: "Benutzerkonto und rechtmäßige Nutzung",
          paragraphs: [
            "Der Nutzer ist für die Vertraulichkeit der E-Mail-Adresse, des Passworts und anderer Authentifizierungsdaten verantwortlich, die für den Kontozugang verwendet werden.",
            "Die Nutzung von Tetavio für rechtswidrige, betrügerische, irreführende, rechteverletzende oder sicherheitsgefährdende Zwecke ist untersagt.",
            "Der Nutzer ist für die Richtigkeit der über das Konto eingegebenen Informationen und für die Einhaltung der geltenden Gesetze verantwortlich.",
          ],
        },
        {
          heading: "Abonnementzugang und geistiges Eigentum",
          paragraphs: [
            "Der Zugang zu kostenpflichtigen Plänen wird nur nach erfolgreicher Zahlung oder bei aktiver Subscription gewährt und gibt dem Nutzer ein begrenztes Nutzungsrecht im Rahmen des gewählten Plans.",
            "Die Software, das Design, die Inhalte, Logos und alle anderen Elemente der Plattform gehören ausschließlich der Tetavio LLC und sind nach dem Recht der Republik Aserbaidschan geschützt.",
          ],
        },
        {
          heading: "Verfügbarkeit, Haftung und Aktualisierungen",
          paragraphs: [
            "Tetavio bemüht sich um eine kontinuierliche Verfügbarkeit des Dienstes, jedoch können vorübergehende Unterbrechungen aufgrund von Wartung, Updates, Integrationsproblemen, Netzwerkausfällen oder höherer Gewalt auftreten.",
            "Soweit gesetzlich nicht anders vorgeschrieben, haftet Tetavio nicht vollständig für indirekte Schäden, entgangene Einnahmen, Datenverluste oder Folgen, die durch Systeme Dritter verursacht werden.",
            "Diese Bedingungen unterliegen dem Recht der Republik Aserbaidschan.",
            "Tetavio behält sich das Recht vor, diese Nutzungsbedingungen und Serviceregeln jederzeit zu aktualisieren.",
          ],
        },
      ],
    },
    "payment-terms": {
      title: "Zahlungsbedingungen",
      summary: "Diese Seite erläutert, wie Tetavio-Abonnementzahlungen funktionieren, welche Grundsätze für Zahlungssicherheit gelten und wie Pläne nach der Zahlung aktiviert werden.",
      sections: [
        {
          heading: "Gegenstand der Zahlung und Währung",
          paragraphs: [
            "Zahlungen bei Tetavio gelten ausschließlich für den Kauf, die Verlängerung oder das Upgrade digitaler SaaS-Abonnementpläne. Es werden keine physischen Produkte verkauft oder geliefert.",
            "Alle auf der Plattform angezeigten Preise sind in Aserbaidschan-Manat (AZN) angegeben, sofern nicht ausdrücklich etwas anderes vermerkt ist.",
          ],
        },
        {
          heading: "Zahlungsmethode und Verarbeitung von Kartendaten",
          paragraphs: [
            "Zahlungen werden per Bankkarte über PASHA Bank E-commerce / Virtual POS oder eine kompatible Zahlungsinfrastruktur abgewickelt.",
            "Der Nutzer ist für die Richtigkeit der von ihm angegebenen Zahlungsdaten verantwortlich.",
            "Tetavio speichert, verarbeitet oder erhält auf seinen Servern keine Kartennummern, CVV/CVC-Codes oder Ablaufdaten.",
            "Kartenzahlungsdaten werden ausschließlich in der sicheren Zahlungsinfrastruktur der Bank oder des Zahlungsanbieters verarbeitet.",
          ],
        },
        {
          heading: "Zahlungsbestätigung und Aktivierung des Plans",
          paragraphs: [
            "Nach erfolgreicher Zahlungsbestätigung wird der gewählte kostenpflichtige Plan digital im Benutzerkonto aktiviert und der entsprechende Planstatus im System aktualisiert.",
            "Tetavio LLC stützt sich auf die Bestätigung der Bank oder des Zahlungsanbieters und aktiviert den Dienst nicht vor bestätigter Zahlung.",
            "Wenn die Zahlung fehlschlägt, unvollständig bleibt oder von der Bank nicht bestätigt wird, wird der kostenpflichtige Zugang nicht aktiviert und der Nutzer verbleibt im aktuellen Plan.",
            "Vor dem Fortsetzen des Checkout-Prozesses muss der Nutzer bestätigen, dass er die Zahlungsbedingungen gelesen und akzeptiert hat.",
          ],
        },
      ],
    },
    "refund-policy": {
      title: "Rückerstattungs- und Kündigungsrichtlinie",
      summary: "Diese Richtlinie legt die wichtigsten Regeln fest, die für Kündigungen, Downgrades und mögliche Rückerstattungsfälle bei Tetavio gelten.",
      sections: [
        {
          heading: "Regeln für Kündigung und Downgrade",
          paragraphs: [
            "Der Nutzer kann eine Anfrage zur Kündigung der Subscription oder zum Wechsel in einen niedrigeren Plan über den Support oder den Kontaktkanal stellen.",
            "Sofern nicht anders angegeben, wird eine Kündigung oder ein Downgrade ab der nächsten Abrechnungsperiode wirksam.",
            "Bereits aktivierte digitale Zugriffsrechte für den aktuellen Zeitraum können bis zum Ende dieses Zeitraums gültig bleiben.",
          ],
        },
        {
          heading: "Grundsätze der Rückerstattung",
          paragraphs: [
            "Da Tetavio einen digitalen Dienst bereitstellt, sind aktivierte Abonnementzeiträume grundsätzlich nicht erstattungsfähig.",
            "Rückerstattungsanfragen können jedoch gesondert geprüft werden, wenn es zu Doppelzahlungen, einer aus technischen Gründen fehlgeschlagenen Planaktivierung oder bestätigten unbefugten Transaktionen kommt.",
            "Rückerstattungen werden nur in begründeten und von Tetavio bestätigten Fällen vorgenommen.",
            "Wenn eine Rückerstattung genehmigt wird, erfolgt die Erstattung nach Möglichkeit auf dieselbe Zahlungsmethode.",
          ],
        },
        {
          heading: "Antrag und Prüfungsfrist",
          paragraphs: [
            "Ein Rückerstattungsantrag muss die E-Mail-Adresse des Nutzers, das Transaktionsdatum, den Betrag und den Grund des Antrags enthalten.",
            "Anträge werden innerhalb von 5-10 Arbeitstagen geprüft, und das Ergebnis wird dem Nutzer über die hinterlegten Kontaktdaten mitgeteilt.",
          ],
        },
      ],
    },
    "privacy-policy": {
      title: "Datenschutzerklärung",
      summary: "Diese Richtlinie erläutert, welche Informationen Tetavio erhebt, wie sie verwendet werden und welche grundlegenden Prinzipien für die Zahlungssicherheit gelten.",
      sections: [
        {
          heading: "Erhobene Informationen",
          paragraphs: [
            "Tetavio kann Informationen wie Name, E-Mail-Adresse, Telefonnummer, Unternehmensdaten, Steuer-ID bei Angabe, Login- und Sitzungsdaten, Abonnementstatus und Zahlungsstatus vom Nutzer oder aus dem Benutzerkonto erheben und verarbeiten.",
            "Diese Informationen werden zur Kontoverwaltung, Aktivierung der Subscription, Bereitstellung von Support, Gewährleistung der Sicherheit sowie zur Erfüllung buchhalterischer und rechtlicher Pflichten verwendet.",
          ],
        },
        {
          heading: "Kartendaten und Weitergaberegeln",
          paragraphs: [
            "Tetavio speichert auf seinen Servern keine Kartennummern, CVV/CVC-Codes, Ablaufdaten oder andere sensible Kartendaten.",
            "Kartenbezogene Zahlungsinformationen werden von der Bank oder dem Zahlungsanbieter verarbeitet.",
            "Informationen werden nur bei Bedarf an Zahlungsanbieter, Hosting- und Sicherheitsdienstleister oder an befugte staatliche Stellen weitergegeben, wenn dies gesetzlich vorgeschrieben ist.",
          ],
        },
        {
          heading: "Benutzerrechte und Sicherheitsmaßnahmen",
          paragraphs: [
            "Soweit gesetzlich zulässig, kann der Nutzer die Berichtigung, Aktualisierung oder Löschung seiner Daten verlangen.",
            "Tetavio verwendet HTTPS/TLS-Verbindungen, Zugriffskontrollen, Passwort-Hashing und andere organisatorische und technische Sicherheitsmaßnahmen zum Schutz der Daten.",
            "Auf der Plattform können Cookies oder Local-Storage-Mechanismen zur Sitzungsverwaltung und zur Speicherung von Nutzereinstellungen verwendet werden.",
          ],
        },
      ],
    },
    "delivery-policy": {
      title: "Richtlinie zur Leistungserbringung / digitalen Aktivierung",
      summary: "Tetavio liefert keine physischen Produkte; nach der Zahlung wird der Dienst digital im Benutzerkonto aktiviert.",
      sections: [
        {
          heading: "Erbringung des digitalen Dienstes",
          paragraphs: [
            "Tetavio stellt einen digitalen Buchhaltungs-SaaS-Dienst bereit, und nach der Zahlung erhält der Nutzer über das Webkonto Zugriff auf den entsprechenden Plan.",
            "Nach erfolgreicher Zahlungsbestätigung wird der kostenpflichtige Plan in der Regel sofort oder innerhalb einer kurzen technischen Verarbeitungszeit im Benutzerkonto aktiviert.",
          ],
        },
        {
          heading: "Keine physische Lieferung",
          paragraphs: [
            "Tetavio versendet keine physischen Produkte und bietet keinen physischen Lieferservice an.",
            "Die Leistungserbringung erfolgt ausschließlich durch die Aktivierung eines digitalen Zugriffsrechts.",
          ],
        },
        {
          heading: "Aktivierung, Support und elektronische Dokumente",
          paragraphs: [
            "Der Nutzer greift über das Webkonto auf den Dienst zu und verwendet die im aktiven Plan bereitgestellten Funktionen.",
            "Wenn die Aktivierung nach der Zahlung nicht erfolgt, kann der Nutzer das Support-Team kontaktieren.",
            "Falls erforderlich, können Zahlungs-, Beleg- oder Rechnungsinformationen elektronisch bereitgestellt werden.",
          ],
        },
      ],
    },
    "contact-info": {
      title: "Rechtliche Informationen und Kontaktangaben",
      summary: "Diese Seite enthält die rechtlichen Angaben der Tetavio LLC und die offiziellen Kontaktkanäle für Nutzer.",
      sections: [
        {
          id: "legal-info",
          heading: "Rechtliche Informationen",
          paragraphs: [
            "Rechtsträger: Tetavio LLC",
            "Marke / Plattform: Tetavio",
            "Steuernummer: 2009752131",
            "Rechtliche Anschrift: Stadt Baku, Bezirk Khatai, Straße Khudu Mammadov, Gebäude 6, Wohnung 185",
          ],
        },
        {
          id: "contact",
          heading: "Kontaktkanäle",
          paragraphs: [
            "Allgemeine E-Mail: info@tetavio.com",
            "Support-E-Mail: support@tetavio.com",
            "Telefon: +994 10 311 91 87",
            "Geschäftszeiten: Montag - Freitag, 09:00 - 18:00",
            "Nutzer können diese Kontaktkanäle für Zahlungen, Rückerstattungen, Kündigungen, Kontozugang und technische Probleme verwenden.",
          ],
        },
      ],
    },
  },
};
const LEGAL_NAV_ITEMS = [
  { id: "terms-of-use", label: "İstifadə şərtləri", href: "/accounting/terms-of-use", pageId: "terms-of-use" },
  { id: "payment-terms", label: "Ödəniş şərtləri", href: "/accounting/payment-terms", pageId: "payment-terms" },
  { id: "refund-policy", label: "Geri qaytarma və ləğv siyasəti", href: "/accounting/refund-policy", pageId: "refund-policy" },
  { id: "privacy-policy", label: "Məxfilik siyasəti", href: "/accounting/privacy-policy", pageId: "privacy-policy" },
  { id: "delivery-policy", label: "Xidmətin təqdim edilməsi / rəqəmsal aktivləşdirmə siyasəti", href: "/accounting/delivery-policy", pageId: "delivery-policy" },
  { id: "company-info", label: "Hüquqi məlumatlar", href: "/accounting/contact-info#legal-info", pageId: "contact-info", hash: "legal-info" },
  { id: "contact", label: "Əlaqə", href: "/accounting/contact-info#contact", pageId: "contact-info", hash: "contact" },
];
const LEGACY_STORAGE_PREFIXES = ["tetavio-erp-data-v4", "finotam-auth-users-v1", "finotam-auth-remember-v1", "finotam-auth-reset-v1"];

function getContactInfoHash() {
  return String(window.location.hash || "").replace(/^#/, "").trim();
}

function resolveStandaloneLegalSlug(slug) {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return "";
  return LEGAL_STANDALONE_ALIASES[normalizedSlug] || normalizedSlug;
}

function normalizeStandaloneLegalLang(lang) {
  return LEGAL_STANDALONE_LANGS.includes(lang) ? lang : "az";
}

function getLegalPageTranslation(pageId, lang) {
  const resolvedPageId = resolveStandaloneLegalSlug(pageId);
  const normalizedLang = normalizeStandaloneLegalLang(lang);
  return LEGAL_PAGE_TRANSLATIONS[normalizedLang]?.[resolvedPageId] || null;
}

function getLegalPageTitle(pageId, lang) {
  const resolvedPageId = resolveStandaloneLegalSlug(pageId);
  const fallbackPage = COMPLIANCE_LEGAL_PAGE_MAP[resolvedPageId];
  return getLegalPageTranslation(resolvedPageId, lang)?.title || fallbackPage?.title || "";
}

function getLegalPageSummary(pageId, lang) {
  const resolvedPageId = resolveStandaloneLegalSlug(pageId);
  const fallbackPage = COMPLIANCE_LEGAL_PAGE_MAP[resolvedPageId];
  return getLegalPageTranslation(resolvedPageId, lang)?.summary || fallbackPage?.summary || "";
}

function getLegalPageSections(pageId, lang) {
  const resolvedPageId = resolveStandaloneLegalSlug(pageId);
  const fallbackPage = COMPLIANCE_LEGAL_PAGE_MAP[resolvedPageId];
  const translatedSections = getLegalPageTranslation(resolvedPageId, lang)?.sections;
  return Array.isArray(translatedSections)
    ? translatedSections
    : Array.isArray(fallbackPage?.sections)
      ? fallbackPage.sections
      : [];
}

function getLegalNavLabel(pageId, lang) {
  const normalizedLang = normalizeStandaloneLegalLang(lang);
  const fallbackItem = LEGAL_NAV_ITEMS.find((item) => item.id === pageId);
  return LEGAL_NAV_LABEL_TRANSLATIONS[normalizedLang]?.[pageId] || fallbackItem?.label || "";
}

function getLegalSectionId(pageId, section, index) {
  if (resolveStandaloneLegalSlug(pageId) !== "contact-info") return undefined;
  if (section?.id) return section.id;
  return LEGAL_CONTACT_SECTION_IDS[index];
}

function getActiveLegalNavId(pageId) {
  if (pageId !== "contact-info") return pageId;
  return getContactInfoHash() === "contact" ? "contact" : "company-info";
}

function getVisibleLegalSections(page) {
  const sections = Array.isArray(page?.sections) ? page.sections : [];
  if (page?.id !== "contact-info") return sections;
  const currentHash = getContactInfoHash();
  if (currentHash === "legal-info") {
    return sections.filter((section, index) => getLegalSectionId(page.id, section, index) === "legal-info");
  }
  if (currentHash === "contact") {
    return sections.filter((section, index) => getLegalSectionId(page.id, section, index) === "contact");
  }
  return sections;
}

function getVisibleStandaloneLegalSections(pageId, sections) {
  if (resolveStandaloneLegalSlug(pageId) !== "contact-info") return sections || [];
  const currentHash = getContactInfoHash();
  const normalizedSections = Array.isArray(sections) ? sections : [];
  if (currentHash === "legal-info") {
    return normalizedSections.filter((section, index) => getLegalSectionId(pageId, section, index) === "legal-info");
  }
  if (currentHash === "contact") {
    return normalizedSections.filter((section, index) => getLegalSectionId(pageId, section, index) === "contact");
  }
  return normalizedSections;
}

const MODULES_BASE = {
  itemsCatalog: {
    title: "Mal və Xidmət Kataloqu", singular: "Mal və xidmət", collection: "items", summary: "Mal və xidmət adlarının siyahısı.",
    columns: [["name", "Ad"], ["sku", "SKU"], ["type", "Növ"], ["rate", "Qiymət", "currency"], ["stockOnHand", "Qalıq"]],
    form: [["name", "Ad"], ["sku", "SKU"], ["type", "Növ", "select", "Xidmət", ["Xidmət", "Anbar malı", "Qeyri-anbar malı"]], ["rate", "Satış qiyməti", "number", "0"], ["purchaseRate", "Alış qiyməti", "number", "0"], ["stockOnHand", "Açılış qalığı", "number", "0"], ["trackInventory", "Anbar izləməsi", "select", "Xeyr", ["Bəli", "Xeyr"]], ["reorderPoint", "Minimum ehtiyat həddi", "number", "0"], ["preferredVendor", "Əsas təchizatçı"], ["salesAccount", "Satış hesabı"], ["purchaseAccount", "Alış hesabı"], ["salesDescription", "Satış təsviri"], ["purchaseDescription", "Alış təsviri"], ["enableSalesInfo", "Satış məlumatı aktivdir", "select", "Bəli", ["Bəli", "Xeyr"]], ["enablePurchaseInfo", "Alış məlumatı aktivdir", "select", "Bəli", ["Bəli", "Xeyr"]]]
  },
  customers: {
    title: "Müştərilər", singular: "Müştəri", collection: "customers", summary: "Müştəri bazası və debitor borcları.",
    columns: [["companyName", "Şirkət"], ["taxId", "VÖEN"], ["phone", "Telefon"]],
    form: [["displayName", "Ad"], ["companyName", "Şirkət"], ["taxId", "VÖEN"], ["phone", "Telefon"], ["email", "E-poçt", "email"], ["outstandingReceivables", "Debitor borcu", "number", "0"]]
  },
  quotes: {
    title: "Təkliflər", singular: "Təklif", collection: "quotes", summary: "Satış təklifləri.",
    columns: [["quoteNumber", "Təklif #"], ["customerName", "Müştəri"], ["status", "Status", "status"], ["validUntil", "Etibarlıdır", "date"], ["amount", "Məbləğ", "currency"]],
    form: [["quoteNumber", "Təklif #"], ["customerName", "Müştəri"], ["status", "Status", "select", "Qaralama", ["Qaralama", "Göndərilib", "Qəbul edilib"]], ["validUntil", "Etibarlıdır", "date", today()], ["amount", "Məbləğ", "number", "0"]]
  },
  invoices: {
    title: "Satış qaimələri", singular: "Satış qaiməsi", collection: "invoices", summary: "Satış qaimələri.",
    columns: [["invoiceNumber", "Faktura #"], ["customerName", "Müştəri"], ["status", "Status", "status"], ["dueDate", "Son tarix", "date"], ["amount", "Məbləğ", "currency"], ["outstanding", "Qalıq", "currency"]],
    form: [["invoiceNumber", "Faktura #"], ["customerName", "Müştəri"], ["status", "Status", "select", "Qaralama", ["Qaralama", "Göndərilib", "Gecikib", "Ödənilib"]], ["dueDate", "Son tarix", "date", today()], ["amount", "Məbləğ", "number", "0"]]
  },
  salesReceipts: {
    title: "Satış qəbzləri", singular: "Satış qəbzi", collection: "salesReceipts", summary: "Birbaşa alınan satış ödənişləri.",
    columns: [["receiptNumber", "Qəbz #"], ["customerName", "Müştəri"], ["paymentMode", "Ödəmə üsulu"], ["date", "Tarix", "date"], ["amount", "Məbləğ", "currency"]],
    form: [["receiptNumber", "Qəbz #"], ["customerName", "Müştəri"], ["paymentMode", "Ödəmə üsulu", "select", "Bank köçürməsi", ["Nağd", "Bank köçürməsi", "Kart"]], ["date", "Tarix", "date", today()], ["amount", "Məbləğ", "number", "0"]]
  },
  recurringInvoices: {
    title: "Təkrarlanan fakturalar", singular: "Təkrarlanan faktura", collection: "recurringInvoices", summary: "Dövri faktura profilləri.",
    columns: [["profileName", "Profil"], ["customerName", "Müştəri"], ["frequency", "Tezlik"], ["nextRunDate", "Növbəti tarix", "date"], ["amount", "Məbləğ", "currency"]],
    form: [["profileName", "Profil"], ["customerName", "Müştəri"], ["frequency", "Tezlik", "select", "Aylıq", ["Həftəlik", "Aylıq", "Rüblük"]], ["nextRunDate", "Növbəti tarix", "date", today()], ["amount", "Məbləğ", "number", "0"]]
  },
  paymentsReceived: {
    title: "Alınan ödənişlər", singular: "Ödəniş", collection: "paymentsReceived", summary: "Faktura üzrə daxil olan ödənişlər.",
    columns: [["paymentNumber", "Ödəniş #"], ["customerName", "Müştəri"], ["invoiceRef", "Faktura"], ["date", "Tarix", "date"], ["paymentMode", "Üsul"], ["amount", "Məbləğ", "currency"]],
    form: [["paymentNumber", "Ödəniş #"], ["customerName", "Müştəri"], ["invoiceRef", "Faktura"], ["date", "Tarix", "date", today()], ["paymentMode", "Üsul", "select", "Bank köçürməsi", ["Bank köçürməsi", "Nağd", "Kart"]], ["amount", "Məbləğ", "number", "0"]]
  },
  creditNotes: {
    title: "Kredit notları", singular: "Kredit notu", collection: "creditNotes", summary: "Qaytarma və kredit sənədləri.",
    columns: [["creditNumber", "Kredit #"], ["customerName", "Müştəri"], ["invoiceRef", "Faktura"], ["date", "Tarix", "date"], ["status", "Status", "status"], ["amount", "Məbləğ", "currency"]],
    form: [["creditNumber", "Kredit #"], ["customerName", "Müştəri"], ["invoiceRef", "Faktura"], ["date", "Tarix", "date", today()], ["status", "Status", "select", "Açıq", ["Açıq", "Tətbiq edilib", "Bağlanıb"]], ["amount", "Məbləğ", "number", "0"]]
  },
  vendors: {
    title: "Təchizatçılar", singular: "Təchizatçı", collection: "vendors", summary: "Təchizatçı bazası və kreditor borcları.",
    columns: [["companyName", "Şirkət"], ["phone", "Əlaqə"], ["email", "E-poçt"], ["taxId", "VÖEN"]],
    form: [["vendorName", "Təchizatçı"], ["companyName", "Şirkət"], ["phone", "Əlaqə"], ["email", "E-poçt", "email"], ["taxId", "VÖEN"]]
  },
  goods: {
    title: "Nomenklatura",
    singular: "Nomenklatura",
    collection: "goods",
    summary: "Mal və xidmət adlarının siyahısı.",
    columns: [["name", "Ad"], ["type", "Növ"], ["code", "Kod"]],
    form: [["name", "Ad"], ["type", "Növ", "select", "Mal", ["Mal", "Xidmət"]], ["unit", "Ölçü vahidi"], ["code", "Kod"]]
  },
  incomingGoodsServices: {
    title: "Mal və xidmətlər",
    singular: "Qaimə",
    collection: "incomingGoodsServices",
    summary: "Alınmış mal və xidmətlərin qaimələri.",
    columns: [["billNumber", "Qaimə №"], ["billDate", "Tarix", "date"], ["vendorName", "Satıcı"], ["totalAmount", "Cəmi", "currency"]],
    form: [["billNumber", "Qaimə №"], ["billDate", "Tarix", "date"], ["vendorName", "Satıcı"], ["notes", "Qeydlər"], ["discount", "Endirim (%)", "number", "0"], ["adjustment", "Düzəliş", "number", "0"], ["subTotal", "Alt cəmi", "number", "0"], ["totalAmount", "Cəmi məbləğ", "number", "0"]]
  },
  expenses: {
    title: "Xərclər", singular: "Xərc", collection: "expenses", summary: "Əməliyyat xərcləri.",
    columns: [["expenseNumber", "Xərc #"], ["vendorName", "Təchizatçı"], ["category", "Kateqoriya"], ["date", "Tarix", "date"], ["paymentMode", "Ödəmə üsulu"], ["amount", "Məbləğ", "currency"]],
    form: [["expenseNumber", "Xərc #"], ["vendorName", "Təchizatçı"], ["category", "Kateqoriya", "select", "Yanacaq", ["Yanacaq", "İcarə", "Proqram təminatı", "Ofis ləvazimatları"]], ["date", "Tarix", "date", today()], ["paymentMode", "Ödəmə üsulu", "select", "Kart", ["Nağd", "Kart", "Bank köçürməsi"]], ["amount", "Məbləğ", "number", "0"]]
  },
  bills: {
    title: "Hesab-fakturalar", singular: "Hesab-faktura", collection: "bills", summary: "Təchizatçı öhdəlikləri.",
    columns: [["billNumber", "Hesab #"], ["vendorName", "Təchizatçı"], ["status", "Status", "status"], ["dueDate", "Son tarix", "date"], ["amount", "Məbləğ", "currency"]],
    form: [["billNumber", "Hesab #"], ["vendorName", "Təchizatçı"], ["status", "Status", "select", "Açıq", ["Açıq", "Qismən ödənilib", "Ödənilib"]], ["dueDate", "Son tarix", "date", today()], ["amount", "Məbləğ", "number", "0"]]
  },
  manualJournals: {
    title: "Əl ilə daxil edilən əməliyyatlar", singular: "Əl ilə daxil edilən əməliyyat", collection: "manualJournals", summary: "Əl ilə daxil edilən müxabirləşmə əməliyyatları.",
    columns: [["journalNumber", "Jurnal #"], ["reference", "Təyinat"], ["debitAccount", "Debet hesabı"], ["creditAccount", "Kredit hesabı"], ["date", "Tarix", "date"], ["debit", "Debet", "currency"]],
    form: [["journalNumber", "Jurnal #"], ["reference", "Təyinat"], ["debitAccount", "Debet hesabı"], ["creditAccount", "Kredit hesabı"], ["date", "Tarix", "date", today()], ["debit", "Debet", "number", "0"], ["credit", "Kredit", "number", "0"]]
  },
  chartOfAccounts: {
    title: "Hesablar planı", singular: "Hesab", collection: "chartOfAccounts", summary: "Mühasibat hesabları.",
    columns: [["accountCode", "Kod"], ["accountName", "Hesab"], ["accountType", "Növ"], ["status", "Status", "status"]],
    form: [["accountCode", "Kod"], ["accountName", "Hesab"], ["accountType", "Növ", "select", "Aktiv", ["Aktiv", "Öhdəlik", "Gəlir", "Xərc", "Kapital"]], ["status", "Status", "select", "Aktiv", ["Aktiv", "Passiv"]], ["balance", "Balans", "number", "0"]]
  },
  trialBalance: {
    title: "Sınaq balansı", singular: "Sınaq balansı", collection: "chartOfAccounts", summary: "Açılış qalığı, dövriyyə və son qalıq üzrə sınaq balansı."
  },
  receivables: {
    title: "Debitor borclar", singular: "Debitor", collection: "customers", summary: "Müştərilərdən alınacaq ödənişlər və debitor qalıqları."
  },
  arAging: {
    title: "Debitor yaşlanma hesabatı", singular: "Debitor yaşlanma", collection: "reports", summary: "Ödənilməmiş fakturalar ödəniş tarixinə görə qruplaşdırılır."
  },
  payables: {
    title: "Kreditor borclar", singular: "Kreditor", collection: "vendors", summary: "Təchizatçılara ödəniləcək məbləğlər və kreditor qalıqları."
  },
  accountCard: {
    title: "Hesab kartı", singular: "Hesab kartı", collection: "reports", summary: "Seçilmiş hesab üzrə debet, kredit və qalıq dövriyyəsinin xronoloji kartı."
  },
  financialPositionReport: {
    title: "Maliyyə vəziyyəti haqqında hesabat", singular: "Maliyyə vəziyyəti hesabatı", collection: "reports", summary: "Aktiv, öhdəlik və kapitalın cari vəziyyəti."
  },
  profitLossReport: {
    title: "Mənfəət və zərər haqqında hesabat", singular: "Mənfəət və zərər hesabatı", collection: "reports", summary: "Gəlir, xərc və xalis nəticə göstəriciləri."
  },
  cashFlowReport: {
    title: "Pul vəsaitlərinin hərəkəti haqqında hesabat", singular: "Pul vəsaitlərinin hərəkəti hesabatı", collection: "reports", summary: "Pul daxilolmaları və çıxışlarının icmalı."
  },
  equityChangesReport: {
    title: "Kapitalda dəyişikliklər hesabatı", singular: "Kapital hesabatı", collection: "reports", summary: "Kapital, ehtiyatlar və bölüşdürülməmiş mənfəət üzrə dəyişikliklər."
  },
  operationsJournal: {
    title: "Əməliyyatlar jurnalı", singular: "Əməliyyatlar jurnalı", collection: "manualJournals", summary: "Əl ilə və avtomatik daxil edilmiş bütün müxabirləşmələr."
  }
};

const MODULES = MODULES_BASE;

function getModules(at) {
  return {
    itemsCatalog: {
      title: at.mod_itemsCatalog, singular: at.mod_itemsCatalogSingular, collection: "items", summary: at.mod_itemsCatalogSummary,
      columns: [["name", "Ad"], ["sku", "SKU"], ["type", "Növ"], ["rate", "Qiymət", "currency"], ["stockOnHand", "Qalıq"]],
      form: [["name", "Ad"], ["sku", "SKU"], ["type", "Növ", "select", at.opt_service, [at.opt_service, at.opt_warehouseGoods, at.opt_nonWarehouseGoods]], ["rate", at.ic_salePrice, "number", "0"], ["purchaseRate", at.ic_purchPrice, "number", "0"], ["stockOnHand", at.ic_openingQty, "number", "0"], ["trackInventory", at.ic_tracking, "select", at.opt_no, [at.opt_yes, at.opt_no]], ["reorderPoint", at.ic_reorderPt, "number", "0"], ["preferredVendor", at.ic_prefVendor], ["salesAccount", at.opt_salesAccount], ["purchaseAccount", at.opt_purchaseAccount], ["salesDescription", at.opt_salesDescription], ["purchaseDescription", at.opt_purchaseDescription], ["enableSalesInfo", at.opt_enableSalesInfo, "select", at.opt_yes, [at.opt_yes, at.opt_no]], ["enablePurchaseInfo", at.opt_enablePurchaseInfo, "select", at.opt_yes, [at.opt_yes, at.opt_no]]]
    },
    customers: {
      title: at.mod_customers, singular: at.mod_customersSingular, collection: "customers", summary: at.mod_customersSummary,
      columns: [["companyName", at.col["Şirkət"]], ["taxId", at.col["VÖEN"] || "VÖEN"], ["phone", at.col["Telefon"] || "Telefon"]],
      form: [["displayName", "Ad"], ["companyName", at.col["Şirkət"]], ["taxId", at.col["VÖEN"] || "VÖEN"], ["phone", at.col["Telefon"] || "Telefon"], ["email", at.fld["E-poçt"], "email"], ["outstandingReceivables", at.col["Debitor borcu"], "number", "0"]]
    },
    quotes: {
      title: at.mod_quotes, singular: at.mod_quotesSingular, collection: "quotes", summary: at.mod_quotesSummary,
      columns: [["quoteNumber", "Təklif #"], ["customerName", "Müştəri"], ["status", "Status", "status"], ["validUntil", at.col["Etibarlıdır"], "date"], ["amount", at.col["Məbləğ"], "currency"]],
      form: [["quoteNumber", "Təklif #"], ["customerName", "Müştəri"], ["status", "Status", "select", at.statusDraft, [at.statusDraft, at.statusSent, at.statusAccepted]], ["validUntil", at.col["Etibarlıdır"], "date", today()], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    invoices: {
      title: at.mod_invoices, singular: at.mod_invoicesSingular, collection: "invoices", summary: at.mod_invoicesSummary,
      columns: [["invoiceNumber", at.col["Faktura #"]], ["customerName", "Müştəri"], ["status", "Status", "status"], ["dueDate", at.col["Son tarix"], "date"], ["amount", at.col["Məbləğ"], "currency"], ["outstanding", "Qalıq", "currency"]],
      form: [["invoiceNumber", at.col["Faktura #"]], ["customerName", "Müştəri"], ["status", "Status", "select", at.statusDraft, [at.statusDraft, at.statusSent, at.statusOverdue, at.statusPaid]], ["dueDate", at.col["Son tarix"], "date", today()], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    salesReceipts: {
      title: at.mod_salesReceipts, singular: at.mod_salesReceiptsSingular, collection: "salesReceipts", summary: at.mod_salesReceiptsSummary,
      columns: [["receiptNumber", at.col["Qəbz #"]], ["customerName", "Müştəri"], ["paymentMode", at.col["Ödəmə üsulu"]], ["date", at.col["Tarix"], "date"], ["amount", at.col["Məbləğ"], "currency"]],
      form: [["receiptNumber", at.col["Qəbz #"]], ["customerName", "Müştəri"], ["paymentMode", at.col["Ödəmə üsulu"], "select", at.opt_bankTransfer, [at.opt_cash, at.opt_bankTransfer, at.opt_card]], ["date", at.col["Tarix"], "date", today()], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    recurringInvoices: {
      title: at.mod_recurringInvoices, singular: at.mod_recurringInvoicesSingular, collection: "recurringInvoices", summary: at.mod_recurringInvoicesSummary,
      columns: [["profileName", at.opt_profile], ["customerName", "Müştəri"], ["frequency", at.opt_frequency], ["nextRunDate", at.opt_nextDate, "date"], ["amount", at.col["Məbləğ"], "currency"]],
      form: [["profileName", at.opt_profile], ["customerName", "Müştəri"], ["frequency", at.opt_frequency, "select", at.opt_monthly, [at.opt_weekly, at.opt_monthly, at.opt_quarterly]], ["nextRunDate", at.opt_nextDate, "date", today()], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    paymentsReceived: {
      title: at.mod_paymentsReceived, singular: at.mod_paymentsReceivedSingular, collection: "paymentsReceived", summary: at.mod_paymentsReceivedSummary,
      columns: [["paymentNumber", at.col["Ödəniş #"]], ["customerName", "Müştəri"], ["invoiceRef", at.opt_invoiceRef], ["date", at.col["Tarix"], "date"], ["paymentMode", at.opt_mode], ["amount", at.col["Məbləğ"], "currency"]],
      form: [["paymentNumber", at.col["Ödəniş #"]], ["customerName", "Müştəri"], ["invoiceRef", at.opt_invoiceRef], ["date", at.col["Tarix"], "date", today()], ["paymentMode", at.opt_mode, "select", at.opt_bankTransfer, [at.opt_bankTransfer, at.opt_cash, at.opt_card]], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    creditNotes: {
      title: at.mod_creditNotes, singular: at.mod_creditNotesSingular, collection: "creditNotes", summary: at.mod_creditNotesSummary,
      columns: [["creditNumber", at.col["Kredit #"]], ["customerName", "Müştəri"], ["invoiceRef", at.opt_invoiceRef], ["date", at.col["Tarix"], "date"], ["status", "Status", "status"], ["amount", at.col["Məbləğ"], "currency"]],
      form: [["creditNumber", at.col["Kredit #"]], ["customerName", "Müştəri"], ["invoiceRef", at.opt_invoiceRef], ["date", at.col["Tarix"], "date", today()], ["status", "Status", "select", at.statusOpen, [at.statusOpen, at.statusApplied, at.statusClosed]], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    vendors: {
      title: at.mod_vendors, singular: at.mod_vendorsSingular, collection: "vendors", summary: at.mod_vendorsSummary,
      columns: [["companyName", at.col["Şirkət"]], ["phone", at.col["Əlaqə"] || "Əlaqə"], ["email", at.col["E-poçt"]], ["taxId", at.col["VÖEN"] || "VÖEN"]],
      form: [["vendorName", at.opt_vendor], ["companyName", at.col["Şirkət"]], ["phone", at.col["Əlaqə"] || "Əlaqə"], ["email", at.fld["E-poçt"], "email"], ["taxId", at.col["VÖEN"] || "VÖEN"]]
    },
    goods: {
      title: at.mod_goods, singular: at.mod_goodsSingular, collection: "goods", summary: at.mod_goodsSummary,
      columns: [["name", "Ad"], ["type", at.opt_type], ["code", at.opt_code]],
      form: [["name", "Ad"], ["type", at.opt_type, "select", at.opt_product, [at.opt_product, at.opt_service]], ["unit", at.opt_unit], ["code", at.opt_code]]
    },
    incomingGoodsServices: {
      title: at.mod_incomingGoodsServices, singular: at.mod_incomingGoodsServicesSingular, collection: "incomingGoodsServices", summary: at.mod_incomingGoodsServicesSummary,
      columns: [["billNumber", at.col["Qaimə №"]], ["billDate", at.col["Tarix"], "date"], ["vendorName", at.col["Satıcı"]], ["totalAmount", at.col["Cəmi"], "currency"]],
      form: [["billNumber", at.col["Qaimə №"]], ["billDate", at.col["Tarix"], "date"], ["vendorName", at.col["Satıcı"]], ["notes", at.opt_notes], ["discount", at.opt_discountPct, "number", "0"], ["adjustment", at.opt_adjustment, "number", "0"], ["subTotal", at.opt_subTotal, "number", "0"], ["totalAmount", at.fld["Cəmi məbləğ"], "number", "0"]]
    },
    expenses: {
      title: at.mod_expenses, singular: at.mod_expensesSingular, collection: "expenses", summary: at.mod_expensesSummary,
      columns: [["expenseNumber", "Xərc #"], ["vendorName", at.opt_vendor], ["category", at.opt_category], ["date", at.col["Tarix"], "date"], ["paymentMode", at.col["Ödəmə üsulu"]], ["amount", at.col["Məbləğ"], "currency"]],
      form: [["expenseNumber", "Xərc #"], ["vendorName", at.opt_vendor], ["category", at.opt_category, "select", at.opt_fuel, [at.opt_fuel, at.opt_rent, at.opt_software, at.opt_office]], ["date", at.col["Tarix"], "date", today()], ["paymentMode", at.col["Ödəmə üsulu"], "select", at.opt_card, [at.opt_cash, at.opt_card, at.opt_bankTransfer]], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    bills: {
      title: at.mod_bills, singular: at.mod_billsSingular, collection: "bills", summary: at.mod_billsSummary,
      columns: [["billNumber", at.fld["Hesab #"]], ["vendorName", at.opt_vendor], ["status", "Status", "status"], ["dueDate", at.col["Son tarix"], "date"], ["amount", at.col["Məbləğ"], "currency"]],
      form: [["billNumber", at.fld["Hesab #"]], ["vendorName", at.opt_vendor], ["status", "Status", "select", at.statusOpen, [at.statusOpen, at.statusPartial, at.statusPaid]], ["dueDate", at.col["Son tarix"], "date", today()], ["amount", at.col["Məbləğ"], "number", "0"]]
    },
    manualJournals: {
      title: at.mod_manualJournals, singular: at.mod_manualJournalsSingular, collection: "manualJournals", summary: at.mod_manualJournalsSummary,
      columns: [["journalNumber", at.col["Jurnal #"]], ["reference", at.opt_reference], ["debitAccount", at.fld["Debet hesabı"]], ["creditAccount", at.fld["Kredit hesabı"]], ["date", at.col["Tarix"], "date"], ["debit", at.col["Debet"], "currency"]],
      form: [["journalNumber", at.col["Jurnal #"]], ["reference", at.opt_reference], ["debitAccount", at.fld["Debet hesabı"]], ["creditAccount", at.fld["Kredit hesabı"]], ["date", at.col["Tarix"], "date", today()], ["debit", at.col["Debet"], "number", "0"], ["credit", at.col["Kredit"], "number", "0"]]
    },
    chartOfAccounts: {
      title: at.mod_chartOfAccounts, singular: at.mod_chartOfAccountsSingular, collection: "chartOfAccounts", summary: at.mod_chartOfAccountsSummary,
      columns: [["accountCode", at.col["Kod"]], ["accountName", at.col["Hesab"]], ["accountType", at.opt_type], ["status", "Status", "status"]],
      form: [["accountCode", at.col["Kod"]], ["accountName", at.col["Hesab"]], ["accountType", at.fld["Hesab növü"], "select", at.coa_asset, [at.coa_asset, at.coa_liability, at.coa_income, at.coa_expense, at.opt_equity]], ["status", "Status", "select", at.statusActive, [at.statusActive, at.statusPassive]], ["balance", at.col["Balans"], "number", "0"]]
    },
    trialBalance: {
      title: at.mod_trialBalance, singular: at.mod_trialBalanceSingular, collection: "chartOfAccounts", summary: at.mod_trialBalanceSummary
    },
    receivables: {
      title: at.mod_receivables, singular: at.mod_receivablesSingular, collection: "customers", summary: at.mod_receivablesSummary
    },
    payables: {
      title: at.mod_payables, singular: at.mod_payablesSingular, collection: "vendors", summary: at.mod_payablesSummary
    },
    accountCard: {
      title: "Hesab kartı", singular: "Hesab kartı", collection: "reports", summary: "Seçilmiş hesab üzrə debet, kredit və qalıq dövriyyəsinin xronoloji kartı."
    },
    financialPositionReport: {
      title: at.mod_financialPositionReport, singular: at.mod_financialPositionReportSingular, collection: "reports", summary: at.mod_financialPositionReportSummary
    },
    profitLossReport: {
      title: at.mod_profitLossReport, singular: at.mod_profitLossReportSingular, collection: "reports", summary: at.mod_profitLossReportSummary
    },
    cashFlowReport: {
      title: at.mod_cashFlowReport, singular: at.mod_cashFlowReportSingular, collection: "reports", summary: at.mod_cashFlowReportSummary
    },
    equityChangesReport: {
      title: at.mod_equityChangesReport, singular: at.mod_equityChangesReportSingular, collection: "reports", summary: at.mod_equityChangesReportSummary
    },
    arAging: {
      title: "Debitor yaşlanma hesabatı", singular: "Debitor yaşlanma", collection: "reports", summary: "Ödənilməmiş fakturalar ödəniş tarixinə görə qruplaşdırılır."
    },
    operationsJournal: {
      title: at.mod_operationsJournal, singular: at.mod_operationsJournalSingular, collection: "manualJournals", summary: at.mod_operationsJournalSummary
    }
  };
}

const OVERVIEWS = { sales: ["customers", "invoices"], purchases: ["vendors", "goods", "incomingGoodsServices"], accountant: ["operationsJournal", "manualJournals", "chartOfAccounts"], reports: ["trialBalance", "accountCard", "financialPositionReport", "profitLossReport", "cashFlowReport", "equityChangesReport", "receivables", "payables", "arAging"] };
const STATUS = { "Ödənilib": "status-paid", "Göndərilib": "status-sent", Qaralama: "status-draft", "Qəbul edilib": "status-paid", Gecikib: "status-overdue", "Açıq": "status-draft", "Bağlanıb": "status-paid", "Tətbiq edilib": "status-sent", Aktiv: "status-paid", Passiv: "status-draft", "Qismən ödənilib": "status-sent" };
const ITEM_MOVEMENT_TYPES = ["Alış", "Satış"];
const PURCHASE_TAX_OPTIONS = ["ƏDV 18%", "ƏDV 0%", "ƏDV-dən azad"];
const HUB_LANG_KEY = "finotam-hub-lang-v1";
const SESSION_STORAGE_KEY = "finotam-session-v1";
const SUPPORT_THREADS_STORAGE_KEY = "tetavio-support-threads-v1";
const SUPER_ADMIN = {
  id: "super-admin",
  fullName: "Tetavio Super Admin",
  email: "admin@finotam.local",
  role: "super_admin"
};

const SUPPORT_CATEGORY_OPTIONS = ["Texniki xəta", "Plan və ödəniş", "Giriş problemi", "Hesabat", "Digər"];
const SUPPORT_PRIORITY_OPTIONS = ["Normal", "Təcili"];
const SUPPORT_STATUS_LABELS = {
  open: "Açıq",
  waiting_support: "Dəstək cavabı gözlənilir",
  waiting_user: "Sizin cavabınız gözlənilir",
  closed: "Bağlanıb",
};

function loadSupportThreadsFromStorage() {
  try {
    const raw = window.localStorage.getItem(SUPPORT_THREADS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const SUPPORT_CATEGORY_TO_BACKEND = {
  "Texniki xЙ™ta": "TECHNICAL",
  "Plan vЙ™ Г¶dЙ™niЕџ": "BILLING",
  "GiriЕџ problemi": "AUTH",
  "Hesabat": "REPORTING",
  "DigЙ™r": "OTHER",
};
const SUPPORT_CATEGORY_FROM_BACKEND = {
  TECHNICAL: "Texniki xЙ™ta",
  BILLING: "Plan vЙ™ Г¶dЙ™niЕџ",
  AUTH: "GiriЕџ problemi",
  REPORTING: "Hesabat",
  OTHER: "DigЙ™r",
};
const SUPPORT_PRIORITY_TO_BACKEND = {
  Normal: "NORMAL",
  "TЙ™cili": "URGENT",
};
const SUPPORT_PRIORITY_FROM_BACKEND = {
  NORMAL: "Normal",
  URGENT: "TЙ™cili",
};

const MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr"
];

const SUBSCRIPTION_PLANS = [
  { id: "free_basic", name: "Free", monthlyPrice: 0, annualMonthlyPrice: 0, currency: "USD", operationLimit: null, durationDays: null, summaryKey: "sub_freeSummary", signupOnly: false },
  { id: "free", name: "Demo 14 gün", monthlyPrice: 0, annualMonthlyPrice: 0, currency: "USD", operationLimit: null, durationDays: 14, summaryKey: "sub_freeSummary", signupOnly: false  },
  { id: "standard", name: "Standard", monthlyPrice: 12, annualMonthlyPrice: 10, currency: "USD", operationLimit: 5000, durationDays: 30, summaryKey: "sub_standardSummary", signupOnly: false },
  { id: "professional", name: "Professional", monthlyPrice: 24, annualMonthlyPrice: 20, currency: "USD", operationLimit: 10000, durationDays: 30, summaryKey: "sub_professionalSummary", signupOnly: false },
  { id: "premium", name: "Premium", monthlyPrice: 36, annualMonthlyPrice: 30, currency: "USD", operationLimit: 25000, durationDays: 30, summaryKey: "sub_premiumSummary", signupOnly: false },
  { id: "elite", name: "Elite", monthlyPrice: 129, annualMonthlyPrice: 100, currency: "USD", operationLimit: 100000, durationDays: 30, summaryKey: "sub_eliteSummary", signupOnly: false },
  { id: "ultimate", name: "Ultimate", monthlyPrice: 249, annualMonthlyPrice: 200, currency: "USD", operationLimit: 200000, durationDays: 30, summaryKey: "sub_ultimateSummary", signupOnly: false }
];

const FREE_PLAN_ENTITY_LIMITS = { customers: 5, vendors: 5, invoices: 5 };

const BACKEND_PLAN_CODE_BY_LEGACY_PLAN_ID = {
  free_basic: "FREE_BASIC",
  free: "FREE",
  standard: "STANDARD",
  professional: "PROFESSIONAL",
  premium: "PREMIUM",
  elite: "ELITE",
  ultimate: "ULTIMATE",
};

const LEGACY_PLAN_ID_BY_BACKEND_PLAN_CODE = {
  FREE_BASIC: "free_basic",
  FREE: "free",
  STANDARD: "standard",
  PROFESSIONAL: "professional",
  PREMIUM: "premium",
  ELITE: "elite",
  ULTIMATE: "ultimate",
  // Legacy plan backward compatibility
  PRO_MONTHLY: "professional",
  PREMIUM_MONTHLY: "premium",
};

const STAFF_ROLE_CONFIG = {
  Admin: {
    maxUsers: 5,
    permissions: ["Satışlar", "Alışlar", "Əməliyyatlar", "Bank", "Hesabatlar", "Sənədlər", "Tənzimləmələr"],
    sections: ["home", "accountant", "sales", "purchases", "banking", "reports", "documents", "settings"]
  },
  "Mühasib": {
    maxUsers: 5,
    permissions: ["Satışlar", "Alışlar", "Əməliyyatlar", "Bank", "Hesabatlar", "Sənədlər"],
    sections: ["home", "accountant", "sales", "purchases", "banking", "reports", "documents"]
  },
  "Kadrlar mütəxəssisi": {
    maxUsers: 5,
    permissions: ["Sənədlər", "Tənzimləmələr", "İdarəetmə paneli"],
    sections: ["home", "documents", "settings"]
  },
  "Rəhbər": {
    maxUsers: 2,
    permissions: ["İdarəetmə paneli", "Hesabatlar", "Sənədlər"],
    sections: ["home", "reports", "documents"]
  }
};

function getPlanById(planId) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) || SUBSCRIPTION_PLANS[0];
}

function getPlanDurationDays(plan, billingCycle = "annual") {
  if (plan.id === "free" || plan.id === "free_basic") return null;
  return billingCycle === "monthly" ? 30 : 365;
}

function getPlanDurationLabel(plan, billingCycle = "annual") {
  if (plan.id === "free_basic") return "Limitsiz müddət";
  if (plan.id === "free") return "14 günlük sınaq";
  return billingCycle === "monthly" ? "30 günlük aktiv plan" : "365 günlük aktiv plan";
}

function getUnpaidTrialDurationDays(plan) {
  if (!plan || plan.id === "free" || plan.id === "free_basic") return null;
  return 14;
}

function getPlanPrice(plan, billingCycle = "annual") {
  if (billingCycle === "monthly") return Number(plan.monthlyPrice || 0);
  return Number(plan.annualMonthlyPrice || plan.monthlyPrice || 0);
}

function getPlanPriceLabel(plan, billingCycle = "annual") {
  if (plan.id === "free_basic") return "Pulsuz";
  if (plan.id === "free") return "Demo";
  if (billingCycle === "monthly") return `$${getPlanPrice(plan, "monthly")}/1 ay`;
  return `$${getPlanPrice(plan, "annual")}/ay`;
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
}

function normalizeSubscription(user) {
  const isSuperAdmin = user?.role === "super_admin" || user?.email === SUPER_ADMIN.email;
  const rawPlanId = user?.subscription?.planId || (isSuperAdmin ? "ultimate" : "free");
  const plan = getPlanById(rawPlanId);
  const expired = !isSuperAdmin && rawPlanId !== "free" && user?.subscription?.endsAt && String(user.subscription.endsAt) < today();
  const activePlan = expired ? getPlanById("free") : plan;

  return {
    planId: activePlan.id,
    planName: activePlan.name,
    billingCycle: user?.subscription?.billingCycle || (activePlan.id === "free" ? "free" : "annual"),
    monthlyPrice: getPlanPrice(activePlan, user?.subscription?.billingCycle || "annual"),
    currency: activePlan.currency,
    startedAt: expired ? today() : user?.subscription?.startedAt || today(),
    endsAt: isSuperAdmin ? null : expired ? null : (user?.subscription?.endsAt || (activePlan.id === "free" ? null : addDays(today(), getPlanDurationDays(activePlan, user?.subscription?.billingCycle || "annual") || 30))),
    operationLimit: activePlan.operationLimit,
    autoDowngraded: expired ? "Bəli" : (user?.subscription?.autoDowngraded || "Xeyr")
  };
}

function getPublicPlans() {
  return SUBSCRIPTION_PLANS.filter((plan) => !plan.signupOnly);
}

function mapBackendPlanCodeToLegacyPlanId(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const matchedPlanId = LEGACY_PLAN_ID_BY_BACKEND_PLAN_CODE[normalizedCode];
  if (!matchedPlanId) {
    throw new Error(`Unknown backend plan code: ${code || "(empty)"}`);
  }
  return matchedPlanId;
}

function toBackendPlanCode(codeOrId) {
  const normalizedValue = String(codeOrId || "").trim();
  if (!normalizedValue) {
    throw new Error("Plan code is required");
  }
  const upperValue = normalizedValue.toUpperCase();
  if (/^[A-Z0-9_]+$/.test(upperValue)) return upperValue;
  const mappedCode = BACKEND_PLAN_CODE_BY_LEGACY_PLAN_ID[normalizedValue];
  if (!mappedCode) {
    throw new Error(`Unknown plan mapping: ${codeOrId || "(empty)"}`);
  }
  return mappedCode;
}

function getAccountOwnerEmail(user) {
  return user?.accountOwnerEmail || user?.email || "";
}

function isInternalUser(user) {
  return Boolean(user?.accountType === "internal" || (user?.accountOwnerEmail && user.accountOwnerEmail !== user.email));
}

function canManageTeam(user) {
  return Boolean(user && user.role !== "super_admin" && !isInternalUser(user));
}

function getStaffRoleConfig(staffRole) {
  return STAFF_ROLE_CONFIG[staffRole] || STAFF_ROLE_CONFIG.Admin;
}

function normalizeAuthUser(user) {
  const normalized = {
    ...user,
    accountType: user?.accountType || (user?.role === "super_admin" ? "system" : "owner"),
    accountOwnerEmail: user?.role === "super_admin" ? user.email : (user?.accountOwnerEmail || user?.email || ""),
    staffRole: user?.staffRole || "",
    profile: {
      entityType: user?.profile?.entityType || "Hüquqi şəxs",
      companyName: user?.profile?.companyName || user?.fullName || "",
      taxId: user?.profile?.taxId || "",
      mobilePhone: user?.profile?.mobilePhone || ""
    },
    operationsUsed: Number(user?.operationsUsed || 0),
    subscription: normalizeSubscription(user)
  };
  return normalized;
}

function decodeJwtPayload(token) {
  if (!token) return null;

  try {
    const [, rawPayload] = String(token).split(".");
    if (!rawPayload) return null;

    const normalizedBase64 = rawPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = normalizedBase64.padEnd(
      normalizedBase64.length + ((4 - (normalizedBase64.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedBase64));
  } catch {
    return null;
  }
}

function buildOptimisticAuthUser(authResponse) {
  const user = authResponse?.user;
  const claims = decodeJwtPayload(authResponse?.tokens?.accessToken);
  const role = String(user?.role || claims?.role || "owner").toLowerCase();

  if (!user?.email) {
    return null;
  }

  return normalizeAuthUser({
    id: user.id,
    fullName: user.fullName || user.email,
    email: user.email,
    role,
    profile: {
      entityType: "Hüquqi şəxs",
      companyName: user.fullName || user.email,
      taxId: "",
      mobilePhone: "",
    },
    operationsUsed: 0,
    subscription: {
      planId: "free",
      billingCycle: "monthly",
      startedAt: today(),
      endsAt: null,
      autoDowngraded: "Xeyr",
    },
  });
}

function getLoginProgressCopy(elapsedSeconds) {
  if (elapsedSeconds <= 1) return "Giriş yoxlanılır...";
  if (elapsedSeconds <= 3) return `Daxil olunur... ${elapsedSeconds} san`;
  if (elapsedSeconds <= 8) return `Server cavabı gözlənilir... ${elapsedSeconds} san`;
  return `Gözləmə uzanıb... ${elapsedSeconds} san`;
}

function fmtDate(value) {
  if (!value) return "-";

  const parts = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (parts) {
    const [, year, month, day] = parts;
    return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = MONTHS[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

function getProfileDisplayName(user) {
  if (!user) return "";
  return user.profile?.companyName || user.fullName || user.email || "";
}

function formatPreviewMetric(value) {
  return new Intl.NumberFormat("en-US").format(Math.floor(Number(value || 0)));
}

function buildDemoPreviewStats(now = Date.now()) {
  const launchDate = new Date("2026-01-01T00:00:00Z").getTime();
  const elapsedMinutes = Math.max(0, Math.floor((now - launchDate) / 60000));

  return [
    {
      label: "Emal olunan sənədlər",
      value: 18420 + elapsedMinutes * 11
    },
    {
      label: "Aktiv şirkət profilləri",
      value: 1260 + Math.floor(elapsedMinutes / 18)
    },
    {
      label: "Yaradılan hesabatlar",
      value: 89200 + elapsedMinutes * 17
    },
    {
      label: "Qeydə alınan əməliyyatlar",
      value: 341500 + elapsedMinutes * 39
    }
  ];
}

function calculateIncomingGoodsTotal(quantity, price, vatAmount) {
  const baseAmount = Number(quantity || 0) * Number(price || 0);
  const totalAmount = baseAmount + Number(vatAmount || 0);
  return {
    baseAmount: Number(baseAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2))
  };
}

function extractTaxRateFromLabel(label) {
  const match = String(label || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function calculateLineItem(quantity, rate, taxLabel) {
  const baseAmount = Number((Number(quantity || 0) * Number(rate || 0)).toFixed(2));
  const taxRate = extractTaxRateFromLabel(taxLabel);
  const taxAmount = taxRate > 0 ? Number((baseAmount * taxRate / 100).toFixed(2)) : 0;
  const amount = Number((baseAmount + taxAmount).toFixed(2));
  return { baseAmount, taxRate, taxAmount, amount };
}

function normalizeAccountCodeInput(value, fallback = "205") {
  const match = String(value ?? "").match(/\d{3}/);
  return match ? match[0] : String(fallback || "205");
}

function resolveIncomingLineAccountCode(item, fallback = "205") {
  const primary = normalizeAccountCodeInput(item?.accountCode || "", "");
  const legacy = normalizeAccountCodeInput(item?.account || item?.accountName || item?.code || "", "");
  if (primary && legacy && primary !== legacy && primary === "205") return legacy;
  return primary || legacy || String(fallback || "205");
}

function calculateBillTotals(lineItems, discount, adjustment) {
  const subTotal = Number((lineItems || []).reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2));
  const discountPct = Number(discount || 0);
  const discountAmount = Number((subTotal * discountPct / 100).toFixed(2));
  const totalAmount = Number((subTotal - discountAmount + Number(adjustment || 0)).toFixed(2));
  return { subTotal, discountAmount, totalAmount };
}

function createDefaultLineItem() {
  return { id: crypto.randomUUID(), itemName: "", accountCode: "205", quantity: "1", rate: "0", taxLabel: "ƏDV 18%", taxRate: 18, taxAmount: 0, amount: 0 };
}

function createDefaultSalesLineItem() {
  return { id: crypto.randomUUID(), itemName: "", accountCode: "601", quantity: "1", rate: "0", taxLabel: "ƏDV 18%", taxRate: 18, taxAmount: 0, amount: 0 };
}

function buildDraft(id, record = null) {
  const draft = {};
  MODULES[id].form.forEach(([name, , , def]) => {
    draft[name] = record?.[name] ?? def ?? "";
  });
  return draft;
}

function parseDraft(id, draft) {
  const record = {};
  MODULES[id].form.forEach(([name, , type]) => {
    record[name] = type === "number" ? Number(draft[name] || 0) : draft[name];
  });
  return record;
}

function getJournalLineRelationConfig(accountCode) {
  if (accountCode === "201") {
    return { type: "goods", fieldLabel: "Mal adı" };
  }
  if (accountCode === "531") {
    return { type: "vendor", fieldLabel: "Malsatan" };
  }
  return null;
}

function getDefaultJournalSubledgerCategory(accountCode) {
  if (accountCode === "201") return "goods";
  if (accountCode === "211" || accountCode === "231") return "debtors";
  if (accountCode === "411" || accountCode === "421" || accountCode === "511" || accountCode === "521" || accountCode === "522" || accountCode === "531" || accountCode === "541") return "creditors";
  if (accountCode === "601" || accountCode === "611" || accountCode === "621" || accountCode === "631") return "incomes";
  if (accountCode === "701" || accountCode === "711" || accountCode === "712" || accountCode === "721" || accountCode === "731" || accountCode === "901") return "expenses";
  return "goods";
}

function createMovementDraft(items) {
  return {
    itemId: items[0]?.id || "",
    movementType: "Satış",
    quantity: "1",
    unitPrice: items[0]?.rate ? String(items[0].rate) : "0",
    taxLabel: "",
    partner: "",
    movementDate: today(),
    note: ""
  };
}

function createEmptyBankDraft() {
  return {
    bankName: "",
    bankTaxId: "",
    bankCode: "",
    swift: "",
    correspondentAccount: "",
    settlementAccount: "",
    accountName: "",
    institution: "",
    accountType: "Cari",
    balance: "0",
    iban: "",
    coaCode: ""
  };
}

function buildBankDraftFromRecord(record) {
  const bankName = record?.bankName || record?.accountName || "";
  const bankCode = record?.bankCode || record?.institution || "";
  const settlementAccount = record?.settlementAccount || record?.iban || "";
  return {
    bankName,
    bankTaxId: record?.bankTaxId || "",
    bankCode,
    swift: record?.swift || "",
    correspondentAccount: record?.correspondentAccount || "",
    settlementAccount,
    accountName: bankName,
    institution: bankCode,
    accountType: record?.accountType || "Cari",
    balance: String(record?.balance || 0),
    iban: settlementAccount,
    coaCode: record?.coaCode || ""
  };
}

function getBankDisplayName(record) {
  return record?.bankName || record?.accountName || "—";
}

function getBankDisplayCode(record) {
  return record?.bankCode || record?.institution || "—";
}

function resolveMovementPrice(item, movementType) {
  if (!item) return "0";
  const price = movementType === "Alış" ? item.purchaseRate : item.rate;
  return String(price || 0);
}

function openNewItemForm(setDrafts, setEditing, setItemFormOpen) {
  setDrafts((current) => ({ ...current, itemsCatalog: buildDraft("itemsCatalog") }));
  setEditing((current) => ({ ...current, itemsCatalog: null }));
  setItemFormOpen(true);
}

function matchesSearch(record, query) {
  if (!query) return true;
  const lookup = query.toLowerCase();
  return Object.values(record).some((value) => String(value ?? "").toLowerCase().includes(lookup));
}

function Table({ headers, rows, emptyMessage }) {
  return (
    <table className="data-table">
      <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
      <tbody>{rows.length ? rows : <tr><td className="empty-cell" colSpan={headers.length}>{emptyMessage}</td></tr>}</tbody>
    </table>
  );
}

function SmartField({ field, value, onChange, at }) {
  const [name, , type, , options] = field;
  const optLabel = (v) => {
    if (!v) return v;
    const statusMap = {
      "Qaralama": at.statusDraft, "Göndərilib": at.statusSent, "Gecikib": at.statusOverdue, "Ödənilib": at.statusPaid,
      "Qəbul edilib": at.statusAccepted, "Açıq": at.statusOpen, "Bağlanıb": at.statusClosed,
      "Tətbiq edilib": at.statusApplied, "Aktiv": at.statusActive, "Passiv": at.statusPassive, "Qismən ödənilib": at.statusPartial,
      "Xidmət": at.opt_service, "Anbar malı": at.opt_warehouseGoods, "Qeyri-anbar malı": at.opt_nonWarehouseGoods,
      "Bəli": at.opt_yes, "Xeyr": at.opt_no,
      "Nağd": at.opt_cash, "Bank köçürməsi": at.opt_bankTransfer, "Kart": at.opt_card,
      "Həftəlik": at.opt_weekly, "Aylıq": at.opt_monthly, "Rüblük": at.opt_quarterly,
      "Yanacaq": at.opt_fuel, "İcarə": at.opt_rent, "Proqram təminatı": at.opt_software, "Ofis ləvazimatları": at.opt_office,
      "Mal": at.opt_product,
    };
    return statusMap[v] || v;
  };
  if (type === "select") {
    return <select name={name} value={value} onChange={onChange}>{options.map((option) => <option key={option} value={option}>{optLabel(option)}</option>)}</select>;
  }
  return <input name={name} type={type || "text"} value={value} onChange={onChange} required step={type === "number" ? "0.01" : undefined} />;
}

function ModuleOverviewCard({ moduleId, state, onOpen, MODULES, at }) {
  const config = MODULES[moduleId];
  return <article className="summary-card interactive-card"><span>{config.collection}</span><strong>{config.title}</strong><p className="card-note">{state[config.collection].length} {at.unit_record}</p><button className="ghost-btn compact-btn" onClick={() => onOpen(moduleId)}>{at.hub_reports}</button></article>;
}

function PublicMarketingTopbar({
  lang,
  onLangChange,
  langOpen,
  setLangOpen,
  navOpen,
  setNavOpen,
  navItems,
  navMenuLabel,
  navContactLabel,
  companyName,
  ctaLabel,
  onCtaClick,
  onNavigateSection,
}) {
  const activeLang = PUBLIC_MARKETING_LANGS.find((item) => item.code === lang) || PUBLIC_MARKETING_LANGS[0];
  const navigateHome = () => {
    window.location.href = "/homepage";
  };
  const handleNavItem = (itemId) => {
    onNavigateSection?.(itemId);
    setNavOpen(false);
    setLangOpen(false);
  };
  const handleContactItem = () => {
    onNavigateSection?.("contact");
    setNavOpen(false);
    setLangOpen(false);
  };

  return (
    <header className="ph-topbar">
      <div className="ph-topbar-inner">
        <button className="lp-brand ph-brand-button" type="button" onClick={navigateHome}>
          <div className="lp-brand-icon">
            <img src={logoSrc} alt="Tetavio" className="app-logo" />
          </div>
          <div>
            <strong>Tetavio</strong>
            <span>{PUBLIC_MARKETING_TOPBAR_T[lang]?.platform || PUBLIC_MARKETING_TOPBAR_T.az.platform}</span>
          </div>
        </button>
        <div className="ph-topbar-right">
          <nav className="ph-nav-links" aria-label="Ana səhifə bölmələri">
            {navItems.map((item) => (
              <button key={item.id} type="button" className="ph-nav-link" onClick={() => handleNavItem(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          <button className="ph-mobile-menu-btn" type="button" aria-expanded={navOpen} aria-controls="ph-mobile-nav" onClick={(e) => { e.stopPropagation(); setNavOpen((current) => !current); }}>
            <span>{navMenuLabel}</span>
            <span className="ph-mobile-menu-icon" aria-hidden="true">{navOpen ? "✕" : "☰"}</span>
          </button>
          <div className="ph-lang-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="ph-lang-btn" type="button" onClick={() => setLangOpen((current) => !current)}>
              <span>{activeLang.flag}</span>
              <span>{activeLang.code.toUpperCase()}</span>
              <span className="ph-lang-chevron">{langOpen ? "▲" : "▼"}</span>
            </button>
            {langOpen && (
              <div className="ph-lang-dropdown">
                {PUBLIC_MARKETING_LANGS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`ph-lang-option${item.code === lang ? " ph-lang-option-active" : ""}`}
                    onClick={() => { onLangChange?.(item.code); setLangOpen(false); }}
                  >
                    <span>{item.flag}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="ph-company-pill ph-company-pill-button" type="button" onClick={navigateHome}>
            <span className="ph-company-dot" />
            <span>{companyName}</span>
          </button>
          <button className="ph-btn-topbar" type="button" onClick={onCtaClick}>
            {ctaLabel}
          </button>
        </div>
      </div>
      <div className={`ph-mobile-nav ${navOpen ? "open" : ""}`} id="ph-mobile-nav" onClick={(e) => e.stopPropagation()}>
        <div className="ph-mobile-nav-links">
          {navItems.map((item) => (
            <button key={item.id} type="button" onClick={() => handleNavItem(item.id)}>{item.label}</button>
          ))}
          <button type="button" onClick={handleContactItem}>{navContactLabel}</button>
        </div>
      </div>
    </header>
  );
}

function StandaloneLegalPage({ page, lang, onLangChange }) {
  const activeLegalNavId = getActiveLegalNavId(page.id);
  const pageTitle = getLegalPageTitle(page.id, lang);
  const pageSummary = getLegalPageSummary(page.id, lang);
  const pageSections = getLegalPageSections(page.id, lang);
  const visibleSections = getVisibleStandaloneLegalSections(page.id, pageSections);
  const [hubLangOpen, setHubLangOpen] = useState(false);
  const [hubNavOpen, setHubNavOpen] = useState(false);
  const topbarT = PUBLIC_MARKETING_TOPBAR_T[normalizeStandaloneLegalLang(lang)] || PUBLIC_MARKETING_TOPBAR_T.az;
  const navigateHomepageSection = (sectionId) => {
    window.location.href = `/homepage#${sectionId}`;
  };
  const openSignup = () => {
    window.location.href = "/accounting/signup";
  };

  return (
    <div className="lp-shell" onClick={() => { if (hubLangOpen) setHubLangOpen(false); if (hubNavOpen) setHubNavOpen(false); }}>
      <PublicMarketingTopbar
        lang={normalizeStandaloneLegalLang(lang)}
        onLangChange={onLangChange}
        langOpen={hubLangOpen}
        setLangOpen={setHubLangOpen}
        navOpen={hubNavOpen}
        setNavOpen={setHubNavOpen}
        navItems={topbarT.nav}
        navMenuLabel={topbarT.navMenu}
        navContactLabel={topbarT.navContact}
        companyName="Tetavio LLC"
        ctaLabel={topbarT.navSignup}
        onCtaClick={openSignup}
        onNavigateSection={navigateHomepageSection}
      />

      <section className="lp-legal-shell">
        <div className="lp-legal-card">
          <div className="lp-legal-head">
            <div>
              <h2>{pageTitle}</h2>
              <p>{pageSummary}</p>
            </div>
          </div>

          <div className="lp-legal-links">
            {LEGAL_NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                className={`lp-legal-link${item.id === activeLegalNavId ? " active" : ""}`}
                href={item.href}
              >
                {getLegalNavLabel(item.id, lang)}
              </a>
            ))}
          </div>

            <div className="lp-legal-sections">
            {visibleSections.map((section, index) => {
              const sectionId = getLegalSectionId(page.id, section, index);

              return (
                <article key={section.heading} id={sectionId} className="lp-legal-section">
                  <h3>{section.heading}</h3>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-links">
          {LEGAL_NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              className={`lp-legal-link${item.id === activeLegalNavId ? " active" : ""}`}
              href={item.href}
            >
              {getLegalNavLabel(item.id, lang)}
            </a>
          ))}
        </div>
        <small>Tetavio ERP · Cloud Accounting Platform · © Tetavio MMC, bütün hüquqlar qorunur</small>
      </footer>
    </div>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [hubLang, setHubLang] = useState(() => {
    try {
      return normalizeStandaloneLegalLang(window.localStorage.getItem(HUB_LANG_KEY) || "az");
    } catch {
      return "az";
    }
  });
  const pathname = window.location.pathname;

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== HUB_LANG_KEY) return;
      setHubLang(normalizeStandaloneLegalLang(event.newValue || "az"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HUB_LANG_KEY, normalizeStandaloneLegalLang(hubLang));
    } catch {
      // Ignore storage write failures for standalone legal pages.
    }
  }, [hubLang]);

  const slug = pathname.startsWith("/accounting/")
    ? pathname.replace("/accounting/", "").split("/")[0]
    : null;
  const legalPage = slug ? COMPLIANCE_LEGAL_PAGE_MAP[resolveStandaloneLegalSlug(slug)] : null;

  if (legalPage) {
    return (
      <StandaloneLegalPage
        key={`${hubLang}-${hash}`}
        page={legalPage}
        lang={hubLang}
        onLangChange={setHubLang}
      />
    );
  }

  return <MainApp />;
}

function MainApp() {
  function getLocationRoute() {
    const hashPath = (window.location.hash || "").replace(/^#\/?/, "").trim();
    if (hashPath) return hashPath;
    const pathName = String(window.location.pathname || "").replace(/^\/+|\/+$/g, "");
    if (!pathName || pathName === "index.html") return "";
    return pathName;
  }

  function getBooksLandingRouteDetails(routeValue = getLocationRoute()) {
    const path = String(routeValue || "").replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "");
    const [part1, part2] = path.split("/");
    const isBooksLandingRoute = part1 === "landing" || part1 === "accounting";
    const legalPage = isBooksLandingRoute
      ? COMPLIANCE_LEGAL_PAGES.find((page) => page.id === part2) || null
      : null;
    const initialBooksView = isBooksLandingRoute && BOOKS_LANDING_VIEWS.includes(part2) ? part2 : "home";

    return {
      part1,
      part2,
      isBooksLandingRoute,
      legalPage,
      initialBooksView,
    };
  }

  function getStandaloneLegalRouteInfo() {
    const path = String(window.location.pathname || "").replace(/^\/+|\/+$/g, "");
    const [part1, part2] = path.split("/");
    const resolvedSlug = resolveStandaloneLegalSlug(part2);
    const legalPage = part1 === "accounting"
      ? COMPLIANCE_LEGAL_PAGES.find((page) => page.id === resolvedSlug) || null
      : null;

    return {
      slug: part1 === "accounting" ? (part2 || "") : "",
      legalPage,
    };
  }

  function getInitialRouteParts() {
    return getLocationRoute().split("/").filter(Boolean);
  }

  const [state, setState] = useState(() => normalizeAppState(createResetData()));
  const [isReady, setIsReady] = useState(false);
  const [timeTick, setTimeTick] = useState(() => Date.now());
  const publicBackendWarmupStartedRef = useRef(false);
  const [activeSection, setActiveSection] = useState(() => {
    const parts = getInitialRouteParts();
    const sec = parts[0];
    if (!sec || sec === "hub" || sec === "homepage" || sec === "landing") return "home";
    if (sec === "dashboard") return "home";
    return sec;
  });
  const [activeModule, setActiveModule] = useState(() => {
    const parts = getInitialRouteParts();
    return parts[1] || null;
  });
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [searches, setSearches] = useState({});
  const [drafts, setDrafts] = useState({});
  const [editing, setEditing] = useState({});
  const [itemMovementDraft, setItemMovementDraft] = useState(() => createMovementDraft(normalizeAppState(createResetData()).items));
  const [bankDraft, setBankDraft] = useState(() => createEmptyBankDraft());
  const [editingBank, setEditingBank] = useState(null);
  const [bankFormOrigin, setBankFormOrigin] = useState("banks");
  const [bankTxDraft, setBankTxDraft] = useState({ date: "", amount: "", transactionType: "Mədaxil", description: "", counterpartyName: "", bankAccountId: "", accountCode: "", reference: "", category: "" });
  const [bankTxAccountSearch, setBankTxAccountSearch] = useState("");
  const [bankTxAccountOpen, setBankTxAccountOpen] = useState(false);
  const [bankTxEditId, setBankTxEditId] = useState(null);
  const [billView, setBillView] = useState(() => { const p = getInitialRouteParts(); return p[1] === "bills" && ["overview","journal","form"].includes(p[2]) ? p[2] : "overview"; });
  const [incomingLedgerRecordId, setIncomingLedgerRecordId] = useState(null);
  const [invoiceLedgerRecordId, setInvoiceLedgerRecordId] = useState(null);
  const [journalView, setJournalView] = useState(() => { const p = getInitialRouteParts(); return p[1] === "manualJournals" && ["overview","journal","form"].includes(p[2]) ? p[2] : "overview"; });
  const [opJournalFilter, setOpJournalFilter] = useState({ type: "all", search: "", dateFrom: "", dateTo: "" });
  const [opJournalExpanded, setOpJournalExpanded] = useState(new Set());
  const [chartView, setChartView] = useState(() => { const p = getInitialRouteParts(); return p[1] === "chartOfAccounts" && ["overview","journal","form"].includes(p[2]) ? p[2] : "overview"; });
  const [vendorView, setVendorView] = useState(() => { const p = getInitialRouteParts(); return p[1] === "vendors" && ["overview","journal","form"].includes(p[2]) ? p[2] : "overview"; });
  const [goodsView, setGoodsView] = useState(() => { const p = getInitialRouteParts(); return p[1] === "goods" && ["overview","journal","form"].includes(p[2]) ? p[2] : "overview"; });
  const [bankView, setBankView] = useState(() => { const p = getInitialRouteParts(); return p[0] === "banking" && ["overview","banks","journal","form","tx-form"].includes(p[1]) ? p[1] : "overview"; });
  const [invoiceView, setInvoiceView] = useState(() => { const p = getInitialRouteParts(); return p[1] === "invoices" && ["overview","journal","form"].includes(p[2]) ? p[2] : "overview"; });
  const [customerView, setCustomerView] = useState(() => { const p = getInitialRouteParts(); return p[1] === "customers" && ["overview","journal","form"].includes(p[2]) ? p[2] : "overview"; });
  const [documentView, setDocumentView] = useState(() => { const p = getInitialRouteParts(); return p[0] === "documents" && ["overview","journal","form"].includes(p[1]) ? p[1] : "overview"; });
  const [expandedSections, setExpandedSections] = useState(() => {
    const parts = getInitialRouteParts();
    const sec = parts[0];
    const initial = sec && sec !== "hub" && sec !== "landing" ? sec : "home";
    return new Set([initial]);
  });
  const [documentDraft, setDocumentDraft] = useState({ title: "", relatedTo: "", category: "Faktura", fileData: null });
  const docFileInputRef = useRef(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [backupStatus, setBackupStatus] = useState({ tone: "", message: "" });
  const [settingsTab, setSettingsTab] = useState(null); // null | "profile" | "language" | "params"
  const [profileSaved, setProfileSaved] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("Bu ay");
  const [profitLossCloseYear, setProfitLossCloseYear] = useState(() => String(new Date().getFullYear()));
  const [trialBalanceFilter, setTrialBalanceFilter] = useState("Hamısı");
  const [debtSearch, setDebtSearch] = useState({ receivables: "", payables: "" });
  const [debtCard, setDebtCard] = useState(null);
  const [accountCardFilters, setAccountCardFilters] = useState(() => {
    const current = today();
    return {
      dateFrom: `${current.slice(0, 8)}01`,
      dateTo: current,
      accountCode: "",
      entityName: ""
    };
  });
  const [appliedAccountCardFilters, setAppliedAccountCardFilters] = useState(() => {
    const current = today();
    return {
      dateFrom: `${current.slice(0, 8)}01`,
      dateTo: current,
      accountCode: "",
      entityName: ""
    };
  });
  const restoreInputRef = useRef(null);
  const landingAuthRef = useRef(null);
  const [activeProduct, setActiveProduct] = useState(() => {
    const route = getLocationRoute();
    if (!route || route === "hub" || route === "homepage") return "hub";
    if (route === "landing" || route.startsWith("landing/") || route === "accounting" || route.startsWith("accounting/")) return "booksLanding";
    const _fp = route.split("/")[0];
    if (FUNNEL_PAGES.includes(_fp)) return "funnel";
    return "books";
  });
  const [funnelPage, setFunnelPage] = useState(() => {
    const route = getLocationRoute();
    const _fp = route.split("/")[0];
    return FUNNEL_PAGES.includes(_fp) ? _fp : "start";
  });
  const [hubLang, setHubLang] = useState(() => {
    try {
      const savedLang = window.localStorage.getItem(HUB_LANG_KEY);
      return savedLang || "en";
    } catch {
      return "en";
    }
  });
  const [hubLangOpen, setHubLangOpen] = useState(false);
  const [hubNavOpen, setHubNavOpen] = useState(false);
  const [authUsers, setAuthUsers] = useState([normalizeAuthUser(SUPER_ADMIN)]);
  const [currentUser, setCurrentUser] = useState(null);
  const [backendSession, setBackendSession] = useState(null);
  const [backendPlans, setBackendPlans] = useState([]);
  const [backendSubscription, setBackendSubscription] = useState(null);
  const [backendOrders, setBackendOrders] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [customersMeta, setCustomersMeta] = useState(null);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState("");
  const [vendorsMeta, setVendorsMeta] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [journalsError, setJournalsError] = useState("");
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState("");
  const [bankingLoading, setBankingLoading] = useState(false);
  const [bankingError, setBankingError] = useState("");
  const [companySettingsLoading, setCompanySettingsLoading] = useState(false);
  const [companySettingsError, setCompanySettingsError] = useState("");
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [invoicesMeta, setInvoicesMeta] = useState(null);
  const [invoicePayments, setInvoicePayments] = useState([]);
  const [invoicePaymentsLoading, setInvoicePaymentsLoading] = useState(false);
  const [invoicePaymentsError, setInvoicePaymentsError] = useState("");
  const [invoicePaymentDraft, setInvoicePaymentDraft] = useState({ amountMinor: "", paymentDate: "", method: "" });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [sendEmailLoading, setSendEmailLoading] = useState(false);
  const [sendEmailMessage, setSendEmailMessage] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamActionMsg, setTeamActionMsg] = useState("");
  const [teamDraft, setTeamDraft] = useState({ email: "", fullName: "", role: "ACCOUNTANT", password: "" });
  const [teamFormVisible, setTeamFormVisible] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [paymentStatusDraft, setPaymentStatusDraft] = useState("SUCCESS");
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [booksView, setBooksView] = useState(() => {
    return getBooksLandingRouteDetails().initialBooksView;
  });
  const [internalGateError, setInternalGateError] = useState("");
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false);
  const [adminOverviewError, setAdminOverviewError] = useState("");
  const [adminActiveTab, setAdminActiveTab] = useState("overview");
  const [adminAccountsData, setAdminAccountsData] = useState([]);
  const [adminAccountsMeta, setAdminAccountsMeta] = useState(null);
  const [adminAccountsLoading, setAdminAccountsLoading] = useState(false);
  const [adminAccountsError, setAdminAccountsError] = useState("");
  const [adminAccountsPage, setAdminAccountsPage] = useState(1);
  const [adminAccountsSearch, setAdminAccountsSearch] = useState("");
  const [adminAccountsSearchInput, setAdminAccountsSearchInput] = useState("");
  const [adminFinanceData, setAdminFinanceData] = useState(null);
  const [adminFinanceLoading, setAdminFinanceLoading] = useState(false);
  const [adminFinanceError, setAdminFinanceError] = useState("");
  const [adminSubsData, setAdminSubsData] = useState([]);
  const [adminSubsSummary, setAdminSubsSummary] = useState(null);
  const [adminSubsMeta, setAdminSubsMeta] = useState(null);
  const [adminSubsLoading, setAdminSubsLoading] = useState(false);
  const [adminSubsError, setAdminSubsError] = useState("");
  const [adminSubsPage, setAdminSubsPage] = useState(1);
  const [adminSubsSearch, setAdminSubsSearch] = useState("");
  const [adminSubsSearchInput, setAdminSubsSearchInput] = useState("");
  const [adminSubsStatus, setAdminSubsStatus] = useState("");
  const [adminSubsStatusInput, setAdminSubsStatusInput] = useState("");
  const [adminSystemHealth, setAdminSystemHealth] = useState(null);
  const [adminSystemHealthLoading, setAdminSystemHealthLoading] = useState(false);
  const [adminSystemHealthError, setAdminSystemHealthError] = useState("");
  const [adminActivityItems, setAdminActivityItems] = useState([]);
  const [adminActivityPagination, setAdminActivityPagination] = useState(null);
  const [adminActivityLoading, setAdminActivityLoading] = useState(false);
  const [adminActivityError, setAdminActivityError] = useState("");
  const [adminActivityPage, setAdminActivityPage] = useState(1);
  const [adminActivitySearch, setAdminActivitySearch] = useState("");
  const [adminActivitySearchInput, setAdminActivitySearchInput] = useState("");
  const [adminActivityType, setAdminActivityType] = useState("");
  const [adminActivityTypeInput, setAdminActivityTypeInput] = useState("");
  const [adminAccountDetailId, setAdminAccountDetailId] = useState(null);
  const [adminAccountDetail, setAdminAccountDetail] = useState(null);
  const [adminAccountDetailLoading, setAdminAccountDetailLoading] = useState(false);
  const [adminAccountDetailError, setAdminAccountDetailError] = useState("");
  const [adminAccountDetailKey, setAdminAccountDetailKey] = useState(0);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [adminNoteLoading, setAdminNoteLoading] = useState(false);
  const [adminNoteFeedback, setAdminNoteFeedback] = useState(null);
  const [adminFlagInput, setAdminFlagInput] = useState("");
  const [adminFlagLoading, setAdminFlagLoading] = useState(false);
  const [adminFlagFeedback, setAdminFlagFeedback] = useState(null);
  const [adminUnflagInput, setAdminUnflagInput] = useState("");
  const [adminUnflagLoading, setAdminUnflagLoading] = useState(false);
  const [adminUnflagFeedback, setAdminUnflagFeedback] = useState(null);
  const [adminGrantDemoLoading, setAdminGrantDemoLoading] = useState(false);
  const [adminGrantDemoFeedback, setAdminGrantDemoFeedback] = useState(null);
  const [adminReviewingId, setAdminReviewingId] = useState(null);
  const [adminReviewNote, setAdminReviewNote] = useState("");
  const [adminReviewLoading, setAdminReviewLoading] = useState(false);
  const [adminReviewFeedback, setAdminReviewFeedback] = useState(null);
  const [adminAnomaliesKey, setAdminAnomaliesKey] = useState(0);
  const [adminAnomaliesData, setAdminAnomaliesData] = useState(null);
  const [adminAnomaliesLoading, setAdminAnomaliesLoading] = useState(false);
  const [adminAnomaliesError, setAdminAnomaliesError] = useState("");
  const [adminAnomaliesPage, setAdminAnomaliesPage] = useState(1);
  const [adminAnomaliesSearch, setAdminAnomaliesSearch] = useState("");
  const [adminAnomaliesSearchInput, setAdminAnomaliesSearchInput] = useState("");
  const [adminAnomaliesSeverity, setAdminAnomaliesSeverity] = useState("");
  const [adminAnomaliesSeverityInput, setAdminAnomaliesSeverityInput] = useState("");
  const [adminAnomaliesType, setAdminAnomaliesType] = useState("");
  const [adminAnomaliesTypeInput, setAdminAnomaliesTypeInput] = useState("");

  const [financialInsightsData, setFinancialInsightsData] = useState(null);
  const [financialInsightsLoading, setFinancialInsightsLoading] = useState(false);
  const [financialInsightsError, setFinancialInsightsError] = useState("");

  const [cashflowData, setCashflowData] = useState(null);
  const [cashflowLoading, setCashflowLoading] = useState(false);
  const [cashflowError, setCashflowError] = useState("");

  const [trendsData, setTrendsData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState("");
  const [arAgingData, setArAgingData] = useState(null);
  const [arAgingLoading, setArAgingLoading] = useState(false);
  const [arAgingError, setArAgingError] = useState("");

  const [authDraft, setAuthDraft] = useState({
    fullName: "",
    email: "",
    password: "",
    rememberMe: false,
    signupPlan: "free",
    entityType: "Hüquqi şəxs",
    companyName: "",
    taxId: "",
    mobilePhone: ""
  });
  const [forgotDraft, setForgotDraft] = useState({ email: "" });
  const [resetDraft, setResetDraft] = useState({ password: "", confirmPassword: "" });
  const [resetRequests, setResetRequests] = useState([]);
  const [activeResetToken, setActiveResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [demoDraft, setDemoDraft] = useState({ companyName: "", fullName: "", email: "" });
  const [booksNotice, setBooksNotice] = useState("");
  const [fnBilling, setFnBilling] = useState("annual");
  const [fnDemoForm, setFnDemoForm] = useState({ fname: "", lname: "", email: "", phone: "", company: "", size: "", time: "" });
  const [fnStartForm, setFnStartForm] = useState({ name: "", email: "" });
  const [fnDemoSent, setFnDemoSent] = useState(false);
  const [fnStartSent, setFnStartSent] = useState(false);
  const [pendingPaymentReturn, setPendingPaymentReturn] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get("payment");

    if (!status) {
      return null;
    }

    return {
      status,
      message: searchParams.get("message") || "",
      orderId: searchParams.get("orderId") || "",
      code: searchParams.get("code") || "",
      uiHandled: false,
    };
  });
  const [signInStartedAt, setSignInStartedAt] = useState(null);
  const [internalLoginStartedAt, setInternalLoginStartedAt] = useState(null);
  const [authProgressTick, setAuthProgressTick] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [appNavOpen, setAppNavOpen] = useState(false);
  const [accountPanel, setAccountPanel] = useState(null);
  const [passwordDraft, setPasswordDraft] = useState({ current: "", next: "", confirm: "", notice: "", tone: "" });
  const [subscriptionBillingCycle, setSubscriptionBillingCycle] = useState("monthly");
  const [hubBillingCycle, setHubBillingCycle] = useState("annual");
  const [adminPlanDrafts, setAdminPlanDrafts] = useState({});
  const [teamMemberDraft, setTeamMemberDraft] = useState({ fullName: "", email: "", password: "", staffRole: "Admin" });
  const [paymentDraft, setPaymentDraft] = useState({ planCode: "", billingCycle: "monthly" });
  const [paymentTermsAccepted, setPaymentTermsAccepted] = useState(false);
  const [legalOverlay, setLegalOverlay] = useState(null);
  const [supportThreads, setSupportThreads] = useState([]);
  const [supportWidgetOpen, setSupportWidgetOpen] = useState(false);
  const [supportActiveThreadId, setSupportActiveThreadId] = useState(null);
  const [supportDraft, setSupportDraft] = useState({ subject: "", category: SUPPORT_CATEGORY_OPTIONS[0], priority: SUPPORT_PRIORITY_OPTIONS[0], message: "" });
  const [supportReplyDraft, setSupportReplyDraft] = useState("");
  const [supportAdminReplyDraft, setSupportAdminReplyDraft] = useState("");
  const [supportAdminFilter, setSupportAdminFilter] = useState("all");
  const [supportAdminActiveThreadId, setSupportAdminActiveThreadId] = useState(null);
  const supportUserScrollRef = useRef(null);
  const supportAdminScrollRef = useRef(null);
  const supportAudioContextRef = useRef(null);
  const supportNotificationSnapshotRef = useRef({ role: "", accountKey: "", latestByThread: new Map() });
  const [journalInlineCreate, setJournalInlineCreate] = useState({});
  const supportAccountKey = currentUser?.accountId || "";
  const userSupportThreads = supportAccountKey
    ? supportThreads
        .filter((thread) => thread.accountKey === supportAccountKey)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    : [];
  const supportUnreadCount = currentUser?.role === "super_admin"
    ? supportThreads.reduce((sum, thread) => sum + Number(thread.unreadForAdmin || 0), 0)
    : userSupportThreads.reduce((sum, thread) => sum + Number(thread.unreadForUser || 0), 0);
  const activeUserSupportThread = currentUser && currentUser.role !== "super_admin"
    ? (userSupportThreads.find((thread) => thread.id === supportActiveThreadId) || null)
    : null;
  const activeAdminSupportThread = currentUser?.role === "super_admin"
    ? (supportThreads.find((thread) => thread.id === supportAdminActiveThreadId) || null)
    : null;
  const suspendAutoSaveRef = useRef(false);
  const demoPreviewStats = useMemo(() => buildDemoPreviewStats(timeTick), [timeTick]);
  const [animatedPreviewStats, setAnimatedPreviewStats] = useState(() => buildDemoPreviewStats(Date.now()));
  const [goodsTabIdx, setGoodsTabIdx] = useState(0); // 0=all, 1=goods, 2=services

  function updateBackendSession(session) {
    setBackendSession(session || null);
    setApiSession(session || null);
    try {
      if (session) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        // Sync bills after login
        syncBillsFromBackend(session);
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {}
  }

  async function syncBackendSubscription(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) return;

    setApiSession(session);
    const [me, plans, subscription, orders] = await Promise.all([
      apiMe(updateBackendSession),
      apiGetPlans(),
      apiGetCurrentSubscription(updateBackendSession),
      apiGetMyOrders(updateBackendSession),
    ]);

    setBackendPlans(Array.isArray(plans) ? plans : []);
    setBackendSubscription(subscription || null);
    setBackendOrders(Array.isArray(orders) ? orders : []);

    const backendPlanCode = subscription?.plan?.code ? String(subscription.plan.code).toUpperCase() : "";
    const mappedLegacyPlanId = backendPlanCode ? LEGACY_PLAN_ID_BY_BACKEND_PLAN_CODE[backendPlanCode] : null;

    const normalizedUser = normalizeAuthUser({
      id: me.id,
      accountId: me.accountId,
      fullName: me.fullName || me.email,
      email: me.email,
      role: String(me.role || "").toLowerCase() || "owner",
      profile: {
        entityType: "Hüquqi şəxs",
        companyName: me.fullName || me.email,
        taxId: "",
        mobilePhone: "",
      },
      operationsUsed: subscription?.operationsUsed ?? 0,
      subscription: {
        planId: mappedLegacyPlanId || backendPlanCode || "free",
        billingCycle: "monthly",
        startedAt: today(),
        endsAt: subscription?.currentPeriodEnd ? String(subscription.currentPeriodEnd).slice(0, 10) : null,
        autoDowngraded: "Xeyr",
      },
    });

    setCurrentUser(normalizedUser);
  }

  function normalizeSupportThread(thread) {
    const messages = Array.isArray(thread?.messages) ? thread.messages : [];
    const backendStatus = String(thread?.status || "open").toLowerCase();
    const displayStatus = backendStatus === "waiting_account" ? "waiting_user" : backendStatus;
    const backendCategory = String(thread?.category || "").toUpperCase();
    const backendPriority = String(thread?.priority || "").toUpperCase();

    return {
      id: thread?.id || crypto.randomUUID(),
      accountKey: thread?.accountKey || thread?.accountId || "",
      accountId: thread?.accountId || "",
      ownerEmail: thread?.ownerEmail || "",
      ownerName: thread?.ownerName || thread?.ownerEmail || "",
      companyName: thread?.companyName || "",
      subject: String(thread?.subject || "").trim(),
      category: SUPPORT_CATEGORY_FROM_BACKEND[backendCategory] || thread?.category || SUPPORT_CATEGORY_OPTIONS[0],
      priority: SUPPORT_PRIORITY_FROM_BACKEND[backendPriority] || thread?.priority || SUPPORT_PRIORITY_OPTIONS[0],
      status: displayStatus,
      context: String(thread?.context || "").trim(),
      createdAt: thread?.createdAt || new Date().toISOString(),
      updatedAt: thread?.updatedAt || new Date().toISOString(),
      unreadForAdmin: Number(thread?.unreadForAdmin || 0),
      unreadForUser: Number(thread?.unreadForUser || 0),
      messages: messages.map((message) => ({
        id: message?.id || crypto.randomUUID(),
        authorType: message?.authorType === "admin" ? "admin" : "user",
        authorName: String(message?.authorName || "").trim(),
        authorEmail: String(message?.authorEmail || "").trim(),
        body: String(message?.body || "").trim(),
        createdAt: message?.createdAt || new Date().toISOString(),
      })),
    };
  }

  async function syncSupportThreadsFromBackend(sessionOverride = null, userOverride = null) {
    const session = sessionOverride || backendSession;
    const user = userOverride || currentUser;

    if (!session?.accessToken || !user) {
      setSupportThreads([]);
      return [];
    }

    try {
      let threads = [];

      if (user.role === "super_admin") {
        let page = 1;
        let totalPages = 1;
        const collected = [];

        while (page <= totalPages) {
          const response = await apiListInternalSupportThreads({ page, limit: 100 }, updateBackendSession);
          const batch = Array.isArray(response?.data) ? response.data : [];
          collected.push(...batch.map(normalizeSupportThread));

          const meta = response?.meta || {};
          totalPages = Math.max(1, Number(meta.totalPages || 1));
          page += 1;
        }

        threads = collected;
      } else {
        const response = await apiListSupportThreads(updateBackendSession);
        threads = Array.isArray(response) ? response.map(normalizeSupportThread) : [];
      }

      setSupportThreads(threads);
      return threads;
    } catch {
      setSupportThreads([]);
      return [];
    }
  }

  function normalizeBackendCustomer(record) {
    return {
      id: record?.id || crypto.randomUUID(),
      displayName: String(record?.displayName || "").trim(),
      companyName: String(record?.companyName || record?.displayName || "").trim(),
      email: String(record?.email || "").trim(),
      phone: String(record?.phone || "").trim(),
      taxId: String(record?.taxId || "").trim(),
      status: String(record?.status || "ACTIVE").trim() || "ACTIVE",
      outstandingReceivables: 0,
      createdAt: record?.createdAt ? String(record.createdAt).slice(0, 10) : today(),
    };
  }

  async function syncCustomersFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setCustomersLoading(false);
      setCustomersError("");
      setCustomersMeta(null);
      setState((current) => (
        current.customers.length
          ? { ...current, customers: [] }
          : current
      ));
      return [];
    }

    setCustomersLoading(true);
    setCustomersError("");

    try {
      let page = 1;
      let totalPages = 1;
      let lastMeta = null;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListCustomers({ page, limit: 100 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendCustomer));

        const meta = response?.meta || {};
        totalPages = Math.max(1, Number(meta.totalPages || 1));
        lastMeta = {
          page: Number(meta.page || page),
          limit: Number(meta.limit || 100),
          total: Number(meta.total || collected.length),
          totalPages,
        };
        page += 1;
      }

      setState((current) => ({ ...current, customers: collected }));
      setCustomersMeta(lastMeta || {
        page: 1,
        limit: collected.length || 100,
        total: collected.length,
        totalPages: 1,
      });

      return collected;
    } catch (error) {
      setCustomersError(error?.message || "Müştəri məlumatları backend-dən alınmadı.");
      setCustomersMeta(null);
      setState((current) => ({ ...current, customers: [] }));
      return [];
    } finally {
      setCustomersLoading(false);
    }
  }

  function buildCustomerApiPayload(activeDraft) {
    const parsed = { ...parseDraft("customers", activeDraft), ...buildOperationalPayload("customers", activeDraft) };
    const displayName = String(parsed.displayName || "").trim() || String(parsed.companyName || "").trim();

    return {
      displayName,
      companyName: String(parsed.companyName || "").trim() || undefined,
      email: String(parsed.email || "").trim() || undefined,
      phone: String(parsed.phone || "").trim() || undefined,
      taxId: String(parsed.taxId || "").trim() || undefined,
      status: String(parsed.status || "").trim() || undefined,
    };
  }

  const FREE_LIMIT_MESSAGES = {
    az: {
      customers: "Demo plan limiti dolub. 5-dən çox müştəri əlavə etmək üçün planı yüksəldin.",
      vendors:   "Demo plan limiti dolub. 5-dən çox vendor əlavə etmək üçün planı yüksəldin.",
      invoices:  "Demo plan limiti dolub. 5-dən çox invoice yaratmaq üçün planı yüksəldin.",
    },
    en: {
      customers: "Demo plan limit reached. Upgrade to add more than 5 customers.",
      vendors:   "Demo plan limit reached. Upgrade to add more than 5 vendors.",
      invoices:  "Demo plan limit reached. Upgrade to create more than 5 invoices.",
    },
    ru: {
      customers: "Достигнут лимит Demo плана. Перейдите на платный, чтобы добавить более 5 клиентов.",
      vendors:   "Достигнут лимит Demo плана. Перейдите на платный, чтобы добавить более 5 поставщиков.",
      invoices:  "Достигнут лимит Demo плана. Перейдите на платный, чтобы создать более 5 счетов.",
    },
    tr: {
      customers: "Demo plan limitine ulaşıldı. 5'ten fazla müşteri eklemek için planı yükseltin.",
      vendors:   "Demo plan limitine ulaşıldı. 5'ten fazla tedarikçi eklemek için planı yükseltin.",
      invoices:  "Demo plan limitine ulaşıldı. 5'ten fazla fatura oluşturmak için planı yükseltin.",
    },
    de: {
      customers: "Limit des Demo-Plans erreicht. Upgraden Sie, um mehr als 5 Kunden hinzuzufügen.",
      vendors:   "Limit des Demo-Plans erreicht. Upgraden Sie, um mehr als 5 Lieferanten hinzuzufügen.",
      invoices:  "Limit des Demo-Plans erreicht. Upgraden Sie, um mehr als 5 Rechnungen zu erstellen.",
    },
  };
  const freeLimitMsg = FREE_LIMIT_MESSAGES[hubLang] || FREE_LIMIT_MESSAGES.en;

  async function submitCustomerModule(activeDraft, editingId) {
    const payload = buildCustomerApiPayload(activeDraft);

    if (!payload.displayName) {
      setCustomersError("Müştəri adı boş ola bilməz.");
      return;
    }

    setCustomersLoading(true);
    setCustomersError("");

    try {
      if (editingId) {
        await apiUpdateCustomer(editingId, payload, updateBackendSession);
      } else {
        if (isAtFreePlanEntityLimit("customers")) {
          setCustomersError(freeLimitMsg.customers);
          setCustomersLoading(false);
          setAccountPanel("plans");
          return;
        }
        await apiCreateCustomer(payload, updateBackendSession);
        markOperationUsage();
      }

      await syncCustomersFromBackend();
      cancelEdit("customers");
    } catch (error) {
      setCustomersError(error?.message || "Müştəri yadda saxlanmadı.");
    } finally {
      setCustomersLoading(false);
    }
  }

  async function deleteCustomerRecord(recordId) {
    setCustomersLoading(true);
    setCustomersError("");

    try {
      await apiDeleteCustomer(recordId, updateBackendSession);
      await syncCustomersFromBackend();
      if (editing.customers === recordId) {
        cancelEdit("customers");
      }
    } catch (error) {
      setCustomersError(error?.message || "Müştəri silinmədi.");
    } finally {
      setCustomersLoading(false);
    }
  }

  function normalizeBackendVendor(record) {
    return {
      id: record?.id || crypto.randomUUID(),
      vendorName: String(record?.vendorName || "").trim(),
      companyName: String(record?.companyName || record?.vendorName || "").trim(),
      email: String(record?.email || "").trim(),
      phone: String(record?.phone || "").trim(),
      taxId: String(record?.taxId || "").trim(),
      status: String(record?.status || "ACTIVE").trim() || "ACTIVE",
      createdAt: record?.createdAt ? String(record.createdAt).slice(0, 10) : today(),
    };
  }

  async function syncVendorsFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setVendorsLoading(false);
      setVendorsError("");
      setVendorsMeta(null);
      setState((current) => (
        current.vendors.length
          ? { ...current, vendors: [] }
          : current
      ));
      return [];
    }

    setVendorsLoading(true);
    setVendorsError("");

    try {
      let page = 1;
      let totalPages = 1;
      let lastMeta = null;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListVendors({ page, limit: 100 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendVendor));

        const meta = response?.meta || {};
        totalPages = Math.max(1, Number(meta.totalPages || 1));
        lastMeta = {
          page: Number(meta.page || page),
          limit: Number(meta.limit || 100),
          total: Number(meta.total || collected.length),
          totalPages,
        };
        page += 1;
      }

      setState((current) => ({ ...current, vendors: collected }));
      setVendorsMeta(lastMeta || {
        page: 1,
        limit: collected.length || 100,
        total: collected.length,
        totalPages: 1,
      });

      return collected;
    } catch (error) {
      setVendorsError(error?.message || "Təchizatçı məlumatları backend-dən alınmadı.");
      setVendorsMeta(null);
      setState((current) => ({ ...current, vendors: [] }));
      return [];
    } finally {
      setVendorsLoading(false);
    }
  }

  function normalizeBackendAccount(record) {
    return {
      id: record?.id || crypto.randomUUID(),
      accountCode: String(record?.accountCode || "").trim(),
      accountName: String(record?.accountName || "").trim(),
      accountType: String(record?.accountType || "Aktiv").trim(),
      status: String(record?.status || "Aktiv").trim(),
      balance: Number(record?.balance || 0),
      createdAt: record?.createdAt ? String(record.createdAt).slice(0, 10) : today(),
    };
  }

  function normalizeBackendJournal(record) {
    return {
      id: record?.id || crypto.randomUUID(),
      journalNumber: String(record?.journalNumber || "").trim(),
      reference: String(record?.reference || "").trim(),
      debitAccount: String(record?.debitAccount || "").trim(),
      creditAccount: String(record?.creditAccount || "").trim(),
      date: record?.date ? String(record.date).slice(0, 10) : today(),
      debit: Number(record?.debit || 0),
      credit: Number(record?.credit || 0),
      createdAt: record?.createdAt ? String(record.createdAt).slice(0, 10) : today(),
      journalLines: Array.isArray(record?.journalLines)
        ? record.journalLines.map((line) => ({
            id: line?.id || crypto.randomUUID(),
            accountCode: String(line?.accountCode || "").trim(),
            entryType: String(line?.entryType || "Debet").trim(),
            amount: Number(line?.amount || 0),
            linkedQuantity: Number(line?.linkedQuantity || 0),
            linkedUnit: String(line?.linkedUnit || "").trim(),
            subledgerCategory: String(line?.subledgerCategory || "").trim(),
            linkedEntityType: String(line?.linkedEntityType || "").trim(),
            linkedEntityId: String(line?.linkedEntityId || "").trim(),
            linkedEntityName: String(line?.linkedEntityName || "").trim(),
          }))
        : [],
    };
  }

  async function syncAccountsFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setAccountsLoading(false);
      setAccountsError("");
      return [];
    }

    setAccountsLoading(true);
    setAccountsError("");

    try {
      let page = 1;
      let totalPages = 1;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListAccountingAccounts({ page, limit: 500 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendAccount));
        totalPages = Math.max(1, Number(response?.meta?.totalPages || 1));
        page += 1;
      }

      setState((current) => ({ ...current, chartOfAccounts: collected }));
      return collected;
    } catch (error) {
      setAccountsError(error?.message || "Hesablar planı backend-dən alınmadı.");
      return [];
    } finally {
      setAccountsLoading(false);
    }
  }

  async function syncJournalsFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setJournalsLoading(false);
      setJournalsError("");
      return [];
    }

    setJournalsLoading(true);
    setJournalsError("");

    try {
      let page = 1;
      let totalPages = 1;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListJournalEntries({ page, limit: 100 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendJournal));
        totalPages = Math.max(1, Number(response?.meta?.totalPages || 1));
        page += 1;
      }

      setState((current) => ({ ...current, manualJournals: collected }));
      return collected;
    } catch (error) {
      setJournalsError(error?.message || "Müxabirləşmə jurnalı backend-dən alınmadı.");
      return [];
    } finally {
      setJournalsLoading(false);
    }
  }

  async function syncBillsFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setBillsLoading(false);
      setBillsError("");
      setState((current) => (
        current.bills.length
          ? { ...current, bills: [] }
          : current
      ));
      return [];
    }

    setBillsLoading(true);
    setBillsError("");

    try {
      let page = 1;
      let totalPages = 1;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListBills({ page, limit: 100 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendBill));

        const meta = response?.meta || {};
        totalPages = Math.max(1, Number(meta.totalPages || 1));
        page += 1;
      }

      setState((current) => ({ ...current, bills: collected }));
      return collected;
    } catch (error) {
      setBillsError(error?.message || "Hesab-fakturalar backend-dən alınmadı.");
      setState((current) => ({ ...current, bills: [] }));
      return [];
    } finally {
      setBillsLoading(false);
    }
  }

  function normalizeBackendBill(bill) {
    if (!bill || typeof bill !== "object") return null;
    return {
      id: String(bill.id || ""),
      vendorId: String(bill.vendorId || ""),
      billNumber: String(bill.billNumber || ""),
      status: String(bill.status || "DRAFT"),
      issueDate: String(bill.issueDate || today()),
      dueDate: bill.dueDate ? String(bill.dueDate) : "",
      currency: String(bill.currency || "AZN"),
      notes: String(bill.notes || ""),
      totalMinor: Number(bill.totalMinor || 0),
      paidAmountMinor: Number(bill.paidAmountMinor || 0),
      outstandingMinor: Number(bill.outstandingMinor || 0),
      lines: Array.isArray(bill.lines) ? bill.lines.map((line) => normalizeBackendBillLine(line)) : [],
      createdAt: bill.createdAt ? String(bill.createdAt) : "",
      updatedAt: bill.updatedAt ? String(bill.updatedAt) : "",
    };
  }

  async function syncBankAccountsFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setBankingLoading(false);
      setBankingError("");
      setState((current) => (
        current.bankingAccounts.length
          ? { ...current, bankingAccounts: [] }
          : current
      ));
      return [];
    }

    setBankingLoading(true);
    setBankingError("");

    try {
      let page = 1;
      let totalPages = 1;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListBankAccounts({ page, limit: 100 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendBankAccount));

        const meta = response?.meta || {};
        totalPages = Math.max(1, Number(meta.totalPages || 1));
        page += 1;
      }

      setState((current) => ({ ...current, bankingAccounts: collected }));
      return collected;
    } catch (error) {
      setBankingError(error?.message || "Bank hesabları backend-dən alınmadı.");
      setState((current) => ({ ...current, bankingAccounts: [] }));
      return [];
    } finally {
      setBankingLoading(false);
    }
  }

  async function syncBankTransactionsFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setBankingLoading(false);
      setBankingError("");
      setState((current) => (
        current.bankTransactions.length
          ? { ...current, bankTransactions: [] }
          : current
      ));
      return [];
    }

    setBankingLoading(true);
    setBankingError("");

    try {
      let page = 1;
      let totalPages = 1;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListBankTransactions({ page, limit: 100 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendBankTransaction));

        const meta = response?.meta || {};
        totalPages = Math.max(1, Number(meta.totalPages || 1));
        page += 1;
      }

      setState((current) => ({ ...current, bankTransactions: collected }));
      return collected;
    } catch (error) {
      setBankingError(error?.message || "Bank əməliyyatları backend-dən alınmadı.");
      setState((current) => ({ ...current, bankTransactions: [] }));
      return [];
    } finally {
      setBankingLoading(false);
    }
  }

  function normalizeBackendBankAccount(record) {
    if (!record || typeof record !== "object") return null;
    return {
      id: String(record.id || ""),
      accountName: String(record.accountName || ""),
      accountNumber: String(record.accountNumber || ""),
      bankName: String(record.bankName || ""),
      currency: String(record.currency || "AZN"),
      balance: Number(record.balance || 0),
      status: String(record.status || "AKTIV"),
      createdAt: record.createdAt ? String(record.createdAt) : "",
    };
  }

  function normalizeBackendBankTransaction(record) {
    if (!record || typeof record !== "object") return null;
    return {
      id: String(record.id || ""),
      bankAccountId: String(record.bankAccountId || ""),
      type: String(record.type || "INFLOW"),
      amountMinor: Number(record.amountMinor || 0),
      transactionDate: String(record.transactionDate || today()),
      description: String(record.description || ""),
      reference: String(record.reference || ""),
      createdAt: record.createdAt ? String(record.createdAt) : "",
    };
  }

  function normalizeBackendBillLine(line) {
    if (!line || typeof line !== "object") return null;
    return {
      id: String(line.id || ""),
      itemName: String(line.itemName || ""),
      description: String(line.description || ""),
      quantity: Number(line.quantity || 0),
      unitPriceMinor: Number(line.unitPriceMinor || 0),
      taxCode: String(line.taxCode || ""),
      taxRate: Number(line.taxRate || 0),
      lineTotalMinor: Number(line.lineTotalMinor || 0),
    };
  }

  async function deleteBillRecord(recordId) {
    setBillsLoading(true);
    setBillsError("");

    try {
      await apiDeleteBill(recordId, updateBackendSession);
      await syncBillsFromBackend();
      if (editing.incomingGoodsServices === recordId) {
        cancelEdit("incomingGoodsServices");
      }
    } catch (error) {
      setBillsError(error?.message || "Hesab-faktura silinmədi.");
    } finally {
      setBillsLoading(false);
    }
  }

  async function submitAccountingAccountModule(activeDraft, editingId) {
    const payload = {
      accountCode: String(activeDraft.accountCode || "").trim(),
      accountName: String(activeDraft.accountName || "").trim(),
      accountType: String(activeDraft.accountType || "Aktiv").trim(),
      status: String(activeDraft.status || "Aktiv").trim(),
      balance: Number(activeDraft.balance || 0),
    };

    if (!payload.accountCode || !payload.accountName) {
      setAccountsError("Hesab kodu və adı mütləq daxil edilməlidir.");
      return;
    }

    setAccountsLoading(true);
    setAccountsError("");

    try {
      if (editingId) {
        await apiUpdateAccountingAccount(editingId, payload, updateBackendSession);
      } else {
        await apiCreateAccountingAccount(payload, updateBackendSession);
        markOperationUsage();
      }
      await syncAccountsFromBackend();
      cancelEdit("chartOfAccounts");
    } catch (error) {
      setAccountsError(error?.message || "Hesab yadda saxlanmadı.");
    } finally {
      setAccountsLoading(false);
    }
  }

  async function deleteAccountingAccountRecord(recordId) {
    setAccountsLoading(true);
    setAccountsError("");
    try {
      await apiDeleteAccountingAccount(recordId, updateBackendSession);
      await syncAccountsFromBackend();
      if (editing.chartOfAccounts === recordId) cancelEdit("chartOfAccounts");
    } catch (error) {
      setAccountsError(error?.message || "Hesab silinmədi.");
    } finally {
      setAccountsLoading(false);
    }
  }

  async function submitJournalEntryModule(activeDraft, editingId) {
    const analysis = getManualJournalAnalysis(activeDraft);
    if (!analysis.isBalanced) return;

    const payload = {
      journalNumber: String(activeDraft.journalNumber || "").trim() || undefined,
      reference: String(activeDraft.reference || "").trim() || undefined,
      date: activeDraft.date || today(),
      journalLines: analysis.filledLines.map((line) => ({
        accountCode: line.accountCode,
        entryType: line.entryType,
        amount: Number(line.amount || 0),
        subledgerCategory: line.subledgerCategory || "",
        linkedEntityType: line.linkedEntityType || "",
        linkedEntityId: line.linkedEntityId || "",
        linkedEntityName: line.linkedEntityName || "",
      })),
    };

    setJournalsLoading(true);
    setJournalsError("");

    try {
      if (editingId) {
        await apiUpdateJournalEntry(editingId, payload, updateBackendSession);
      } else {
        await apiCreateJournalEntry(payload, updateBackendSession);
        markOperationUsage();
      }
      await syncJournalsFromBackend();
      cancelEdit("manualJournals");
    } catch (error) {
      setJournalsError(error?.message || "Müxabirləşmə yadda saxlanmadı.");
    } finally {
      setJournalsLoading(false);
    }
  }

  async function submitBillModule(activeDraft, editingId) {
    setBillsLoading(true);
    setBillsError("");

    try {
      const payload = moduleId === "incomingGoodsServices"
        ? (() => {
            const vendor = state.vendors.find((v) => v.id === activeDraft.vendorId) || null;
            const lineItems = (activeDraft.lineItems || []).map((item) => {
              const calc = calculateLineItem(item.quantity, item.rate, item.taxLabel);
              return {
                itemName: String(item.itemName || item.name || "").trim(),
                description: String(item.description || "").trim() || undefined,
                quantity: Number(item.quantity || 0),
                unitPriceMinor: Math.round(Number(item.rate || 0) * 100),
                taxCode: String(item.taxLabel || "").trim() || undefined,
                taxRate: Number(item.taxRate ?? extractTaxRateFromLabel(item.taxLabel)),
              };
            });
            return {
              vendorId: vendor?.id || activeDraft.vendorId || "",
              billNumber: String(activeDraft.billNumber || "").trim() || undefined,
              status: String(activeDraft.status || "DRAFT").trim(),
              issueDate: String(activeDraft.billDate || activeDraft.issueDate || today()),
              dueDate: activeDraft.dueDate ? String(activeDraft.dueDate) : undefined,
              currency: String(state.settings.currency || "AZN").trim().toUpperCase(),
              notes: String(activeDraft.notes || "").trim() || undefined,
              lines: lineItems,
            };
          })()
        : {};

      if (editingId) {
        await apiUpdateBill(editingId, payload, updateBackendSession);
      } else {
        await apiCreateBill(payload, updateBackendSession);
        markOperationUsage();
      }
      await syncBillsFromBackend();
      cancelEdit("incomingGoodsServices");
    } catch (error) {
      setBillsError(error?.message || "Hesab-faktura yadda saxlanmadı.");
    } finally {
      setBillsLoading(false);
    }
  }

  async function deleteJournalEntryRecord(recordId) {
    setJournalsLoading(true);
    setJournalsError("");
    try {
      await apiDeleteJournalEntry(recordId, updateBackendSession);
      await syncJournalsFromBackend();
      if (editing.manualJournals === recordId) cancelEdit("manualJournals");
    } catch (error) {
      setJournalsError(error?.message || "Müxabirləşmə silinmədi.");
    } finally {
      setJournalsLoading(false);
    }
  }

  function buildVendorApiPayload(activeDraft) {
    const parsed = { ...parseDraft("vendors", activeDraft), ...buildOperationalPayload("vendors", activeDraft) };
    const vendorName = String(parsed.vendorName || "").trim() || String(parsed.companyName || "").trim();

    return {
      vendorName,
      companyName: String(parsed.companyName || "").trim() || undefined,
      email: String(parsed.email || "").trim() || undefined,
      phone: String(parsed.phone || "").trim() || undefined,
      taxId: String(parsed.taxId || "").trim() || undefined,
      status: String(parsed.status || "").trim() || undefined,
    };
  }

  async function submitVendorModule(activeDraft, editingId) {
    const payload = buildVendorApiPayload(activeDraft);

    if (!payload.vendorName) {
      setVendorsError("Təchizatçı adı boş ola bilməz.");
      return;
    }

    setVendorsLoading(true);
    setVendorsError("");

    try {
      if (editingId) {
        await apiUpdateVendor(editingId, payload, updateBackendSession);
      } else {
        if (isAtFreePlanEntityLimit("vendors")) {
          setVendorsError(freeLimitMsg.vendors);
          setVendorsLoading(false);
          setAccountPanel("plans");
          return;
        }
        await apiCreateVendor(payload, updateBackendSession);
        markOperationUsage();
      }

      await syncVendorsFromBackend();
      cancelEdit("vendors");
    } catch (error) {
      setVendorsError(error?.message || "Təchizatçı yadda saxlanmadı.");
    } finally {
      setVendorsLoading(false);
    }
  }

  async function deleteVendorRecord(recordId) {
    setVendorsLoading(true);
    setVendorsError("");

    try {
      await apiDeleteVendor(recordId, updateBackendSession);
      await syncVendorsFromBackend();
      if (editing.vendors === recordId) {
        cancelEdit("vendors");
      }
    } catch (error) {
      setVendorsError(error?.message || "Təchizatçı silinmədi.");
    } finally {
      setVendorsLoading(false);
    }
  }

  function normalizeBackendCompanySettings(record) {
    return {
      companyName: String(record?.companyName || "").trim(),
      taxId: String(record?.taxId || "").trim(),
      mobilePhone: String(record?.mobilePhone || "").trim(),
      entityType: String(record?.entityType || "").trim() || "Hüquqi şəxs",
      currency: String(record?.currency || "").trim().toUpperCase() || "AZN",
      fiscalYear: String(record?.fiscalYear || "").trim(),
    };
  }

  async function syncCompanySettingsFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setCompanySettingsLoading(false);
      setCompanySettingsError("");
      return null;
    }

    setCompanySettingsLoading(true);
    setCompanySettingsError("");

    try {
      const response = await apiGetCompanySettings(updateBackendSession);
      const nextSettings = normalizeBackendCompanySettings(response);

      setState((current) => ({
        ...current,
        settings: {
          ...current.settings,
          ...nextSettings,
        },
      }));

      return nextSettings;
    } catch (error) {
      setCompanySettingsError(error?.message || "Şirkət məlumatları backend-dən alınmadı.");
      return null;
    } finally {
      setCompanySettingsLoading(false);
    }
  }

  function formatBackendTaxLabel(taxRate) {
    const rate = Number(taxRate || 0);
    if (rate <= 0) return "ƏDV 0%";
    return `ƏDV ${rate}%`;
  }

  function normalizeBackendInvoice(record) {
    const customerName = String(
      record?.customer?.companyName || record?.customer?.displayName || record?.customerName || ""
    ).trim();
    const lines = Array.isArray(record?.lines) ? record.lines : [];

    return {
      id: record?.id || crypto.randomUUID(),
      customerId: String(record?.customerId || record?.customer?.id || "").trim(),
      customerName,
      invoiceNumber: String(record?.invoiceNumber || "").trim(),
      status: String(record?.status || "Qaralama").trim() || "Qaralama",
      issueDate: record?.issueDate ? String(record.issueDate).slice(0, 10) : today(),
      dueDate: record?.dueDate ? String(record.dueDate).slice(0, 10) : today(),
      currency: String(record?.currency || state.settings.currency || "AZN").trim().toUpperCase(),
      notes: String(record?.notes || "").trim(),
      subTotal: Number(record?.subTotalMinor || 0) / 100,
      discount: "0",
      discountAmount: 0,
      adjustment: "0",
      amount: Number(record?.totalMinor || 0) / 100,
      outstanding: Number(record?.outstandingMinor ?? record?.totalMinor ?? 0) / 100,
      paidAt: record?.paidAt ? String(record.paidAt).slice(0, 10) : null,
      paidAmountMinor: Number(record?.paidAmountMinor || 0),
      outstandingMinor: Number(record?.outstandingMinor ?? record?.totalMinor ?? 0),
      payments: Array.isArray(record?.payments) ? record.payments : [],
      createdAt: record?.createdAt ? String(record.createdAt).slice(0, 10) : today(),
      lineItems: lines.length > 0
        ? lines.map((line) => {
            const quantity = Number(line?.quantity || 0);
            const unitPriceMinor = Number(line?.unitPriceMinor || 0);
            const baseMinor = Math.round(quantity * unitPriceMinor);
            const lineTotalMinor = Number(line?.lineTotalMinor || 0);
            const taxMinor = Math.max(0, lineTotalMinor - baseMinor);

            return {
              id: line?.id || crypto.randomUUID(),
              itemName: String(line?.itemName || "").trim(),
              description: String(line?.description || "").trim(),
              accountCode: "601",
              quantity: String(quantity || 1),
              rate: (unitPriceMinor / 100).toFixed(2),
              taxLabel: formatBackendTaxLabel(line?.taxRate),
              taxRate: Number(line?.taxRate || 0),
              baseAmount: baseMinor / 100,
              taxAmount: taxMinor / 100,
              amount: lineTotalMinor / 100,
            };
          })
        : [createDefaultSalesLineItem()],
    };
  }

  async function syncInvoicesFromBackend(sessionOverride = null) {
    const session = sessionOverride || backendSession;
    if (!session?.accessToken) {
      setInvoicesLoading(false);
      setInvoicesError("");
      setInvoicesMeta(null);
      setState((current) => (
        current.invoices.length
          ? { ...current, invoices: [] }
          : current
      ));
      return [];
    }

    setInvoicesLoading(true);
    setInvoicesError("");

    try {
      let page = 1;
      let totalPages = 1;
      let lastMeta = null;
      const collected = [];

      while (page <= totalPages) {
        const response = await apiListInvoices({ page, limit: 100 }, updateBackendSession);
        const batch = Array.isArray(response?.data) ? response.data : [];
        collected.push(...batch.map(normalizeBackendInvoice));

        const meta = response?.meta || {};
        totalPages = Math.max(1, Number(meta.totalPages || 1));
        lastMeta = {
          page: Number(meta.page || page),
          limit: Number(meta.limit || 100),
          total: Number(meta.total || collected.length),
          totalPages,
        };
        page += 1;
      }

      setState((current) => ({ ...current, invoices: collected }));
      setInvoicesMeta(lastMeta || {
        page: 1,
        limit: collected.length || 100,
        total: collected.length,
        totalPages: 1,
      });

      return collected;
    } catch (error) {
      setInvoicesError(error?.message || "Fakturalar backend-dən alınmadı.");
      setInvoicesMeta(null);
      setState((current) => ({ ...current, invoices: [] }));
      return [];
    } finally {
      setInvoicesLoading(false);
    }
  }

  function resolveInvoiceCustomer(activeDraft) {
    const customerId = String(activeDraft.customerId || "").trim();
    if (customerId) {
      return state.customers.find((item) => item.id === customerId) || null;
    }

    const customerName = String(activeDraft.customerName || "").trim();
    if (!customerName) return null;
    return state.customers.find((item) => {
      const label = String(item.companyName || item.displayName || "").trim();
      return label === customerName;
    }) || null;
  }

  function buildInvoiceApiPayload(activeDraft) {
    const parsed = { ...parseDraft("invoices", activeDraft), ...buildOperationalPayload("invoices", activeDraft) };
    const customer = resolveInvoiceCustomer(activeDraft);

    if (!customer?.id) {
      throw new Error("Faktura üçün mövcud müştəri seçilməlidir.");
    }

    const lines = (activeDraft.lineItems || [createDefaultSalesLineItem()]).map((item) => ({
      itemName: String(item.itemName || "").trim(),
      description: String(item.description || "").trim() || undefined,
      quantity: Number(item.quantity || 0),
      unitPriceMinor: Math.round(Number(item.rate || 0) * 100),
      taxCode: String(item.taxLabel || "").trim() || undefined,
      taxRate: Number(item.taxRate ?? extractTaxRateFromLabel(item.taxLabel)),
    }));

    return {
      customerId: customer.id,
      invoiceNumber: String(parsed.invoiceNumber || "").trim() || undefined,
      status: String(parsed.status || "").trim() || undefined,
      issueDate: String(activeDraft.issueDate || parsed.issueDate || today()),
      dueDate: String(activeDraft.dueDate || parsed.dueDate || today()),
      currency: String(state.settings.currency || "AZN").trim().toUpperCase(),
      notes: String(activeDraft.notes || parsed.notes || "").trim() || undefined,
      lines,
    };
  }

  async function submitInvoiceModule(activeDraft, editingId) {
    let payload;

    try {
      payload = buildInvoiceApiPayload(activeDraft);
    } catch (error) {
      setInvoicesError(error?.message || "Faktura payload qurulmadı.");
      return;
    }

    setInvoicesLoading(true);
    setInvoicesError("");

    try {
      if (editingId) {
        await apiUpdateInvoice(editingId, payload, updateBackendSession);
      } else {
        if (isAtFreePlanEntityLimit("invoices")) {
          setInvoicesError(freeLimitMsg.invoices);
          setInvoicesLoading(false);
          setAccountPanel("plans");
          return;
        }
        await apiCreateInvoice(payload, updateBackendSession);
        markOperationUsage();
      }

      await syncInvoicesFromBackend();
      cancelEdit("invoices");
    } catch (error) {
      setInvoicesError(error?.message || "Faktura yadda saxlanmadı.");
    } finally {
      setInvoicesLoading(false);
    }
  }

  async function deleteInvoiceRecord(recordId) {
    setInvoicesLoading(true);
    setInvoicesError("");

    try {
      await apiDeleteInvoice(recordId, updateBackendSession);
      await syncInvoicesFromBackend();
      if (editing.invoices === recordId) {
        cancelEdit("invoices");
      }
      if (invoiceLedgerRecordId === recordId) {
        setInvoiceLedgerRecordId(null);
      }
    } catch (error) {
      setInvoicesError(error?.message || "Faktura silinmədi.");
    } finally {
      setInvoicesLoading(false);
    }
  }

  async function submitInvoicePayment(invoiceId) {
    const amountMinor = Math.round(Number(invoicePaymentDraft.amountMinor) * 100);
    if (!amountMinor || amountMinor <= 0) {
      setInvoicePaymentsError("Məbləğ sıfırdan böyük olmalıdır.");
      return;
    }
    if (!invoicePaymentDraft.paymentDate) {
      setInvoicePaymentsError("Ödəniş tarixi daxil edin.");
      return;
    }
    setInvoicePaymentsLoading(true);
    setInvoicePaymentsError("");
    try {
      const result = await apiAddInvoicePayment(
        invoiceId,
        {
          amountMinor,
          paymentDate: invoicePaymentDraft.paymentDate,
          method: invoicePaymentDraft.method || undefined,
        },
        updateBackendSession,
      );
      setInvoicePayments(Array.isArray(result?.payments) ? result.payments : []);
      setInvoicePaymentDraft({ amountMinor: "", paymentDate: "", method: "" });
      await syncInvoicesFromBackend();
    } catch (error) {
      setInvoicePaymentsError(error?.message || "Ödəniş əlavə edilmədi.");
    } finally {
      setInvoicePaymentsLoading(false);
    }
  }

  async function deleteInvoicePaymentRecord(invoiceId, paymentId) {
    setInvoicePaymentsLoading(true);
    setInvoicePaymentsError("");
    try {
      const result = await apiDeleteInvoicePayment(invoiceId, paymentId, updateBackendSession);
      setInvoicePayments(Array.isArray(result?.payments) ? result.payments : []);
      await syncInvoicesFromBackend();
    } catch (error) {
      setInvoicePaymentsError(error?.message || "Ödəniş silinmədi.");
    } finally {
      setInvoicePaymentsLoading(false);
    }
  }

  async function downloadInvoicePdf(invoiceId, invoiceNumber) {
    setPdfLoading(true);
    setPdfError("");
    try {
      const blob = await apiDownloadInvoicePdf(invoiceId, updateBackendSession);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = invoiceNumber ? `invoice-${invoiceNumber}.pdf` : `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setPdfError(error?.message || "PDF yüklənmədi.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function sendInvoiceByEmail(invoiceId) {
    setSendEmailLoading(true);
    setSendEmailMessage("");
    try {
      await apiSendInvoiceEmail(invoiceId, updateBackendSession);
      setSendEmailMessage("Invoice göndərildi");
    } catch (error) {
      setSendEmailMessage(error?.message || "Göndərmə uğursuz oldu.");
    } finally {
      setSendEmailLoading(false);
    }
  }

  async function loadTeamMembers() {
    setTeamLoading(true);
    setTeamError("");
    try {
      const data = await apiListTeam(updateBackendSession);
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setTeamError(err?.message || "Komanda üzvləri yüklənmədi.");
    } finally {
      setTeamLoading(false);
    }
  }

  async function submitNewTeamMember(e) {
    e.preventDefault();
    setTeamLoading(true);
    setTeamActionMsg("");
    setTeamError("");
    try {
      const created = await apiCreateTeamMember(teamDraft, updateBackendSession);
      setTeamMembers((prev) => [...prev, created]);
      setTeamDraft({ email: "", fullName: "", role: "ACCOUNTANT", password: "" });
      setTeamFormVisible(false);
      setTeamActionMsg("Üzv əlavə edildi.");
    } catch (err) {
      setTeamError(err?.message || "Üzv əlavə edilmədi.");
    } finally {
      setTeamLoading(false);
    }
  }

  async function updateTeamMemberRole(memberId, role) {
    setTeamActionMsg("");
    setTeamError("");
    try {
      const updated = await apiUpdateTeamMember(memberId, { role }, updateBackendSession);
      setTeamMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      setTeamActionMsg("Rol yeniləndi.");
    } catch (err) {
      setTeamError(err?.message || "Rol yenilənmədi.");
    }
  }

  async function deactivateTeamMember(memberId) {
    setTeamActionMsg("");
    setTeamError("");
    try {
      const updated = await apiDeactivateTeamMember(memberId, updateBackendSession);
      setTeamMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      setTeamActionMsg("Üzv deaktiv edildi.");
    } catch (err) {
      setTeamError(err?.message || "Deaktiv edilmədi.");
    }
  }

  function getModuleSubview(moduleId) {
    switch (moduleId) {
      case "incomingGoodsServices": return billView;
      case "manualJournals": return journalView;
      case "chartOfAccounts": return chartView;
      case "vendors": return vendorView;
      case "goods": return goodsView;
      case "invoices": return invoiceView;
      case "customers": return customerView;
      default: return null;
    }
  }

  function applyModuleSubview(moduleId, subview = "overview") {
    switch (moduleId) {
      case "incomingGoodsServices":
        setBillView(["overview", "journal", "form"].includes(subview) ? subview : "overview");
        break;
      case "manualJournals":
        setJournalView(["overview", "journal", "form"].includes(subview) ? subview : "overview");
        break;
      case "chartOfAccounts":
        setChartView(["overview", "journal", "form"].includes(subview) ? subview : "overview");
        break;
      case "vendors":
        setVendorView(["overview", "journal", "form"].includes(subview) ? subview : "overview");
        break;
      case "goods":
        setGoodsView(["overview", "journal", "form"].includes(subview) ? subview : "overview");
        break;
      case "invoices":
        setInvoiceView(["overview", "journal", "form"].includes(subview) ? subview : "overview");
        break;
      case "customers":
        setCustomerView(["overview", "journal", "form"].includes(subview) ? subview : "overview");
        break;
      default:
        break;
    }
  }

  function buildHashFromState() {
    const _lp = window.location.pathname.replace(/\/+$/, "") || "/";
    if (_lp === "/internal" || _lp.endsWith("/internal")) return "/internal";
    if (activeProduct === "funnel") return `/${funnelPage}`;
    if (activeProduct === "hub") return "/homepage";
    if (activeProduct === "booksLanding") return booksView && booksView !== "home" ? `/accounting/${booksView}` : "/accounting";
    if (activeSection === "home") return "/dashboard";
    if (activeSection === "settings") return settingsTab ? `/settings/${settingsTab}` : "/settings";
    if (activeSection === "banking") return bankView && bankView !== "overview" ? `/banking/${bankView}` : "/banking";
    if (activeSection === "documents") return documentView && documentView !== "overview" ? `/documents/${documentView}` : "/documents";
    if (activeModule) {
      const subview = getModuleSubview(activeModule);
      return subview && subview !== "overview" ? `/${activeSection}/${activeModule}/${subview}` : `/${activeSection}/${activeModule}`;
    }
    return `/${activeSection}`;
  }

  function applyHashRoute(routeValue) {
    const path = String(routeValue || "").replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "");
    const [part1, part2, part3] = path.split("/");
    const landingRoute = getBooksLandingRouteDetails(routeValue);

    if (!part1) {
      setActiveProduct("hub");
      return;
    }

    if (part1 === "hub" || part1 === "homepage") {
      setActiveProduct("hub");
      return;
    }

    if (part1 === "landing") {
      setActiveProduct("booksLanding");
      setBooksView(landingRoute.initialBooksView);
      setBooksNotice("");
      return;
    }

    if (part1 === "accounting") {
      setActiveProduct("booksLanding");
      setBooksView(landingRoute.initialBooksView);
      setBooksNotice("");
      return;
    }

    if (FUNNEL_PAGES.includes(part1)) {
      setActiveProduct("funnel");
      setFunnelPage(part1);
      return;
    }

    if (part1 === "internal") {
      return;
    }

    setActiveProduct("books");
    if (part1 === "home" || part1 === "dashboard") {
      setSection("home");
      return;
    }

    const allowedNav = getAccessibleNavItems(currentUser);
    const validSection = allowedNav.some((item) => item.id === part1);
    if (!validSection) {
      setSection("home");
      return;
    }

    setSection(part1);

    if (part1 === "settings") {
      setSettingsTab(["profile", "language", "params", "system", "team"].includes(part2) ? part2 : null);
      return;
    }

    if (part1 === "banking") {
      setBankView(["overview", "banks", "journal", "form", "tx-form"].includes(part2) ? part2 : "overview");
      return;
    }

    if (part1 === "documents") {
      setDocumentView(["overview", "journal", "form"].includes(part2) ? part2 : "overview");
      return;
    }

    if (part2 && MODULES[part2]) {
      setActiveModule(part2);
      applyModuleSubview(part2, part3 || "overview");
    }
  }

  useEffect(() => {
    try {
      const keysToRemove = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key) continue;
        if (LEGACY_STORAGE_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}-`))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore storage cleanup failures
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        if (session?.accessToken) {
          updateBackendSession(session);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HUB_LANG_KEY, hubLang || "en");
    } catch { /* ignore */ }
  }, [hubLang]);

  useEffect(() => {
    if (!backendSession?.accessToken || !currentUser) {
      setSupportThreads([]);
      return;
    }
    void syncSupportThreadsFromBackend(backendSession, currentUser);
  }, [backendSession?.accessToken, currentUser?.id, currentUser?.role, currentUser?.accountId]);

  useEffect(() => {
    if (!backendSession?.accessToken || !currentUser) {
      return undefined;
    }

    const intervalMs = currentUser.role === "super_admin"
      ? 5000
      : supportWidgetOpen
        ? 3000
        : 10000;

    const intervalId = window.setInterval(() => {
      void syncSupportThreadsFromBackend(backendSession, currentUser);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [backendSession?.accessToken, currentUser?.id, currentUser?.role, supportWidgetOpen]);

  useEffect(() => {
    if (!supportWidgetOpen || currentUser?.role === "super_admin" || !supportUserScrollRef.current) return;
    supportUserScrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    supportWidgetOpen,
    currentUser?.role,
    supportActiveThreadId,
    activeUserSupportThread?.messages?.length,
    activeUserSupportThread?.updatedAt,
  ]);

  useEffect(() => {
    if (currentUser?.role !== "super_admin" || !supportAdminScrollRef.current) return;
    supportAdminScrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    currentUser?.role,
    supportAdminActiveThreadId,
    activeAdminSupportThread?.messages?.length,
    activeAdminSupportThread?.updatedAt,
  ]);

  useEffect(() => {
    const role = currentUser?.role || "";
    const accountKey = currentUser?.accountId || "";
    const isAdmin = role === "super_admin";
    const relevantThreads = isAdmin ? supportThreads : userSupportThreads;
    const snapshot = supportNotificationSnapshotRef.current;
    const nextLatestByThread = new Map();

    if (snapshot.role !== role || snapshot.accountKey !== accountKey) {
      relevantThreads.forEach((thread) => {
        const messages = Array.isArray(thread?.messages) ? thread.messages : [];
        const lastMessage = messages[messages.length - 1] || null;
        nextLatestByThread.set(thread.id, lastMessage?.id || "");
      });
      supportNotificationSnapshotRef.current = { role, accountKey, latestByThread: nextLatestByThread };
      return;
    }

    let shouldPlaySound = false;
    relevantThreads.forEach((thread) => {
      const messages = Array.isArray(thread?.messages) ? thread.messages : [];
      const lastMessage = messages[messages.length - 1] || null;
      const lastMessageId = lastMessage?.id || "";
      nextLatestByThread.set(thread.id, lastMessageId);

      const previousLastMessageId = snapshot.latestByThread.get(thread.id) || "";
      if (!lastMessageId || lastMessageId === previousLastMessageId) return;

      const incomingAuthorType = isAdmin ? "user" : "admin";
      if (String(lastMessage.authorType || "").toLowerCase() === incomingAuthorType) {
        shouldPlaySound = true;
      }
    });

    supportNotificationSnapshotRef.current = { role, accountKey, latestByThread: nextLatestByThread };
    if (shouldPlaySound) {
      playSupportNotificationSound();
    }
  }, [supportThreads, currentUser?.role, currentUser?.accountId, userSupportThreads]);

  useEffect(() => {
    setApiSession(backendSession);
  }, [backendSession]);

  useEffect(() => {
    if (publicBackendWarmupStartedRef.current || backendSession?.accessToken) {
      return;
    }

    publicBackendWarmupStartedRef.current = true;

    apiGetPlans()
      .then((plans) => {
        if (Array.isArray(plans) && plans.length > 0) {
          setBackendPlans(plans);
        }
      })
      .catch(() => {
        // Warmup failure should never block the UI.
      });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    if (!backendSession?.accessToken) {
      return;
    }

    syncBackendSubscription(backendSession).catch((error) => {
      setBooksNotice(error?.message || "Backend ilə sinxronizasiya zamanı xəta baş verdi.");
    });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    if (!pendingPaymentReturn) {
      return;
    }

    if (!pendingPaymentReturn.uiHandled) {
      const status = String(pendingPaymentReturn.status || "").toLowerCase();
      const fallbackMessage = status === "success"
        ? "Ödəniş uğurla tamamlandı. Abunəliyiniz yenilənir."
        : "Ödəniş tamamlanmadı və ya bank tərəfindən təsdiqlənmədi.";

      setActiveProduct("hub");
      setAccountPanel("plans");
      setBooksNotice(pendingPaymentReturn.message || fallbackMessage);

      const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
      window.history.replaceState({}, document.title, cleanUrl);

      setPendingPaymentReturn((current) => current ? { ...current, uiHandled: true } : null);
      return;
    }

    if (!backendSession?.accessToken) {
      return;
    }

    syncBackendSubscription(backendSession).catch((error) => {
      setBooksNotice(error?.message || "Abunəlik məlumatı yenilənmədi.");
    });

    apiGetMyOrders(updateBackendSession)
      .then((orders) => {
        setBackendOrders(Array.isArray(orders) ? orders : []);
      })
      .catch(() => {
        // Non-blocking refresh after payment return.
      })
      .finally(() => {
        setPendingPaymentReturn(null);
      });
  }, [pendingPaymentReturn, backendSession?.accessToken]);

  useEffect(() => {
    syncCustomersFromBackend(backendSession).catch(() => {
      // syncCustomersFromBackend already updates the visible error state
    });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    syncVendorsFromBackend(backendSession).catch(() => {
      // syncVendorsFromBackend already updates the visible error state
    });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    syncAccountsFromBackend(backendSession).catch(() => {
      // syncAccountsFromBackend already updates the visible error state
    });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    syncJournalsFromBackend(backendSession).catch(() => {
      // syncJournalsFromBackend already updates the visible error state
    });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    syncCompanySettingsFromBackend(backendSession).catch(() => {
      // syncCompanySettingsFromBackend already updates the visible error state
    });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    syncInvoicesFromBackend(backendSession).catch(() => {
      // syncInvoicesFromBackend already updates the visible error state
    });
  }, [backendSession?.accessToken]);

  useEffect(() => {
    if (!currentUser?.email) return;
    const nextCurrentUser = authUsers.find((user) => user.email === currentUser.email);
    if (nextCurrentUser && JSON.stringify(nextCurrentUser) !== JSON.stringify(currentUser)) {
      setCurrentUser(nextCurrentUser);
    }
  }, [authUsers, currentUser]);

  function renderSettings() {
    const activeLangObj = APP_LANGS.find((l) => l.code === hubLang) || APP_LANGS[0];
    const internalUsersCount = authUsers.filter((user) => isInternalUser(user)).length;
    const companySnapshot = [
      { label: "Şirkət", value: state.settings.companyName || "Qeyd olunmayıb" },
      { label: "Forma", value: state.settings.entityType || "Qeyd olunmayıb" },
      { label: "VÖEN", value: state.settings.taxId || "Qeyd olunmayıb" },
      { label: "Valyuta", value: state.settings.currency || "Qeyd olunmayıb" },
    ];
    const operationSnapshot = [
      { label: "Faktura prefiksi", value: state.settings.invoicePrefix || "—" },
      { label: "Kotirovka prefiksi", value: state.settings.quotePrefix || "—" },
      { label: "Ödəniş müddəti", value: state.settings.defaultPaymentTerm || "—" },
      { label: "Vergi etiketi", value: state.settings.defaultTaxLabel || "—" },
    ];
    const safetySnapshot = [
      { label: "Avtomatik backup", value: state.settings.autoBackup || "—" },
      { label: "Aşağı stok xəbərdarlığı", value: state.settings.stockWarning || "—" },
      { label: "Mənfi stok", value: state.settings.negativeStock || "—" },
      { label: "İşçi sahəsi", value: state.settings.uiScale || "Avtomatik" },
    ];

    if (!settingsTab) {
      return (
        <section className="view active">
          <div className="settings-dashboard">
            <div className="settings-hero panel">
              <div className="panel-head">
                <div>
                  <h3>{at.nav.settings}</h3>
                  <p className="panel-copy">Şirkət profili, iş qaydaları, komanda, dil və sistem əməliyyatlarını bir yerdə idarə edin.</p>
                </div>
                <span>{activeLangObj.label}</span>
              </div>
              <div className="settings-overview-grid">
                <article className="settings-overview-card">
                  <span>Şirkət</span>
                  <strong>{state.settings.companyName || "Qeyd olunmayıb"}</strong>
                  <small>{state.settings.entityType || "Hüquqi status yoxdur"}</small>
                </article>
                <article className="settings-overview-card">
                  <span>Komanda</span>
                  <strong>{internalUsersCount}</strong>
                  <small>Aktiv daxili istifadəçi</small>
                </article>
                <article className="settings-overview-card">
                  <span>Dil</span>
                  <strong>{activeLangObj.label}</strong>
                  <small>İnterfeys dili</small>
                </article>
                <article className="settings-overview-card">
                  <span>Backup</span>
                  <strong>{state.settings.autoBackup || "—"}</strong>
                  <small>{backupStatus.message ? "Son sistem xəbərdarlığı var" : "Status gözləmədədir"}</small>
                </article>
              </div>
            </div>

            <div className="settings-section-grid">
              <div className="settings-snapshot panel">
                <div className="panel-head">
                  <div><h3>Şirkət xülasəsi</h3><p className="panel-copy">Əsas identifikasiya və maliyyə məlumatları.</p></div>
                  <span>🏢</span>
                </div>
                <div className="settings-mini-grid">
                  {companySnapshot.map((item) => (
                    <article key={item.label} className="settings-mini-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </article>
                  ))}
                </div>
              </div>

              <div className="settings-snapshot panel">
                <div className="panel-head">
                  <div><h3>Qaydalar</h3><p className="panel-copy">Sənədləşmə və əməliyyat parametrləri.</p></div>
                  <span>⚙️</span>
                </div>
                <div className="settings-mini-grid">
                  {operationSnapshot.map((item) => (
                    <article key={item.label} className="settings-mini-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </article>
                  ))}
                </div>
              </div>

              <div className="settings-snapshot panel">
                <div className="panel-head">
                  <div><h3>Təhlükəsizlik və ehtiyat</h3><p className="panel-copy">Məlumat qorunması və interfeys davranışı.</p></div>
                  <span>🛡️</span>
                </div>
                <div className="settings-mini-grid">
                  {safetySnapshot.map((item) => (
                    <article key={item.label} className="settings-mini-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="bill-hub settings-quick-links" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", maxWidth: "100%" }}>
              <div className="bill-hub-card" onClick={() => setSettingsTab("profile")}>
                <div className="bill-hub-icon">🏢</div>
                <div className="bill-hub-info">
                  <h3>{at.settings_companyInfo}</h3>
                  <p>{at.settings_profileDesc}</p>
                  <span className="bill-hub-count">{at.settings_profileBadge}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => setSettingsTab("language")}>
                <div className="bill-hub-icon">{activeLangObj.flag}</div>
                <div className="bill-hub-info">
                  <h3>{at.settings_language}</h3>
                  <p>{at.settings_languageDesc}</p>
                  <span className="bill-hub-count">{activeLangObj.label}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => setSettingsTab("params")}>
                <div className="bill-hub-icon">⚙️</div>
                <div className="bill-hub-info">
                  <h3>{at.settings_params}</h3>
                  <p>{at.settings_paramsDesc}</p>
                  <span className="bill-hub-count">{at.settings_paramsBtn}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => setAccountPanel("changePassword")}>
                <div className="bill-hub-icon">🔒</div>
                <div className="bill-hub-info">
                  <h3>Parol və təhlükəsizlik</h3>
                  <p>Giriş parolunu dəyişin və hesab təhlükəsizliyini yeniləyin.</p>
                  <span className="bill-hub-count">Aç</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => { setSettingsTab("team"); loadTeamMembers(); }}>
                <div className="bill-hub-icon">👥</div>
                <div className="bill-hub-info">
                  <h3>Komanda</h3>
                  <p>Hesab üzvlərini idarə edin.</p>
                  <span className="bill-hub-count">{teamMembers.length || "—"} üzv</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => setSettingsTab("system")}>
                <div className="bill-hub-icon">🛡️</div>
                <div className="bill-hub-info">
                  <h3>{at.settings_systemTitle}</h3>
                  <p>Reset, restore or back up application data.</p>
                  <span className="bill-hub-count">3 actions</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
            </div>
          </div>
        </section>
      );
    }

    const backBtn = (
      <button className="ghost-btn" type="button" style={{ marginBottom: 16 }} onClick={() => setSettingsTab(null)}>
        ← {at.nav.settings}
      </button>
    );

    if (settingsTab === "profile") {
      return (
        <section className="view active">
          {backBtn}
          <div className="panel">
            <div className="panel-head"><div><h3>{at.nav.settings}</h3><p className="panel-copy">{at.settings_profileDesc}</p></div><span>{at.settings_profileBadge}</span></div>
            <form key={`company-settings-${state.settings.entityType || ""}-${state.settings.companyName || ""}-${state.settings.taxId || ""}-${state.settings.mobilePhone || ""}-${state.settings.currency || ""}-${state.settings.fiscalYear || ""}-${state.settings.uiScale || ""}`} className="form-grid" onSubmit={saveSettingsToBackend}>
              {companySettingsError ? <p className="panel-copy">{companySettingsError}</p> : null}
              {companySettingsLoading ? <p className="panel-copy">Şirkət məlumatları backend ilə sinxronlaşdırılır...</p> : null}
              <label><span>{at.settings_entityType}</span><select name="entityType" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.entityType || "Hüquqi şəxs"}><option value="Fiziki şəxs">{at.settings_entityIndiv}</option><option value="Hüquqi şəxs">{at.settings_entityCompany}</option></select></label>
              <label><span>{at.settings_companyOwnerName}</span><input name="companyName" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.companyName} required /></label>
              <label><span>{at.settings_taxId}</span><input name="taxId" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.taxId} placeholder="0000000000" /></label>
              <label><span>{at.settings_mobile}</span><input name="mobilePhone" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.mobilePhone || ""} placeholder="+994..." /></label>
              <label><span>{at.settings_currency}</span><input name="currency" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.currency} required /></label>
              <label><span>{at.settings_fiscalYear}</span><input name="fiscalYear" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.fiscalYear} /></label>
              <label><span>{at.settings_uiScale}</span><select name="uiScale" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.uiScale || "Avtomatik"}><option value="Avtomatik">{at.settings_uiAuto}</option><option value="Kiçik">{at.settings_uiSmall}</option><option value="Standart">{at.settings_uiStandard}</option><option value="Böyük">{at.settings_uiLarge}</option></select></label>
              {profileSaved ? (
                <div className="settings-saved-row">
                  <span className="settings-saved-badge">✓ Yadda saxlanıldı</span>
                  <button type="button" className="ghost-btn settings-edit-btn" onClick={() => setProfileSaved(false)} disabled={companySettingsLoading}>Dəyişiklik et</button>
                </div>
              ) : (
                <button className="primary-btn" type="submit" disabled={companySettingsLoading}>{at.save}</button>
              )}
            </form>
          </div>
        </section>
      );
    }

    if (settingsTab === "language") {
      return (
        <section className="view active">
          {backBtn}
          <div className="panel">
            <div className="panel-head"><div><h3>{at.settings_language}</h3><p className="panel-copy">{at.settings_languageDesc}</p></div><span>🌐</span></div>
            <div className="lang-grid">
              {APP_LANGS.map((l) => (
                <button key={l.code} type="button" className={`lang-card${l.code === hubLang ? " active" : ""}`} onClick={() => setHubLang(l.code)}>
                  <span className="lang-flag">{l.flag}</span>
                  <span className="lang-name">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (settingsTab === "team") {
      return (
        <section className="view active">
          {backBtn}
          <div className="panel">
            <div className="panel-head">
              <div><h3>Komanda</h3><p className="panel-copy">Hesab üzvlərini idarə edin.</p></div>
              <button className="primary-btn" type="button" onClick={() => { setTeamFormVisible((v) => !v); setTeamError(""); setTeamActionMsg(""); }}>
                {teamFormVisible ? "Ləğv et" : "+ Üzv əlavə et"}
              </button>
            </div>
            {teamFormVisible && (
              <form onSubmit={createTeamMember} className="form-grid" style={{ marginBottom: 24 }}>
                <label><span>E-poçt</span><input type="email" value={teamMemberDraft.email} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, email: event.target.value }))} required /></label>
                <label><span>Ad Soyad</span><input type="text" value={teamMemberDraft.fullName} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, fullName: event.target.value }))} /></label>
                <label><span>Rol</span><select value={teamMemberDraft.staffRole} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, staffRole: event.target.value }))}><option value="OWNER">Sahib</option><option value="ADMIN">Admin</option><option value="ACCOUNTANT">Mühasib</option><option value="VIEWER">İzləyici</option></select></label>
                <label><span>Şifrə</span><input type="password" value={teamMemberDraft.password} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, password: event.target.value }))} required minLength={8} /></label>
                <button className="primary-btn" type="submit" disabled={teamLoading}>{teamLoading ? "Əlavə edilir..." : "Əlavə et"}</button>
              </form>
            )}
            {teamError ? <p style={{ color: "var(--danger)", marginBottom: 12, fontSize: 13 }}>{teamError}</p> : null}
            {teamActionMsg ? <p style={{ color: "var(--success, #16a34a)", marginBottom: 12, fontSize: 13 }}>{teamActionMsg}</p> : null}
            {teamLoading && !teamFormVisible ? (
              <p className="panel-copy">Yüklənir...</p>
            ) : (
              <table className="bill-item-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>E-poçt</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Ad</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Rol</th>
                    <th style={{ textAlign: "left", padding: "8px 4px" }}>Status</th>
                    <th style={{ textAlign: "right", padding: "8px 4px" }}>Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "16px 4px", color: "var(--text-muted)", textAlign: "center" }}>Üzv tapılmadı</td></tr>
                  ) : teamMembers.map((m) => (
                    <tr key={m.id}>
                      <td style={{ padding: "8px 4px", fontSize: 13 }}>{m.email}</td>
                      <td style={{ padding: "8px 4px", fontSize: 13 }}>{m.fullName || "—"}</td>
                      <td style={{ padding: "8px 4px" }}>
                        <select value={m.role} style={{ fontSize: 12, padding: "2px 4px" }} onChange={(event) => updateTeamMemberRole(m.id, event.target.value)}>
                          <option value="OWNER">Sahib</option>
                          <option value="ADMIN">Admin</option>
                          <option value="ACCOUNTANT">Mühasib</option>
                          <option value="VIEWER">İzləyici</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 4px", fontSize: 12, color: m.isActive ? "var(--success, #16a34a)" : "var(--danger)" }}>
                        {m.isActive ? "Aktiv" : "Deaktiv"}
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        {m.isActive ? (
                          <button className="ghost-btn" type="button" style={{ fontSize: 12 }} onClick={() => deactivateTeamMember(m.id)}>
                            Deaktiv et
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      );
    }

    if (settingsTab === "system") {
      return renderSettings_System();
    }

    return (
      <section className="view active">
        {backBtn}
        <div className="panel">
          <div className="panel-head"><div><h3>{at.settings_params}</h3><p className="panel-copy">{at.settings_paramsDesc}</p></div><span>{at.settings_paramsBtn}</span></div>
          <form className="ops-preferences-form" onSubmit={saveSettings}>
            <section className="ops-section">
              <h4>{at.ops_discountTitle}</h4>
              <div className="ops-choice-list">
                <label className="ops-radio-row"><input type="radio" name="discountMode" value="Endirim verilmir" defaultChecked={state.settings.discountMode === "Endirim verilmir"} /><span>{at.ops_discountNone}</span></label>
                <label className="ops-radio-row"><input type="radio" name="discountMode" value="Sətir səviyyəsində" defaultChecked={state.settings.discountMode === "Sətir səviyyəsində"} /><span>{at.ops_discountLine}</span></label>
                <label className="ops-radio-row"><input type="radio" name="discountMode" value="Sənəd səviyyəsində" defaultChecked={state.settings.discountMode === "Sənəd səviyyəsində"} /><span>{at.ops_discountDoc}</span></label>
              </div>
              <div className="ops-inline-field">
                <select name="discountTiming" defaultValue={state.settings.discountTiming}>
                  <option value="Vergidən əvvəl endirim">{at.ops_discountBefore}</option>
                  <option value="Vergidən sonra endirim">{at.ops_discountAfter}</option>
                </select>
              </div>
            </section>
            <section className="ops-section">
              <h4>{at.ops_chargesTitle}</h4>
              <div className="ops-choice-list">
                <label className="ops-check-row"><input type="checkbox" name="additionalAdjustment" defaultChecked={state.settings.additionalAdjustment === "Bəli"} /><span>{at.ops_adjustments}</span></label>
                <label className="ops-check-row"><input type="checkbox" name="shippingCharge" defaultChecked={state.settings.shippingCharge === "Bəli"} /><span>{at.ops_shipping}</span></label>
              </div>
              <div className="ops-note-block">
                <label className="ops-check-row"><input type="checkbox" name="shippingTaxAutomation" defaultChecked={state.settings.shippingTaxAutomation === "Bəli"} /><span>{at.ops_shippingTax}</span></label>
                <p>{at.ops_shippingTaxNote}</p>
              </div>
            </section>
            <section className="ops-section">
              <h4>{at.ops_taxTitle}</h4>
              <div className="ops-choice-list">
                <label className="ops-radio-row"><input type="radio" name="taxMode" value="Vergi daxil" defaultChecked={state.settings.taxMode === "Vergi daxil"} /><span>{at.ops_taxInclusive}</span></label>
                <label className="ops-radio-row"><input type="radio" name="taxMode" value="Vergi xaric" defaultChecked={state.settings.taxMode === "Vergi xaric"} /><span>{at.ops_taxExclusive}</span></label>
              </div>
              <div className="ops-inline-stack">
                <label><span>{at.ops_taxRounding}</span><select name="roundOffTaxMode" defaultValue={state.settings.roundOffTaxMode}><option value="Sənəd səviyyəsində">{at.ops_roundDoc}</option><option value="Sətir səviyyəsində">{at.ops_roundLine}</option></select></label>
              </div>
            </section>
            <section className="ops-section">
              <h4>{at.ops_salesRoundTitle}</h4>
              <div className="ops-choice-list">
                <label className="ops-radio-row"><input type="radio" name="salesRoundingMode" value="Yuvarlaqlaşdırma yoxdur" defaultChecked={state.settings.salesRoundingMode === "Yuvarlaqlaşdırma yoxdur"} /><span>{at.ops_roundNone}</span></label>
                <label className="ops-radio-row"><input type="radio" name="salesRoundingMode" value="Məbləği ən yaxın tam ədədə yuvarlaqlaşdır" defaultChecked={state.settings.salesRoundingMode === "Məbləği ən yaxın tam ədədə yuvarlaqlaşdır"} /><span>{at.ops_roundNearest}</span></label>
                <label className="ops-radio-row"><input type="radio" name="salesRoundingMode" value="Məbləği ən yaxın artım dəyərinə yuvarlaqlaşdır" defaultChecked={state.settings.salesRoundingMode === "Məbləği ən yaxın artım dəyərinə yuvarlaqlaşdır"} /><span>{at.ops_roundIncrement}</span></label>
              </div>
            </section>
            <section className="ops-section">
              <h4>{at.ops_salespersonTitle}</h4>
              <div className="ops-choice-list">
                <label className="ops-check-row"><input type="checkbox" name="salespersonField" defaultChecked={state.settings.salespersonField === "Bəli"} /><span>{at.ops_salesperson}</span></label>
              </div>
            </section>
            <section className="ops-section">
              <h4>{at.ops_prefixTitle}</h4>
              <label><span>{at.ops_invoicePrefix}</span><input name="invoicePrefix" defaultValue={state.settings.invoicePrefix} required /></label>
              <label><span>{at.ops_quotePrefix}</span><input name="quotePrefix" defaultValue={state.settings.quotePrefix} required /></label>
              <label><span>{at.ops_numbering}</span><select name="numberingMode" defaultValue={state.settings.numberingMode}><option value="Avtomatik">{at.ops_numAuto}</option><option value="Əl ilə">{at.ops_numManual}</option></select></label>
              <label><span>{at.ops_paymentTerm}</span><select name="defaultPaymentTerm" defaultValue={state.settings.defaultPaymentTerm}><option value="7 gün">{at.ops_7days}</option><option value="15 gün">{at.ops_15days}</option><option value="30 gün">{at.ops_30days}</option><option value="45 gün">{at.ops_45days}</option></select></label>
              <label><span>{at.ops_defaultTax}</span><input name="defaultTaxLabel" defaultValue={state.settings.defaultTaxLabel} /></label>
              <label><span>{at.ops_autoBackup}</span><select name="autoBackup" defaultValue={state.settings.autoBackup}><option value="Bəli">{at.yes}</option><option value="Xeyr">{at.no}</option></select></label>
              <label><span>{at.ops_stockWarning}</span><select name="stockWarning" defaultValue={state.settings.stockWarning}><option value="Bəli">{at.yes}</option><option value="Xeyr">{at.no}</option></select></label>
              <label><span>{at.ops_negativeStock}</span><select name="negativeStock" defaultValue={state.settings.negativeStock}><option value="Xeyr">{at.no}</option><option value="Bəli">{at.yes}</option></select></label>
            </section>
            <div className="ops-footer">
              <button className="primary-btn" type="submit" onClick={saveSettings}>{at.settings_save}</button>
              <span>{at.ops_saveHint}</span>
            </div>
          </form>
        </div>
      </section>
    );
  }

  function renderSettings_System() {
    const backBtn = (
      <button className="ghost-btn" type="button" style={{ marginBottom: 16 }} onClick={() => setSettingsTab(null)}>
        ← {at.nav.settings}
      </button>
    );
    const backupToneLocal = backupStatus.tone || "info";
    return (
      <section className="view active">
        {backBtn}
        <div className="panel">
          <div className="panel-head">
            <div><h3>{at.settings_systemTitle}</h3><p className="panel-copy">Reset, restore or back up application data.</p></div>
            <span>🛡️</span>
          </div>
          <div className="system-actions-grid">
            <div className="system-action-card">
              <div className="system-action-icon">🔄</div>
              <div className="system-action-body">
                <strong>{at.btnReset}</strong>
                <p>Reset all application data to the default demo state.</p>
              </div>
              <button className="ghost-btn" onClick={resetDemoData}>{at.btnReset}</button>
            </div>
            <div className="system-action-card">
              <div className="system-action-icon">📂</div>
              <div className="system-action-body">
                <strong>{at.btnRestore}</strong>
                <p>Restore data from a previously exported backup file.</p>
              </div>
              <button className="ghost-btn" onClick={triggerRestore}>{at.btnRestore}</button>
            </div>
            <div className="system-action-card">
              <div className="system-action-icon">💾</div>
              <div className="system-action-body">
                <strong>{at.btnBackup}</strong>
                <p>Export all application data as a backup JSON file.</p>
              </div>
              <button className="primary-btn" onClick={exportBackup}>{at.btnBackup}</button>
            </div>
          </div>
          {backupStatus.message && (
            <div className={`backup-notice ${backupToneLocal}`} style={{ marginTop: 16 }}>
              {backupStatus.message}
            </div>
          )}
        </div>
      </section>
    );
  }

    function renderSubscriptionPanel() {
    if (!currentUser || !accountPanel) return null;

    const currentPlan = getCurrentPlan(currentUser);
    const ownerEmail = getAccountOwnerEmail(currentUser);
    const ownerUser = ownerEmail === currentUser.email ? currentUser : authUsers.find((entry) => entry.email === ownerEmail);
    const remainingDays = daysUntil(ownerUser?.subscription?.endsAt);
    const currentBillingCycle = ownerUser?.subscription?.billingCycle === "demo"
      ? "demo"
      : ownerUser?.subscription?.planId === "demo"
        ? "demo"
        : ownerUser?.subscription?.billingCycle === "monthly"
        ? "monthly"
        : "annual";
    const paidUsers = authUsers.filter((user) => user.role !== "super_admin" && user.subscription?.planId !== "free");
    const freeUsers = authUsers.filter((user) => user.role !== "super_admin" && user.subscription?.planId === "free");
    const teamUsers = authUsers.filter((user) => getAccountOwnerEmail(user) === ownerEmail && isInternalUser(user));
    const hasFreeBasic = backendPlans.some((p) => String(p.code || "").toUpperCase() === "FREE_BASIC");
    const effectivePlans = [
      ...(!hasFreeBasic ? [{ code: "FREE_BASIC", name: "Free", priceMinor: 0, currency: "USD", isActive: true, sortOrder: 0 }] : []),
      ...backendPlans.filter((plan) => plan && plan.isActive !== false),
    ].sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
    const currentBackendPlanCode = backendSubscription?.plan?.code || "";
    const selectedPaymentPlan = effectivePlans.find((plan) => plan.code === paymentDraft.planCode) || null;
    const isSubscriptionSuperAdmin =
      currentUser?.role === "super_admin" || currentUser?.email === SUPER_ADMIN.email;

    return (
      <div className="modal-backdrop" onClick={() => setAccountPanel(null)}>
        <section className="modal-card subscription-modal" onClick={(event) => event.stopPropagation()}>
          <div className="item-editor-topbar">
            <div>
              <h3>{accountPanel === "admin" ? at.acct_adminTitle : accountPanel === "team" ? at.acct_teamTitle : accountPanel === "changePassword" ? at.acct_passTitle : at.acct_planTitle}</h3>
              <p className="panel-copy">{accountPanel === "admin" ? at.acct_adminDesc : accountPanel === "team" ? at.acct_teamDesc : accountPanel === "changePassword" ? at.acct_passDesc : at.acct_planDesc}</p>
            </div>
            <button className="icon-btn" type="button" onClick={() => setAccountPanel(null)}>×</button>
          </div>

          {booksNotice && (accountPanel === "plans" || accountPanel === "payment") ? (
            <div className="backup-notice info" style={{ marginBottom: 16 }}>
              {booksNotice}
            </div>
          ) : null}

          {accountPanel === "changePassword" ? (
            <div className="change-password-panel">
              <form className="form-grid" onSubmit={submitPasswordChange}>
                <label>
                  <span>{at.auth_currentPass}</span>
                  <input type="password" value={passwordDraft.current} onChange={(e) => setPasswordDraft((d) => ({ ...d, current: e.target.value, notice: "", tone: "" }))} placeholder="Hazırkı parolunuzu daxil edin" required autoComplete="current-password" />
                </label>
                <label>
                  <span>{at.auth_newPass}</span>
                  <input type="password" value={passwordDraft.next} onChange={(e) => setPasswordDraft((d) => ({ ...d, next: e.target.value, notice: "", tone: "" }))} placeholder="Ən azı 6 simvol" required autoComplete="new-password" />
                </label>
                <label>
                  <span>{at.auth_confirmPass}</span>
                  <input type="password" value={passwordDraft.confirm} onChange={(e) => setPasswordDraft((d) => ({ ...d, confirm: e.target.value, notice: "", tone: "" }))} placeholder="Yeni parolu yenidən yazın" required autoComplete="new-password" />
                </label>
                {passwordDraft.notice ? (
                  <div className={`change-password-notice ${passwordDraft.tone}`}>{passwordDraft.notice}</div>
                ) : null}
                <div className="form-actions">
                  <button className="primary-btn" type="submit">{at.auth_updateBtn}</button>
                  <button className="ghost-btn" type="button" onClick={() => setAccountPanel(null)}>{at.cancel}</button>
                </div>
              </form>
            </div>
          ) : accountPanel === "admin" ? (
            <div className="subscription-admin-grid">
              <div className="summary-grid compact">
                <article className="summary-card"><span>{at.team_totalUsers}</span><strong>{authUsers.filter((user) => user.role !== "super_admin").length}</strong></article>
                <article className="summary-card"><span>{at.team_paidPlans}</span><strong>{paidUsers.length}</strong></article>
                <article className="summary-card"><span>{at.sub_free}</span><strong>{freeUsers.length}</strong></article>
                <article className="summary-card"><span>{at.team_expiringSoon}</span><strong>{authUsers.filter((user) => user.role !== "super_admin" && user.subscription?.endsAt && daysUntil(user.subscription.endsAt) !== null && daysUntil(user.subscription.endsAt) <= 7).length}</strong></article>
              </div>
              <Table
                headers={[at.team_colUser, at.team_colPlan, at.team_colRemaining, at.team_colAction, at.team_colManage]}
                emptyMessage={at.team_emptyAdmin}
                rows={authUsers.filter((user) => user.role !== "super_admin").map((user) => {
                  const plan = getPlanById(user.subscription?.planId || "free");
                  const draft = adminPlanDrafts[user.email] || { planId: user.subscription?.planId || "free", billingCycle: user.subscription?.billingCycle === "monthly" ? "monthly" : "annual", durationDays: String(getPlanDurationDays(plan, user.subscription?.billingCycle === "monthly" ? "monthly" : "annual") || 30) };
                  const left = plan.id === "free" ? `${daysUntil(user.subscription?.endsAt) ?? 0} gün sınaq` : `${daysUntil(user.subscription?.endsAt) ?? 0} gün`;
                  return (
                    <tr key={user.email}>
                      <td><strong>{user.fullName}</strong><br />{user.email}</td>
                      <td>{plan.name}</td>
                      <td>{left}</td>
                      <td>{user.operationsUsed || 0}</td>
                      <td>
                        <div className="subscription-actions">
                          <select value={draft.planId} onChange={(event) => setAdminPlanDrafts((current) => ({ ...current, [user.email]: { ...draft, planId: event.target.value } }))}>
                            {getPublicPlans().map((planOption) => <option key={planOption.id} value={planOption.id}>{planOption.name}</option>)}
                          </select>
                          <select value={draft.billingCycle} onChange={(event) => setAdminPlanDrafts((current) => ({ ...current, [user.email]: { ...draft, billingCycle: event.target.value, durationDays: String(getPlanDurationDays(getPlanById(draft.planId), event.target.value) || 30) } }))}>
                            <option value="annual">{at.team_annual}</option>
                            <option value="monthly">{at.team_monthly}</option>
                          </select>
                          <input type="number" min="1" value={draft.durationDays} onChange={(event) => setAdminPlanDrafts((current) => ({ ...current, [user.email]: { ...draft, durationDays: event.target.value } }))} />
                          <button className="ghost-btn compact-btn" type="button" onClick={() => applySubscriptionToUser(user.email, draft.planId, draft.billingCycle, Number(draft.durationDays || 30))}>Tətbiq et</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              />
            </div>
          ) : accountPanel === "payment" ? (
            <div className="subscription-user-grid">
              <section className="panel subscription-current-card">
                <div className="panel-head">
                  <div>
                    <h3>{at.sub_paymentTitle}</h3>
                    <p className="panel-copy">{at.sub_paymentDesc}</p>
                  </div>
                  <span>{at.sub_paymentBadge}</span>
                </div>
                <div className="summary-grid compact">
                  <article className="summary-card"><span>{at.sub_selectedPlan}</span><strong>{selectedPaymentPlan?.name || "—"}</strong></article>
                  <article className="summary-card"><span>{at.sub_price}</span><strong>{(() => {
                    if (!selectedPaymentPlan || selectedPaymentPlan.interval === "NONE" || Number(selectedPaymentPlan.priceMinor || 0) <= 0) return at.sub_free;
                    const fePlan = SUBSCRIPTION_PLANS.find((p) => BACKEND_PLAN_CODE_BY_LEGACY_PLAN_ID[p.id] === selectedPaymentPlan.code);
                    const cur = fePlan?.currency || selectedPaymentPlan.currency || "USD";
                    if (paymentDraft.billingCycle === "annual") {
                      const annualTotal = (fePlan?.annualMonthlyPrice || 0) * 12;
                      return `${annualTotal.toFixed(2)} ${cur} / il`;
                    }
                    return `${(fePlan?.monthlyPrice || 0).toFixed(2)} ${cur} / ay`;
                  })()}</strong></article>
                  <article className="summary-card"><span>{at.sub_duration}</span><strong>{selectedPaymentPlan ? (selectedPaymentPlan.interval === "NONE" ? "Limitsiz" : (paymentDraft.billingCycle === "annual" ? `365 ${at.sub_days}` : `30 ${at.sub_days}`)) : "—"}</strong></article>
                </div>
                <div className="payment-consent-card">
                  <label className="payment-consent-check">
                    <input type="checkbox" checked={paymentTermsAccepted} onChange={(event) => setPaymentTermsAccepted(event.target.checked)} />
                    <span>Ödəniş şərtləri ilə tanış oldum və qəbul edirəm</span>
                  </label>
                  <button type="button" className="text-btn payment-consent-link" onClick={() => setLegalOverlay("payment-terms")}>Ödəniş şərtləri</button>
                  <p className="payment-consent-note">Davam etməzdən əvvəl ödəniş şərtlərini qəbul etməyiniz tələb olunur. Uğurlu ödənişdən sonra plan istifadəçi hesabında rəqəmsal olaraq aktivləşdirilir.</p>
                </div>
                <div className="form-actions split-actions">
                  <button className="ghost-btn" type="button" onClick={() => setAccountPanel("plans")}>{at.sub_backToPlans}</button>
                  <button className="primary-btn" type="button" onClick={submitTestPayment} disabled={!paymentTermsAccepted || subscriptionLoading}>{at.sub_completeTest}</button>
                </div>
              </section>
            </div>
          ) : accountPanel === "team" ? (
            <div className="subscription-user-grid">
              <div className="summary-grid compact">
                {Object.entries(STAFF_ROLE_CONFIG).map(([roleName, config]) => {
                  const count = teamUsers.filter((user) => user.staffRole === roleName).length;
                  return <article className="summary-card" key={roleName}><span>{roleName}</span><strong>{count}/{config.maxUsers}</strong></article>;
                })}
              </div>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h3>{at.team_createTitle}</h3>
                    <p className="panel-copy">{at.team_createDesc}</p>
                  </div>
                  <span>{ownerUser?.fullName}</span>
                </div>
                <form className="form-grid" onSubmit={createTeamMember}>
                  <label><span>{at.team_fullName}</span><input value={teamMemberDraft.fullName} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, fullName: event.target.value }))} required /></label>
                  <label><span>{fld("E-poçt")}</span><input type="email" value={teamMemberDraft.email} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, email: event.target.value }))} required /></label>
                  <label><span>{fld("Şifrə")}</span><input type="password" value={teamMemberDraft.password} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, password: event.target.value }))} required /></label>
                  <label><span>{at.team_colRole}</span><select value={teamMemberDraft.staffRole} onChange={(event) => setTeamMemberDraft((current) => ({ ...current, staffRole: event.target.value }))}>{Object.keys(STAFF_ROLE_CONFIG).map((roleName) => <option key={roleName} value={roleName}>{roleName}</option>)}</select></label>
                  <div className="ops-note-block">
                    <strong>{at.team_permsLabel}</strong>
                    <p>{getStaffRoleConfig(teamMemberDraft.staffRole).permissions.join(", ")}</p>
                  </div>
                  <div className="form-actions"><button className="primary-btn" type="submit">{at.team_createBtn}</button></div>
                </form>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h3>{at.team_existingTitle}</h3>
                    <p className="panel-copy">{at.team_existingDesc}</p>
                  </div>
                  <span>{teamUsers.length} {at.team_userUnit}</span>
                </div>
                <Table
                  headers={[at.team_colUser, at.team_colRole, at.team_colPerms, at.team_colAction]}
                  emptyMessage={at.team_emptyTeam}
                  rows={teamUsers.map((user) => (
                    <tr key={user.email}>
                      <td><strong>{user.fullName}</strong><br />{user.email}</td>
                      <td>{user.staffRole}</td>
                      <td>{getStaffRoleConfig(user.staffRole).permissions.join(", ")}</td>
                      <td><button className="table-btn danger-btn" type="button" onClick={() => removeTeamMember(user.email)}>{at.delete}</button></td>
                    </tr>
                  ))}
                />
              </section>
            </div>
          ) : (
            <div className="subscription-user-grid">
              {isSubscriptionSuperAdmin ? (
                <div className="backup-notice warning" style={{ marginBottom: 16 }}>
                  Bu hesab `super_admin` hesabıdır. Subscription checkout axını real müştəri hesabları üçündür; plan aktivləşdirməni test etmək üçün adi `OWNER/ADMIN` hesabı ilə daxil olun.
                </div>
              ) : null}
              <section className="panel subscription-current-card">
                <div className="panel-head">
                  <div>
                    <h3>{at.sub_currentPlan}</h3>
                    <p className="panel-copy">{at.sub_currentPlanDesc}</p>
                  </div>
                  <span>{currentPlan.name}</span>
                </div>
                <div className="summary-grid compact">
                  <article className="summary-card"><span>{at.sub_plan}</span><strong>{currentPlan.name}</strong></article>
                  <article className="summary-card"><span>{at.sub_priceModel}</span><strong>{String(currentPlan.id || "").toLowerCase() === "free_basic" ? "Pulsuz" : String(currentPlan.id || "").toLowerCase() === "free" ? at.sub_free : currentBillingCycle === "demo" ? at.sub_demoFree : currentBillingCycle === "monthly" ? at.team_monthly : at.team_annual}</strong></article>
                  <article className="summary-card"><span>{at.sub_price}</span><strong>{getPlanPriceLabel(currentPlan, currentBillingCycle)}</strong></article>
                  <article className="summary-card"><span>{at.sub_remaining}</span><strong>{currentPlan.id === "free_basic" ? "Müddətsiz" : currentPlan.id === "free" ? (backendSubscription?.trialDaysRemaining != null ? `${backendSubscription.trialDaysRemaining} ${at.sub_days}` : `${daysUntil(ownerUser?.subscription?.endsAt) ?? 0} ${at.sub_days}`) : `${daysUntil(ownerUser?.subscription?.endsAt) ?? remainingDays ?? 0} ${at.sub_days}`}</strong></article>
                  <article className="summary-card"><span>{at.sub_opLimit}</span><strong>{currentPlan.operationLimit != null ? Number(currentPlan.operationLimit).toLocaleString("en-US") : "Limitsiz"}</strong></article>
                  <article className="summary-card"><span>{at.sub_statusLabel}</span><strong>{currentUser.role === "super_admin" ? at.sub_fullAccess : at.statusActive}</strong></article>
                </div>
              </section>
              {canManageTeam(currentUser) ? <div className="subscription-cycle-switch">
                <button className="ghost-btn" type="button" onClick={() => setAccountPanel("team")}>{at.team_manageBtn}</button>
              </div> : null}
              <div className="subscription-cycle-switch">
                <button className={subscriptionBillingCycle === "annual" ? "primary-btn" : "ghost-btn"} type="button" onClick={() => setSubscriptionBillingCycle("annual")}>İllik</button>
                <button className={subscriptionBillingCycle === "monthly" ? "primary-btn" : "ghost-btn"} type="button" onClick={() => setSubscriptionBillingCycle("monthly")}>1 aylıq</button>
              </div>
              <div className="subscription-plan-grid">
                {effectivePlans.length === 0 ? (
                  <article className="subscription-plan-card active">
                    <span>{at.sub_plan}</span>
                    <strong>—</strong>
                    <p>Plan siyahısı backend `/plans` endpoint-indən yüklənmədi.</p>
                    <small>Ödəniş və upgrade üçün əvvəlcə backend planlarını sinxron edin.</small>
                  </article>
                ) : effectivePlans.map((plan) => {
                  const planIsFree = ["FREE", "FREE_BASIC"].includes(String(plan.code || "").toUpperCase()) || Number(plan.priceMinor || 0) <= 0;
                  const isCurrentBackendPlan = currentBackendPlanCode && String(currentBackendPlanCode) === String(plan.code);
                  const fePlan = SUBSCRIPTION_PLANS.find((p) => BACKEND_PLAN_CODE_BY_LEGACY_PLAN_ID[p.id] === plan.code);
                  const priceLabel = planIsFree
                    ? at.sub_free
                    : subscriptionBillingCycle === "annual"
                      ? `${((fePlan?.annualMonthlyPrice || 0) * 12).toFixed(2)} ${fePlan?.currency || "USD"} / il`
                      : `${(fePlan?.monthlyPrice || 0).toFixed(2)} ${fePlan?.currency || "USD"} / ay`;
                  const annualPrice = planIsFree ? 0 : (fePlan?.annualMonthlyPrice || 0) * 12;
                  const annualMonthlyPrice = planIsFree ? 0 : fePlan?.annualMonthlyPrice || 0;
                  const monthlyPrice = planIsFree ? 0 : fePlan?.monthlyPrice || 0;
                  const isFreeBasic = String(plan.code || "").toUpperCase() === "FREE_BASIC";
                  const priceDisplay = isFreeBasic ? "Pulsuz" : planIsFree ? at.sub_free : subscriptionBillingCycle === "annual" ? `${annualPrice.toFixed(2)} ${fePlan?.currency || "USD"} / il` : `${monthlyPrice.toFixed(2)} ${fePlan?.currency || "USD"} / ay`;
                  const durationDisplay = isFreeBasic ? "Limitsiz müddət" : planIsFree ? at.sub_freeOps : (subscriptionBillingCycle === "annual" ? `365 ${at.sub_days}` : `30 ${at.sub_days}`);
                  const resolvedOperationLimit = plan.operationLimit ?? fePlan?.operationLimit ?? null;
                  const operationLimitDisplay = resolvedOperationLimit != null ? Number(resolvedOperationLimit).toLocaleString("en-US") : "Limitsiz";
                  return (
                    <article className={`subscription-plan-card ${isCurrentBackendPlan ? "active" : ""}`} key={plan.code}>
                      <span>{plan.name || plan.code}</span>
                      <strong>{priceDisplay}</strong>
                      {subscriptionBillingCycle === "annual" && annualMonthlyPrice < monthlyPrice ? <small className="annual-discount-badge">{at.sub_monthlyEquivalent || "aylıq ekvivalent"}: ${annualMonthlyPrice.toFixed(2)} / ay</small> : null}
                      <p>{plan.code}</p>
                      <small>{durationDisplay}</small>
                      <small>{at.sub_opLimit}: {operationLimitDisplay}</small>
                      <button className={isCurrentBackendPlan ? "ghost-btn" : "primary-btn"} type="button" onClick={async () => {
                        if (isCurrentBackendPlan) return;
                        if (isFreeBasic) {
                          try {
                            await apiSwitchToFree(updateBackendSession);
                            await syncBackendSubscription();
                            setBooksNotice("Pulsuz plana keçdiniz.");
                          } catch {
                            setBooksNotice("Keçid zamanı xəta baş verdi.");
                          }
                          return;
                        }
                        if (planIsFree && !isFreeBasic) {
                          try {
                            await apiSwitchToDemo(updateBackendSession);
                            await syncBackendSubscription();
                            setBooksNotice("Demo plana keçdiniz. Qalıq sınaq müddətiniz bərpa edildi.");
                          } catch (err) {
                            const msg = err?.message || "";
                            setBooksNotice(msg.includes("bitib") ? "Demo müddətiniz tamamilə bitib. Ödənişli plana keçin." : "Keçid zamanı xəta baş verdi.");
                          }
                          return;
                        }
                        if (currentUser.role !== "super_admin") {
                          openPaymentPanel(plan.code, subscriptionBillingCycle);
                          return;
                        }
                        setBooksNotice("Super admin üçün backend ödəniş axını tətbiq edilmir.");
                      }}>{isCurrentBackendPlan ? at.sub_isPlan : at.sub_activate}</button>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
          {legalOverlay ? (() => {
            const legalPage = COMPLIANCE_LEGAL_PAGES.find((p) => p.id === legalOverlay);
            if (!legalPage) return null;
            const sections = getLegalPageSections(legalPage.id, hubLang);
            return (
              <div className="legal-overlay-backdrop" onClick={() => setLegalOverlay(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="legal-overlay-card" onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface-raised, #fff)", borderRadius: "0.75rem", maxWidth: 640, maxHeight: "80vh", overflow: "auto", padding: "1.5rem", margin: "1rem", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>{legalPage.title}</h3>
                    <button className="icon-btn" type="button" onClick={() => setLegalOverlay(null)} style={{ fontSize: "1.25rem", lineHeight: 1, border: "none", background: "none", cursor: "pointer" }}>×</button>
                  </div>
                  {legalPage.summary ? <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 0 }}>{legalPage.summary}</p> : null}
                  {sections.map((section, idx) => (
                    <div key={idx} style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>{section.heading}</h4>
                      {Array.isArray(section.paragraphs) && section.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text)" }}>{p}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : null}
          {renderSupportWidget()}
        </section>
      </div>
    );
  }

  function renderAccountsReceivableAging() {
    const cur = state.settings.currency;
    const fmtMinor = (minor) => currency((minor || 0) / 100, cur);
    const BUCKET_LABELS = {
      CURRENT: "Cari",
      DAYS_1_30: "1–30 gün",
      DAYS_31_60: "31–60 gün",
      DAYS_61_90: "61–90 gün",
      DAYS_90_PLUS: "90+ gün",
      NO_DUE_DATE: "Tarixsiz",
    };
    const BUCKET_KEYS = ["CURRENT", "DAYS_1_30", "DAYS_31_60", "DAYS_61_90", "DAYS_90_PLUS", "NO_DUE_DATE"];

    if (arAgingLoading) {
      return (
        <section className="view active">
          <div className="panel">
            <div className="panel-head"><div><h3>Debitor yaşlanma hesabatı</h3></div></div>
            <p style={{ padding: "1.5rem", color: "var(--muted)" }}>Yüklənir…</p>
          </div>
        </section>
      );
    }

    if (arAgingError) {
      return (
        <section className="view active">
          <div className="panel">
            <div className="panel-head"><div><h3>Debitor yaşlanma hesabatı</h3></div></div>
            <p style={{ padding: "1.5rem", color: "var(--danger)" }}>{arAgingError}</p>
          </div>
        </section>
      );
    }

    if (!arAgingData) {
      return (
        <section className="view active">
          <div className="panel">
            <div className="panel-head"><div><h3>Debitor yaşlanma hesabatı</h3></div></div>
            <p style={{ padding: "1.5rem", color: "var(--muted)" }}>Məlumat tapılmadı.</p>
          </div>
        </section>
      );
    }

    const { asOfDate, summary, customers, invoices } = arAgingData;

    const summaryCards = [
      { label: "Ümumi qalıq", value: fmtMinor(summary.totalOutstandingMinor), highlight: true },
      { label: "Cari", value: fmtMinor(summary.buckets.CURRENT) },
      { label: "1–30 gün", value: fmtMinor(summary.buckets.DAYS_1_30) },
      { label: "31–60 gün", value: fmtMinor(summary.buckets.DAYS_31_60) },
      { label: "61–90 gün", value: fmtMinor(summary.buckets.DAYS_61_90) },
      { label: "90+ gün", value: fmtMinor(summary.buckets.DAYS_90_PLUS) },
      { label: "Tarixsiz", value: fmtMinor(summary.buckets.NO_DUE_DATE) },
    ];

    return (
      <section className="view active">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Debitor yaşlanma hesabatı</h3>
              <p className="panel-copy">Tarix: {asOfDate} — Ödənilməmiş fakturalar ödəniş tarixinə görə qruplaşdırılır.</p>
            </div>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => {
                setArAgingData(null);
                setArAgingLoading(true);
                setArAgingError("");
                apiGetAccountsReceivableAging(updateBackendSession)
                  .then((data) => { setArAgingData(data); setArAgingLoading(false); })
                  .catch((err) => { setArAgingError(err?.message || "AR aging hesabatı yüklənmədi."); setArAgingLoading(false); });
              }}
            >Yenilə</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", padding: "1.25rem 1.5rem" }}>
            {summaryCards.map((card) => (
              <div key={card.label} style={{ background: card.highlight ? "var(--accent-pale, #eef4ff)" : "var(--surface-raised, #f8f9fa)", borderRadius: "0.5rem", padding: "0.875rem 1rem", border: card.highlight ? "1px solid var(--accent, #3b82f6)" : "1px solid var(--border)" }}>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "1.05rem", fontWeight: 700, color: card.highlight ? "var(--accent, #3b82f6)" : "var(--text)" }}>{card.value}</p>
              </div>
            ))}
          </div>

          {customers && customers.length > 0 && (
            <div style={{ padding: "0 1.5rem 1.5rem" }}>
              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>Müştəri üzrə icmal</h4>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table" style={{ width: "100%", minWidth: "720px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Müştəri</th>
                      <th style={{ textAlign: "right" }}>Ümumi</th>
                      {BUCKET_KEYS.map((key) => (
                        <th key={key} style={{ textAlign: "right" }}>{BUCKET_LABELS[key]}</th>
                      ))}
                      <th style={{ textAlign: "right" }}>Ən köhnə tarix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((cust) => (
                      <tr key={cust.customerId || cust.customerName}>
                        <td>{cust.customerName || "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtMinor(cust.totalOutstandingMinor)}</td>
                        {BUCKET_KEYS.map((key) => (
                          <td key={key} style={{ textAlign: "right", color: cust.buckets[key] > 0 && key !== "CURRENT" && key !== "NO_DUE_DATE" ? "var(--danger, #ef4444)" : undefined }}>
                            {cust.buckets[key] > 0 ? fmtMinor(cust.buckets[key]) : "—"}
                          </td>
                        ))}
                        <td style={{ textAlign: "right", fontSize: "0.82rem", color: "var(--muted)" }}>{cust.oldestDueDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {invoices && invoices.length > 0 && (
            <div style={{ padding: "0 1.5rem 1.5rem" }}>
              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>Faktura detalları</h4>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table" style={{ width: "100%", minWidth: "820px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Faktura №</th>
                      <th style={{ textAlign: "left" }}>Müştəri</th>
                      <th style={{ textAlign: "right" }}>Ödəniş tarixi</th>
                      <th style={{ textAlign: "right" }}>Yekun</th>
                      <th style={{ textAlign: "right" }}>Ödənilib</th>
                      <th style={{ textAlign: "right" }}>Qalıq</th>
                      <th style={{ textAlign: "right" }}>Gecikmə (gün)</th>
                      <th style={{ textAlign: "left" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.invoiceId}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{inv.invoiceNumber || "—"}</td>
                        <td>{inv.customerName || "—"}</td>
                        <td style={{ textAlign: "right", fontSize: "0.82rem" }}>{inv.dueDate || "—"}</td>
                        <td style={{ textAlign: "right" }}>{fmtMinor(inv.totalMinor)}</td>
                        <td style={{ textAlign: "right", color: "var(--success, #22c55e)" }}>{fmtMinor(inv.paidAmountMinor)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: inv.outstandingMinor > 0 ? "var(--danger, #ef4444)" : undefined }}>{fmtMinor(inv.outstandingMinor)}</td>
                        <td style={{ textAlign: "right", color: (inv.daysOverdue > 0) ? "var(--danger, #ef4444)" : "var(--muted)" }}>
                          {inv.daysOverdue != null ? (inv.daysOverdue === 0 ? "Cari" : `${inv.daysOverdue}`) : "—"}
                        </td>
                        <td>
                          <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: inv.bucket === "CURRENT" ? "var(--success-pale, #dcfce7)" : inv.bucket === "NO_DUE_DATE" ? "var(--surface-raised, #f1f5f9)" : "var(--danger-pale, #fee2e2)", color: inv.bucket === "CURRENT" ? "var(--success, #16a34a)" : inv.bucket === "NO_DUE_DATE" ? "var(--muted)" : "var(--danger, #dc2626)" }}>
                            {BUCKET_LABELS[inv.bucket] || inv.bucket}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(!invoices || invoices.length === 0) && (
            <p style={{ padding: "0 1.5rem 1.5rem", color: "var(--muted)" }}>Ödənilməmiş faktura yoxdur.</p>
          )}
        </div>
      </section>
    );
  }

  const at = I18N[hubLang] || I18N.az;
  const appMenuLabel = ({ az: "Menyu", en: "Menu", ru: "Меню", tr: "Menü", de: "Menü" }[hubLang] || "Menu");
  const col = (label) => (at.col && at.col[label]) || label;
  const fld = (label) => (at.fld && at.fld[label]) || label;
  const MODULES = getModules(at);
  const APP_LANGS = [
    { code: "az", label: "Azərbaycan dili", flag: "🇦🇿" },
    { code: "en", label: "English",          flag: "🇬🇧" },
    { code: "ru", label: "Русский",          flag: "🇷🇺" },
    { code: "tr", label: "Türkçe",           flag: "🇹🇷" },
    { code: "de", label: "Deutsch",          flag: "🇩🇪" },
  ];
  const pathname = window.location.pathname;
  const legalSlug = pathname.startsWith("/accounting/") ? pathname.replace("/accounting/", "").split("/")[0] : null;
  const standaloneLegalPage = legalSlug ? COMPLIANCE_LEGAL_PAGE_MAP[resolveStandaloneLegalSlug(legalSlug)] : null;
  const visibleNav = getAccessibleNavItems(currentUser);
  const pageTitle = activeModule ? MODULES[activeModule].title : (at.nav[activeSection] || visibleNav.find((item) => item.id === activeSection)?.label || at.nav.home);
  const activeCompanyName = state.settings.companyName || (currentUser ? getProfileDisplayName(currentUser) : "");
  const content = activeModule ? renderModule(activeModule) : activeSection === "home" ? renderHome() : OVERVIEWS[activeSection] ? renderOverview(activeSection) : activeSection === "banking" ? renderBanking() : activeSection === "reports" ? renderReports() : activeSection === "documents" ? renderDocuments() : activeSection === "settings" ? renderSettings() : null;
  const standaloneLegalRoute = getStandaloneLegalRouteInfo();
  const standaloneLegalSlugMatched = COMPLIANCE_LEGAL_PAGES.some((page) => page.id === standaloneLegalRoute.slug);
  function getSupportContextLabel() {
    if (activeProduct === "hub") return "Homepage";
    if (activeProduct === "booksLanding") return `Giriş paneli / ${booksView}`;
    if (activeSection && activeModule) return `${activeSection} / ${activeModule}`;
    if (activeSection) return activeSection;
    return "dashboard";
  }

  async function handleCreateSupportThread(event) {
    event.preventDefault();
    const messageBody = String(supportDraft.message || "").trim();
    const subject = String(supportDraft.subject || "").trim();
    if (!currentUser || !messageBody || !subject) return;

    try {
      const created = await apiCreateSupportThread({
        subject,
        category: SUPPORT_CATEGORY_TO_BACKEND[supportDraft.category] || "OTHER",
        priority: SUPPORT_PRIORITY_TO_BACKEND[supportDraft.priority] || "NORMAL",
        context: getSupportContextLabel(),
        body: messageBody,
      }, updateBackendSession);

      const normalized = normalizeSupportThread(created);
      setSupportActiveThreadId(normalized.id);
      setSupportDraft({ subject: "", category: SUPPORT_CATEGORY_OPTIONS[0], priority: SUPPORT_PRIORITY_OPTIONS[0], message: "" });
      setSupportWidgetOpen(true);
      await syncSupportThreadsFromBackend();
    } catch (error) {
      console.error("Failed to create support thread", error);
    }
  }

  async function handleReplyToSupportThread(event) {
    event.preventDefault();
    const body = String(supportReplyDraft || "").trim();
    if (!currentUser || !supportActiveThreadId || !body) return;

    try {
      await apiReplySupportThread(supportActiveThreadId, { body }, updateBackendSession);
      setSupportReplyDraft("");
      await syncSupportThreadsFromBackend();
    } catch (error) {
      console.error("Failed to reply to support thread", error);
    }
  }

  async function handleAdminSupportReply(threadId) {
    const body = String(supportAdminReplyDraft || "").trim();
    if (!currentUser || !threadId || !body) return;

    try {
      await apiReplyInternalSupportThread(threadId, { body }, updateBackendSession);
      setSupportAdminReplyDraft("");
      await syncSupportThreadsFromBackend();
    } catch (error) {
      console.error("Failed to send admin support reply", error);
    }
  }

  function handleSupportTextareaKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    const form = event.currentTarget.form;
    if (!form) return;
    event.preventDefault();
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  }

  function playSupportNotificationSound() {
    if (typeof window === "undefined") return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      let audioContext = supportAudioContextRef.current;
      if (!audioContext) {
        audioContext = new AudioContextCtor();
        supportAudioContextRef.current = audioContext;
      }

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }

      const now = audioContext.currentTime;
      const master = audioContext.createGain();
      master.gain.setValueAtTime(0.42, now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      master.connect(audioContext.destination);

      const buildVoice = (frequency, startTime, duration, waveType, gainLevel) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc.type = waveType;
        osc.frequency.setValueAtTime(frequency, startTime);
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.08, startTime + duration * 0.7);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2600, startTime);
        filter.Q.setValueAtTime(0.8, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
        osc.onended = () => {
          try {
            osc.disconnect();
            filter.disconnect();
            gain.disconnect();
          } catch {}
        };
      };

      buildVoice(784, now, 0.14, "square", 0.55);
      buildVoice(988, now + 0.11, 0.15, "triangle", 0.45);
      buildVoice(1318.51, now + 0.24, 0.18, "sine", 0.34);
    } catch {}
  }

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const unlockSupportAudio = () => {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;
      if (!supportAudioContextRef.current) {
        supportAudioContextRef.current = new AudioContextCtor();
      }
      const audioContext = supportAudioContextRef.current;
      if (audioContext?.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockSupportAudio, { passive: true, once: true });
    window.addEventListener("keydown", unlockSupportAudio, { passive: true, once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockSupportAudio);
      window.removeEventListener("keydown", unlockSupportAudio);
    };
  }, []);

  async function updateSupportThreadStatus(threadId, status) {
    try {
      const backendStatus = status === "waiting_user" ? "WAITING_ACCOUNT" : status === "waiting_support" ? "WAITING_SUPPORT" : status === "closed" ? "CLOSED" : "OPEN";
      if (currentUser?.role === "super_admin") {
        await apiUpdateInternalSupportThreadStatus(threadId, { status: backendStatus }, updateBackendSession);
      } else {
        const userStatus = backendStatus === "WAITING_ACCOUNT" ? "WAITING_SUPPORT" : backendStatus;
        await apiUpdateSupportThreadStatus(threadId, { status: userStatus === "OPEN" ? "WAITING_SUPPORT" : userStatus }, updateBackendSession);
      }
      await syncSupportThreadsFromBackend();
    } catch (error) {
      console.error("Failed to update support thread status", error);
    }
  }

  useEffect(() => {
    if (!supportWidgetOpen || !supportActiveThreadId || currentUser?.role === "super_admin") return;
    setSupportThreads((current) => current.map((thread) => thread.id === supportActiveThreadId ? { ...thread, unreadForUser: 0 } : thread));
  }, [supportWidgetOpen, supportActiveThreadId, currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role === "super_admin") return;
    if (!userSupportThreads.length) {
      setSupportActiveThreadId(null);
      return;
    }
    if (supportActiveThreadId === "new") return;
    if (!supportActiveThreadId || !userSupportThreads.some((thread) => thread.id === supportActiveThreadId)) {
      setSupportActiveThreadId(userSupportThreads[0].id);
    }
  }, [currentUser?.role, supportActiveThreadId, userSupportThreads]);

  useEffect(() => {
    if (currentUser?.role !== "super_admin") return;
    if (!supportThreads.length) {
      setSupportAdminActiveThreadId(null);
      return;
    }
    if (!supportAdminActiveThreadId || !supportThreads.some((thread) => thread.id === supportAdminActiveThreadId)) {
      setSupportAdminActiveThreadId(supportThreads[0].id);
    }
  }, [currentUser?.role, supportAdminActiveThreadId, supportThreads]);

  function renderSupportWidget() {
    if (currentUser?.role === "super_admin") return null;

    const activeThread = currentUser
      ? (userSupportThreads.find((thread) => thread.id === supportActiveThreadId) || null)
      : null;

    return (
      <div className={`support-widget${supportWidgetOpen ? " open" : ""}`}>
        {supportWidgetOpen ? (
          <section className="support-widget-panel" onClick={(event) => event.stopPropagation()}>
            <div className="support-widget-head">
              <div>
                <strong>Dəstək</strong>
                <small>Real operator sizə buradan cavab verəcək</small>
              </div>
              <button className="icon-btn" type="button" onClick={() => setSupportWidgetOpen(false)}>×</button>
            </div>

            {userSupportThreads.length > 0 ? (
              <>
                <div className="support-thread-tabs">
                  {userSupportThreads.slice(0, 4).map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      className={`support-thread-tab${thread.id === supportActiveThreadId ? " active" : ""}`}
                      onClick={() => setSupportActiveThreadId(thread.id)}
                    >
                      <span>{thread.subject}</span>
                      <small>{SUPPORT_STATUS_LABELS[thread.status] || thread.status}</small>
                      {thread.unreadForUser ? <span className="support-thread-unread">{thread.unreadForUser}</span> : null}
                    </button>
                  ))}
                </div>

                {activeThread ? (
                  <>
                    <div className="support-thread-meta">
                      <span>{activeThread.category}</span>
                      <span>{activeThread.priority}</span>
                      <span>{activeThread.context}</span>
                    </div>
                    <div className="support-message-list">
                      {activeThread.messages.map((message) => (
                        <article key={message.id} className={`support-message ${message.authorType === "admin" ? "admin" : "user"}`}>
                          <strong>{message.authorType === "admin" ? "Dəstək komandası" : "Siz"}</strong>
                          <p>{message.body}</p>
                          <small>{new Date(message.createdAt).toLocaleString("az-AZ")}</small>
                        </article>
                      ))}
                      <div ref={supportUserScrollRef} />
                    </div>
                    <form className="support-reply-form" onSubmit={handleReplyToSupportThread}>
                      <textarea
                        value={supportReplyDraft}
                        onChange={(event) => setSupportReplyDraft(event.target.value)}
                        placeholder="Cavabınızı yazın..."
                        rows={3}
                        onKeyDown={handleSupportTextareaKeyDown}
                      />
                      <div className="support-widget-actions">
                        {activeThread.status === "closed" ? (
                          <button className="ghost-btn" type="button" onClick={() => updateSupportThreadStatus(activeThread.id, "waiting_support")}>Yenidən aç</button>
                        ) : null}
                        <button className="primary-btn" type="submit" disabled={!supportReplyDraft.trim()}>Göndər</button>
                      </div>
                    </form>
                  </>
                ) : null}

                <button className="ghost-btn support-new-thread-btn" type="button" onClick={() => setSupportActiveThreadId("new")}>Yeni müraciət</button>
              </>
            ) : null}

            {!activeThread ? (
              <form className="support-create-form" onSubmit={handleCreateSupportThread}>
                <label><span>Mövzu</span><input value={supportDraft.subject} onChange={(event) => setSupportDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Qısa başlıq" required /></label>
                <div className="support-create-grid">
                  <label><span>Kateqoriya</span><select value={supportDraft.category} onChange={(event) => setSupportDraft((current) => ({ ...current, category: event.target.value }))}>{SUPPORT_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                  <label><span>Prioritet</span><select value={supportDraft.priority} onChange={(event) => setSupportDraft((current) => ({ ...current, priority: event.target.value }))}>{SUPPORT_PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                </div>
                <label>
                  <span>Mesaj</span>
                  <textarea
                    value={supportDraft.message}
                    onChange={(event) => setSupportDraft((current) => ({ ...current, message: event.target.value }))}
                    onKeyDown={handleSupportTextareaKeyDown}
                    placeholder="Problemi və ya sualınızı yazın..."
                    rows={5}
                    required
                  />
                </label>
                <div className="support-widget-note">Kontekst avtomatik əlavə olunur: {getSupportContextLabel()}</div>
                <div className="support-widget-actions">
                  {userSupportThreads.length > 0 ? <button className="ghost-btn" type="button" onClick={() => setSupportActiveThreadId(userSupportThreads[0].id)}>Mövcud yazışmaya qayıt</button> : null}
                  <button className="primary-btn" type="submit">Müraciət göndər</button>
                </div>
              </form>
            ) : null}
          </section>
        ) : null}

        <button className="support-widget-trigger" type="button" onClick={() => setSupportWidgetOpen((current) => !current)}>
          <span>Dəstək</span>
          {supportUnreadCount > 0 ? <strong>{supportUnreadCount}</strong> : null}
        </button>
      </div>
    );
  }

  function renderSupportAdminPanel() {
    const filteredThreads = supportThreads
      .filter((thread) => supportAdminFilter === "all" ? true : thread.status === supportAdminFilter)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
    const activeThread = filteredThreads.find((thread) => thread.id === supportAdminActiveThreadId)
      || filteredThreads[0]
      || supportThreads.find((thread) => thread.id === supportAdminActiveThreadId)
      || supportThreads[0]
      || null;

    return (
      <div className="iac-section">
        <div className="iac-section-hd">
          <span className="iac-dot iac-dot--growth" />
          <span className="iac-section-lbl">Support Inbox</span>
          <span className="iac-meta-count">{supportThreads.length} total</span>
        </div>
        <div className="support-admin-toolbar">
          <button type="button" className={`support-filter-btn${supportAdminFilter === "open" ? " active" : ""}`} onClick={() => setSupportAdminFilter("open")}>Açıq</button>
          <button type="button" className={`support-filter-btn${supportAdminFilter === "waiting_support" ? " active" : ""}`} onClick={() => setSupportAdminFilter("waiting_support")}>Dəstək gözlənir</button>
          <button type="button" className={`support-filter-btn${supportAdminFilter === "waiting_user" ? " active" : ""}`} onClick={() => setSupportAdminFilter("waiting_user")}>İstifadəçi gözlənir</button>
          <button type="button" className={`support-filter-btn${supportAdminFilter === "closed" ? " active" : ""}`} onClick={() => setSupportAdminFilter("closed")}>Bağlı</button>
          <button type="button" className={`support-filter-btn${supportAdminFilter === "all" ? " active" : ""}`} onClick={() => setSupportAdminFilter("all")}>Hamısı</button>
        </div>

        {filteredThreads.length === 0 ? (
          <div className="iac-fin-empty">Hələ support müraciəti yoxdur.</div>
        ) : (
          <div className="support-admin-layout">
            <div className="support-admin-list">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`support-admin-thread${activeThread?.id === thread.id ? " active" : ""}`}
                  onClick={() => {
                    setSupportAdminActiveThreadId(thread.id);
                    setSupportThreads((current) => current.map((item) => item.id === thread.id ? { ...item, unreadForAdmin: 0 } : item));
                  }}
                >
                  <div className="support-admin-thread-top">
                    <strong>{thread.subject}</strong>
                    {thread.unreadForAdmin ? <span className="support-admin-unread">{thread.unreadForAdmin}</span> : null}
                  </div>
                  <span>{thread.companyName}</span>
                  <small>{thread.category} · {thread.priority} · {SUPPORT_STATUS_LABELS[thread.status] || thread.status}</small>
                </button>
              ))}
            </div>
            {activeThread ? (
              <section className="support-admin-detail">
                <div className="support-admin-detail-head">
                  <div>
                    <h3>{activeThread.subject}</h3>
                    <p>{activeThread.companyName} · {activeThread.ownerEmail} · {activeThread.context}</p>
                  </div>
                  <div className="support-admin-status-actions">
                    <button type="button" className="ghost-btn compact-btn" onClick={() => updateSupportThreadStatus(activeThread.id, "waiting_user")}>Cavab verildi</button>
                    <button type="button" className="ghost-btn compact-btn" onClick={() => updateSupportThreadStatus(activeThread.id, "closed")}>Bağla</button>
                    <button type="button" className="ghost-btn compact-btn" onClick={() => updateSupportThreadStatus(activeThread.id, "open")}>Açıq saxla</button>
                  </div>
                </div>
                <div className="support-message-list admin">
                  {activeThread.messages.map((message) => (
                    <article key={message.id} className={`support-message ${message.authorType === "admin" ? "admin" : "user"}`}>
                      <strong>{message.authorType === "admin" ? "Operator" : message.authorName || message.authorEmail}</strong>
                      <p>{message.body}</p>
                      <small>{new Date(message.createdAt).toLocaleString("az-AZ")}</small>
                    </article>
                  ))}
                  <div ref={supportAdminScrollRef} />
                </div>
                <form className="support-admin-reply" onSubmit={(event) => { event.preventDefault(); void handleAdminSupportReply(activeThread.id); }}>
                  <textarea
                    value={supportAdminReplyDraft}
                    onChange={(event) => setSupportAdminReplyDraft(event.target.value)}
                    placeholder="İstifadəçiyə cavab yazın..."
                    rows={4}
                    onKeyDown={handleSupportTextareaKeyDown}
                  />
                  <div className="support-widget-actions">
                    <button type="submit" className="primary-btn" disabled={!supportAdminReplyDraft.trim()}>Cavab göndər</button>
                  </div>
                </form>
              </section>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  function renderStandaloneLegalRouteGuard(routeInfo) {
    const legalPage = routeInfo?.legalPage || null;
    const activeLegalNavId = legalPage ? getActiveLegalNavId(legalPage.id) : "";
    const visibleSections = legalPage ? getVisibleLegalSections(legalPage) : [];

    if (!legalPage) {
      return (
        <div className="lp-shell">
          <header className="lp-topbar">
            <div className="lp-topbar-inner">
              <div className="lp-brand">
                <div className="lp-brand-icon">
                  <img src={logoSrc} alt="Tetavio" className="app-logo" />
                </div>
                <div className="lp-brand-copy">
                  <strong>Tetavio</strong>
                  <span>Accounting Software</span>
                </div>
              </div>
            </div>
          </header>

          <section className="lp-legal-shell">
            <div className="lp-legal-card">
              <div className="lp-legal-head">
                <div>
                  <h2>Page not found</h2>
                  <p>İstədiyiniz hüquqi səhifə tapılmadı.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="lp-shell">
        <header className="lp-topbar">
          <div className="lp-topbar-inner">
            <div className="lp-brand">
              <div className="lp-brand-icon">
                <img src={logoSrc} alt="Tetavio" className="app-logo" />
              </div>
              <div className="lp-brand-copy">
                <strong>Tetavio</strong>
                <span>Accounting Software</span>
              </div>
            </div>
            <div className="lp-nav">
              <a className="lp-nav-ghost" href="/accounting">Accounting</a>
            </div>
          </div>
        </header>

        <section className="lp-legal-shell">
          <div className="lp-legal-card">
            <div className="lp-legal-head">
              <div>
                <h2>{legalPage.title}</h2>
                <p>{legalPage.summary}</p>
              </div>
            </div>

            <div className="lp-legal-links">
              {LEGAL_NAV_ITEMS.map((legalItem) => (
                <a
                  key={legalItem.id}
                  className={`lp-legal-link${legalItem.id === activeLegalNavId ? " active" : ""}`}
                  href={legalItem.href}
                >
                  {legalItem.label}
                </a>
              ))}
            </div>

            <div className="lp-legal-sections">
              {visibleSections.map((section, index) => {
                const sectionId = getLegalSectionId(legalPage.id, section, index);

                return (
                  <article key={section.heading} id={sectionId} className="lp-legal-section">
                    <h3>{section.heading}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-footer-links">
            {LEGAL_NAV_ITEMS.map((legalItem) => (
              <a
                key={legalItem.id}
                className={`lp-legal-link${legalItem.id === activeLegalNavId ? " active" : ""}`}
                href={legalItem.href}
              >
                {legalItem.label}
              </a>
            ))}
          </div>
          <small>Tetavio ERP · Cloud Accounting Platform · © Tetavio MMC, bütün hüquqlar qorunur</small>
        </footer>
      </div>
    );
  }

  if (standaloneLegalPage) {
    return <StandaloneLegalPage page={standaloneLegalPage} lang={hubLang} onLangChange={setHubLang} />;
  }

  if (standaloneLegalSlugMatched) {
    return renderStandaloneLegalRouteGuard(standaloneLegalRoute);
  }

  const _internalPath = window.location.pathname.replace(/\/+$/, "") || "/";
  if (_internalPath === "/internal" || _internalPath.endsWith("/internal")) {
    return renderInternalAdmin();
  }

  if (activeProduct === "funnel") {
    return renderFunnel();
  }

  if (activeProduct === "hub") {
    return renderProductHub();
  }

  if (activeProduct === "booksLanding") {
    return renderBooksLanding();
  }
  const appActiveLang = APP_LANGS.find((l) => l.code === hubLang) || APP_LANGS[0];
  const backupTone = backupStatus.tone || "info";

  const trialIsExpired = !!(
    currentUser &&
    currentUser.role !== "super_admin" &&
    backendSubscription?.plan?.code === "FREE" &&
    backendSubscription?.isTrialExpired === true
  );

  const trialDaysLeft = backendSubscription?.trialDaysRemaining ?? null;
  const showTrialWarning = !trialIsExpired && trialDaysLeft !== null && trialDaysLeft <= 3 && backendSubscription?.plan?.code === "FREE";

  return (
    <div className={`app-shell${appNavOpen ? " mobile-nav-open" : ""}`} data-ui-scale={state.settings.uiScale || "Avtomatik"} onClick={() => { if (hubLangOpen) setHubLangOpen(false); if (profileMenuOpen) setProfileMenuOpen(false); if (appNavOpen) setAppNavOpen(false); }}>
      <button className={`mobile-nav-overlay${appNavOpen ? " visible" : ""}`} type="button" aria-label={appMenuLabel} onClick={() => setAppNavOpen(false)} />

      {trialIsExpired && (
        <div className="trial-expired-overlay">
          <div className="trial-expired-modal">
            <div className="trial-expired-icon">⏰</div>
            <h2 className="trial-expired-title">Sınaq müddəti bitdi</h2>
            <p className="trial-expired-body">
              14 günlük Demo sınaq müddətiniz başa çatdı. Platformadan istifadəni davam etdirmək üçün ödənişli paketlərdən birini seçin.
            </p>
            <div className="trial-expired-actions">
              <button
                className="trial-expired-btn-primary"
                type="button"
                onClick={() => { setAccountPanel("plans"); setProfileMenuOpen(false); }}
              >
                Plan seç →
              </button>
              <button
                className="trial-expired-btn-ghost"
                type="button"
                onClick={logoutUser}
              >
                Çıxış et
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrialWarning && (
        <div className="trial-warning-bar">
          <span>⚡ Sınaq müddətindən <strong>{trialDaysLeft} gün</strong> qalıb — platformadan tam yararlanmaq üçün plan seçin.</span>
          <button type="button" className="trial-warning-cta" onClick={() => setAccountPanel("plans")}>Plan seç</button>
        </div>
      )}

      <aside className="sidebar" onClick={(event) => event.stopPropagation()}>
        <button className="brand-block lp-brand" type="button" onClick={() => { setActiveProduct("hub"); setAppNavOpen(false); }}>
          <div className="lp-brand-icon">
            <img src={logoSrc} alt="Tetavio" className="app-logo" />
          </div>
          <div className="lp-brand-copy">
            <strong>Tetavio</strong>
            <span>{at.brandSub}</span>
          </div>
        </button>
        <nav className="nav-tree">{visibleNav.map((item) => {
          const isActive = activeSection === item.id;
          const isExpanded = expandedSections.has(item.id);
          return (
            <div className="nav-group" key={item.id}>
              <button
                className={`nav-item${isActive ? " active" : ""}${item.children ? " has-children" : ""}`}
                onClick={() => {
                  if (item.children) {
                    if (isActive && activeModule === null) {
                      toggleSectionExpand(item.id);
                    } else {
                      setSection(item.id);
                      setExpandedSections(new Set([item.id]));
                      setAppNavOpen(false);
                    }
                  } else {
                    setSection(item.id);
                    setAppNavOpen(false);
                  }
                }}
              >
                <span>{at.nav[item.id] || item.label}</span>
              </button>
              {item.children && isExpanded && !["banking", "purchases", "sales", "accountant"].includes(item.id) ? (
                <div className="subnav-list">
                  {item.children.map((moduleId) => (
                    <div className={`subnav-row ${activeModule === moduleId ? "active" : ""}`} key={moduleId}>
                      <button
                        className={`subnav-item ${activeModule === moduleId ? "active" : ""}`}
                        onClick={() => { setActiveModule(moduleId); setActiveSection(item.id); if (moduleId === "itemsCatalog") setItemFormOpen(false); setAppNavOpen(false); }}
                      >
                        {MODULES[moduleId].title}
                      </button>
                      {moduleId === "itemsCatalog" ? (
                        <button className="subnav-add-btn" type="button" onClick={(event) => { event.stopPropagation(); setActiveModule("itemsCatalog"); setAppNavOpen(false); openNewItemForm(setDrafts, setEditing, setItemFormOpen); }}>+</button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}</nav>
        <section className="sidebar-card"><span className="sidebar-chip">{isReady ? at.chipActive : at.chipLoading}</span><strong>{activeCompanyName}</strong><small>{currentUser?.profile?.entityType === "Fiziki şəxs" ? at.profileIndiv : at.profileCompany}</small></section>
      </aside>
      <main className="workspace">
        <input ref={restoreInputRef} type="file" accept=".json,application/json" onChange={restoreBackup} style={{ display: "none" }} />
        {!isReady ? (
          <section className="panel loading-panel">
            <h3>{at.loading}</h3>
            <p>{at.loadingDesc}</p>
          </section>
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">{at.workspace}</p>
                <h1>{pageTitle}</h1>
              </div>
              <div className="topbar-actions">
                <button className="mobile-nav-trigger" type="button" aria-label={appMenuLabel} onClick={(event) => { event.stopPropagation(); setAppNavOpen((current) => !current); }}>
                  <span aria-hidden="true">☰</span>
                  <span>{appMenuLabel}</span>
                </button>
                <button className="ghost-btn" onClick={() => setActiveProduct("hub")}>{at.btnProducts}</button>
                {currentUser ? (
                  <div className={`profile-menu ${profileMenuOpen ? "open" : ""}`}>
                    <button className="profile-trigger" type="button" onClick={() => setProfileMenuOpen((current) => !current)}>
                      <span className="profile-avatar">{String(currentUser.fullName || currentUser.email || "U").trim().charAt(0).toUpperCase()}</span>
                      <span className="profile-copy">
                        <strong>{at.profileLabel}</strong>
                        <small>{getPlanStatusText(currentUser)}</small>
                      </span>
                    </button>
                    {profileMenuOpen ? (
                      <div className="profile-dropdown">
                        <div className="profile-dropdown-copy">
                          <strong>{activeCompanyName || currentUser.fullName}</strong>
                          <small>{currentUser.email}</small>
                        </div>
                        {(currentUser.role === "super_admin" || !isInternalUser(currentUser)) ? (
                          <button className="profile-secondary-btn" type="button" onClick={() => { setAccountPanel("plans"); setProfileMenuOpen(false); }}>
                            {at.menuPlan}
                          </button>
                        ) : null}
                        {canManageTeam(currentUser) ? (
                          <button className="profile-secondary-btn" type="button" onClick={() => { setAccountPanel("team"); setProfileMenuOpen(false); }}>
                            {at.menuTeam}
                          </button>
                        ) : null}
                        {currentUser.role === "super_admin" ? (
                          <button className="profile-secondary-btn" type="button" onClick={() => { setAccountPanel("admin"); setProfileMenuOpen(false); }}>
                            {at.menuAdmin}
                          </button>
                        ) : null}
                        <button className="profile-secondary-btn" type="button" onClick={() => { setPasswordDraft({ current: "", next: "", confirm: "", notice: "", tone: "" }); setAccountPanel("changePassword"); setProfileMenuOpen(false); }}>
                          {at.menuPass}
                        </button>
                        <button className="profile-dropdown-btn" type="button" onClick={logoutUser}>
                          {at.menuLogout}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </header>
            {backupStatus.message ? (
              <div className={`backup-status ${backupTone}`}>
                {backupStatus.message}
              </div>
            ) : null}
            {activeSection === "home" && activeModule === null && (
              <section className="hero-banner">
                <div className="hero-main">
                  <div>
                    <p className="eyebrow">{at.heroCompany}</p>
                    <h2>{activeCompanyName}</h2>
                  </div>
                  <div className="hero-meta">
                    <span>{at.heroCurrency}</span>
                    <strong>{state.settings.currency}</strong>
                  </div>
                  <div className="hero-meta">
                    <span>{at.heroFiscal}</span>
                    <strong>{state.settings.fiscalYear}</strong>
                  </div>
                  <div className="hero-meta">
                    <span>{at.heroPlan}</span>
                    <strong>{currentUser ? getPlanStatusText(currentUser) : "—"}</strong>
                  </div>
                  <div className="hero-meta">
                    <span>{at.heroDate}</span>
                    <strong>{fmtDate(today())}</strong>
                  </div>
                </div>
              </section>
            )}
            {content}
            {renderSubscriptionPanel()}
            {renderSupportWidget()}
          </>
        )}
      </main>
    </div>
  );
}






