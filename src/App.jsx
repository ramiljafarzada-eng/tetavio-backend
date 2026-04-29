import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import logoSrc from "./assets/logo-icon.png";
import { createResetData, currency, today } from "./lib/data";
import { normalizeAppState } from "./lib/storage";
import I18N from './i18n';
import {
  apiCheckout,
  apiCreateCustomer,
  apiCreateVendor,
  apiDeleteCustomer,
  apiDeleteVendor,
  apiAddAdminNote,
  apiAdminFlagAccount,
  apiAdminUnflagAccount,
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
  apiCreateInvoice,
  apiDeleteInvoice,
  apiLogin,
  apiLogout,
  apiMe,
  apiMockWebhook,
  apiRegister,
  apiUpdateCompanySettings,
  apiUpdateCustomer,
  apiUpdateInvoice,
  apiUpdateVendor,
  apiUpgradeSubscription,
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
          "Platformada göstərilən bütün qiymətlər Azərbaycan manatı (AZN) ilə ifadə olunur, əgər ayrıca başqa cür göstərilməyibsə.",
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
    platform: "Məhsul platforması",
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
    columns: [["invoiceNumber", "Faktura #"], ["customerName", "Müştəri"], ["status", "Status", "status"], ["dueDate", "Son tarix", "date"], ["amount", "Məbləğ", "currency"]],
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
      columns: [["invoiceNumber", at.col["Faktura #"]], ["customerName", "Müştəri"], ["status", "Status", "status"], ["dueDate", at.col["Son tarix"], "date"], ["amount", at.col["Məbləğ"], "currency"]],
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
    operationsJournal: {
      title: at.mod_operationsJournal, singular: at.mod_operationsJournalSingular, collection: "manualJournals", summary: at.mod_operationsJournalSummary
    }
  };
}

const OVERVIEWS = { sales: ["customers", "invoices"], purchases: ["vendors", "goods", "incomingGoodsServices"], accountant: ["operationsJournal", "manualJournals", "chartOfAccounts"], reports: ["trialBalance", "accountCard", "financialPositionReport", "profitLossReport", "cashFlowReport", "equityChangesReport", "receivables", "payables"] };
const STATUS = { Ödənilib: "status-paid", Göndərilib: "status-sent", Qaralama: "status-draft", "Qəbul edilib": "status-paid", Gecikib: "status-overdue", Açıq: "status-draft", Bağlanıb: "status-paid", "Tətbiq edilib": "status-sent", Aktiv: "status-paid", Passiv: "status-draft", "Qismən ödənilib": "status-sent" };
const ITEM_MOVEMENT_TYPES = ["Alış", "Satış"];
const PURCHASE_TAX_OPTIONS = ["ƏDV 18%", "ƏDV 0%", "ƏDV-dən azad"];
const HUB_LANG_KEY = "finotam-hub-lang-v1";
const SUPER_ADMIN = {
  id: "super-admin",
  fullName: "Tetavio Super Admin",
  email: "admin@finotam.local",
  role: "super_admin"
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
  { id: "free", name: "Free", monthlyPrice: 0, annualMonthlyPrice: 0, currency: "USD", operationLimit: 5, durationDays: null, summaryKey: "sub_freeSummary", signupOnly: false },
  { id: "demo", name: "Demo", monthlyPrice: 0, annualMonthlyPrice: 0, currency: "USD", operationLimit: 100000, durationDays: 14, summaryKey: "sub_demoSummary", signupOnly: true },
  { id: "standard", name: "Standard", monthlyPrice: 12, annualMonthlyPrice: 10, currency: "USD", operationLimit: 5000, durationDays: 30, summaryKey: "sub_standardSummary", signupOnly: false },
  { id: "professional", name: "Professional", monthlyPrice: 24, annualMonthlyPrice: 20, currency: "USD", operationLimit: 10000, durationDays: 30, summaryKey: "sub_professionalSummary", signupOnly: false },
  { id: "premium", name: "Premium", monthlyPrice: 36, annualMonthlyPrice: 30, currency: "USD", operationLimit: 25000, durationDays: 30, summaryKey: "sub_premiumSummary", signupOnly: false },
  { id: "elite", name: "Elite", monthlyPrice: 129, annualMonthlyPrice: 100, currency: "USD", operationLimit: 100000, durationDays: 30, summaryKey: "sub_eliteSummary", signupOnly: false },
  { id: "ultimate", name: "Ultimate", monthlyPrice: 249, annualMonthlyPrice: 200, currency: "USD", operationLimit: 250000, durationDays: 30, summaryKey: "sub_ultimateSummary", signupOnly: false }
];

const FREE_PLAN_ENTITY_LIMITS = { customers: 5, vendors: 5, invoices: 5 };

const BACKEND_PLAN_CODE_BY_LEGACY_PLAN_ID = {
  free: "FREE",
  professional: "PRO_MONTHLY",
  premium: "PREMIUM_MONTHLY",
};

const LEGACY_PLAN_ID_BY_BACKEND_PLAN_CODE = Object.fromEntries(
  Object.entries(BACKEND_PLAN_CODE_BY_LEGACY_PLAN_ID).map(([legacyPlanId, backendPlanCode]) => [backendPlanCode, legacyPlanId]),
);

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
  if (plan.id === "free") return null;
  if (plan.id === "demo" || billingCycle === "demo") return 14;
  return billingCycle === "monthly" ? 30 : 365;
}

function getPlanDurationLabel(plan, billingCycle = "annual") {
  if (plan.id === "free") return "Limitsiz müddət";
  if (plan.id === "demo" || billingCycle === "demo") return "14 günlük demo";
  return billingCycle === "monthly" ? "30 günlük aktiv plan" : "365 günlük aktiv plan";
}

function getUnpaidTrialDurationDays(plan) {
  if (!plan || plan.id === "free") return null;
  return 14;
}

function getPlanPrice(plan, billingCycle = "annual") {
  if (billingCycle === "monthly") return Number(plan.monthlyPrice || 0);
  return Number(plan.annualMonthlyPrice || plan.monthlyPrice || 0);
}

function getPlanPriceLabel(plan, billingCycle = "annual") {
  if (plan.id === "free") return "Pulsuz";
  if (plan.id === "demo" || billingCycle === "demo") return "14 günlük demo";
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
    billingCycle: user?.subscription?.billingCycle || (activePlan.id === "free" ? "free" : activePlan.id === "demo" ? "demo" : "annual"),
    monthlyPrice: getPlanPrice(activePlan, user?.subscription?.billingCycle || "annual"),
    currency: activePlan.currency,
    startedAt: expired ? today() : user?.subscription?.startedAt || today(),
    endsAt: isSuperAdmin ? null : expired ? null : (user?.subscription?.endsAt || (activePlan.id === "free" ? null : addDays(today(), getPlanDurationDays(activePlan, activePlan.id === "demo" ? "demo" : (user?.subscription?.billingCycle || "annual")) || 30))),
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
    return "books";
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
  const [companySettingsLoading, setCompanySettingsLoading] = useState(false);
  const [companySettingsError, setCompanySettingsError] = useState("");
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [invoicesMeta, setInvoicesMeta] = useState(null);
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
  const [journalInlineCreate, setJournalInlineCreate] = useState({});
  const suspendAutoSaveRef = useRef(false);
  const demoPreviewStats = useMemo(() => buildDemoPreviewStats(timeTick), [timeTick]);
  const [animatedPreviewStats, setAnimatedPreviewStats] = useState(() => buildDemoPreviewStats(Date.now()));
  const [goodsTabIdx, setGoodsTabIdx] = useState(0); // 0=all, 1=goods, 2=services

  function updateBackendSession(session) {
    setBackendSession(session || null);
    setApiSession(session || null);
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
      fullName: me.fullName || me.email,
      email: me.email,
      role: String(me.role || "").toLowerCase() || "owner",
      profile: {
        entityType: "Hüquqi şəxs",
        companyName: me.fullName || me.email,
        taxId: "",
        mobilePhone: "",
      },
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
      customers: "Pulsuz plan limiti dolub. 5-dən çox müştəri əlavə etmək üçün planı yüksəldin.",
      vendors:   "Pulsuz plan limiti dolub. 5-dən çox vendor əlavə etmək üçün planı yüksəldin.",
      invoices:  "Pulsuz plan limiti dolub. 5-dən çox invoice yaratmaq üçün planı yüksəldin.",
    },
    en: {
      customers: "Free plan limit reached. Upgrade to add more than 5 customers.",
      vendors:   "Free plan limit reached. Upgrade to add more than 5 vendors.",
      invoices:  "Free plan limit reached. Upgrade to create more than 5 invoices.",
    },
    ru: {
      customers: "Достигнут лимит бесплатного плана. Перейдите на платный, чтобы добавить более 5 клиентов.",
      vendors:   "Достигнут лимит бесплатного плана. Перейдите на платный, чтобы добавить более 5 поставщиков.",
      invoices:  "Достигнут лимит бесплатного плана. Перейдите на платный, чтобы создать более 5 счетов.",
    },
    tr: {
      customers: "Ücretsiz plan limitine ulaşıldı. 5'ten fazla müşteri eklemek için planı yükseltin.",
      vendors:   "Ücretsiz plan limitine ulaşıldı. 5'ten fazla tedarikçi eklemek için planı yükseltin.",
      invoices:  "Ücretsiz plan limitine ulaşıldı. 5'ten fazla fatura oluşturmak için planı yükseltin.",
    },
    de: {
      customers: "Limit des kostenlosen Plans erreicht. Upgraden Sie, um mehr als 5 Kunden hinzuzufügen.",
      vendors:   "Limit des kostenlosen Plans erreicht. Upgraden Sie, um mehr als 5 Lieferanten hinzuzufügen.",
      invoices:  "Limit des kostenlosen Plans erreicht. Upgraden Sie, um mehr als 5 Rechnungen zu erstellen.",
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
      setSettingsTab(["profile", "language", "params", "system"].includes(part2) ? part2 : null);
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
      window.localStorage.setItem(HUB_LANG_KEY, hubLang || "en");
    } catch { /* ignore */ }
  }, [hubLang]);

  useEffect(() => {
    setApiSession(backendSession);
  }, [backendSession]);

  useEffect(() => {
    if (!backendSession?.accessToken) {
      return;
    }

    syncBackendSubscription(backendSession).catch((error) => {
      setBooksNotice(error?.message || "Backend ilə sinxronizasiya zamanı xəta baş verdi.");
    });
  }, [backendSession?.accessToken]);

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

  useEffect(() => {
    if (!currentUser) return;
    // Only sync from profile if settings fields are still empty (initial load)
    const needsCompanyName = !state.settings.companyName;
    const needsTaxId = !state.settings.taxId;
    const needsMobile = !state.settings.mobilePhone;
    const needsEntityType = !state.settings.entityType;
    if (!needsCompanyName && !needsTaxId && !needsMobile && !needsEntityType) return;

    const nextCompanyName = needsCompanyName ? (getProfileDisplayName(currentUser) || "") : state.settings.companyName;
    const nextTaxId = needsTaxId ? (currentUser.profile?.taxId || "") : state.settings.taxId;
    const nextMobilePhone = needsMobile ? (currentUser.profile?.mobilePhone || "") : (state.settings.mobilePhone || "");
    const nextEntityType = needsEntityType ? (currentUser.profile?.entityType || "Hüquqi şəxs") : (state.settings.entityType || "Hüquqi şəxs");

    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        companyName: nextCompanyName,
        taxId: nextTaxId,
        mobilePhone: nextMobilePhone,
        entityType: nextEntityType
      }
    }));
  }, [currentUser]);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "SUPER_ADMIN";
    if (!isSuperAdmin) return;
    setAdminOverviewLoading(true);
    setAdminOverviewError("");
    apiGetAdminOverview(updateBackendSession)
      .then((data) => {
        setAdminOverview(data);
        setAdminOverviewLoading(false);
      })
      .catch((err) => {
        setAdminOverviewError(err?.message || "Admin məlumatları yüklənmədi.");
        setAdminOverviewLoading(false);
      });
  }, [currentUser]);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "SUPER_ADMIN";
    if (!isSuperAdmin || adminActiveTab !== "accounts") return;
    setAdminAccountsLoading(true);
    setAdminAccountsError("");
    const params = { page: adminAccountsPage, limit: 20 };
    if (adminAccountsSearch) params.search = adminAccountsSearch;
    apiGetAdminAccounts(params, updateBackendSession)
      .then((res) => {
        setAdminAccountsData(res.data ?? []);
        setAdminAccountsMeta(res.meta ?? null);
        setAdminAccountsLoading(false);
      })
      .catch((err) => {
        setAdminAccountsError(err?.message || "Accounts yüklənmədi.");
        setAdminAccountsLoading(false);
      });
  }, [currentUser, adminActiveTab, adminAccountsPage, adminAccountsSearch]);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "SUPER_ADMIN";
    if (!isSuperAdmin || adminActiveTab !== "finance") return;
    setAdminFinanceLoading(true);
    setAdminFinanceError("");
    apiGetAdminFinance(updateBackendSession)
      .then((data) => {
        setAdminFinanceData(data);
        setAdminFinanceLoading(false);
      })
      .catch((err) => {
        setAdminFinanceError(err?.message || "Finance məlumatları yüklənmədi.");
        setAdminFinanceLoading(false);
      });
  }, [currentUser, adminActiveTab]);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "SUPER_ADMIN";
    if (!isSuperAdmin || adminActiveTab !== "subscriptions") return;
    setAdminSubsLoading(true);
    setAdminSubsError("");
    const params = { page: adminSubsPage, limit: 20 };
    if (adminSubsSearch) params.search = adminSubsSearch;
    if (adminSubsStatus) params.status = adminSubsStatus;
    apiGetAdminSubscriptions(params, updateBackendSession)
      .then((res) => {
        setAdminSubsData(res.data ?? []);
        setAdminSubsSummary(res.summary ?? null);
        setAdminSubsMeta(res.meta ?? null);
        setAdminSubsLoading(false);
      })
      .catch((err) => {
        setAdminSubsError(err?.message || "Subscriptions yüklənmədi.");
        setAdminSubsLoading(false);
      });
  }, [currentUser, adminActiveTab, adminSubsPage, adminSubsSearch, adminSubsStatus]);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "SUPER_ADMIN";
    if (!isSuperAdmin || adminActiveTab !== "activity") return;
    setAdminActivityLoading(true);
    setAdminActivityError("");
    const params = { page: adminActivityPage, limit: 20 };
    if (adminActivitySearch) params.search = adminActivitySearch;
    if (adminActivityType) params.type = adminActivityType;
    apiGetAdminActivity(params, updateBackendSession)
      .then((res) => {
        setAdminActivityItems(res.items ?? []);
        setAdminActivityPagination(res.pagination ?? null);
        setAdminActivityLoading(false);
      })
      .catch((err) => {
        setAdminActivityError(err?.message || "Activity yüklənmədi.");
        setAdminActivityLoading(false);
      });
  }, [currentUser, adminActiveTab, adminActivityPage, adminActivitySearch, adminActivityType]);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "SUPER_ADMIN";
    if (!isSuperAdmin || adminActiveTab !== "system") return;
    setAdminSystemHealthLoading(true);
    setAdminSystemHealthError("");
    apiGetAdminSystemHealth(updateBackendSession)
      .then((data) => {
        setAdminSystemHealth(data);
        setAdminSystemHealthLoading(false);
      })
      .catch((err) => {
        setAdminSystemHealthError(err?.message || "System health yüklənmədi.");
        setAdminSystemHealthLoading(false);
      });
  }, [currentUser, adminActiveTab]);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "SUPER_ADMIN";
    if (!isSuperAdmin || adminActiveTab !== "anomalies") return;
    setAdminAnomaliesLoading(true);
    setAdminAnomaliesError("");
    const params = { page: adminAnomaliesPage, limit: 20 };
    if (adminAnomaliesSearch) params.search = adminAnomaliesSearch;
    if (adminAnomaliesSeverity) params.severity = adminAnomaliesSeverity;
    if (adminAnomaliesType) params.type = adminAnomaliesType;
    apiGetAdminAnomalies(params, updateBackendSession)
      .then((data) => {
        setAdminAnomaliesData(data);
        setAdminAnomaliesLoading(false);
      })
      .catch((err) => {
        setAdminAnomaliesError(err?.message || "Anomalies yüklənmədi.");
        setAdminAnomaliesLoading(false);
      });
  }, [currentUser, adminActiveTab, adminAnomaliesPage, adminAnomaliesSearch, adminAnomaliesSeverity, adminAnomaliesType, adminAnomaliesKey]);

  useEffect(() => {
    if (!adminAccountDetailId) {
      setAdminAccountDetail(null);
      setAdminAccountDetailError("");
      return;
    }
    setAdminAccountDetailLoading(true);
    setAdminAccountDetailError("");
    apiGetAdminAccountDetail(adminAccountDetailId, updateBackendSession)
      .then((data) => {
        setAdminAccountDetail(data);
        setAdminAccountDetailLoading(false);
      })
      .catch((err) => {
        setAdminAccountDetailError(err?.message || "Account detail yüklənmədi.");
        setAdminAccountDetailLoading(false);
      });
  }, [adminAccountDetailId, adminAccountDetailKey]);

  useEffect(() => {
    if (!currentUser || activeSection !== "home") return;
    setFinancialInsightsLoading(true);
    setFinancialInsightsError("");
    apiGetFinancialInsights(updateBackendSession)
      .then((data) => {
        setFinancialInsightsData(data);
        setFinancialInsightsLoading(false);
      })
      .catch((err) => {
        setFinancialInsightsError(err?.message || "Financial insights could not be loaded.");
        setFinancialInsightsLoading(false);
      });
  }, [currentUser, activeSection]);

  useEffect(() => {
    if (!currentUser || activeSection !== "home") return;
    setCashflowLoading(true);
    setCashflowError("");
    apiGetCashflowForecast(updateBackendSession)
      .then((data) => {
        setCashflowData(data);
        setCashflowLoading(false);
      })
      .catch((err) => {
        setCashflowError(err?.message || "Cashflow forecast could not be loaded.");
        setCashflowLoading(false);
      });
  }, [currentUser, activeSection]);

  useEffect(() => {
    if (!currentUser || activeSection !== "home") return;
    setTrendsLoading(true);
    setTrendsError("");
    apiGetFinancialTrends(updateBackendSession)
      .then((data) => {
        setTrendsData(data);
        setTrendsLoading(false);
      })
      .catch((err) => {
        setTrendsError(err?.message || "Trend data could not be loaded.");
        setTrendsLoading(false);
      });
  }, [currentUser, activeSection]);

  useEffect(() => {
    const allowedNav = getAccessibleNavItems(currentUser);
    if (!allowedNav.some((item) => item.id === activeSection)) {
      setActiveSection("home");
      setActiveModule(null);
    }
  }, [activeSection, currentUser]);

  // ── Hash routing: state → URL ──
  useEffect(() => {
    const routePath = buildHashFromState();
    if (window.location.pathname !== routePath) {
      window.history.pushState(null, "", routePath);
    }
  }, [activeSection, activeModule, activeProduct, currentUser, booksView, settingsTab, bankView, documentView, billView, journalView, chartView, vendorView, goodsView, invoiceView, customerView]);

  // ── Hash routing: URL → state (mount + back/forward) ──
  useEffect(() => {
    const handleRouteChange = () => applyHashRoute(getLocationRoute());
    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [currentUser]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (activeProduct !== "booksLanding") return;
    if (!["signin", "signup", "forgot", "reset", "demo"].includes(booksView)) return;

    const frameId = window.requestAnimationFrame(() => {
      landingAuthRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeProduct, booksView]);

  useEffect(() => {
    let frameId = 0;
    let startTime = 0;
    const duration = 900;
    const startValues = animatedPreviewStats.map((item) => Number(item.value || 0));
    const targetValues = demoPreviewStats.map((item) => Number(item.value || 0));

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const eased = 1 - ((1 - progress) * (1 - progress) * (1 - progress));

      setAnimatedPreviewStats(
        demoPreviewStats.map((item, index) => ({
          ...item,
          value: Math.round(startValues[index] + ((targetValues[index] - startValues[index]) * eased))
        }))
      );

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [demoPreviewStats]);

  useEffect(() => {
    if (activeProduct !== "hub") return;
    const revealNodes = Array.from(document.querySelectorAll("[data-ph-reveal]"));
    if (!revealNodes.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -6% 0px"
      }
    );

    revealNodes.forEach((node, index) => {
      node.style.setProperty("--ph-reveal-delay", `${Math.min(index * 45, 360)}ms`);
      observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [activeProduct, hubBillingCycle, hubLang]);

  useEffect(() => {
    if (activeProduct !== "books") return;
    setAppNavOpen(false);
  }, [activeProduct, activeSection, activeModule]);

  useEffect(() => {
    const expiredUsers = authUsers.filter((user) => user.role !== "super_admin" && user.subscription?.planId !== "free" && user.subscription?.endsAt && String(user.subscription.endsAt) < today());
    if (!expiredUsers.length) return;
    setAuthUsers((current) => current.map((user) => {
      if (user.role === "super_admin" || user.subscription?.planId === "free" || !user.subscription?.endsAt || String(user.subscription.endsAt) >= today()) {
        return user;
      }
      return normalizeAuthUser({
        ...user,
        operationsUsed: 0,
        subscription: {
          ...user.subscription,
          planId: "free",
          startedAt: today(),
          endsAt: null,
          autoDowngraded: "Bəli"
        }
      });
    }));
    if (currentUser && expiredUsers.some((user) => user.email === getAccountOwnerEmail(currentUser) || user.email === currentUser.email)) {
      setBackupStatus({
        tone: "warning",
        message: "Abunəlik müddəti bitdi. Hesab avtomatik Free plana keçirildi."
      });
    }
  }, [authUsers, currentUser, timeTick]);

  useEffect(() => {
    if (!state.items.length) return;
    if (!state.items.some((item) => item.id === itemMovementDraft.itemId)) {
      setItemMovementDraft(createMovementDraft(state.items));
    }
  }, [itemMovementDraft.itemId, state.items]);

  const totals = useMemo(() => {
    const cashAccountCodes = ["221", "223", "224", "225"];
    const ledgerEntries = getUnifiedLedgerEntries();
    const lookup = getTrialBalanceLookup();
    const sourceInvoiceTotal = state.invoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const sourceReceiptTotal = state.salesReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const sourcePaymentTotal = state.paymentsReceived.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const sourceExpenseTotal = state.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const sourceBillTotal = state.bills.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const sourceReceivables = state.customers.reduce((sum, item) => sum + Number(item.outstandingReceivables || 0), 0);
    const sourcePayables = state.vendors.reduce((sum, item) => sum + Number(item.outstandingPayables || 0), 0);
    const sourceBank = state.bankingAccounts.reduce((sum, item) => sum + Number(item.balance || 0), 0);

    const cashFlow = ledgerEntries.reduce((acc, entry) => {
      const cashDebit = entry.lines.reduce((sum, line) => (
        cashAccountCodes.includes(String(line.accountCode)) ? sum + Number(line.debit || 0) : sum
      ), 0);
      const cashCredit = entry.lines.reduce((sum, line) => (
        cashAccountCodes.includes(String(line.accountCode)) ? sum + Number(line.credit || 0) : sum
      ), 0);
      acc.inflow += Math.max(0, cashDebit - cashCredit);
      acc.outflow += Math.max(0, cashCredit - cashDebit);
      return acc;
    }, { inflow: 0, outflow: 0 });

    const invoiceFromLedger = ledgerEntries.reduce((sum, entry) => (
      sum + entry.lines.reduce((lineSum, line) => {
        if (String(line.accountCode) !== "601") return lineSum;
        return lineSum + Number(line.credit || 0) - Number(line.debit || 0);
      }, 0)
    ), 0);

    const collected = Number(Math.max(cashFlow.inflow, sourcePaymentTotal + sourceReceiptTotal).toFixed(2));

    const payablesFromLedger = sumAccountGroup(lookup, ["511", "521", "522", "531", "541"], "credit");

    return {
      invoice: Number(Math.max(invoiceFromLedger, sourceInvoiceTotal + sourceReceiptTotal).toFixed(2)),
      receipts: Number(sourceReceiptTotal.toFixed(2)),
      paidIn: Number(sourcePaymentTotal.toFixed(2)),
      collected,
      cashOut: Number(Math.max(cashFlow.outflow, sourceExpenseTotal).toFixed(2)),
      expenses: Number(Math.max(sumAccountGroup(lookup, ["711", "712", "721", "731"], "debit"), sourceExpenseTotal).toFixed(2)),
      bills: Number(Math.max(sumAccountGroup(lookup, ["531"], "credit"), sourceBillTotal).toFixed(2)),
      receivables: Number(Math.max(sumAccountGroup(lookup, ["211", "231"], "debit"), sourceReceivables).toFixed(2)),
      payables: Number((payablesFromLedger > 0 ? payablesFromLedger : sourcePayables).toFixed(2)),
      bank: Number(Math.max(sumAccountGroup(lookup, cashAccountCodes, "debit"), sourceBank).toFixed(2))
    };
  }, [state]);

  const itemMovementMetrics = useMemo(() => ({
    purchased: state.itemMovements.filter((item) => item.movementType === "Alış").reduce((sum, item) => sum + Number(item.amount || 0), 0),
    sold: state.itemMovements.filter((item) => item.movementType === "Satış").reduce((sum, item) => sum + Number(item.amount || 0), 0),
    stockItems: state.items.filter((item) => item.type !== "Xidmət").length,
    totalUnits: state.items.reduce((sum, item) => sum + Number(item.stockOnHand || 0), 0)
  }), [state]);

  function parseDayCount(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function addDays(dateValue, dayCount) {
    const base = new Date(`${dateValue || today()}T00:00:00`);
    if (Number.isNaN(base.getTime())) return today();
    base.setDate(base.getDate() + Number(dayCount || 0));
    return base.toISOString().slice(0, 10);
  }

  function getCurrentPlan(user = currentUser) {
    if (backendSubscription?.plan?.code) {
      const mappedLegacyPlanId = LEGACY_PLAN_ID_BY_BACKEND_PLAN_CODE[String(backendSubscription.plan.code).toUpperCase()];
      if (mappedLegacyPlanId) {
        return getPlanById(mappedLegacyPlanId);
      }

      return {
        id: backendSubscription.plan.code,
        name: backendSubscription.plan.name || backendSubscription.plan.code,
        monthlyPrice: Number(backendSubscription.plan.priceMinor || 0) / 100,
        annualMonthlyPrice: Number(backendSubscription.plan.priceMinor || 0) / 100,
        currency: backendSubscription.plan.currency || "AZN",
        operationLimit: Number.MAX_SAFE_INTEGER,
        durationDays: 30,
        summaryKey: "sub_freeSummary",
        signupOnly: false,
      };
    }
    if (!user) return getPlanById("free");
    const ownerEmail = getAccountOwnerEmail(user);
    const ownerUser = ownerEmail === user.email ? user : authUsers.find((entry) => entry.email === ownerEmail);
    return getPlanById(ownerUser?.subscription?.planId || user?.subscription?.planId || "free");
  }

  function getPlanStatusText(user = currentUser) {
    if (backendSubscription?.plan?.code) {
      const planLabel = backendSubscription.plan?.name || "Plan";
      const status = String(backendSubscription.status || "ACTIVE");
      const endsAt = backendSubscription.currentPeriodEnd
        ? String(backendSubscription.currentPeriodEnd).slice(0, 10)
        : null;
      return `${planLabel} • ${status}${endsAt ? ` • ${endsAt}` : ""}`;
    }
    if (!user) return "";
    if (user.role === "super_admin") return "Super admin girişi";
    const ownerEmail = getAccountOwnerEmail(user);
    const ownerUser = ownerEmail === user.email ? user : authUsers.find((entry) => entry.email === ownerEmail);
    const plan = getCurrentPlan(user);
    const remainingDays = daysUntil(ownerUser?.subscription?.endsAt || user.subscription?.endsAt);
    if (plan.id === "free") {
      const remainingOperations = Math.max(0, Number(plan.operationLimit || 0) - Number(ownerUser?.operationsUsed || user.operationsUsed || 0));
      return `${plan.name} • ${remainingOperations} əməliyyat qalıb`;
    }
    const staffLabel = isInternalUser(user) && user.staffRole ? ` • ${user.staffRole}` : "";
    const remainingOperations = Math.max(0, Number(plan.operationLimit || 0) - Number(ownerUser?.operationsUsed || 0));
    if (remainingDays === null) return `${plan.name}${staffLabel} • ${remainingOperations} əməliyyat`;
    return `${plan.name}${staffLabel} • ${remainingDays} gün / ${remainingOperations} əməliyyat`;
  }

  function canUsePaidFeatures(user = currentUser) {
    if (!user) return false;
    if (user.role === "super_admin") return true;
    const ownerEmail = getAccountOwnerEmail(user);
    const ownerUser = ownerEmail === user.email ? user : authUsers.find((entry) => entry.email === ownerEmail);
    const plan = getCurrentPlan(user);
    return Number(ownerUser?.operationsUsed || 0) < Number(plan.operationLimit || 0);
  }

  function markOperationUsage(step = 1) {
    if (!currentUser || currentUser.role === "super_admin") return;
    const ownerEmail = getAccountOwnerEmail(currentUser);
    setAuthUsers((current) => current.map((user) => user.email === ownerEmail ? normalizeAuthUser({ ...user, operationsUsed: Number(user.operationsUsed || 0) + step }) : user));
  }

  function guardOperationAccess() {
    if (canUsePaidFeatures()) return true;
    const plan = getCurrentPlan();
    setBackupStatus({
      tone: "warning",
      message: `${plan.name} planı üçün əməliyyat limiti bitib. Davam etmək üçün planı yeniləyin və ya daha yüksək paket seçin.`
    });
    setAccountPanel("plans");
    setProfileMenuOpen(false);
    return false;
  }

  function isAtFreePlanEntityLimit(entity) {
    if (!currentUser || currentUser.role === "super_admin") return false;
    if (getCurrentPlan().id !== "free") return false;
    const counts = { customers: state.customers.length, vendors: state.vendors.length, invoices: state.invoices.length };
    return (counts[entity] ?? 0) >= (FREE_PLAN_ENTITY_LIMITS[entity] ?? Infinity);
  }

  function applySubscriptionToUser(email, planId, billingCycle = "annual", durationDays = null) {
    const plan = getPlanById(planId);
    const nextDuration = durationDays ?? getPlanDurationDays(plan, billingCycle);
    setAuthUsers((current) => current.map((user) => {
      if (user.email !== email) return user;
      return normalizeAuthUser({
        ...user,
        operationsUsed: 0,
        subscription: {
          ...user.subscription,
          planId: plan.id,
          billingCycle: plan.id === "free" ? "free" : plan.id === "demo" ? "demo" : billingCycle,
          startedAt: today(),
          endsAt: plan.id === "free" ? null : addDays(today(), nextDuration || 30),
          autoDowngraded: "Xeyr"
        }
      });
    }));
    setBackupStatus({
      tone: "success",
      message: plan.id === "demo" || billingCycle === "demo"
        ? `${email} üçün 14 günlük Demo aktiv edildi. Müddət bitəndə hesab avtomatik Free plana keçəcək.`
        : `${plan.name} planı ${email} üçün ${billingCycle === "monthly" ? "1 aylıq" : "illik"} aktiv edildi.`
    });
  }

  function createTeamMember(event) {
    event.preventDefault();
    if (!currentUser || !canManageTeam(currentUser)) return;

    const ownerEmail = getAccountOwnerEmail(currentUser);
    const email = String(teamMemberDraft.email || "").trim().toLowerCase();
    if (!teamMemberDraft.fullName || !email || !teamMemberDraft.password) {
      setBackupStatus({ tone: "warning", message: at.backup_fillAll });
      return;
    }
    if (authUsers.some((user) => user.email.toLowerCase() === email)) {
      setBackupStatus({ tone: "warning", message: "Bu e-poçt ilə artıq istifadəçi mövcuddur." });
      return;
    }

    const config = getStaffRoleConfig(teamMemberDraft.staffRole);
    const usedCount = authUsers.filter((user) => getAccountOwnerEmail(user) === ownerEmail && isInternalUser(user) && user.staffRole === teamMemberDraft.staffRole).length;
    if (usedCount >= config.maxUsers) {
      setBackupStatus({ tone: "warning", message: `${teamMemberDraft.staffRole} üçün maksimum ${config.maxUsers} nəfər yaratmaq olar.` });
      return;
    }

    const nextUser = normalizeAuthUser({
      id: crypto.randomUUID(),
      fullName: teamMemberDraft.fullName,
      email,
      role: "internal_user",
      accountType: "internal",
      accountOwnerEmail: ownerEmail,
      staffRole: teamMemberDraft.staffRole
    });

    setAuthUsers((current) => [...current, nextUser]);
    setTeamMemberDraft({ fullName: "", email: "", password: "", staffRole: "Admin" });
    setBackupStatus({ tone: "success", message: `${teamMemberDraft.staffRole} rolu ilə yeni istifadəçi yaradıldı.` });
  }

  function removeTeamMember(userEmail) {
    setAuthUsers((current) => current.filter((user) => user.email !== userEmail));
    setBackupStatus({ tone: "success", message: "Daxili istifadəçi silindi." });
  }

  function openPaymentPanel(planCode, billingCycle) {
    setPaymentDraft({ planCode, billingCycle });
    setPaymentTermsAccepted(false);
    setCheckoutResult(null);
    setPaymentStatusDraft("SUCCESS");
    setAccountPanel("payment");
  }

  function openBooksLegalPage(view) {
    if (!COMPLIANCE_LEGAL_PAGES.some((page) => page.id === view)) return;
    setAccountPanel(null);
    setActiveProduct("booksLanding");
    setBooksView(view);
    setBooksNotice("");
    setShowPassword(false);
  }

  async function submitTestPayment() {
    if (!currentUser || !paymentDraft.planCode) {
      setBooksNotice("Plan seçimi tapılmadı.");
      return;
    }

    try {
      setSubscriptionLoading(true);
      const selectedPlan = backendPlans.find((plan) => String(plan.code || "") === String(paymentDraft.planCode));
      if (!selectedPlan) {
        throw new Error(`Unknown plan code selected: ${paymentDraft.planCode}`);
      }

      const targetPlanCode = toBackendPlanCode(selectedPlan.code);
      const upgrade = await apiUpgradeSubscription(targetPlanCode, updateBackendSession);
      const checkout = await apiCheckout(upgrade.orderId, updateBackendSession);

      setCheckoutResult({
        orderId: upgrade.orderId,
        paymentTransactionId: checkout.paymentTransactionId,
        gatewayPaymentId: checkout.gatewayPaymentId,
        checkoutUrl: checkout.checkoutUrl,
      });

      await syncBackendSubscription();
      setBooksNotice("Upgrade order və checkout hazırlandı. Mock nəticəni seçib tamamlayın.");
    } catch (error) {
      setBooksNotice(error?.message || "Upgrade/checkout alınmadı.");
    } finally {
      setSubscriptionLoading(false);
    }
  }

  async function submitMockPaymentResult() {
    if (!checkoutResult?.gatewayPaymentId) {
      setBooksNotice("Əvvəlcə checkout yaradın.");
      return;
    }

    try {
      setSubscriptionLoading(true);
      await apiMockWebhook({
        eventId: crypto.randomUUID(),
        gatewayPaymentId: checkoutResult.gatewayPaymentId,
        status: paymentStatusDraft,
        payload: {
          source: "frontend-ui",
          orderId: checkoutResult.orderId,
        },
      });

      await syncBackendSubscription();
      const updatedOrders = await apiGetMyOrders(updateBackendSession);
      setBackendOrders(Array.isArray(updatedOrders) ? updatedOrders : []);

      setBooksNotice(
        paymentStatusDraft === "SUCCESS"
          ? "Mock payment SUCCESS tətbiq edildi. Abunəlik yeniləndi."
          : "Mock payment FAILED tətbiq edildi. Abunəlik dəyişmədən qaldı.",
      );
    } catch (error) {
      setBooksNotice(error?.message || "Mock payment callback alınmadı.");
    } finally {
      setSubscriptionLoading(false);
    }
  }

  function getAccessibleNavItems(user = currentUser) {
    if (!user || user.role === "super_admin" || !isInternalUser(user)) return NAV;
    const allowed = new Set(getStaffRoleConfig(user.staffRole).sections);
    return NAV.filter((item) => allowed.has(item.id));
  }

  function toLocalDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getReportRange() {
    const current = new Date(`${today()}T00:00:00`);
    if (Number.isNaN(current.getTime())) {
      return { start: today(), end: today() };
    }

    const end = toLocalDateValue(current);
    const year = current.getFullYear();
    const month = current.getMonth();

    if (reportPeriod === "Bu ay") {
      return {
        start: toLocalDateValue(new Date(year, month, 1)),
        end
      };
    }

    if (reportPeriod === "Bu rüb") {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      return {
        start: toLocalDateValue(new Date(year, quarterStartMonth, 1)),
        end
      };
    }

    return {
      start: `${state.settings.fiscalYear || year}-01-01`,
      end
    };
  }

  function getPreviousReportRange() {
    const current = new Date(`${today()}T00:00:00`);
    if (Number.isNaN(current.getTime())) {
      return { start: today(), end: today() };
    }

    const year = current.getFullYear();
    const month = current.getMonth();

    if (reportPeriod === "Bu ay") {
      const previousMonthStart = new Date(year, month - 1, 1);
      const previousMonthEnd = new Date(year, month, 0);
      return {
        start: toLocalDateValue(previousMonthStart),
        end: toLocalDateValue(previousMonthEnd)
      };
    }

    if (reportPeriod === "Bu rüb") {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const previousQuarterStart = new Date(year, quarterStartMonth - 3, 1);
      const previousQuarterEnd = new Date(year, quarterStartMonth, 0);
      return {
        start: toLocalDateValue(previousQuarterStart),
        end: toLocalDateValue(previousQuarterEnd)
      };
    }

    const fiscalYear = Number(state.settings.fiscalYear || year);
    return {
      start: `${fiscalYear - 1}-01-01`,
      end: `${fiscalYear - 1}-12-31`
    };
  }

  function getRangeBefore(range) {
    const startDate = new Date(`${range?.start || today()}T00:00:00`);
    if (Number.isNaN(startDate.getTime())) {
      return { start: today(), end: today() };
    }

    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    if (reportPeriod === "Bu ay") {
      const previousMonthStart = new Date(year, month - 1, 1);
      const previousMonthEnd = new Date(year, month, 0);
      return {
        start: toLocalDateValue(previousMonthStart),
        end: toLocalDateValue(previousMonthEnd)
      };
    }

    if (reportPeriod === "Bu rüb") {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const previousQuarterStart = new Date(year, quarterStartMonth - 3, 1);
      const previousQuarterEnd = new Date(year, quarterStartMonth, 0);
      return {
        start: toLocalDateValue(previousQuarterStart),
        end: toLocalDateValue(previousQuarterEnd)
      };
    }

    const targetYear = year - 1;
    return {
      start: `${targetYear}-01-01`,
      end: `${targetYear}-12-31`
    };
  }

  function getRangeLabel(range) {
    return `${fmtDate(range.start)} - ${fmtDate(range.end)}`;
  }

  function isDateInRange(value, range) {
    if (!value || !range) return false;
    return String(value) >= range.start && String(value) <= range.end;
  }

  function isDateBeforeRange(value, range) {
    if (!value || !range) return false;
    return String(value) < range.start;
  }

  function extractTaxRate(label) {
    const match = String(label || "").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  }

  function getSequenceField(moduleId) {
    return {
      quotes: "quoteNumber",
      invoices: "invoiceNumber",
      salesReceipts: "receiptNumber",
      paymentsReceived: "paymentNumber",
      creditNotes: "creditNumber",
      bills: "billNumber",
      expenses: "expenseNumber",
      manualJournals: "journalNumber"
    }[moduleId];
  }

  function getSequencePrefix(moduleId) {
    return {
      quotes: state.settings.quotePrefix || "TEK",
      invoices: state.settings.invoicePrefix || "INV",
      salesReceipts: "SQB",
      paymentsReceived: "ODE",
      creditNotes: "KRN",
      bills: "HSF",
      expenses: "XRC",
      manualJournals: "MJ"
    }[moduleId];
  }

  function buildSequenceNumber(moduleId) {
    const config = MODULES[moduleId];
    const field = getSequenceField(moduleId);
    if (!config || !field || state.settings.numberingMode === "Əl ilə") return "";
    const nextIndex = state[config.collection].length + 1;
    return `${getSequencePrefix(moduleId)}-${state.settings.fiscalYear}-${String(nextIndex).padStart(3, "0")}`;
  }

  function startIncomingGoodsEntry() {
    setDrafts((current) => ({ ...current, incomingGoodsServices: createModuleDraft("incomingGoodsServices") }));
    setEditing((current) => ({ ...current, incomingGoodsServices: null }));
  }

  function moduleSupportsSalesControls(moduleId) {
    return ["quotes", "invoices", "salesReceipts", "recurringInvoices", "paymentsReceived", "creditNotes"].includes(moduleId);
  }

  function moduleSupportsPurchaseControls(moduleId) {
    return ["bills", "expenses"].includes(moduleId);
  }

  function moduleSupportsCommercialTotals(moduleId) {
    return ["quotes", "invoices", "salesReceipts", "creditNotes", "bills", "expenses"].includes(moduleId);
  }

  function roundDocumentAmount(amount, roundingMode) {
    if (roundingMode === "Məbləği ən yaxın tam ədədə yuvarlaqlaşdır") return Math.round(amount);
    if (roundingMode === "Məbləği ən yaxın artım dəyərinə yuvarlaqlaşdır") return Math.round(amount / 5) * 5;
    return amount;
  }

  function calculateCommercialTotals(moduleId, draft) {
    const baseAmount = Number(draft.amount || 0);
    const discountValue = moduleSupportsSalesControls(moduleId) && state.settings.discountMode !== "Endirim verilmir" ? Number(draft.discountValue || 0) : 0;
    const shippingAmount = moduleSupportsSalesControls(moduleId) && state.settings.shippingCharge === "Bəli" ? Number(draft.shippingAmount || 0) : 0;
    const adjustmentAmount = (moduleSupportsSalesControls(moduleId) || moduleSupportsPurchaseControls(moduleId)) && state.settings.additionalAdjustment === "Bəli" ? Number(draft.adjustmentAmount || 0) : 0;
    const taxRate = extractTaxRate(draft.taxLabel || state.settings.defaultTaxLabel);

    let taxableBase = baseAmount;
    if (moduleSupportsSalesControls(moduleId) && state.settings.discountMode !== "Endirim verilmir" && state.settings.discountTiming === "Vergidən əvvəl endirim") {
      taxableBase -= discountValue;
    }

    let taxAmount = 0;
    if (moduleId !== "expenses" && (draft.taxMode || state.settings.taxMode) === "Vergi xaric" && taxRate > 0) {
      taxAmount = Math.max(taxableBase, 0) * (taxRate / 100);
    }

    let totalAmount = baseAmount + shippingAmount + adjustmentAmount + taxAmount;
    if (moduleSupportsSalesControls(moduleId) && state.settings.discountMode !== "Endirim verilmir") {
      totalAmount -= discountValue;
    }
    if (moduleSupportsSalesControls(moduleId)) {
      totalAmount = roundDocumentAmount(totalAmount, state.settings.salesRoundingMode);
    }

    return {
      baseAmount,
      discountValue,
      shippingAmount,
      adjustmentAmount,
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2))
    };
  }

  function createDefaultJournalLines(record = null) {
    if (Array.isArray(record?.journalLines) && record.journalLines.length) {
      return record.journalLines.map((line, index) => ({
        id: line.id || `journal-line-${index + 1}`,
        accountCode: line.accountCode || "",
        entryType: line.entryType || "Debet",
        amount: String(line.amount || 0),
        linkedQuantity: String(line.linkedQuantity || 0),
        linkedUnit: line.linkedUnit || "",
        subledgerCategory: line.subledgerCategory || getDefaultJournalSubledgerCategory(line.accountCode || ""),
        linkedEntityType: line.linkedEntityType || "",
        linkedEntityId: line.linkedEntityId || "",
        linkedEntityName: line.linkedEntityName || ""
      }));
    }

    if (record?.debitAccount || record?.creditAccount) {
      return [
        { id: "journal-line-1", accountCode: record.debitAccount || "", entryType: "Debet", amount: String(record.debit || 0), linkedQuantity: "0", linkedUnit: "", subledgerCategory: getDefaultJournalSubledgerCategory(record.debitAccount || ""), linkedEntityType: "", linkedEntityId: "", linkedEntityName: "" },
        { id: "journal-line-2", accountCode: record.creditAccount || "", entryType: "Kredit", amount: String(record.credit || 0), linkedQuantity: "0", linkedUnit: "", subledgerCategory: getDefaultJournalSubledgerCategory(record.creditAccount || ""), linkedEntityType: "", linkedEntityId: "", linkedEntityName: "" }
      ];
    }

    return [
      { id: "journal-line-1", accountCode: "", entryType: "Debet", amount: "0", linkedQuantity: "0", linkedUnit: "", subledgerCategory: "goods", linkedEntityType: "", linkedEntityId: "", linkedEntityName: "" },
      { id: "journal-line-2", accountCode: "", entryType: "Kredit", amount: "0", linkedQuantity: "0", linkedUnit: "", subledgerCategory: "goods", linkedEntityType: "", linkedEntityName: "", linkedEntityId: "" }
    ];
  }

  function getManualJournalAnalysis(draft) {
    const lines = Array.isArray(draft.journalLines) ? draft.journalLines : [];
    const filledLines = lines.filter((line) => line.accountCode && Number(line.amount || 0) > 0);
    const debitTotal = filledLines.filter((line) => line.entryType === "Debet").reduce((sum, line) => sum + Number(line.amount || 0), 0);
    const creditTotal = filledLines.filter((line) => line.entryType === "Kredit").reduce((sum, line) => sum + Number(line.amount || 0), 0);
    const debitCodes = new Set(filledLines.filter((line) => line.entryType === "Debet").map((line) => line.accountCode));
    const conflictingCode = filledLines.find((line) => line.entryType === "Kredit" && debitCodes.has(line.accountCode))?.accountCode || "";

    return {
      lines,
      filledLines,
      debitTotal: Number(debitTotal.toFixed(2)),
      creditTotal: Number(creditTotal.toFixed(2)),
      difference: Number((debitTotal - creditTotal).toFixed(2)),
      conflictingCode,
      isBalanced: filledLines.length >= 2 && debitTotal > 0 && creditTotal > 0 && debitTotal === creditTotal && !conflictingCode
    };
  }

  function createModuleDraft(moduleId, record = null) {
    const baseDraft = buildDraft(moduleId, record);
    if (record) {
      if (moduleId === "incomingGoodsServices") {
        return {
          ...baseDraft,
          ...record,
          lineItems: Array.isArray(record.lineItems) && record.lineItems.length > 0 ? record.lineItems : [createDefaultLineItem()],
          discount: String(record.discount ?? "0"),
          adjustment: String(record.adjustment ?? "0")
        };
      }
      if (moduleId === "invoices") {
        return {
          ...baseDraft,
          ...record,
          customerId: record.customerId || "",
          lineItems: Array.isArray(record.lineItems) && record.lineItems.length > 0
            ? record.lineItems.map((item) => ({
                ...item,
                accountCode: normalizeAccountCodeInput(item.accountCode || item.account || "", "601")
              }))
            : [createDefaultSalesLineItem()],
          discount: String(record.discount ?? "0"),
          adjustment: String(record.adjustment ?? "0"),
          notes: record.notes || ""
        };
      }
      if (moduleId === "manualJournals") {
        return { ...baseDraft, ...record, accountTypeFilter: record.accountTypeFilter || "Hamısı", journalLines: createDefaultJournalLines(record) };
      }
      return { ...baseDraft, ...record };
    }

    const nextDraft = { ...baseDraft };
    if (moduleId === "itemsCatalog") {
      nextDraft.salesTax = state.settings.defaultTaxLabel;
      nextDraft.purchaseTax = nextDraft.purchaseTax || "ƏDV 18%";
    }
    if (moduleId === "manualJournals") {
      nextDraft.accountTypeFilter = "Hamısı";
      nextDraft.journalLines = createDefaultJournalLines();
    }
    if (moduleId === "incomingGoodsServices") {
      const count = state.incomingGoodsServices.length + 1;
      nextDraft.billNumber = `QAIMƏ-${String(count).padStart(3, "0")}`;
      nextDraft.billDate = nextDraft.billDate || today();
      nextDraft.vendorName = nextDraft.vendorName || "";
      nextDraft.notes = nextDraft.notes || "";
      nextDraft.discount = nextDraft.discount || "0";
      nextDraft.adjustment = nextDraft.adjustment || "0";
      nextDraft.lineItems = [createDefaultLineItem()];
      nextDraft.subTotal = 0;
      nextDraft.discountAmount = 0;
      nextDraft.totalAmount = 0;
    }
    if (moduleId === "invoices") {
      nextDraft.customerId = nextDraft.customerId || "";
      nextDraft.customerName = nextDraft.customerName || "";
      nextDraft.issueDate = nextDraft.issueDate || today();
      nextDraft.status = nextDraft.status || "Qaralama";
      nextDraft.notes = nextDraft.notes || "";
      nextDraft.discount = nextDraft.discount || "0";
      nextDraft.adjustment = nextDraft.adjustment || "0";
      nextDraft.lineItems = [createDefaultSalesLineItem()];
      nextDraft.subTotal = 0;
      nextDraft.discountAmount = 0;
      nextDraft.totalAmount = 0;
      nextDraft.amount = 0;
    }
    const sequenceField = getSequenceField(moduleId);
    if (sequenceField && !nextDraft[sequenceField]) {
      nextDraft[sequenceField] = buildSequenceNumber(moduleId);
    }

    if (moduleId === "invoices" || moduleId === "bills") {
      nextDraft.paymentTerm = state.settings.defaultPaymentTerm;
      nextDraft.dueDate = addDays(today(), parseDayCount(state.settings.defaultPaymentTerm));
    }

    if (moduleSupportsSalesControls(moduleId) || moduleSupportsPurchaseControls(moduleId)) {
      nextDraft.taxLabel = state.settings.defaultTaxLabel;
      nextDraft.taxMode = state.settings.taxMode;
      nextDraft.adjustmentAmount = "0";
    }

    if (moduleSupportsSalesControls(moduleId)) {
      nextDraft.discountValue = "0";
      nextDraft.shippingAmount = "0";
      nextDraft.salesperson = "";
      nextDraft.discountMode = state.settings.discountMode;
      nextDraft.discountTiming = state.settings.discountTiming;
      nextDraft.roundOffTaxMode = state.settings.roundOffTaxMode;
      nextDraft.salesRoundingMode = state.settings.salesRoundingMode;
    }

    return nextDraft;
  }

  function buildOperationalPayload(moduleId, draft) {
    const payload = {};

    if (moduleId === "itemsCatalog") {
      payload.salesTax = state.settings.defaultTaxLabel;
      payload.purchaseTax = draft.purchaseTax || "ƏDV 18%";
    }

    if (moduleId === "invoices" || moduleId === "bills") {
      payload.paymentTerm = draft.paymentTerm || state.settings.defaultPaymentTerm;
    }

    if (moduleSupportsSalesControls(moduleId) || moduleSupportsPurchaseControls(moduleId)) {
      payload.taxLabel = draft.taxLabel || state.settings.defaultTaxLabel;
      payload.taxMode = draft.taxMode || state.settings.taxMode;
      payload.adjustmentAmount = Number(draft.adjustmentAmount || 0);
    }

    if (moduleSupportsSalesControls(moduleId)) {
      payload.discountValue = state.settings.discountMode === "Endirim verilmir" ? 0 : Number(draft.discountValue || 0);
      payload.shippingAmount = state.settings.shippingCharge === "Bəli" ? Number(draft.shippingAmount || 0) : 0;
      payload.salesperson = state.settings.salespersonField === "Bəli" ? draft.salesperson || "" : "";
      payload.discountMode = state.settings.discountMode;
      payload.discountTiming = state.settings.discountTiming;
      payload.roundOffTaxMode = state.settings.roundOffTaxMode;
      payload.salesRoundingMode = state.settings.salesRoundingMode;
    }

    if (moduleSupportsCommercialTotals(moduleId)) {
      const totalsForPayload = calculateCommercialTotals(moduleId, draft);
      payload.baseAmount = totalsForPayload.baseAmount;
      payload.taxAmount = totalsForPayload.taxAmount;
      payload.amount = totalsForPayload.totalAmount;
    }

    return payload;
  }

  function renderOperationalFields(moduleId, draft) {
    if (!moduleSupportsSalesControls(moduleId) && !moduleSupportsPurchaseControls(moduleId) && moduleId !== "invoices" && moduleId !== "bills") {
      return null;
    }

    const totalsForPreview = moduleSupportsCommercialTotals(moduleId) ? calculateCommercialTotals(moduleId, draft) : null;

    return (
      <section className="ops-binding-card">
        <div className="panel-head compact-head">
          <div>
            <h3>{at.ops_liveTitle}</h3>
            <p className="panel-copy">{at.ops_liveDesc}</p>
          </div>
          <span>{at.ops_liveBadge}</span>
        </div>
        <div className="ops-bound-grid">
          {(moduleId === "invoices" || moduleId === "bills") ? (
            <label>
              <span>{at.ops_paymentDuration}</span>
              <select value={draft.paymentTerm || state.settings.defaultPaymentTerm} onChange={(event) => {
                const paymentTerm = event.target.value;
                updateDraft(moduleId, "paymentTerm", paymentTerm);
                updateDraft(moduleId, "dueDate", addDays(today(), parseDayCount(paymentTerm)));
              }}>
                <option value="7 gün">{at.ops_7days}</option>
                <option value="15 gün">{at.ops_15days}</option>
                <option value="30 gün">{at.ops_30days}</option>
                <option value="45 gün">{at.ops_45days}</option>
              </select>
            </label>
          ) : null}
          {(moduleSupportsSalesControls(moduleId) || moduleSupportsPurchaseControls(moduleId)) ? (
            <label>
              <span>{at.ops_taxLabel}</span>
              <input value={draft.taxLabel || state.settings.defaultTaxLabel} onChange={(event) => updateDraft(moduleId, "taxLabel", event.target.value)} />
            </label>
          ) : null}
          {(moduleSupportsSalesControls(moduleId) || moduleSupportsPurchaseControls(moduleId)) ? (
            <label>
              <span>{at.ops_taxMode}</span>
              <input value={draft.taxMode || state.settings.taxMode} readOnly />
            </label>
          ) : null}
          {moduleSupportsSalesControls(moduleId) && state.settings.salespersonField === "Bəli" ? (
            <label>
              <span>{at.inv_form_salesperson}</span>
              <input value={draft.salesperson || ""} onChange={(event) => updateDraft(moduleId, "salesperson", event.target.value)} placeholder="Ad və soyad" />
            </label>
          ) : null}
          {moduleSupportsSalesControls(moduleId) && state.settings.discountMode !== "Endirim verilmir" ? (
            <label>
              <span>{state.settings.discountMode === "Sətir səviyyəsində" ? at.inv_form_lineDiscount : at.inv_form_docDiscount}</span>
              <input type="number" step="0.01" value={draft.discountValue || "0"} onChange={(event) => updateDraft(moduleId, "discountValue", event.target.value)} />
            </label>
          ) : null}
          {moduleSupportsSalesControls(moduleId) && state.settings.shippingCharge === "Bəli" ? (
            <label>
              <span>{at.inv_form_shipping}</span>
              <input type="number" step="0.01" value={draft.shippingAmount || "0"} onChange={(event) => updateDraft(moduleId, "shippingAmount", event.target.value)} />
            </label>
          ) : null}
          {(moduleSupportsSalesControls(moduleId) || moduleSupportsPurchaseControls(moduleId)) && state.settings.additionalAdjustment === "Bəli" ? (
            <label>
              <span>{at.inv_form_adjustment}</span>
              <input type="number" step="0.01" value={draft.adjustmentAmount || "0"} onChange={(event) => updateDraft(moduleId, "adjustmentAmount", event.target.value)} />
            </label>
          ) : null}
        </div>
        {totalsForPreview ? (
          <div className="ops-preview-strip">
            <div><span>{at.inv_form_baseAmt}</span><strong>{currency(totalsForPreview.baseAmount, state.settings.currency)}</strong></div>
            <div><span>{at.inv_form_taxShort}</span><strong>{currency(totalsForPreview.taxAmount, state.settings.currency)}</strong></div>
            {moduleSupportsSalesControls(moduleId) && state.settings.discountMode !== "Endirim verilmir" ? <div><span>{at.inv_form_discount}</span><strong>{currency(totalsForPreview.discountValue, state.settings.currency)}</strong></div> : null}
            {moduleSupportsSalesControls(moduleId) && state.settings.shippingCharge === "Bəli" ? <div><span>{at.inv_form_shippingShort}</span><strong>{currency(totalsForPreview.shippingAmount, state.settings.currency)}</strong></div> : null}
            {(moduleSupportsSalesControls(moduleId) || moduleSupportsPurchaseControls(moduleId)) && state.settings.additionalAdjustment === "Bəli" ? <div><span>{at.inv_form_adjustment2}</span><strong>{currency(totalsForPreview.adjustmentAmount, state.settings.currency)}</strong></div> : null}
            <div><span>{at.inv_form_yekun}</span><strong>{currency(totalsForPreview.totalAmount, state.settings.currency)}</strong></div>
          </div>
        ) : null}
      </section>
    );
  }

  function isLowStockItem(item) {
    return state.settings.stockWarning === "Bəli"
      && item.trackInventory === "Bəli"
      && item.type !== "Xidmət"
      && Number(item.reorderPoint || 0) > 0
      && Number(item.stockOnHand || 0) <= Number(item.reorderPoint || 0);
  }

  function resolveMovementTaxLabel(item, movementType, draftTaxLabel = "") {
    if (movementType === "Satış") {
      return state.settings.defaultTaxLabel;
    }

    return draftTaxLabel || item?.purchaseTax || "ƏDV 18%";
  }

  function calculateTaxBreakdown(amount, taxLabel, taxMode = "Vergi xaric") {
    const taxRate = extractTaxRate(taxLabel);
    if (!taxRate || taxLabel === "ƏDV-dən azad") {
      return { taxRate, baseAmount: Number(amount || 0), taxAmount: 0, totalAmount: Number(amount || 0) };
    }

    if (taxMode === "Vergi daxil") {
      const totalAmount = Number(amount || 0);
      const baseAmount = totalAmount / (1 + (taxRate / 100));
      const taxAmount = totalAmount - baseAmount;
      return {
        taxRate,
        baseAmount: Number(baseAmount.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2))
      };
    }

    const baseAmount = Number(amount || 0);
    const taxAmount = baseAmount * (taxRate / 100);
    return {
      taxRate,
      baseAmount: Number(baseAmount.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount: Number((baseAmount + taxAmount).toFixed(2))
    };
  }

  function getAccountNameByCode(code) {
    return state.chartOfAccounts.find((account) => account.accountCode === code)?.accountName || ({
      101: "Intangible assets",
      111: "Property, plant and equipment",
      131: "Long-term financial investments",
      201: "Inventories",
      205: "Goods purchased",
      211: "Short-term receivables",
      221: "Cash on hand",
      223: "Bank settlement accounts",
      241: "Recoverable VAT",
      301: "Share capital",
      341: "Retained earnings",
      411: "Long-term bank loans",
      511: "Short-term bank loans",
      521: "Tax and statutory liabilities",
      531: "Short-term accounts payable to suppliers",
      601: "Sales revenue",
      611: "Other operating income",
      701: "Cost of goods sold",
      711: "Selling expenses",
      712: "Administrative expenses",
      721: "Financial expenses",
      731: "Other operating expenses",
      801: "Profit or loss",
      901: "Income tax"
    }[code] || code);
  }

  function isVisibleAccount(account) {
    return /^\d{3}$/.test(String(account?.accountCode || ""));
  }

  function getMovementLedgerEntries(movement) {
    const entries = [];
    const linkedItem = state.items.find((item) => item.id === movement.itemId);
    const resolvedTaxLabel = movement.taxLabel || (movement.movementType === "Satış" ? state.settings.defaultTaxLabel : linkedItem?.purchaseTax || "ƏDV 18%");
    const amount = Number(movement.baseAmount || (Number(movement.quantity || 0) * Number(movement.unitPrice || 0)));
    const taxAmount = Number(movement.taxAmount || calculateTaxBreakdown(amount, resolvedTaxLabel, movement.movementType === "Satış" ? state.settings.taxMode : "Vergi xaric").taxAmount);
    const totalAmount = Number(movement.amount || (amount + taxAmount));
    const costAmount = Number(movement.costAmount || (movement.movementType === "Satış" && linkedItem?.type !== "Xidmət" ? Number((Number(movement.quantity || 0) * Number(linkedItem?.purchaseRate || 0)).toFixed(2)) : 0));
    const itemType = movement.itemType || linkedItem?.type || "Xidmət";

    if (movement.movementType === "Alış") {
      entries.push({ key: `${movement.id}-purchase-main`, accountCode: itemType === "Xidmət" ? "712" : "201", accountName: getAccountNameByCode(itemType === "Xidmət" ? "712" : "201"), debit: amount, credit: 0 });
      if (taxAmount > 0) {
        entries.push({ key: `${movement.id}-purchase-vat`, accountCode: "241", accountName: getAccountNameByCode("241"), debit: taxAmount, credit: 0 });
      }
      entries.push({ key: `${movement.id}-purchase-creditor`, accountCode: "531", accountName: getAccountNameByCode("531"), debit: 0, credit: totalAmount });
    }

    if (movement.movementType === "Satış") {
      entries.push({ key: `${movement.id}-sale-debtor`, accountCode: "231", accountName: getAccountNameByCode("231"), debit: totalAmount, credit: 0 });
      entries.push({ key: `${movement.id}-sale-income`, accountCode: "601", accountName: getAccountNameByCode("601"), debit: 0, credit: amount });
      if (taxAmount > 0) {
        entries.push({ key: `${movement.id}-sale-vat`, accountCode: "521", accountName: getAccountNameByCode("521"), debit: 0, credit: taxAmount });
      }
      if (itemType !== "Xidmət" && costAmount > 0) {
        entries.push({ key: `${movement.id}-sale-cogs`, accountCode: "701", accountName: getAccountNameByCode("701"), debit: costAmount, credit: 0 });
        entries.push({ key: `${movement.id}-sale-stock`, accountCode: "201", accountName: getAccountNameByCode("201"), debit: 0, credit: costAmount });
      }
    }

    return entries;
  }

  function getIncomingGoodsLedgerEntries(entry) {
    // New bill structure with lineItems
    if (Array.isArray(entry.lineItems) && entry.lineItems.length > 0) {
      const allEntries = [];
      entry.lineItems.forEach((item, i) => {
        const baseAmount = Number(item.baseAmount || (Number(item.quantity || 0) * Number(item.rate || 0)));
        const taxAmount = Number(item.taxAmount || 0);
        const accountCode = normalizeAccountCodeInput(item.accountCode || item.account || "", "205");
        if (baseAmount > 0) {
          allEntries.push({ key: `${entry.id}-line${i}-main`, accountCode, accountName: getAccountNameByCode(accountCode), debit: baseAmount, credit: 0 });
        }
        if (taxAmount > 0) {
          allEntries.push({ key: `${entry.id}-line${i}-vat`, accountCode: "241", accountName: getAccountNameByCode("241"), debit: taxAmount, credit: 0 });
        }
      });
      const totalAmount = Number(entry.totalAmount || 0);
      if (totalAmount > 0) {
        allEntries.push({ key: `${entry.id}-creditor`, accountCode: "531", accountName: getAccountNameByCode("531"), debit: 0, credit: totalAmount });
      }
      return allEntries;
    }
    // Legacy flat structure
    const baseAmount = Number(entry.baseAmount || (Number(entry.quantity || 0) * Number(entry.price || 0)));
    const vatAmount = Number(entry.vatAmount || 0);
    const totalAmount = Number(entry.totalAmount || (baseAmount + vatAmount));
    return [
      { key: `${entry.id}-incoming-main`, accountCode: "205", accountName: getAccountNameByCode("205"), debit: baseAmount, credit: 0 },
      { key: `${entry.id}-incoming-vat`, accountCode: "241", accountName: getAccountNameByCode("241"), debit: vatAmount, credit: 0 },
      { key: `${entry.id}-incoming-creditor`, accountCode: "531", accountName: getAccountNameByCode("531"), debit: 0, credit: totalAmount }
    ].filter((line) => Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0);
  }

  function getInvoiceLedgerEntries(invoice) {
    if (Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0) {
      const allEntries = [];
      let totalDebit = 0;
      invoice.lineItems.forEach((item, i) => {
        const baseAmount = Number(item.baseAmount || (Number(item.quantity || 0) * Number(item.rate || 0)));
        const taxAmount = Number(item.taxAmount || 0);
        const accountCode = normalizeAccountCodeInput(item.accountCode || item.account || "", "601");
        if (baseAmount > 0) {
          allEntries.push({ key: `${invoice.id}-line${i}-income`, accountCode, accountName: getAccountNameByCode(accountCode), debit: 0, credit: baseAmount });
          totalDebit += baseAmount;
        }
        if (taxAmount > 0) {
          allEntries.push({ key: `${invoice.id}-line${i}-vat`, accountCode: "521", accountName: getAccountNameByCode("521"), debit: 0, credit: taxAmount });
          totalDebit += taxAmount;
        }
      });
      if (totalDebit > 0) {
        allEntries.unshift({ key: `${invoice.id}-debtor`, accountCode: "211", accountName: getAccountNameByCode("211"), debit: Number(totalDebit.toFixed(2)), credit: 0 });
      }
      return allEntries;
    }
    const amount = Number(invoice.amount || 0);
    return [
      { key: `${invoice.id}-debtor`, accountCode: "211", accountName: getAccountNameByCode("211"), debit: amount, credit: 0 },
      { key: `${invoice.id}-income`, accountCode: "601", accountName: getAccountNameByCode("601"), debit: 0, credit: amount }
    ].filter((line) => Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0);
  }

  function getAccountTypeMeta(accountType) {
    const normalizedType = normalizeAccountTypeValue(accountType);
    switch (normalizedType) {
      case "Gəlir":
        return { label: "Gəlir hesabı", shortLabel: "Gəlir", className: "income" };
      case "Xərc":
        return { label: "Xərc hesabı", shortLabel: "Xərc", className: "expense" };
      case "Aktiv":
        return { label: "Balans hesabı", shortLabel: "Aktiv", className: "asset" };
      case "Öhdəlik":
        return { label: "Balans hesabı", shortLabel: "Öhdəlik", className: "liability" };
      case "Kapital":
        return { label: "Balans hesabı", shortLabel: "Kapital", className: "equity" };
      default:
        return { label: "Hesab tipi seçilməyib", shortLabel: "Naməlum", className: "neutral" };
    }
  }

  function normalizeAccountTypeValue(accountType) {
    const value = String(accountType || "").trim().toLowerCase();
    if (!value) return "";
    if (["aktiv", "asset", "актив", "varlık", "aktiva"].includes(value)) return "Aktiv";
    if (["öhdəlik", "ohdelik", "liability", "обязательство", "yükümlülük", "verbindlichkeit"].includes(value)) return "Öhdəlik";
    if (["kapital", "equity", "капитал", "özkaynak", "eigenkapital"].includes(value)) return "Kapital";
    if (["gəlir", "gelir", "income", "доход", "ertrag"].includes(value)) return "Gəlir";
    if (["xərc", "xerc", "expense", "расход", "gider", "aufwand"].includes(value)) return "Xərc";
    return String(accountType || "").trim();
  }

  function inferAccountTypeFromCode(accountCode, fallbackType = "") {
    const normalizedFallback = normalizeAccountTypeValue(fallbackType);
    if (normalizedFallback) return normalizedFallback;
    const code = String(accountCode || "").trim();
    if (!/^\d{3}$/.test(code)) return normalizedFallback || "Aktiv";
    if (/^[12]/.test(code)) return "Aktiv";
    if (/^3/.test(code)) return "Kapital";
    if (/^[45]/.test(code)) return "Öhdəlik";
    if (/^6/.test(code)) return "Gəlir";
    if (/^[789]/.test(code)) return "Xərc";
    return "Aktiv";
  }

  function getProfitLossAccountGroups() {
    const visibleAccounts = state.chartOfAccounts.filter((account) => isVisibleAccount(account));
    const accountCodes = visibleAccounts.map((account) => String(account.accountCode || ""));
    const unique = (codes) => [...new Set(codes)];
    const byRegex = (pattern) => accountCodes.filter((code) => pattern.test(code));
    const byType = (type) => visibleAccounts
      .filter((account) => normalizeAccountTypeValue(account.accountType) === type)
      .map((account) => String(account.accountCode || ""));

    const salesRevenue = unique([
      ...byRegex(/^60\d$/),
      ...byType("Gəlir").filter((code) => /^60\d$/.test(code))
    ]);
    const typedIncomeAccounts = byType("Gəlir");
    const typedExpenseAccounts = byType("Xərc");
    const salesRevenueBase = unique([
      ...byRegex(/^60\d$/),
      ...typedIncomeAccounts.filter((code) => /^60\d$/.test(code))
    ]);
    const financeIncomeBase = unique([
      ...byRegex(/^62\d$/),
      ...typedIncomeAccounts.filter((code) => /^62\d$/.test(code))
    ]);
    const otherOperatingIncome = unique([
      ...byRegex(/^(61|63)\d$/),
      ...typedIncomeAccounts.filter((code) => /^(61|63)\d$/.test(code)),
      ...typedIncomeAccounts.filter((code) => !salesRevenueBase.includes(code) && !financeIncomeBase.includes(code))
    ]);
    const financeIncome = financeIncomeBase;
    const costOfSales = unique([
      ...byRegex(/^70\d$/),
      ...typedExpenseAccounts.filter((code) => /^70\d$/.test(code))
    ]);
    const sellingExpenses = unique([
      ...byRegex(/^711$/),
      ...typedExpenseAccounts.filter((code) => /^711$/.test(code))
    ]);
    const administrativeExpenses = unique([
      ...byRegex(/^712$/),
      ...typedExpenseAccounts.filter((code) => /^712$/.test(code))
    ]);
    const financeExpenses = unique([
      ...byRegex(/^72\d$/),
      ...typedExpenseAccounts.filter((code) => /^72\d$/.test(code))
    ]);
    const otherOperatingExpenses = unique([
      ...byRegex(/^73\d$/),
      ...typedExpenseAccounts.filter((code) => /^73\d$/.test(code)),
      ...typedExpenseAccounts.filter((code) => !costOfSales.includes(code) && !sellingExpenses.includes(code) && !administrativeExpenses.includes(code) && !financeExpenses.includes(code) && !/^90\d$/.test(code))
    ]);
    const incomeTax = unique([
      ...byRegex(/^90\d$/),
      ...typedExpenseAccounts.filter((code) => /^90\d$/.test(code))
    ]);

    return {
      salesRevenue: salesRevenueBase.length ? salesRevenueBase : ["601"],
      otherOperatingIncome: otherOperatingIncome.length ? otherOperatingIncome : ["611", "631"],
      financeIncome: financeIncome.length ? financeIncome : ["621"],
      costOfSales: costOfSales.length ? costOfSales : ["701"],
      sellingExpenses: sellingExpenses.length ? sellingExpenses : ["711"],
      administrativeExpenses: administrativeExpenses.length ? administrativeExpenses : ["712"],
      financeExpenses: financeExpenses.length ? financeExpenses : ["721"],
      otherOperatingExpenses: otherOperatingExpenses.length ? otherOperatingExpenses : ["731"],
      incomeTax: incomeTax.length ? incomeTax : ["901"]
    };
  }

  function getManualJournalProfitLossFallback(range, groups, options = {}) {
    const excludedAutoCloseTypes = new Set(options.excludeAutoCloseTypes || []);
    const totals = {
      salesRevenue: 0,
      otherOperatingIncome: 0,
      financeIncome: 0,
      costOfSales: 0,
      sellingExpenses: 0,
      administrativeExpenses: 0,
      financeExpenses: 0,
      otherOperatingExpenses: 0,
      incomeTax: 0
    };

    const addSignedAmount = (bucket, entryType, amount) => {
      const numericAmount = Number(amount || 0);
      if (numericAmount <= 0) return;
      totals[bucket] += entryType === "Kredit" ? numericAmount : -numericAmount;
    };

    state.manualJournals
      .filter((journal) => !excludedAutoCloseTypes.has(journal.autoCloseType || ""))
      .filter((journal) => isDateInRange(journal.date || journal.createdAt || today(), range))
      .forEach((journal) => {
        const lines = Array.isArray(journal.journalLines) && journal.journalLines.length
          ? journal.journalLines.filter((line) => line.accountCode && Number(line.amount || 0) > 0)
          : [
              journal.debitAccount ? { accountCode: journal.debitAccount, entryType: "Debet", amount: journal.debit } : null,
              journal.creditAccount ? { accountCode: journal.creditAccount, entryType: "Kredit", amount: journal.credit } : null
            ].filter(Boolean);

        lines.forEach((line) => {
          const code = String(line.accountCode || "");
          const accountType = inferAccountTypeFromCode(code, state.chartOfAccounts.find((account) => account.accountCode === code)?.accountType || "");

          if (groups.salesRevenue.includes(code)) return addSignedAmount("salesRevenue", line.entryType, line.amount);
          if (groups.otherOperatingIncome.includes(code)) return addSignedAmount("otherOperatingIncome", line.entryType, line.amount);
          if (groups.financeIncome.includes(code)) return addSignedAmount("financeIncome", line.entryType, line.amount);
          if (groups.costOfSales.includes(code)) return addSignedAmount("costOfSales", line.entryType === "Debet" ? "Kredit" : "Debet", line.amount);
          if (groups.sellingExpenses.includes(code)) return addSignedAmount("sellingExpenses", line.entryType === "Debet" ? "Kredit" : "Debet", line.amount);
          if (groups.administrativeExpenses.includes(code)) return addSignedAmount("administrativeExpenses", line.entryType === "Debet" ? "Kredit" : "Debet", line.amount);
          if (groups.financeExpenses.includes(code)) return addSignedAmount("financeExpenses", line.entryType === "Debet" ? "Kredit" : "Debet", line.amount);
          if (groups.otherOperatingExpenses.includes(code)) return addSignedAmount("otherOperatingExpenses", line.entryType === "Debet" ? "Kredit" : "Debet", line.amount);
          if (groups.incomeTax.includes(code)) return addSignedAmount("incomeTax", line.entryType === "Debet" ? "Kredit" : "Debet", line.amount);

          if (accountType === "Gəlir") {
            addSignedAmount("otherOperatingIncome", line.entryType, line.amount);
          } else if (accountType === "Xərc") {
            addSignedAmount("otherOperatingExpenses", line.entryType === "Debet" ? "Kredit" : "Debet", line.amount);
          }
        });
      });

    return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Number(Math.max(0, value).toFixed(2))]));
  }

  function getProfitLossTotalsFromLookup(lookup, groups) {
    const visibleAccounts = [...lookup.values()]
      .filter((account) => isVisibleAccount(account))
      .map((account) => ({
        code: String(account.accountCode || ""),
        accountType: inferAccountTypeFromCode(account.accountCode, account.accountType)
      }));

    const totalIncome = Number(visibleAccounts
      .filter((account) => account.accountType === "Gəlir")
      .reduce((sum, account) => sum + getReportAccountValue(lookup.get(account.code), "credit"), 0)
      .toFixed(2));

    const totalExpense = Number(visibleAccounts
      .filter((account) => account.accountType === "Xərc")
      .reduce((sum, account) => sum + getReportAccountValue(lookup.get(account.code), "debit"), 0)
      .toFixed(2));

    const salesRevenue = sumAccountGroup(lookup, groups.salesRevenue, "credit");
    const financeIncome = sumAccountGroup(lookup, groups.financeIncome, "credit");
    const costOfSales = sumAccountGroup(lookup, groups.costOfSales, "debit");
    const sellingExpenses = sumAccountGroup(lookup, groups.sellingExpenses, "debit");
    const administrativeExpenses = sumAccountGroup(lookup, groups.administrativeExpenses, "debit");
    const financeExpenses = sumAccountGroup(lookup, groups.financeExpenses, "debit");
    const incomeTax = sumAccountGroup(lookup, groups.incomeTax, "debit");

    const mappedIncome = Number((salesRevenue + financeIncome).toFixed(2));
    const mappedExpense = Number((costOfSales + sellingExpenses + administrativeExpenses + financeExpenses + incomeTax).toFixed(2));

    return {
      salesRevenue,
      financeIncome,
      costOfSales,
      sellingExpenses,
      administrativeExpenses,
      financeExpenses,
      incomeTax,
      otherOperatingIncome: Number(Math.max(0, totalIncome - mappedIncome).toFixed(2)),
      otherOperatingExpenses: Number(Math.max(0, totalExpense - mappedExpense).toFixed(2))
    };
  }

  function buildProfitLossClosingPlan(range = getReportRange(), lookup = getTrialBalanceLookup(range)) {
    const lines = [...lookup.values()]
      .filter((row) => isVisibleAccount(row))
      .filter((row) => !["341", "801"].includes(String(row.accountCode || "")))
      .flatMap((row) => {
        const code = String(row.accountCode || "");
        const normalizedAccountType = normalizeAccountTypeValue(row.accountType);
        const isIncomeAccount = /^6/.test(code) || normalizedAccountType === normalizeAccountTypeValue("income");
        const isExpenseAccount = /^[789]/.test(code) || normalizedAccountType === normalizeAccountTypeValue("expense");
        const accountType = isIncomeAccount ? "Gəlir" : (isExpenseAccount ? "Xərc" : inferAccountTypeFromCode(code, row.accountType));
        const debitValue = Number(row.closingDebit || 0);
        const creditValue = Number(row.closingCredit || 0);
        if (accountType === "Gəlir") {
          return [
            creditValue > 0 ? {
              id: `pl-close-${code}-debit`,
              accountCode: code,
              entryType: "Debet",
              amount: Number(creditValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null,
            debitValue > 0 ? {
              id: `pl-close-${code}-credit`,
              accountCode: code,
              entryType: "Kredit",
              amount: Number(debitValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null
          ].filter(Boolean);
        }
        if (accountType === "Xərc") {
          return [
            debitValue > 0 ? {
              id: `pl-close-${code}-credit`,
              accountCode: code,
              entryType: "Kredit",
              amount: Number(debitValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null,
            creditValue > 0 ? {
              id: `pl-close-${code}-debit`,
              accountCode: code,
              entryType: "Debet",
              amount: Number(creditValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null
          ].filter(Boolean);
        }
        return [];
      });

    const debitTotal = Number(lines.filter((line) => line.entryType === "Debet").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
    const creditTotal = Number(lines.filter((line) => line.entryType === "Kredit").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
    const difference = Number((debitTotal - creditTotal).toFixed(2));
    const closingLines = [...lines];

    if (Math.abs(difference) >= 0.01) {
      closingLines.push({
        id: "pl-close-801",
        accountCode: "801",
        entryType: difference > 0 ? "Kredit" : "Debet",
        amount: Number(Math.abs(difference).toFixed(2)),
        linkedQuantity: 0,
        linkedUnit: "",
        subledgerCategory: getDefaultJournalSubledgerCategory("801"),
        linkedEntityType: "",
        linkedEntityId: "",
        linkedEntityName: ""
      });
    }

    return {
      range,
      periodKey: `pl-close:${range.start}:${range.end}`,
      journalDate: range.end || today(),
      lines: closingLines,
      debitTotal: Number(closingLines.filter((line) => line.entryType === "Debet").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
      creditTotal: Number(closingLines.filter((line) => line.entryType === "Kredit").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
      resultAmount: Number(Math.abs(difference).toFixed(2)),
      resultType: difference > 0 ? "profit" : difference < 0 ? "loss" : "break_even"
    };
  }

  function closeProfitLossToPeriodResult(range = getReportRange()) {
    const plan = buildProfitLossClosingPlan(range);
    const existingAutoCloseJournal = state.manualJournals.find((journal) => journal.autoCloseType === "profit_loss_closure" && journal.autoCloseKey === plan.periodKey);
    if (existingAutoCloseJournal) {
      window.alert("Bu hesabat dövrü üçün mənfəət və zərər bağlanışı artıq yaradılıb.");
      return;
    }
    if (!plan.lines.length) {
      window.alert("Bağlanacaq gəlir və ya xərc qalığı tapılmadı.");
      return;
    }
    if (!guardOperationAccess()) return;
    const confirmed = window.confirm(`Seçilmiş dövr üçün gəlir və xərc hesabları 801 hesabına bağlanacaq. Davam edilsin?`);
    if (!confirmed) return;

    const reference = `P&L close ${plan.range.start} - ${plan.range.end}`;
    const journalNumber = `PLC-${plan.range.end.replaceAll("-", "")}`;
    const nextRecord = {
      id: crypto.randomUUID(),
      createdAt: today(),
      date: plan.journalDate,
      journalNumber,
      reference,
      notes: `Auto close for ${plan.range.start} - ${plan.range.end}`,
      autoGenerated: true,
      autoCloseType: "profit_loss_closure",
      autoCloseKey: plan.periodKey,
      journalLines: plan.lines,
      debitAccount: plan.lines.find((line) => line.entryType === "Debet")?.accountCode || "",
      creditAccount: plan.lines.find((line) => line.entryType === "Kredit")?.accountCode || "",
      debit: plan.debitTotal,
      credit: plan.creditTotal
    };

    setState((current) => {
      const hasPeriodResultAccount = current.chartOfAccounts.some((account) => account.accountCode === "801");
      const nextChartOfAccounts = hasPeriodResultAccount
        ? current.chartOfAccounts
        : [...current.chartOfAccounts, {
            id: "801",
            accountCode: "801",
            accountName: getAccountNameByCode("801"),
            accountType: "Kapital",
            status: "Aktiv",
            balance: 0
          }].sort((left, right) => Number(left.accountCode) - Number(right.accountCode));

      return {
        ...current,
        chartOfAccounts: nextChartOfAccounts,
        manualJournals: [nextRecord, ...current.manualJournals]
      };
    });
    markOperationUsage();
    window.alert("Mənfəət və zərər bağlanışı yaradıldı.");
  }

  function buildProfitLossClosingPlan(range = getReportRange(), lookup = getTrialBalanceLookup(range)) {
    const incomeType = normalizeAccountTypeValue("income");
    const expenseType = normalizeAccountTypeValue("expense");
    const lines = [...lookup.values()]
      .filter((row) => isVisibleAccount(row))
      .filter((row) => !["341", "801"].includes(String(row.accountCode || "")))
      .flatMap((row) => {
        const code = String(row.accountCode || "");
        const normalizedAccountType = normalizeAccountTypeValue(row.accountType);
        const inferredAccountType = normalizeAccountTypeValue(inferAccountTypeFromCode(code, row.accountType));
        const isProfitLossIncome = /^6/.test(code) || normalizedAccountType === incomeType || inferredAccountType === incomeType;
        const isProfitLossExpense = /^[789]/.test(code) || normalizedAccountType === expenseType || inferredAccountType === expenseType;
        const debitValue = Number(row.closingDebit || 0);
        const creditValue = Number(row.closingCredit || 0);

        if (isProfitLossIncome) {
          return [
            creditValue > 0 ? {
              id: `pl-close-${code}-debit`,
              accountCode: code,
              entryType: "Debet",
              amount: Number(creditValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null,
            debitValue > 0 ? {
              id: `pl-close-${code}-credit`,
              accountCode: code,
              entryType: "Kredit",
              amount: Number(debitValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null
          ].filter(Boolean);
        }

        if (isProfitLossExpense) {
          return [
            debitValue > 0 ? {
              id: `pl-close-${code}-credit`,
              accountCode: code,
              entryType: "Kredit",
              amount: Number(debitValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null,
            creditValue > 0 ? {
              id: `pl-close-${code}-debit`,
              accountCode: code,
              entryType: "Debet",
              amount: Number(creditValue.toFixed(2)),
              linkedQuantity: 0,
              linkedUnit: "",
              subledgerCategory: getDefaultJournalSubledgerCategory(code),
              linkedEntityType: "",
              linkedEntityId: "",
              linkedEntityName: ""
            } : null
          ].filter(Boolean);
        }

        return [];
      });

    const debitTotal = Number(lines.filter((line) => line.entryType === "Debet").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
    const creditTotal = Number(lines.filter((line) => line.entryType === "Kredit").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
    const difference = Number((debitTotal - creditTotal).toFixed(2));
    const closingLines = [...lines];

    if (Math.abs(difference) >= 0.01) {
      closingLines.push({
        id: "pl-close-801",
        accountCode: "801",
        entryType: difference > 0 ? "Kredit" : "Debet",
        amount: Number(Math.abs(difference).toFixed(2)),
        linkedQuantity: 0,
        linkedUnit: "",
        subledgerCategory: getDefaultJournalSubledgerCategory("801"),
        linkedEntityType: "",
        linkedEntityId: "",
        linkedEntityName: ""
      });
    }

    return {
      range,
      periodKey: `pl-close:${range.start}:${range.end}`,
      journalDate: range.end || today(),
      lines: closingLines,
      debitTotal: Number(closingLines.filter((line) => line.entryType === "Debet").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
      creditTotal: Number(closingLines.filter((line) => line.entryType === "Kredit").reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
      resultAmount: Number(Math.abs(difference).toFixed(2)),
      resultType: difference > 0 ? "profit" : difference < 0 ? "loss" : "break_even"
    };
  }

  function getUnifiedLedgerEntries() {
    const result = [];

    state.manualJournals.forEach((journal) => {
      const lines = [];
      if (Array.isArray(journal.journalLines) && journal.journalLines.length > 0) {
        journal.journalLines.forEach((line) => {
          if (line.accountCode && Number(line.amount || 0) > 0) {
            lines.push({
              accountCode: line.accountCode,
              accountName: getAccountNameByCode(line.accountCode),
              debit: line.entryType === "Debet" ? Number(line.amount) : 0,
              credit: line.entryType === "Kredit" ? Number(line.amount) : 0
            });
          }
        });
      } else {
        if (journal.debitAccount && Number(journal.debit || 0) > 0) {
          lines.push({ accountCode: journal.debitAccount, accountName: getAccountNameByCode(journal.debitAccount), debit: Number(journal.debit), credit: 0 });
        }
        if (journal.creditAccount && Number(journal.credit || 0) > 0) {
          lines.push({ accountCode: journal.creditAccount, accountName: getAccountNameByCode(journal.creditAccount), debit: 0, credit: Number(journal.credit) });
        }
      }
      if (lines.length === 0) return;
      result.push({
        id: journal.id,
        date: journal.date || "",
        reference: journal.reference || journal.journalNumber || "—",
        refNumber: journal.journalNumber || "",
        type: "manual",
        typeLabel: "Əl ilə",
        lines,
        totalDebit: lines.reduce((sum, line) => sum + line.debit, 0),
        totalCredit: lines.reduce((sum, line) => sum + line.credit, 0)
      });
    });

    state.itemMovements.forEach((movement) => {
      const rawLines = getMovementLedgerEntries(movement);
      if (rawLines.length === 0) return;
      const linkedItem = state.items.find((item) => item.id === movement.itemId);
      const lines = rawLines.map((line) => ({
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0)
      }));
      result.push({
        id: movement.id,
        date: movement.movementDate || "",
        reference: linkedItem?.name || movement.movementType || "Mal hərəkəti",
        refNumber: movement.movementType === "Satış" ? "SATIŞ" : "ALIŞ",
        type: movement.movementType === "Satış" ? "sale" : "purchase",
        typeLabel: movement.movementType === "Satış" ? "Satış" : "Alış",
        lines,
        totalDebit: lines.reduce((sum, line) => sum + line.debit, 0),
        totalCredit: lines.reduce((sum, line) => sum + line.credit, 0)
      });
    });

    state.incomingGoodsServices.forEach((entry) => {
      const rawLines = getIncomingGoodsLedgerEntries(entry);
      if (rawLines.length === 0) return;
      const lines = rawLines.map((line) => ({
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0)
      }));
      result.push({
        id: entry.id,
        date: entry.billDate || entry.createdAt || "",
        reference: entry.vendorName || entry.billNumber || "Mal qaiməsi",
        refNumber: entry.billNumber || "",
        type: "incoming",
        typeLabel: "Mal qaiməsi",
        lines,
        totalDebit: lines.reduce((sum, line) => sum + line.debit, 0),
        totalCredit: lines.reduce((sum, line) => sum + line.credit, 0)
      });
    });

    state.invoices.forEach((invoice) => {
      const amount = Number(invoice.amount || 0);
      if (amount <= 0) return;
      const lines = [
        { accountCode: "211", accountName: getAccountNameByCode("211"), debit: amount, credit: 0 },
        { accountCode: "601", accountName: getAccountNameByCode("601"), debit: 0, credit: amount }
      ];
      result.push({
        id: `inv-${invoice.id}`,
        date: invoice.dueDate || invoice.createdAt || "",
        reference: invoice.customerName || invoice.invoiceNumber || "Satış qaiməsi",
        refNumber: invoice.invoiceNumber || "",
        type: "invoice",
        typeLabel: "Satış qaiməsi",
        lines,
        totalDebit: amount,
        totalCredit: amount
      });
    });

    state.salesReceipts.forEach((receipt) => {
      const amount = Number(receipt.amount || 0);
      if (amount <= 0) return;
      const cashAcc = receipt.paymentMode === "Nağd" ? "221" : "223";
      const lines = [
        { accountCode: cashAcc, accountName: getAccountNameByCode(cashAcc), debit: amount, credit: 0 },
        { accountCode: "601", accountName: getAccountNameByCode("601"), debit: 0, credit: amount }
      ];
      result.push({
        id: `sr-${receipt.id}`,
        date: receipt.date || receipt.createdAt || "",
        reference: receipt.customerName || receipt.receiptNumber || "Satış qəbzi",
        refNumber: receipt.receiptNumber || "",
        type: "sales_receipt",
        typeLabel: "Satış qəbzi",
        lines,
        totalDebit: amount,
        totalCredit: amount
      });
    });

    state.paymentsReceived.forEach((payment) => {
      const amount = Number(payment.amount || 0);
      if (amount <= 0) return;
      const cashAcc = payment.paymentMode === "Nağd" ? "221" : "223";
      const lines = [
        { accountCode: cashAcc, accountName: getAccountNameByCode(cashAcc), debit: amount, credit: 0 },
        { accountCode: "211", accountName: getAccountNameByCode("211"), debit: 0, credit: amount }
      ];
      result.push({
        id: `pr-${payment.id}`,
        date: payment.date || payment.createdAt || "",
        reference: payment.customerName || payment.paymentNumber || "Alınan ödəniş",
        refNumber: payment.paymentNumber || "",
        type: "payment_received",
        typeLabel: "Alınan ödəniş",
        lines,
        totalDebit: amount,
        totalCredit: amount
      });
    });

    state.creditNotes.forEach((note) => {
      const amount = Number(note.amount || 0);
      if (amount <= 0) return;
      const lines = [
        { accountCode: "601", accountName: getAccountNameByCode("601"), debit: amount, credit: 0 },
        { accountCode: "211", accountName: getAccountNameByCode("211"), debit: 0, credit: amount }
      ];
      result.push({
        id: `cn-${note.id}`,
        date: note.date || note.createdAt || "",
        reference: note.customerName || note.creditNumber || "Kredit notu",
        refNumber: note.creditNumber || "",
        type: "credit_note",
        typeLabel: "Kredit notu",
        lines,
        totalDebit: amount,
        totalCredit: amount
      });
    });

    state.expenses.forEach((expense) => {
      const amount = Number(expense.amount || 0);
      if (amount <= 0) return;
      const cashAcc = expense.paymentMode === "Nağd" ? "221" : "223";
      const expCode = expense.category === "İcarə" ? "711" : expense.category === "Əmək haqqı" ? "533" : "731";
      const lines = [
        { accountCode: expCode, accountName: getAccountNameByCode(expCode), debit: amount, credit: 0 },
        { accountCode: cashAcc, accountName: getAccountNameByCode(cashAcc), debit: 0, credit: amount }
      ];
      result.push({
        id: `exp-${expense.id}`,
        date: expense.date || expense.createdAt || "",
        reference: expense.category || expense.expenseNumber || "Xərc",
        refNumber: expense.expenseNumber || "",
        type: "expense",
        typeLabel: "Xərc",
        lines,
        totalDebit: amount,
        totalCredit: amount
      });
    });

    state.bills.forEach((bill) => {
      const amount = Number(bill.amount || 0);
      if (amount <= 0) return;
      const lines = [
        { accountCode: "205", accountName: getAccountNameByCode("205"), debit: amount, credit: 0 },
        { accountCode: "531", accountName: getAccountNameByCode("531"), debit: 0, credit: amount }
      ];
      result.push({
        id: `bill-${bill.id}`,
        date: bill.dueDate || bill.createdAt || "",
        reference: bill.vendorName || bill.billNumber || "Hesab-faktura",
        refNumber: bill.billNumber || "",
        type: "bill",
        typeLabel: "Hesab-faktura",
        lines,
        totalDebit: amount,
        totalCredit: amount
      });
    });

    state.bankTransactions.forEach((tx) => {
      const amount = Number(tx.amount || 0);
      if (amount <= 0) return;
      const bankAcc = state.bankingAccounts.find((account) => account.id === tx.bankAccountId);
      const bankCode = bankAcc?.coaCode || "223";
      const counterCode = tx.accountCode || (tx.transactionType === "Mədaxil" ? "611" : "731");
      const isIncoming = tx.transactionType === "Mədaxil";
      const lines = isIncoming
        ? [
            { accountCode: bankCode, accountName: getAccountNameByCode(bankCode), debit: amount, credit: 0 },
            { accountCode: counterCode, accountName: getAccountNameByCode(counterCode), debit: 0, credit: amount }
          ]
        : [
            { accountCode: counterCode, accountName: getAccountNameByCode(counterCode), debit: amount, credit: 0 },
            { accountCode: bankCode, accountName: getAccountNameByCode(bankCode), debit: 0, credit: amount }
          ];
      result.push({
        id: `btx-${tx.id}`,
        date: tx.date || "",
        reference: tx.description || tx.reference || (isIncoming ? "Bank mədaxil" : "Bank məxaric"),
        refNumber: tx.reference || "",
        type: isIncoming ? "bank_in" : "bank_out",
        typeLabel: isIncoming ? "Bank mədaxil" : "Bank məxaric",
        lines,
        totalDebit: amount,
        totalCredit: amount
      });
    });

    return result.sort((left, right) => (right.date || "").localeCompare(left.date || ""));
  }

  function getAccountCardEntityCategory(accountCode) {
    if (["201", "204", "205"].includes(accountCode || "")) return "goods";
    const category = getDefaultJournalSubledgerCategory(accountCode || "");
    return ["goods", "debtors", "creditors"].includes(category) ? category : "";
  }

  function getAccountCardLedgerLines() {
    const result = [];

    state.manualJournals.forEach((journal) => {
      const baseDate = journal.date || journal.createdAt || today();
      const baseReference = journal.reference || journal.journalNumber || "Manual jurnal";
      const baseNumber = journal.journalNumber || "";
      if (Array.isArray(journal.journalLines) && journal.journalLines.length > 0) {
        journal.journalLines
          .filter((line) => line.accountCode && Number(line.amount || 0) > 0)
          .forEach((line, index) => {
            result.push({
              id: `${journal.id || baseNumber}-line-${line.id || index}`,
              date: baseDate,
              accountCode: line.accountCode,
              accountName: getAccountNameByCode(line.accountCode),
              debit: line.entryType === "Debet" ? Number(line.amount || 0) : 0,
              credit: line.entryType === "Kredit" ? Number(line.amount || 0) : 0,
              reference: baseReference,
              refNumber: baseNumber,
              sourceLabel: "Manual jurnal",
              entityCategory: line.subledgerCategory || getDefaultJournalSubledgerCategory(line.accountCode),
              entityId: line.linkedEntityId || "",
              entityName: line.linkedEntityName || "",
              notes: journal.notes || ""
            });
          });
        return;
      }
      if (journal.debitAccount && Number(journal.debit || 0) > 0) {
        result.push({
          id: `${journal.id || baseNumber}-debit`,
          date: baseDate,
          accountCode: journal.debitAccount,
          accountName: getAccountNameByCode(journal.debitAccount),
          debit: Number(journal.debit || 0),
          credit: 0,
          reference: baseReference,
          refNumber: baseNumber,
          sourceLabel: "Manual jurnal",
          entityCategory: getDefaultJournalSubledgerCategory(journal.debitAccount),
          entityId: "",
          entityName: "",
          notes: journal.notes || ""
        });
      }
      if (journal.creditAccount && Number(journal.credit || 0) > 0) {
        result.push({
          id: `${journal.id || baseNumber}-credit`,
          date: baseDate,
          accountCode: journal.creditAccount,
          accountName: getAccountNameByCode(journal.creditAccount),
          debit: 0,
          credit: Number(journal.credit || 0),
          reference: baseReference,
          refNumber: baseNumber,
          sourceLabel: "Manual jurnal",
          entityCategory: getDefaultJournalSubledgerCategory(journal.creditAccount),
          entityId: "",
          entityName: "",
          notes: journal.notes || ""
        });
      }
    });

    state.itemMovements.forEach((movement) => {
      const linkedItem = state.items.find((item) => item.id === movement.itemId);
      getMovementLedgerEntries(movement).forEach((entry, index) => {
        result.push({
          id: `${movement.id}-move-${index}`,
          date: movement.movementDate || today(),
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          debit: Number(entry.debit || 0),
          credit: Number(entry.credit || 0),
          reference: movement.note || movement.partner || movement.movementType || "Mal hərəkəti",
          refNumber: movement.movementType || "",
          sourceLabel: "Mal hərəkəti",
          entityCategory: entry.accountCode === "201" ? "goods" : (entry.accountCode === "231" ? "debtors" : (entry.accountCode === "531" ? "creditors" : "")),
          entityId: entry.accountCode === "201" ? movement.itemId || "" : "",
          entityName: entry.accountCode === "201" ? (linkedItem?.name || movement.itemName || "") : (movement.partner || ""),
          notes: movement.note || ""
        });
      });
    });

    state.incomingGoodsServices.forEach((entry) => {
      getIncomingGoodsLedgerEntries(entry).forEach((line, index) => {
        result.push({
          id: `${entry.id}-incoming-${index}`,
          date: entry.billDate || entry.createdAt || today(),
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          reference: entry.notes || entry.billNumber || "Mal qaiməsi",
          refNumber: entry.billNumber || "",
          sourceLabel: "Mal qaiməsi",
          entityCategory: line.accountCode === "531" ? "creditors" : "",
          entityId: "",
          entityName: line.accountCode === "531" ? (entry.vendorName || "") : "",
          notes: entry.notes || ""
        });
      });
    });

    state.invoices.forEach((inv) => {
      const amount = Number(inv.amount || 0);
      if (amount <= 0) return;
      const date = inv.dueDate || inv.createdAt || today();
      result.push({
        id: `${inv.id}-211`,
        date,
        accountCode: "211",
        accountName: getAccountNameByCode("211"),
        debit: amount,
        credit: 0,
        reference: inv.invoiceNumber || "Satış fakturası",
        refNumber: inv.invoiceNumber || "",
        sourceLabel: "Satış fakturası",
        entityCategory: "debtors",
        entityId: "",
        entityName: inv.customerName || "",
        notes: ""
      });
      result.push({
        id: `${inv.id}-601`,
        date,
        accountCode: "601",
        accountName: getAccountNameByCode("601"),
        debit: 0,
        credit: amount,
        reference: inv.invoiceNumber || "Satış fakturası",
        refNumber: inv.invoiceNumber || "",
        sourceLabel: "Satış fakturası",
        entityCategory: "",
        entityId: "",
        entityName: inv.customerName || "",
        notes: ""
      });
    });

    state.salesReceipts.forEach((receipt) => {
      const amount = Number(receipt.amount || 0);
      if (amount <= 0) return;
      const cashAcc = receipt.paymentMode === "Nağd" ? "221" : "223";
      const date = receipt.date || receipt.createdAt || today();
      result.push({
        id: `${receipt.id}-${cashAcc}`,
        date,
        accountCode: cashAcc,
        accountName: getAccountNameByCode(cashAcc),
        debit: amount,
        credit: 0,
        reference: receipt.receiptNumber || "Satış qəbzi",
        refNumber: receipt.receiptNumber || "",
        sourceLabel: "Satış qəbzi",
        entityCategory: "",
        entityId: "",
        entityName: receipt.customerName || "",
        notes: ""
      });
      result.push({
        id: `${receipt.id}-601`,
        date,
        accountCode: "601",
        accountName: getAccountNameByCode("601"),
        debit: 0,
        credit: amount,
        reference: receipt.receiptNumber || "Satış qəbzi",
        refNumber: receipt.receiptNumber || "",
        sourceLabel: "Satış qəbzi",
        entityCategory: "",
        entityId: "",
        entityName: receipt.customerName || "",
        notes: ""
      });
    });

    state.paymentsReceived.forEach((payment) => {
      const amount = Number(payment.amount || 0);
      if (amount <= 0) return;
      const cashAcc = payment.paymentMode === "Nağd" ? "221" : "223";
      const date = payment.date || payment.createdAt || today();
      result.push({
        id: `${payment.id}-${cashAcc}`,
        date,
        accountCode: cashAcc,
        accountName: getAccountNameByCode(cashAcc),
        debit: amount,
        credit: 0,
        reference: payment.paymentNumber || "Alınan ödəniş",
        refNumber: payment.paymentNumber || "",
        sourceLabel: "Alınan ödəniş",
        entityCategory: "",
        entityId: "",
        entityName: payment.customerName || "",
        notes: ""
      });
      result.push({
        id: `${payment.id}-211`,
        date,
        accountCode: "211",
        accountName: getAccountNameByCode("211"),
        debit: 0,
        credit: amount,
        reference: payment.paymentNumber || "Alınan ödəniş",
        refNumber: payment.paymentNumber || "",
        sourceLabel: "Alınan ödəniş",
        entityCategory: "debtors",
        entityId: "",
        entityName: payment.customerName || "",
        notes: ""
      });
    });

    state.creditNotes.forEach((note) => {
      const amount = Number(note.amount || 0);
      if (amount <= 0) return;
      const date = note.date || note.createdAt || today();
      result.push({
        id: `${note.id}-601`,
        date,
        accountCode: "601",
        accountName: getAccountNameByCode("601"),
        debit: amount,
        credit: 0,
        reference: note.creditNumber || "Kredit notu",
        refNumber: note.creditNumber || "",
        sourceLabel: "Kredit notu",
        entityCategory: "",
        entityId: "",
        entityName: note.customerName || "",
        notes: ""
      });
      result.push({
        id: `${note.id}-211`,
        date,
        accountCode: "211",
        accountName: getAccountNameByCode("211"),
        debit: 0,
        credit: amount,
        reference: note.creditNumber || "Kredit notu",
        refNumber: note.creditNumber || "",
        sourceLabel: "Kredit notu",
        entityCategory: "debtors",
        entityId: "",
        entityName: note.customerName || "",
        notes: ""
      });
    });

    state.expenses.forEach((expense) => {
      const amount = Number(expense.amount || 0);
      if (amount <= 0) return;
      const cashAcc = expense.paymentMode === "Nağd" ? "221" : "223";
      const expCode = expense.category === "İcarə" ? "711"
        : expense.category === "Proqram təminatı" ? "712"
        : expense.category === "Ofis ləvazimatları" ? "712"
        : "731";
      const date = expense.date || expense.createdAt || today();
      result.push({
        id: `${expense.id}-${expCode}`,
        date,
        accountCode: expCode,
        accountName: getAccountNameByCode(expCode),
        debit: amount,
        credit: 0,
        reference: expense.expenseNumber || "Xərc",
        refNumber: expense.expenseNumber || "",
        sourceLabel: "Xərc",
        entityCategory: "",
        entityId: "",
        entityName: expense.vendorName || "",
        notes: expense.category || ""
      });
      result.push({
        id: `${expense.id}-${cashAcc}`,
        date,
        accountCode: cashAcc,
        accountName: getAccountNameByCode(cashAcc),
        debit: 0,
        credit: amount,
        reference: expense.expenseNumber || "Xərc",
        refNumber: expense.expenseNumber || "",
        sourceLabel: "Xərc",
        entityCategory: "",
        entityId: "",
        entityName: expense.vendorName || "",
        notes: expense.category || ""
      });
    });

    state.bills.forEach((bill) => {
      const amount = Number(bill.amount || 0);
      if (amount <= 0) return;
      const date = bill.dueDate || bill.createdAt || today();
      result.push({
        id: `${bill.id}-205`,
        date,
        accountCode: "205",
        accountName: getAccountNameByCode("205"),
        debit: amount,
        credit: 0,
        reference: bill.billNumber || "Hesab-faktura",
        refNumber: bill.billNumber || "",
        sourceLabel: "Hesab-faktura",
        entityCategory: "",
        entityId: "",
        entityName: bill.vendorName || "",
        notes: ""
      });
      result.push({
        id: `${bill.id}-531`,
        date,
        accountCode: "531",
        accountName: getAccountNameByCode("531"),
        debit: 0,
        credit: amount,
        reference: bill.billNumber || "Hesab-faktura",
        refNumber: bill.billNumber || "",
        sourceLabel: "Hesab-faktura",
        entityCategory: "creditors",
        entityId: "",
        entityName: bill.vendorName || "",
        notes: ""
      });
    });

    state.bankTransactions.forEach((tx) => {
      const amount = Number(tx.amount || 0);
      if (amount <= 0) return;
      const bankAcc = state.bankingAccounts.find((account) => account.id === tx.bankAccountId);
      const bankCode = bankAcc?.coaCode || "223";
      const counterCode = tx.accountCode || (tx.transactionType === "Mədaxil" ? "611" : "731");
      const date = tx.date || today();
      const common = {
        date,
        reference: tx.reference || tx.description || "Bank əməliyyatı",
        refNumber: tx.reference || "",
        sourceLabel: "Bank əməliyyatı",
        entityCategory: "",
        entityId: "",
        entityName: "",
        notes: tx.description || ""
      };
      if (tx.transactionType === "Mədaxil") {
        result.push({
          id: `${tx.id}-${bankCode}`,
          ...common,
          accountCode: bankCode,
          accountName: getAccountNameByCode(bankCode),
          debit: amount,
          credit: 0
        });
        result.push({
          id: `${tx.id}-${counterCode}`,
          ...common,
          accountCode: counterCode,
          accountName: getAccountNameByCode(counterCode),
          debit: 0,
          credit: amount
        });
      } else {
        result.push({
          id: `${tx.id}-${counterCode}`,
          ...common,
          accountCode: counterCode,
          accountName: getAccountNameByCode(counterCode),
          debit: amount,
          credit: 0
        });
        result.push({
          id: `${tx.id}-${bankCode}`,
          ...common,
          accountCode: bankCode,
          accountName: getAccountNameByCode(bankCode),
          debit: 0,
          credit: amount
        });
      }
    });

    return result.sort((left, right) => {
      const byDate = (left.date || "").localeCompare(right.date || "");
      if (byDate !== 0) return byDate;
      return String(left.reference || "").localeCompare(String(right.reference || ""));
    });
  }

  function getAccountCardEntityOptions(accountCode) {
    if (!accountCode) return [];
    const category = getAccountCardEntityCategory(accountCode);
    const ledgerOptions = getAccountCardLedgerLines()
      .filter((line) => line.accountCode === accountCode && line.entityName)
      .map((line) => ({ value: line.entityName, label: line.entityName }));
    const masterOptions = category
      ? getJournalSubledgerOptions(category).map((option) => ({ value: option.label, label: option.label }))
      : [];
    const unique = new Map();
    [...masterOptions, ...ledgerOptions].forEach((option) => {
      if (!unique.has(option.value)) unique.set(option.value, option);
    });
    return [...unique.values()].sort((left, right) => left.label.localeCompare(right.label));
  }

  function getTrialBalanceRows(range = null, options = {}) {
    const excludedAutoCloseTypes = new Set(options.excludeAutoCloseTypes || []);
    const accountMap = new Map(
      state.chartOfAccounts.map((account) => [account.accountCode, {
        ...account,
        accountType: normalizeAccountTypeValue(account.accountType),
        openingDebit: normalizeAccountTypeValue(account.accountType) === "Aktiv" || normalizeAccountTypeValue(account.accountType) === "Xərc" ? Number(account.balance || 0) : 0,
        openingCredit: normalizeAccountTypeValue(account.accountType) === "Öhdəlik" || normalizeAccountTypeValue(account.accountType) === "Gəlir" || normalizeAccountTypeValue(account.accountType) === "Kapital" ? Number(account.balance || 0) : 0,
        movementDebit: 0,
        movementCredit: 0
      }])
    );

    const allEntries = [
      // 1. Əl ilə daxil edilən jurnallar
      ...state.manualJournals
        .filter((journal) => !excludedAutoCloseTypes.has(journal.autoCloseType || ""))
        .flatMap((journal) => {
        if (Array.isArray(journal.journalLines) && journal.journalLines.length) {
          return journal.journalLines
            .filter((line) => line.accountCode && Number(line.amount || 0) > 0)
            .map((line) => ({
              date: journal.date,
              accountCode: line.accountCode,
              debit: line.entryType === "Debet" ? Number(line.amount || 0) : 0,
              credit: line.entryType === "Kredit" ? Number(line.amount || 0) : 0
            }));
        }
        const entries = [];
        if (journal.debitAccount && Number(journal.debit || 0) > 0) entries.push({ date: journal.date, accountCode: journal.debitAccount, debit: Number(journal.debit || 0), credit: 0 });
        if (journal.creditAccount && Number(journal.credit || 0) > 0) entries.push({ date: journal.date, accountCode: journal.creditAccount, debit: 0, credit: Number(journal.credit || 0) });
        return entries;
      }),

      // 2. Mal hərəkətləri (kataloq alış/satış)
      ...state.itemMovements.flatMap((movement) =>
        getMovementLedgerEntries(movement).map((entry) => ({ ...entry, date: movement.movementDate }))
      ),

      // 3. Mal qaimələri (incomingGoodsServices)
      ...state.incomingGoodsServices.flatMap((incomingEntry) =>
        getIncomingGoodsLedgerEntries(incomingEntry).map((entry) => ({ ...entry, date: incomingEntry.billDate || incomingEntry.createdAt || today() }))
      ),

      // 4. Satış qaimələri — D: 211 Debitorlar, K: 601 Satış gəlirləri
      ...state.invoices.flatMap((inv) => {
        const amount = Number(inv.amount || 0);
        if (amount <= 0) return [];
        const date = inv.dueDate || inv.createdAt || today();
        return [
          { date, accountCode: "211", debit: amount, credit: 0 },
          { date, accountCode: "601", debit: 0,      credit: amount },
        ];
      }),

      // 5. Satış qəbzləri — D: 221/223 Kassa/Bank, K: 601 Satış gəlirləri
      ...state.salesReceipts.flatMap((receipt) => {
        const amount = Number(receipt.amount || 0);
        if (amount <= 0) return [];
        const cashAcc = receipt.paymentMode === "Nağd" ? "221" : "223";
        const date = receipt.date || receipt.createdAt || today();
        return [
          { date, accountCode: cashAcc, debit: amount, credit: 0 },
          { date, accountCode: "601",   debit: 0,      credit: amount },
        ];
      }),

      // 6. Alınan ödənişlər — D: 221/223 Bank, K: 211 Debitorlar
      ...state.paymentsReceived.flatMap((payment) => {
        const amount = Number(payment.amount || 0);
        if (amount <= 0) return [];
        const cashAcc = payment.paymentMode === "Nağd" ? "221" : "223";
        const date = payment.date || payment.createdAt || today();
        return [
          { date, accountCode: cashAcc, debit: amount, credit: 0 },
          { date, accountCode: "211",   debit: 0,      credit: amount },
        ];
      }),

      // 7. Kredit notları — D: 601 Satış gəlirləri, K: 211 Debitorlar
      ...state.creditNotes.flatMap((note) => {
        const amount = Number(note.amount || 0);
        if (amount <= 0) return [];
        const date = note.date || note.createdAt || today();
        return [
          { date, accountCode: "601", debit: amount, credit: 0 },
          { date, accountCode: "211", debit: 0,      credit: amount },
        ];
      }),

      // 8. Xərclər — D: 711/731 Xərc hesabı, K: 221/223 Kassa/Bank
      ...state.expenses.flatMap((expense) => {
        const amount = Number(expense.amount || 0);
        if (amount <= 0) return [];
        const cashAcc = expense.paymentMode === "Nağd" ? "221" : "223";
        const expCode = expense.category === "İcarə" ? "711"
          : expense.category === "Proqram təminatı" ? "712"
          : expense.category === "Ofis ləvazimatları" ? "712"
          : "731";
        const date = expense.date || expense.createdAt || today();
        return [
          { date, accountCode: expCode,  debit: amount, credit: 0 },
          { date, accountCode: cashAcc,  debit: 0,      credit: amount },
        ];
      }),

      // 9. Hesab-fakturalar (bills) — D: 205 Alınmış mallar, K: 531 Kreditorlar
      ...state.bills.flatMap((bill) => {
        const amount = Number(bill.amount || 0);
        if (amount <= 0) return [];
        const date = bill.dueDate || bill.createdAt || today();
        return [
          { date, accountCode: "205", debit: amount, credit: 0 },
          { date, accountCode: "531", debit: 0,      credit: amount },
        ];
      }),

      // 10. Bank əməliyyatları — Mədaxil: D: 223 Bank, K: karşı hesab | Məxaric: D: karşı hesab, K: 223 Bank
      ...state.bankTransactions.flatMap((tx) => {
        const amount = Number(tx.amount || 0);
        if (amount <= 0) return [];
        const bankAcc = state.bankingAccounts.find((a) => a.id === tx.bankAccountId);
        const bankCode    = bankAcc?.coaCode || "223";
        const counterCode = tx.accountCode   || (tx.transactionType === "Mədaxil" ? "611" : "731");
        const date = tx.date || today();
        return tx.transactionType === "Mədaxil"
          ? [
              { date, accountCode: bankCode,    debit: amount, credit: 0 },
              { date, accountCode: counterCode, debit: 0,      credit: amount },
            ]
          : [
              { date, accountCode: counterCode, debit: amount, credit: 0 },
              { date, accountCode: bankCode,    debit: 0,      credit: amount },
            ];
      }),
    ];

    allEntries.forEach((entry) => {
      if (!accountMap.has(entry.accountCode)) {
        accountMap.set(entry.accountCode, {
          id: entry.accountCode,
          accountCode: entry.accountCode,
          accountName: getAccountNameByCode(entry.accountCode),
          accountType: inferAccountTypeFromCode(entry.accountCode),
          openingDebit: 0,
          openingCredit: 0,
          movementDebit: 0,
          movementCredit: 0
        });
      }
      const row = accountMap.get(entry.accountCode);
      if (range && isDateBeforeRange(entry.date, range)) {
        row.openingDebit += Number(entry.debit || 0);
        row.openingCredit += Number(entry.credit || 0);
      } else if (!range || isDateInRange(entry.date, range)) {
        row.movementDebit += Number(entry.debit || 0);
        row.movementCredit += Number(entry.credit || 0);
      }
    });

    return [...accountMap.values()].map((row) => {
      const closingDelta = (row.openingDebit + row.movementDebit) - (row.openingCredit + row.movementCredit);
      return {
        ...row,
        closingDebit: closingDelta >= 0 ? closingDelta : 0,
        closingCredit: closingDelta < 0 ? Math.abs(closingDelta) : 0
      };
    }).filter((row) => isVisibleAccount(row)).sort((left, right) => left.accountCode.localeCompare(right.accountCode));
  }

  function setSection(id) {
    setActiveSection(id);
    setActiveModule(null);
    setItemFormOpen(false);
    setBillView("overview");
    setJournalView("overview");
    setOpJournalFilter({ type: "all", search: "", dateFrom: "", dateTo: "" });
    setOpJournalExpanded(new Set());
    setChartView("overview");
    setVendorView("overview");
    setGoodsView("overview");
    setBankView("overview");
    setInvoiceView("overview");
    setCustomerView("overview");
    setDocumentView("overview");
    setSettingsTab(null);
    setExpandedSections(new Set([id]));
  }

  function toggleSectionExpand(id) {
    setExpandedSections((prev) => {
      if (prev.has(id)) {
        return new Set();
      } else {
        return new Set([id]);
      }
    });
  }

  function resetDemoData() {
    if (!window.confirm("Proqramdakı bütün mövcud məlumatlar sıfırlanacaq. Davam etmək istəyirsiniz?")) return;
    const seed = normalizeAppState(createResetData());
    setState(seed);
    setDrafts({});
    setEditing({});
    setItemMovementDraft(createMovementDraft(seed.items));
    setItemFormOpen(false);
    setEditingBank(null);
    setEditingDocument(null);
    setSection("home");
  }

  async function exportBackup() {
    if (!window.confirm("Cari məlumatların backup faylı yaradılsın?")) return;
    setBackupStatus({ tone: "info", message: "Backup hazırlanır..." });
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI_INTERNALS__?.invoke;
    if (invoke) {
      try {
        const backupPath = await invoke("export_backup", { state });
        setBackupStatus({ tone: "success", message: `Backup faylı yaradıldı: ${backupPath}` });
        return;
      } catch (error) {
        const message = error?.message || String(error || "");
        setBackupStatus({ tone: "warning", message: `Desktop backup alınmadı${message ? `: ${message}` : ""}. Brauzer üsulu ilə yenidən cəhd edilir.` });
      }
    }

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "finotam-erp-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    setBackupStatus({ tone: "success", message: "Backup endirilmək üçün hazırlandı." });
  }

  function triggerRestore() {
    if (!window.confirm("Backup faylından məlumatlar bərpa olunacaq. Cari məlumatların üzərinə yazıla bilər. Davam etmək istəyirsiniz?")) return;
    restoreInputRef.current?.click();
  }

  async function restoreBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBackupStatus({ tone: "info", message: "Backup bərpa olunur..." });
      const text = await file.text();
      const restored = normalizeAppState(JSON.parse(text));
      setState(restored);
      setDrafts({});
      setEditing({});
      setItemMovementDraft(createMovementDraft(restored.items));
      setItemFormOpen(false);
      setEditingBank(null);
      setEditingDocument(null);
      setSection("home");
      setBackupStatus({ tone: "success", message: `Backup uğurla bərpa olundu: ${file.name}` });
    } catch (error) {
      const message = error?.message || String(error || "");
      setBackupStatus({ tone: "warning", message: `Backup bərpa olunmadı${message ? `: ${message}` : ""}` });
    } finally {
      event.target.value = "";
    }
  }

  function updateDraft(moduleId, fieldName, value) {
    setDrafts((current) => {
      const nextDraft = { ...(current[moduleId] || createModuleDraft(moduleId)), [fieldName]: value };
      return { ...current, [moduleId]: nextDraft };
    });
  }

  function updateJournalLine(lineId, fieldName, value) {
    setDrafts((current) => {
      const draft = current.manualJournals || createModuleDraft("manualJournals");
      return {
        ...current,
        manualJournals: {
          ...draft,
          journalLines: draft.journalLines.map((line) => {
            if (line.id !== lineId) return line;
            if (fieldName === "accountCode") {
              return {
                ...line,
                accountCode: value,
                subledgerCategory: getDefaultJournalSubledgerCategory(value),
                linkedEntityType: "",
                linkedEntityId: "",
                linkedEntityName: ""
              };
            }
            return { ...line, [fieldName]: value };
          })
        }
      };
    });
  }

  function addJournalLine() {
    setDrafts((current) => {
      const draft = current.manualJournals || createModuleDraft("manualJournals");
      return {
        ...current,
        manualJournals: {
          ...draft,
          journalLines: [...draft.journalLines, { id: crypto.randomUUID(), accountCode: "", entryType: "Debet", amount: "0", linkedQuantity: "0", linkedUnit: "", subledgerCategory: "goods", linkedEntityType: "", linkedEntityId: "", linkedEntityName: "" }]
        }
      };
    });
  }

  function updateJournalLineLinkedEntity(lineId, relationType, entityId, entityName, entityUnit = "") {
    setDrafts((current) => {
      const draft = current.manualJournals || createModuleDraft("manualJournals");
      return {
        ...current,
        manualJournals: {
          ...draft,
          journalLines: draft.journalLines.map((line) => line.id === lineId
            ? { ...line, linkedEntityType: relationType || "", linkedEntityId: entityId || "", linkedEntityName: entityName || "", linkedUnit: entityUnit || line.linkedUnit || "" }
            : line)
        }
      };
    });
  }

  function updateJournalLineSubledgerCategory(lineId, category) {
    setDrafts((current) => {
      const draft = current.manualJournals || createModuleDraft("manualJournals");
      return {
        ...current,
        manualJournals: {
          ...draft,
          journalLines: draft.journalLines.map((line) => line.id === lineId ? { ...line, subledgerCategory: category } : line)
        }
      };
    });
  }

  function getJournalSubledgerOptions(category) {
    if (category === "goods" || category === "services") {
      const goodsOptions = state.goods
        .filter((item) => category === "goods" ? (item.type || "Mal") !== "Xidmət" : item.type === "Xidmət")
        .map((item) => ({ id: item.id, label: item.name || item.code || "—", type: category, unit: item.unit || "" }));
      const itemOptions = state.items
        .filter((item) => category === "goods" ? item.type !== "Xidmət" : item.type === "Xidmət")
        .map((item) => ({ id: item.id, label: item.name || item.sku || "—", type: category, unit: item.usageUnit || "" }));
      return [...goodsOptions, ...itemOptions.filter((item) => !goodsOptions.some((existing) => existing.label === item.label))];
    }
    if (category === "expenses") {
      return state.chartOfAccounts
        .filter((account) => account.accountType === "Xərc" && isVisibleAccount(account))
        .map((account) => ({ id: account.id, label: `${account.accountCode} - ${account.accountName}`, type: category }));
    }
    if (category === "incomes") {
      return state.chartOfAccounts
        .filter((account) => account.accountType === "Gəlir" && isVisibleAccount(account))
        .map((account) => ({ id: account.id, label: `${account.accountCode} - ${account.accountName}`, type: category }));
    }
    if (category === "debtors") {
      return state.customers.map((item) => ({
        id: item.id,
        label: item.displayName || item.companyName || "—",
        type: category
      }));
    }
    if (category === "creditors") {
      return state.vendors.map((item) => ({
        id: item.id,
        label: item.vendorName || item.companyName || "—",
        type: category
      }));
    }
    if (category === "bank") {
      return state.bankingAccounts.map((item) => ({
        id: item.id,
        label: item.accountName || item.institution || "—",
        type: category
      }));
    }
    return [];
  }

  function getNextAccountCodeByType(accountType) {
    const base = accountType === "Gəlir" ? 601 : 701;
    const maxCode = state.chartOfAccounts
      .filter((account) => account.accountType === accountType)
      .map((account) => Number(account.accountCode || 0))
      .filter((value) => Number.isFinite(value) && value > 0)
      .reduce((max, value) => Math.max(max, value), base - 1);
    return String(maxCode + 1);
  }

  function createJournalSubledgerEntity(lineId, category) {
    const draftValue = String(journalInlineCreate[lineId]?.[category] || "").trim();
    if (!draftValue) return;

    if (category === "goods" || category === "services") {
      const nextRecord = {
        id: crypto.randomUUID(),
        name: draftValue,
        type: category === "goods" ? "Mal" : "Xidmət",
        unit: category === "goods" ? "ədəd" : "xidmət",
        code: `${category === "goods" ? "MAL" : "SRV"}-${String(state.goods.length + 1).padStart(3, "0")}`
      };
      setState((current) => ({ ...current, goods: [nextRecord, ...current.goods] }));
      updateJournalLineLinkedEntity(lineId, category, nextRecord.id, nextRecord.name, nextRecord.unit || "");
    } else if (category === "incomes" || category === "expenses") {
      const accountType = category === "incomes" ? "Gəlir" : "Xərc";
      const nextRecord = {
        id: crypto.randomUUID(),
        accountCode: getNextAccountCodeByType(accountType),
        accountName: draftValue,
        accountType,
        status: "Aktiv",
        balance: 0
      };
      setState((current) => ({
        ...current,
        chartOfAccounts: [...current.chartOfAccounts, nextRecord].sort((a, b) => Number(a.accountCode) - Number(b.accountCode))
      }));
      updateJournalLineLinkedEntity(lineId, category, nextRecord.id, `${nextRecord.accountCode} - ${nextRecord.accountName}`, "");
    } else if (category === "debtors") {
      const nextRecord = {
        id: crypto.randomUUID(),
        displayName: draftValue,
        companyName: "",
        phone: "",
        email: "",
        taxId: "",
        outstandingReceivables: 0
      };
      setState((current) => ({ ...current, customers: [nextRecord, ...current.customers] }));
      updateJournalLineLinkedEntity(lineId, category, nextRecord.id, nextRecord.displayName, "");
    } else if (category === "creditors") {
      const nextRecord = {
        id: crypto.randomUUID(),
        vendorName: draftValue,
        companyName: "",
        email: "",
        outstandingPayables: 0
      };
      setState((current) => ({ ...current, vendors: [nextRecord, ...current.vendors] }));
      updateJournalLineLinkedEntity(lineId, category, nextRecord.id, nextRecord.vendorName, "");
    } else if (category === "bank") {
      const nextRecord = {
        id: crypto.randomUUID(),
        accountName: draftValue,
        institution: "",
        accountType: "Cari",
        balance: 0,
        iban: "",
        coaCode: "",
        lastSync: today()
      };
      setState((current) => ({ ...current, bankingAccounts: [nextRecord, ...current.bankingAccounts] }));
      updateJournalLineLinkedEntity(lineId, category, nextRecord.id, nextRecord.accountName, "");
    }

    setJournalInlineCreate((current) => ({
      ...current,
      [lineId]: {
        ...(current[lineId] || {}),
        [category]: ""
      }
    }));
  }

  function buildManualJournalInventoryAdjustments(record, sourceState) {
    const journalLines = Array.isArray(record?.journalLines) ? record.journalLines : [];
    return journalLines
      .filter((line) => line.accountCode === "201" && line.linkedEntityId && Number(line.linkedQuantity || 0) > 0)
      .map((line) => {
        const item = sourceState.items.find((entry) => entry.id === line.linkedEntityId);
        if (!item || item.trackInventory !== "Bəli" || item.type === "Xidmət") return null;
        const quantity = Number(line.linkedQuantity || 0);
        const direction = line.entryType === "Debet" ? 1 : -1;
        const unitPrice = quantity > 0 ? Number((Number(line.amount || 0) / quantity).toFixed(4)) : 0;
        return {
          itemId: item.id,
          quantity,
          direction,
          line,
          item,
          movement: {
            id: `mj-move-${record.id}-${line.id}`,
            sourceType: "manualJournal",
            sourceId: record.id,
            sourceLineId: line.id,
            itemId: item.id,
            itemName: item.name,
            movementType: direction > 0 ? "Alış" : "Satış",
            quantity,
            unitPrice,
            taxLabel: "",
            taxRate: 0,
            taxAmount: 0,
            baseAmount: Number(line.amount || 0),
            itemType: item.type,
            costAmount: direction < 0 && item.type !== "Xidmət" ? Number((quantity * Number(item.purchaseRate || 0)).toFixed(2)) : 0,
            partner: record.reference || line.linkedEntityName || "",
            movementDate: record.date || today(),
            note: `Manual journal ${record.journalNumber || ""} ${record.reference || ""}`.trim(),
            amount: Number(line.amount || 0)
          }
        };
      })
      .filter(Boolean);
  }

  function applyManualJournalInventory(stateSnapshot, record, mode = "apply") {
    const adjustments = buildManualJournalInventoryAdjustments(record, stateSnapshot);
    if (!adjustments.length) return stateSnapshot;

    const sign = mode === "revert" ? -1 : 1;
    const movementIds = new Set(adjustments.map((entry) => entry.movement.id));
    const nextItems = stateSnapshot.items.map((item) => {
      const adjustment = adjustments.find((entry) => entry.itemId === item.id);
      if (!adjustment) return item;
      return {
        ...item,
        stockOnHand: Number(item.stockOnHand || 0) + (adjustment.quantity * adjustment.direction * sign)
      };
    });

    let nextMovements = stateSnapshot.itemMovements.filter((movement) => !movementIds.has(movement.id));
    if (mode === "apply") {
      nextMovements = [...adjustments.map((entry) => entry.movement), ...nextMovements];
    }

    return {
      ...stateSnapshot,
      items: nextItems,
      itemMovements: nextMovements
    };
  }

  function canApplyManualJournalInventory(record, sourceState) {
    const adjustments = buildManualJournalInventoryAdjustments(record, sourceState);
    return adjustments.every((entry) => {
      const nextStock = Number(entry.item.stockOnHand || 0) + (entry.quantity * entry.direction);
      return nextStock >= 0 || sourceState.settings.negativeStock === "Bəli";
    });
  }

  function removeJournalLine(lineId) {
    setDrafts((current) => {
      const draft = current.manualJournals || createModuleDraft("manualJournals");
      if (draft.journalLines.length <= 2) return current;
      return {
        ...current,
        manualJournals: {
          ...draft,
          journalLines: draft.journalLines.filter((line) => line.id !== lineId)
        }
      };
    });
  }

  function startEdit(moduleId, record) {
    setActiveModule(moduleId);
    if (moduleId === "itemsCatalog") setItemFormOpen(true);
    if (moduleId === "incomingGoodsServices") setBillView("form");
    if (moduleId === "manualJournals") setJournalView("form");
    if (moduleId === "chartOfAccounts") setChartView("form");
    if (moduleId === "vendors") setVendorView("form");
    if (moduleId === "goods") setGoodsView("form");
    if (moduleId === "invoices") setInvoiceView("form");
    if (moduleId === "customers") setCustomerView("form");
    setDrafts((current) => ({ ...current, [moduleId]: createModuleDraft(moduleId, record) }));
    setEditing((current) => ({ ...current, [moduleId]: record.id }));
  }

  function cancelEdit(moduleId) {
    setDrafts((current) => ({ ...current, [moduleId]: createModuleDraft(moduleId) }));
    setEditing((current) => ({ ...current, [moduleId]: null }));
    if (moduleId === "itemsCatalog") setItemFormOpen(false);
    if (moduleId === "incomingGoodsServices") setBillView("journal");
    if (moduleId === "manualJournals") setJournalView("journal");
    if (moduleId === "chartOfAccounts") setChartView("journal");
    if (moduleId === "vendors") setVendorView("journal");
    if (moduleId === "goods") setGoodsView("journal");
    if (moduleId === "invoices") setInvoiceView("journal");
    if (moduleId === "customers") setCustomerView("journal");
  }

  async function submitModule(moduleId, event) {
    event.preventDefault();
    const config = MODULES[moduleId];
    const activeDraft = drafts[moduleId] || createModuleDraft(moduleId);
    const editingId = editing[moduleId];
    if (!editingId && !guardOperationAccess()) return;
    if (moduleId === "customers") {
      await submitCustomerModule(activeDraft, editingId);
      return;
    }
    if (moduleId === "vendors") {
      await submitVendorModule(activeDraft, editingId);
      return;
    }
    if (moduleId === "invoices") {
      await submitInvoiceModule(activeDraft, editingId);
      return;
    }
    if (moduleId === "manualJournals") {
      const analysis = getManualJournalAnalysis(activeDraft);
      if (!analysis.isBalanced) {
        return;
      }
    }
    const payload = moduleId === "manualJournals"
      ? {
        ...parseDraft(moduleId, activeDraft),
          journalLines: getManualJournalAnalysis(activeDraft).filledLines.map((line) => ({
            id: line.id,
            accountCode: line.accountCode,
            entryType: line.entryType,
            amount: Number(line.amount || 0),
            linkedQuantity: Number(line.linkedQuantity || 0),
            linkedUnit: line.linkedUnit || "",
            subledgerCategory: line.subledgerCategory || "",
            linkedEntityType: line.linkedEntityType || "",
            linkedEntityId: line.linkedEntityId || "",
          linkedEntityName: line.linkedEntityName || ""
        })),
        debitAccount: getManualJournalAnalysis(activeDraft).filledLines.find((line) => line.entryType === "Debet")?.accountCode || "",
        creditAccount: getManualJournalAnalysis(activeDraft).filledLines.find((line) => line.entryType === "Kredit")?.accountCode || "",
        debit: getManualJournalAnalysis(activeDraft).debitTotal,
        credit: getManualJournalAnalysis(activeDraft).creditTotal
      }
      : moduleId === "incomingGoodsServices"
        ? (() => {
          const lineItems = (activeDraft.lineItems || []).map((item) => {
            const accountCode = normalizeAccountCodeInput(item.accountCode || item.account || "", "205");
            const calc = calculateLineItem(item.quantity, item.rate, item.taxLabel);
            return { ...item, accountCode, ...calc };
          });
          const totals = calculateBillTotals(lineItems, activeDraft.discount, activeDraft.adjustment);
          return {
            billNumber: activeDraft.billNumber || "",
            billDate: activeDraft.billDate || today(),
            vendorName: activeDraft.vendorName || "",
            notes: activeDraft.notes || "",
            discount: Number(activeDraft.discount || 0),
            adjustment: Number(activeDraft.adjustment || 0),
            lineItems,
            ...totals
          };
        })()
        : moduleId === "invoices"
          ? (() => {
            const parsed = { ...parseDraft(moduleId, activeDraft), ...buildOperationalPayload(moduleId, activeDraft) };
            const lineItems = (activeDraft.lineItems || []).map((item) => {
              const accountCode = normalizeAccountCodeInput(item.accountCode || item.account || "", "601");
              const calc = calculateLineItem(item.quantity, item.rate, item.taxLabel);
              return { ...item, accountCode, ...calc };
            });
            const totals = calculateBillTotals(lineItems, activeDraft.discount, activeDraft.adjustment);
            return {
              ...parsed,
              invoiceNumber: String(activeDraft.invoiceNumber || parsed.invoiceNumber || "").trim(),
              customerName: String(activeDraft.customerName || parsed.customerName || "").trim(),
              dueDate: activeDraft.dueDate || parsed.dueDate || today(),
              status: activeDraft.status || parsed.status || "Qaralama",
              notes: activeDraft.notes || "",
              discount: Number(activeDraft.discount || 0),
              adjustment: Number(activeDraft.adjustment || 0),
              lineItems,
              ...totals,
              amount: Number(totals.totalAmount || 0)
            };
          })()
        : moduleId === "vendors"
          ? (() => {
            const parsed = { ...parseDraft(moduleId, activeDraft), ...buildOperationalPayload(moduleId, activeDraft) };
            return {
              ...parsed,
              vendorName: String(parsed.vendorName || "").trim() || String(parsed.companyName || "").trim()
            };
          })()
        : moduleId === "customers"
          ? (() => {
            const parsed = { ...parseDraft(moduleId, activeDraft), ...buildOperationalPayload(moduleId, activeDraft) };
            return {
              ...parsed,
              displayName: String(parsed.displayName || "").trim() || String(parsed.companyName || "").trim()
            };
          })()
        : { ...parseDraft(moduleId, activeDraft), ...buildOperationalPayload(moduleId, activeDraft) };
    let blockedByInventory = false;
    setState((current) => {
      let inventoryBaseState = current;
      if (moduleId === "manualJournals" && editingId) {
        const existingRecord = current.manualJournals.find((item) => item.id === editingId);
        if (existingRecord) inventoryBaseState = applyManualJournalInventory(current, existingRecord, "revert");
      }
      const nextRecord = editingId
        ? { ...(current[config.collection].find((item) => item.id === editingId) || {}), ...payload, id: editingId }
        : { id: crypto.randomUUID(), createdAt: today(), ...payload };
      if (moduleId === "manualJournals" && !canApplyManualJournalInventory(nextRecord, inventoryBaseState)) {
        blockedByInventory = true;
        return current;
      }
      let nextCollection = editingId
        ? inventoryBaseState[config.collection].map((item) => item.id === editingId ? { ...item, ...payload } : item)
        : [nextRecord, ...inventoryBaseState[config.collection]];

      // Hesablar planı həmişə hesab koduna görə rəqəmsal artan sırada saxlanılır
      if (moduleId === "chartOfAccounts") {
        nextCollection = [...nextCollection].sort((a, b) => Number(a.accountCode) - Number(b.accountCode));
      }

      let nextState = { ...inventoryBaseState, [config.collection]: nextCollection };
      if (moduleId === "incomingGoodsServices") {
        const goodsNameMap = nextState.goods.reduce((map, item) => {
          const existingName = String(item.name || "").trim();
          if (!existingName) return map;
          map.set(existingName.toLowerCase(), existingName);
          return map;
        }, new Map());
        const createdGoods = [];
        (nextRecord.lineItems || []).forEach((lineItem) => {
          const name = String(lineItem.itemName || "").trim();
          if (!name) return;
          const key = name.toLowerCase();
          if (goodsNameMap.has(key)) return;
          goodsNameMap.set(key, name);
          createdGoods.push({
            id: crypto.randomUUID(),
            createdAt: today(),
            name,
            type: "Mal",
            unit: "",
            code: ""
          });
        });
        if (createdGoods.length > 0) {
          nextState = { ...nextState, goods: [...createdGoods, ...nextState.goods] };
        }
      }
      if (moduleId === "manualJournals") {
        nextState = applyManualJournalInventory(nextState, nextRecord, "apply");
      }
      return nextState;
    });
    if (blockedByInventory) {
      window.alert("Inventory tracking aktiv olan mal üçün miqdar daxil edin və stok qalığını yoxlayın.");
      return;
    }

    if (!editingId) markOperationUsage();
    if (moduleId === "itemsCatalog") setItemFormOpen(false);
    cancelEdit(moduleId);
  }

  async function removeModuleRecord(moduleId, recordId) {
    if (moduleId === "customers") {
      await deleteCustomerRecord(recordId);
      return;
    }
    if (moduleId === "vendors") {
      await deleteVendorRecord(recordId);
      return;
    }
    if (moduleId === "invoices") {
      await deleteInvoiceRecord(recordId);
      return;
    }

    const config = MODULES[moduleId];
    setState((current) => {
      let nextState = { ...current, [config.collection]: current[config.collection].filter((item) => item.id !== recordId) };
      if (moduleId === "manualJournals") {
        const existingRecord = current.manualJournals.find((item) => item.id === recordId);
        if (existingRecord) nextState = applyManualJournalInventory(nextState, existingRecord, "revert");
      }
      if (moduleId === "itemsCatalog") {
        nextState.itemMovements = current.itemMovements.filter((item) => item.itemId !== recordId);
      }
      return nextState;
    });
    if (moduleId === "itemsCatalog" && itemMovementDraft.itemId === recordId) {
      const remainingItems = state.items.filter((item) => item.id !== recordId);
      setItemMovementDraft(createMovementDraft(remainingItems));
    }
    if (editing[moduleId] === recordId) cancelEdit(moduleId);
  }

  async function saveSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const checkboxValue = (name) => form.querySelector(`[name="${name}"]`)?.checked ? "Bəli" : "Xeyr";
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        companyName: form.companyName?.value,
        taxId: form.taxId?.value,
        mobilePhone: form.mobilePhone?.value,
        entityType: form.entityType?.value,
        currency: form.currency?.value,
        fiscalYear: form.fiscalYear?.value,
        invoicePrefix: form.invoicePrefix?.value,
        quotePrefix: form.quotePrefix?.value,
        defaultPaymentTerm: form.defaultPaymentTerm?.value,
        defaultTaxLabel: form.defaultTaxLabel?.value,
        numberingMode: form.numberingMode?.value,
        stockWarning: form.stockWarning?.value,
        negativeStock: form.negativeStock?.value,
        autoBackup: form.autoBackup?.value,
        discountMode: form.discountMode?.value,
        discountTiming: form.discountTiming?.value,
        additionalAdjustment: checkboxValue("additionalAdjustment"),
        shippingCharge: checkboxValue("shippingCharge"),
        shippingTaxAutomation: checkboxValue("shippingTaxAutomation"),
        taxMode: form.taxMode?.value,
        roundOffTaxMode: form.roundOffTaxMode?.value,
        salesRoundingMode: form.salesRoundingMode?.value,
        salespersonField: checkboxValue("salespersonField"),
        uiScale: form.uiScale?.value
      }
    }));
    if (currentUser) {
      setAuthUsers((current) => current.map((user) => user.email === currentUser.email ? normalizeAuthUser({
        ...user,
        profile: {
          ...user.profile,
          companyName: form.companyName?.value,
          taxId: form.taxId?.value,
          mobilePhone: form.mobilePhone?.value,
          entityType: form.entityType?.value
        }
      }) : user));
    }
  }

  async function saveSettingsToBackend(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const checkboxValue = (name) => form.querySelector(`[name="${name}"]`)?.checked ? "Bəli" : "Xeyr";
    const profilePayload = {
      companyName: String(form.companyName?.value || "").trim(),
      taxId: String(form.taxId?.value || "").trim(),
      mobilePhone: String(form.mobilePhone?.value || "").trim(),
      entityType: String(form.entityType?.value || "").trim(),
      currency: String(form.currency?.value || "").trim().toUpperCase(),
      fiscalYear: String(form.fiscalYear?.value || "").trim(),
    };

    setCompanySettingsLoading(true);
    setCompanySettingsError("");

    try {
      const response = await apiUpdateCompanySettings(profilePayload, updateBackendSession);
      const nextProfileSettings = normalizeBackendCompanySettings(response);

      setState((current) => ({
        ...current,
        settings: {
          ...current.settings,
          ...nextProfileSettings,
          invoicePrefix: form.invoicePrefix?.value,
          quotePrefix: form.quotePrefix?.value,
          defaultPaymentTerm: form.defaultPaymentTerm?.value,
          defaultTaxLabel: form.defaultTaxLabel?.value,
          numberingMode: form.numberingMode?.value,
          stockWarning: form.stockWarning?.value,
          negativeStock: form.negativeStock?.value,
          autoBackup: form.autoBackup?.value,
          discountMode: form.discountMode?.value,
          discountTiming: form.discountTiming?.value,
          additionalAdjustment: checkboxValue("additionalAdjustment"),
          shippingCharge: checkboxValue("shippingCharge"),
          shippingTaxAutomation: checkboxValue("shippingTaxAutomation"),
          taxMode: form.taxMode?.value,
          roundOffTaxMode: form.roundOffTaxMode?.value,
          salesRoundingMode: form.salesRoundingMode?.value,
          salespersonField: checkboxValue("salespersonField"),
          uiScale: form.uiScale?.value,
        }
      }));

      if (currentUser) {
        setAuthUsers((current) => current.map((user) => user.email === currentUser.email ? normalizeAuthUser({
          ...user,
          profile: {
            ...user.profile,
            companyName: nextProfileSettings.companyName,
            taxId: nextProfileSettings.taxId,
            mobilePhone: nextProfileSettings.mobilePhone,
            entityType: nextProfileSettings.entityType
          }
        }) : user));
      }

      setProfileSaved(true);
    } catch (error) {
      setCompanySettingsError(error?.message || "Şirkət məlumatları yadda saxlanmadı.");
      setProfileSaved(false);
    } finally {
      setCompanySettingsLoading(false);
    }
  }

  function renderCell(record, [key, , type]) {
    const value = record[key];
    if (type === "currency") return currency(value, state.settings.currency);
    if (type === "date") return fmtDate(value);
    if (type === "status") return <span className={`status-pill ${STATUS[value] || "status-draft"}`}>{value}</span>;
    return value || "-";
  }

  function submitItemMovement(event) {
    event.preventDefault();
    if (!guardOperationAccess()) return;
    const item = state.items.find((entry) => entry.id === itemMovementDraft.itemId);
    if (!item) return;

    const quantity = Number(itemMovementDraft.quantity || 0);
    const unitPrice = Number(itemMovementDraft.unitPrice || 0);
    if (!quantity || quantity < 0) return;

    const stockTracked = item.trackInventory === "Bəli" && item.type !== "Xidmət";
    const direction = itemMovementDraft.movementType === "Alış" ? 1 : -1;
    const nextStock = stockTracked ? Number(item.stockOnHand || 0) + (quantity * direction) : Number(item.stockOnHand || 0);
    const taxLabel = resolveMovementTaxLabel(item, itemMovementDraft.movementType, itemMovementDraft.taxLabel);
    const taxBreakdown = calculateTaxBreakdown(quantity * unitPrice, taxLabel, itemMovementDraft.movementType === "Satış" ? state.settings.taxMode : "Vergi xaric");
    const costAmount = itemMovementDraft.movementType === "Satış" && item.type !== "Xidmət" ? Number((quantity * Number(item.purchaseRate || 0)).toFixed(2)) : 0;

    if (stockTracked && nextStock < 0 && state.settings.negativeStock !== "Bəli") return;

    const movement = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      movementType: itemMovementDraft.movementType,
      quantity,
      unitPrice,
      taxLabel,
      taxRate: taxBreakdown.taxRate,
      taxAmount: taxBreakdown.taxAmount,
      baseAmount: taxBreakdown.baseAmount,
      itemType: item.type,
      costAmount,
      partner: itemMovementDraft.partner,
      movementDate: itemMovementDraft.movementDate,
      note: itemMovementDraft.note,
      amount: taxBreakdown.totalAmount
    };

    setState((current) => ({
      ...current,
      items: current.items.map((entry) => {
        if (entry.id !== item.id) return entry;
        return {
          ...entry,
          rate: itemMovementDraft.movementType === "Satış" ? (unitPrice || entry.rate) : entry.rate,
          purchaseRate: itemMovementDraft.movementType === "Alış" ? (unitPrice || entry.purchaseRate) : entry.purchaseRate,
          salesTax: state.settings.defaultTaxLabel,
          purchaseTax: itemMovementDraft.movementType === "Alış" ? taxLabel : entry.purchaseTax,
          stockOnHand: stockTracked ? Number(entry.stockOnHand || 0) + (quantity * direction) : entry.stockOnHand
        };
      }),
      itemMovements: [movement, ...current.itemMovements]
    }));

    markOperationUsage();
    setItemMovementDraft((current) => ({
      ...current,
      quantity: "1",
      unitPrice: resolveMovementPrice(item, current.movementType),
      taxLabel: current.movementType === "Alış" ? (item.purchaseTax || "ƏDV 18%") : "",
      partner: "",
      movementDate: today(),
      note: ""
    }));
  }

  function submitBank(event) {
    event.preventDefault();
    if (!editingBank && !guardOperationAccess()) return;
    const bankName = String(bankDraft.bankName || bankDraft.accountName || "").trim();
    const bankCode = String(bankDraft.bankCode || bankDraft.institution || "").trim();
    const settlementAccount = String(bankDraft.settlementAccount || bankDraft.iban || "").trim();
    const payload = {
      bankName,
      bankTaxId: String(bankDraft.bankTaxId || "").trim(),
      bankCode,
      swift: String(bankDraft.swift || "").trim(),
      correspondentAccount: String(bankDraft.correspondentAccount || "").trim(),
      settlementAccount,
      accountName: bankName,
      institution: bankCode,
      accountType: bankDraft.accountType || "Cari",
      balance: Number(bankDraft.balance || 0),
      iban: settlementAccount,
      coaCode: bankDraft.coaCode || "",
      lastSync: today()
    };
    setState((current) => ({
      ...current,
      bankingAccounts: editingBank ? current.bankingAccounts.map((item) => item.id === editingBank ? { ...item, ...payload } : item) : [{ id: crypto.randomUUID(), ...payload }, ...current.bankingAccounts]
    }));
    if (!editingBank) markOperationUsage();
    setBankDraft(createEmptyBankDraft());
    setEditingBank(null);
    setBankView(bankFormOrigin || "banks");
  }

  function submitBankTx(event) {
    event.preventDefault();
    if (!bankTxEditId && !guardOperationAccess()) return;
    const payload = {
      date: bankTxDraft.date || today(),
      description: bankTxDraft.description,
      counterpartyName: bankTxDraft.counterpartyName,
      category: bankTxDraft.category,
      transactionType: bankTxDraft.transactionType,
      amount: Number(bankTxDraft.amount || 0),
      bankAccountId: bankTxDraft.bankAccountId,
      accountCode: bankTxDraft.accountCode,
      reference: bankTxDraft.reference,
    };
    setState((current) => ({
      ...current,
      bankTransactions: bankTxEditId
        ? current.bankTransactions.map((t) => t.id === bankTxEditId ? { ...t, ...payload } : t)
        : [{ id: crypto.randomUUID(), ...payload }, ...current.bankTransactions]
    }));
    if (!bankTxEditId) markOperationUsage();
    setBankTxDraft({ date: "", amount: "", transactionType: "Mədaxil", description: "", counterpartyName: "", bankAccountId: "", accountCode: "", reference: "", category: "" });
    setBankTxAccountSearch("");
    setBankTxEditId(null);
    setBankView("journal");
  }

  function submitDocument(event) {
    event.preventDefault();
    if (!editingDocument && !guardOperationAccess()) return;
    const payload = { ...documentDraft, updatedAt: today() };
    setState((current) => ({
      ...current,
      documents: editingDocument ? current.documents.map((item) => item.id === editingDocument ? { ...item, ...payload } : item) : [{ id: crypto.randomUUID(), ...payload }, ...current.documents]
    }));
    if (!editingDocument) markOperationUsage();
    setDocumentDraft({ title: "", relatedTo: "", category: "Faktura", fileData: null });
    setEditingDocument(null);
  }

function renderItemsCatalog() {
    const config = MODULES.itemsCatalog;
    const query = searches[config.collection] || "";
    const draft = drafts.itemsCatalog || createModuleDraft("itemsCatalog");
    const rows = state.items.filter((item) => matchesSearch(item, query));
    const selectedItem = state.items.find((item) => item.id === itemMovementDraft.itemId) || state.items[0];
    const tracksInventory = selectedItem?.trackInventory === "Bəli" && selectedItem?.type !== "Xidmət";
    const salesInfoEnabled = (draft.enableSalesInfo ?? "Bəli") === "Bəli";
    const purchaseInfoEnabled = (draft.enablePurchaseInfo ?? "Bəli") === "Bəli";
    if (itemFormOpen) {
      return (
        <section className="view active">
          <section className="panel item-editor-screen">
            <div className="item-editor-topbar">
              <div><h3>{editing.itemsCatalog ? at.ic_formTitleEdit : at.ic_formTitleNew}</h3><p className="panel-copy">{at.ic_formDesc}</p></div>
              <button className="icon-btn" type="button" onClick={() => cancelEdit("itemsCatalog")}>×</button>
            </div>
            <div className="item-info-banner">
              <strong>{at.ic_inventoryBadge}</strong>
              <span>{at.ic_inventoryHint}</span>
            </div>
            <form className="item-editor-form" onSubmit={(event) => submitModule("itemsCatalog", event)}>
              <div className="item-editor-hero">
                <div className="item-editor-fields">
                  <label><span>{at.ic_name}</span><input value={draft.name ?? ""} onChange={(event) => updateDraft("itemsCatalog", "name", event.target.value)} required /></label>
                  <label><span>{at.ic_type}</span><div className="type-toggle-group"><button className={`type-toggle ${draft.type === "Anbar malı" ? "active" : ""}`} type="button" onClick={() => updateDraft("itemsCatalog", "type", "Anbar malı")}>{at.ic_typeGoods}</button><button className={`type-toggle ${draft.type === "Xidmət" ? "active" : ""}`} type="button" onClick={() => updateDraft("itemsCatalog", "type", "Xidmət")}>{at.ic_typeService}</button></div></label>
                  <label><span>{at.ic_unit}</span><input value={draft.usageUnit ?? ""} onChange={(event) => updateDraft("itemsCatalog", "usageUnit", event.target.value)} placeholder="ədəd, kq, gün..." /></label>
                  <label><span>SKU</span><input value={draft.sku ?? ""} onChange={(event) => updateDraft("itemsCatalog", "sku", event.target.value)} /></label>
                  <label><span>{at.ic_openingQty}</span><input type="number" step="0.01" value={draft.stockOnHand ?? ""} onChange={(event) => updateDraft("itemsCatalog", "stockOnHand", event.target.value)} disabled={draft.type === "Xidmət"} /></label>
                  <label><span>{at.ic_tracking}</span><select value={draft.trackInventory ?? "Xeyr"} onChange={(event) => updateDraft("itemsCatalog", "trackInventory", event.target.value)}><option value="Bəli">{at.yes}</option><option value="Xeyr">{at.no}</option></select></label>
                </div>
                <div className="item-image-dropzone">
                  <div className="image-drop-icon">⊞</div>
                  <strong>{at.ic_imgPlaceholder}</strong>
                  <span>{at.ic_imgHint}</span>
                </div>
              </div>
              <section className={`item-section ${salesInfoEnabled ? "" : "item-section-disabled"}`}>
                <div className="item-section-head"><button className={`section-toggle ${salesInfoEnabled ? "active" : ""}`} type="button" onClick={() => updateDraft("itemsCatalog", "enableSalesInfo", salesInfoEnabled ? "Xeyr" : "Bəli")}>{salesInfoEnabled ? "✓" : ""}</button><h4>{at.ic_salesInfo}</h4></div>
                <div className="item-section-grid">
                  <label><span>{at.ic_salePrice}</span><input type="number" step="0.01" value={draft.rate ?? ""} onChange={(event) => updateDraft("itemsCatalog", "rate", event.target.value)} required={salesInfoEnabled} disabled={!salesInfoEnabled} /></label>
                  <label><span>{at.ic_account}</span><input value={draft.salesAccount ?? ""} onChange={(event) => updateDraft("itemsCatalog", "salesAccount", event.target.value)} disabled={!salesInfoEnabled} /></label>
                  <label><span>{at.ic_desc}</span><input value={draft.salesDescription ?? ""} onChange={(event) => updateDraft("itemsCatalog", "salesDescription", event.target.value)} disabled={!salesInfoEnabled} /></label>
                  <label><span>{at.ic_tax}</span><input value={state.settings.defaultTaxLabel} readOnly disabled /></label>
                </div>
              </section>
              <section className={`item-section ${purchaseInfoEnabled ? "" : "item-section-disabled"}`}>
                <div className="item-section-head"><button className={`section-toggle ${purchaseInfoEnabled ? "active" : ""}`} type="button" onClick={() => updateDraft("itemsCatalog", "enablePurchaseInfo", purchaseInfoEnabled ? "Xeyr" : "Bəli")}>{purchaseInfoEnabled ? "✓" : ""}</button><h4>{at.ic_purchInfo}</h4></div>
                <div className="item-section-grid">
                  <label><span>{at.ic_purchPrice}</span><input type="number" step="0.01" value={draft.purchaseRate ?? ""} onChange={(event) => updateDraft("itemsCatalog", "purchaseRate", event.target.value)} disabled={!purchaseInfoEnabled} /></label>
                  <label><span>{at.ic_account}</span><input value={draft.purchaseAccount ?? ""} onChange={(event) => updateDraft("itemsCatalog", "purchaseAccount", event.target.value)} disabled={!purchaseInfoEnabled} /></label>
                  <label><span>{at.ic_desc}</span><input value={draft.purchaseDescription ?? ""} onChange={(event) => updateDraft("itemsCatalog", "purchaseDescription", event.target.value)} disabled={!purchaseInfoEnabled} /></label>
                  <label><span>{at.ic_tax}</span><select value={draft.purchaseTax ?? "ƏDV 18%"} onChange={(event) => updateDraft("itemsCatalog", "purchaseTax", event.target.value)} disabled={!purchaseInfoEnabled}>{PURCHASE_TAX_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                  <label><span>{at.ic_prefVendor}</span><input value={draft.preferredVendor ?? ""} onChange={(event) => updateDraft("itemsCatalog", "preferredVendor", event.target.value)} disabled={!purchaseInfoEnabled} /></label>
                  <label><span>{at.ic_reorderPt}</span><input type="number" step="1" value={draft.reorderPoint ?? ""} onChange={(event) => updateDraft("itemsCatalog", "reorderPoint", event.target.value)} disabled={!purchaseInfoEnabled} /></label>
                </div>
              </section>
              <div className="item-form-footer">
                <button className="primary-btn" type="submit">{editing.itemsCatalog ? at.ic_updateBtn : at.save}</button>
                <button className="ghost-btn" type="button" onClick={() => cancelEdit("itemsCatalog")}>{at.cancel}</button>
              </div>
            </form>
          </section>
        </section>
      );
    }

    const movementTaxLabel = resolveMovementTaxLabel(selectedItem, itemMovementDraft.movementType, itemMovementDraft.taxLabel);
    const movementPreview = calculateTaxBreakdown(Number(itemMovementDraft.quantity || 0) * Number(itemMovementDraft.unitPrice || 0), movementTaxLabel, itemMovementDraft.movementType === "Satış" ? state.settings.taxMode : "Vergi xaric");

    return (
      <section className="view active">
        <section className="panel item-list-screen">
          <div className="item-list-header">
            <div><h3>{at.ic_listTitle}</h3><p className="panel-copy">{at.ic_listDesc}</p></div>
            <div className="item-list-actions"><button className="primary-btn compact-btn" type="button" onClick={() => openNewItemForm(setDrafts, setEditing, setItemFormOpen)}>{at.ic_newBtn}</button></div>
          </div>
          <div className="panel-toolbar"><input className="search-input" placeholder={at.search} value={query} onChange={(event) => setSearches((current) => ({ ...current, [config.collection]: event.target.value }))} /></div>
          <Table
            headers={[fld("Ad"), at.ic_desc, at.ic_purchPrice, at.ic_desc, at.ic_salePrice, at.ic_unit, at.action]}
            emptyMessage={at.noItems}
            rows={rows.map((record) => (
              <tr key={record.id}>
                <td>{record.name}{isLowStockItem(record) ? <div className="inline-warning">Minimum həddə çatıb</div> : null}</td>
                <td>{record.purchaseDescription || "-"}</td>
                <td>{currency(record.purchaseRate, state.settings.currency)}</td>
                <td>{record.salesDescription || "-"}</td>
                <td>{currency(record.rate, state.settings.currency)}</td>
                <td>{record.usageUnit || "-"}</td>
                <td><div className="row-actions"><button className="table-btn" onClick={() => startEdit("itemsCatalog", record)}>{at.edit}</button><button className="table-btn danger-btn" onClick={() => removeModuleRecord("itemsCatalog", record.id)}>{at.delete}</button></div></td>
              </tr>
            ))}
          />
        </section>
        <div className="panel-grid two-up dashboard-grid">
          <section className="panel">
            <div className="panel-head"><div><h3>{at.inv_panelTitle}</h3><p className="panel-copy">{at.inv_panelDesc}</p></div><span>{at.inv_panelBadge}</span></div>
            <div className="item-profile-card">
              <div><span>{at.inv_selectedItem}</span><strong>{selectedItem?.name || "-"}</strong></div>
              <div><span>{at.inv_currentStock}</span><strong>{selectedItem?.type === "Xidmət" ? at.inv_noTracking : `${selectedItem?.stockOnHand || 0} ${selectedItem?.usageUnit || ""}`}</strong></div>
              <div><span>{at.inv_salesTax}</span><strong>{state.settings.defaultTaxLabel}</strong></div>
              <div><span>{at.inv_purchaseTax}</span><strong>{selectedItem?.purchaseTax || "ƏDV 18%"}</strong></div>
            </div>
            <form className="form-grid embedded-item-form" onSubmit={submitItemMovement}>
              <label><span>{at.inv_item}</span><select value={itemMovementDraft.itemId} onChange={(event) => {
                const nextItem = state.items.find((item) => item.id === event.target.value);
                setItemMovementDraft((current) => ({
                  ...current,
                  itemId: event.target.value,
                  unitPrice: resolveMovementPrice(nextItem, current.movementType),
                  taxLabel: current.movementType === "Alış" ? (nextItem?.purchaseTax || "ƏDV 18%") : ""
                }));
              }}>{state.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>{at.inv_movementType}</span><select value={itemMovementDraft.movementType} onChange={(event) => {
                const movementType = event.target.value;
                setItemMovementDraft((current) => ({
                  ...current,
                  movementType,
                  unitPrice: resolveMovementPrice(selectedItem, movementType),
                  taxLabel: movementType === "Alış" ? (selectedItem?.purchaseTax || "ƏDV 18%") : ""
                }));
              }}>{ITEM_MOVEMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              <label><span>{at.inv_qty}</span><input type="number" step="0.01" value={itemMovementDraft.quantity} onChange={(event) => setItemMovementDraft((current) => ({ ...current, quantity: event.target.value }))} required /></label>
              <label><span>{at.inv_unitPrice}</span><input type="number" step="0.01" value={itemMovementDraft.unitPrice} onChange={(event) => setItemMovementDraft((current) => ({ ...current, unitPrice: event.target.value }))} required /></label>
              <label><span>{at.inv_taxRate}</span>{itemMovementDraft.movementType === "Satış" ? <input value={state.settings.defaultTaxLabel} readOnly /> : <select value={itemMovementDraft.taxLabel || selectedItem?.purchaseTax || "ƏDV 18%"} onChange={(event) => setItemMovementDraft((current) => ({ ...current, taxLabel: event.target.value }))}>{PURCHASE_TAX_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>}</label>
              <label><span>{at.inv_partner}</span><input value={itemMovementDraft.partner} onChange={(event) => setItemMovementDraft((current) => ({ ...current, partner: event.target.value }))} placeholder={itemMovementDraft.movementType === "Satış" ? at.inv_partnerCust : at.inv_partnerVend} /></label>
              <label><span>{at.inv_date}</span><input type="date" value={itemMovementDraft.movementDate} onChange={(event) => setItemMovementDraft((current) => ({ ...current, movementDate: event.target.value }))} required /></label>
              <label><span>{at.inv_note}</span><input value={itemMovementDraft.note} onChange={(event) => setItemMovementDraft((current) => ({ ...current, note: event.target.value }))} /></label>
              <div className="inventory-inline-note">
                <strong>{at.inv_taxCalc}</strong>
                <span>{at.inv_baseAmt}: {currency(movementPreview.baseAmount, state.settings.currency)} | {at.inv_vat}: {currency(movementPreview.taxAmount, state.settings.currency)} | {at.inv_total}: {currency(movementPreview.totalAmount, state.settings.currency)}</span>
              </div>
                <div className="inventory-inline-note">
                <strong>{at.inv_posting}</strong>
                <span>{itemMovementDraft.movementType === "Satış" ? at.inv_postingSale : at.inv_postingPurchase} {movementPreview.taxAmount > 0 ? `| ${at.inv_vat}: ${movementTaxLabel}` : `| ${at.inv_noVat}`}</span>
              </div>
              <div className="form-actions"><button className="primary-btn" type="submit">{at.inv_saveBtn}</button></div>
            </form>
          </section>
          <section className="panel">
            <div className="panel-head"><div><h3>{at.inv_recentTitle}</h3><p className="panel-copy">{at.inv_recentDesc}</p></div><span>{state.itemMovements.length} {at.inv_txUnit}</span></div>
            <Table
              headers={[at.inv_date, at.inv_item, at.inv_movementType, at.inv_qty, at.inv_baseAmt, at.inv_vat, at.inv_total]}
              emptyMessage={at.inv_empty}
              rows={state.itemMovements.slice(0, 8).map((movement) => (
                <tr key={movement.id}>
                  <td>{fmtDate(movement.movementDate)}</td>
                  <td>{movement.itemName}</td>
                  <td>{movement.movementType === "Satış" ? at.inv_movSale : movement.movementType === "Alış" ? at.inv_movPurchase : movement.movementType}</td>
                  <td>{movement.quantity}</td>
                  <td>{currency(movement.baseAmount || movement.amount, state.settings.currency)}</td>
                  <td>{currency(movement.taxAmount || 0, state.settings.currency)}</td>
                  <td>{currency(movement.amount, state.settings.currency)}</td>
                </tr>
              ))}
            />
          </section>
        </div>
      </section>
    );
  }

  function renderGoods() {
    const config = MODULES.goods;
    const query = searches[config.collection] || "";
    const draft = drafts.goods || createModuleDraft("goods");
    const allGoods = state.goods.filter((item) => matchesSearch(item, query));
    const visibleRows = goodsTabIdx === 1 ? allGoods.filter((g) => g.type === "Mal" || !g.type) : goodsTabIdx === 2 ? allGoods.filter((g) => g.type === "Xidmət") : allGoods;

    // ── Overview ──
    if (goodsView === "overview") {
      return (
        <section className="view active">
          {OVERVIEWS[activeSection]?.includes("goods") && (
            <div className="module-back-bar">
              <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
            </div>
          )}
          <div className="bill-hub">
            <div className="bill-hub-card" onClick={() => setGoodsView("journal")}>
              <div className="bill-hub-icon">📦</div>
              <div className="bill-hub-info">
                <h3>{at.hub_goodsJournal}</h3>
                <p>{at.hub_goodsJournalDesc}</p>
                <span className="bill-hub-count">{state.goods.length} {at.hub_goodsCount}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
            <div className="bill-hub-card" onClick={() => { cancelEdit("goods"); setGoodsView("form"); }}>
              <div className="bill-hub-icon">➕</div>
              <div className="bill-hub-info">
                <h3>{at.hub_goodsNew}</h3>
                <p>{at.hub_goodsNewDesc}</p>
                <span className="bill-hub-count">{at.newRecord}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
          </div>
        </section>
      );
    }

    // ── Journal (list) ──
    if (goodsView === "journal") {
      return (
        <section className="view active">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => setGoodsView("overview")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{at.hub_goodsJournal}</h2>
              <button className="primary-btn" type="button" onClick={() => { cancelEdit("goods"); setGoodsView("form"); }}>{at.hub_goodsNew}</button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-toolbar nomen-toolbar">
              <div className="nomen-tabs">
                {[at.goods_tabAll, at.goods_tabGoods, at.goods_tabServices].map((tabLabel, tabIdx) => (
                  <button key={tabIdx} className={`nomen-tab${goodsTabIdx === tabIdx ? " active" : ""}`} type="button" onClick={() => setGoodsTabIdx(tabIdx)}>
                    {tabLabel}
                    <span className="nomen-tab-count">
                      {tabIdx === 0 ? state.goods.length : tabIdx === 1 ? state.goods.filter((g) => g.type === "Mal" || !g.type).length : state.goods.filter((g) => g.type === "Xidmət").length}
                    </span>
                  </button>
                ))}
              </div>
              <input className="search-input" placeholder={at.search} value={query} onChange={(e) => setSearches((current) => ({ ...current, [config.collection]: e.target.value }))} />
            </div>
            <div className="nomen-list">
              {visibleRows.length === 0 ? (
                <div className="nomen-empty">
                  <span className="nomen-empty-icon">{goodsTabIdx === 2 ? "⚙" : "📦"}</span>
                  <strong>{query ? at.noResults : goodsTabIdx === 1 ? at.goods_emptyGoods : goodsTabIdx === 2 ? at.goods_emptyServices : at.goods_emptyAll}</strong>
                </div>
              ) : visibleRows.map((record) => (
                <div key={record.id} className="nomen-item">
                  <div className="nomen-item-info">
                    <span className={`nomen-badge ${record.type === "Xidmət" ? "badge-service" : "badge-product"}`}>{record.type === "Xidmət" ? at.ic_typeService : at.ic_typeGoods}</span>
                    <strong className="nomen-item-name">{record.name}</strong>
                    <span className={`nomen-item-unit${record.unit ? "" : " nomen-item-unit-empty"}`}>{record.unit || "— vahid"}</span>
                    {record.code ? <span className="nomen-item-code">{record.code}</span> : null}
                  </div>
                  <div className="row-actions">
                    <button className="table-btn" onClick={() => startEdit("goods", record)}>{at.edit}</button>
                    <button className="table-btn danger-btn" onClick={() => removeModuleRecord("goods", record.id)}>{at.delete}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // ── Form ──
    return (
      <section className="view active">
        <div className="bill-form-page">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => cancelEdit("goods")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{editing.goods ? at.formTitle_editGoods : at.formTitle_newGoods}</h2>
            </div>
          </div>
          <div className="bill-form-panel">
            <form className="form-grid" onSubmit={(event) => submitModule("goods", event)}>
              <label>
                <span>{at.ic_name}</span>
                <input value={draft.name ?? ""} onChange={(e) => updateDraft("goods", "name", e.target.value)} placeholder={draft.type === "Xidmət" ? "Xidmətin adı..." : "Malın adı..."} required />
              </label>
              <label>
                <span>{at.ic_type}</span>
                <div className="type-toggle-group">
                  <button className={`type-toggle${(draft.type ?? "Mal") === "Mal" ? " active" : ""}`} type="button" onClick={() => updateDraft("goods", "type", "Mal")}>📦 {at.ic_typeGoods}</button>
                  <button className={`type-toggle${draft.type === "Xidmət" ? " active" : ""}`} type="button" onClick={() => updateDraft("goods", "type", "Xidmət")}>⚙ {at.ic_typeService}</button>
                </div>
              </label>
              <label>
                <span>{at.ic_unit}</span>
                <div className="nomen-unit-field">
                  <input list="nomen-unit-list" value={draft.unit ?? ""} onChange={(e) => updateDraft("goods", "unit", e.target.value)} placeholder="Seçin və ya yazın..." />
                  <datalist id="nomen-unit-list">
                    {["ədəd","kq","qram","ton","litr","ml","metr","sm","m²","m³","km","qutu","paket","dəst","cüt","top","çuval","xidmət","saat","gün","ay","il"].map((u) => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </label>
              <label>
                <span>{at.ic_codeOptional}</span>
                <input value={draft.code ?? ""} onChange={(e) => updateDraft("goods", "code", e.target.value)} placeholder="M-001 / X-001..." />
              </label>
              <div className="nomen-form-hint">
                <strong>{draft.type === "Xidmət" ? at.ic_serviceNoteTitle : at.ic_goodsNoteTitle}</strong>
                <span>{draft.type === "Xidmət" ? at.ic_serviceNoteDesc : at.ic_goodsNoteDesc}</span>
              </div>
              <div className="form-actions">
                <button className="primary-btn" type="submit">{editing.goods ? at.ic_updateBtn : at.save}</button>
                <button className="ghost-btn" type="button" onClick={() => cancelEdit("goods")}>{at.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  function renderCustomers() {
    const config = MODULES.customers;
    const query = searches[config.collection] || "";
    const draft = drafts.customers || createModuleDraft("customers");
    const rows = state.customers.filter((item) => matchesSearch(item, query));
    const customerCount = customersMeta?.total ?? state.customers.length;
    const customerStatusNotice = customersLoading ? "Müştərilər backend-dən yüklənir..." : customersError;
    const customerEmptyMessage = customersLoading ? "Müştərilər yüklənir..." : at.noCust;

    if (customerView === "overview") {
      return (
        <section className="view active">
          {OVERVIEWS[activeSection]?.includes("customers") && (
            <div className="module-back-bar">
              <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
            </div>
          )}
          {customerStatusNotice ? (
            <div className="panel">
              <p className="panel-copy">{customerStatusNotice}</p>
            </div>
          ) : null}
          <div className="bill-hub">
            <div className="bill-hub-card" onClick={() => setCustomerView("journal")}>
              <div className="bill-hub-icon">👥</div>
              <div className="bill-hub-info">
                <h3>{at.hub_customersJournal}</h3>
                <p>{at.hub_customersJournalDesc}</p>
                <span className="bill-hub-count">{customerCount} {at.hub_customersCount}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
            <div className="bill-hub-card" onClick={() => { cancelEdit("customers"); setCustomerView("form"); }}>
              <div className="bill-hub-icon">➕</div>
              <div className="bill-hub-info">
                <h3>{at.hub_customersNew}</h3>
                <p>{at.hub_customersNewDesc}</p>
                <span className="bill-hub-count">{at.newRecord}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
          </div>
        </section>
      );
    }

    if (customerView === "journal") {
      return (
        <section className="view active">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => setCustomerView("overview")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{at.custJournalTitle}</h2>
              <button className="primary-btn" type="button" onClick={() => { cancelEdit("customers"); setCustomerView("form"); }}>{at.journalNewCust}</button>
            </div>
          </div>
          <div className="panel">
            {customerStatusNotice ? <p className="panel-copy">{customerStatusNotice}</p> : null}
            <div className="panel-toolbar">
              <input className="search-input" placeholder={at.searchCust} value={query} onChange={(e) => setSearches((current) => ({ ...current, [config.collection]: e.target.value }))} />
            </div>
            <Table
              headers={config.columns.map(([, label]) => col(label)).concat(at.action)}
              emptyMessage={customerEmptyMessage}
              rows={rows.map((record) => (
                <tr key={record.id}>
                  {config.columns.map((col) => <td key={col[0]}>{renderCell(record, col)}</td>)}
                  <td><div className="row-actions">
                    <button className="table-btn" onClick={() => startEdit("customers", record)} disabled={customersLoading}>{at.edit}</button>
                    <button className="table-btn danger-btn" onClick={() => removeModuleRecord("customers", record.id)} disabled={customersLoading}>{at.delete}</button>
                  </div></td>
                </tr>
              ))}
            />
          </div>
        </section>
      );
    }

    return (
      <section className="view active">
        <div className="bill-form-page">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => cancelEdit("customers")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{editing.customers ? at.formTitle_editCustomer : at.formTitle_newCustomer}</h2>
            </div>
          </div>
          <div className="bill-form-panel">
            <form className="form-grid" onSubmit={(event) => submitModule("customers", event)}>
              {customerStatusNotice ? <p className="panel-copy">{customerStatusNotice}</p> : null}
              {config.form.filter((field) => field[0] !== "displayName" && field[0] !== "email" && field[0] !== "outstandingReceivables").map((field) => (
                <label key={field[0]}>
                  <span>{fld(field[1])}</span>
                  <SmartField field={field} value={draft[field[0]] ?? ""} onChange={(e) => updateDraft("customers", field[0], e.target.value)} at={at} />
                </label>
              ))}
              <div className="form-actions">
                <button className="primary-btn" type="submit" disabled={customersLoading}>{editing.customers ? at.ic_updateBtn : at.save}</button>
                <button className="ghost-btn" type="button" onClick={() => cancelEdit("customers")} disabled={customersLoading}>{at.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  function renderInvoices() {
    const config = MODULES.invoices;
    const query = searches[config.collection] || "";
    const draft = drafts.invoices || createModuleDraft("invoices");
    const rows = state.invoices.filter((item) => matchesSearch(item, query));
    const lineItems = draft.lineItems || [createDefaultSalesLineItem()];
    const invoiceTotals = calculateBillTotals(lineItems, draft.discount, draft.adjustment);
    const invoiceCount = invoicesMeta?.total ?? state.invoices.length;
    const invoiceStatusNotice = invoicesLoading ? "Fakturalar backend-dən yüklənir..." : invoicesError;
    const invoiceEmptyMessage = invoicesLoading ? "Fakturalar yüklənir..." : at.noInvoice;
    const invoiceCustomerOptions = state.customers
      .map((item) => ({
        id: item.id,
        label: String(item.companyName || item.displayName || "").trim(),
      }))
      .filter((item) => item.id && item.label);
    const invoiceGoodsNameOptions = Array.from(
      state.goods.reduce((map, item) => {
        const name = String(item.name || "").trim();
        if (!name) return map;
        const key = name.toLowerCase();
        if (!map.has(key)) map.set(key, name);
        return map;
      }, new Map()).values()
    );
    const invoiceIncomeAccountOptions = state.chartOfAccounts
      .filter((account) => isVisibleAccount(account) && inferAccountTypeFromCode(account.accountCode, account.accountType) === "Gəlir")
      .slice()
      .sort((a, b) => Number(a.accountCode) - Number(b.accountCode));

    const updateInvoiceLineItem = (lineId, field, value) => {
      setDrafts((current) => {
        const currentDraft = current.invoices || createModuleDraft("invoices");
        return {
          ...current,
          invoices: {
            ...currentDraft,
            lineItems: (currentDraft.lineItems || [createDefaultSalesLineItem()]).map((item) => {
              if (item.id !== lineId) return item;
              const nextValue = field === "accountCode" ? normalizeAccountCodeInput(value, item.accountCode || "601") : value;
              const nextItem = { ...item, [field]: nextValue };
              return { ...nextItem, ...calculateLineItem(nextItem.quantity, nextItem.rate, nextItem.taxLabel) };
            })
          }
        };
      });
    };

    const addInvoiceLineItem = () => {
      setDrafts((current) => {
        const currentDraft = current.invoices || createModuleDraft("invoices");
        return {
          ...current,
          invoices: {
            ...currentDraft,
            lineItems: [...(currentDraft.lineItems || [createDefaultSalesLineItem()]), createDefaultSalesLineItem()]
          }
        };
      });
    };

    const removeInvoiceLineItem = (lineId) => {
      setDrafts((current) => {
        const currentDraft = current.invoices || createModuleDraft("invoices");
        const currentItems = currentDraft.lineItems || [createDefaultSalesLineItem()];
        const nextItems = currentItems.filter((item) => item.id !== lineId);
        return {
          ...current,
          invoices: {
            ...currentDraft,
            lineItems: nextItems.length > 0 ? nextItems : [createDefaultSalesLineItem()]
          }
        };
      });
    };

    if (invoiceView === "overview") {
      return (
        <section className="view active">
          {OVERVIEWS[activeSection]?.includes("invoices") && (
            <div className="module-back-bar">
              <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
            </div>
          )}
          {invoiceStatusNotice ? (
            <div className="panel">
              <p className="panel-copy">{invoiceStatusNotice}</p>
            </div>
          ) : null}
          <div className="bill-hub">
            <div className="bill-hub-card" onClick={() => setInvoiceView("journal")}>
              <div className="bill-hub-icon">🧾</div>
              <div className="bill-hub-info">
                <h3>{at.hub_invoicesJournal}</h3>
                <p>{at.hub_invoicesJournalDesc}</p>
                <span className="bill-hub-count">{invoiceCount} {at.unit_record}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
            <div className="bill-hub-card" onClick={() => { cancelEdit("invoices"); setInvoiceView("form"); }}>
              <div className="bill-hub-icon">➕</div>
              <div className="bill-hub-info">
                <h3>{at.hub_invoicesNew}</h3>
                <p>{at.hub_invoicesNewDesc}</p>
                <span className="bill-hub-count">{at.newRecord}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
          </div>
        </section>
      );
    }

    if (invoiceView === "journal") {
      const invoiceJournalColumns = [...config.columns, ["debitAmount", "Debet", "currency"], ["creditAmount", "Kredit", "currency"]];
      const invoiceJournalRows = rows.map((record) => {
        const ledgerLines = getInvoiceLedgerEntries(record);
        const debitAmount = Number(ledgerLines.reduce((sum, line) => sum + Number(line.debit || 0), 0).toFixed(2));
        const creditAmount = Number(ledgerLines.reduce((sum, line) => sum + Number(line.credit || 0), 0).toFixed(2));
        return { ...record, debitAmount, creditAmount };
      });
      const activeInvoiceLedgerRecord = invoiceJournalRows.find((record) => record.id === invoiceLedgerRecordId) || null;
      const activeInvoiceLedgerLines = activeInvoiceLedgerRecord ? getInvoiceLedgerEntries(activeInvoiceLedgerRecord) : [];
      const activeInvoiceLedgerTotals = activeInvoiceLedgerLines.reduce((acc, line) => ({
        debit: acc.debit + Number(line.debit || 0),
        credit: acc.credit + Number(line.credit || 0)
      }), { debit: 0, credit: 0 });
      const formatInvoiceLedgerAmount = (value) => Number(value || 0) === 0 ? "" : currency(value, state.settings.currency);
      return (
        <section className="view active">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => setInvoiceView("overview")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{at.invoiceJournalTitle}</h2>
              <button className="primary-btn" type="button" onClick={() => { cancelEdit("invoices"); setInvoiceView("form"); }}>{at.journalNewInvoice}</button>
            </div>
          </div>
          <div className="panel">
            {invoiceStatusNotice ? <p className="panel-copy">{invoiceStatusNotice}</p> : null}
            <div className="panel-toolbar">
              <input className="search-input" placeholder={at.searchInvoice} value={query} onChange={(e) => setSearches((current) => ({ ...current, [config.collection]: e.target.value }))} />
            </div>
            <Table
              headers={invoiceJournalColumns.map(([, label]) => col(label)).concat(at.action)}
              emptyMessage={invoiceEmptyMessage}
              rows={invoiceJournalRows.map((record) => (
                <tr key={record.id}>
                  {invoiceJournalColumns.map((column) => <td key={column[0]}>{renderCell(record, column)}</td>)}
                  <td><div className="row-actions">
                    <button className="table-btn" onClick={() => startEdit("invoices", record)} disabled={invoicesLoading}>{at.edit}</button>
                    <button className="table-btn danger-btn" onClick={() => removeModuleRecord("invoices", record.id)} disabled={invoicesLoading}>{at.delete}</button>
                    <button className="table-btn" type="button" onClick={() => setInvoiceLedgerRecordId((current) => current === record.id ? null : record.id)} disabled={invoicesLoading}>Müxabirləşməyə bax</button>
                  </div></td>
                </tr>
              ))}
            />
            {activeInvoiceLedgerRecord ? (
              <div className="incoming-ledger-panel">
                <div className="incoming-ledger-panel-head">
                  <strong>Müxabirləşmə: {activeInvoiceLedgerRecord.invoiceNumber || "Satış qaiməsi"}</strong>
                  <button className="table-btn" type="button" onClick={() => setInvoiceLedgerRecordId(null)}>Bağla</button>
                </div>
                <Table
                  headers={["Hesab", "Debet", "Kredit"]}
                  emptyMessage={at.noItems}
                  rows={activeInvoiceLedgerLines.map((line) => (
                    <tr key={line.key}>
                      <td>{line.accountCode} - {line.accountName}</td>
                      <td>{formatInvoiceLedgerAmount(line.debit)}</td>
                      <td>{formatInvoiceLedgerAmount(line.credit)}</td>
                    </tr>
                  )).concat([
                    <tr key="invoice-ledger-total">
                      <td><strong>Cəmi</strong></td>
                      <td><strong>{formatInvoiceLedgerAmount(activeInvoiceLedgerTotals.debit)}</strong></td>
                      <td><strong>{formatInvoiceLedgerAmount(activeInvoiceLedgerTotals.credit)}</strong></td>
                    </tr>
                  ])}
                />
              </div>
            ) : null}
          </div>
        </section>
      );
    }

    return (
      <section className="view active">
        <div className="bill-form-page">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => cancelEdit("invoices")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{editing.invoices ? at.formTitle_editInvoice : at.formTitle_newInvoice}</h2>
            </div>
          </div>
          <div className="bill-form-panel">
            <form className="form-grid" onSubmit={(event) => submitModule("invoices", event)}>
              {invoiceStatusNotice ? <p className="panel-copy">{invoiceStatusNotice}</p> : null}
              <div className="bill-header-fields">
                <label className="bill-header-field">
                  <span>{col("Faktura #")}</span>
                  <input value={draft.invoiceNumber ?? ""} onChange={(event) => updateDraft("invoices", "invoiceNumber", event.target.value)} required disabled={invoicesLoading} />
                </label>
                <label className="bill-header-field">
                  <span>{col("Son tarix")}</span>
                  <input type="date" value={draft.dueDate ?? today()} onChange={(event) => updateDraft("invoices", "dueDate", event.target.value)} required disabled={invoicesLoading} />
                </label>
                <label className="bill-header-field">
                  <span>{col("Müştəri")}</span>
                  <select value={draft.customerId ?? ""} onChange={(event) => {
                    const selectedId = event.target.value;
                    const selectedCustomer = state.customers.find((item) => item.id === selectedId);
                    updateDraft("invoices", "customerId", selectedId);
                    updateDraft("invoices", "customerName", selectedCustomer ? String(selectedCustomer.companyName || selectedCustomer.displayName || "").trim() : "");
                  }} required disabled={invoicesLoading}>
                    <option value="">Müştəri seçin...</option>
                    {invoiceCustomerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="bill-item-table-wrap">
                <table className="bill-item-table">
                  <thead>
                    <tr>
                      <th>{fld("Ad")}</th>
                      <th>{col("Kod")}</th>
                      <th>{at.inv_qty || "Miqdar"}</th>
                      <th>{at.inv_unitPrice || "Qiymət"}</th>
                      <th>{at.inv_taxRate || "Vergi"}</th>
                      <th>{col("Cəmi")}</th>
                      <th>{at.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id}>
                        <td><input list="invoice-goods-list" value={item.itemName ?? ""} onChange={(event) => updateInvoiceLineItem(item.id, "itemName", event.target.value)} placeholder={fld("Ad")} disabled={invoicesLoading} /></td>
                        <td>
                          <select value={item.accountCode ?? "601"} onChange={(event) => updateInvoiceLineItem(item.id, "accountCode", event.target.value)} disabled={invoicesLoading}>
                            {(invoiceIncomeAccountOptions.length ? invoiceIncomeAccountOptions : [{ id: "default-sales", accountCode: "601", accountName: getAccountNameByCode("601") }]).map((account) => (
                              <option key={`${item.id}-${account.id}`} value={account.accountCode}>{account.accountCode} - {account.accountName}</option>
                            ))}
                          </select>
                        </td>
                        <td><input type="number" step="0.01" min="0" value={item.quantity ?? "1"} onChange={(event) => updateInvoiceLineItem(item.id, "quantity", event.target.value)} disabled={invoicesLoading} /></td>
                        <td><input type="number" step="0.01" min="0" value={item.rate ?? "0"} onChange={(event) => updateInvoiceLineItem(item.id, "rate", event.target.value)} disabled={invoicesLoading} /></td>
                        <td>
                          <select value={item.taxLabel ?? PURCHASE_TAX_OPTIONS[0]} onChange={(event) => updateInvoiceLineItem(item.id, "taxLabel", event.target.value)} disabled={invoicesLoading}>
                            {PURCHASE_TAX_OPTIONS.map((option) => <option key={`${item.id}-${option}`} value={option}>{option}</option>)}
                          </select>
                        </td>
                        <td>{currency(item.amount || 0, state.settings.currency)}</td>
                        <td>
                          <button className="table-btn danger-btn" type="button" onClick={() => removeInvoiceLineItem(item.id)} disabled={invoicesLoading}>{at.delete}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <datalist id="invoice-goods-list">
                {invoiceGoodsNameOptions.map((name) => <option key={name} value={name} />)}
              </datalist>

              <div className="form-actions">
                <button className="ghost-btn" type="button" onClick={addInvoiceLineItem} disabled={invoicesLoading}>{at.mj_addLine || "Sətir əlavə et"}</button>
              </div>

              <label>
                <span>{at.opt_notes || "Qeydlər"}</span>
                <textarea rows={3} value={draft.notes ?? ""} onChange={(event) => updateDraft("invoices", "notes", event.target.value)} disabled={invoicesLoading} />
              </label>

              <div className="bill-header-fields">
                <label className="bill-header-field">
                  <span>{at.col["Status"] || "Status"}</span>
                  <select value={draft.status ?? "Qaralama"} onChange={(event) => updateDraft("invoices", "status", event.target.value)} disabled={invoicesLoading}>
                    {["Qaralama", "Göndərilib", "Gecikib", "Ödənilib"].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="bill-header-field">
                  <span>{at.opt_discountPct || "Endirim (%)"}</span>
                  <input type="number" step="0.01" min="0" value={draft.discount ?? "0"} onChange={(event) => updateDraft("invoices", "discount", event.target.value)} disabled={invoicesLoading} />
                </label>
                <label className="bill-header-field">
                  <span>{at.opt_adjustment || "Düzəliş"}</span>
                  <input type="number" step="0.01" value={draft.adjustment ?? "0"} onChange={(event) => updateDraft("invoices", "adjustment", event.target.value)} disabled={invoicesLoading} />
                </label>
              </div>

              <div className="ops-preview-strip">
                <div><span>{at.opt_subTotal || "Alt cəmi"}</span><strong>{currency(invoiceTotals.subTotal || 0, state.settings.currency)}</strong></div>
                <div><span>{at.inv_form_discount || "Endirim"}</span><strong>{currency(invoiceTotals.discountAmount || 0, state.settings.currency)}</strong></div>
                <div><span>{at.fld["Cəmi məbləğ"] || "Cəmi məbləğ"}</span><strong>{currency(invoiceTotals.totalAmount || 0, state.settings.currency)}</strong></div>
              </div>

              <div className="form-actions">
                <button className="primary-btn" type="submit" disabled={invoicesLoading}>{editing.invoices ? at.ic_updateBtn : at.save}</button>
                <button className="ghost-btn" type="button" onClick={() => cancelEdit("invoices")} disabled={invoicesLoading}>{at.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  function renderDebtReport(type) {
    const isReceivables = type === "receivables";
    const title = isReceivables ? "Debitor borclar" : "Kreditor borclar";
    const icon = isReceivables ? "🟢" : "🔴";
    const query = debtSearch[type] || "";
    const cur = state.settings.currency;
    const debtLookup = getTrialBalanceLookup();
    const findLinkedVendor = (item) => {
      const targetName = String(item.name || "").trim().toLowerCase();
      const targetCompany = String(item.company || "").trim().toLowerCase();
      return state.vendors.find((entry) => {
        const vendorName = String(entry.vendorName || "").trim().toLowerCase();
        const companyName = String(entry.companyName || "").trim().toLowerCase();
        return (
          (targetName && (vendorName === targetName || companyName === targetName)) ||
          (targetCompany && (vendorName === targetCompany || companyName === targetCompany))
        );
      }) || null;
    };
    const openDebtAccountCard = (item) => {
      const fallbackAccount = isReceivables ? "211" : "531";
      const accountCode = String(item.glAccountText || "")
        .split(",")
        .map((value) => value.trim())
        .find((value) => /^\d+$/.test(value)) || fallbackAccount;
      const nextFilters = {
        dateFrom: accountCardFilters.dateFrom,
        dateTo: accountCardFilters.dateTo,
        accountCode,
        entityName: item.name || ""
      };
      setSection("reports");
      setActiveModule("accountCard");
      setAccountCardFilters(nextFilters);
      setAppliedAccountCardFilters(nextFilters);
      setDebtCard(null);
    };

    // ── Əməliyyatlardan canlı hesablama ────────────────────────────────────
    // Debitor: müştəri bazlı xalis alacaq = invoices(ödənilməmiş) - paymentsReceived
    // Kreditor: satıcı bazlı xalis borc   = bills(ödənilməmiş) + expenses(kredit)

    const debtMap = new Map(); // name → { name, company, txAmount, manualAmount, debitTurnover, creditTurnover, sourceNotes, glAccounts }
    const getDebtRecord = (name, company = "") => debtMap.get(name) || {
      name,
      company,
      txAmount: 0,
      manualAmount: 0,
      debitTurnover: 0,
      creditTurnover: 0,
      sourceNotes: new Set(),
      glAccounts: new Set()
    };

    if (isReceivables) {
      // Satış qaimələri – ödənilməmiş məbləğlər debitor borcunu artırır
      state.invoices.forEach((inv) => {
        if (inv.status === "Ödənilib") return;
        const name = inv.customerName || "Naməlum müştəri";
        const existing = getDebtRecord(name);
        existing.txAmount += Number(inv.amount || 0);
        existing.debitTurnover += Number(inv.amount || 0);
        existing.sourceNotes.add("Satış fakturaları");
        debtMap.set(name, existing);
      });
      // Alınan ödənişlər debitor borcu azaldır
      state.paymentsReceived.forEach((p) => {
        const name = p.customerName || "Naməlum müştəri";
        const existing = getDebtRecord(name);
        existing.txAmount -= Number(p.amount || 0);
        existing.creditTurnover += Number(p.amount || 0);
        existing.sourceNotes.add("Alınan ödənişlər");
        debtMap.set(name, existing);
      });
      // Manual jurnaldakı debitor yazıları
      state.manualJournals.forEach((journal) => {
        const lines = Array.isArray(journal.journalLines) && journal.journalLines.length
          ? journal.journalLines.filter((line) => line.accountCode && Number(line.amount || 0) > 0)
          : [
              journal.debitAccount ? { accountCode: journal.debitAccount, entryType: "Debet", amount: journal.debit, linkedEntityName: "" } : null,
              journal.creditAccount ? { accountCode: journal.creditAccount, entryType: "Kredit", amount: journal.credit, linkedEntityName: "" } : null
            ].filter(Boolean);
        lines.forEach((line) => {
          const accountCode = String(line.accountCode || "");
          const accountType = inferAccountTypeFromCode(accountCode, state.chartOfAccounts.find((account) => account.accountCode === accountCode)?.accountType || "");
          const isDebtorLine = line.subledgerCategory === "debtors" || (accountType === "Aktiv" && ["211", "231"].includes(accountCode));
          if (!isDebtorLine) return;
          const linkedName = line.linkedEntityName || "Manual debitor";
          const existing = getDebtRecord(linkedName);
          const lineAmount = Number(line.amount || 0);
          if (line.entryType === "Debet") {
            existing.txAmount += lineAmount;
            existing.debitTurnover += lineAmount;
          } else {
            existing.txAmount -= lineAmount;
            existing.creditTurnover += lineAmount;
          }
          existing.sourceNotes.add("Manual jurnal");
          existing.glAccounts.add(accountCode);
          debtMap.set(linkedName, existing);
        });
      });
      // Müştəri kartındakı manual sahə
      state.customers.forEach((c) => {
        const name = c.displayName || c.companyName || "—";
        const manual = Number(c.outstandingReceivables || 0);
        if (manual <= 0) return;
        const existing = getDebtRecord(name, c.companyName || "");
        existing.company = c.companyName || existing.company;
        existing.manualAmount = manual;
        existing.sourceNotes.add("Müştəri kartı");
        debtMap.set(name, existing);
      });
    } else {
      // Hesab-fakturalar (bills) – ödənilməmiş məbləğlər kreditor borcunu artırır
      state.bills.forEach((bill) => {
        if (bill.status === "Ödənilib") return;
        const name = bill.vendorName || "Naməlum satıcı";
        const existing = getDebtRecord(name);
        existing.txAmount += Number(bill.amount || 0);
        existing.creditTurnover += Number(bill.amount || 0);
        existing.sourceNotes.add("Hesab-fakturalar");
        existing.glAccounts.add("531");
        debtMap.set(name, existing);
      });
      // Mal qaimələri kreditor borcu yaradır
      state.incomingGoodsServices.forEach((entry) => {
        const name = entry.vendorName || "Naməlum satıcı";
        const existing = getDebtRecord(name);
        existing.txAmount += Number(entry.totalAmount || 0);
        existing.creditTurnover += Number(entry.totalAmount || 0);
        existing.sourceNotes.add("Mal qaimələri");
        existing.glAccounts.add("531");
        debtMap.set(name, existing);
      });
      // Satıcı kartındakı manual sahə
      state.manualJournals.forEach((journal) => {
        const lines = Array.isArray(journal.journalLines) && journal.journalLines.length
          ? journal.journalLines.filter((line) => line.accountCode && Number(line.amount || 0) > 0)
          : [
              journal.debitAccount ? { accountCode: journal.debitAccount, entryType: "Debet", amount: journal.debit, linkedEntityName: "" } : null,
              journal.creditAccount ? { accountCode: journal.creditAccount, entryType: "Kredit", amount: journal.credit, linkedEntityName: "" } : null
            ].filter(Boolean);
        lines.forEach((line) => {
          const accountCode = String(line.accountCode || "");
          const accountType = inferAccountTypeFromCode(accountCode, state.chartOfAccounts.find((account) => account.accountCode === accountCode)?.accountType || "");
          const isCreditorLine = line.subledgerCategory === "creditors" || (accountType === "Öhdəlik" && ["411", "421", "511", "521", "522", "531", "541"].includes(accountCode));
          if (!isCreditorLine) return;
          const linkedName = line.linkedEntityName || "Manual kreditor";
          const existing = getDebtRecord(linkedName);
          const lineAmount = Number(line.amount || 0);
          if (line.entryType === "Kredit") {
            existing.txAmount += lineAmount;
            existing.creditTurnover += lineAmount;
          } else {
            existing.txAmount -= lineAmount;
            existing.debitTurnover += lineAmount;
          }
          existing.sourceNotes.add("Manual jurnal");
          existing.glAccounts.add(accountCode);
          debtMap.set(linkedName, existing);
        });
      });
      state.vendors.forEach((v) => {
        const name = v.vendorName || v.companyName || "—";
        const manual = Number(v.outstandingPayables || 0);
        if (manual <= 0) return;
        const existing = getDebtRecord(name, v.companyName || "");
        existing.company = v.companyName || existing.company;
        existing.manualAmount = manual;
        existing.sourceNotes.add("Satıcı kartı");
        debtMap.set(name, existing);
      });
    }

    // Müsbət qalıqları olan birləşdirilmiş siyahı
    let mergedItems = [...debtMap.values()].map((item) => ({
      ...item,
      linkedVendorId: isReceivables ? null : findLinkedVendor(item)?.id || null,
      sourceNoteText: [...(item.sourceNotes || [])].join(", "),
      glAccountText: [...(item.glAccounts || [])].sort().join(", "),
      balanceAmount: Math.max(0, item.txAmount) + item.manualAmount,
      paidAmount: isReceivables ? item.creditTurnover : item.debitTurnover,
      turnoverAmount: item.debitTurnover + item.creditTurnover
    })).filter((item) => item.balanceAmount > 0 || item.turnoverAmount > 0 || item.manualAmount > 0);

    if (!isReceivables) {
      const payableGlRows = getFinancialPositionLineRows(debtLookup, "shortLiabilities")
        .concat(getFinancialPositionLineRows(debtLookup, "longLiabilities"))
        .filter((row, index, array) => array.findIndex((candidate) => candidate.accountCode === row.accountCode) === index)
        .map((row) => ({
          name: `${row.accountCode} - ${row.accountName || getAccountNameByCode(row.accountCode)}`,
          company: "Vendor bağlılığı göstərilməyib",
          sourceNoteText: "Birbaşa baş kitab qalığı",
          glAccountText: String(row.accountCode || ""),
          debitTurnover: 0,
          creditTurnover: getReportAccountValue(row, "credit"),
          paidAmount: 0,
          turnoverAmount: getReportAccountValue(row, "credit"),
          balanceAmount: getReportAccountValue(row, "credit")
        }))
        .filter((row) => row.balanceAmount > 0);

      const payableGlTotal = Number(payableGlRows.reduce((sum, row) => sum + Number(row.balanceAmount || 0), 0).toFixed(2));
      const mappedTotal = Number(mergedItems.reduce((sum, row) => sum + Number(row.balanceAmount || 0), 0).toFixed(2));

      if (!mergedItems.length && payableGlRows.length) {
        mergedItems = payableGlRows;
      } else if (payableGlTotal - mappedTotal > 0.01) {
        mergedItems = [
          ...mergedItems,
          {
            name: "Unallocated liability balances",
            company: "Vendor üzrə açılış tapılmadı",
            sourceNoteText: "Baş kitab öhdəlik qalıqları",
            glAccountText: payableGlRows.map((row) => row.glAccountText).filter(Boolean).join(", "),
            debitTurnover: 0,
            creditTurnover: Number((payableGlTotal - mappedTotal).toFixed(2)),
            paidAmount: 0,
            turnoverAmount: Number((payableGlTotal - mappedTotal).toFixed(2)),
            balanceAmount: Number((payableGlTotal - mappedTotal).toFixed(2))
          }
        ];
      }
    }

    const filtered = mergedItems.filter((item) =>
      !query ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.company || "").toLowerCase().includes(query.toLowerCase()) ||
      (item.sourceNoteText || "").toLowerCase().includes(query.toLowerCase()) ||
      (item.glAccountText || "").toLowerCase().includes(query.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => b.balanceAmount - a.balanceAmount);
    const totalDebt = mergedItems.reduce((s, item) => s + item.balanceAmount, 0);
    const debtEntityCount = mergedItems.length;
    const maxDebt = sorted.length > 0 ? sorted[0].balanceAmount : 0;
    const avgDebt = mergedItems.length > 0 ? totalDebt / mergedItems.length : 0;
    const totalDebitTurnover = mergedItems.reduce((sum, item) => sum + Number(item.debitTurnover || 0), 0);
    const totalCreditTurnover = mergedItems.reduce((sum, item) => sum + Number(item.creditTurnover || 0), 0);
    const totalPaidAmount = mergedItems.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);

    const exportDebtPdf = () => {
      const headers = ["#", isReceivables ? "Müştəri / Debitor" : "Təchizatçı / Kreditor", "Debet", "Kredit", "Qalıq"];
      const rows = sorted.map((item, idx) => [
        idx + 1,
        item.name + (item.company ? ` (${item.company})` : ""),
        currency(item.debitTurnover || 0, cur),
        currency(item.creditTurnover || 0, cur),
        currency(item.balanceAmount || 0, cur)
      ]);
      rows.push([
        "",
        "<strong>Cəmi</strong>",
        `<strong>${currency(totalDebitTurnover, cur)}</strong>`,
        `<strong>${currency(totalCreditTurnover, cur)}</strong>`,
        `<strong>${currency(totalDebt, cur)}</strong>`
      ]);

      const printWindow = window.open("", "_blank", "width=980,height=720");
      if (!printWindow) {
        setBackupStatus({ tone: "warning", message: "Çap pəncərəsi açıla bilmədi." });
        return;
      }
      printWindow.document.write(buildTableReportDocument(title, headers, rows));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    const exportDebtExcel = async () => {
      const headers = ["#", isReceivables ? "Müştəri / Debitor" : "Təchizatçı / Kreditor", "Debet", "Kredit", "Qalıq"];
      const rows = sorted.map((item, idx) => [
        idx + 1,
        item.name + (item.company ? ` (${item.company})` : ""),
        Number(item.debitTurnover || 0).toFixed(2),
        Number(item.creditTurnover || 0).toFixed(2),
        Number(item.balanceAmount || 0).toFixed(2)
      ]);
      rows.push([
        "",
        "Cəmi",
        totalDebitTurnover.toFixed(2),
        totalCreditTurnover.toFixed(2),
        totalDebt.toFixed(2)
      ]);

      const html = buildTableReportDocument(title, headers, rows);
      await exportHtmlAsExcel(title, html);
    };

    return (
      <section className="view active">
        {/* KPI strip */}
        <div className="debt-kpi-grid">
          <div className={`debt-kpi-card ${isReceivables ? "debt-kpi-green" : "debt-kpi-red"}`}>
            <span className="debt-kpi-icon">{icon}</span>
            <div>
              <span>{isReceivables ? at.debt_totalReceivable : at.debt_totalPayable}</span>
              <strong>{currency(totalDebt, cur)}</strong>
            </div>
          </div>
          <div className="debt-kpi-card debt-kpi-blue">
            <span className="debt-kpi-icon">👤</span>
            <div>
              <span>{isReceivables ? at.debt_withDebtCustomer : at.debt_withDebtVendor}</span>
              <strong>{debtEntityCount} {isReceivables ? at.unit_customer : at.hub_vendorsCount}</strong>
            </div>
          </div>
          <div className="debt-kpi-card debt-kpi-amber">
            <span className="debt-kpi-icon">🏆</span>
            <div>
              <span>{at.debt_highest}</span>
              <strong>{currency(maxDebt, cur)}</strong>
            </div>
          </div>
          <div className="debt-kpi-card debt-kpi-neutral">
            <span className="debt-kpi-icon">📐</span>
            <div>
              <span>{at.debt_average}</span>
              <strong>{currency(avgDebt, cur)}</strong>
            </div>
          </div>
          <div className="debt-kpi-card debt-kpi-slate">
            <span className="debt-kpi-icon">↔</span>
            <div>
              <span>{isReceivables ? "Debet dövriyyəsi" : "Kredit dövriyyəsi"}</span>
              <strong>{currency(isReceivables ? totalDebitTurnover : totalCreditTurnover, cur)}</strong>
            </div>
          </div>
          <div className="debt-kpi-card debt-kpi-soft">
            <span className="debt-kpi-icon">💸</span>
            <div>
              <span>{isReceivables ? "Yığılan məbləğ" : "Ödənilən məbləğ"}</span>
              <strong>{currency(totalPaidAmount, cur)}</strong>
            </div>
          </div>
        </div>

        {/* Table panel */}
        <div className="panel debt-panel">
          <div className="panel-head">
            <div>
              <h3>{title}</h3>
              <p className="panel-copy">{isReceivables ? at.debt_descReceivable : at.debt_descPayable}</p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button className="ghost-btn compact-btn" type="button" onClick={exportDebtPdf}>
                Çap et
              </button>
              <button className="primary-btn compact-btn" type="button" onClick={exportDebtExcel}>
                Export
              </button>
              <input
                className="search-input"
                placeholder={isReceivables ? at.debt_searchCustomer : at.debt_searchVendor}
                value={query}
                onChange={(e) => setDebtSearch((d) => ({ ...d, [type]: e.target.value }))}
                style={{ width: "220px" }}
              />
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="nomen-empty">
              <span className="nomen-empty-icon">{icon}</span>
              <strong>{query ? at.noResults : (isReceivables ? at.debt_emptyReceivable : at.debt_emptyPayable)}</strong>
            </div>
          ) : (
            <div className="debt-list">
              <div className="debt-table-head">
                <span>#</span>
                <span>{isReceivables ? "Müştəri / Debitor" : "Təchizatçı / Kreditor"}</span>
                <span className="debt-col-center">Debet</span>
                <span className="debt-col-center">Kredit</span>
                <span className="debt-col-right">Qalıq</span>
              </div>
              {sorted.map((item, index) => {
                const amount = item.balanceAmount;
                const shareOfTotal = totalDebt > 0 ? (amount / totalDebt) * 100 : 0;
                return (
                  <div key={item.name} className="debt-row">
                    <div className="debt-row-rank">{index + 1}</div>
                    <div className="debt-row-info">
                      {item.name ? (
                        <button type="button" className="debt-link-btn" onClick={() => openDebtAccountCard(item)}>
                          {item.name || "—"}
                        </button>
                      ) : (
                        <strong className="debt-row-name">{item.name || "—"}</strong>
                      )}
                      {item.company ? <span className="debt-row-company">{item.company}</span> : null}
                      {item.sourceNoteText ? <small className="debt-row-company">{item.sourceNoteText}</small> : null}
                      {item.glAccountText ? <small className="debt-row-company">GL: {item.glAccountText}</small> : null}
                    </div>
                    <div className="debt-row-cell debt-row-cell-center">{currency(item.debitTurnover || 0, cur)}</div>
                    <div className="debt-row-cell debt-row-cell-center">{currency(item.creditTurnover || 0, cur)}</div>
                    <div className="debt-row-amount">
                      <strong>{currency(amount, cur)}</strong>
                      <span className="debt-row-share">{shareOfTotal.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sorted.length > 0 && (
            <div className="debt-total-footer">
              <span className="debt-total-label">{sorted.length} {at.listShowing}</span>
              <span className="debt-total-metric debt-total-debit">Debet: <strong>{currency(totalDebitTurnover, cur)}</strong></span>
              <span className="debt-total-metric debt-total-credit">Kredit: <strong>{currency(totalCreditTurnover, cur)}</strong></span>
              <strong className="debt-total-metric debt-total-balance">{at.listTotal} {currency(totalDebt, cur)}</strong>
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderTrialBalance() {
    const rows = getTrialBalanceRows();
    const filterMap = {
      [at.tb_tabAll]: null,
      [at.tb_acAsset]: "Aktiv",
      [at.tb_acLiab]: "Öhdəlik",
      [at.tb_acEq]: "Kapital",
      [at.tb_acInc]: "Gəlir",
      [at.tb_acExp]: "Xərc"
    };
    const selectedType = filterMap[trialBalanceFilter] ?? null;
    const filteredRows = selectedType ? rows.filter((row) => row.accountType === selectedType) : rows;
    const totals = filteredRows.reduce((sum, row) => ({
      openingDebit: sum.openingDebit + Number(row.openingDebit || 0),
      openingCredit: sum.openingCredit + Number(row.openingCredit || 0),
      movementDebit: sum.movementDebit + Number(row.movementDebit || 0),
      movementCredit: sum.movementCredit + Number(row.movementCredit || 0),
      closingDebit: sum.closingDebit + Number(row.closingDebit || 0),
      closingCredit: sum.closingCredit + Number(row.closingCredit || 0)
    }), { openingDebit: 0, openingCredit: 0, movementDebit: 0, movementCredit: 0, closingDebit: 0, closingCredit: 0 });
    const isBalanced = Math.abs(totals.closingDebit - totals.closingCredit) < 0.005;
    const filterTabs = [at.tb_tabAll, at.tb_acAsset, at.tb_acLiab, at.tb_acEq, at.tb_acInc, at.tb_acExp];
    const groupClassNames = {
      Aktiv: "tb-type-aktiv",
      "Öhdəlik": "tb-type-ohdelik",
      Kapital: "tb-type-kapital",
      Gəlir: "tb-type-gelir",
      Xərc: "tb-type-xerc"
    };
    const groupLabels = {
      Aktiv: at.tb_acAsset,
      "Öhdəlik": at.tb_acLiab,
      Kapital: at.tb_acEq,
      Gəlir: at.tb_acInc,
      Xərc: at.tb_acExp
    };
    const groupedRows = filteredRows.reduce((groups, row) => {
      const key = row.accountType || at.tb_tabAll;
      groups[key] = groups[key] || [];
      groups[key].push(row);
      return groups;
    }, {});
    const orderedGroupKeys = Object.keys(groupedRows).sort((left, right) => {
      const order = ["Aktiv", "Öhdəlik", "Kapital", "Gəlir", "Xərc"];
      return order.indexOf(left) - order.indexOf(right);
    });
    const formatAmount = (value) => Number(value || 0) === 0 ? "—" : currency(Number(value || 0), state.settings.currency);

    return (
      <section className="view active">
        <div className="tb-kpi-grid">
          <div className={`tb-kpi-card ${isBalanced ? "balanced" : "unbalanced"}`}>
            <span className="tb-kpi-icon">⚖️</span>
            <div>
              <span>{at.tb_balanceStatus}</span>
              <strong>{isBalanced ? at.tb_isBalanced : at.tb_isUnbalanced}</strong>
            </div>
          </div>
          <div className="tb-kpi-card">
            <span className="tb-kpi-icon">#</span>
            <div>
              <span>{at.tb_accountCount}</span>
              <strong>{filteredRows.length}</strong>
            </div>
          </div>
          <div className="tb-kpi-card">
            <span className="tb-kpi-icon">D</span>
            <div>
              <span>{at.tb_closingDebitTotal}</span>
              <strong>{currency(totals.closingDebit, state.settings.currency)}</strong>
            </div>
          </div>
          <div className="tb-kpi-card">
            <span className="tb-kpi-icon">K</span>
            <div>
              <span>{at.tb_closingCreditTotal}</span>
              <strong>{currency(totals.closingCredit, state.settings.currency)}</strong>
            </div>
          </div>
        </div>

        <div className="tb-filter-bar">
          {filterTabs.map((label) => {
            const type = filterMap[label];
            const count = type ? rows.filter((row) => row.accountType === type).length : rows.length;
            return (
              <button
                key={label}
                type="button"
                className={`tb-filter-tab ${trialBalanceFilter === label ? "active" : ""}`}
                onClick={() => setTrialBalanceFilter(label)}
              >
                <span>{label}</span>
                <span className="tb-filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="panel tb-table-wrap">
          {filteredRows.length === 0 ? (
            <div className="nomen-empty">
              <span className="nomen-empty-icon">⚖️</span>
              <strong>{at.tb_empty}</strong>
            </div>
          ) : (
            <table className="tb-table">
              <thead>
                <tr>
                  <th>{at.col["Kod"]}</th>
                  <th>{at.col["Hesab"]}</th>
                  <th className="tb-num">{at.tb_openingD}</th>
                  <th className="tb-num">{at.tb_openingK}</th>
                  <th className="tb-num">{at.tb_movementD}</th>
                  <th className="tb-num">{at.tb_movementK}</th>
                  <th className="tb-num">{at.tb_closingDebit}</th>
                  <th className="tb-num">{at.tb_closingCredit}</th>
                </tr>
              </thead>
              <tbody>
                {orderedGroupKeys.flatMap((groupKey) => {
                  const groupRows = groupedRows[groupKey];
                  const subtotal = groupRows.reduce((sum, row) => ({
                    openingDebit: sum.openingDebit + Number(row.openingDebit || 0),
                    openingCredit: sum.openingCredit + Number(row.openingCredit || 0),
                    movementDebit: sum.movementDebit + Number(row.movementDebit || 0),
                    movementCredit: sum.movementCredit + Number(row.movementCredit || 0),
                    closingDebit: sum.closingDebit + Number(row.closingDebit || 0),
                    closingCredit: sum.closingCredit + Number(row.closingCredit || 0)
                  }), { openingDebit: 0, openingCredit: 0, movementDebit: 0, movementCredit: 0, closingDebit: 0, closingCredit: 0 });

                  return [
                    <tr key={`${groupKey}-header`} className={`tb-group-header ${groupClassNames[groupKey] || ""}`}>
                      <td colSpan="8">{groupLabels[groupKey] || groupKey}</td>
                    </tr>,
                    ...groupRows.map((row) => (
                      <tr key={row.id || row.accountCode} className="tb-data-row">
                        <td className="tb-code">{row.accountCode}</td>
                        <td className="tb-name">{row.accountName}</td>
                        <td className={`tb-num ${row.openingDebit ? "has-value" : ""}`}>{formatAmount(row.openingDebit)}</td>
                        <td className={`tb-num ${row.openingCredit ? "has-value" : ""}`}>{formatAmount(row.openingCredit)}</td>
                        <td className={`tb-num ${row.movementDebit ? "has-value" : ""}`}>{formatAmount(row.movementDebit)}</td>
                        <td className={`tb-num ${row.movementCredit ? "has-value" : ""}`}>{formatAmount(row.movementCredit)}</td>
                        <td className={`tb-num tb-closing ${row.closingDebit ? "has-value" : ""}`}>{formatAmount(row.closingDebit)}</td>
                        <td className={`tb-num tb-closing ${row.closingCredit ? "has-value" : ""}`}>{formatAmount(row.closingCredit)}</td>
                      </tr>
                    )),
                    <tr key={`${groupKey}-subtotal`} className="tb-subtotal-row">
                      <td colSpan="2">{groupLabels[groupKey] || groupKey} {at.tb_subtotal}</td>
                      <td className="tb-num">{currency(subtotal.openingDebit, state.settings.currency)}</td>
                      <td className="tb-num">{currency(subtotal.openingCredit, state.settings.currency)}</td>
                      <td className="tb-num">{currency(subtotal.movementDebit, state.settings.currency)}</td>
                      <td className="tb-num">{currency(subtotal.movementCredit, state.settings.currency)}</td>
                      <td className="tb-num">{currency(subtotal.closingDebit, state.settings.currency)}</td>
                      <td className="tb-num">{currency(subtotal.closingCredit, state.settings.currency)}</td>
                    </tr>
                  ];
                })}
                <tr className="tb-grand-total">
                  <td colSpan="2">{at.tb_grandTotal}</td>
                  <td className="tb-num">{currency(totals.openingDebit, state.settings.currency)}</td>
                  <td className="tb-num">{currency(totals.openingCredit, state.settings.currency)}</td>
                  <td className="tb-num">{currency(totals.movementDebit, state.settings.currency)}</td>
                  <td className="tb-num">{currency(totals.movementCredit, state.settings.currency)}</td>
                  <td className="tb-num">{currency(totals.closingDebit, state.settings.currency)}</td>
                  <td className="tb-num">{currency(totals.closingCredit, state.settings.currency)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        {debtCard && debtCard.type === type ? (
          <div className="modal-backdrop" onClick={() => setDebtCard(null)}>
            <section className="modal-card subscription-modal debt-card-modal" onClick={(event) => event.stopPropagation()}>
              <div className="item-editor-topbar">
                <div>
                  <h3>{debtCard.type === "receivables" ? "Debitor kartı" : "Kreditor kartı"}</h3>
                  <p className="panel-copy">Borcla bağlı əsas məlumatlar və mənbə detalları.</p>
                </div>
                <button className="icon-btn" type="button" onClick={() => setDebtCard(null)}>×</button>
              </div>
              <div className="debt-card-grid">
                <article className="debt-card-hero">
                  <span className="debt-card-eyebrow">{debtCard.vendor ? "Əlaqəli kart tapıldı" : "Manual / GL mənbəsi"}</span>
                  <strong>{debtCard.title}</strong>
                  <p>{debtCard.vendor?.companyName || debtCard.item.company || "Şirkət məlumatı yoxdur"}</p>
                </article>
                <article className="summary-card">
                  <span>Debet</span>
                  <strong>{currency(debtCard.item.debitTurnover || 0, cur)}</strong>
                </article>
                <article className="summary-card">
                  <span>Kredit</span>
                  <strong>{currency(debtCard.item.creditTurnover || 0, cur)}</strong>
                </article>
                <article className="summary-card">
                  <span>Qalıq</span>
                  <strong>{currency(debtCard.item.balanceAmount || 0, cur)}</strong>
                </article>
              </div>
              <div className="debt-card-details">
                <div className="debt-card-detail-block">
                  <strong>Əlaqə məlumatı</strong>
                  <span>Satıcı: {debtCard.vendor?.vendorName || debtCard.item.name || "—"}</span>
                  <span>Şirkət: {debtCard.vendor?.companyName || debtCard.item.company || "—"}</span>
                  <span>E-poçt: {debtCard.vendor?.email || "—"}</span>
                </div>
                <div className="debt-card-detail-block">
                  <strong>Mənbə</strong>
                  <span>{debtCard.item.sourceNoteText || "—"}</span>
                  <span>GL: {debtCard.item.glAccountText || "—"}</span>
                </div>
              </div>
              <div className="form-actions">
                {debtCard.vendor ? (
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => {
                      const vendor = debtCard.vendor;
                      setDebtCard(null);
                      setSection("purchases");
                      startEdit("vendors", vendor);
                    }}
                  >
                    Təchizatçı kartını aç
                  </button>
                ) : null}
                <button className="ghost-btn" type="button" onClick={() => setDebtCard(null)}>Bağla</button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    );
  }

  function renderManualJournals(at) {
    const config = MODULES.manualJournals;
    const query = searches[config.collection] || "";
    const draft = drafts.manualJournals || createModuleDraft("manualJournals");
    const rows = state.manualJournals
      .filter((item) => matchesSearch(item, query))
      .slice()
      .sort((a, b) => `${b.date || ""}${b.createdAt || ""}`.localeCompare(`${a.date || ""}${a.createdAt || ""}`));
    const allRows = state.manualJournals.slice();
    const journalAnalysis = getManualJournalAnalysis(draft);
    const journalIsBalanced = journalAnalysis.isBalanced;
    const filteredAccounts = ((draft.accountTypeFilter && draft.accountTypeFilter !== "Hamısı"
      ? state.chartOfAccounts.filter((account) => account.accountType === draft.accountTypeFilter)
      : state.chartOfAccounts))
      .filter((account) => isVisibleAccount(account))
      .slice()
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode));
    const totalDebit = allRows.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const totalCredit = allRows.reduce((sum, item) => sum + Number(item.credit || 0), 0);
    const balancedCount = allRows.filter((item) => Number(item.debit || 0) > 0 && Number(item.debit || 0) === Number(item.credit || 0)).length;
    const recentRows = rows.slice(0, 4);
    const renderManualJournalNav = () => (
      <div className="mj-overview-grid mj-overview-grid-persistent">
        <div className={`mj-action-card ${journalView === "journal" ? "active" : ""}`} onClick={() => setJournalView("journal")}>
          <div className="mj-action-icon">📚</div>
          <div>
            <h3>{at.mj_opsList}</h3>
            <p>{at.mj_opsListDesc}</p>
            <span>{rows.length} {at.unit_record}</span>
          </div>
        </div>
        <div className={`mj-action-card ${journalView === "form" ? "active" : ""}`} onClick={() => { cancelEdit("manualJournals"); setJournalView("form"); }}>
          <div className="mj-action-icon">✍️</div>
          <div>
            <h3>{at.mj_newEntry}</h3>
            <p>{at.mj_newEntryDesc}</p>
            <span>{at.mj_createFirst}</span>
          </div>
        </div>
      </div>
    );

    if (journalView === "overview") {
      return (
        <section className="view active">
          {OVERVIEWS[activeSection]?.includes("manualJournals") && (
            <div className="module-back-bar">
              <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
            </div>
          )}
          <section className="mj-hero">
            <div className="mj-hero-copy">
              <span className="mj-hero-badge">Manual Journal Studio</span>
              <h2>{at.mod_manualJournals}</h2>
              <p>{at.mod_manualJournalsSummary}</p>
            </div>
            <div className="mj-hero-stats">
              <article className="mj-stat-card">
                <span>{at.mj_totalRecords}</span>
                <strong>{allRows.length}</strong>
              </article>
              <article className="mj-stat-card">
                <span>{at.mj_totalDebit}</span>
                <strong>{currency(totalDebit, state.settings.currency)}</strong>
              </article>
              <article className="mj-stat-card">
                <span>{at.mj_totalCredit}</span>
                <strong>{currency(totalCredit, state.settings.currency)}</strong>
              </article>
              <article className="mj-stat-card accent">
                <span>{at.mj_balanced}</span>
                <strong>{balancedCount}</strong>
              </article>
            </div>
          </section>

          <div className="mj-overview-grid">
            <div className={`mj-action-card ${journalView === "journal" ? "active" : ""}`} onClick={() => setJournalView("journal")}>
              <div className="mj-action-icon">📚</div>
              <div>
                <h3>{at.mj_opsList}</h3>
                <p>{at.mj_opsListDesc}</p>
                <span>{rows.length} {at.unit_record}</span>
              </div>
            </div>
            <div className={`mj-action-card ${journalView === "form" ? "active" : ""}`} onClick={() => { cancelEdit("manualJournals"); setJournalView("form"); }}>
              <div className="mj-action-icon">✍️</div>
              <div>
                <h3>{at.mj_newEntry}</h3>
                <p>{at.mj_newEntryDesc}</p>
                <span>{at.mj_createFirst}</span>
              </div>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>{at.mj_recentOps}</h3>
                <p className="panel-copy">{at.mj_opsListDesc}</p>
              </div>
              <button className="ghost-btn compact-btn" type="button" onClick={() => setJournalView("journal")}>{at.mj_viewAll}</button>
            </div>
            {recentRows.length === 0 ? (
              <div className="nomen-empty">
                <span className="nomen-empty-icon">📓</span>
                <strong>{at.mj_noEntries}</strong>
              </div>
            ) : (
              <div className="mj-recent-list">
                {recentRows.map((record) => {
                  const lineCount = Array.isArray(record.journalLines) ? record.journalLines.length : 2;
                  return (
                    <article className="mj-recent-card" key={record.id}>
                      <div className="mj-recent-top">
                        <div>
                          <strong>{record.journalNumber || "—"}</strong>
                          <span>{record.reference || "—"}</span>
                        </div>
                        <span className={`mj-balance-pill ${Number(record.debit || 0) === Number(record.credit || 0) ? "ok" : "warn"}`}>
                          {Number(record.debit || 0) === Number(record.credit || 0) ? at.mj_balanced : at.mj_unbalanced}
                        </span>
                      </div>
                      <div className="mj-recent-meta">
                        <span>{fmtDate(record.date)}</span>
                        <span>{lineCount} sətir</span>
                        <span>{currency(record.debit || 0, state.settings.currency)}</span>
                      </div>
                      <div className="row-actions">
                        <button className="table-btn" type="button" onClick={() => startEdit("manualJournals", record)}>{at.edit}</button>
                        <button className="table-btn danger-btn" type="button" onClick={() => removeModuleRecord("manualJournals", record.id)}>{at.delete}</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      );
    }

    if (journalView === "journal") {
      return (
        <section className="view active">
          {renderManualJournalNav()}
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => setJournalView("overview")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{at.mj_journalList}</h2>
              <button className="primary-btn" type="button" onClick={() => { cancelEdit("manualJournals"); setJournalView("form"); }}>{at.mj_newEntry}</button>
            </div>
          </div>

          <div className="panel mj-journal-shell">
            <div className="panel-head compact-head">
              <div>
                <h3>{at.mj_opsList}</h3>
                <p className="panel-copy">{at.mj_opsListDesc}</p>
              </div>
              <input className="search-input" placeholder={at.mj_search} value={query} onChange={(event) => setSearches((current) => ({ ...current, [config.collection]: event.target.value }))} />
            </div>

            {rows.length === 0 ? (
              <div className="nomen-empty">
                <span className="nomen-empty-icon">📭</span>
                <strong>{query ? at.mj_noResult : at.mj_noEntries}</strong>
                {!query ? <button className="primary-btn" type="button" onClick={() => { cancelEdit("manualJournals"); setJournalView("form"); }}>{at.mj_createFirst}</button> : null}
              </div>
            ) : (
              <div className="mj-journal-table">
                <div className="mj-journal-table-head">
                  <span>Jurnal</span>
                  <span>Təyinat</span>
                  <span>Tarix</span>
                  <span>Debet</span>
                  <span>Kredit</span>
                  <span>Status</span>
                  <span>Əməliyyat</span>
                </div>
                {rows.map((record) => {
                  const lines = Array.isArray(record.journalLines) && record.journalLines.length
                    ? record.journalLines
                    : [
                        record.debitAccount ? { accountCode: record.debitAccount, entryType: "Debet", amount: record.debit } : null,
                        record.creditAccount ? { accountCode: record.creditAccount, entryType: "Kredit", amount: record.credit } : null
                      ].filter(Boolean);
                  return (
                    <article className="mj-journal-row" key={record.id}>
                      <div className="mj-journal-row-main">
                        <span className="mj-journal-code">{record.journalNumber || "—"}</span>
                        <strong className="mj-journal-ref">{record.reference || "—"}</strong>
                        <span className="mj-journal-date">{fmtDate(record.date)}</span>
                        <strong className="mj-journal-money">{currency(record.debit || 0, state.settings.currency)}</strong>
                        <strong className="mj-journal-money">{currency(record.credit || 0, state.settings.currency)}</strong>
                        <div className="mj-journal-status-cell">
                          <span className={`mj-balance-pill ${Number(record.debit || 0) === Number(record.credit || 0) ? "ok" : "warn"}`}>
                            {Number(record.debit || 0) === Number(record.credit || 0) ? at.mj_balanced : at.mj_unbalanced}
                          </span>
                        </div>
                        <div className="row-actions mj-row-actions">
                          <button className="table-btn" type="button" onClick={() => startEdit("manualJournals", record)}>{at.mj_btnEdit}</button>
                          <button className="table-btn danger-btn" type="button" onClick={() => removeModuleRecord("manualJournals", record.id)}>{at.mj_btnDelete}</button>
                        </div>
                      </div>
                      <div className="mj-ledger-preview mj-ledger-preview-row">
                        {lines.slice(0, 4).map((line, index) => {
                          const account = state.chartOfAccounts.find((item) => item.accountCode === line.accountCode);
                          return (
                            <div className="mj-ledger-chip" key={`${record.id}-${line.accountCode}-${index}`}>
                              <span>{line.entryType === "Debet" ? "D" : "K"}</span>
                              <strong>{line.accountCode}</strong>
                              <em>{line.linkedEntityName || account?.accountName || getAccountNameByCode(line.accountCode)}</em>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="view active">
        <div className="bill-form-page mj-form-page">
          {renderManualJournalNav()}
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => cancelEdit("manualJournals")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{editing.manualJournals ? at.mj_formEdit : at.mj_formNew}</h2>
            </div>
          </div>

          <div className="mj-form-shell">
            <section className="mj-form-header-card">
              <div>
                <span className="mj-form-eyebrow">{editing.manualJournals ? at.mj_formEyebrowEdit : at.mj_formEyebrowNew}</span>
                <h3>{editing.manualJournals ? at.mj_formEdit : at.mj_formNew}</h3>
                <p>{at.mj_newEntryDesc}</p>
              </div>
              <div className="mj-balance-kpis">
                <article className="mj-balance-kpi">
                  <span>{at.mj_debitTotal}</span>
                  <strong>{currency(journalAnalysis.debitTotal, state.settings.currency)}</strong>
                </article>
                <article className="mj-balance-kpi">
                  <span>{at.mj_creditTotal}</span>
                  <strong>{currency(journalAnalysis.creditTotal, state.settings.currency)}</strong>
                </article>
                <article className={`mj-balance-kpi ${journalIsBalanced ? "balanced" : "unbalanced"}`}>
                  <span>{at.mj_difference}</span>
                  <strong>{currency(Math.abs(Number(journalAnalysis.difference || 0)), state.settings.currency)}</strong>
                </article>
              </div>
            </section>

            <form className="mj-form-grid" onSubmit={(event) => submitModule("manualJournals", event)}>
              <div className="mj-meta-grid">
                <label><span>{at.mj_lblJournalNum}</span><input value={draft.journalNumber ?? ""} onChange={(event) => updateDraft("manualJournals", "journalNumber", event.target.value)} required /></label>
                <label><span>{at.mj_lblReference}</span><input value={draft.reference ?? ""} onChange={(event) => updateDraft("manualJournals", "reference", event.target.value)} required /></label>
                <label><span>{at.mj_lblDate}</span><input type="date" value={draft.date ?? today()} onChange={(event) => updateDraft("manualJournals", "date", event.target.value)} required /></label>
                <label><span>{at.mj_lblAccountFilter}</span><select value={draft.accountTypeFilter ?? "Hamısı"} onChange={(event) => updateDraft("manualJournals", "accountTypeFilter", event.target.value)}><option value="Hamısı">{at.goods_tabAll}</option><option value="Aktiv">{at.coa_asset}</option><option value="Öhdəlik">{at.coa_liability}</option><option value="Kapital">{at.coa_equity}</option><option value="Gəlir">{at.coa_income}</option><option value="Xərc">{at.coa_expense}</option></select></label>
              </div>

              <div className="journal-lines-card modern">
                <div className="journal-lines-head">
                  <div>
                    <strong>{at.mj_lines}</strong>
                    <p>{at.mj_newEntryDesc}</p>
                  </div>
                  <button className="ghost-btn compact-btn" type="button" onClick={addJournalLine}>{at.mj_addLine}</button>
                </div>
                <div className="journal-lines-list modern">
                  {draft.journalLines.map((line, index) => {
                    const selectedAccount = filteredAccounts.find((account) => account.accountCode === line.accountCode);
                    const accountTypeMeta = getAccountTypeMeta(selectedAccount?.accountType);
                    const subledgerCategory = line.subledgerCategory || "goods";
                    const subledgerOptions = getJournalSubledgerOptions(subledgerCategory);
                    const selectedInventoryItem = state.items.find((item) => item.id === line.linkedEntityId);
                    const isTrackedInventoryItem = subledgerCategory === "goods" && selectedInventoryItem?.trackInventory === "Bəli" && selectedInventoryItem?.type !== "Xidmət";
                    const subledgerTabs = [
                      { id: "goods", label: "Mallar" },
                      { id: "services", label: "Xidmətlər" },
                      { id: "expenses", label: "Xərclər" },
                      { id: "incomes", label: "Gəlirlər" },
                      { id: "debtors", label: "Debitorlar" },
                      { id: "creditors", label: "Kreditorlar" },
                      { id: "bank", label: "Bank" }
                    ];
                    return (
                      <div className="mj-line-card" key={line.id}>
                        <div className="mj-line-order">{index + 1}</div>
                        <div className="mj-line-fields">
                          <label>
                            <span>{at.mj_selectAccount}</span>
                            <select value={line.accountCode} onChange={(event) => updateJournalLine(line.id, "accountCode", event.target.value)}>
                              <option value="">{at.mj_selectAccount}</option>
                              {filteredAccounts.map((account) => <option key={`${line.id}-${account.id}`} value={account.accountCode}>{account.accountCode} - {account.accountName}</option>)}
                            </select>
                          </label>
                          <label>
                            <span>{at.status}</span>
                            <select value={line.entryType} onChange={(event) => updateJournalLine(line.id, "entryType", event.target.value)}>
                              <option value="Debet">{fld("Debet")}</option>
                              <option value="Kredit">{fld("Kredit")}</option>
                            </select>
                          </label>
                          <label>
                            <span>{at.col["Məbləğ"] || "Məbləğ"}</span>
                            <input type="number" step="0.01" value={line.amount} onChange={(event) => updateJournalLine(line.id, "amount", event.target.value)} />
                          </label>
                          <div className="mj-subledger-card">
                            <div className="mj-subledger-tabs">
                              {subledgerTabs.map((tab) => (
                                <button
                                  key={`${line.id}-${tab.id}`}
                                  type="button"
                                  className={`mj-subledger-tab ${subledgerCategory === tab.id ? "active" : ""}`}
                                  onClick={() => updateJournalLineSubledgerCategory(line.id, tab.id)}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                            <div className="mj-subledger-grid">
                              <label className="mj-line-related-field">
                                <span>Alt bölmə seçimi</span>
                                <select
                                  value={line.linkedEntityId || ""}
                                  onChange={(event) => {
                                    const selectedId = event.target.value;
                                    const selectedOption = subledgerOptions.find((option) => option.id === selectedId);
                                    updateJournalLineLinkedEntity(line.id, subledgerCategory, selectedId, selectedOption?.label || "", selectedOption?.unit || "");
                                  }}
                                >
                                  <option value="">Seçin</option>
                                  {subledgerOptions.map((option) => <option key={`${line.id}-${subledgerCategory}-${option.id}`} value={option.id}>{option.label}</option>)}
                                </select>
                              </label>
                              {subledgerCategory === "goods" ? (
                                <label className="mj-line-related-field">
                                  <span>Miqdar və ölçü vahidi</span>
                                  <div className="mj-qty-unit-row">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={line.linkedQuantity ?? "0"}
                                      onChange={(event) => updateJournalLine(line.id, "linkedQuantity", event.target.value)}
                                      placeholder="Miqdar daxil edin"
                                    />
                                    <input
                                      value={line.linkedUnit ?? ""}
                                      onChange={(event) => updateJournalLine(line.id, "linkedUnit", event.target.value)}
                                      placeholder="Ölçü vahidi"
                                    />
                                  </div>
                                  {isTrackedInventoryItem ? (
                                    <small className="mj-stock-hint">Inventory tracking aktivdir. Mövcud qalıq: {selectedInventoryItem?.stockOnHand || 0} {selectedInventoryItem?.usageUnit || line.linkedUnit || ""}</small>
                                  ) : (
                                    <small className="mj-stock-hint">Inventory tracking yalnız izlənən anbar mallarında stok qalığını yeniləyir.</small>
                                  )}
                                </label>
                              ) : null}
                              <label className="mj-line-related-field">
                                <span>Yeni yarat</span>
                                <div className="mj-inline-create-row">
                                  <input
                                    value={journalInlineCreate[line.id]?.[subledgerCategory] || ""}
                                    onChange={(event) => setJournalInlineCreate((current) => ({
                                      ...current,
                                      [line.id]: {
                                        ...(current[line.id] || {}),
                                        [subledgerCategory]: event.target.value
                                      }
                                    }))}
                                    placeholder={`Yeni ${subledgerTabs.find((tab) => tab.id === subledgerCategory)?.label?.toLowerCase() || "alt bölmə"}...`}
                                  />
                                  <button className="ghost-btn compact-btn" type="button" onClick={() => createJournalSubledgerEntity(line.id, subledgerCategory)}>Yarat</button>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="mj-line-side">
                          <span className={`mj-line-entry-tag ${line.entryType === "Debet" ? "debit" : "credit"}`}>{line.entryType === "Debet" ? "D" : "K"}</span>
                          <span className={`mj-account-type-chip ${accountTypeMeta.className}`}>{accountTypeMeta.shortLabel}</span>
                          <small>{line.linkedEntityName || selectedAccount?.accountName || "—"}</small>
                          <small className="mj-account-type-note">{accountTypeMeta.label}</small>
                          <button className="table-btn danger-btn" type="button" onClick={() => removeJournalLine(line.id)} disabled={draft.journalLines.length <= 2}>{at.delete}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`journal-balance-note ${journalIsBalanced ? "balanced" : "unbalanced"} modern`}>
                <strong>{journalAnalysis?.conflictingCode ? at.mj_conflict : journalIsBalanced ? at.mj_balanced : at.mj_unbalanced}</strong>
                <span>{journalAnalysis?.conflictingCode ? `${journalAnalysis.conflictingCode} ${at.mj_conflictHint}` : journalIsBalanced ? at.mj_balancedHint : `${at.mj_diff}: ${currency(Math.abs(Number(journalAnalysis?.difference || 0)), state.settings.currency)}. ${at.mj_unbalancedHint}`}</span>
              </div>

              <div className="form-actions">
                <button className="primary-btn" type="submit" disabled={!journalIsBalanced}>{editing.manualJournals ? at.ic_updateBtn : at.save}</button>
                <button className="ghost-btn" type="button" onClick={() => cancelEdit("manualJournals")}>{at.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  function renderModule(moduleId) {
    const at = I18N[hubLang] || I18N.az;
    if (moduleId === "operationsJournal") return renderOperationsJournal(at);
    if (moduleId === "trialBalance") return renderTrialBalance();
    if (moduleId === "accountCard") return renderAccountCard();
    if (moduleId === "manualJournals") return renderManualJournals(at);
    if (moduleId === "itemsCatalog") return renderItemsCatalog();
    if (moduleId === "goods") return renderGoods();
    if (moduleId === "customers") return renderCustomers();
    if (moduleId === "invoices") return renderInvoices();
    if (moduleId === "receivables") return renderDebtReport("receivables");
    if (moduleId === "payables") return renderDebtReport("payables");
    if (moduleId === "financialPositionReport") return renderFinancialPositionReport();
    if (moduleId === "profitLossReport") return renderProfitLossReport();
    if (moduleId === "cashFlowReport") return renderCashFlowReport();
    if (moduleId === "equityChangesReport") return renderEquityChangesReport();
    if (moduleId === "incomingGoodsServices") {
      const config = MODULES.incomingGoodsServices;
      const query = searches[config.collection] || "";
      const draft = drafts.incomingGoodsServices || createModuleDraft("incomingGoodsServices");
      const lineItems = draft.lineItems || [createDefaultLineItem()];
      const rows = state.incomingGoodsServices.filter((item) => matchesSearch(item, query));
      const billTotals = calculateBillTotals(lineItems, draft.discount, draft.adjustment);
      const incomingJournalColumns = [...config.columns, ["debitAmount", "Debet", "currency"], ["creditAmount", "Kredit", "currency"]];
      const incomingJournalRows = rows.map((record) => {
        const ledgerLines = getIncomingGoodsLedgerEntries(record);
        const debitAmount = Number(ledgerLines.reduce((sum, line) => sum + Number(line.debit || 0), 0).toFixed(2));
        const creditAmount = Number(ledgerLines.reduce((sum, line) => sum + Number(line.credit || 0), 0).toFixed(2));
        return { ...record, debitAmount, creditAmount };
      });
      const activeIncomingLedgerRecord = incomingJournalRows.find((record) => record.id === incomingLedgerRecordId) || null;
      const activeIncomingLedgerLines = activeIncomingLedgerRecord ? getIncomingGoodsLedgerEntries(activeIncomingLedgerRecord) : [];
      const activeIncomingLedgerTotals = activeIncomingLedgerLines.reduce((acc, line) => ({
        debit: acc.debit + Number(line.debit || 0),
        credit: acc.credit + Number(line.credit || 0)
      }), { debit: 0, credit: 0 });
      const formatLedgerAmount = (value) => Number(value || 0) === 0 ? "" : currency(value, state.settings.currency);
      const incomingGoodsNameOptions = Array.from(
        state.goods.reduce((map, item) => {
          const name = String(item.name || "").trim();
          if (!name) return map;
          const key = name.toLowerCase();
          if (!map.has(key)) map.set(key, name);
          return map;
        }, new Map()).values()
      );
      const incomingAccountOptions = state.chartOfAccounts
        .filter((account) => isVisibleAccount(account))
        .slice()
        .sort((a, b) => Number(a.accountCode) - Number(b.accountCode));
      const updateIncomingLineItem = (lineId, field, value) => {
        setDrafts((current) => {
          const currentDraft = current.incomingGoodsServices || createModuleDraft("incomingGoodsServices");
          return {
            ...current,
            incomingGoodsServices: {
              ...currentDraft,
              lineItems: (currentDraft.lineItems || [createDefaultLineItem()]).map((item) => {
                if (item.id !== lineId) return item;
                const nextValue = field === "accountCode" ? normalizeAccountCodeInput(value, item.accountCode || "205") : value;
                const nextItem = { ...item, [field]: nextValue };
                return { ...nextItem, ...calculateLineItem(nextItem.quantity, nextItem.rate, nextItem.taxLabel) };
              })
            }
          };
        });
      };
      const addIncomingLineItem = () => {
        setDrafts((current) => {
          const currentDraft = current.incomingGoodsServices || createModuleDraft("incomingGoodsServices");
          return {
            ...current,
            incomingGoodsServices: {
              ...currentDraft,
              lineItems: [...(currentDraft.lineItems || [createDefaultLineItem()]), createDefaultLineItem()]
            }
          };
        });
      };
      const removeIncomingLineItem = (lineId) => {
        setDrafts((current) => {
          const currentDraft = current.incomingGoodsServices || createModuleDraft("incomingGoodsServices");
          const currentItems = currentDraft.lineItems || [createDefaultLineItem()];
          return {
            ...current,
            incomingGoodsServices: {
              ...currentDraft,
              lineItems: currentItems.length <= 1 ? currentItems : currentItems.filter((item) => item.id !== lineId)
            }
          };
        });
      };

      // ── Overview (hub) ──
      if (billView === "overview") {
        return (
          <section className="view active">
            {OVERVIEWS[activeSection]?.includes("incomingGoodsServices") && (
              <div className="module-back-bar">
                <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
              </div>
            )}
            <div className="bill-hub">
              <div className="bill-hub-card" onClick={() => setBillView("journal")}>
                <div className="bill-hub-icon">📋</div>
                <div className="bill-hub-info">
                  <h3>{at.hub_billsJournal}</h3>
                  <p>{at.hub_billsJournalDesc}</p>
                  <span className="bill-hub-count">{state.incomingGoodsServices.length} {at.hub_billsCount}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => { cancelEdit("incomingGoodsServices"); setBillView("form"); }}>
                <div className="bill-hub-icon">➕</div>
                <div className="bill-hub-info">
                  <h3>{at.hub_billsNew}</h3>
                  <p>{at.hub_billsNewDesc}</p>
                  <span className="bill-hub-count">{at.newDoc}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
            </div>
          </section>
        );
      }

      // ── LIST (JOURNAL) ──
      if (billView === "journal") {
        return (
          <section className="view active">
            <div className="bill-journal-header">
              <button className="bill-back-btn" type="button" onClick={() => setBillView("overview")}>{at.back}</button>
              <div className="bill-journal-title-row">
                <h2>{at.hub_billsJournal}</h2>
                <button className="primary-btn" type="button" onClick={() => { startIncomingGoodsEntry(); setBillView("form"); }}>{at.hub_billsNew}</button>
              </div>
            </div>
            <div className="panel">
              <div className="panel-toolbar">
                <input className="search-input" placeholder={at.search} value={query} onChange={(event) => setSearches((current) => ({ ...current, [config.collection]: event.target.value }))} />
              </div>
              <Table
                headers={incomingJournalColumns.map(([, label]) => col(label)).concat(at.action)}
                emptyMessage={at.noItems}
                rows={incomingJournalRows.map((record) => (
                  <tr key={record.id}>
                    {incomingJournalColumns.map((column) => <td key={column[0]}>{renderCell(record, column)}</td>)}
                    <td>
                      <div className="row-actions">
                        <button className="table-btn" type="button" onClick={() => startEdit("incomingGoodsServices", record)}>{at.edit}</button>
                        <button className="table-btn danger-btn" type="button" onClick={() => removeModuleRecord("incomingGoodsServices", record.id)}>{at.delete}</button>
                        <button className="table-btn" type="button" onClick={() => setIncomingLedgerRecordId((current) => current === record.id ? null : record.id)}>Müxabirləşməyə bax</button>
                      </div>
                    </td>
                  </tr>
                ))}
              />
              {activeIncomingLedgerRecord ? (
                <div className="incoming-ledger-panel">
                  <div className="incoming-ledger-panel-head">
                    <strong>Müxabirləşmə: {activeIncomingLedgerRecord.billNumber || "Mal qaiməsi"}</strong>
                    <button className="table-btn" type="button" onClick={() => setIncomingLedgerRecordId(null)}>Bağla</button>
                  </div>
                  <Table
                    headers={["Hesab", "Debet", "Kredit"]}
                    emptyMessage={at.noItems}
                    rows={activeIncomingLedgerLines.map((line) => (
                      <tr key={line.key}>
                        <td>{line.accountCode} - {line.accountName}</td>
                        <td>{formatLedgerAmount(line.debit)}</td>
                        <td>{formatLedgerAmount(line.credit)}</td>
                      </tr>
                    )).concat([
                      <tr key="incoming-ledger-total">
                        <td><strong>Cəmi</strong></td>
                        <td><strong>{formatLedgerAmount(activeIncomingLedgerTotals.debit)}</strong></td>
                        <td><strong>{formatLedgerAmount(activeIncomingLedgerTotals.credit)}</strong></td>
                      </tr>
                    ])}
                  />
                </div>
              ) : null}
            </div>
          </section>
        );
      }

      // ── FORM (CREATE / EDIT) ──
      return (
        <section className="view active">
          <div className="bill-form-page">
            <div className="bill-journal-header">
              <button className="bill-back-btn" type="button" onClick={() => cancelEdit("incomingGoodsServices")}>{at.back}</button>
              <div className="bill-journal-title-row">
                <h2>{editing.incomingGoodsServices ? at.formTitle_edit : at.formTitle_new}</h2>
              </div>
            </div>
            <div className="bill-form-panel">
              <form className="form-grid" onSubmit={(event) => submitModule("incomingGoodsServices", event)}>
                <div className="bill-header-fields">
                  <label className="bill-header-field">
                    <span>{col("Qaimə №")}</span>
                    <input value={draft.billNumber ?? ""} onChange={(event) => updateDraft("incomingGoodsServices", "billNumber", event.target.value)} required />
                  </label>
                  <label className="bill-header-field">
                    <span>{col("Tarix")}</span>
                    <input type="date" value={draft.billDate ?? today()} onChange={(event) => updateDraft("incomingGoodsServices", "billDate", event.target.value)} required />
                  </label>
                  <label className="bill-header-field">
                    <span>{col("Satıcı")}</span>
                    <input list="incoming-vendors-list" value={draft.vendorName ?? ""} onChange={(event) => updateDraft("incomingGoodsServices", "vendorName", event.target.value)} placeholder={at.opt_vendor || "Satıcı"} required />
                  </label>
                </div>
                <datalist id="incoming-vendors-list">
                  {state.vendors.map((vendor) => <option key={vendor.id} value={vendor.vendorName || vendor.companyName || ""} />)}
                </datalist>

                <div className="bill-item-table-wrap">
                  <table className="bill-item-table">
                    <thead>
                      <tr>
                        <th>{fld("Ad")}</th>
                        <th>{col("Kod")}</th>
                        <th>{at.inv_qty || "Miqdar"}</th>
                        <th>{at.inv_unitPrice || "Qiymət"}</th>
                        <th>{at.inv_taxRate || "Vergi"}</th>
                        <th>{col("Cəmi")}</th>
                        <th>{at.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id}>
                          <td><input list="incoming-goods-list" value={item.itemName ?? ""} onChange={(event) => updateIncomingLineItem(item.id, "itemName", event.target.value)} placeholder={fld("Ad")} /></td>
                          <td>
                            <select value={item.accountCode ?? "205"} onChange={(event) => updateIncomingLineItem(item.id, "accountCode", event.target.value)}>
                              {incomingAccountOptions.map((account) => <option key={`${item.id}-${account.id}`} value={account.accountCode}>{account.accountCode} - {account.accountName}</option>)}
                            </select>
                          </td>
                          <td><input type="number" step="0.01" min="0" value={item.quantity ?? "1"} onChange={(event) => updateIncomingLineItem(item.id, "quantity", event.target.value)} /></td>
                          <td><input type="number" step="0.01" min="0" value={item.rate ?? "0"} onChange={(event) => updateIncomingLineItem(item.id, "rate", event.target.value)} /></td>
                          <td>
                            <select value={item.taxLabel ?? PURCHASE_TAX_OPTIONS[0]} onChange={(event) => updateIncomingLineItem(item.id, "taxLabel", event.target.value)}>
                              {PURCHASE_TAX_OPTIONS.map((option) => <option key={`${item.id}-${option}`} value={option}>{option}</option>)}
                            </select>
                          </td>
                          <td>{currency(item.amount || 0, state.settings.currency)}</td>
                          <td>
                            <button className="table-btn danger-btn" type="button" onClick={() => removeIncomingLineItem(item.id)}>{at.delete}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <datalist id="incoming-goods-list">
                  {incomingGoodsNameOptions.map((name) => <option key={name} value={name} />)}
                </datalist>

                <div className="form-actions">
                  <button className="ghost-btn" type="button" onClick={addIncomingLineItem}>{at.mj_addLine || "Sətir əlavə et"}</button>
                </div>

                <label>
                  <span>{at.opt_notes || "Qeydlər"}</span>
                  <textarea rows={3} value={draft.notes ?? ""} onChange={(event) => updateDraft("incomingGoodsServices", "notes", event.target.value)} />
                </label>

                <div className="bill-header-fields">
                  <label className="bill-header-field">
                    <span>{at.opt_discountPct || "Endirim (%)"}</span>
                    <input type="number" step="0.01" min="0" value={draft.discount ?? "0"} onChange={(event) => updateDraft("incomingGoodsServices", "discount", event.target.value)} />
                  </label>
                  <label className="bill-header-field">
                    <span>{at.opt_adjustment || "Düzəliş"}</span>
                    <input type="number" step="0.01" value={draft.adjustment ?? "0"} onChange={(event) => updateDraft("incomingGoodsServices", "adjustment", event.target.value)} />
                  </label>
                  <div className="bill-header-field">
                    <span>{at.fld["Cəmi məbləğ"] || "Cəmi məbləğ"}</span>
                    <input value={currency(billTotals.totalAmount || 0, state.settings.currency)} readOnly />
                  </div>
                </div>

                <div className="ops-preview-strip">
                  <div><span>{at.opt_subTotal || "Alt cəmi"}</span><strong>{currency(billTotals.subTotal || 0, state.settings.currency)}</strong></div>
                  <div><span>{at.inv_form_discount || "Endirim"}</span><strong>{currency(billTotals.discountAmount || 0, state.settings.currency)}</strong></div>
                  <div><span>{at.fld["Cəmi məbləğ"] || "Cəmi məbləğ"}</span><strong>{currency(billTotals.totalAmount || 0, state.settings.currency)}</strong></div>
                </div>

                <div className="form-actions">
                  <button className="primary-btn" type="submit">{editing.incomingGoodsServices ? at.ic_updateBtn : at.save}</button>
                  <button className="ghost-btn" type="button" onClick={() => cancelEdit("incomingGoodsServices")}>{at.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      );
    }

    if (moduleId === "vendors") {
      const config = MODULES.vendors;
      const query = searches[config.collection] || "";
      const draft = drafts.vendors || createModuleDraft("vendors");
      const rows = state.vendors.filter((item) => matchesSearch(item, query));
      const vendorCount = vendorsMeta?.total ?? state.vendors.length;
      const vendorStatusNotice = vendorsLoading ? "Təchizatçılar backend-dən yüklənir..." : vendorsError;
      const vendorEmptyMessage = vendorsLoading ? "Təchizatçılar yüklənir..." : at.noVendor;

      if (vendorView === "overview") {
        return (
          <section className="view active">
            {OVERVIEWS[activeSection]?.includes("vendors") && (
              <div className="module-back-bar">
                <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
              </div>
            )}
            {vendorStatusNotice ? (
              <div className="panel">
                <p className="panel-copy">{vendorStatusNotice}</p>
              </div>
            ) : null}
            <div className="bill-hub">
              <div className="bill-hub-card" onClick={() => setVendorView("journal")}>
                <div className="bill-hub-icon">🏢</div>
                <div className="bill-hub-info">
                  <h3>{at.hub_vendorsJournal}</h3>
                  <p>{at.hub_vendorsJournalDesc}</p>
                  <span className="bill-hub-count">{vendorCount} {at.hub_vendorsCount}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => { cancelEdit("vendors"); setVendorView("form"); }}>
                <div className="bill-hub-icon">➕</div>
                <div className="bill-hub-info">
                  <h3>{at.hub_vendorsNew}</h3>
                  <p>{at.hub_vendorsNewDesc}</p>
                  <span className="bill-hub-count">{at.newRecord}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
            </div>
          </section>
        );
      }

      if (vendorView === "journal") {
        return (
          <section className="view active">
            <div className="bill-journal-header">
              <button className="bill-back-btn" type="button" onClick={() => setVendorView("overview")}>{at.back}</button>
              <div className="bill-journal-title-row">
                <h2>{at.vendorJournalTitle}</h2>
                <button className="primary-btn" type="button" onClick={() => { cancelEdit("vendors"); setVendorView("form"); }}>{at.hub_vendorsNew}</button>
              </div>
            </div>
            <div className="panel">
              {vendorStatusNotice ? <p className="panel-copy">{vendorStatusNotice}</p> : null}
              <div className="panel-toolbar">
                <input className="search-input" placeholder={at.searchVendor} value={query} onChange={(e) => setSearches((current) => ({ ...current, [config.collection]: e.target.value }))} />
              </div>
              <Table
                headers={config.columns.map(([, label]) => col(label)).concat(at.action)}
                emptyMessage={vendorEmptyMessage}
                rows={rows.map((record) => (
                  <tr key={record.id}>
                    {config.columns.map((column) => <td key={column[0]}>{renderCell(record, column)}</td>)}
                    <td>
                      <div className="row-actions">
                        <button className="table-btn" onClick={() => startEdit("vendors", record)} disabled={vendorsLoading}>{at.edit}</button>
                        <button className="table-btn danger-btn" onClick={() => removeModuleRecord("vendors", record.id)} disabled={vendorsLoading}>{at.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              />
            </div>
          </section>
        );
      }

      return (
        <section className="view active">
          <div className="bill-form-page">
            <div className="bill-journal-header">
              <button className="bill-back-btn" type="button" onClick={() => cancelEdit("vendors")}>{at.back}</button>
              <div className="bill-journal-title-row">
                <h2>{editing.vendors ? at.formTitle_editVendor : at.formTitle_newVendor}</h2>
              </div>
            </div>
            <div className="bill-form-panel">
              <form className="form-grid" onSubmit={(event) => submitModule("vendors", event)}>
                {vendorStatusNotice ? <p className="panel-copy">{vendorStatusNotice}</p> : null}
                {config.form.filter((field) => field[0] !== "vendorName").map((field) => (
                  <label key={field[0]}>
                    <span>{fld(field[1])}</span>
                    <SmartField field={field} value={draft[field[0]] ?? ""} onChange={(e) => updateDraft("vendors", field[0], e.target.value)} at={at} />
                  </label>
                ))}
                <div className="form-actions">
                  <button className="primary-btn" type="submit" disabled={vendorsLoading}>{editing.vendors ? at.ic_updateBtn : at.save}</button>
                  <button className="ghost-btn" type="button" onClick={() => cancelEdit("vendors")} disabled={vendorsLoading}>{at.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      );
    }

    if (moduleId === "chartOfAccounts") {
      const config = MODULES.chartOfAccounts;
      const query = searches[config.collection] || "";
      const draft = drafts.chartOfAccounts || createModuleDraft("chartOfAccounts");
      const rows = state.chartOfAccounts
        .filter((item) => isVisibleAccount(item))
        .filter((item) => matchesSearch(item, query))
        .sort((a, b) => Number(a.accountCode) - Number(b.accountCode));

      if (chartView === "overview") {
        return (
          <section className="view active">
            {OVERVIEWS[activeSection]?.includes("chartOfAccounts") && (
              <div className="module-back-bar">
                <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
              </div>
            )}
            {vendorStatusNotice ? (
              <div className="panel">
                <p className="panel-copy">{vendorStatusNotice}</p>
              </div>
            ) : null}
            <div className="bill-hub">
              <div className="bill-hub-card" onClick={() => setChartView("journal")}>
                <div className="bill-hub-icon">📊</div>
                <div className="bill-hub-info">
                  <h3>{at.hub_coaJournal}</h3>
                  <p>{at.hub_coaJournalDesc}</p>
                  <span className="bill-hub-count">{rows.length} hesab</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
              <div className="bill-hub-card" onClick={() => { cancelEdit("chartOfAccounts"); setChartView("form"); }}>
                <div className="bill-hub-icon">➕</div>
                <div className="bill-hub-info">
                  <h3>{at.hub_coaNew}</h3>
                  <p>{at.hub_coaNewDesc}</p>
                  <span className="bill-hub-count">{at.newRecord}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
            </div>
          </section>
        );
      }

      if (chartView === "journal") {
        return (
          <section className="view active">
            <div className="bill-journal-header">
              <button className="bill-back-btn" type="button" onClick={() => setChartView("overview")}>{at.back}</button>
              <div className="bill-journal-title-row">
                <h2>{at.coaJournalTitle}</h2>
                <button className="primary-btn" type="button" onClick={() => { cancelEdit("chartOfAccounts"); setChartView("form"); }}>{at.journalNewAcc}</button>
              </div>
            </div>
            <div className="panel">
              <div className="panel-toolbar">
                <input className="search-input" placeholder={at.searchAcc} value={query} onChange={(e) => setSearches((current) => ({ ...current, [config.collection]: e.target.value }))} />
              </div>
              <Table
                headers={config.columns.map(([, label]) => col(label)).concat(at.action)}
                emptyMessage={at.noAcc}
                rows={rows.map((record) => (
                  <tr key={record.id}>
                    {config.columns.map((column) => <td key={column[0]}>{renderCell(record, column)}</td>)}
                    <td>
                      <div className="row-actions">
                        <button className="table-btn" onClick={() => startEdit("chartOfAccounts", record)}>{at.edit}</button>
                        <button className="table-btn danger-btn" onClick={() => removeModuleRecord("chartOfAccounts", record.id)}>{at.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              />
            </div>
          </section>
        );
      }

      return (
        <section className="view active">
          <div className="bill-form-page">
            <div className="bill-journal-header">
              <button className="bill-back-btn" type="button" onClick={() => cancelEdit("chartOfAccounts")}>{at.back}</button>
              <div className="bill-journal-title-row">
                <h2>{editing.chartOfAccounts ? at.formTitle_editCoa : at.formTitle_newCoa}</h2>
              </div>
            </div>
            <div className="bill-form-panel">
              <form className="form-grid" onSubmit={(event) => submitModule("chartOfAccounts", event)}>
                {config.form.map((field) => (
                  <label key={field[0]}>
                    <span>{fld(field[1])}</span>
                    <SmartField field={field} value={draft[field[0]] ?? ""} onChange={(e) => updateDraft("chartOfAccounts", field[0], e.target.value)} at={at} />
                  </label>
                ))}
                <div className="form-actions">
                  <button className="primary-btn" type="submit">{editing.chartOfAccounts ? at.ic_updateBtn : at.save}</button>
                  <button className="ghost-btn" type="button" onClick={() => cancelEdit("chartOfAccounts")}>{at.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      );
    }

    const config = MODULES[moduleId];
    const query = searches[config.collection] || "";
    const draft = drafts[moduleId] || createModuleDraft(moduleId);
    const rows = state[config.collection]
      .filter((item) => (moduleId === "chartOfAccounts" ? isVisibleAccount(item) : true))
      .filter((item) => matchesSearch(item, query));
    const journalAnalysis = moduleId === "manualJournals" ? getManualJournalAnalysis(draft) : null;
    const journalIsBalanced = moduleId === "manualJournals" ? journalAnalysis.isBalanced : true;
    const filteredAccounts = ((moduleId === "manualJournals" && draft.accountTypeFilter && draft.accountTypeFilter !== "Hamısı"
      ? state.chartOfAccounts.filter((account) => account.accountType === draft.accountTypeFilter)
      : state.chartOfAccounts))
      .filter((account) => isVisibleAccount(account))
      .slice()
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode));

    const hasOverviewParent = Object.values(OVERVIEWS).some((ids) => ids.includes(moduleId));
    return (
      <section className="view active">
        {hasOverviewParent && (
          <div className="module-back-bar">
            <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
          </div>
        )}
        <div className="panel-grid two-up">
          <section className="panel">
            <div className="panel-head"><div><h3>{config.title}</h3><p className="panel-copy">{config.summary}</p></div><span>{rows.length} {at.unit_record}</span></div>
            <div className="panel-toolbar"><input className="search-input" placeholder={at.search} value={query} onChange={(event) => setSearches((current) => ({ ...current, [config.collection]: event.target.value }))} /></div>
            <Table
              headers={[...config.columns.map(([, label]) => col(label)), at.action]}
              emptyMessage={at.noItems}
              rows={rows.map((record) => (
                <tr key={record.id}>
                  {config.columns.map((column) => <td key={column[0]}>{renderCell(record, column)}</td>)}
                  <td><div className="row-actions"><button className="table-btn" onClick={() => startEdit(moduleId, record)}>{at.edit}</button><button className="table-btn danger-btn" onClick={() => removeModuleRecord(moduleId, record.id)}>{at.delete}</button></div></td>
                </tr>
              ))}
            />
          </section>
          <section className="panel">
            <div className="panel-head"><div><h3>{editing[moduleId] ? `${config.singular} ${at.formTitle_edit}` : `${config.singular} ${at.formTitle_new}`}</h3><p className="panel-copy">{editing[moduleId] ? at.formDesc_editing : at.formDesc_new}</p></div><span>{editing[moduleId] ? at.formTitle_edit : at.formTitle_new}</span></div>
            <form className="form-grid" onSubmit={(event) => submitModule(moduleId, event)}>
              {moduleId === "manualJournals" ? (
                <>
                  <label><span>{fld("Jurnal #")}</span><input value={draft.journalNumber ?? ""} onChange={(event) => updateDraft(moduleId, "journalNumber", event.target.value)} required /></label>
                  <label><span>{fld("Təyinat")}</span><input value={draft.reference ?? ""} onChange={(event) => updateDraft(moduleId, "reference", event.target.value)} required /></label>
                  <label><span>{fld("Tarix")}</span><input type="date" value={draft.date ?? today()} onChange={(event) => updateDraft(moduleId, "date", event.target.value)} required /></label>
                  <label><span>{at.mj_accountTypeFilter}</span><select value={draft.accountTypeFilter ?? "Hamısı"} onChange={(event) => updateDraft(moduleId, "accountTypeFilter", event.target.value)}><option value="Hamısı">{at.goods_tabAll}</option><option value="Aktiv">{at.coa_asset}</option><option value="Öhdəlik">{at.coa_liability}</option><option value="Kapital">{at.coa_equity}</option><option value="Gəlir">{at.coa_income}</option><option value="Xərc">{at.coa_expense}</option></select></label>
                  <div className="journal-lines-card">
                    <div className="journal-lines-head">
                      <strong>{at.mj_lines}</strong>
                      <button className="ghost-btn compact-btn" type="button" onClick={addJournalLine}>{at.mj_addLine}</button>
                    </div>
                    <div className="journal-lines-list">
                      {draft.journalLines.map((line, index) => (
                        <div className="journal-line-row" key={line.id}>
                          <span className="journal-line-index">{index + 1}</span>
                          <select value={line.accountCode} onChange={(event) => updateJournalLine(line.id, "accountCode", event.target.value)}>
                            <option value="">{at.mj_selectAccount}</option>
                            {filteredAccounts.map((account) => <option key={`${line.id}-${account.id}`} value={account.accountCode}>{account.accountCode} - {account.accountName}</option>)}
                          </select>
                          <select value={line.entryType} onChange={(event) => updateJournalLine(line.id, "entryType", event.target.value)}>
                            <option value="Debet">{fld("Debet")}</option>
                            <option value="Kredit">{fld("Kredit")}</option>
                          </select>
                          <input type="number" step="0.01" value={line.amount} onChange={(event) => updateJournalLine(line.id, "amount", event.target.value)} />
                          <button className="table-btn danger-btn" type="button" onClick={() => removeJournalLine(line.id)} disabled={draft.journalLines.length <= 2}>{at.delete}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`journal-balance-note ${journalIsBalanced ? "balanced" : "unbalanced"}`}>
                    <strong>{journalAnalysis?.conflictingCode ? at.mj_conflict : journalIsBalanced ? at.mj_balanced : at.mj_unbalanced}</strong>
                    <span>{journalAnalysis?.conflictingCode ? `${journalAnalysis.conflictingCode} ${at.mj_conflictHint}` : journalIsBalanced ? at.mj_balancedHint : `${at.mj_diff}: ${currency(Math.abs(Number(journalAnalysis?.difference || 0)), state.settings.currency)}. ${at.mj_unbalancedHint}`}</span>
                  </div>
                </>
              ) : (
                config.form.map((field) => <label key={field[0]}><span>{fld(field[1])}</span><SmartField field={field} value={draft[field[0]] ?? ""} onChange={(event) => updateDraft(moduleId, field[0], event.target.value)} at={at} /></label>)
              )}
              {renderOperationalFields(moduleId, draft)}
              <div className="form-actions"><button className="primary-btn" type="submit" disabled={moduleId === "manualJournals" && !journalIsBalanced}>{editing[moduleId] ? at.ic_updateBtn : at.save}</button>{editing[moduleId] ? <button className="ghost-btn" type="button" onClick={() => cancelEdit(moduleId)}>{at.cancel}</button> : null}</div>
            </form>
          </section>
        </div>
      </section>
    );
  }

  function renderOperationsJournal(at) {
    const cur = state.settings.currency || "AZN";

    // ── Bütün mənbələrdən müxabirləşmə xəttlərini yığ ──────────────────────
    function collectAllEntries() {
      const result = [];

      // 1. Əl ilə daxil edilən jurnallar
      state.manualJournals.forEach((journal) => {
        const lines = [];
        if (Array.isArray(journal.journalLines) && journal.journalLines.length > 0) {
          journal.journalLines.forEach((line) => {
            if (line.accountCode && Number(line.amount || 0) > 0) {
              lines.push({
                accountCode: line.accountCode,
                accountName: getAccountNameByCode(line.accountCode),
                debit: line.entryType === "Debet" ? Number(line.amount) : 0,
                credit: line.entryType === "Kredit" ? Number(line.amount) : 0,
              });
            }
          });
        } else {
          if (journal.debitAccount && Number(journal.debit || 0) > 0) {
            lines.push({ accountCode: journal.debitAccount, accountName: getAccountNameByCode(journal.debitAccount), debit: Number(journal.debit), credit: 0 });
          }
          if (journal.creditAccount && Number(journal.credit || 0) > 0) {
            lines.push({ accountCode: journal.creditAccount, accountName: getAccountNameByCode(journal.creditAccount), debit: 0, credit: Number(journal.credit) });
          }
        }
        if (lines.length === 0) return;
        result.push({
          id: journal.id,
          date: journal.date || "",
          reference: journal.reference || journal.journalNumber || "—",
          refNumber: journal.journalNumber || "",
          type: "manual",
          typeLabel: "Əl ilə",
          lines,
          totalDebit: lines.reduce((s, l) => s + l.debit, 0),
          totalCredit: lines.reduce((s, l) => s + l.credit, 0),
        });
      });

      // 2. Mal hərəkətləri (Satış / Alış kataloqu)
      state.itemMovements.forEach((movement) => {
        const rawLines = getMovementLedgerEntries(movement);
        if (rawLines.length === 0) return;
        const linkedItem = state.items.find((item) => item.id === movement.itemId);
        const lines = rawLines.map((l) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        }));
        result.push({
          id: movement.id,
          date: movement.movementDate || "",
          reference: linkedItem?.name || movement.movementType || "Mal hərəkəti",
          refNumber: movement.movementType === "Satış" ? "SATIŞ" : "ALIŞ",
          type: movement.movementType === "Satış" ? "sale" : "purchase",
          typeLabel: movement.movementType === "Satış" ? "Satış" : "Alış",
          lines,
          totalDebit: lines.reduce((s, l) => s + l.debit, 0),
          totalCredit: lines.reduce((s, l) => s + l.credit, 0),
        });
      });

      // 3. Mal qaimələri (incomingGoodsServices)
      state.incomingGoodsServices.forEach((entry) => {
        const rawLines = getIncomingGoodsLedgerEntries(entry);
        if (rawLines.length === 0) return;
        const lines = rawLines.map((l) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        }));
        result.push({
          id: entry.id,
          date: entry.billDate || entry.createdAt || "",
          reference: entry.vendorName || entry.billNumber || "Mal qaiməsi",
          refNumber: entry.billNumber || "",
          type: "incoming",
          typeLabel: "Mal qaiməsi",
          lines,
          totalDebit: lines.reduce((s, l) => s + l.debit, 0),
          totalCredit: lines.reduce((s, l) => s + l.credit, 0),
        });
      });

      // 4. Satış qaimələri (invoices)
      state.invoices.forEach((invoice) => {
        const amount = Number(invoice.amount || 0);
        if (amount <= 0) return;
        const lines = [
          { accountCode: "211", accountName: getAccountNameByCode("211"), debit: amount, credit: 0 },
          { accountCode: "601", accountName: getAccountNameByCode("601"), debit: 0, credit: amount },
        ];
        result.push({
          id: `inv-${invoice.id}`,
          date: invoice.dueDate || invoice.createdAt || "",
          reference: invoice.customerName || invoice.invoiceNumber || "Satış qaiməsi",
          refNumber: invoice.invoiceNumber || "",
          type: "invoice",
          typeLabel: "Satış qaiməsi",
          lines,
          totalDebit: amount,
          totalCredit: amount,
        });
      });

      // 5. Satış qəbzləri (salesReceipts)
      state.salesReceipts.forEach((receipt) => {
        const amount = Number(receipt.amount || 0);
        if (amount <= 0) return;
        const cashAcc = receipt.paymentMode === "Nağd" ? "221" : "223";
        const lines = [
          { accountCode: cashAcc, accountName: getAccountNameByCode(cashAcc), debit: amount, credit: 0 },
          { accountCode: "601", accountName: getAccountNameByCode("601"), debit: 0, credit: amount },
        ];
        result.push({
          id: `sr-${receipt.id}`,
          date: receipt.date || receipt.createdAt || "",
          reference: receipt.customerName || receipt.receiptNumber || "Satış qəbzi",
          refNumber: receipt.receiptNumber || "",
          type: "sales_receipt",
          typeLabel: "Satış qəbzi",
          lines,
          totalDebit: amount,
          totalCredit: amount,
        });
      });

      // 6. Alınan ödənişlər (paymentsReceived)
      state.paymentsReceived.forEach((payment) => {
        const amount = Number(payment.amount || 0);
        if (amount <= 0) return;
        const cashAcc = payment.paymentMode === "Nağd" ? "221" : "223";
        const lines = [
          { accountCode: cashAcc, accountName: getAccountNameByCode(cashAcc), debit: amount, credit: 0 },
          { accountCode: "211", accountName: getAccountNameByCode("211"), debit: 0, credit: amount },
        ];
        result.push({
          id: `pr-${payment.id}`,
          date: payment.date || payment.createdAt || "",
          reference: payment.customerName || payment.paymentNumber || "Alınan ödəniş",
          refNumber: payment.paymentNumber || "",
          type: "payment_received",
          typeLabel: "Alınan ödəniş",
          lines,
          totalDebit: amount,
          totalCredit: amount,
        });
      });

      // 7. Kredit notları (creditNotes)
      state.creditNotes.forEach((note) => {
        const amount = Number(note.amount || 0);
        if (amount <= 0) return;
        const lines = [
          { accountCode: "601", accountName: getAccountNameByCode("601"), debit: amount, credit: 0 },
          { accountCode: "211", accountName: getAccountNameByCode("211"), debit: 0, credit: amount },
        ];
        result.push({
          id: `cn-${note.id}`,
          date: note.date || note.createdAt || "",
          reference: note.customerName || note.creditNumber || "Kredit notu",
          refNumber: note.creditNumber || "",
          type: "credit_note",
          typeLabel: "Kredit notu",
          lines,
          totalDebit: amount,
          totalCredit: amount,
        });
      });

      // 8. Xərclər (expenses)
      state.expenses.forEach((expense) => {
        const amount = Number(expense.amount || 0);
        if (amount <= 0) return;
        const cashAcc = expense.paymentMode === "Nağd" ? "221" : "223";
        const expCode = expense.category === "İcarə" ? "711" : expense.category === "Əmək haqqı" ? "533" : "731";
        const lines = [
          { accountCode: expCode, accountName: getAccountNameByCode(expCode), debit: amount, credit: 0 },
          { accountCode: cashAcc, accountName: getAccountNameByCode(cashAcc), debit: 0, credit: amount },
        ];
        result.push({
          id: `exp-${expense.id}`,
          date: expense.date || expense.createdAt || "",
          reference: expense.category || expense.expenseNumber || "Xərc",
          refNumber: expense.expenseNumber || "",
          type: "expense",
          typeLabel: "Xərc",
          lines,
          totalDebit: amount,
          totalCredit: amount,
        });
      });

      // 9. Hesab-fakturalar (bills)
      state.bills.forEach((bill) => {
        const amount = Number(bill.amount || 0);
        if (amount <= 0) return;
        const lines = [
          { accountCode: "205", accountName: getAccountNameByCode("205"), debit: amount, credit: 0 },
          { accountCode: "531", accountName: getAccountNameByCode("531"), debit: 0, credit: amount },
        ];
        result.push({
          id: `bill-${bill.id}`,
          date: bill.dueDate || bill.createdAt || "",
          reference: bill.vendorName || bill.billNumber || "Hesab-faktura",
          refNumber: bill.billNumber || "",
          type: "bill",
          typeLabel: "Hesab-faktura",
          lines,
          totalDebit: amount,
          totalCredit: amount,
        });
      });

      // 10. Bank əməliyyatları (bankTransactions)
      state.bankTransactions.forEach((tx) => {
        const amount = Number(tx.amount || 0);
        if (amount <= 0) return;
        const bankAcc = state.bankingAccounts.find((a) => a.id === tx.bankAccountId);
        const bankCode = bankAcc?.coaCode || "223";
        const counterCode = tx.accountCode || (tx.transactionType === "Mədaxil" ? "611" : "731");
        const isMedaxil = tx.transactionType === "Mədaxil";
        const lines = isMedaxil
          ? [
              { accountCode: bankCode, accountName: getAccountNameByCode(bankCode), debit: amount, credit: 0 },
              { accountCode: counterCode, accountName: getAccountNameByCode(counterCode), debit: 0, credit: amount },
            ]
          : [
              { accountCode: counterCode, accountName: getAccountNameByCode(counterCode), debit: amount, credit: 0 },
              { accountCode: bankCode, accountName: getAccountNameByCode(bankCode), debit: 0, credit: amount },
            ];
        result.push({
          id: `btx-${tx.id}`,
          date: tx.date || "",
          reference: tx.description || tx.reference || (isMedaxil ? "Bank mədaxil" : "Bank məxaric"),
          refNumber: tx.reference || "",
          type: isMedaxil ? "bank_in" : "bank_out",
          typeLabel: isMedaxil ? "Bank mədaxil" : "Bank məxaric",
          lines,
          totalDebit: amount,
          totalCredit: amount,
        });
      });

      return result.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }

    const allEntries = collectAllEntries();

    // ── Filterləri tətbiq et ─────────────────────────────────────────────────
    const SALE_TYPES     = new Set(["sale", "invoice", "sales_receipt", "payment_received", "credit_note"]);
    const PURCHASE_TYPES = new Set(["purchase", "incoming", "expense", "bill"]);
    const BANK_TYPES     = new Set(["bank_in", "bank_out"]);

    const filtered = allEntries.filter((entry) => {
      if (opJournalFilter.type !== "all") {
        if (opJournalFilter.type === "manual"   && entry.type !== "manual")           return false;
        if (opJournalFilter.type === "sale"     && !SALE_TYPES.has(entry.type))      return false;
        if (opJournalFilter.type === "purchase" && !PURCHASE_TYPES.has(entry.type))  return false;
        if (opJournalFilter.type === "bank"     && !BANK_TYPES.has(entry.type))      return false;
      }
      if (opJournalFilter.search) {
        const q = opJournalFilter.search.toLowerCase();
        if (
          !entry.reference.toLowerCase().includes(q) &&
          !entry.refNumber.toLowerCase().includes(q) &&
          !entry.date.includes(q) &&
          !entry.lines.some((l) => l.accountName.toLowerCase().includes(q) || l.accountCode.includes(q))
        ) return false;
      }
      if (opJournalFilter.dateFrom && entry.date && entry.date < opJournalFilter.dateFrom) return false;
      if (opJournalFilter.dateTo && entry.date && entry.date > opJournalFilter.dateTo) return false;
      return true;
    });

    const totalDebit = filtered.reduce((s, e) => s + e.totalDebit, 0);
    const totalCredit = filtered.reduce((s, e) => s + e.totalCredit, 0);

    const TYPE_CONFIG = {
      manual:           { label: at.opt_manual || "Əl ilə",         cls: "opj-badge-manual"   },
      sale:             { label: at.mov_sale || "Satış",           cls: "opj-badge-sale"     },
      purchase:         { label: at.mov_purchase || "Alış",         cls: "opj-badge-purchase" },
      incoming:         { label: at.mod_incomingGoodsServices || "Mal qaiməsi",     cls: "opj-badge-incoming" },
      invoice:          { label: at.mod_invoices || "Satış qaiməsi",   cls: "opj-badge-sale"     },
      sales_receipt:    { label: at.mod_salesReceipts || "Satış qəbzi",     cls: "opj-badge-sale"     },
      payment_received: { label: at.mod_paymentsReceived || "Alınan ödəniş",   cls: "opj-badge-sale"     },
      credit_note:      { label: at.mod_creditNotes || "Kredit notu",     cls: "opj-badge-creditnote"},
      expense:          { label: at.mod_expenses || "Xərc",            cls: "opj-badge-expense"  },
      bill:             { label: at.mod_bills || "Hesab-faktura",   cls: "opj-badge-purchase" },
      bank_in:          { label: at.hub_bankJournal + " - " + (at.col["Mədaxil"] || at.opt_bankIn || "Mədaxil"),    cls: "opj-badge-bankin"   },
      bank_out:         { label: at.hub_bankJournal + " - " + (at.col["Məxaric"] || at.opt_bankOut || "Məxaric"),    cls: "opj-badge-bankout"  },
    };

    function toggleExpand(id) {
      setOpJournalExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        return next;
      });
    }

    function expandAll() { setOpJournalExpanded(new Set(filtered.map((e) => e.id))); }
    function collapseAll() { setOpJournalExpanded(new Set()); }

    const TYPE_TABS = [
      { key: "all",      label: at.col["Hamısı"] || "Hamısı",   count: allEntries.length },
      { key: "manual",   label: at.opt_manual || "Əl ilə",   count: allEntries.filter((e) => e.type === "manual").length },
      { key: "sale",     label: at.mov_sale || "Satış",    count: allEntries.filter((e) => SALE_TYPES.has(e.type)).length },
      { key: "purchase", label: at.mov_purchase || "Alış",     count: allEntries.filter((e) => PURCHASE_TYPES.has(e.type)).length },
      { key: "bank",     label: at.nav.banking || "Bank",     count: allEntries.filter((e) => BANK_TYPES.has(e.type)).length },
    ];

    return (
      <section className="view active">
        {OVERVIEWS[activeSection]?.includes("operationsJournal") && (
          <div className="module-back-bar">
            <button className="bill-back-btn" type="button" onClick={() => setActiveModule(null)}>{at.back}</button>
          </div>
        )}

        {/* ── Başlıq ── */}
        <div className="opj-page-header">
          <div className="opj-page-title-block">
            <h2 className="opj-page-title">{at.mod_operationsJournal}</h2>
            <p className="opj-page-sub">{at.mod_operationsJournalSummary}</p>
          </div>
          <div className="opj-kpi-row">
            <div className="opj-kpi">
              <span className="opj-kpi-label">{at.listTotal || "Cəmi"} {at.unit_record}</span>
              <strong className="opj-kpi-value">{filtered.length}</strong>
            </div>
            <div className="opj-kpi opj-kpi-debit">
              <span className="opj-kpi-label">{at.col["Debet"] || "Debet"}</span>
              <strong className="opj-kpi-value">{currency(totalDebit, cur)}</strong>
            </div>
            <div className="opj-kpi opj-kpi-credit">
              <span className="opj-kpi-label">{at.col["Kredit"] || "Kredit"}</span>
              <strong className="opj-kpi-value">{currency(totalCredit, cur)}</strong>
            </div>
          </div>
        </div>

        {/* ── Filter paneli ── */}
        <div className="opj-filter-bar">
          <div className="opj-type-tabs">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`opj-tab-btn${opJournalFilter.type === tab.key ? " opj-tab-active" : ""}`}
                onClick={() => setOpJournalFilter((f) => ({ ...f, type: tab.key }))}
              >
                {tab.label}
                <span className="opj-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="opj-filter-right">
            <input
              className="search-input opj-search"
              placeholder={at.searchMj || "Jurnal axtar..."}
              value={opJournalFilter.search}
              onChange={(e) => setOpJournalFilter((f) => ({ ...f, search: e.target.value }))}
            />
            <input
              type="date"
              className="opj-date-input"
              title={at.col["Başlanğıc tarix"] || "Başlanğıc tarix"}
              value={opJournalFilter.dateFrom}
              onChange={(e) => setOpJournalFilter((f) => ({ ...f, dateFrom: e.target.value }))}
            />
            <span className="opj-date-sep">→</span>
            <input
              type="date"
              className="opj-date-input"
              title={at.col["Son tarix"] || "Son tarix"}
              value={opJournalFilter.dateTo}
              onChange={(e) => setOpJournalFilter((f) => ({ ...f, dateTo: e.target.value }))}
            />
            {(opJournalFilter.search || opJournalFilter.dateFrom || opJournalFilter.dateTo) && (
              <button
                type="button"
                className="ghost-btn opj-clear-btn"
                onClick={() => setOpJournalFilter((f) => ({ ...f, search: "", dateFrom: "", dateTo: "" }))}
              >
                ✕ {at.cancel || "Ləğv et"}
              </button>
            )}
          </div>
        </div>

        {/* ── Cədvəl ── */}
        <div className="panel opj-panel">
          {filtered.length === 0 ? (
            <div className="opj-empty">
              <div className="opj-empty-icon">📔</div>
              <p>{at.noMj || "Heç bir müxabirləşmə tapılmadı."}</p>
              <small>{at.noMjHint || "Filter şərtlərini dəyişin və ya yeni əməliyyat daxil edin."}</small>
            </div>
          ) : (
            <>
              <div className="opj-table-actions">
                <span className="opj-table-count">{filtered.length} {at.listShowing}</span>
                <div className="opj-expand-btns">
                  <button type="button" className="ghost-btn compact-btn" onClick={expandAll}>↓ {at.expandAll || "Hamısını aç"}</button>
                  <button type="button" className="ghost-btn compact-btn" onClick={collapseAll}>↑ {at.collapseAll || "Hamısını bağla"}</button>
                </div>
              </div>
              <div className="opj-table-wrap">
                <table className="opj-table">
                  <thead>
                    <tr>
                      <th className="opj-th-num">#</th>
                      <th className="opj-th-date">Tarix</th>
                      <th className="opj-th-type">Növ</th>
                      <th className="opj-th-ref">İstinad</th>
                      <th className="opj-th-accounts">Müxabirləşmə</th>
                      <th className="opj-th-amount opj-th-debit">Debet</th>
                      <th className="opj-th-amount opj-th-credit">Kredit</th>
                      <th className="opj-th-expand"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, idx) => {
                      const isExpanded = opJournalExpanded.has(entry.id);
                      const tc = TYPE_CONFIG[entry.type] || { label: entry.typeLabel, cls: "opj-badge-manual" };
                      const debitLines = entry.lines.filter((l) => l.debit > 0);
                      const creditLines = entry.lines.filter((l) => l.credit > 0);
                      const firstDebit = debitLines[0];
                      const firstCredit = creditLines[0];

                      return (
                        <Fragment key={entry.id}>
                          <tr
                            className={`opj-entry-row${isExpanded ? " opj-entry-expanded" : ""}`}
                            onClick={() => toggleExpand(entry.id)}
                          >
                            <td className="opj-td-num">{idx + 1}</td>
                            <td className="opj-td-date">{entry.date || "—"}</td>
                            <td className="opj-td-type">
                              <span className={`opj-badge ${tc.cls}`}>{tc.label}</span>
                            </td>
                            <td className="opj-td-ref">
                              <span className="opj-ref-main">{entry.reference}</span>
                              {entry.refNumber && entry.refNumber !== entry.reference && (
                                <span className="opj-ref-sub">{entry.refNumber}</span>
                              )}
                            </td>
                            <td className="opj-td-accounts">
                              {firstDebit && (
                                <div className="opj-account-line opj-account-debit">
                                  <span className="opj-account-code">{firstDebit.accountCode}</span>
                                  <span className="opj-account-name">{firstDebit.accountName}</span>
                                  {debitLines.length > 1 && <span className="opj-more-badge">+{debitLines.length - 1}</span>}
                                </div>
                              )}
                              {firstCredit && (
                                <div className="opj-account-line opj-account-credit">
                                  <span className="opj-account-code">{firstCredit.accountCode}</span>
                                  <span className="opj-account-name">{firstCredit.accountName}</span>
                                  {creditLines.length > 1 && <span className="opj-more-badge">+{creditLines.length - 1}</span>}
                                </div>
                              )}
                            </td>
                            <td className="opj-td-amount opj-td-debit">{currency(entry.totalDebit, cur)}</td>
                            <td className="opj-td-amount opj-td-credit">{currency(entry.totalCredit, cur)}</td>
                            <td className="opj-td-expand">
                              <span className={`opj-chevron${isExpanded ? " opj-chevron-open" : ""}`}>›</span>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="opj-detail-row">
                              <td colSpan="8" className="opj-detail-cell">
                                <div className="opj-detail-inner">
                                  <div className="opj-detail-lines">
                                    <div className="opj-detail-header">
                                      <span>Hesab kodu</span>
                                      <span>Hesab adı</span>
                                      <span className="opj-detail-debit-col">Debet</span>
                                      <span className="opj-detail-credit-col">Kredit</span>
                                    </div>
                                    {entry.lines.map((line, li) => (
                                      <div key={li} className={`opj-detail-line${line.debit > 0 ? " opj-dl-debit" : " opj-dl-credit"}`}>
                                        <span className="opj-detail-code">{line.accountCode}</span>
                                        <span className="opj-detail-name">{line.accountName}</span>
                                        <span className="opj-detail-debit-col">
                                          {line.debit > 0 ? currency(line.debit, cur) : ""}
                                        </span>
                                        <span className="opj-detail-credit-col">
                                          {line.credit > 0 ? currency(line.credit, cur) : ""}
                                        </span>
                                      </div>
                                    ))}
                                    <div className="opj-detail-totals">
                                      <span className="opj-detail-code"></span>
                                      <span className="opj-detail-name opj-detail-totals-label">Cəmi</span>
                                      <span className="opj-detail-debit-col opj-detail-total-val">{currency(entry.totalDebit, cur)}</span>
                                      <span className="opj-detail-credit-col opj-detail-total-val">{currency(entry.totalCredit, cur)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="opj-foot-row">
                      <td colSpan="5" className="opj-foot-label">Ümumi cəmi ({filtered.length} əməliyyat)</td>
                      <td className="opj-td-amount opj-td-debit opj-foot-amount">{currency(totalDebit, cur)}</td>
                      <td className="opj-td-amount opj-td-credit opj-foot-amount">{currency(totalCredit, cur)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  function renderOverview(section) {
    if (section === "reports") {
      const reportIcons = { trialBalance: "⚖️", accountCard: "📘", financialPositionReport: "📊", profitLossReport: "📈", cashFlowReport: "💰", equityChangesReport: "📋", receivables: "🟢", payables: "🔴" };
      return (
        <section className="view active">
          <div className="bill-hub">
            {OVERVIEWS.reports.map((moduleId) => (
              <div className="bill-hub-card" key={moduleId} onClick={() => setActiveModule(moduleId)}>
                <div className="bill-hub-icon">{reportIcons[moduleId] || "📄"}</div>
                <div className="bill-hub-info">
                  <h3>{MODULES[moduleId].title}</h3>
                  <p>{MODULES[moduleId].summary}</p>
                  <span className="bill-hub-count">{at.mod_openReport}</span>
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    const moduleIcons = {
      customers: "👥", invoices: "🧾", quotes: "📝",
      vendors: "🏭", goods: "📦", incomingGoodsServices: "📋",
      manualJournals: "📓", chartOfAccounts: "📊", operationsJournal: "📔",
      salesReceipts: "💳", paymentsReceived: "💰", creditNotes: "🔖",
    };
    const moduleCounts = {
      customers: state.customers?.length, invoices: state.invoices?.length,
      quotes: state.quotes?.length, vendors: state.vendors?.length,
      goods: (state.goods?.length || 0) + (state.items?.length || 0),
      incomingGoodsServices: state.incomingGoodsServices?.length,
      manualJournals: state.manualJournals?.length,
      chartOfAccounts: state.chartOfAccounts?.length,
      operationsJournal: (state.manualJournals?.length || 0) + (state.itemMovements?.length || 0) + (state.incomingGoodsServices?.length || 0),
      salesReceipts: state.salesReceipts?.length,
      paymentsReceived: state.paymentsReceived?.length,
      creditNotes: state.creditNotes?.length,
    };
    return (
      <section className="view active">
        <div className="bill-hub" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", maxWidth: "100%" }}>
          {OVERVIEWS[section].map((moduleId) => {
            const count = moduleCounts[moduleId];
            return (
              <div className="bill-hub-card" key={moduleId} onClick={() => setActiveModule(moduleId)}>
                <div className="bill-hub-icon">{moduleIcons[moduleId] || "📄"}</div>
                <div className="bill-hub-info">
                  <h3>{MODULES[moduleId].title}</h3>
                  <p>{MODULES[moduleId].summary}</p>
                  {count !== undefined && <span className="bill-hub-count">{count} {at.unit_record}</span>}
                </div>
                <span className="bill-hub-arrow">→</span>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  function renderInternalAdmin() {
    if (!currentUser) {
      async function handleInternalLogin(event) {
        event.preventDefault();
        setInternalGateError("");
        try {
          const email = String(authDraft.email || "").trim().toLowerCase();
          const response = await apiLogin(email, authDraft.password);
          const session = {
            accessToken: response?.tokens?.accessToken,
            refreshToken: response?.tokens?.refreshToken,
          };
          updateBackendSession(session);
          await syncBackendSubscription(session);
        } catch (error) {
          setInternalGateError(error?.message || "Giriş alınmadı. Yenidən yoxlayın.");
        }
      }
      return (
        <div className="internal-admin-gate">
          <div className="internal-admin-gate-box">
            <div className="brand-icon" style={{ width: 48, height: 48, margin: "0 auto 16px" }}>
              <img src={logoSrc} alt="Tetavio" className="app-logo" />
            </div>
            <h2>Tetavio Admin</h2>
            <form onSubmit={handleInternalLogin} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              <input
                type="email"
                placeholder="E-poçt"
                value={authDraft.email}
                onChange={(e) => setAuthDraft((c) => ({ ...c, email: e.target.value }))}
                className="internal-admin-input"
                required
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Şifrə"
                value={authDraft.password}
                onChange={(e) => setAuthDraft((c) => ({ ...c, password: e.target.value }))}
                className="internal-admin-input"
                required
                autoComplete="current-password"
              />
              {internalGateError && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{internalGateError}</p>}
              <button className="internal-admin-link-btn" type="submit">Daxil ol</button>
            </form>
          </div>
        </div>
      );
    }

    const isSuperAdmin = currentUser.role === "super_admin" || currentUser.role === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      return (
        <div className="internal-admin-gate">
          <div className="internal-admin-gate-box">
            <div className="internal-admin-403">403</div>
            <h2>Giriş qadağandır</h2>
            <p>Bu panelə daxil olmaq üçün icazəniz yoxdur.</p>
            <button className="internal-admin-link-btn" onClick={() => { window.location.href = "/dashboard"; }}>Əsas panelə qayıt</button>
          </div>
        </div>
      );
    }

    function fmtAZN(minor) {
      return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((minor || 0) / 100);
    }
    function fmtDate(dateStr) {
      if (!dateStr) return "—";
      try {
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr));
      } catch { return "—"; }
    }
    function pct(part, total) {
      if (!total) return "—";
      return `${Math.round((part / total) * 100)}%`;
    }

    const IAC_NAV = [
      { key: "overview",      label: "Overview",      icon: "⊞" },
      { key: "accounts",      label: "Accounts",      icon: "⊙" },
      { key: "finance",       label: "Finance",       icon: "₼" },
      { key: "subscriptions", label: "Subscriptions", icon: "★" },
      { key: "activity",      label: "Activity",      icon: "◑" },
      { key: "anomalies",     label: "Anomalies",     icon: "⚠" },
      { key: "system",        label: "System",        icon: "◈" },
      { key: "settings",      label: "Settings",      icon: "⚙" },
    ];

    function renderOverviewTab() {
      return (
        <>
          {adminOverviewLoading && (
            <div className="iac-state-msg">
              <span className="internal-admin-spinner" />
              Yüklənir...
            </div>
          )}
          {adminOverviewError && !adminOverviewLoading && (
            <div className="iac-state-err">{adminOverviewError}</div>
          )}
          {adminOverview && !adminOverviewLoading && (
            <>
              <div className="iac-section">
                <div className="iac-section-hd">
                  <span className="iac-dot iac-dot--growth" />
                  <span className="iac-section-lbl">Growth</span>
                </div>
                <div className="iac-kpi-row">
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Total Users</span>
                    <strong className="iac-kpi-val">{adminOverview.totalUsers}</strong>
                    <span className="iac-kpi-sub">all registered users</span>
                  </div>
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Total Accounts</span>
                    <strong className="iac-kpi-val">{adminOverview.totalAccounts}</strong>
                    <span className="iac-kpi-sub">unique accounts</span>
                  </div>
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Active Users</span>
                    <strong className="iac-kpi-val">{adminOverview.activeUsers}</strong>
                    <span className="iac-kpi-sub">{pct(adminOverview.activeUsers, adminOverview.totalUsers)} of total</span>
                  </div>
                </div>
              </div>

              <div className="iac-section">
                <div className="iac-section-hd">
                  <span className="iac-dot iac-dot--revenue" />
                  <span className="iac-section-lbl">Revenue</span>
                </div>
                <div className="iac-kpi-row">
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Free Accounts</span>
                    <strong className="iac-kpi-val">{adminOverview.freeAccounts}</strong>
                    <span className="iac-kpi-sub">{pct(adminOverview.freeAccounts, adminOverview.totalAccounts)} of accounts</span>
                  </div>
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Paid Accounts</span>
                    <strong className="iac-kpi-val">{adminOverview.paidAccounts}</strong>
                    <span className="iac-kpi-sub">active paid plans</span>
                  </div>
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Invoice Revenue</span>
                    <strong className="iac-kpi-val iac-kpi-val--sm">{fmtAZN(adminOverview.totalInvoiceValueMinor)} ₼</strong>
                    <span className="iac-kpi-sub">all time · {adminOverview.currency}</span>
                  </div>
                </div>
              </div>

              <div className="iac-section">
                <div className="iac-section-hd">
                  <span className="iac-dot iac-dot--usage" />
                  <span className="iac-section-lbl">Platform Usage</span>
                </div>
                <div className="iac-kpi-row">
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Customers</span>
                    <strong className="iac-kpi-val">{adminOverview.totalCustomers}</strong>
                    <span className="iac-kpi-sub">across all accounts</span>
                  </div>
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Vendors</span>
                    <strong className="iac-kpi-val">{adminOverview.totalVendors}</strong>
                    <span className="iac-kpi-sub">across all accounts</span>
                  </div>
                  <div className="iac-kpi-card">
                    <span className="iac-kpi-lbl">Invoices</span>
                    <strong className="iac-kpi-val">{adminOverview.totalInvoices}</strong>
                    <span className="iac-kpi-sub">total issued</span>
                  </div>
                </div>
              </div>

              <div className="iac-preview-pair">
                <div className="iac-preview-card">
                  <div className="iac-preview-hd">
                    <span className="iac-dot iac-dot--revenue" />
                    <span className="iac-preview-title">Finance Summary</span>
                    <span className="iac-badge iac-badge--ro">Read-only</span>
                  </div>
                  <dl className="iac-preview-dl">
                    <div className="iac-preview-item">
                      <dt>Invoice Revenue</dt>
                      <dd>{fmtAZN(adminOverview.totalInvoiceValueMinor)} ₼</dd>
                    </div>
                    <div className="iac-preview-item">
                      <dt>Paid Accounts</dt>
                      <dd>{adminOverview.paidAccounts}</dd>
                    </div>
                    <div className="iac-preview-item">
                      <dt>Free Accounts</dt>
                      <dd>{adminOverview.freeAccounts}</dd>
                    </div>
                    <div className="iac-preview-item">
                      <dt>Paid Conversion</dt>
                      <dd>{pct(adminOverview.paidAccounts, adminOverview.totalAccounts)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="iac-preview-card">
                  <div className="iac-preview-hd">
                    <span className="iac-dot iac-dot--growth" />
                    <span className="iac-preview-title">Account Overview</span>
                    <span className="iac-badge iac-badge--ro">Read-only</span>
                  </div>
                  <dl className="iac-preview-dl">
                    <div className="iac-preview-item">
                      <dt>Total Accounts</dt>
                      <dd>{adminOverview.totalAccounts}</dd>
                    </div>
                    <div className="iac-preview-item">
                      <dt>Recent Signups</dt>
                      <dd>{adminOverview.recentSignups?.length ?? 0}</dd>
                    </div>
                  </dl>
                  <p className="iac-preview-note">Full account management will be added in Phase 3B</p>
                </div>
              </div>

              <div className="iac-section">
                <div className="iac-section-hd">
                  <span className="iac-dot iac-dot--signups" />
                  <span className="iac-section-lbl">Recent Signups</span>
                </div>
                {adminOverview.recentSignups?.length > 0 ? (
                  <div className="internal-admin-table-wrap">
                    <table className="internal-admin-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Owner Email</th>
                          <th>Plan</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOverview.recentSignups.map((s) => (
                          <tr key={s.accountId}>
                            <td>{s.accountName}</td>
                            <td>{s.ownerEmail ?? "—"}</td>
                            <td><code>{s.planCode ?? "—"}</code></td>
                            <td>{fmtDate(s.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="internal-admin-empty">Hələ heç bir qeydiyyat yoxdur.</div>
                )}
              </div>
            </>
          )}
        </>
      );
    }

    function renderAccountsTab() {
      function handleAccountsSearch(e) {
        e.preventDefault();
        setAdminAccountsPage(1);
        setAdminAccountsSearch(adminAccountsSearchInput);
      }
      return (
        <>
          <div className="iac-section-hd" style={{ marginBottom: 16 }}>
            <span className="iac-dot iac-dot--growth" />
            <span className="iac-section-lbl">All Accounts</span>
            {adminAccountsMeta && (
              <span className="iac-meta-count">{adminAccountsMeta.total} total</span>
            )}
          </div>

          <form className="iac-search-bar" onSubmit={handleAccountsSearch}>
            <input
              type="text"
              className="iac-search-input"
              placeholder="Search by name or email…"
              value={adminAccountsSearchInput}
              onChange={(e) => setAdminAccountsSearchInput(e.target.value)}
            />
            <button type="submit" className="iac-search-btn">Search</button>
            {adminAccountsSearch && (
              <button
                type="button"
                className="iac-search-clear"
                onClick={() => {
                  setAdminAccountsSearchInput("");
                  setAdminAccountsSearch("");
                  setAdminAccountsPage(1);
                }}
              >
                Clear
              </button>
            )}
          </form>

          {adminAccountsLoading && (
            <div className="iac-state-msg">
              <span className="internal-admin-spinner" /> Yüklənir...
            </div>
          )}
          {adminAccountsError && !adminAccountsLoading && (
            <div className="iac-state-err">{adminAccountsError}</div>
          )}

          {!adminAccountsLoading && !adminAccountsError && adminAccountsData.length === 0 && (
            <div className="iac-coming-soon">
              <div className="iac-cs-title">No Accounts Found</div>
              <div className="iac-cs-sub">
                {adminAccountsSearch ? `No results for "${adminAccountsSearch}"` : "No accounts have been created yet."}
              </div>
            </div>
          )}

          {!adminAccountsLoading && adminAccountsData.length > 0 && (
            <>
              <div className="internal-admin-table-wrap">
                <table className="internal-admin-table iac-accounts-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Owner Email</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Users</th>
                      <th>Customers</th>
                      <th>Vendors</th>
                      <th>Invoices</th>
                      <th>Revenue</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminAccountsData.map((acc) => (
                      <tr key={acc.id}>
                        <td className="iac-acc-name">{acc.name}</td>
                        <td>{acc.ownerEmail ?? "—"}</td>
                        <td>
                          <span className="iac-plan-badge">{acc.planCode ?? "—"}</span>
                        </td>
                        <td>
                          <span className={"iac-status-badge iac-status-badge--" + (acc.subscriptionStatus?.toLowerCase() ?? "none")}>
                            {acc.subscriptionStatus ?? "—"}
                          </span>
                        </td>
                        <td className="iac-num">{acc.userCount}</td>
                        <td className="iac-num">{acc.customerCount}</td>
                        <td className="iac-num">{acc.vendorCount}</td>
                        <td className="iac-num">{acc.invoiceCount}</td>
                        <td className="iac-num">{fmtAZN(acc.invoiceTotalMinor)} ₼</td>
                        <td>{fmtDate(acc.createdAt)}</td>
                        <td>
                          <button
                            className="iac-view-btn"
                            onClick={() => setAdminAccountDetailId(acc.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {adminAccountsMeta && adminAccountsMeta.pageCount > 1 && (
                <div className="iac-pagination">
                  <button
                    className="iac-page-btn"
                    disabled={adminAccountsPage <= 1}
                    onClick={() => setAdminAccountsPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="iac-page-info">
                    Page {adminAccountsMeta.page} of {adminAccountsMeta.pageCount}
                    <span className="iac-page-total"> · {adminAccountsMeta.total} accounts</span>
                  </span>
                  <button
                    className="iac-page-btn"
                    disabled={adminAccountsPage >= adminAccountsMeta.pageCount}
                    onClick={() => setAdminAccountsPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      );
    }

    function renderFinanceTab() {
      if (adminFinanceLoading) {
        return (
          <div className="iac-state-msg">
            <span className="internal-admin-spinner" /> Yüklənir...
          </div>
        );
      }
      if (adminFinanceError) {
        return <div className="iac-state-err">{adminFinanceError}</div>;
      }
      if (!adminFinanceData) return null;

      const fd = adminFinanceData;
      const maxPlanCount = fd.planDistribution.length > 0
        ? Math.max(...fd.planDistribution.map((p) => p.accountCount))
        : 1;

      return (
        <>
          <div className="iac-section">
            <div className="iac-section-hd">
              <span className="iac-dot iac-dot--revenue" />
              <span className="iac-section-lbl">Revenue Overview</span>
            </div>
            <div className="iac-kpi-row">
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl">Total Revenue</span>
                <strong className="iac-kpi-val iac-kpi-val--sm">{fmtAZN(fd.totalInvoiceValueMinor)} ₼</strong>
                <span className="iac-kpi-sub">all-time · {fd.currency}</span>
              </div>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl">Total Invoices</span>
                <strong className="iac-kpi-val">{fd.totalInvoices}</strong>
                <span className="iac-kpi-sub">non-deleted invoices</span>
              </div>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl">Avg Invoice Value</span>
                <strong className="iac-kpi-val iac-kpi-val--sm">{fmtAZN(fd.averageInvoiceValueMinor)} ₼</strong>
                <span className="iac-kpi-sub">per invoice</span>
              </div>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl">Paid Conversion</span>
                <strong className="iac-kpi-val">{fd.paidConversionRate}%</strong>
                <span className="iac-kpi-sub">{fd.paidAccounts} paid · {fd.freeAccounts} free</span>
              </div>
            </div>
          </div>

          <div className="iac-preview-pair">
            <div className="iac-preview-card">
              <div className="iac-preview-hd">
                <span className="iac-dot iac-dot--revenue" />
                <span className="iac-preview-title">Plan Distribution</span>
                <span className="iac-badge iac-badge--ro">Read-only</span>
              </div>
              {fd.planDistribution.length === 0 ? (
                <div className="iac-fin-empty">No plan data yet.</div>
              ) : (
                <div className="iac-plan-dist">
                  {fd.planDistribution.map((p) => (
                    <div key={p.planCode} className="iac-plan-row">
                      <span className="iac-plan-badge">{p.planCode}</span>
                      <div className="iac-plan-bar-wrap">
                        <div
                          className="iac-plan-bar"
                          style={{ width: `${Math.round((p.accountCount / maxPlanCount) * 100)}%` }}
                        />
                      </div>
                      <span className="iac-plan-count">{p.accountCount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="iac-preview-card">
              <div className="iac-preview-hd">
                <span className="iac-dot iac-dot--growth" />
                <span className="iac-preview-title">Account Metrics</span>
                <span className="iac-badge iac-badge--ro">Read-only</span>
              </div>
              <dl className="iac-preview-dl">
                <div className="iac-preview-item">
                  <dt>Total Accounts</dt>
                  <dd>{fd.totalAccounts}</dd>
                </div>
                <div className="iac-preview-item">
                  <dt>Paid Accounts</dt>
                  <dd>{fd.paidAccounts}</dd>
                </div>
                <div className="iac-preview-item">
                  <dt>Free Accounts</dt>
                  <dd>{fd.freeAccounts}</dd>
                </div>
                <div className="iac-preview-item">
                  <dt>Paid Conversion</dt>
                  <dd>{fd.paidConversionRate}%</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="iac-section">
            <div className="iac-section-hd">
              <span className="iac-dot iac-dot--signups" />
              <span className="iac-section-lbl">Top Accounts by Revenue</span>
            </div>
            {fd.topAccountsByRevenue.length === 0 ? (
              <div className="internal-admin-empty">Hələ heç bir invoice yoxdur.</div>
            ) : (
              <div className="internal-admin-table-wrap">
                <table className="internal-admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Account</th>
                      <th>Owner Email</th>
                      <th>Plan</th>
                      <th>Invoices</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fd.topAccountsByRevenue.map((acc, idx) => (
                      <tr key={acc.accountId}>
                        <td className="iac-num" style={{ color: "#94a3b8", width: 32 }}>{idx + 1}</td>
                        <td className="iac-acc-name">{acc.accountName}</td>
                        <td>{acc.ownerEmail ?? "—"}</td>
                        <td><span className="iac-plan-badge">{acc.planCode ?? "—"}</span></td>
                        <td className="iac-num">{acc.invoiceCount}</td>
                        <td className="iac-num">{fmtAZN(acc.invoiceTotalMinor)} ₼</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      );
    }

    function renderSubscriptionsTab() {
      function handleSubsSearch(e) {
        e.preventDefault();
        setAdminSubsPage(1);
        setAdminSubsSearch(adminSubsSearchInput);
        setAdminSubsStatus(adminSubsStatusInput);
      }
      function handleSubsClear() {
        setAdminSubsSearchInput("");
        setAdminSubsStatusInput("");
        setAdminSubsSearch("");
        setAdminSubsStatus("");
        setAdminSubsPage(1);
      }
      const hasFilter = adminSubsSearch || adminSubsStatus;

      return (
        <>
          {adminSubsSummary && (
            <div className="iac-section">
              <div className="iac-section-hd">
                <span className="iac-dot iac-dot--usage" />
                <span className="iac-section-lbl">Subscription Summary</span>
              </div>
              <div className="iac-kpi-row">
                <div className="iac-kpi-card">
                  <span className="iac-kpi-lbl">Total Accounts</span>
                  <strong className="iac-kpi-val">{adminSubsSummary.totalAccounts}</strong>
                  <span className="iac-kpi-sub">excluding super admin</span>
                </div>
                <div className="iac-kpi-card">
                  <span className="iac-kpi-lbl">Free Accounts</span>
                  <strong className="iac-kpi-val">{adminSubsSummary.freeAccounts}</strong>
                  <span className="iac-kpi-sub">on free plan</span>
                </div>
                <div className="iac-kpi-card">
                  <span className="iac-kpi-lbl">Paid Accounts</span>
                  <strong className="iac-kpi-val">{adminSubsSummary.paidAccounts}</strong>
                  <span className="iac-kpi-sub">active paid plan</span>
                </div>
                <div className="iac-kpi-card">
                  <span className="iac-kpi-lbl">Active Subs</span>
                  <strong className="iac-kpi-val" style={{ color: "#15803d" }}>{adminSubsSummary.activeSubscriptions}</strong>
                  <span className="iac-kpi-sub">currently active</span>
                </div>
                <div className="iac-kpi-card">
                  <span className="iac-kpi-lbl">Expired Subs</span>
                  <strong className="iac-kpi-val" style={{ color: "#64748b" }}>{adminSubsSummary.expiredSubscriptions}</strong>
                  <span className="iac-kpi-sub">expired</span>
                </div>
                <div className="iac-kpi-card">
                  <span className="iac-kpi-lbl">Canceled Subs</span>
                  <strong className="iac-kpi-val" style={{ color: "#b91c1c" }}>{adminSubsSummary.canceledSubscriptions}</strong>
                  <span className="iac-kpi-sub">canceled</span>
                </div>
              </div>
            </div>
          )}

          <div className="iac-section-hd" style={{ marginBottom: 16 }}>
            <span className="iac-dot iac-dot--signups" />
            <span className="iac-section-lbl">All Subscriptions</span>
            {adminSubsMeta && (
              <span className="iac-meta-count">{adminSubsMeta.total} total</span>
            )}
          </div>

          <form className="iac-search-bar" onSubmit={handleSubsSearch}>
            <input
              type="text"
              className="iac-search-input"
              placeholder="Search by name or email…"
              value={adminSubsSearchInput}
              onChange={(e) => setAdminSubsSearchInput(e.target.value)}
            />
            <select
              className="iac-filter-select"
              value={adminSubsStatusInput}
              onChange={(e) => setAdminSubsStatusInput(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="FREE">Free</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELED">Canceled</option>
            </select>
            <button type="submit" className="iac-search-btn">Apply</button>
            {hasFilter && (
              <button type="button" className="iac-search-clear" onClick={handleSubsClear}>Clear</button>
            )}
          </form>

          {adminSubsLoading && (
            <div className="iac-state-msg">
              <span className="internal-admin-spinner" /> Yüklənir...
            </div>
          )}
          {adminSubsError && !adminSubsLoading && (
            <div className="iac-state-err">{adminSubsError}</div>
          )}

          {!adminSubsLoading && !adminSubsError && adminSubsData.length === 0 && (
            <div className="iac-coming-soon">
              <div className="iac-cs-title">No Results Found</div>
              <div className="iac-cs-sub">
                {hasFilter ? "No accounts match the current filters." : "No accounts have been created yet."}
              </div>
            </div>
          )}

          {!adminSubsLoading && adminSubsData.length > 0 && (
            <>
              <div className="internal-admin-table-wrap">
                <table className="internal-admin-table iac-accounts-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Owner Email</th>
                      <th>Plan</th>
                      <th>Interval</th>
                      <th>Status</th>
                      <th>Period End</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminSubsData.map((row) => (
                      <tr key={row.accountId}>
                        <td className="iac-acc-name">{row.accountName}</td>
                        <td>{row.ownerEmail ?? "—"}</td>
                        <td><span className="iac-plan-badge">{row.planCode}</span></td>
                        <td>
                          {row.planInterval ? (
                            <span className="iac-interval-badge">{row.planInterval}</span>
                          ) : "—"}
                        </td>
                        <td>
                          <span className={"iac-status-badge iac-status-badge--" + row.subscriptionStatus.toLowerCase()}>
                            {row.subscriptionStatus}
                          </span>
                        </td>
                        <td>{row.currentPeriodEnd ? fmtDate(row.currentPeriodEnd) : "—"}</td>
                        <td>{fmtDate(row.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {adminSubsMeta && adminSubsMeta.pageCount > 1 && (
                <div className="iac-pagination">
                  <button
                    className="iac-page-btn"
                    disabled={adminSubsPage <= 1}
                    onClick={() => setAdminSubsPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="iac-page-info">
                    Page {adminSubsMeta.page} of {adminSubsMeta.pageCount}
                    <span className="iac-page-total"> · {adminSubsMeta.total} accounts</span>
                  </span>
                  <button
                    className="iac-page-btn"
                    disabled={adminSubsPage >= adminSubsMeta.pageCount}
                    onClick={() => setAdminSubsPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      );
    }

    function renderActivityTab() {
      const TYPE_OPTIONS = [
        { value: "", label: "All types" },
        { value: "ACCOUNT",  label: "Accounts" },
        { value: "USER",     label: "Users" },
        { value: "INVOICE",  label: "Invoices" },
        { value: "CUSTOMER", label: "Customers" },
        { value: "VENDOR",   label: "Vendors" },
      ];
      function handleActivityApply(e) {
        e.preventDefault();
        setAdminActivityPage(1);
        setAdminActivitySearch(adminActivitySearchInput);
        setAdminActivityType(adminActivityTypeInput);
      }
      function handleActivityClear() {
        setAdminActivitySearchInput("");
        setAdminActivityTypeInput("");
        setAdminActivitySearch("");
        setAdminActivityType("");
        setAdminActivityPage(1);
      }
      const hasFilter = adminActivitySearch || adminActivityType;

      return (
        <>
          <div className="iac-section-hd" style={{ marginBottom: 16 }}>
            <span className="iac-dot iac-dot--signups" />
            <span className="iac-section-lbl">Platform Activity</span>
            {adminActivityPagination && (
              <span className="iac-meta-count">{adminActivityPagination.total} total</span>
            )}
          </div>

          <form className="iac-search-bar" onSubmit={handleActivityApply}>
            <input
              type="text"
              className="iac-search-input"
              placeholder="Search…"
              value={adminActivitySearchInput}
              onChange={(e) => setAdminActivitySearchInput(e.target.value)}
            />
            <select
              className="iac-filter-select"
              value={adminActivityTypeInput}
              onChange={(e) => setAdminActivityTypeInput(e.target.value)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button type="submit" className="iac-search-btn">Apply</button>
            {hasFilter && (
              <button type="button" className="iac-search-clear" onClick={handleActivityClear}>Clear</button>
            )}
          </form>

          {adminActivityLoading && (
            <div className="iac-state-msg">
              <span className="internal-admin-spinner" /> Yüklənir...
            </div>
          )}
          {adminActivityError && !adminActivityLoading && (
            <div className="iac-state-err">{adminActivityError}</div>
          )}

          {!adminActivityLoading && !adminActivityError && adminActivityItems.length === 0 && (
            <div className="iac-coming-soon">
              <div className="iac-cs-title">No Activity Found</div>
              <div className="iac-cs-sub">
                {hasFilter ? "No results match the current filters." : "No activity recorded yet."}
              </div>
            </div>
          )}

          {!adminActivityLoading && adminActivityItems.length > 0 && (
            <>
              <div className="internal-admin-table-wrap">
                <table className="internal-admin-table iac-accounts-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Activity</th>
                      <th>Account</th>
                      <th>Email</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminActivityItems.map((item) => (
                      <tr key={item.type + "-" + item.id}>
                        <td>
                          <span className={"iac-activity-badge iac-activity-badge--" + item.type.toLowerCase()}>
                            {item.type}
                          </span>
                        </td>
                        <td>
                          <div className="iac-acc-name" style={{ fontWeight: 500 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{item.subtitle}</div>
                        </td>
                        <td>{item.accountName ?? "—"}</td>
                        <td>{item.userEmail ?? "—"}</td>
                        <td>{fmtDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {adminActivityPagination && adminActivityPagination.totalPages > 1 && (
                <div className="iac-pagination">
                  <button
                    className="iac-page-btn"
                    disabled={adminActivityPage <= 1}
                    onClick={() => setAdminActivityPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="iac-page-info">
                    Page {adminActivityPagination.page} of {adminActivityPagination.totalPages}
                    <span className="iac-page-total"> · {adminActivityPagination.total} events</span>
                  </span>
                  <button
                    className="iac-page-btn"
                    disabled={adminActivityPage >= adminActivityPagination.totalPages}
                    onClick={() => setAdminActivityPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      );
    }

    function renderSystemHealthTab() {
      function fmtUptime(seconds) {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);
        return parts.join(" ");
      }

      if (adminSystemHealthLoading) {
        return <div className="iac-state-msg"><span className="internal-admin-spinner" /> Yüklənir...</div>;
      }
      if (adminSystemHealthError) {
        return <div className="iac-state-err">{adminSystemHealthError}</div>;
      }
      if (!adminSystemHealth) return null;

      const sh = adminSystemHealth;
      const dbOk = sh.database?.status === "connected";
      const apiOk = sh.api?.status === "ok";

      return (
        <>
          <div className="iac-section-hd" style={{ marginBottom: 20 }}>
            <span className="iac-dot iac-dot--usage" />
            <span className="iac-section-lbl">System Health</span>
            <span className={"iac-health-badge " + (dbOk && apiOk ? "iac-health-badge--ok" : "iac-health-badge--warn")}>
              {dbOk && apiOk ? "All systems operational" : "Degraded"}
            </span>
          </div>

          <div className="iac-health-grid">
            <div className="iac-health-card">
              <span className="iac-kpi-lbl">Uptime</span>
              <strong className="iac-kpi-val iac-kpi-val--sm">{fmtUptime(sh.uptimeSeconds)}</strong>
              <span className="iac-kpi-sub">{sh.uptimeSeconds} seconds</span>
            </div>
            <div className="iac-health-card">
              <span className="iac-kpi-lbl">Server Time</span>
              <strong className="iac-kpi-val iac-kpi-val--sm">
                {sh.serverTime ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(sh.serverTime)) : "—"}
              </strong>
              <span className="iac-kpi-sub">
                {sh.serverTime ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(sh.serverTime)) : "—"}
              </span>
            </div>
            <div className="iac-health-card">
              <span className="iac-kpi-lbl">Environment</span>
              <strong className="iac-kpi-val iac-kpi-val--sm" style={{ textTransform: "capitalize" }}>{sh.environment}</strong>
              <span className="iac-kpi-sub">NODE_ENV</span>
            </div>
            <div className="iac-health-card">
              <span className="iac-kpi-lbl">Database</span>
              <strong className="iac-kpi-val iac-kpi-val--sm" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={"iac-status-dot " + (dbOk ? "iac-status-dot--ok" : "iac-status-dot--err")} />
                {sh.database?.status ?? "—"}
              </strong>
              <span className="iac-kpi-sub">PostgreSQL</span>
            </div>
            <div className="iac-health-card">
              <span className="iac-kpi-lbl">API</span>
              <strong className="iac-kpi-val iac-kpi-val--sm" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={"iac-status-dot " + (apiOk ? "iac-status-dot--ok" : "iac-status-dot--err")} />
                {sh.api?.status ?? "—"}
              </strong>
              <span className="iac-kpi-sub">NestJS REST API</span>
            </div>
          </div>
        </>
      );
    }

    function renderAnomaliesTab() {
      const SEVERITY_OPTIONS = [
        { value: "", label: "All severities" },
        { value: "HIGH",   label: "High" },
        { value: "MEDIUM", label: "Medium" },
        { value: "LOW",    label: "Low" },
      ];
      const TYPE_OPTIONS = [
        { value: "", label: "All types" },
        { value: "INACTIVE_ACCOUNT",         label: "Inactive Account" },
        { value: "HIGH_INVOICE_VOLUME",      label: "High Invoice Volume" },
        { value: "EXPIRED_PAID_SUBSCRIPTION", label: "Expired Subscription" },
        { value: "TRIAL_OR_FREE_WITH_USAGE", label: "Free with Usage" },
        { value: "NO_OWNER",                 label: "No Owner" },
      ];
      const SEV_COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#6366f1" };
      const hasFilter = adminAnomaliesSearch || adminAnomaliesSeverity || adminAnomaliesType;

      function handleApply(e) {
        e.preventDefault();
        setAdminAnomaliesPage(1);
        setAdminAnomaliesSearch(adminAnomaliesSearchInput);
        setAdminAnomaliesSeverity(adminAnomaliesSeverityInput);
        setAdminAnomaliesType(adminAnomaliesTypeInput);
      }
      function handleClear() {
        setAdminAnomaliesSearchInput("");
        setAdminAnomaliesSeverityInput("");
        setAdminAnomaliesTypeInput("");
        setAdminAnomaliesSearch("");
        setAdminAnomaliesSeverity("");
        setAdminAnomaliesType("");
        setAdminAnomaliesPage(1);
      }

      const s = adminAnomaliesData?.summary;
      const items = adminAnomaliesData?.items ?? [];
      const meta = adminAnomaliesData?.meta;

      return (
        <>
          <div className="iac-section-hd" style={{ marginBottom: 16 }}>
            <span className="iac-dot" style={{ background: "#ef4444" }} />
            <span className="iac-section-lbl">Anomaly Detection</span>
            {s && <span className="iac-meta-count">{s.totalAnomalies} total</span>}
          </div>

          {s && (
            <div className="iac-kpi-row" style={{ marginBottom: 20 }}>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl">Total</span>
                <strong className="iac-kpi-val">{s.totalAnomalies}</strong>
                <span className="iac-kpi-sub">anomalies</span>
              </div>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl" style={{ color: "#ef4444" }}>High</span>
                <strong className="iac-kpi-val" style={{ color: "#ef4444" }}>{s.high}</strong>
              </div>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl" style={{ color: "#f59e0b" }}>Medium</span>
                <strong className="iac-kpi-val" style={{ color: "#f59e0b" }}>{s.medium}</strong>
              </div>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl" style={{ color: "#6366f1" }}>Low</span>
                <strong className="iac-kpi-val" style={{ color: "#6366f1" }}>{s.low}</strong>
              </div>
              <div className="iac-kpi-card">
                <span className="iac-kpi-lbl">Affected</span>
                <strong className="iac-kpi-val">{s.accountsAffected}</strong>
                <span className="iac-kpi-sub">accounts</span>
              </div>
            </div>
          )}

          <form className="iac-search-bar" onSubmit={handleApply}>
            <input
              type="text"
              className="iac-search-input"
              placeholder="Search by account or type…"
              value={adminAnomaliesSearchInput}
              onChange={(e) => setAdminAnomaliesSearchInput(e.target.value)}
            />
            <select
              className="iac-filter-select"
              value={adminAnomaliesSeverityInput}
              onChange={(e) => setAdminAnomaliesSeverityInput(e.target.value)}
            >
              {SEVERITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              className="iac-filter-select"
              value={adminAnomaliesTypeInput}
              onChange={(e) => setAdminAnomaliesTypeInput(e.target.value)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button type="submit" className="iac-search-btn">Apply</button>
            {hasFilter && (
              <button type="button" className="iac-search-clear" onClick={handleClear}>Clear</button>
            )}
          </form>

          {adminAnomaliesLoading && (
            <div className="iac-state-msg"><span className="internal-admin-spinner" /> Yüklənir...</div>
          )}
          {adminAnomaliesError && !adminAnomaliesLoading && (
            <div className="iac-state-err">{adminAnomaliesError}</div>
          )}

          {!adminAnomaliesLoading && !adminAnomaliesError && items.length === 0 && (
            <div className="iac-coming-soon">
              <div className="iac-cs-title">{hasFilter ? "No Anomalies Match" : "No Anomalies Detected"}</div>
              <div className="iac-cs-sub">
                {hasFilter ? "Try adjusting your filters." : "All accounts look healthy."}
              </div>
            </div>
          )}

          {!adminAnomaliesLoading && items.length > 0 && (
            <>
              <div className="internal-admin-table-wrap">
                <table className="internal-admin-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Type</th>
                      <th>Account</th>
                      <th>Description</th>
                      <th>Detected At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <Fragment key={item.id}>
                        <tr>
                          <td>
                            <span className="iac-anomaly-sev" style={{ color: SEV_COLORS[item.severity] ?? "#94a3b8" }}>
                              {item.severity}
                            </span>
                          </td>
                          <td>
                            <span className="iac-anomaly-type">{item.type.replace(/_/g, " ")}</span>
                          </td>
                          <td className="iac-acc-name">{item.accountName}</td>
                          <td style={{ color: "#94a3b8", fontSize: 13 }}>{item.description}</td>
                          <td>{fmtDate(item.detectedAt)}</td>
                          <td>
                            {item.reviewed ? (
                              <span style={{ color: "#10b981", fontWeight: 600, fontSize: 12 }}>
                                ✓ Reviewed
                                {item.reviewedAt && (
                                  <span style={{ display: "block", color: "#64748b", fontWeight: 400, fontSize: 11 }}>
                                    {fmtDate(item.reviewedAt)}
                                  </span>
                                )}
                              </span>
                            ) : adminReviewingId === item.id ? (
                              <button
                                className="iac-btn-sm iac-btn-ghost"
                                onClick={() => { setAdminReviewingId(null); setAdminReviewNote(""); setAdminReviewFeedback(null); }}
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                className="iac-btn-sm iac-btn-primary"
                                onClick={() => { setAdminReviewingId(item.id); setAdminReviewNote(""); setAdminReviewFeedback(null); }}
                              >
                                Mark Reviewed
                              </button>
                            )}
                          </td>
                        </tr>
                        {adminReviewingId === item.id && (
                          <tr>
                            <td colSpan={6} style={{ background: "#0f172a", padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
                                <textarea
                                  rows={2}
                                  placeholder="Optional review note…"
                                  value={adminReviewNote}
                                  onChange={(e) => setAdminReviewNote(e.target.value)}
                                  style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 13, resize: "vertical" }}
                                />
                                {adminReviewFeedback && (
                                  <span style={{ fontSize: 12, color: adminReviewFeedback.ok ? "#10b981" : "#ef4444" }}>
                                    {adminReviewFeedback.msg}
                                  </span>
                                )}
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    className="iac-btn-sm iac-btn-primary"
                                    disabled={adminReviewLoading}
                                    onClick={async () => {
                                      setAdminReviewLoading(true);
                                      setAdminReviewFeedback(null);
                                      try {
                                        await apiAdminReviewAnomaly(
                                          { accountId: item.accountId, anomalyType: item.type, note: adminReviewNote || undefined },
                                          onSessionUpdate,
                                        );
                                        setAdminReviewingId(null);
                                        setAdminReviewNote("");
                                        setAdminAnomaliesKey((k) => k + 1);
                                      } catch (err) {
                                        setAdminReviewFeedback({ ok: false, msg: err.message || "Failed to save review." });
                                      } finally {
                                        setAdminReviewLoading(false);
                                      }
                                    }}
                                  >
                                    {adminReviewLoading ? "Saving…" : "Confirm Review"}
                                  </button>
                                  <button
                                    className="iac-btn-sm iac-btn-ghost"
                                    disabled={adminReviewLoading}
                                    onClick={() => { setAdminReviewingId(null); setAdminReviewNote(""); setAdminReviewFeedback(null); }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {meta && meta.pageCount > 1 && (
                <div className="iac-pagination">
                  <button
                    className="iac-page-btn"
                    disabled={adminAnomaliesPage <= 1}
                    onClick={() => setAdminAnomaliesPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="iac-page-info">
                    Page {meta.page} of {meta.pageCount}
                    <span className="iac-page-total"> · {meta.total} anomalies</span>
                  </span>
                  <button
                    className="iac-page-btn"
                    disabled={adminAnomaliesPage >= meta.pageCount}
                    onClick={() => setAdminAnomaliesPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      );
    }

    function renderComingSoonTab(tab) {
      const LABELS = { settings: "Settings" };
      return (
        <div className="iac-coming-soon">
          <div className="iac-cs-title">{LABELS[tab] || tab}</div>
          <div className="iac-cs-sub">This section will be available in a future phase.</div>
          <span className="iac-badge iac-badge--phase">Phase 3B+</span>
        </div>
      );
    }

    function renderAccountDeepView() {
      if (!adminAccountDetailId) return null;
      const d = adminAccountDetail;
      const ACTIVITY_COLORS = { INVOICE: "#6366f1", CUSTOMER: "#10b981", VENDOR: "#f59e0b", USER: "#3b82f6" };
      const ACTION_COLORS = { ADD_NOTE: "#6366f1", FLAG_ACCOUNT: "#ef4444", UNFLAG_ACCOUNT: "#10b981", REVIEW_ANOMALY: "#f59e0b" };

      function handleClose() {
        setAdminAccountDetailId(null);
        setAdminAccountDetail(null);
        setAdminNoteInput("");
        setAdminNoteFeedback(null);
        setAdminFlagInput("");
        setAdminFlagFeedback(null);
        setAdminUnflagInput("");
        setAdminUnflagFeedback(null);
      }

      function handleAddNote(e) {
        e.preventDefault();
        if (!adminNoteInput.trim()) return;
        setAdminNoteLoading(true);
        setAdminNoteFeedback(null);
        apiAddAdminNote(adminAccountDetailId, { note: adminNoteInput }, updateBackendSession)
          .then(() => {
            setAdminNoteInput("");
            setAdminNoteFeedback({ ok: true, msg: "Note added." });
            setAdminNoteLoading(false);
            setAdminAccountDetailKey((k) => k + 1);
          })
          .catch((err) => {
            setAdminNoteFeedback({ ok: false, msg: err?.message || "Failed to add note." });
            setAdminNoteLoading(false);
          });
      }

      function handleFlag(e) {
        e.preventDefault();
        if (!adminFlagInput.trim()) return;
        setAdminFlagLoading(true);
        setAdminFlagFeedback(null);
        apiAdminFlagAccount(adminAccountDetailId, { reason: adminFlagInput }, updateBackendSession)
          .then(() => {
            setAdminFlagInput("");
            setAdminFlagFeedback({ ok: true, msg: "Account flagged." });
            setAdminFlagLoading(false);
            setAdminAccountDetailKey((k) => k + 1);
          })
          .catch((err) => {
            setAdminFlagFeedback({ ok: false, msg: err?.message || "Failed to flag account." });
            setAdminFlagLoading(false);
          });
      }

      function handleUnflag(e) {
        e.preventDefault();
        setAdminUnflagLoading(true);
        setAdminUnflagFeedback(null);
        apiAdminUnflagAccount(adminAccountDetailId, adminUnflagInput.trim() ? { reason: adminUnflagInput } : {}, updateBackendSession)
          .then((res) => {
            setAdminUnflagInput("");
            setAdminUnflagFeedback({ ok: true, msg: `Cleared ${res?.cleared ?? 0} flag(s).` });
            setAdminUnflagLoading(false);
            setAdminAccountDetailKey((k) => k + 1);
          })
          .catch((err) => {
            setAdminUnflagFeedback({ ok: false, msg: err?.message || "Failed to unflag account." });
            setAdminUnflagLoading(false);
          });
      }

      return (
        <div
          className="modal-backdrop"
          style={{ zIndex: 1200 }}
          onClick={handleClose}
        >
          <section
            className="modal-card"
            style={{ maxWidth: 780, width: "95%", maxHeight: "90vh", overflowY: "auto", padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>
                  {adminAccountDetailLoading ? "Loading…" : (d?.account?.name ?? "Account Detail")}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Account Deep View · Admin Actions</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="iac-badge iac-badge--ro">Read-only</span>
                <button
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
                  onClick={handleClose}
                  aria-label="Close"
                >×</button>
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {adminAccountDetailLoading && (
                <div className="iac-state-msg"><span className="internal-admin-spinner" /> Yüklənir…</div>
              )}
              {adminAccountDetailError && !adminAccountDetailLoading && (
                <div className="iac-state-err">{adminAccountDetailError}</div>
              )}

              {!adminAccountDetailLoading && !adminAccountDetailError && d && (
                <>
                  {/* Account + Subscription */}
                  <div className="iac-preview-pair" style={{ marginBottom: 20 }}>
                    <div className="iac-preview-card" style={{ flex: 1 }}>
                      <div className="iac-preview-hd">
                        <span className="iac-dot iac-dot--growth" />
                        <span className="iac-preview-title">Account</span>
                      </div>
                      <dl className="iac-preview-dl">
                        <div className="iac-preview-item"><dt>Name</dt><dd>{d.account.name}</dd></div>
                        <div className="iac-preview-item"><dt>Joined</dt><dd>{fmtDate(d.account.createdAt)}</dd></div>
                      </dl>
                    </div>
                    <div className="iac-preview-card" style={{ flex: 1 }}>
                      <div className="iac-preview-hd">
                        <span className="iac-dot iac-dot--revenue" />
                        <span className="iac-preview-title">Subscription</span>
                      </div>
                      <dl className="iac-preview-dl">
                        <div className="iac-preview-item">
                          <dt>Plan</dt>
                          <dd><span className="iac-plan-badge">{d.account.plan ?? "—"}</span></dd>
                        </div>
                        <div className="iac-preview-item">
                          <dt>Status</dt>
                          <dd>
                            <span className={"iac-status-badge iac-status-badge--" + (d.account.subscriptionStatus?.toLowerCase() ?? "none")}>
                              {d.account.subscriptionStatus ?? "—"}
                            </span>
                          </dd>
                        </div>
                        <div className="iac-preview-item"><dt>Interval</dt><dd>{d.account.subscriptionInterval ?? "—"}</dd></div>
                        <div className="iac-preview-item"><dt>Period Start</dt><dd>{fmtDate(d.account.subscriptionCurrentPeriodStart)}</dd></div>
                        <div className="iac-preview-item"><dt>Period End</dt><dd>{fmtDate(d.account.subscriptionCurrentPeriodEnd)}</dd></div>
                      </dl>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="iac-section" style={{ marginBottom: 20 }}>
                    <div className="iac-section-hd">
                      <span className="iac-dot iac-dot--signups" />
                      <span className="iac-section-lbl">Owner</span>
                    </div>
                    {d.owner ? (
                      <dl className="iac-preview-dl" style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px" }}>
                        <div className="iac-preview-item"><dt>Email</dt><dd>{d.owner.email}</dd></div>
                        <div className="iac-preview-item"><dt>Name</dt><dd>{d.owner.name ?? "—"}</dd></div>
                        <div className="iac-preview-item"><dt>Role</dt><dd>{d.owner.role}</dd></div>
                        <div className="iac-preview-item"><dt>Joined</dt><dd>{fmtDate(d.owner.createdAt)}</dd></div>
                      </dl>
                    ) : (
                      <div className="iac-fin-empty">No owner found.</div>
                    )}
                  </div>

                  {/* ERP Metrics */}
                  <div className="iac-section" style={{ marginBottom: 20 }}>
                    <div className="iac-section-hd">
                      <span className="iac-dot iac-dot--revenue" />
                      <span className="iac-section-lbl">ERP Metrics</span>
                    </div>
                    <div className="iac-kpi-row" style={{ flexWrap: "wrap", gap: 10 }}>
                      <div className="iac-kpi-card" style={{ minWidth: 100, flex: "1 1 100px" }}>
                        <span className="iac-kpi-lbl">Users</span>
                        <strong className="iac-kpi-val">{d.metrics.usersCount}</strong>
                      </div>
                      <div className="iac-kpi-card" style={{ minWidth: 100, flex: "1 1 100px" }}>
                        <span className="iac-kpi-lbl">Customers</span>
                        <strong className="iac-kpi-val">{d.metrics.customersCount}</strong>
                      </div>
                      <div className="iac-kpi-card" style={{ minWidth: 100, flex: "1 1 100px" }}>
                        <span className="iac-kpi-lbl">Vendors</span>
                        <strong className="iac-kpi-val">{d.metrics.vendorsCount}</strong>
                      </div>
                      <div className="iac-kpi-card" style={{ minWidth: 100, flex: "1 1 100px" }}>
                        <span className="iac-kpi-lbl">Invoices</span>
                        <strong className="iac-kpi-val">{d.metrics.invoicesCount}</strong>
                      </div>
                      <div className="iac-kpi-card" style={{ minWidth: 120, flex: "1 1 120px" }}>
                        <span className="iac-kpi-lbl">Total Revenue</span>
                        <strong className="iac-kpi-val iac-kpi-val--sm">{fmtAZN(d.metrics.totalInvoiceValueMinor)} ₼</strong>
                      </div>
                      <div className="iac-kpi-card" style={{ minWidth: 100, flex: "1 1 100px" }}>
                        <span className="iac-kpi-lbl">Paid</span>
                        <strong className="iac-kpi-val">{d.metrics.paidInvoicesCount}</strong>
                      </div>
                      <div className="iac-kpi-card" style={{ minWidth: 100, flex: "1 1 100px" }}>
                        <span className="iac-kpi-lbl">Draft</span>
                        <strong className="iac-kpi-val">{d.metrics.draftInvoicesCount}</strong>
                      </div>
                      <div className="iac-kpi-card" style={{ minWidth: 100, flex: "1 1 100px" }}>
                        <span className="iac-kpi-lbl">Overdue</span>
                        <strong className="iac-kpi-val">{d.metrics.overdueInvoicesCount}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Users list */}
                  <div className="iac-section" style={{ marginBottom: 20 }}>
                    <div className="iac-section-hd">
                      <span className="iac-dot iac-dot--growth" />
                      <span className="iac-section-lbl">Users ({d.users.length})</span>
                    </div>
                    {d.users.length === 0 ? (
                      <div className="iac-fin-empty">No users.</div>
                    ) : (
                      <div className="internal-admin-table-wrap">
                        <table className="internal-admin-table">
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Name</th>
                              <th>Role</th>
                              <th>Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.users.map((u) => (
                              <tr key={u.id}>
                                <td>{u.email}</td>
                                <td>{u.name ?? "—"}</td>
                                <td>{u.role}</td>
                                <td>{fmtDate(u.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="iac-section" style={{ marginBottom: 20 }}>
                    <div className="iac-section-hd">
                      <span className="iac-dot iac-dot--signups" />
                      <span className="iac-section-lbl">Recent Activity</span>
                    </div>
                    {d.recentActivity.length === 0 ? (
                      <div className="iac-fin-empty">No recent activity.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {d.recentActivity.map((item) => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#0f172a", borderRadius: 7, fontSize: 13 }}>
                            <span style={{ width: 70, flexShrink: 0, fontSize: 11, fontWeight: 600, color: ACTIVITY_COLORS[item.type] ?? "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.type}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                              <div style={{ color: "#64748b", fontSize: 11 }}>{item.subtitle}</div>
                            </div>
                            <span style={{ color: "#475569", fontSize: 11, flexShrink: 0 }}>{fmtDate(item.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Internal Notes */}
                  <div className="iac-section" style={{ marginBottom: 20 }}>
                    <div className="iac-section-hd">
                      <span className="iac-dot" style={{ background: "#6366f1" }} />
                      <span className="iac-section-lbl">Internal Notes ({d.internalNotes?.length ?? 0})</span>
                    </div>
                    {(d.internalNotes?.length ?? 0) === 0 ? (
                      <div className="iac-fin-empty">No notes yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                        {d.internalNotes.map((n) => (
                          <div key={n.id} style={{ background: "#0f172a", borderRadius: 7, padding: "10px 14px", fontSize: 13 }}>
                            <div style={{ color: "#e2e8f0" }}>{n.note}</div>
                            <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{n.authorEmail} · {fmtDate(n.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleAddNote} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <textarea
                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 13, padding: "8px 12px", resize: "vertical", minHeight: 64, width: "100%", boxSizing: "border-box" }}
                        placeholder="Add an internal note… (max 2000 chars)"
                        value={adminNoteInput}
                        maxLength={2000}
                        onChange={(e) => setAdminNoteInput(e.target.value)}
                      />
                      {adminNoteFeedback && (
                        <div style={{ fontSize: 12, color: adminNoteFeedback.ok ? "#10b981" : "#ef4444" }}>{adminNoteFeedback.msg}</div>
                      )}
                      <button type="submit" className="iac-search-btn" disabled={adminNoteLoading || !adminNoteInput.trim()} style={{ alignSelf: "flex-start" }}>
                        {adminNoteLoading ? "Saving…" : "Add Note"}
                      </button>
                    </form>
                  </div>

                  {/* Flags */}
                  <div className="iac-section" style={{ marginBottom: 20 }}>
                    <div className="iac-section-hd">
                      <span className="iac-dot" style={{ background: "#ef4444" }} />
                      <span className="iac-section-lbl">Active Flags ({d.activeFlags?.length ?? 0})</span>
                    </div>
                    {(d.activeFlags?.length ?? 0) === 0 ? (
                      <div className="iac-fin-empty" style={{ marginBottom: 12 }}>No active flags.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                        {d.activeFlags.map((f) => (
                          <div key={f.id} style={{ background: "#0f172a", borderRadius: 7, padding: "10px 14px", fontSize: 13, borderLeft: "3px solid #ef4444" }}>
                            <div style={{ color: "#fca5a5" }}>{f.reason}</div>
                            <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{f.createdByEmail} · {fmtDate(f.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <form onSubmit={handleFlag} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          className="iac-search-input"
                          style={{ flex: 1, minWidth: 200 }}
                          placeholder="Flag reason… (max 500 chars)"
                          value={adminFlagInput}
                          maxLength={500}
                          onChange={(e) => setAdminFlagInput(e.target.value)}
                        />
                        <button type="submit" className="iac-search-btn" disabled={adminFlagLoading || !adminFlagInput.trim()} style={{ background: "#7f1d1d", borderColor: "#7f1d1d" }}>
                          {adminFlagLoading ? "…" : "Flag Account"}
                        </button>
                        {adminFlagFeedback && (
                          <span style={{ fontSize: 12, color: adminFlagFeedback.ok ? "#10b981" : "#ef4444", alignSelf: "center" }}>{adminFlagFeedback.msg}</span>
                        )}
                      </form>
                      {(d.activeFlags?.length ?? 0) > 0 && (
                        <form onSubmit={handleUnflag} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            className="iac-search-input"
                            style={{ flex: 1, minWidth: 200 }}
                            placeholder="Unflag reason (optional)…"
                            value={adminUnflagInput}
                            maxLength={500}
                            onChange={(e) => setAdminUnflagInput(e.target.value)}
                          />
                          <button type="submit" className="iac-search-btn" disabled={adminUnflagLoading} style={{ background: "#14532d", borderColor: "#14532d" }}>
                            {adminUnflagLoading ? "…" : "Unflag Account"}
                          </button>
                          {adminUnflagFeedback && (
                            <span style={{ fontSize: 12, color: adminUnflagFeedback.ok ? "#10b981" : "#ef4444", alignSelf: "center" }}>{adminUnflagFeedback.msg}</span>
                          )}
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Recent Admin Actions */}
                  <div className="iac-section">
                    <div className="iac-section-hd">
                      <span className="iac-dot" style={{ background: "#f59e0b" }} />
                      <span className="iac-section-lbl">Admin Audit Log ({d.recentAdminActions?.length ?? 0} recent)</span>
                    </div>
                    {(d.recentAdminActions?.length ?? 0) === 0 ? (
                      <div className="iac-fin-empty">No admin actions recorded.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {d.recentAdminActions.map((a) => (
                          <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", background: "#0f172a", borderRadius: 7, fontSize: 12 }}>
                            <span style={{ fontWeight: 700, color: ACTION_COLORS[a.action] ?? "#94a3b8", whiteSpace: "nowrap", minWidth: 130, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.04em" }}>{a.action.replace(/_/g, " ")}</span>
                            <span style={{ color: "#64748b", flex: 1 }}>{a.actorEmail}</span>
                            <span style={{ color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(a.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="iac-shell">
        <aside className="iac-sidebar">
          <div className="iac-sidebar-brand">
            <div className="brand-icon" style={{ width: 30, height: 30, flexShrink: 0 }}>
              <img src={logoSrc} alt="Tetavio" className="app-logo" />
            </div>
            <div>
              <div className="iac-brand-name">Tetavio</div>
              <div className="iac-brand-env">Admin Console</div>
            </div>
          </div>
          <nav className="iac-nav">
            {IAC_NAV.map(({ key, label, icon }) => (
              <button
                key={key}
                className={"iac-nav-item" + (adminActiveTab === key ? " iac-nav-item--active" : "")}
                onClick={() => setAdminActiveTab(key)}
              >
                <span className="iac-nav-icon">{icon}</span>
                {label}
              </button>
            ))}
          </nav>
          <div className="iac-sidebar-foot">
            <div className="iac-su-avatar">{currentUser.email.charAt(0).toUpperCase()}</div>
            <div className="iac-su-info">
              <div className="iac-su-email">{currentUser.email}</div>
              <div className="iac-su-role">super_admin</div>
            </div>
          </div>
        </aside>

        <div className="iac-main">
          <header className="iac-topbar">
            <div>
              <h1 className="iac-topbar-title">Tetavio Admin Console</h1>
              <p className="iac-topbar-sub">SaaS management and finance overview</p>
            </div>
            <div className="iac-topbar-badges">
              <span className="iac-badge iac-badge--ro">Read-only</span>
              <span className="iac-badge iac-badge--phase">Phase 3A</span>
            </div>
          </header>
          <div className="iac-content">
            {adminActiveTab === "overview" && renderOverviewTab()}
            {adminActiveTab === "accounts" && renderAccountsTab()}
            {adminActiveTab === "finance" && renderFinanceTab()}
            {adminActiveTab === "subscriptions" && renderSubscriptionsTab()}
            {adminActiveTab === "activity" && renderActivityTab()}
            {adminActiveTab === "anomalies" && renderAnomaliesTab()}
            {adminActiveTab === "system" && renderSystemHealthTab()}
            {adminActiveTab !== "overview" && adminActiveTab !== "accounts" && adminActiveTab !== "finance" && adminActiveTab !== "subscriptions" && adminActiveTab !== "activity" && adminActiveTab !== "anomalies" && adminActiveTab !== "system" && renderComingSoonTab(adminActiveTab)}
          </div>
        </div>
        {renderAccountDeepView()}
      </div>
    );
  }

  function renderHome() {
    const netCashFlow = totals.collected - totals.cashOut;
    const netPositive = netCashFlow >= 0;
    const onboardingT = {
      az: {
        title: "Başlama bələdçisi",
        desc: "Tetavio-dan istifadəyə başlamaq üçün bu addımları izləyin.",
        done: "Tamamlandı",
        progress: (n, t) => `${n} / ${t} addım tamamlandı`,
        companyTitle: "Şirkət profilini tamamla",
        companyDesc: "Fakturalarınız düzgün görünsün deyə şirkət adını, vergi nömrəsini və valyutanı daxil edin.",
        companyAction: "Profilə keç",
        customerTitle: "İlk müştərini əlavə et",
        customerDesc: "Faktura göndərə bilmək üçün ilk müştərini əlavə edin.",
        customerAction: "Müştərilərə keç",
        vendorTitle: "İlk təchizatçını əlavə et",
        vendorDesc: "Nədən nə aldığınızı izləmək üçün ilk təchizatçını əlavə edin. Bunu sonraya buraxa bilərsiniz.",
        vendorAction: "Təchizatçılara keç",
        invoiceTitle: "İlk fakturanı yarat",
        invoiceDesc: "Başlamaq üçün ilk fakturanı yaradın.",
        invoiceAction: "Fakturalara keç",
      },
      en: {
        title: "Getting started",
        desc: "Follow these steps to start using Tetavio.",
        done: "Completed",
        progress: (n, t) => `${n} of ${t} steps done`,
        companyTitle: "Complete company profile",
        companyDesc: "Enter your company name, tax ID, and currency so your invoices look correct.",
        companyAction: "Open profile",
        customerTitle: "Add first customer",
        customerDesc: "Add your first customer so you can send them an invoice.",
        customerAction: "Open customers",
        vendorTitle: "Add first vendor",
        vendorDesc: "Add your first vendor so you can track what you buy from them. You can do this later.",
        vendorAction: "Open vendors",
        invoiceTitle: "Create first invoice",
        invoiceDesc: "Create your first invoice to get started.",
        invoiceAction: "Open invoices",
      },
      ru: {
        title: "Первые шаги",
        desc: "Следуйте этим шагам, чтобы начать работу с Tetavio.",
        done: "Готово",
        progress: (n, t) => `${n} из ${t} шагов выполнено`,
        companyTitle: "Заполнить профиль компании",
        companyDesc: "Введите название компании, ИНН и валюту, чтобы счета выглядели корректно.",
        companyAction: "Открыть профиль",
        customerTitle: "Добавить первого клиента",
        customerDesc: "Добавьте первого клиента, чтобы отправить ему счёт.",
        customerAction: "Открыть клиентов",
        vendorTitle: "Добавить первого поставщика",
        vendorDesc: "Добавьте первого поставщика, чтобы отслеживать закупки. Можно сделать позже.",
        vendorAction: "Открыть поставщиков",
        invoiceTitle: "Создать первый счёт",
        invoiceDesc: "Создайте первый счёт, чтобы начать работу.",
        invoiceAction: "Открыть счета",
      },
      tr: {
        title: "Başlangıç adımları",
        desc: "Tetavio'yu kullanmaya başlamak için bu adımları izleyin.",
        done: "Tamamlandı",
        progress: (n, t) => `${n} / ${t} adım tamamlandı`,
        companyTitle: "Şirket profilini tamamla",
        companyDesc: "Faturalarınız doğru görünsün diye şirket adını, vergi numarasını ve para birimini girin.",
        companyAction: "Profili aç",
        customerTitle: "İlk müşteriyi ekle",
        customerDesc: "Fatura gönderebilmek için ilk müşterinizi ekleyin.",
        customerAction: "Müşterileri aç",
        vendorTitle: "İlk tedarikçiyi ekle",
        vendorDesc: "Satın aldıklarınızı takip etmek için ilk tedarikçinizi ekleyin. Bunu sonra yapabilirsiniz.",
        vendorAction: "Tedarikçileri aç",
        invoiceTitle: "İlk faturayı oluştur",
        invoiceDesc: "Başlamak için ilk faturanızı oluşturun.",
        invoiceAction: "Faturaları aç",
      },
      de: {
        title: "Erste Schritte",
        desc: "Folgen Sie diesen Schritten, um Tetavio zu starten.",
        done: "Erledigt",
        progress: (n, t) => `${n} von ${t} Schritten erledigt`,
        companyTitle: "Unternehmensprofil vervollständigen",
        companyDesc: "Geben Sie Firmennamen, Steuernummer und Währung ein, damit Ihre Rechnungen korrekt aussehen.",
        companyAction: "Profil öffnen",
        customerTitle: "Ersten Kunden anlegen",
        customerDesc: "Fügen Sie Ihren ersten Kunden hinzu, um ihm eine Rechnung zu senden.",
        customerAction: "Kunden öffnen",
        vendorTitle: "Ersten Lieferanten anlegen",
        vendorDesc: "Fügen Sie Ihren ersten Lieferanten hinzu, um Einkäufe zu verfolgen. Das können Sie auch später tun.",
        vendorAction: "Lieferanten öffnen",
        invoiceTitle: "Erste Rechnung erstellen",
        invoiceDesc: "Erstellen Sie Ihre erste Rechnung, um loszulegen.",
        invoiceAction: "Rechnungen öffnen",
      },
    }[hubLang] || {
      title: "Getting started",
      desc: "Follow these steps to start using Tetavio.",
      done: "Completed",
      progress: (n, t) => `${n} of ${t} steps done`,
      companyTitle: "Complete company profile",
      companyDesc: "Enter your company name, tax ID, and currency so your invoices look correct.",
      companyAction: "Open profile",
      customerTitle: "Add first customer",
      customerDesc: "Add your first customer so you can send them an invoice.",
      customerAction: "Open customers",
      vendorTitle: "Add first vendor",
      vendorDesc: "Add your first vendor so you can track what you buy from them. You can do this later.",
      vendorAction: "Open vendors",
      invoiceTitle: "Create first invoice",
      invoiceDesc: "Create your first invoice to get started.",
      invoiceAction: "Open invoices",
    };

    function goTo(section, module) {
      setSection(section);
      if (module) setActiveModule(module);
    }

    function goToSettingsProfile() {
      setSection("settings");
      setSettingsTab("profile");
    }

    const companyProfileCompleted = [
      state.settings.companyName,
      state.settings.taxId,
      state.settings.mobilePhone,
      state.settings.entityType,
      state.settings.currency,
      state.settings.fiscalYear,
    ].every((value) => String(value || "").trim());

    const onboardingItems = [
      {
        id: "company-profile",
        icon: "🏢",
        title: onboardingT.companyTitle,
        desc: onboardingT.companyDesc,
        done: companyProfileCompleted,
        actionLabel: onboardingT.companyAction,
        action: goToSettingsProfile,
      },
      {
        id: "first-customer",
        icon: "👥",
        title: onboardingT.customerTitle,
        desc: onboardingT.customerDesc,
        done: state.customers.length > 0,
        actionLabel: onboardingT.customerAction,
        action: () => goTo("sales", "customers"),
      },
      {
        id: "first-vendor",
        icon: "🏭",
        title: onboardingT.vendorTitle,
        desc: onboardingT.vendorDesc,
        done: state.vendors.length > 0,
        actionLabel: onboardingT.vendorAction,
        action: () => goTo("purchases", "vendors"),
      },
      {
        id: "first-invoice",
        icon: "🧾",
        title: onboardingT.invoiceTitle,
        desc: onboardingT.invoiceDesc,
        done: state.invoices.length > 0,
        actionLabel: onboardingT.invoiceAction,
        action: () => goTo("sales", "invoices"),
      },
    ];
    const completedOnboardingCount = onboardingItems.filter((item) => item.done).length;

    const shortcuts = [
      { icon: "🧾", label: at.home_salesInv, sub: `${state.invoices.length} ${at.unit_record}`, section: "sales", module: "invoices" },
      { icon: "📦", label: at.home_purchInv, sub: `${state.incomingGoodsServices.length} ${at.unit_bill}`, section: "purchases", module: "incomingGoodsServices" },
      { icon: "👥", label: at.home_customers, sub: `${state.customers.length} ${at.unit_customer}`, section: "sales", module: "customers" },
      { icon: "🏭", label: at.home_vendors, sub: `${state.vendors.length} ${at.unit_record}`, section: "purchases", module: "vendors" },
      { icon: "🏦", label: at.nav.banking, sub: `${state.bankingAccounts.length} ${at.unit_account}`, section: "banking", module: null },
      { icon: "📊", label: at.nav.reports, sub: `5 ${at.unit_reportTypes}`, section: "reports", module: null },
    ];

    return (
      <section className="view active">

        <div className="dash-onboarding panel">
          <div className="panel-head">
            <div>
              <h3>{onboardingT.title}</h3>
              <p className="panel-copy">{onboardingT.desc}</p>
            </div>
            <span className="dash-onboarding-progress">{onboardingT.progress(completedOnboardingCount, onboardingItems.length)}</span>
          </div>
          <div className="dash-onboarding-list">
            {onboardingItems.map((item) => (
              <div key={item.id} className={`dash-onboarding-item${item.done ? " is-done" : ""}`}>
                <div className="dash-onboarding-copy">
                  <div className="dash-onboarding-title-row">
                    <span className="dash-onboarding-icon" aria-hidden="true">{item.icon}</span>
                    <strong>{item.title}</strong>
                    {item.done && (
                      <span className="dash-onboarding-state is-done">
                        {onboardingT.done}
                      </span>
                    )}
                  </div>
                  <p>{item.desc}</p>
                </div>
                <button className={item.done ? "ghost-btn compact-btn" : "primary-btn compact-btn"} type="button" onClick={item.action}>
                  {item.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI kartları ── */}
        <div className="dash-kpi-grid">
          <div className="dash-kpi-card dash-kpi-blue">
            <div className="dash-kpi-icon">🧾</div>
            <div className="dash-kpi-body">
              <span>{at.home_kpi1}</span>
              <strong>{currency(totals.invoice, state.settings.currency)}</strong>
            </div>
          </div>
          <div className="dash-kpi-card dash-kpi-gold">
            <div className="dash-kpi-icon">💳</div>
            <div className="dash-kpi-body">
              <span>{at.home_kpi2}</span>
              <strong>{currency(totals.collected, state.settings.currency)}</strong>
            </div>
          </div>
          <div className="dash-kpi-card dash-kpi-teal">
            <div className="dash-kpi-icon">🏦</div>
            <div className="dash-kpi-body">
              <span>{at.home_kpi3}</span>
              <strong>{currency(totals.bank, state.settings.currency)}</strong>
            </div>
          </div>
          <div className="dash-kpi-card dash-kpi-green">
            <div className="dash-kpi-icon">{netPositive ? "📈" : "📉"}</div>
            <div className="dash-kpi-body">
              <span>{at.home_kpi4}</span>
              <strong className={netPositive ? "dash-kpi-positive" : "dash-kpi-negative"}>{currency(netCashFlow, state.settings.currency)}</strong>
            </div>
          </div>
        </div>

        {/* ── Sürətli keçidlər ── */}
        <div className="dash-shortcuts">
          <p className="dash-section-label">{at.home_quickLinks}</p>
          <div className="dash-shortcut-grid">
            {shortcuts.map(({ icon, label, sub, section, module }) => (
              <div key={label} className="dash-shortcut-card" onClick={() => goTo(section, module)}>
                <span className="dash-shortcut-icon">{icon}</span>
                <div>
                  <strong>{label}</strong>
                  <small>{sub}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── İcmal panelləri ── */}
        <div className="dash-stats-grid">
          <div className="panel">
            <div className="panel-head"><div><h3>{at.home_salesTitle}</h3><p className="panel-copy">{at.home_salesDesc}</p></div></div>
            <div className="dash-stat-list">
              <div className="dash-stat-row"><span>{at.home_salesInv}</span><strong>{state.invoices.length}</strong></div>
              <div className="dash-stat-row"><span>{at.home_customers}</span><strong>{state.customers.length}</strong></div>
              <div className="dash-stat-row"><span>{at.home_receivables}</span><strong>{currency(totals.receivables, state.settings.currency)}</strong></div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><div><h3>{at.home_purchTitle}</h3><p className="panel-copy">{at.home_purchDesc}</p></div></div>
            <div className="dash-stat-list">
              <div className="dash-stat-row"><span>{at.home_purchInv}</span><strong>{state.incomingGoodsServices.length}</strong></div>
              <div className="dash-stat-row"><span>{at.home_vendors}</span><strong>{state.vendors.length}</strong></div>
              <div className="dash-stat-row"><span>{at.home_payables}</span><strong>{currency(totals.payables, state.settings.currency)}</strong></div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><div><h3>{at.home_txTitle}</h3><p className="panel-copy">{at.home_txDesc}</p></div></div>
            <div className="dash-stat-list">
              <div className="dash-stat-row"><span>{at.home_manualJ}</span><strong>{state.manualJournals.length}</strong></div>
              <div className="dash-stat-row"><span>{at.home_chartAcc}</span><strong>{state.chartOfAccounts.length} {at.unit_account}</strong></div>
              <div className="dash-stat-row"><span>{at.home_docs}</span><strong>{state.documents.length}</strong></div>
            </div>
          </div>
        </div>

        {renderFinancialInsights()}

        {renderCashflowForecast()}

        {renderFinancialTrends()}

      </section>
    );
  }

  function renderFinancialInsights() {
    const cur = state.settings.currency || "AZN";
    const fmtMinor = (minor) => currency((minor || 0) / 100, cur);

    const SEV_COLOR = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
    const SEV_BG = { HIGH: "rgba(239,68,68,0.08)", MEDIUM: "rgba(245,158,11,0.08)", LOW: "rgba(16,185,129,0.08)" };

    if (financialInsightsLoading) {
      return (
        <div className="panel" style={{ marginTop: "var(--space-lg)" }}>
          <div className="panel-head"><div><h3>Financial Insights</h3><p className="panel-copy">Loading…</p></div></div>
        </div>
      );
    }

    if (financialInsightsError) {
      return (
        <div className="panel" style={{ marginTop: "var(--space-lg)" }}>
          <div className="panel-head"><div><h3>Financial Insights</h3></div></div>
          <p style={{ color: "var(--danger)", padding: "0 1.5rem 1rem" }}>{financialInsightsError}</p>
        </div>
      );
    }

    if (!financialInsightsData) return null;

    const { summary, insights } = financialInsightsData;

    const kpis = [
      { label: "Total Revenue", value: fmtMinor(summary.totalRevenueMinor), accent: "#1c5eb0", iconBg: "rgba(28,94,176,0.1)", icon: "🧾" },
      { label: "Paid Revenue", value: fmtMinor(summary.paidRevenueMinor), accent: "#10b981", iconBg: "rgba(16,185,129,0.1)", icon: "✅" },
      { label: "Outstanding", value: fmtMinor(summary.outstandingRevenueMinor), accent: "#f59e0b", iconBg: "rgba(245,158,11,0.1)", icon: "⏳" },
      { label: "Overdue", value: fmtMinor(summary.overdueRevenueMinor), accent: "#ef4444", iconBg: "rgba(239,68,68,0.1)", icon: "⚠️" },
      { label: "Invoices", value: summary.invoiceCount, accent: "#6366f1", iconBg: "rgba(99,102,241,0.1)", icon: "📄" },
      { label: "Paid Invoices", value: summary.paidInvoiceCount, accent: "#10b981", iconBg: "rgba(16,185,129,0.1)", icon: "💳" },
      { label: "Customers", value: summary.customerCount, accent: "#0ea5e9", iconBg: "rgba(14,165,233,0.1)", icon: "👥" },
    ];

    return (
      <div style={{ marginTop: "var(--space-lg)" }}>
        <p className="dash-section-label">Financial Insights</p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
        }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.92)",
              borderLeftWidth: 4,
              borderLeftColor: kpi.accent,
            }}>
              <div style={{
                fontSize: "1.3rem", width: 40, height: 40, display: "flex",
                alignItems: "center", justifyContent: "center",
                borderRadius: 10, background: kpi.iconBg, flexShrink: 0,
              }}>{kpi.icon}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", whiteSpace: "nowrap" }}>{kpi.label}</span>
                <strong style={{ fontFamily: "'Bahnschrift','Segoe UI',sans-serif", fontSize: "clamp(0.9rem,1.2vw,1.25rem)", fontWeight: 800, lineHeight: 1, color: "var(--text)", whiteSpace: "nowrap" }}>{kpi.value}</strong>
              </div>
            </div>
          ))}
        </div>

        {insights.length === 0 ? (
          <div className="panel" style={{ padding: "1.5rem" }}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No active insights at this time. Keep up the strong billing discipline.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {insights.map((insight) => (
              <div key={insight.id} style={{
                padding: "1.25rem 1.5rem",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface)",
                border: `1px solid ${SEV_COLOR[insight.severity] ?? "#334155"}`,
                borderLeftWidth: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px",
                    borderRadius: 999,
                    color: SEV_COLOR[insight.severity],
                    background: SEV_BG[insight.severity],
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>{insight.severity}</span>
                  <strong style={{ fontSize: 14, color: "var(--text)" }}>{insight.title}</strong>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 }}>{insight.description}</p>
                <p style={{ fontSize: 12, color: SEV_COLOR[insight.severity] ?? "var(--muted)", fontWeight: 500 }}>
                  Recommendation: {insight.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderCashflowForecast() {
    const cur = state.settings.currency || "AZN";
    const fmtMinor = (minor) => currency((minor || 0) / 100, cur);

    const STATUS_COLOR = { HEALTHY: "#10b981", WATCH: "#f59e0b", RISK: "#ef4444" };
    const SEV_COLOR = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
    const SEV_BG = { HIGH: "rgba(239,68,68,0.08)", MEDIUM: "rgba(245,158,11,0.08)", LOW: "rgba(16,185,129,0.08)" };

    if (cashflowLoading) {
      return (
        <div className="panel" style={{ marginTop: "var(--space-lg)" }}>
          <div className="panel-head"><div><h3>Cashflow Forecast</h3><p className="panel-copy">Loading…</p></div></div>
        </div>
      );
    }

    if (cashflowError) {
      return (
        <div className="panel" style={{ marginTop: "var(--space-lg)" }}>
          <div className="panel-head"><div><h3>Cashflow Forecast</h3></div></div>
          <p style={{ color: "var(--danger)", padding: "0 1.5rem 1rem" }}>{cashflowError}</p>
        </div>
      );
    }

    if (!cashflowData) return null;

    const { summary, buckets, recommendations, upcomingInvoices } = cashflowData;

    const statusColor = STATUS_COLOR[summary.cashflowStatus] ?? "#94a3b8";

    const kpis = [
      { label: "Expected (30 days)", value: fmtMinor(summary.expectedIncomingNext30DaysMinor), accent: "#1c5eb0", iconBg: "rgba(28,94,176,0.1)", icon: "📅" },
      { label: "Overdue", value: fmtMinor(summary.overdueAmountMinor), accent: "#ef4444", iconBg: "rgba(239,68,68,0.1)", icon: "⚠️" },
      { label: "Due Soon (7d)", value: fmtMinor(summary.dueSoonAmountMinor), accent: "#f59e0b", iconBg: "rgba(245,158,11,0.1)", icon: "⏰" },
      { label: "Recent Paid Revenue (Approx.)", value: fmtMinor(summary.paidLast30DaysMinor), accent: "#10b981", iconBg: "rgba(16,185,129,0.1)", icon: "✅" },
      { label: "Open Invoices", value: summary.openInvoiceCount, accent: "#6366f1", iconBg: "rgba(99,102,241,0.1)", icon: "📄" },
      {
        label: "Cashflow Status",
        value: summary.cashflowStatus,
        accent: statusColor,
        iconBg: `${statusColor}18`,
        icon: summary.cashflowStatus === "HEALTHY" ? "📈" : summary.cashflowStatus === "RISK" ? "📉" : "⚡",
        valueStyle: { color: statusColor },
      },
    ];

    return (
      <div style={{ marginTop: "var(--space-lg)" }}>
        <p className="dash-section-label">Cashflow Forecast</p>

        {/* KPI cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
        }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.92)",
              borderLeftWidth: 4,
              borderLeftColor: kpi.accent,
            }}>
              <div style={{
                fontSize: "1.3rem", width: 40, height: 40, display: "flex",
                alignItems: "center", justifyContent: "center",
                borderRadius: 10, background: kpi.iconBg, flexShrink: 0,
              }}>{kpi.icon}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", whiteSpace: "nowrap" }}>{kpi.label}</span>
                <strong style={{ fontFamily: "'Bahnschrift','Segoe UI',sans-serif", fontSize: "clamp(0.9rem,1.2vw,1.25rem)", fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap", ...(kpi.valueStyle || { color: "var(--text)" }) }}>{kpi.value}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Buckets */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
        }}>
          {buckets.map((bucket) => {
            const bucketAccent = bucket.label === "Overdue" ? "#ef4444" : bucket.label === "Due next 7 days" ? "#f59e0b" : bucket.label === "Due 8–30 days" ? "#6366f1" : "#10b981";
            return (
              <div key={bucket.label} style={{
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.92)",
                borderTopWidth: 3,
                borderTopColor: bucketAccent,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: bucketAccent, marginBottom: 6 }}>{bucket.label}</div>
                <div style={{ fontFamily: "'Bahnschrift','Segoe UI',sans-serif", fontSize: "1.15rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{fmtMinor(bucket.amountMinor)}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{bucket.invoiceCount} invoice{bucket.invoiceCount !== 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
            {recommendations.map((rec) => (
              <div key={rec.id} style={{
                padding: "1.1rem 1.4rem",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface)",
                border: `1px solid ${SEV_COLOR[rec.severity] ?? "#334155"}`,
                borderLeftWidth: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color: SEV_COLOR[rec.severity], background: SEV_BG[rec.severity], textTransform: "uppercase", letterSpacing: "0.06em" }}>{rec.severity}</span>
                  <strong style={{ fontSize: 14, color: "var(--text)" }}>{rec.title}</strong>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6, lineHeight: 1.5 }}>{rec.description}</p>
                <p style={{ fontSize: 12, color: SEV_COLOR[rec.severity] ?? "var(--muted)", fontWeight: 500 }}>Recommendation: {rec.recommendation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming invoices */}
        {upcomingInvoices.length > 0 && (
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div className="panel-head" style={{ padding: "1rem 1.5rem" }}>
              <div>
                <h3 style={{ margin: 0 }}>Upcoming Invoices</h3>
                <p className="panel-copy" style={{ margin: 0 }}>Open invoices due in the next 30 days</p>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="internal-admin-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInvoices.map((inv) => {
                    const isOverdueRow = inv.dueDate && new Date(inv.dueDate) < new Date();
                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                        <td>{inv.customerName}</td>
                        <td style={{ color: isOverdueRow ? "#ef4444" : "var(--text)" }}>{fmtDate(inv.dueDate)}</td>
                        <td style={{ fontWeight: 600 }}>{fmtMinor(inv.totalMinor)}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                            background: isOverdueRow ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                            color: isOverdueRow ? "#ef4444" : "#f59e0b",
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>{inv.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderFinancialTrends() {
    const cur = state.settings.currency || "AZN";
    const fmtMinor = (minor) => currency((minor || 0) / 100, cur);

    const SEV_COLOR = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
    const SEV_BG = { HIGH: "rgba(239,68,68,0.08)", MEDIUM: "rgba(245,158,11,0.08)", LOW: "rgba(16,185,129,0.08)" };
    const DIR_ICON = { UP: "↑", DOWN: "↓", FLAT: "→", STABLE: "—" };

    if (trendsLoading) {
      return (
        <div className="panel" style={{ marginTop: "var(--space-lg)" }}>
          <div className="panel-head"><div><h3>Trend Comparison</h3><p className="panel-copy">Loading…</p></div></div>
        </div>
      );
    }

    if (trendsError) {
      return (
        <div className="panel" style={{ marginTop: "var(--space-lg)" }}>
          <div className="panel-head"><div><h3>Trend Comparison</h3></div></div>
          <p style={{ color: "var(--danger)", padding: "0 1.5rem 1rem" }}>{trendsError}</p>
        </div>
      );
    }

    if (!trendsData) return null;

    const { summary, trends } = trendsData;

    const fmtPct = (pct) => {
      const sign = pct > 0 ? "+" : "";
      return `${sign}${pct}%`;
    };

    const comparisonCards = [
      {
        label: "Revenue",
        current: fmtMinor(summary.currentRevenueMinor),
        previous: fmtMinor(summary.previousRevenueMinor),
        changePct: summary.revenueChangePercent,
        accent: summary.revenueChangePercent >= 0 ? "#10b981" : "#ef4444",
      },
      {
        label: "Invoice Count",
        current: summary.currentInvoiceCount,
        previous: summary.previousInvoiceCount,
        changePct: summary.invoiceCountChangePercent,
        accent: summary.invoiceCountChangePercent >= 0 ? "#10b981" : "#ef4444",
      },
      {
        label: "New Customers",
        current: summary.currentCustomerCount,
        previous: summary.previousCustomerCount,
        changePct: summary.customerCountChangePercent,
        accent: summary.customerCountChangePercent >= 0 ? "#10b981" : "#ef4444",
      },
      {
        label: "Outstanding",
        current: fmtMinor(summary.currentOutstandingMinor),
        previous: fmtMinor(summary.previousOutstandingMinor),
        changePct: summary.outstandingChangePercent,
        accent: summary.outstandingChangePercent <= 0 ? "#10b981" : "#ef4444",
      },
    ];

    return (
      <div style={{ marginTop: "var(--space-lg)" }}>
        <p className="dash-section-label">Trend Comparison · Last 30 days vs. Previous 30 days</p>

        {/* KPI comparison cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
        }}>
          {comparisonCards.map((card) => (
            <div key={card.label} style={{
              padding: "1.1rem 1.25rem",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.92)",
              borderLeftWidth: 4,
              borderLeftColor: card.accent,
            }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 8 }}>{card.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <strong style={{ fontFamily: "'Bahnschrift','Segoe UI',sans-serif", fontSize: "clamp(1rem,1.4vw,1.35rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{card.current}</strong>
                <span style={{ fontSize: 13, color: card.accent, fontWeight: 700 }}>
                  {DIR_ICON[card.changePct > 0 ? "UP" : card.changePct < 0 ? "DOWN" : "FLAT"]} {fmtPct(card.changePct)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Prev: {card.previous}</div>
            </div>
          ))}
        </div>

        {/* Trend insight cards */}
        {trends.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {trends.map((trend) => (
              <div key={trend.id} style={{
                padding: "1.1rem 1.4rem",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface)",
                border: `1px solid ${SEV_COLOR[trend.severity] ?? "#334155"}`,
                borderLeftWidth: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, color: SEV_COLOR[trend.severity], background: SEV_BG[trend.severity], textTransform: "uppercase", letterSpacing: "0.06em" }}>{trend.severity}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: SEV_COLOR[trend.severity] ?? "var(--muted)", marginRight: 4 }}>{DIR_ICON[trend.direction]}</span>
                  <strong style={{ fontSize: 14, color: "var(--text)" }}>{trend.title}</strong>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6, lineHeight: 1.5 }}>{trend.description}</p>
                <p style={{ fontSize: 12, color: SEV_COLOR[trend.severity] ?? "var(--muted)", fontWeight: 500 }}>Recommendation: {trend.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderProductHub() {
    const hubCompanyName = "Tetavio LLC";
    const LANGS = [
      { code: "az", label: "Azərbaycan dili", flag: "🇦🇿" },
      { code: "en", label: "English", flag: "🇬🇧" },
      { code: "ru", label: "Русский", flag: "🇷🇺" },
      { code: "tr", label: "Türkçe", flag: "🇹🇷" },
      { code: "de", label: "Deutsch", flag: "🇩🇪" }
    ];
    const HUB_T = {
      az: {
        platform: "Məhsul platforması",
        nav: [
          { id: "features", label: "Üstünlüklər" },
          { id: "how", label: "Necə işləyir" },
          { id: "about", label: "Haqqımızda" },
          { id: "pricing", label: "Tariflər" },
          { id: "faq", label: "FAQ" }
        ],
        navContact: "Əlaqə",
        navMenu: "Menyu",
        heroEyebrow: "Cloud accounting SaaS",
        heroTitle: "Mühasibat uçotunu bir paneldən idarə edin",
        heroSubtitle: "Tetavio ilə satış, alış, bank əməliyyatları və maliyyə hesabatlarını real vaxtda idarə edin. Komandanız üçün sürətli, təhlükəsiz və etibarlı mühit qurun.",
        heroTrust: ["Bulud əsaslı giriş", "Lokal bazara uyğun iş axını", "Yüksək sürətli əməliyyat paneli"],
        heroPrimary: "Mühasibat proqramını aç →",
        heroSecondary: "Tariflərə bax",
        heroPanelTitle: "Canlı iş paneli",
        heroPanelHint: "Nümayiş məqsədli göstəricilər",
        featureTitle: "Məhsulun əsas üstünlükləri",
        featureSubtitle: "Gündəlik maliyyə əməliyyatlarını daha sadə və daha dəqiq idarə etmək üçün hazırlanıb.",
        features: [
          { icon: "🧾", title: "Sənəd axını nəzarətdə", text: "Qaimə, faktura və ödəniş axınlarını bir sistemdə izləyin." },
          { icon: "📊", title: "Dəqiq hesabatlar", text: "Mənfəət-zərər, balans və pul axını hesabatları hazır formada." },
          { icon: "🔒", title: "Etibarlı təhlükəsizlik", text: "Rollar üzrə giriş, audit izi və məlumat bütövlüyü nəzarəti." },
          { icon: "⚡", title: "Sürətli istifadə", text: "Komandanız üçün öyrənməsi asan, gündəlik iş üçün çevik interfeys." }
        ],
        howTitle: "Platforma necə işləyir?",
        howSubtitle: "İşə başlamaq üçün uzun inteqrasiya prosesinə ehtiyac yoxdur.",
        howSteps: [
          { title: "Hesab yaradın və şirkəti aktivləşdirin", text: "Şirkət məlumatlarınızı daxil edin və sistem parametrlərini 2-3 addımda tamamlayın." },
          { title: "Satış və alış axınını qurun", text: "Müştəri, təchizatçı, qaimə və fakturaları bir pəncərədən idarə edin." },
          { title: "Əməliyyatları bağlayın və hesabat alın", text: "Maliyyə nəticələrini real vaxtda izləyin və qərarları daha sürətli verin." }
        ],
        aboutTitle: "Haqqımızda",
        aboutText: "Tetavio komandası mühasibat proseslərini sadələşdirmək üçün yerli bazarın gündəlik ehtiyaclarına uyğun cloud platforma qurur. Məqsədimiz şirkətlərə daha az vaxtda daha düzgün maliyyə qərarları verməyə kömək etməkdir.",
        servicesTitle: "Nə təklif edirik?",
        services: ["Mühasibat uçotu və sənəd idarəetməsi", "Satış, alış və bank əməliyyatlarının mərkəzləşmiş idarəsi", "Plan əsaslı istifadə və komanda rolları", "Texniki dəstək və davamlı məhsul yenilənməsi"],
        whyTitle: "Niyə bizi seçməlisiniz?",
        whyCards: [
          { title: "Lokal uyğunluq", text: "Məzmun və əməliyyat məntiqi yerli biznes praktikasına uyğunlaşdırılıb." },
          { title: "Şəffaf tariflər", text: "Bütün planlar aydın qiymət və əməliyyat limiti ilə təqdim olunur." },
          { title: "Komanda üçün hazır", text: "Rollar, icazələr və istifadəçi idarəetməsi ilə böyüməyə uyğundur." }
        ],
        pricingTitle: "Tariflər",
        pricingSubtitle: "Şirkətinizin ölçüsünə uyğun planı seçin. İllik və 1 aylıq rejimlər arasında asan keçid edin.",
        monthly: "1 aylıq",
        annual: "İllik",
        recommended: "Tövsiyə olunan",
        activePlan: "Aktiv plan",
        freePrice: "Pulsuz",
        freeLimit: "5 əməliyyat limiti",
        operationLimitSuffix: "əməliyyat limiti",
        annualDuration: "365 günlük aktiv plan",
        monthlyDuration: "30 günlük aktiv plan",
        annualPriceSuffix: "/ay",
        monthlyPriceSuffix: "/1 ay",
        trustTitle: "Etibar və performans",
        trustItems: [
          { title: "Təhlükəsiz giriş", text: "Rollar üzrə giriş nəzarəti və məlumat müdafiəsi." },
          { title: "Yüksək sürət", text: "Gündəlik əməliyyatlarda gecikməsiz iş axını." },
          { title: "Rahat istifadə", text: "Öyrənməsi asan, komandalar üçün intuitiv interfeys." },
          { title: "Operativ dəstək", text: "Sual və ehtiyaclara sürətli cavab verən dəstək komandası." }
        ],
        faqTitle: "Tez-tez verilən suallar",
        faqs: [
          { q: "Tetavio bulud əsaslı sistemdirmi?", a: "Bəli. Platformaya internet olan istənilən cihazdan daxil ola bilərsiniz." },
          { q: "Free planda limit nə qədərdir?", a: "Free plan başlanğıc istifadə üçün nəzərdə tutulub və 5 əməliyyat limiti təqdim edir." },
          { q: "Planı sonradan dəyişmək mümkündürmü?", a: "Bəli. Hesabınızdan istənilən vaxt daha uyğun plana keçə bilərsiniz." },
          { q: "Komanda üzvləri üçün ayrıca giriş mümkündürmü?", a: "Bəli. Rol əsaslı istifadəçi girişi və icazə idarəetməsi mövcuddur." }
        ],
        ctaTitle: "Mühasibat prosesini bu gün optimallaşdırın",
        ctaText: "Platformaya keçin, uyğun planı seçin və bütün maliyyə axınını vahid sistemdən idarə edin.",
        ctaButton: "Mühasibat proqramını aç →",
        contact: "Əlaqə: info@tetavio.com",
        footerNote: "Tetavio ERP · Cloud Accounting Platform",
        planDescriptions: {
          free: "Başlanğıc istifadə üçün pulsuz plan",
          standard: "Kiçik komandalar üçün baza plan",
          professional: "Daha aktiv əməliyyat axını üçün",
          premium: "Geniş istifadə və yüksək çeviklik üçün",
          elite: "Peşəkar və intensiv istifadəçilər üçün",
          ultimate: "Maksimum səviyyəli xidmət paketi"
        }
      },
      en: {
        platform: "Product platform",
        nav: [
          { id: "features", label: "Features" },
          { id: "how", label: "How it works" },
          { id: "about", label: "About" },
          { id: "pricing", label: "Pricing" },
          { id: "faq", label: "FAQ" }
        ],
        navContact: "Contact",
        navMenu: "Menu",
        heroEyebrow: "Cloud accounting SaaS",
        heroTitle: "Manage accounting from one dashboard",
        heroSubtitle: "With Tetavio, manage sales, purchases, banking operations and financial reports in real time. Build a fast, secure and reliable workflow for your team.",
        heroTrust: ["Cloud access", "Local market fit", "High-speed operations"],
        heroPrimary: "Open Accounting App →",
        heroSecondary: "See pricing",
        heroPanelTitle: "Live dashboard",
        heroPanelHint: "Demo indicators",
        featureTitle: "Core product advantages",
        featureSubtitle: "Built to simplify daily financial operations with better control and accuracy.",
        features: [
          { icon: "🧾", title: "Document flow control", text: "Track invoices, bills and payment flows in one place." },
          { icon: "📊", title: "Accurate reporting", text: "Profit-loss, balance sheet and cash flow reports are ready instantly." },
          { icon: "🔒", title: "Reliable security", text: "Role-based access, audit trail and data integrity control." },
          { icon: "⚡", title: "Fast to use", text: "Easy to learn and efficient for everyday team workflows." }
        ],
        howTitle: "How does the platform work?",
        howSubtitle: "No long integration process required to get started.",
        howSteps: [
          { title: "Create account and activate company", text: "Add company details and finish core settings in a few steps." },
          { title: "Set up sales and purchasing flow", text: "Manage customers, vendors, invoices and bills from one workspace." },
          { title: "Close operations and get reports", text: "Track financial outcomes in real time and make faster decisions." }
        ],
        aboutTitle: "About us",
        aboutText: "The Tetavio team builds cloud accounting tools tailored for local business needs. Our mission is to help companies make better financial decisions in less time.",
        servicesTitle: "What we offer",
        services: ["Accounting and document management", "Centralized sales, purchasing and banking operations", "Plan-based usage and team roles", "Technical support and continuous product updates"],
        whyTitle: "Why choose us?",
        whyCards: [
          { title: "Local fit", text: "Content and business logic are adapted to local operating practices." },
          { title: "Transparent pricing", text: "All plans are shown with clear prices and operation limits." },
          { title: "Team-ready", text: "Role and permission management built for growth." }
        ],
        pricingTitle: "Pricing",
        pricingSubtitle: "Choose a plan that fits your company size. Switch between annual and monthly modes easily.",
        monthly: "1 month",
        annual: "Annual",
        recommended: "Recommended",
        activePlan: "Active plan",
        freePrice: "Free",
        freeLimit: "5 operation limit",
        operationLimitSuffix: "operation limit",
        annualDuration: "365-day active plan",
        monthlyDuration: "30-day active plan",
        annualPriceSuffix: "/month",
        monthlyPriceSuffix: "/1 month",
        trustTitle: "Trust and performance",
        trustItems: [
          { title: "Secure access", text: "Role-based access control and data protection." },
          { title: "High speed", text: "Smooth performance for daily operations." },
          { title: "Easy usage", text: "Intuitive interface for teams." },
          { title: "Responsive support", text: "Fast responses from our support team." }
        ],
        faqTitle: "Frequently asked questions",
        faqs: [
          { q: "Is Tetavio cloud-based?", a: "Yes. You can access the platform from any device with internet." },
          { q: "What is the Free plan limit?", a: "The Free plan is for getting started and includes a 5-operation limit." },
          { q: "Can I change plan later?", a: "Yes. You can switch to another plan anytime." },
          { q: "Can team members have separate access?", a: "Yes. Role-based user access and permissions are available." }
        ],
        ctaTitle: "Optimize accounting today",
        ctaText: "Move to the platform, pick the right plan and manage all financial workflows in one system.",
        ctaButton: "Open Accounting App →",
        contact: "Contact: info@tetavio.com",
        footerNote: "Tetavio ERP · Cloud Accounting Platform",
        planDescriptions: {
          free: "Free starter plan",
          standard: "Base plan for small teams",
          professional: "For more active operations",
          premium: "For broader usage and flexibility",
          elite: "For professional and intensive usage",
          ultimate: "Maximum-level service package"
        }
      },
      ru: {
        platform: "Платформа продуктов",
        nav: [
          { id: "features", label: "Преимущества" },
          { id: "how", label: "Как работает" },
          { id: "about", label: "О нас" },
          { id: "pricing", label: "Тарифы" },
          { id: "faq", label: "FAQ" }
        ],
        navContact: "Контакты",
        navMenu: "Меню",
        heroEyebrow: "Cloud accounting SaaS",
        heroTitle: "Управляйте бухгалтерией из одной панели",
        heroSubtitle: "С Tetavio управляйте продажами, закупками, банковскими операциями и финансовой отчетностью в реальном времени.",
        heroTrust: ["Облачный доступ", "Локальная адаптация", "Высокая скорость"],
        heroPrimary: "Открыть бухгалтерию →",
        heroSecondary: "Смотреть тарифы",
        heroPanelTitle: "Живая панель",
        heroPanelHint: "Демо-показатели",
        featureTitle: "Ключевые преимущества",
        featureSubtitle: "Платформа для упрощения ежедневных финансовых операций.",
        features: [
          { icon: "🧾", title: "Контроль документов", text: "Счета, накладные и оплаты в одной системе." },
          { icon: "📊", title: "Точные отчеты", text: "P&L, баланс и денежный поток в готовом виде." },
          { icon: "🔒", title: "Надежная безопасность", text: "Ролевой доступ, аудит и контроль целостности данных." },
          { icon: "⚡", title: "Быстрая работа", text: "Интерфейс, удобный для ежедневной работы команды." }
        ],
        howTitle: "Как работает платформа?",
        howSubtitle: "Начать можно без длительной интеграции.",
        howSteps: [
          { title: "Создайте аккаунт и активируйте компанию", text: "Заполните данные компании и завершите настройки за несколько шагов." },
          { title: "Настройте продажи и закупки", text: "Управляйте клиентами, поставщиками и документами в одном месте." },
          { title: "Закрывайте операции и получайте отчеты", text: "Отслеживайте результат в реальном времени." }
        ],
        aboutTitle: "О нас",
        aboutText: "Команда Tetavio создает облачную платформу бухгалтерии под локальные бизнес-потребности.",
        servicesTitle: "Что мы предлагаем",
        services: ["Бухучет и управление документами", "Централизованное управление продажами, закупками и банковскими операциями", "Тарифы и командные роли", "Техподдержка и постоянные обновления"],
        whyTitle: "Почему выбирают нас?",
        whyCards: [
          { title: "Локальная адаптация", text: "Логика продукта адаптирована под местную практику." },
          { title: "Прозрачные тарифы", text: "Ясные цены и лимиты операций." },
          { title: "Готово для команды", text: "Роли и права доступа для масштабирования." }
        ],
        pricingTitle: "Тарифы",
        pricingSubtitle: "Выберите план под ваш бизнес. Переключайтесь между годовым и месячным режимом.",
        monthly: "1 месяц",
        annual: "Годовой",
        recommended: "Рекомендуем",
        activePlan: "Активный план",
        freePrice: "Бесплатно",
        freeLimit: "Лимит 5 операций",
        operationLimitSuffix: "лимит операций",
        annualDuration: "План активен 365 дней",
        monthlyDuration: "План активен 30 дней",
        annualPriceSuffix: "/мес",
        monthlyPriceSuffix: "/1 мес",
        trustTitle: "Надежность и производительность",
        trustItems: [
          { title: "Безопасный доступ", text: "Ролевой контроль доступа и защита данных." },
          { title: "Высокая скорость", text: "Плавная работа в ежедневных задачах." },
          { title: "Удобство", text: "Интуитивный интерфейс для команды." },
          { title: "Оперативная поддержка", text: "Быстрые ответы от команды поддержки." }
        ],
        faqTitle: "Частые вопросы",
        faqs: [
          { q: "Tetavio — облачная система?", a: "Да. Доступ возможен с любого устройства с интернетом." },
          { q: "Какой лимит у Free?", a: "Free-план включает 5 операций." },
          { q: "Можно ли сменить план позже?", a: "Да, план можно изменить в любой момент." },
          { q: "Можно ли дать отдельный доступ сотрудникам?", a: "Да, доступ и права настраиваются по ролям." }
        ],
        ctaTitle: "Оптимизируйте бухгалтерию уже сегодня",
        ctaText: "Перейдите на платформу и управляйте всеми финансовыми потоками в одном месте.",
        ctaButton: "Открыть бухгалтерию →",
        contact: "Контакт: info@tetavio.com",
        footerNote: "Tetavio ERP · Cloud Accounting Platform",
        planDescriptions: {
          free: "Бесплатный стартовый план",
          standard: "Базовый план для маленьких команд",
          professional: "Для более активных операций",
          premium: "Для гибкого и широкого использования",
          elite: "Для профессионального и интенсивного использования",
          ultimate: "Максимальный пакет услуг"
        }
      },
      tr: {
        platform: "Ürün platformu",
        nav: [
          { id: "features", label: "Avantajlar" },
          { id: "how", label: "Nasıl çalışır" },
          { id: "about", label: "Hakkımızda" },
          { id: "pricing", label: "Fiyatlar" },
          { id: "faq", label: "SSS" }
        ],
        navContact: "İletişim",
        navMenu: "Menü",
        heroEyebrow: "Cloud accounting SaaS",
        heroTitle: "Muhasebeyi tek panelden yönetin",
        heroSubtitle: "Tetavio ile satış, satın alma, banka işlemleri ve finansal raporları gerçek zamanlı yönetin.",
        heroTrust: ["Bulut erişimi", "Yerel uyum", "Yüksek hız"],
        heroPrimary: "Muhasebe yazılımını aç →",
        heroSecondary: "Fiyatlara bak",
        heroPanelTitle: "Canlı panel",
        heroPanelHint: "Demo göstergeler",
        featureTitle: "Temel avantajlar",
        featureSubtitle: "Günlük finans operasyonlarını daha kolay yönetmek için tasarlandı.",
        features: [
          { icon: "🧾", title: "Belge akışı kontrolü", text: "Fatura ve ödeme akışını tek sistemde izleyin." },
          { icon: "📊", title: "Doğru raporlar", text: "Kâr-zarar, bilanço ve nakit akış raporları hazır." },
          { icon: "🔒", title: "Güvenilir güvenlik", text: "Rol bazlı erişim ve veri bütünlüğü kontrolü." },
          { icon: "⚡", title: "Hızlı kullanım", text: "Ekipler için sezgisel ve verimli arayüz." }
        ],
        howTitle: "Platform nasıl çalışır?",
        howSubtitle: "Başlamak için uzun entegrasyona gerek yok.",
        howSteps: [
          { title: "Hesap oluşturun ve şirketi etkinleştirin", text: "Şirket bilgilerini ekleyin ve ayarları hızlıca tamamlayın." },
          { title: "Satış ve satın alma akışını kurun", text: "Müşteri, tedarikçi ve belgeleri tek yerden yönetin." },
          { title: "İşlemleri kapatın ve rapor alın", text: "Finansal sonuçları anlık izleyin." }
        ],
        aboutTitle: "Hakkımızda",
        aboutText: "Tetavio ekibi yerel iş ihtiyaçlarına uygun bulut muhasebe platformu geliştirir.",
        servicesTitle: "Neler sunuyoruz",
        services: ["Muhasebe ve belge yönetimi", "Satış, satın alma ve banka işlemlerinin merkezi yönetimi", "Plan bazlı kullanım ve ekip rolleri", "Teknik destek ve sürekli güncellemeler"],
        whyTitle: "Neden bizi seçmelisiniz?",
        whyCards: [
          { title: "Yerel uyum", text: "İş akışı yerel uygulamalara uyarlanmıştır." },
          { title: "Şeffaf fiyatlandırma", text: "Net fiyatlar ve işlem limitleri." },
          { title: "Ekip için hazır", text: "Rol ve yetki yönetimiyle ölçeklenebilir." }
        ],
        pricingTitle: "Fiyatlar",
        pricingSubtitle: "Şirketinize uygun planı seçin. Yıllık ve aylık modlar arasında geçiş yapın.",
        monthly: "1 aylık",
        annual: "Yıllık",
        recommended: "Önerilen",
        activePlan: "Aktif plan",
        freePrice: "Ücretsiz",
        freeLimit: "5 işlem limiti",
        operationLimitSuffix: "işlem limiti",
        annualDuration: "365 gün aktif plan",
        monthlyDuration: "30 gün aktif plan",
        annualPriceSuffix: "/ay",
        monthlyPriceSuffix: "/1 ay",
        trustTitle: "Güven ve performans",
        trustItems: [
          { title: "Güvenli erişim", text: "Rol bazlı erişim kontrolü ve veri koruması." },
          { title: "Yüksek hız", text: "Günlük operasyonlarda akıcı performans." },
          { title: "Kolay kullanım", text: "Ekipler için sezgisel arayüz." },
          { title: "Hızlı destek", text: "Destek ekibinden hızlı geri dönüş." }
        ],
        faqTitle: "Sık sorulan sorular",
        faqs: [
          { q: "Tetavio bulut tabanlı mı?", a: "Evet. İnternet olan her cihazdan erişebilirsiniz." },
          { q: "Free plan limiti nedir?", a: "Free plan başlangıç için 5 işlem limiti sunar." },
          { q: "Planı sonradan değiştirebilir miyim?", a: "Evet, planınızı istediğiniz zaman değiştirebilirsiniz." },
          { q: "Ekip üyeleri için ayrı erişim var mı?", a: "Evet, rol bazlı erişim ve yetki yönetimi vardır." }
        ],
        ctaTitle: "Muhasebe sürecinizi bugün optimize edin",
        ctaText: "Platforma geçin ve tüm finans süreçlerini tek sistemde yönetin.",
        ctaButton: "Muhasebe yazılımını aç →",
        contact: "İletişim: info@tetavio.com",
        footerNote: "Tetavio ERP · Cloud Accounting Platform",
        planDescriptions: {
          free: "Başlangıç için ücretsiz plan",
          standard: "Küçük ekipler için temel plan",
          professional: "Daha yoğun işlem akışı için",
          premium: "Geniş kullanım ve esneklik için",
          elite: "Profesyonel ve yoğun kullanım için",
          ultimate: "Maksimum hizmet paketi"
        }
      },
      de: {
        platform: "Produktplattform",
        nav: [
          { id: "features", label: "Vorteile" },
          { id: "how", label: "So funktioniert es" },
          { id: "about", label: "Über uns" },
          { id: "pricing", label: "Preise" },
          { id: "faq", label: "FAQ" }
        ],
        navContact: "Kontakt",
        navMenu: "Menü",
        heroEyebrow: "Cloud accounting SaaS",
        heroTitle: "Buchhaltung in einem Dashboard steuern",
        heroSubtitle: "Mit Tetavio verwalten Sie Verkauf, Einkauf, Bankvorgänge und Finanzberichte in Echtzeit.",
        heroTrust: ["Cloud-Zugriff", "Lokale Anpassung", "Hohe Geschwindigkeit"],
        heroPrimary: "Buchhaltung öffnen →",
        heroSecondary: "Preise ansehen",
        heroPanelTitle: "Live-Dashboard",
        heroPanelHint: "Demo-Kennzahlen",
        featureTitle: "Kernvorteile",
        featureSubtitle: "Für einfachere und präzisere tägliche Finanzabläufe entwickelt.",
        features: [
          { icon: "🧾", title: "Dokumentenfluss im Blick", text: "Rechnungen und Zahlungen in einem System verfolgen." },
          { icon: "📊", title: "Präzise Berichte", text: "GuV, Bilanz und Cashflow-Berichte sofort verfügbar." },
          { icon: "🔒", title: "Zuverlässige Sicherheit", text: "Rollenbasierter Zugriff, Audit-Trail und Datenintegrität." },
          { icon: "⚡", title: "Schnelle Nutzung", text: "Intuitive Oberfläche für tägliche Teamarbeit." }
        ],
        howTitle: "Wie funktioniert die Plattform?",
        howSubtitle: "Sie können ohne lange Integrationsphase starten.",
        howSteps: [
          { title: "Konto erstellen und Unternehmen aktivieren", text: "Unternehmensdaten eingeben und Kerneinstellungen schnell abschließen." },
          { title: "Verkaufs- und Einkaufsfluss aufsetzen", text: "Kunden, Lieferanten und Dokumente zentral verwalten." },
          { title: "Vorgänge abschließen und Berichte erhalten", text: "Finanzergebnisse in Echtzeit verfolgen." }
        ],
        aboutTitle: "Über uns",
        aboutText: "Das Tetavio-Team entwickelt eine Cloud-Buchhaltungsplattform für lokale Geschäftsanforderungen.",
        servicesTitle: "Was wir anbieten",
        services: ["Buchhaltung und Dokumentenmanagement", "Zentrale Verwaltung von Verkauf, Einkauf und Bankvorgängen", "Planbasierte Nutzung und Teamrollen", "Technischer Support und kontinuierliche Updates"],
        whyTitle: "Warum uns wählen?",
        whyCards: [
          { title: "Lokale Eignung", text: "Inhalte und Logik sind an lokale Praxis angepasst." },
          { title: "Transparente Preise", text: "Klare Preise und Operationslimits in allen Plänen." },
          { title: "Teamfähig", text: "Rollen und Rechte für Wachstum und Skalierung." }
        ],
        pricingTitle: "Preise",
        pricingSubtitle: "Wählen Sie den passenden Plan für Ihr Unternehmen. Wechseln Sie einfach zwischen jährlich und monatlich.",
        monthly: "1 Monat",
        annual: "Jährlich",
        recommended: "Empfohlen",
        activePlan: "Aktiver Plan",
        freePrice: "Kostenlos",
        freeLimit: "5 Vorgänge Limit",
        operationLimitSuffix: "Vorgänge Limit",
        annualDuration: "365 Tage aktiv",
        monthlyDuration: "30 Tage aktiv",
        annualPriceSuffix: "/Monat",
        monthlyPriceSuffix: "/1 Monat",
        trustTitle: "Vertrauen und Leistung",
        trustItems: [
          { title: "Sicherer Zugriff", text: "Rollenbasierter Zugriff und Datenschutz." },
          { title: "Hohe Geschwindigkeit", text: "Flüssige Performance im Tagesgeschäft." },
          { title: "Einfache Nutzung", text: "Intuitive Oberfläche für Teams." },
          { title: "Schneller Support", text: "Schnelle Antworten vom Support-Team." }
        ],
        faqTitle: "Häufige Fragen",
        faqs: [
          { q: "Ist Tetavio cloudbasiert?", a: "Ja. Zugriff ist von jedem Gerät mit Internet möglich." },
          { q: "Was ist das Free-Limit?", a: "Der Free-Plan enthält ein Limit von 5 Vorgängen." },
          { q: "Kann ich später den Plan wechseln?", a: "Ja, ein Planwechsel ist jederzeit möglich." },
          { q: "Gibt es separaten Zugang für Teammitglieder?", a: "Ja, rollenbasierter Zugang und Rechteverwaltung sind verfügbar." }
        ],
        ctaTitle: "Optimieren Sie Ihre Buchhaltung noch heute",
        ctaText: "Wechseln Sie auf die Plattform und steuern Sie alle Finanzprozesse zentral.",
        ctaButton: "Buchhaltung öffnen →",
        contact: "Kontakt: info@tetavio.com",
        footerNote: "Tetavio ERP · Cloud Accounting Platform",
        planDescriptions: {
          free: "Kostenloser Einstiegsplan",
          standard: "Basisplan für kleine Teams",
          professional: "Für aktivere Abläufe",
          premium: "Für breite Nutzung und Flexibilität",
          elite: "Für professionelle und intensive Nutzung",
          ultimate: "Maximales Servicepaket"
        }
      }
    };
    const activeLang = LANGS.find((l) => l.code === hubLang) || LANGS[0];
    const t = HUB_T[hubLang] || HUB_T.az;
    const planDescriptions = t.planDescriptions || HUB_T.az.planDescriptions;
    const ownerEmail = currentUser ? getAccountOwnerEmail(currentUser) : "";
    const ownerUser = ownerEmail ? (authUsers.find((user) => user.email === ownerEmail) || currentUser) : null;
    const currentPlanId = ownerUser?.subscription?.planId || "free";
    const currentPlanCycle = ownerUser?.subscription?.billingCycle === "monthly" ? "monthly" : "annual";
    const publicPlans = getPublicPlans();

    const scrollToSection = (sectionId) => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setHubNavOpen(false);
      setHubLangOpen(false);
    };

    const getHubPriceLabel = (plan) => {
      if (plan.id === "free") return t.freePrice;
      if (hubBillingCycle === "annual") return `$${getPlanPrice(plan, "annual")}${t.annualPriceSuffix}`;
      return `$${getPlanPrice(plan, "monthly")}${t.monthlyPriceSuffix}`;
    };

    const getHubPlanDuration = (plan) => {
      if (plan.id === "free") return t.freeLimit;
      return hubBillingCycle === "annual" ? t.annualDuration : t.monthlyDuration;
    };

    return (
      <div className="ph-shell" onClick={() => { if (hubLangOpen) setHubLangOpen(false); if (hubNavOpen) setHubNavOpen(false); }}>
        <header className="ph-topbar">
          <div className="ph-topbar-inner">
            <div className="lp-brand">
              <div className="lp-brand-icon">
                <img src={logoSrc} alt="Tetavio" className="app-logo" />
              </div>
              <div>
                <strong>Tetavio</strong>
                <span>{t.platform}</span>
              </div>
            </div>
            <div className="ph-topbar-right">
              <nav className="ph-nav-links" aria-label="Ana səhifə bölmələri">
                {t.nav.map((item) => (
                  <button key={item.id} type="button" className="ph-nav-link" onClick={() => scrollToSection(item.id)}>
                    {item.label}
                  </button>
                ))}
              </nav>
              <button className="ph-mobile-menu-btn" type="button" aria-expanded={hubNavOpen} aria-controls="ph-mobile-nav" onClick={(e) => { e.stopPropagation(); setHubNavOpen((current) => !current); }}>
                <span>{t.navMenu}</span>
                <span className="ph-mobile-menu-icon" aria-hidden="true">{hubNavOpen ? "✕" : "☰"}</span>
              </button>
              <div className="ph-lang-wrap" onClick={(e) => e.stopPropagation()}>
                <button className="ph-lang-btn" type="button" onClick={() => setHubLangOpen((o) => !o)}>
                  <span>{activeLang.flag}</span>
                  <span>{activeLang.code.toUpperCase()}</span>
                  <span className="ph-lang-chevron">{hubLangOpen ? "▲" : "▼"}</span>
                </button>
                {hubLangOpen && (
                  <div className="ph-lang-dropdown">
                    {LANGS.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        className={`ph-lang-option${l.code === hubLang ? " ph-lang-option-active" : ""}`}
                        onClick={() => { setHubLang(l.code); setHubLangOpen(false); }}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="ph-company-pill">
                <span className="ph-company-dot" />
                <span>{hubCompanyName}</span>
              </div>
            </div>
          </div>
          <div className={`ph-mobile-nav ${hubNavOpen ? "open" : ""}`} id="ph-mobile-nav" onClick={(e) => e.stopPropagation()}>
            <div className="ph-mobile-nav-links">
              {t.nav.map((item) => (
                <button key={item.id} type="button" onClick={() => scrollToSection(item.id)}>{item.label}</button>
              ))}
              <button type="button" onClick={() => scrollToSection("contact")}>{t.navContact}</button>
            </div>
          </div>
        </header>

        <section className="ph-hero" data-ph-reveal>
          <div className="ph-eyebrow">{t.heroEyebrow}</div>
          <div className="ph-hero-grid">
            <div>
              <h1 className="ph-headline">{t.heroTitle}</h1>
              <p className="ph-subtitle">{t.heroSubtitle}</p>
              <div className="ph-hero-cta-row">
                <button className="ph-btn-primary" type="button" onClick={() => { setActiveProduct("booksLanding"); setBooksView("home"); setBooksNotice(""); }}>
                  {t.heroPrimary}
                </button>
                <button className="ph-btn-secondary" type="button" onClick={() => scrollToSection("pricing")}>{t.heroSecondary}</button>
              </div>
              <div className="ph-trust-pills">
                {t.heroTrust.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
            <aside className="ph-hero-panel" aria-label="Dashboard önizləməsi">
              <div className="ph-hero-panel-head">
                <strong>{t.heroPanelTitle}</strong>
                <span>{t.heroPanelHint}</span>
              </div>
              <div className="ph-hero-metrics">
                {animatedPreviewStats.map((item) => (
                  <article key={item.label}>
                    <span>{item.label}</span>
                    <strong>{formatPreviewMetric(item.value)}</strong>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="features" className="ph-section" data-ph-reveal>
          <div className="ph-section-head">
            <h2>{t.featureTitle}</h2>
            <p>{t.featureSubtitle}</p>
          </div>
          <div className="ph-feature-grid">
            {t.features.map((feature) => (
              <article key={feature.title} className="ph-feature-card" data-ph-reveal>
                <span className="ph-feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="ph-section" data-ph-reveal>
          <div className="ph-section-head">
            <h2>{t.howTitle}</h2>
            <p>{t.howSubtitle}</p>
          </div>
          <div className="ph-step-grid">
            {t.howSteps.map((step, index) => (
              <article key={step.title} className="ph-step-card" data-ph-reveal>
                <span className="ph-step-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="ph-section ph-about" data-ph-reveal>
          <article className="ph-about-card">
            <h2>{t.aboutTitle}</h2>
            <p>{t.aboutText}</p>
          </article>
          <article className="ph-about-card">
            <h2>{t.servicesTitle}</h2>
            <ul className="ph-list">
              {t.services.map((service) => <li key={service}>{service}</li>)}
            </ul>
          </article>
        </section>

        <section className="ph-section" data-ph-reveal>
          <div className="ph-section-head">
            <h2>{t.whyTitle}</h2>
          </div>
          <div className="ph-why-grid">
            {t.whyCards.map((item) => (
              <article key={item.title} className="ph-why-card" data-ph-reveal>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="ph-section" data-ph-reveal>
          <div className="ph-section-head">
            <h2>{t.pricingTitle}</h2>
            <p>{t.pricingSubtitle}</p>
          </div>
          <div className="ph-pricing-toggle" role="tablist" aria-label="Tarif periodu">
            <button className={hubBillingCycle === "annual" ? "ph-toggle-btn active" : "ph-toggle-btn"} type="button" onClick={() => setHubBillingCycle("annual")}>{t.annual}</button>
            <button className={hubBillingCycle === "monthly" ? "ph-toggle-btn active" : "ph-toggle-btn"} type="button" onClick={() => setHubBillingCycle("monthly")}>{t.monthly}</button>
          </div>
          <div className="ph-pricing-grid">
            {publicPlans.map((plan) => {
              const isRecommended = plan.id === "professional";
              const isActive = currentPlanId === plan.id && (currentPlanCycle === hubBillingCycle || currentPlanCycle === "demo");
              return (
                <article key={plan.id} className={`ph-price-card${isRecommended ? " recommended" : ""}${isActive ? " active" : ""}`} data-ph-reveal>
                  <div className="ph-price-head">
                    <strong>{plan.name}</strong>
                    {isRecommended ? <span className="ph-price-badge">{t.recommended}</span> : null}
                    {isActive && plan.id !== "free" ? <span className="ph-price-badge ph-price-badge-active">{t.activePlan}</span> : null}
                  </div>
                  <p className="ph-price-value">{getHubPriceLabel(plan)}</p>
                  <p className="ph-price-copy">{planDescriptions[plan.id]}</p>
                  <ul className="ph-list ph-list-tight">
                    <li>{plan.id === "free" ? t.freeLimit : `${Number(plan.operationLimit).toLocaleString("en-US")} ${t.operationLimitSuffix}`}</li>
                    <li>{getHubPlanDuration(plan)}</li>
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="ph-section" data-ph-reveal>
          <div className="ph-section-head">
            <h2>{t.trustTitle}</h2>
          </div>
          <div className="ph-trust-grid">
            {t.trustItems.map((item) => (
              <article key={item.title} className="ph-trust-card" data-ph-reveal>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="ph-section" data-ph-reveal>
          <div className="ph-section-head">
            <h2>{t.faqTitle}</h2>
          </div>
          <div className="ph-faq-grid">
            {t.faqs.map((item) => (
              <details key={item.q} className="ph-faq-item" data-ph-reveal>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contact" className="ph-section" data-ph-reveal>
          <article className="ph-cta-card">
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaText}</p>
            <div className="ph-hero-cta-row">
              <button className="ph-btn-primary" type="button" onClick={() => { setActiveProduct("booksLanding"); setBooksView("home"); setBooksNotice(""); }}>
                {t.ctaButton}
              </button>
              <a className="ph-contact-link" href="mailto:info@tetavio.com">{t.contact}</a>
            </div>
          </article>
        </section>

        <footer className="ph-footer" data-ph-reveal>
          <div className="ph-footer-links">
            <button type="button" onClick={() => scrollToSection("about")}>{t.nav.find((item) => item.id === "about")?.label || "About"}</button>
            <button type="button" onClick={() => scrollToSection("pricing")}>{t.nav.find((item) => item.id === "pricing")?.label || "Pricing"}</button>
            <button type="button" onClick={() => scrollToSection("faq")}>{t.nav.find((item) => item.id === "faq")?.label || "FAQ"}</button>
            <button type="button" onClick={() => scrollToSection("contact")}>{t.navContact}</button>
            {COMPLIANCE_LEGAL_PAGES.map((page) => (
              <button key={page.id} type="button" onClick={() => openBooksLegalPage(page.id)}>{page.title}</button>
            ))}
          </div>
          <small>{t.footerNote}</small>
        </footer>
      </div>
    );
  }

  async function submitSignIn(event) {
    event.preventDefault();
    try {
      const email = String(authDraft.email || "").trim().toLowerCase();
      const response = await apiLogin(email, authDraft.password);
      const session = {
        accessToken: response?.tokens?.accessToken,
        refreshToken: response?.tokens?.refreshToken,
      };

      updateBackendSession(session);
      await syncBackendSubscription(session);

      setBooksNotice("Uğurla daxil oldunuz.");
      setActiveProduct("books");
      setBooksView("home");
    } catch (error) {
      setBooksNotice(error?.message || "Giriş alınmadı. Yenidən yoxlayın.");
    }
  }

  async function submitSignUp(event) {
    event.preventDefault();
    const email = String(authDraft.email || "").trim().toLowerCase();
    if (!authDraft.fullName || !email || !authDraft.password) {
      setBooksNotice("Qeydiyyat üçün bütün sahələri doldurun.");
      return;
    }

    try {
      const response = await apiRegister({
        fullName: authDraft.fullName,
        email,
        password: authDraft.password,
      });

      const session = {
        accessToken: response?.tokens?.accessToken,
        refreshToken: response?.tokens?.refreshToken,
      };

      updateBackendSession(session);
      await syncBackendSubscription(session);

      setBooksNotice("Qeydiyyat tamamlandı və Free plan aktiv edildi.");
      setActiveProduct("books");
      setBooksView("home");
    } catch (error) {
      setBooksNotice(error?.message || "Qeydiyyat alınmadı. Yenidən yoxlayın.");
    }
  }

  function submitDemoRequest(event) {
    event.preventDefault();
    if (!demoDraft.companyName || !demoDraft.fullName || !demoDraft.email) {
      setBooksNotice("Demo sorğusu üçün bütün sahələri doldurun.");
      return;
    }
    setBooksNotice("Demo sorğunuz qəbul edildi. Növbəti mərhələdə bu axını dərinləşdirəcəyik.");
    setBooksView("home");
    setDemoDraft({ companyName: "", fullName: "", email: "" });
  }

  function submitPasswordChange(event) {
    event.preventDefault();
    setPasswordDraft((draft) => ({
      ...draft,
      current: "",
      next: "",
      confirm: "",
      notice: "Parol dəyişikliyi yalnız backend endpoint-i əlavə edildikdən sonra aktiv ediləcək.",
      tone: "warning",
    }));
  }

  async function logoutUser() {
    if (!window.confirm("Sistemdən çıxmaq istədiyinizə əminsiniz?")) return;
    if (backendSession?.refreshToken) {
      try {
        await apiLogout(backendSession.refreshToken);
      } catch {
        // ignore logout errors on client side
      }
    }
    updateBackendSession(null);
    setBackendSubscription(null);
    setBackendOrders([]);
    setBackendPlans([]);
    setCheckoutResult(null);
    setCurrentUser(null);
    setProfileMenuOpen(false);
    setState(normalizeAppState(createResetData()));
    setActiveSection("home");
    setActiveModule(null);
    setActiveProduct("booksLanding");
    setBooksView("signin");
    setBooksNotice("Çıxış edildi. Yenidən daxil ola bilərsiniz.");
  }

  function getValidResetRequest(token) {
    const now = Date.now();
    return resetRequests.find((request) => request.token === token && !request.usedAt && Number(request.expiresAt || 0) > now);
  }

  function legacySubmitForgotPassword(event) {
    event.preventDefault();
    setBooksNotice("Parol bərpası lokal olaraq saxlanılmır. Bu funksiya backend üzərindən ayrıca aktiv edilməlidir.");
  }

  function submitForgotPassword(event) {
    event.preventDefault();
    setBooksNotice("Parol bərpası backend üzərindən aktiv edilməlidir. Local reset token saxlanması söndürülüb.");
  }

  function submitResetPassword(event) {
    event.preventDefault();
    setResetDraft({ password: "", confirmPassword: "" });
    setActiveResetToken("");
    setBooksNotice("Local reset axını söndürülüb. Şifrə yeniləmə backend endpoint-i ilə təmin olunmalıdır.");
  }

  function renderBooksLanding() {
    const landingRoute = getBooksLandingRouteDetails();
    const directLegalPage = landingRoute.legalPage;
    const legalPage = directLegalPage || COMPLIANCE_LEGAL_PAGES.find((page) => page.id === booksView) || null;
    const isLegalView = Boolean(legalPage);
    const isAuthView = booksView === "signin" || booksView === "signup";
    const authSectionExpanded = BOOKS_LANDING_AUTH_VIEWS.includes(booksView);
    const LANGS = [
      { code: "az", label: "Azərbaycan dili", flag: "🇦🇿" },
      { code: "en", label: "English",          flag: "🇬🇧" },
      { code: "ru", label: "Русский",          flag: "🇷🇺" },
      { code: "tr", label: "Türkçe",           flag: "🇹🇷" },
      { code: "de", label: "Deutsch",          flag: "🇩🇪" },
    ];
    const LP_T = {
      az: {
        brandSub:        "Mühasibat Proqramı",
        backHome:        "← Geri",
        navProducts:     "Ana səhifə",
        navSignin:       "Daxil ol",
        navSignup:       "İndi qeydiyyatdan keç →",
        eyebrow:         "Mühasibat proqramı",
        headline1:       "Maliyyəni daha",
        headline2:       "sürətli idarə edin",
        subtitle:        "Satış, alış, əməliyyatlar və hesabatlar bir platformada. Tetavio ilə biznesinizi tam nəzarət altında saxlayın.",
        ctaPrimary:      "Pulsuz sınağı başlat",
        ctaGhost:        "Daxil ol →",
        pills:           ["📊 Hesabatlar", "🧾 Fakturalar", "🏦 Bank", "📦 Mal uçotu", "⚡ Real vaxt"],
        statsTitle:      "Canlı statistika",
        statsSub:        "Nümayiş göstəriciləri",
        liveBadge:       "● Canlı",
        statsNote:       "Sayğaclar hər dəqiqə yenilənir · Yalnız nümayiş məqsədi daşıyır",
        highlights: [
          { icon: "🔐", title: "Rol əsaslı giriş",       desc: "Mühasib, admin, anbardar — hər rola ayrıca icazə" },
          { icon: "☁️", title: "Bulud əsaslı",            desc: "Hər cihazdan daxil olun, məlumatlarınız həmişə sinxrondadır" },
          { icon: "📈", title: "Real vaxt hesabatlar", desc: "Maliyyə vəziyyətinizi anlıq izləyin" },
          { icon: "⚡", title: "Sürətli giriş",        desc: "Saniyələr içində işə başlayın" },
        ],
        authInfoTitle:   "Mühasibat proqramı\ngiriş paneli",
        authInfoDesc:    "Daxil ol etdikdən sonra birbaşa Tetavio mühasibat proqramına daxil olacaqsınız. Qeydiyyat yeni hesab yaradır.",
        bullets:         ["✓ Pulsuz plan mövcuddur", "✓ 14 günlük demo müddəti", "✓ Bulud əsaslı məlumat saxlaması"],
        tabSignin:       "Daxil ol",
        tabSignup:       "Qeydiyyat",
        fEmail:          "E-poçt",
        fPassword:       "Şifrə",
        fRemember:       "Məni xatırla",
        fForgot:         "Parolu unutdun?",
        fSigninBtn:      "Daxil ol →",
        fFullName:       "Ad və soyad",
        fEntityType:     "Şəxs növü",
        fEntityIndiv:    "Fiziki şəxs",
        fEntityLegal:    "Hüquqi şəxs",
        fTaxId:          "VÖEN",
        fOwnerName:      "Sahibkar adı",
        fCompanyName:    "Şirkət adı",
        fPhone:          "Mobil nömrə",
        fPlan:           "Plan",
        fPlanDemo:       "14 günlük Demo",
        fSignupBtn:      "Hesab yarat →",
        fForgotBack:     "← Girişə qayıt",
        fForgotTitle:    "Parol bərpası",
        fForgotHint:     "Qeydiyyatdan keçdiyiniz e-poçtu yazın. Bərpa məlumatı e-poçtunuza göndəriləcək.",
        fForgotBtn:      "Parolu göndər →",
        fResetBack:      "← Girişə qayıt",
        fResetTitle:     "Şifrəni yenilə",
        fNewPass:        "Yeni şifrə",
        fConfirmPass:    "Yeni şifrəni təkrar et",
        fResetBtn:       "Şifrəni yenilə →",
        fDemoTitle:      "Demo sorğusu",
        fDemoCompany:    "Şirkət adı",
        fDemoPerson:     "Əlaqəli şəxs",
        fDemoBtn:        "Sorğu göndər →",
      },
      en: {
        brandSub:        "Accounting Software",
        backHome:        "← Back",
        navProducts:     "Homepage",
        navSignin:       "Sign in",
        navSignup:       "Register now →",
        eyebrow:         "Accounting software",
        headline1:       "Manage your finances",
        headline2:       "faster than ever",
        subtitle:        "Sales, purchases, transactions and reports in one platform. Keep your business under full control with Tetavio.",
        ctaPrimary:      "Start free trial",
        ctaGhost:        "Sign in →",
        pills:           ["📊 Reports", "🧾 Invoices", "🏦 Banking", "📦 Inventory", "⚡ Real-time"],
        statsTitle:      "Live statistics",
        statsSub:        "Demo indicators",
        liveBadge:       "● Live",
        statsNote:       "Counters update every minute · For demonstration purposes only",
        highlights: [
          { icon: "🔐", title: "Role-based access",  desc: "Accountant, admin, warehouse — each role has its own permissions" },
          { icon: "☁️", title: "Cloud-based",       desc: "Access from any device, your data is always in sync" },
          { icon: "📈", title: "Real-time reports", desc: "Monitor your financial status instantly" },
          { icon: "⚡", title: "Fast access",       desc: "Get started in seconds" },
        ],
        authInfoTitle:   "Accounting software\nlogin panel",
        authInfoDesc:    "After signing in you will be taken directly to the Tetavio accounting app. Registration creates a new account.",
        bullets:         ["✓ Free plan available", "✓ 14-day demo period", "✓ Cloud-based data storage"],
        tabSignin:       "Sign in",
        tabSignup:       "Register",
        fEmail:          "Email",
        fPassword:       "Password",
        fRemember:       "Remember me",
        fForgot:         "Forgot password?",
        fSigninBtn:      "Sign in →",
        fFullName:       "Full name",
        fEntityType:     "Person type",
        fEntityIndiv:    "Individual",
        fEntityLegal:    "Legal entity",
        fTaxId:          "Tax ID",
        fOwnerName:      "Owner name",
        fCompanyName:    "Company name",
        fPhone:          "Mobile number",
        fPlan:           "Plan",
        fPlanDemo:       "14-day Demo",
        fSignupBtn:      "Create account →",
        fForgotBack:     "← Back to sign in",
        fForgotTitle:    "Password recovery",
        fForgotHint:     "Enter the email you registered with. Recovery instructions will be sent to your email.",
        fForgotBtn:      "Send recovery →",
        fResetBack:      "← Back to sign in",
        fResetTitle:     "Reset password",
        fNewPass:        "New password",
        fConfirmPass:    "Confirm new password",
        fResetBtn:       "Reset password →",
        fDemoTitle:      "Demo request",
        fDemoCompany:    "Company name",
        fDemoPerson:     "Contact person",
        fDemoBtn:        "Send request →",
      },
      ru: {
        brandSub:        "Бухгалтерское ПО",
        backHome:        "← Назад",
        navProducts:     "Главная",
        navSignin:       "Войти",
        navSignup:       "Зарегистрироваться →",
        eyebrow:         "Бухгалтерское ПО",
        headline1:       "Управляйте финансами",
        headline2:       "быстрее и проще",
        subtitle:        "Продажи, закупки, операции и отчёты в одной платформе. Держите бизнес под полным контролем с Tetavio.",
        ctaPrimary:      "Начать бесплатно",
        ctaGhost:        "Войти →",
        pills:           ["📊 Отчёты", "🧾 Счета", "🏦 Банк", "📦 Учёт товаров", "⚡ Реал. время"],
        statsTitle:      "Живая статистика",
        statsSub:        "Демонстрационные показатели",
        liveBadge:       "● Онлайн",
        statsNote:       "Счётчики обновляются каждую минуту · Только для демонстрации",
        highlights: [
          { icon: "🔐", title: "Супер-админ",          desc: "Полный доступ доступен отдельно" },
          { icon: "💾", title: "Desktop-версия",        desc: "Локальные данные с поддержкой backup/restore" },
          { icon: "📈", title: "Отчёты в реал. времени", desc: "Следите за финансами мгновенно" },
          { icon: "⚡", title: "Быстрый вход",          desc: "Начните работу за секунды" },
        ],
        authInfoTitle:   "Бухгалтерское ПО\nпанель входа",
        authInfoDesc:    "После входа вы попадёте прямо в бухгалтерское приложение Tetavio. Регистрация создаёт новый аккаунт.",
        bullets:         ["✓ Бесплатный план доступен", "✓ 14-дневный демо-период", "✓ Облачное хранение данных"],
        tabSignin:       "Войти",
        tabSignup:       "Регистрация",
        fEmail:          "E-mail",
        fPassword:       "Пароль",
        fRemember:       "Запомнить меня",
        fForgot:         "Забыли пароль?",
        fSigninBtn:      "Войти →",
        fFullName:       "Имя и фамилия",
        fEntityType:     "Тип лица",
        fEntityIndiv:    "Физическое лицо",
        fEntityLegal:    "Юридическое лицо",
        fTaxId:          "ИНН",
        fOwnerName:      "Имя ИП",
        fCompanyName:    "Название компании",
        fPhone:          "Мобильный номер",
        fPlan:           "Тариф",
        fPlanDemo:       "14-дневный Demo",
        fSignupBtn:      "Создать аккаунт →",
        fForgotBack:     "← Назад ко входу",
        fForgotTitle:    "Восстановление пароля",
        fForgotHint:     "Введите e-mail, с которым вы зарегистрировались. Инструкции будут отправлены на него.",
        fForgotBtn:      "Отправить →",
        fResetBack:      "← Назад ко входу",
        fResetTitle:     "Сбросить пароль",
        fNewPass:        "Новый пароль",
        fConfirmPass:    "Подтвердите новый пароль",
        fResetBtn:       "Сбросить пароль →",
        fDemoTitle:      "Запрос демо",
        fDemoCompany:    "Название компании",
        fDemoPerson:     "Контактное лицо",
        fDemoBtn:        "Отправить запрос →",
      },
      tr: {
        brandSub:        "Muhasebe Yazılımı",
        backHome:        "← Geri",
        navProducts:     "Ana sayfa",
        navSignin:       "Giriş yap",
        navSignup:       "Hemen kayıt ol →",
        eyebrow:         "Muhasebe yazılımı",
        headline1:       "Finanslarınızı daha",
        headline2:       "hızlı yönetin",
        subtitle:        "Satış, satın alma, işlemler ve raporlar tek platformda. Tetavio ile işletmenizi tam kontrolde tutun.",
        ctaPrimary:      "Ücretsiz deneyin",
        ctaGhost:        "Giriş yap →",
        pills:           ["📊 Raporlar", "🧾 Faturalar", "🏦 Banka", "📦 Stok", "⚡ Gerçek zamanlı"],
        statsTitle:      "Canlı istatistikler",
        statsSub:        "Demo göstergeleri",
        liveBadge:       "● Canlı",
        statsNote:       "Sayaçlar her dakika güncellenir · Yalnızca tanıtım amaçlıdır",
        highlights: [
          { icon: "🔐", title: "Süper yönetici",      desc: "Tam yetkili giriş ayrıca mevcuttur" },
          { icon: "💾", title: "Masaüstü uyumlu",     desc: "Yerel veriler ve yedek/geri yükleme desteği" },
          { icon: "📈", title: "Gerçek zamanlı rapor", desc: "Mali durumunuzu anında takip edin" },
          { icon: "⚡", title: "Hızlı erişim",         desc: "Saniyeler içinde çalışmaya başlayın" },
        ],
        authInfoTitle:   "Muhasebe yazılımı\ngiriş paneli",
        authInfoDesc:    "Giriş yaptıktan sonra doğrudan Tetavio muhasebe uygulamasına yönlendirileceksiniz. Kayıt yeni bir hesap oluşturur.",
        bullets:         ["✓ Ücretsiz plan mevcut", "✓ 14 günlük demo süresi", "✓ Bulut tabanlı veri depolama"],
        tabSignin:       "Giriş yap",
        tabSignup:       "Kayıt ol",
        fEmail:          "E-posta",
        fPassword:       "Şifre",
        fRemember:       "Beni hatırla",
        fForgot:         "Şifremi unuttum?",
        fSigninBtn:      "Giriş yap →",
        fFullName:       "Ad ve soyad",
        fEntityType:     "Kişi türü",
        fEntityIndiv:    "Gerçek kişi",
        fEntityLegal:    "Tüzel kişi",
        fTaxId:          "Vergi No",
        fOwnerName:      "İşletme adı",
        fCompanyName:    "Şirket adı",
        fPhone:          "Cep telefonu",
        fPlan:           "Plan",
        fPlanDemo:       "14 günlük Demo",
        fSignupBtn:      "Hesap oluştur →",
        fForgotBack:     "← Girişe dön",
        fForgotTitle:    "Şifre kurtarma",
        fForgotHint:     "Kayıtlı e-postanızı girin. Kurtarma talimatları e-postanıza gönderilecektir.",
        fForgotBtn:      "Gönder →",
        fResetBack:      "← Girişe dön",
        fResetTitle:     "Şifre sıfırla",
        fNewPass:        "Yeni şifre",
        fConfirmPass:    "Yeni şifreyi onayla",
        fResetBtn:       "Şifreyi sıfırla →",
        fDemoTitle:      "Demo talebi",
        fDemoCompany:    "Şirket adı",
        fDemoPerson:     "İlgili kişi",
        fDemoBtn:        "Talep gönder →",
      },
      de: {
        brandSub:        "Buchhaltungssoftware",
        backHome:        "← Zurück",
        navProducts:     "Startseite",
        navSignin:       "Anmelden",
        navSignup:       "Jetzt registrieren →",
        eyebrow:         "Buchhaltungssoftware",
        headline1:       "Finanzen schneller",
        headline2:       "verwalten",
        subtitle:        "Verkauf, Einkauf, Transaktionen und Berichte auf einer Plattform. Behalten Sie Ihr Unternehmen mit Tetavio vollständig im Griff.",
        ctaPrimary:      "Kostenlos testen",
        ctaGhost:        "Anmelden →",
        pills:           ["📊 Berichte", "🧾 Rechnungen", "🏦 Banking", "📦 Warenbestand", "⚡ Echtzeit"],
        statsTitle:      "Live-Statistiken",
        statsSub:        "Demo-Kennzahlen",
        liveBadge:       "● Live",
        statsNote:       "Zähler werden jede Minute aktualisiert · Nur zu Demonstrationszwecken",
        highlights: [
          { icon: "🔐", title: "Super-Admin",         desc: "Vollzugriff separat verfügbar" },
          { icon: "💾", title: "Desktop-kompatibel",  desc: "Lokale Daten mit Backup/Restore-Unterstützung" },
          { icon: "📈", title: "Echtzeit-Berichte",   desc: "Finanzlage sofort überwachen" },
          { icon: "⚡", title: "Schneller Zugriff",   desc: "In Sekunden loslegen" },
        ],
        authInfoTitle:   "Buchhaltungssoftware\nAnmeldepanel",
        authInfoDesc:    "Nach der Anmeldung gelangen Sie direkt zur Tetavio-Buchhaltungsapp. Die Registrierung erstellt ein neues Konto.",
        bullets:         ["✓ Kostenloser Plan verfügbar", "✓ 14-tägige Demo-Periode", "✓ Cloud-basierte Datenspeicherung"],
        tabSignin:       "Anmelden",
        tabSignup:       "Registrieren",
        fEmail:          "E-Mail",
        fPassword:       "Passwort",
        fRemember:       "Angemeldet bleiben",
        fForgot:         "Passwort vergessen?",
        fSigninBtn:      "Anmelden →",
        fFullName:       "Vor- und Nachname",
        fEntityType:     "Personentyp",
        fEntityIndiv:    "Natürliche Person",
        fEntityLegal:    "Juristische Person",
        fTaxId:          "Steuernummer",
        fOwnerName:      "Inhabername",
        fCompanyName:    "Firmenname",
        fPhone:          "Mobilnummer",
        fPlan:           "Tarif",
        fPlanDemo:       "14-tägige Demo",
        fSignupBtn:      "Konto erstellen →",
        fForgotBack:     "← Zurück zur Anmeldung",
        fForgotTitle:    "Passwort zurücksetzen",
        fForgotHint:     "Geben Sie Ihre registrierte E-Mail ein. Wiederherstellungsanweisungen werden an Ihre E-Mail gesendet.",
        fForgotBtn:      "Senden →",
        fResetBack:      "← Zurück zur Anmeldung",
        fResetTitle:     "Passwort zurücksetzen",
        fNewPass:        "Neues Passwort",
        fConfirmPass:    "Neues Passwort bestätigen",
        fResetBtn:       "Passwort zurücksetzen →",
        fDemoTitle:      "Demo-Anfrage",
        fDemoCompany:    "Firmenname",
        fDemoPerson:     "Ansprechpartner",
        fDemoBtn:        "Anfrage senden →",
      },
    };
    const activeLang = LANGS.find((l) => l.code === hubLang) || LANGS[0];
    const t = LP_T[hubLang] || LP_T.az;

    function goAuth(view) {
      setBooksView(view);
      setBooksNotice("");
      setShowPassword(false);
    }

    function renderLegalLinks(className = "lp-legal-links") {
      return (
        <div className={className}>
          {LEGAL_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lp-legal-link${booksView === item.pageId ? " active" : ""}`}
              onClick={() => openBooksLegalPage(item.pageId)}
            >
              {item.label}
            </button>
          ))}
        </div>
      );
    }

    function renderLandingLegalSection() {
      if (!legalPage) return null;
      const activeLegalNavId = getActiveLegalNavId(legalPage.id);
      const visibleSections = getVisibleLegalSections(legalPage);

      return (
        <section className="lp-legal-shell">
          <div className="lp-legal-card">
            <div className="lp-legal-head">
              <div>
                <h2>{legalPage.title}</h2>
                <p>{legalPage.summary}</p>
              </div>
              <button type="button" className="lp-btn-ghost lp-legal-back" onClick={() => setBooksView("home")}>
                Ana səhifəyə qayıt
              </button>
            </div>
            <div className="lp-legal-links">
              {LEGAL_NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  className={`lp-legal-link${item.id === activeLegalNavId ? " active" : ""}`}
                  href={item.href}
                >
                  {item.label}
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
      );
    }

    function renderStandaloneLegalPage() {
      if (!directLegalPage) return null;

      return (
        <div className="lp-shell" onClick={() => hubLangOpen && setHubLangOpen(false)}>
          <header className="lp-topbar">
            <div className="lp-topbar-inner">
              <div className="lp-brand">
                <div className="lp-brand-icon">
                  <img src={logoSrc} alt="Tetavio" className="app-logo" />
                </div>
                <div className="lp-brand-copy">
                  <strong>Tetavio</strong>
                  <span>{t.brandSub}</span>
                </div>
              </div>
              <div className="lp-nav">
                <button
                  className="lp-nav-ghost"
                  type="button"
                  onClick={() => {
                    setActiveProduct("booksLanding");
                    setBooksView("home");
                    setBooksNotice("");
                    setShowPassword(false);
                  }}
                >
                  {t.navProducts}
                </button>
                <button className="lp-nav-ghost" type="button" onClick={() => goAuth("signin")}>{t.navSignin}</button>
                <button className="lp-nav-cta" type="button" onClick={() => goAuth("signup")}>{t.navSignup}</button>
              </div>
            </div>
          </header>

          {renderLandingLegalSection()}

          <footer className="lp-footer">
            {renderLegalLinks("lp-footer-links")}
            <small>Tetavio ERP · Cloud Accounting Platform · © Tetavio MMC, bütün hüquqlar qorunur</small>
          </footer>
        </div>
      );
    }

    function renderLandingAuthSection() {
      return (
        <section id="lp-auth-anchor" ref={landingAuthRef} className={`lp-auth-section${authSectionExpanded ? " lp-auth-section-expanded" : ""}`}>
          <div className="lp-auth-info">
            <h2>{t.authInfoTitle.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</h2>
            <p>{t.authInfoDesc}</p>
            {booksNotice ? <div className="lp-notice">{booksNotice}</div> : null}
            <div className="lp-auth-bullets">
              {t.bullets.map((b) => <div key={b} className="lp-bullet">{b}</div>)}
            </div>
          </div>

          <div className="lp-auth-card">
            {isAuthView && (
              <div className="lp-auth-tabs">
                <button className={`lp-auth-tab${booksView !== "signup" ? " active" : ""}`} type="button" onClick={() => { setBooksView("signin"); setBooksNotice(""); setShowPassword(false); }}>{t.tabSignin}</button>
                <button className={`lp-auth-tab${booksView === "signup" ? " active" : ""}`} type="button" onClick={() => { setBooksView("signup"); setBooksNotice(""); setShowPassword(false); }}>{t.tabSignup}</button>
              </div>
            )}

            {booksView === "home" ? (
              <div className="lp-form lp-auth-home">
                <p className="lp-form-title">{t.authInfoTitle.split("\n")[0]}</p>
                <p className="lp-form-hint">{t.authInfoDesc}</p>
                <div className="lp-auth-home-actions">
                  <button className="lp-submit-btn" type="button" onClick={() => goAuth("signin")}>{t.tabSignin}</button>
                  <button className="lp-btn-ghost" type="button" onClick={() => goAuth("signup")}>{t.tabSignup}</button>
                </div>
              </div>

            ) : booksView === "signin" ? (
              <form className="lp-form" onSubmit={submitSignIn}>
                <div className="lp-form-field">
                  <label>{t.fEmail}</label>
                  <input type="email" value={authDraft.email} onChange={(e) => setAuthDraft((c) => ({ ...c, email: e.target.value }))} placeholder="email@example.com" required />
                </div>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fPassword}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={authDraft.password} onChange={(e) => setAuthDraft((c) => ({ ...c, password: e.target.value }))} placeholder={showPassword ? "password" : "••••••••"} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div className="lp-form-row">
                  <label className="lp-remember"><input type="checkbox" checked={authDraft.rememberMe} onChange={(e) => setAuthDraft((c) => ({ ...c, rememberMe: e.target.checked }))} /> {t.fRemember}</label>
                  <button className="lp-text-link" type="button" onClick={() => { setBooksView("forgot"); setBooksNotice(""); setForgotDraft({ email: authDraft.email || "" }); }}>{t.fForgot}</button>
                </div>
                <button className="lp-submit-btn" type="submit">{t.fSigninBtn}</button>
              </form>

            ) : booksView === "signup" ? (
              <form className="lp-form" onSubmit={submitSignUp}>
                <div className="lp-form-field">
                  <label>{t.fFullName}</label>
                  <input value={authDraft.fullName} onChange={(e) => setAuthDraft((c) => ({ ...c, fullName: e.target.value }))} placeholder={t.fFullName} required />
                </div>
                <div className="lp-form-2col">
                  <div className="lp-form-field">
                    <label>{t.fEntityType}</label>
                    <select value={authDraft.entityType} onChange={(e) => setAuthDraft((c) => ({ ...c, entityType: e.target.value }))}>
                      <option value="Fiziki şəxs">{t.fEntityIndiv}</option>
                      <option value="Hüquqi şəxs">{t.fEntityLegal}</option>
                    </select>
                  </div>
                  <div className="lp-form-field">
                    <label>{t.fTaxId}</label>
                    <input value={authDraft.taxId} onChange={(e) => setAuthDraft((c) => ({ ...c, taxId: e.target.value }))} placeholder="0000000000" required />
                  </div>
                </div>
                <div className="lp-form-field">
                  <label>{authDraft.entityType === "Fiziki şəxs" ? t.fOwnerName : t.fCompanyName}</label>
                  <input value={authDraft.companyName} onChange={(e) => setAuthDraft((c) => ({ ...c, companyName: e.target.value }))} required />
                </div>
                <div className="lp-form-2col">
                  <div className="lp-form-field">
                    <label>{t.fPhone}</label>
                    <input value={authDraft.mobilePhone} onChange={(e) => setAuthDraft((c) => ({ ...c, mobilePhone: e.target.value }))} placeholder="+994..." required />
                  </div>
                  <div className="lp-form-field">
                    <label>{t.fPlan}</label>
                    <select value={authDraft.signupPlan || "free"} onChange={(e) => setAuthDraft((c) => ({ ...c, signupPlan: e.target.value }))}>
                      <option value="free">Free</option>
                      <option value="demo">{t.fPlanDemo}</option>
                    </select>
                  </div>
                </div>
                <div className="lp-form-field">
                  <label>{t.fEmail}</label>
                  <input type="email" value={authDraft.email} onChange={(e) => setAuthDraft((c) => ({ ...c, email: e.target.value }))} placeholder="email@example.com" required />
                </div>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fPassword}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={authDraft.password} onChange={(e) => setAuthDraft((c) => ({ ...c, password: e.target.value }))} placeholder={showPassword ? "password" : "••••••••"} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <button className="lp-submit-btn" type="submit">{t.fSignupBtn}</button>
              </form>

            ) : booksView === "forgot" ? (
              <form className="lp-form" onSubmit={submitForgotPassword}>
                <div className="lp-auth-back"><button className="lp-text-link" type="button" onClick={() => { setBooksView("signin"); setBooksNotice(""); setShowPassword(false); }}>{t.fForgotBack}</button></div>
                <p className="lp-form-title">{t.fForgotTitle}</p>
                <p className="lp-form-hint">{t.fForgotHint}</p>
                <div className="lp-form-field">
                  <label>{t.fEmail}</label>
                  <input type="email" value={forgotDraft.email} onChange={(e) => setForgotDraft({ email: e.target.value })} required />
                </div>
                <button className="lp-submit-btn" type="submit">{t.fForgotBtn}</button>
              </form>

            ) : booksView === "reset" ? (
              <form className="lp-form" onSubmit={submitResetPassword}>
                <div className="lp-auth-back"><button className="lp-text-link" type="button" onClick={() => { setBooksView("signin"); setBooksNotice(""); setActiveResetToken(""); setShowPassword(false); }}>{t.fResetBack}</button></div>
                <p className="lp-form-title">{t.fResetTitle}</p>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fNewPass}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={resetDraft.password} onChange={(e) => setResetDraft((c) => ({ ...c, password: e.target.value }))} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fConfirmPass}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={resetDraft.confirmPassword} onChange={(e) => setResetDraft((c) => ({ ...c, confirmPassword: e.target.value }))} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <button className="lp-submit-btn" type="submit">{t.fResetBtn}</button>
              </form>

            ) : booksView === "demo" ? (
              <form className="lp-form" onSubmit={submitDemoRequest}>
                <p className="lp-form-title">{t.fDemoTitle}</p>
                <div className="lp-form-field"><label>{t.fDemoCompany}</label><input value={demoDraft.companyName} onChange={(e) => setDemoDraft((c) => ({ ...c, companyName: e.target.value }))} required /></div>
                <div className="lp-form-field"><label>{t.fDemoPerson}</label><input value={demoDraft.fullName} onChange={(e) => setDemoDraft((c) => ({ ...c, fullName: e.target.value }))} required /></div>
                <div className="lp-form-field"><label>{t.fEmail}</label><input type="email" value={demoDraft.email} onChange={(e) => setDemoDraft((c) => ({ ...c, email: e.target.value }))} required /></div>
                <button className="lp-submit-btn" type="submit">{t.fDemoBtn}</button>
              </form>
            ) : null}
          </div>
        </section>
      );
    }

    if (directLegalPage) {
      return renderStandaloneLegalPage();
    }

    return (
      <div className="lp-shell" onClick={() => hubLangOpen && setHubLangOpen(false)}>

        {/* ── Topbar ── */}
        <header className="lp-topbar">
          <div className="lp-topbar-inner">
            <div className="lp-brand">
              <div className="lp-brand-icon">
                <img src={logoSrc} alt="Tetavio" className="app-logo" />
              </div>
              <div className="lp-brand-copy">
                <strong>Tetavio</strong>
                <span>{t.brandSub}</span>
              </div>
            </div>
            <div className="lp-nav">
              {/* Language switcher */}
              <div className="ph-lang-wrap" onClick={(e) => e.stopPropagation()}>
                <button className="ph-lang-btn" type="button" onClick={() => setHubLangOpen((o) => !o)}>
                  <span>{activeLang.flag}</span>
                  <span>{activeLang.code.toUpperCase()}</span>
                  <span className="ph-lang-chevron">{hubLangOpen ? "▲" : "▼"}</span>
                </button>
                {hubLangOpen && (
                  <div className="ph-lang-dropdown">
                    {LANGS.map((l) => (
                      <button key={l.code} type="button"
                        className={`ph-lang-option${l.code === hubLang ? " ph-lang-option-active" : ""}`}
                        onClick={() => { setHubLang(l.code); setHubLangOpen(false); }}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="lp-nav-ghost" type="button" onClick={() => setActiveProduct("hub")}>{t.navProducts}</button>
              <button className="lp-nav-ghost" type="button" onClick={() => goAuth("signin")}>{t.navSignin}</button>
              <button className="lp-nav-cta" type="button" onClick={() => goAuth("signup")}>{t.navSignup}</button>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        {isLegalView ? renderLandingLegalSection() : null}

        {!isLegalView ? (
        <>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <button className="lp-inline-back" type="button" onClick={() => setActiveProduct("hub")}>{t.backHome}</button>
            <div className="lp-eyebrow">{t.eyebrow}</div>
            <h1 className="lp-headline">{t.headline1}<br /><span className="lp-headline-accent">{t.headline2}</span></h1>
            <p className="lp-subtitle">{t.subtitle}</p>
            <div className="lp-cta-row">
              <button className="lp-btn-primary" type="button" onClick={() => goAuth("signup")}>{t.ctaPrimary}</button>
              <button className="lp-btn-ghost" type="button" onClick={() => goAuth("signin")}>{t.ctaGhost}</button>
            </div>
            <div className="lp-features">
              {t.pills.map((f) => <span key={f} className="lp-feature-pill">{f}</span>)}
            </div>
          </div>
          <div className="lp-stats-card">
            <div className="lp-stats-head">
              <div>
                <div className="lp-stats-title">{t.statsTitle}</div>
                <div className="lp-stats-sub">{t.statsSub}</div>
              </div>
              <span className="lp-live-badge">{t.liveBadge}</span>
            </div>
            <div className="lp-stats-grid">
              {animatedPreviewStats.map((item, idx) => (
                <div key={idx} className="lp-stat-item">
                  <span className="lp-stat-label">{[at.lp_stat1, at.lp_stat2, at.lp_stat3, at.lp_stat4][idx] || item.label}</span>
                  <strong className="lp-stat-value">{formatPreviewMetric(item.value)}</strong>
                </div>
              ))}
            </div>
            <div className="lp-stats-footer">
              <span className="lp-stats-note">{t.statsNote}</span>
            </div>
          </div>
        </section>

        {/* ── Feature highlights ── */}
        </>
        ) : null}

        {!isLegalView && authSectionExpanded ? renderLandingAuthSection() : null}

        {!isLegalView ? (
        <>
        <div className="lp-highlights">
          {t.highlights.map((h) => (
            <div key={h.title} className="lp-highlight-card">
              <span className="lp-highlight-icon">{h.icon}</span>
              <strong>{h.title}</strong>
              <span>{h.desc}</span>
            </div>
          ))}
        </div>

        {/* ── Auth section ── */}
        </>
        ) : null}

        {!isLegalView && !authSectionExpanded ? (
        <section id="lp-auth-anchor" ref={landingAuthRef} className="lp-auth-section">
          <div className="lp-auth-info">
            <h2>{t.authInfoTitle.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</h2>
            <p>{t.authInfoDesc}</p>
            {booksNotice ? <div className="lp-notice">{booksNotice}</div> : null}
            <div className="lp-auth-bullets">
              {t.bullets.map((b) => <div key={b} className="lp-bullet">{b}</div>)}
            </div>
          </div>

          <div className="lp-auth-card">
            {isAuthView && (
              <div className="lp-auth-tabs">
                <button className={`lp-auth-tab${booksView !== "signup" ? " active" : ""}`} type="button" onClick={() => { setBooksView("signin"); setBooksNotice(""); setShowPassword(false); }}>{t.tabSignin}</button>
                <button className={`lp-auth-tab${booksView === "signup" ? " active" : ""}`} type="button" onClick={() => { setBooksView("signup"); setBooksNotice(""); setShowPassword(false); }}>{t.tabSignup}</button>
              </div>
            )}

            {booksView === "signin" || booksView === "home" ? (
              <form className="lp-form" onSubmit={submitSignIn}>
                <div className="lp-form-field">
                  <label>{t.fEmail}</label>
                  <input type="email" value={authDraft.email} onChange={(e) => setAuthDraft((c) => ({ ...c, email: e.target.value }))} placeholder="email@example.com" required />
                </div>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fPassword}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={authDraft.password} onChange={(e) => setAuthDraft((c) => ({ ...c, password: e.target.value }))} placeholder={showPassword ? "password" : "••••••••"} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div className="lp-form-row">
                  <label className="lp-remember"><input type="checkbox" checked={authDraft.rememberMe} onChange={(e) => setAuthDraft((c) => ({ ...c, rememberMe: e.target.checked }))} /> {t.fRemember}</label>
                  <button className="lp-text-link" type="button" onClick={() => { setBooksView("forgot"); setBooksNotice(""); setForgotDraft({ email: authDraft.email || "" }); }}>{t.fForgot}</button>
                </div>
                <button className="lp-submit-btn" type="submit">{t.fSigninBtn}</button>
              </form>

            ) : booksView === "signup" ? (
              <form className="lp-form" onSubmit={submitSignUp}>
                <div className="lp-form-field">
                  <label>{t.fFullName}</label>
                  <input value={authDraft.fullName} onChange={(e) => setAuthDraft((c) => ({ ...c, fullName: e.target.value }))} placeholder={t.fFullName} required />
                </div>
                <div className="lp-form-2col">
                  <div className="lp-form-field">
                    <label>{t.fEntityType}</label>
                    <select value={authDraft.entityType} onChange={(e) => setAuthDraft((c) => ({ ...c, entityType: e.target.value }))}>
                      <option value="Fiziki şəxs">{t.fEntityIndiv}</option>
                      <option value="Hüquqi şəxs">{t.fEntityLegal}</option>
                    </select>
                  </div>
                  <div className="lp-form-field">
                    <label>{t.fTaxId}</label>
                    <input value={authDraft.taxId} onChange={(e) => setAuthDraft((c) => ({ ...c, taxId: e.target.value }))} placeholder="0000000000" required />
                  </div>
                </div>
                <div className="lp-form-field">
                  <label>{authDraft.entityType === "Fiziki şəxs" ? t.fOwnerName : t.fCompanyName}</label>
                  <input value={authDraft.companyName} onChange={(e) => setAuthDraft((c) => ({ ...c, companyName: e.target.value }))} required />
                </div>
                <div className="lp-form-2col">
                  <div className="lp-form-field">
                    <label>{t.fPhone}</label>
                    <input value={authDraft.mobilePhone} onChange={(e) => setAuthDraft((c) => ({ ...c, mobilePhone: e.target.value }))} placeholder="+994..." required />
                  </div>
                  <div className="lp-form-field">
                    <label>{t.fPlan}</label>
                    <select value={authDraft.signupPlan || "free"} onChange={(e) => setAuthDraft((c) => ({ ...c, signupPlan: e.target.value }))}>
                      <option value="free">Free</option>
                      <option value="demo">{t.fPlanDemo}</option>
                    </select>
                  </div>
                </div>
                <div className="lp-form-field">
                  <label>{t.fEmail}</label>
                  <input type="email" value={authDraft.email} onChange={(e) => setAuthDraft((c) => ({ ...c, email: e.target.value }))} placeholder="email@example.com" required />
                </div>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fPassword}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={authDraft.password} onChange={(e) => setAuthDraft((c) => ({ ...c, password: e.target.value }))} placeholder={showPassword ? "password" : "••••••••"} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <button className="lp-submit-btn" type="submit">{t.fSignupBtn}</button>
              </form>

            ) : booksView === "forgot" ? (
              <form className="lp-form" onSubmit={submitForgotPassword}>
                <div className="lp-auth-back"><button className="lp-text-link" type="button" onClick={() => { setBooksView("signin"); setBooksNotice(""); setShowPassword(false); }}>{t.fForgotBack}</button></div>
                <p className="lp-form-title">{t.fForgotTitle}</p>
                <p className="lp-form-hint">{t.fForgotHint}</p>
                <div className="lp-form-field">
                  <label>{t.fEmail}</label>
                  <input type="email" value={forgotDraft.email} onChange={(e) => setForgotDraft({ email: e.target.value })} required />
                </div>
                <button className="lp-submit-btn" type="submit">{t.fForgotBtn}</button>
              </form>

            ) : booksView === "reset" ? (
              <form className="lp-form" onSubmit={submitResetPassword}>
                <div className="lp-auth-back"><button className="lp-text-link" type="button" onClick={() => { setBooksView("signin"); setBooksNotice(""); setActiveResetToken(""); setShowPassword(false); }}>{t.fResetBack}</button></div>
                <p className="lp-form-title">{t.fResetTitle}</p>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fNewPass}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={resetDraft.password} onChange={(e) => setResetDraft((c) => ({ ...c, password: e.target.value }))} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div className="lp-form-field lp-password-field">
                  <label>{t.fConfirmPass}</label>
                  <div className="lp-pass-input-wrap">
                    <input type={showPassword ? "text" : "password"} value={resetDraft.confirmPassword} onChange={(e) => setResetDraft((c) => ({ ...c, confirmPassword: e.target.value }))} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <button className="lp-submit-btn" type="submit">{t.fResetBtn}</button>
              </form>

            ) : booksView === "demo" ? (
              <form className="lp-form" onSubmit={submitDemoRequest}>
                <p className="lp-form-title">{t.fDemoTitle}</p>
                <div className="lp-form-field"><label>{t.fDemoCompany}</label><input value={demoDraft.companyName} onChange={(e) => setDemoDraft((c) => ({ ...c, companyName: e.target.value }))} required /></div>
                <div className="lp-form-field"><label>{t.fDemoPerson}</label><input value={demoDraft.fullName} onChange={(e) => setDemoDraft((c) => ({ ...c, fullName: e.target.value }))} required /></div>
                <div className="lp-form-field"><label>{t.fEmail}</label><input type="email" value={demoDraft.email} onChange={(e) => setDemoDraft((c) => ({ ...c, email: e.target.value }))} required /></div>
                <button className="lp-submit-btn" type="submit">{t.fDemoBtn}</button>
              </form>
            ) : null}
          </div>
        </section>
        ) : null}

        <footer className="lp-footer">
          <div className="lp-footer-links">
            {LEGAL_NAV_ITEMS.map((legalItem) => (
              <a
                key={legalItem.id}
                className={`lp-legal-link${booksView === legalItem.pageId ? " active" : ""}`}
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

  function renderBanking() {
    const query = searches.bankingAccounts || "";
    const accounts = state.bankingAccounts.filter((item) => matchesSearch(item, query));

    if (bankView === "overview") {
      return (
        <section className="view active">
          <div className="bill-hub">
            <div className="bill-hub-card" onClick={() => setBankView("banks")}>
              <div className="bill-hub-icon">🏦</div>
              <div className="bill-hub-info">
                <h3>Banklar</h3>
                <p>Bankların siyahısı və rekvizitlərinin idarəsi.</p>
                <span className="bill-hub-count">{state.bankingAccounts.length} {at.hub_bankCount}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
            <div className="bill-hub-card" onClick={() => setBankView("journal")}>
              <div className="bill-hub-icon">📒</div>
              <div className="bill-hub-info">
                <h3>{at.hub_bankJournal}</h3>
                <p>{at.hub_bankJournalDesc}</p>
                <span className="bill-hub-count">{state.bankTransactions.length} {at.unit_record}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
            <div className="bill-hub-card" onClick={() => { setBankTxDraft({ date: today(), amount: "", transactionType: "Mədaxil", description: "", counterpartyName: "", bankAccountId: state.bankingAccounts[0]?.id || "", accountCode: "", reference: "", category: "" }); setBankTxAccountSearch(""); setBankView("tx-form"); }}>
              <div className="bill-hub-icon">➕</div>
              <div className="bill-hub-info">
                <h3>{at.hub_bankNew}</h3>
                <p>{at.hub_bankNewDesc}</p>
                <span className="bill-hub-count">{at.newRecord}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
          </div>
        </section>
      );
    }

    if (bankView === "journal") {
      const txSorted = [...state.bankTransactions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const totalCredit = state.bankTransactions.filter(t => t.transactionType === "Mədaxil").reduce((s, t) => s + Number(t.amount || 0), 0);
      const totalDebit = state.bankTransactions.filter(t => t.transactionType === "Məxaric").reduce((s, t) => s + Number(t.amount || 0), 0);

      return (
        <section className="view active">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => setBankView("overview")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{at.bankJournalTitle}</h2>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button className="ghost-btn" type="button" onClick={() => { setBankDraft(createEmptyBankDraft()); setEditingBank(null); setBankFormOrigin("journal"); setBankView("form"); }}>+ Yeni bank</button>
                <button className="primary-btn" type="button" onClick={() => { setBankTxDraft({ date: today(), amount: "", transactionType: "Mədaxil", description: "", counterpartyName: "", bankAccountId: state.bankingAccounts[0]?.id || "", accountCode: "", reference: "", category: "" }); setBankTxEditId(null); setBankTxAccountSearch(""); setBankView("tx-form"); }}>+ Yeni əməliyyat</button>
              </div>
            </div>
          </div>

          {/* Bank accounts summary strip */}
          <div className="bank-accounts-strip">
            {state.bankingAccounts.map((acc) => (
              <div key={acc.id} className="bank-acc-chip">
                <div className="bank-acc-chip-top">
                  <span className="bank-acc-chip-icon">🏦</span>
                  <div className="bank-acc-chip-info">
                    <strong>{getBankDisplayName(acc)}</strong>
                    <span>{getBankDisplayCode(acc)}</span>
                    <span>{acc.accountType}</span>
                  </div>
                </div>
                <div className="bank-acc-chip-bottom">
                  <span className="bank-acc-chip-balance">{currency(acc.balance, state.settings.currency)}</span>
                  <div className="bank-acc-chip-actions">
                    <button className="table-btn" onClick={() => { setBankDraft(buildBankDraftFromRecord(acc)); setEditingBank(acc.id); setBankFormOrigin("journal"); setBankView("form"); }}>{at.edit}</button>
                    <button className="table-btn danger-btn" onClick={() => { setState((c) => ({ ...c, bankingAccounts: c.bankingAccounts.filter((a) => a.id !== acc.id) })); if (editingBank === acc.id) { setBankDraft(createEmptyBankDraft()); setEditingBank(null); } }}>{at.delete}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals row */}
          <div className="bank-tx-totals">
            <div className="bank-tx-total-card bank-tx-total-card--credit">
              <span className="bank-tx-total-label">↓ Ümumi mədaxil</span>
              <strong>{currency(totalCredit, state.settings.currency)}</strong>
            </div>
            <div className="bank-tx-total-card bank-tx-total-card--debit">
              <span className="bank-tx-total-label">↑ Ümumi məxaric</span>
              <strong>{currency(totalDebit, state.settings.currency)}</strong>
            </div>
            <div className="bank-tx-total-card bank-tx-total-card--net">
              <span className="bank-tx-total-label">= Xalis qalıq</span>
              <strong style={{ color: totalCredit - totalDebit >= 0 ? "var(--success)" : "var(--danger)" }}>{currency(totalCredit - totalDebit, state.settings.currency)}</strong>
            </div>
          </div>

          {/* Transaction feed */}
          <div className="bank-tx-feed-wrap">
            <div className="bank-tx-feed-header">
              <h3>Əməliyyatlar <span className="bank-tx-feed-count">{state.bankTransactions.length}</span></h3>
            </div>
            {txSorted.length === 0 ? (
              <div className="bank-tx-feed-empty">
                <span>💳</span>
                <p>Hələ heç bir əməliyyat yoxdur</p>
                <button className="primary-btn" onClick={() => { setBankTxDraft({ date: today(), amount: "", transactionType: "Mədaxil", description: "", counterpartyName: "", bankAccountId: state.bankingAccounts[0]?.id || "", accountCode: "", reference: "", category: "" }); setBankTxEditId(null); setBankView("tx-form"); }}>İlk əməliyyatı əlavə et</button>
              </div>
            ) : (
              <div className="bank-tx-feed">
                {txSorted.map((record) => {
                  const isCredit = record.transactionType === "Mədaxil";
                  const bankAcc = state.bankingAccounts.find(a => a.id === record.bankAccountId);
                  const counterAcc = state.chartOfAccounts.find(a => a.accountCode === record.accountCode);
                  const bankCoaAcc = bankAcc?.coaCode ? state.chartOfAccounts.find(a => a.accountCode === bankAcc.coaCode) : null;
                  const bankLabel = bankCoaAcc ? `${bankCoaAcc.accountCode} – ${bankCoaAcc.accountName}` : (bankAcc ? getBankDisplayName(bankAcc) : "Bank hesabı");
                  const counterLabel = counterAcc ? `${counterAcc.accountCode} – ${counterAcc.accountName}` : (record.accountCode || "—");
                  const debitEntry  = isCredit ? bankLabel    : counterLabel;
                  const creditEntry = isCredit ? counterLabel : bankLabel;

                  return (
                    <div key={record.id} className={"bank-tx-item" + (isCredit ? " bank-tx-item--credit" : " bank-tx-item--debit")}>
                      <div className="bank-tx-item-bar"></div>
                      <div className="bank-tx-item-date">
                        <span className="bank-tx-item-day">{(record.date || "").slice(8, 10)}</span>
                        <span className="bank-tx-item-month">{MONTHS[Number((record.date || "").slice(5, 7)) - 1] || ""}</span>
                      </div>
                      <div className="bank-tx-item-body">
                        <div className="bank-tx-item-top">
                          <span className={"bank-tx-item-badge" + (isCredit ? " badge--credit" : " badge--debit")}>
                            {isCredit ? "↓ Mədaxil" : "↑ Məxaric"}
                          </span>
                          {record.category && <span className="bank-tx-item-cat">{record.category}</span>}
                          {record.reference && <span className="bank-tx-item-ref">#{record.reference}</span>}
                        </div>
                        {record.description && <div className="bank-tx-item-desc">{record.description}</div>}
                        {record.counterpartyName && <div className="bank-tx-item-desc">Şirkət: {record.counterpartyName}</div>}
                        <div className="bank-tx-item-entries">
                          <div className="bank-tx-entry-row">
                            <span className="bank-tx-entry-side bank-tx-entry-side--debet">D</span>
                            <span className="bank-tx-entry-name">{debitEntry}</span>
                            <span className="bank-tx-entry-val">{currency(record.amount, state.settings.currency)}</span>
                          </div>
                          <div className="bank-tx-entry-row">
                            <span className="bank-tx-entry-side bank-tx-entry-side--kredit">K</span>
                            <span className="bank-tx-entry-name">{creditEntry}</span>
                            <span className="bank-tx-entry-val">{currency(record.amount, state.settings.currency)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bank-tx-item-right">
                        <span className={"bank-tx-item-amount" + (isCredit ? " amount--credit" : " amount--debit")}>
                          {isCredit ? "+" : "−"}{currency(record.amount, state.settings.currency)}
                        </span>
                        <div className="bank-tx-item-actions">
                          <button className="table-btn" onClick={() => { setBankTxDraft({ date: record.date || "", amount: String(record.amount), transactionType: record.transactionType, description: record.description || "", counterpartyName: record.counterpartyName || "", bankAccountId: record.bankAccountId || "", accountCode: record.accountCode || "", reference: record.reference || "", category: record.category || "" }); setBankTxEditId(record.id); setBankTxAccountSearch(""); setBankView("tx-form"); }}>Düzəliş et</button>
                          <button className="table-btn danger-btn" onClick={() => setState((c) => ({ ...c, bankTransactions: c.bankTransactions.filter(t => t.id !== record.id) }))}>Sil</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      );
    }

    if (bankView === "banks") {
      return (
        <section className="view active">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => setBankView("overview")}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>Banklar</h2>
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  setBankDraft(createEmptyBankDraft());
                  setEditingBank(null);
                  setBankFormOrigin("banks");
                  setBankView("form");
                }}
              >
                + Yeni bank
              </button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-toolbar">
              <input className="search-input" placeholder={at.search} value={query} onChange={(event) => setSearches((current) => ({ ...current, bankingAccounts: event.target.value }))} />
            </div>
            <Table
              headers={["Bankın adı", "Bankın VÖEN-i", "Bankın kodu", "SWIFT", "Müxbir hesab", "Hesablaşma hesabı", at.action]}
              emptyMessage={at.noItems}
              rows={accounts.map((record) => (
                <tr key={record.id}>
                  <td>{record.bankName || record.accountName || "-"}</td>
                  <td>{record.bankTaxId || "-"}</td>
                  <td>{record.bankCode || record.institution || "-"}</td>
                  <td>{record.swift || "-"}</td>
                  <td>{record.correspondentAccount || "-"}</td>
                  <td>{record.settlementAccount || record.iban || "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="table-btn"
                        type="button"
                        onClick={() => {
                          setBankDraft(buildBankDraftFromRecord(record));
                          setEditingBank(record.id);
                          setBankFormOrigin("banks");
                          setBankView("form");
                        }}
                      >
                        {at.edit}
                      </button>
                      <button
                        className="table-btn danger-btn"
                        type="button"
                        onClick={() => {
                          setState((current) => ({ ...current, bankingAccounts: current.bankingAccounts.filter((entry) => entry.id !== record.id) }));
                          if (editingBank === record.id) {
                            setBankDraft(createEmptyBankDraft());
                            setEditingBank(null);
                          }
                        }}
                      >
                        {at.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            />
          </div>
        </section>
      );
    }

    if (bankView === "tx-form") {
      const accountOptions = state.chartOfAccounts.filter((a) => a.status !== "Passiv");
      const filteredAccOptions = bankTxAccountSearch
        ? accountOptions.filter((a) => (a.accountCode + " " + a.accountName).toLowerCase().includes(bankTxAccountSearch.toLowerCase()))
        : accountOptions;
      const companyNameOptions = Array.from(new Set([
        ...state.customers.map((item) => String(item.companyName || item.displayName || "").trim()),
        ...state.vendors.map((item) => String(item.companyName || item.vendorName || "").trim())
      ].filter(Boolean)));
      const selectedAcc = accountOptions.find((a) => a.accountCode === bankTxDraft.accountCode);
      const txCategories = ["Alınan ödəniş", "Verilən ödəniş", "Xərc", "Hesab ödənişi", "Bank komissiyası", "Əmək haqqı", "Vergi ödənişi", "Digər"];

      return (
        <section className="view active">
          <div className="bill-form-page">
            <div className="bill-journal-header">
              <button className="bill-back-btn" type="button" onClick={() => { setBankTxDraft({ date: "", amount: "", transactionType: "Mədaxil", description: "", counterpartyName: "", bankAccountId: "", accountCode: "", reference: "", category: "" }); setBankTxEditId(null); setBankView(bankTxEditId ? "journal" : "overview"); }}>{at.back}</button>
              <div className="bill-journal-title-row">
                <h2>{bankTxEditId ? "Əməliyyatı düzəliş et" : "Yeni bank əməliyyatı"}</h2>
              </div>
            </div>
            <div className="bill-form-panel bank-tx-form-panel">
              <form onSubmit={submitBankTx}>

                {/* Transaction type toggle */}
                <div className="bank-tx-type-toggle">
                  <button type="button" className={"bank-tx-type-btn" + (bankTxDraft.transactionType === "Mədaxil" ? " bank-tx-type-btn--active bank-tx-type-btn--credit" : "")} onClick={() => setBankTxDraft((c) => ({ ...c, transactionType: "Mədaxil" }))}>
                    <span className="bank-tx-type-icon">↓</span>
                    <span>Mədaxil</span>
                  </button>
                  <button type="button" className={"bank-tx-type-btn" + (bankTxDraft.transactionType === "Məxaric" ? " bank-tx-type-btn--active bank-tx-type-btn--debit" : "")} onClick={() => setBankTxDraft((c) => ({ ...c, transactionType: "Məxaric" }))}>
                    <span className="bank-tx-type-icon">↑</span>
                    <span>Məxaric</span>
                  </button>
                </div>

                {/* Amount — prominent */}
                <div className="bank-tx-amount-row">
                  <div className={"bank-tx-amount-wrap" + (bankTxDraft.transactionType === "Mədaxil" ? " bank-tx-amount-wrap--credit" : " bank-tx-amount-wrap--debit")}>
                    <span className="bank-tx-amount-currency">{state.settings.currency || "AZN"}</span>
                    <input className="bank-tx-amount-input" type="number" step="0.01" min="0" placeholder="0.00" value={bankTxDraft.amount} onChange={(e) => setBankTxDraft((c) => ({ ...c, amount: e.target.value }))} required />
                  </div>
                </div>

                {/* Main fields grid */}
                <div className="bank-tx-fields">

                  {/* Date */}
                  <label className="bank-tx-field">
                    <span className="bank-tx-field-label">📅 Tarix</span>
                    <input type="date" value={bankTxDraft.date} onChange={(e) => setBankTxDraft((c) => ({ ...c, date: e.target.value }))} required />
                  </label>

                  {/* Bank account selector */}
                  <label className="bank-tx-field">
                    <span className="bank-tx-field-label">🏦 Bank hesabı</span>
                    <select value={bankTxDraft.bankAccountId} onChange={(e) => setBankTxDraft((c) => ({ ...c, bankAccountId: e.target.value }))} required>
                      <option value="">Hesab seçin...</option>
                      {state.bankingAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{getBankDisplayName(acc)} — {getBankDisplayCode(acc)}</option>
                      ))}
                    </select>
                  </label>

                  {/* Chart of accounts — Hesab with search */}
                  <div className="bank-tx-field bank-tx-field--acc">
                    <span className="bank-tx-field-label">📊 Hesab (müxabirləşmə)</span>
                    <div className="bank-tx-acc-selector" style={{ position: "relative" }}>
                      <div className={"bank-tx-acc-trigger" + (bankTxAccountOpen ? " bank-tx-acc-trigger--open" : "")} onClick={() => setBankTxAccountOpen((o) => !o)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setBankTxAccountOpen((o) => !o); }}>
                        {selectedAcc ? <><span className="bank-tx-acc-code">{selectedAcc.accountCode}</span><span className="bank-tx-acc-name">{selectedAcc.accountName}</span></> : <span className="bank-tx-acc-placeholder">Hesab seçin...</span>}
                        <span className="bank-tx-acc-chevron">{bankTxAccountOpen ? "▲" : "▼"}</span>
                      </div>
                      {bankTxAccountOpen && (
                        <div className="bank-tx-acc-dropdown">
                          <input autoFocus className="bank-tx-acc-search" type="text" placeholder="Hesab axtar..." value={bankTxAccountSearch} onChange={(e) => setBankTxAccountSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
                          <div className="bank-tx-acc-list">
                            {filteredAccOptions.length === 0 && <div className="bank-tx-acc-empty">Tapılmadı</div>}
                            {filteredAccOptions.map((a) => (
                              <div key={a.id} className={"bank-tx-acc-option" + (bankTxDraft.accountCode === a.accountCode ? " bank-tx-acc-option--selected" : "")} onClick={() => { setBankTxDraft((c) => ({ ...c, accountCode: a.accountCode })); setBankTxAccountOpen(false); setBankTxAccountSearch(""); }}>
                                <span className="bank-tx-acc-code">{a.accountCode}</span>
                                <span className="bank-tx-acc-name">{a.accountName}</span>
                                <span className="bank-tx-acc-type">{a.accountType}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <label className="bank-tx-field">
                    <span className="bank-tx-field-label">🏷 Kateqoriya</span>
                    <select value={bankTxDraft.category} onChange={(e) => setBankTxDraft((c) => ({ ...c, category: e.target.value }))}>
                      <option value="">Seçin...</option>
                      {txCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </label>

                  <label className="bank-tx-field">
                    <span className="bank-tx-field-label">🏢 Şirkət adı</span>
                    <input
                      list="bank-tx-company-options"
                      type="text"
                      placeholder="Müştəri / şirkət adı"
                      value={bankTxDraft.counterpartyName || ""}
                      onChange={(e) => setBankTxDraft((c) => ({ ...c, counterpartyName: e.target.value }))}
                    />
                    <datalist id="bank-tx-company-options">
                      {companyNameOptions.map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </label>

                  {/* Reference */}
                  <label className="bank-tx-field">
                    <span className="bank-tx-field-label">🔖 Arayış / Sənəd №</span>
                    <input type="text" placeholder="Məs. INV-0042" value={bankTxDraft.reference} onChange={(e) => setBankTxDraft((c) => ({ ...c, reference: e.target.value }))} />
                  </label>

                  {/* Description — full width */}
                  <label className="bank-tx-field bank-tx-field--full">
                    <span className="bank-tx-field-label">📝 Təsvir</span>
                    <textarea rows={3} placeholder="Əməliyyatın qısa təsviri..." value={bankTxDraft.description} onChange={(e) => setBankTxDraft((c) => ({ ...c, description: e.target.value }))} />
                  </label>
                </div>

                <div className="bank-tx-form-actions">
                  <button className="primary-btn bank-tx-submit-btn" type="submit">
                    <span>{bankTxDraft.transactionType === "Mədaxil" ? "↓" : "↑"}</span> Yadda saxla
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => { setBankTxDraft({ date: "", amount: "", transactionType: "Mədaxil", description: "", counterpartyName: "", bankAccountId: "", accountCode: "", reference: "", category: "" }); setBankTxEditId(null); setBankView(bankTxEditId ? "journal" : "overview"); }}>{at.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="view active">
        <div className="bill-form-page">
          <div className="bill-journal-header">
            <button className="bill-back-btn" type="button" onClick={() => { setBankDraft(createEmptyBankDraft()); setEditingBank(null); setBankView(bankFormOrigin || "banks"); }}>{at.back}</button>
            <div className="bill-journal-title-row">
              <h2>{editingBank ? "Bankı düzəliş et" : "Yeni bank"}</h2>
            </div>
          </div>
          <div className="bill-form-panel">
            <form className="form-grid" onSubmit={submitBank}>
              <label><span>Bankın adı</span><input value={bankDraft.bankName} onChange={(event) => setBankDraft((current) => ({ ...current, bankName: event.target.value }))} required /></label>
              <label><span>Bankın VÖEN-i</span><input value={bankDraft.bankTaxId} onChange={(event) => setBankDraft((current) => ({ ...current, bankTaxId: event.target.value }))} /></label>
              <label><span>Bankın kodu</span><input value={bankDraft.bankCode} onChange={(event) => setBankDraft((current) => ({ ...current, bankCode: event.target.value }))} /></label>
              <label><span>SWIFT</span><input value={bankDraft.swift} onChange={(event) => setBankDraft((current) => ({ ...current, swift: event.target.value }))} /></label>
              <label><span>Müxbir hesab</span><input value={bankDraft.correspondentAccount} onChange={(event) => setBankDraft((current) => ({ ...current, correspondentAccount: event.target.value }))} /></label>
              <label><span>Hesablaşma hesabı</span><input value={bankDraft.settlementAccount} onChange={(event) => setBankDraft((current) => ({ ...current, settlementAccount: event.target.value }))} /></label>
              <div className="form-actions">
                <button className="primary-btn" type="submit">{editingBank ? at.ic_updateBtn : at.save}</button>
                <button className="ghost-btn" type="button" onClick={() => { setBankDraft(createEmptyBankDraft()); setEditingBank(null); setBankView(bankFormOrigin || "banks"); }}>{at.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  function renderReports() {
    return (
      <section className="view active">
        <div className="panel-grid three-up">{state.reports.map((report) => <section className="panel report-box" key={report.id}><h3>{report.name}</h3><strong>{currency(report.amount, state.settings.currency)}</strong><p>{report.description}</p></section>)}</div>
        <div className="panel-grid one-up dashboard-grid"><section className="panel"><div className="panel-head"><div><h3>{at.rpt_summaryTitle}</h3><p className="panel-copy">{at.rpt_summaryDesc}</p></div><span>{at.rpt_summaryBadge}</span></div><Table headers={[at.rpt_indicator, at.rpt_value]} emptyMessage={at.rpt_empty} rows={[[at.rpt_receivables, currency(totals.receivables, state.settings.currency)], [at.rpt_payables, currency(totals.payables, state.settings.currency)], [at.rpt_expenses, currency(totals.expenses, state.settings.currency)], [at.rpt_collected, currency(totals.collected, state.settings.currency)]].map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)} /></section></div>
      </section>
    );
  }

  function getAccountBalance(code) {
    return state.chartOfAccounts
      .filter((account) => account.accountCode === code)
      .reduce((sum, account) => sum + Number(account.balance || 0), 0);
  }

  function getTrialBalanceLookup(range = null, options = {}) {
    return new Map(getTrialBalanceRows(range, options).map((row) => [row.accountCode, row]));
  }

  function getReportAccountValue(row, preferredSide = "debit") {
    if (!row) return 0;
    const debitValue = Number(row.closingDebit || 0);
    const creditValue = Number(row.closingCredit || 0);
    return preferredSide === "credit" ? (creditValue || debitValue) : (debitValue || creditValue);
  }

  function getSignedClosingBalance(row, naturalSide = "debit") {
    if (!row) return 0;
    const debitValue = Number(row.closingDebit || 0);
    const creditValue = Number(row.closingCredit || 0);
    return Number((naturalSide === "credit" ? creditValue - debitValue : debitValue - creditValue).toFixed(2));
  }

  function sumAccountGroup(lookup, codes, preferredSide = "debit") {
    return Number(codes.reduce((sum, code) => sum + getReportAccountValue(lookup.get(code), preferredSide), 0).toFixed(2));
  }

  function getFinancialPositionLineConfigs() {
    return {
      liquidFunds: { preferredSide: "debit", exactCodes: ["221", "223", "224", "225"] },
      shortReceivables: { preferredSide: "debit", exactCodes: ["211", "231"] },
      shortAdvances: { preferredSide: "debit", exactCodes: ["233"] },
      recoverableVat: { preferredSide: "debit", exactCodes: ["241", "243"] },
      inventory: { preferredSide: "debit", exactCodes: ["201", "204", "205"], codePrefixes: ["20"] },
      nonCurrentAssets: { preferredSide: "debit", codePrefixes: ["10", "11", "13", "14"] },
      shortLiabilities: { preferredSide: "credit", exactCodes: ["511", "521", "522", "531", "541"] },
      longLiabilities: { preferredSide: "credit", exactCodes: ["411", "421"] },
      shareCapital: { preferredSide: "credit", exactCodes: ["301", "311"] },
      retainedEarnings: { preferredSide: "credit", exactCodes: ["341"] },
      periodResult: { preferredSide: "credit", exactCodes: ["801"] }
    };
  }

  function getFinancialPositionLineRows(lookup, lineKey) {
    const config = getFinancialPositionLineConfigs()[lineKey];
    if (!config) return [];

    const exactCodes = new Set((config.exactCodes || []).map((code) => String(code)));
    const codePrefixes = (config.codePrefixes || []).map((prefix) => String(prefix));
    const accountById = new Map(state.chartOfAccounts.map((account) => [String(account.id || ""), account]));
    const accountByCode = new Map(state.chartOfAccounts.map((account) => [String(account.accountCode || ""), account]));

    const getLineageCodes = (account) => {
      const lineage = new Set([String(account?.accountCode || "")]);
      const visited = new Set();
      let cursor = account;
      while (cursor && !visited.has(String(cursor.id || cursor.accountCode || ""))) {
        visited.add(String(cursor.id || cursor.accountCode || ""));
        const parentCode = cursor.parentAccountCode || cursor.parentCode || "";
        const parentId = cursor.parentAccountId || cursor.parentId || "";
        if (parentCode) {
          lineage.add(String(parentCode));
          cursor = accountByCode.get(String(parentCode)) || null;
          continue;
        }
        if (parentId) {
          const parentAccount = accountById.get(String(parentId)) || null;
          if (parentAccount?.accountCode) lineage.add(String(parentAccount.accountCode));
          cursor = parentAccount;
          continue;
        }
        break;
      }
      return [...lineage];
    };

    return [...lookup.values()].filter((row) => {
      if (!isVisibleAccount(row)) return false;
      const code = String(row.accountCode || "");
      const sourceAccount = accountByCode.get(code) || row;
      const lineageCodes = getLineageCodes(sourceAccount);
      if (exactCodes.has(code)) return true;
      if (codePrefixes.some((prefix) => code.startsWith(prefix))) return true;
      if (lineageCodes.some((lineageCode) => exactCodes.has(lineageCode))) return true;
      if (lineageCodes.some((lineageCode) => codePrefixes.some((prefix) => String(lineageCode).startsWith(prefix)))) return true;
      return false;
    });
  }

  function getFinancialPositionLineValue(lookup, lineKey) {
    const config = getFinancialPositionLineConfigs()[lineKey];
    if (!config) return 0;
    return Number(getFinancialPositionLineRows(lookup, lineKey)
      .reduce((sum, row) => sum + getReportAccountValue(row, config.preferredSide || "debit"), 0)
      .toFixed(2));
  }

  function getUnmappedFinancialPositionAccounts(lookup) {
    const configs = getFinancialPositionLineConfigs();
    const reportLineKeys = Object.keys(configs);
    return [...lookup.values()]
      .filter((row) => isVisibleAccount(row))
      .filter((row) => ["Aktiv", "Öhdəlik", "Kapital"].includes(normalizeAccountTypeValue(row.accountType)))
      .filter((row) => Number(row.closingDebit || 0) > 0 || Number(row.closingCredit || 0) > 0)
      .filter((row) => !reportLineKeys.some((lineKey) => getFinancialPositionLineRows(new Map([[row.accountCode, row]]), lineKey).length > 0))
      .map((row) => ({
        accountCode: String(row.accountCode || ""),
        accountName: row.accountName || getAccountNameByCode(row.accountCode),
        accountType: normalizeAccountTypeValue(row.accountType),
        value: getReportAccountValue(row, normalizeAccountTypeValue(row.accountType) === "Aktiv" ? "debit" : "credit")
      }))
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode));
  }

  function getReportPeriodLabel() {
    return reportPeriod === "Cari il" ? `${state.settings.fiscalYear} ili` : reportPeriod;
  }

  function buildReportDocument(title, rows, valueFormatter) {
    const periodLabel = getReportPeriodLabel();
    const generatedAt = fmtDate(today());
    const tableRows = rows.map(([label, amount], index) => `
      <tr class="${String(label).includes("Cəmi") || String(label).includes("Xalis") || index === rows.length - 1 ? "total-row" : ""}">
        <td>${String(label)}</td>
        <td>${valueFormatter(amount)}</td>
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html lang="${hubLang}">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
@page { size: A4 portrait; margin: 18mm 14mm; }
body{font-family:"Segoe UI",Tahoma,sans-serif;margin:0;color:#1d2a44;background:#ffffff}
.sheet{padding:12px 4px 0}
.topline{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;border-bottom:2px solid #d9e2f0;padding-bottom:14px}
.brand h1{margin:0;font-size:24px;letter-spacing:.02em}
.brand p{margin:6px 0 0;color:#5d6b84;font-size:13px}
.meta{min-width:245px;border:1px solid #d9e2f0;border-radius:14px;padding:12px 14px;background:#f8fbff}
.meta-row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;font-size:13px}
.meta-row span{color:#5d6b84}
.title-block{text-align:center;padding:24px 0 18px}
.title-block h2{margin:0;font-size:22px}
.title-block p{margin:8px 0 0;color:#5d6b84;font-size:13px}
.intro{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
.intro-card{border:1px solid #d9e2f0;border-radius:14px;padding:12px 14px;background:#fffdf8}
.intro-card strong{display:block;font-size:12px;color:#5d6b84;text-transform:uppercase;letter-spacing:.04em}
.intro-card span{display:block;margin-top:8px;font-size:15px;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{background:#eef4ff;border:1px solid #cfd8e6;padding:10px 12px;text-align:left}
tbody td{border:1px solid #d7deea;padding:10px 12px;vertical-align:top}
.total-row td{font-weight:800;background:#f4f8ff}
.footnote{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;margin-top:22px}
.footnote-box{border:1px solid #d9e2f0;border-radius:14px;padding:14px 16px;min-height:88px}
.footnote-box strong{display:block;font-size:12px;text-transform:uppercase;color:#5d6b84;letter-spacing:.04em}
.footnote-box p{margin:10px 0 0;line-height:1.6;color:#42526b;font-size:13px}
.signatures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:28px}
.sign-box{padding-top:18px;border-top:1px solid #cfd8e6}
.sign-box strong{display:block;font-size:13px}
.sign-box span{display:block;margin-top:28px;color:#5d6b84;font-size:12px}
.footer{text-align:center;margin-top:24px;color:#7a879c;font-size:11px}
@media print {
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
  <div class="sheet">
    <div class="topline">
      <div class="brand">
        <h1>${state.settings.companyName}</h1>
        <p>VÖEN: ${state.settings.taxId || "0000000000"}</p>
      </div>
      <div class="meta">
        <div class="meta-row"><span>${at.rpt_reportDate}</span><strong>${generatedAt}</strong></div>
        <div class="meta-row"><span>${at.rpt_period}</span><strong>${periodLabel}</strong></div>
        <div class="meta-row"><span>${at.rpt_currency}</span><strong>${state.settings.currency}</strong></div>
        <div class="meta-row"><span>${at.rpt_fiscalYear}</span><strong>${state.settings.fiscalYear}</strong></div>
      </div>
    </div>
    <div class="title-block">
      <h2>${title}</h2>
      <p>${at.rpt_printSubtitle}</p>
    </div>
    <div class="intro">
      <div class="intro-card">
        <strong>${at.rpt_company}</strong>
        <span>${state.settings.companyName}</span>
      </div>
      <div class="intro-card">
        <strong>${at.rpt_reportPeriod}</strong>
        <span>${periodLabel}</span>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>${at.rpt_printItem}</th><th>${at.rpt_printAmount}</th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="footnote">
      <div class="footnote-box">
        <strong>${at.rpt_printNote}</strong>
        <p>${at.rpt_printNoteText}</p>
      </div>
      <div class="footnote-box">
        <strong>${at.rpt_printSource}</strong>
        <p>Tetavio ERP daxili hesabat modulu, tarix: ${generatedAt}</p>
      </div>
    </div>
    <div class="signatures">
      <div class="sign-box"><strong>${at.rpt_printPrepared}</strong><span>______________________________</span></div>
      <div class="sign-box"><strong>${at.rpt_printApproved}</strong><span>______________________________</span></div>
    </div>
    <div class="footer">${at.rpt_printFooter}</div>
  </div>
</body>
</html>`;
  }

  function buildComparisonRows(currentRows, previousRows) {
    const previousMap = new Map(previousRows.map(([label, amount]) => [label, Number(amount || 0)]));
    return currentRows.map(([label, amount]) => {
      const currentValue = Number(amount || 0);
      const previousValue = Number(previousMap.get(label) || 0);
      return {
        label,
        current: currentValue,
        previous: previousValue,
        delta: Number((currentValue - previousValue).toFixed(2))
      };
    });
  }

  function renderComparisonTable(currentRows, previousRows, currentRange, previousRange) {
    const rows = buildComparisonRows(currentRows, previousRows);
    const formatDelta = (value) => {
      if (value > 0) return `↑ ${currency(value, state.settings.currency)}`;
      if (value < 0) return `↓ ${currency(value, state.settings.currency)}`;
      return `• ${currency(value, state.settings.currency)}`;
    };
    return (
      <section className="panel report-comparison-panel">
        <div className="panel-head">
          <div>
            <h3>{at.rpt_compareTitle}</h3>
            <p className="panel-copy">{at.rpt_compareDesc}</p>
          </div>
          <span>{getRangeLabel(previousRange)} / {getRangeLabel(currentRange)}</span>
        </div>
        <Table
          headers={[at.rpt_item, at.rpt_currentPeriod, at.rpt_prevPeriod, at.rpt_diff]}
          emptyMessage={at.rpt_compareEmpty}
          rows={rows.map((row) => (
            <tr key={row.label} className={row.label.startsWith("Cəmi") || row.label.startsWith("Xalis") ? "report-total-row" : ""}>
              <td>{row.label}</td>
              <td>{currency(row.current, state.settings.currency)}</td>
              <td>{currency(row.previous, state.settings.currency)}</td>
              <td className={row.delta > 0 ? "delta-positive" : row.delta < 0 ? "delta-negative" : "delta-neutral"}>{formatDelta(row.delta)}</td>
            </tr>
          ))}
        />
      </section>
    );
  }

  async function exportHtmlAsExcel(title, html) {
    const safeTitle = title.toLowerCase().replace(/\s+/g, "-");
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI_INTERNALS__?.invoke;
    if (invoke) {
      try {
        const filePath = await invoke("export_report_file", { fileName: safeTitle, content: html, extension: "xls" });
        setBackupStatus({ tone: "success", message: `Hesabat Excel faylı yaradıldı: ${filePath}` });
        return;
      } catch (error) {
        const message = error?.message || String(error || "");
        setBackupStatus({ tone: "warning", message: `Excel export alınmadı${message ? `: ${message}` : ""}. Brauzer üsulu ilə cəhd edilir.` });
      }
    }

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupStatus({ tone: "success", message: "Excel export hazırlandı." });
  }

  async function exportReportExcel(title, rows) {
    const html = buildReportDocument(title, rows, (amount) => Number(amount || 0).toFixed(2));
    await exportHtmlAsExcel(title, html);
  }

  function buildTableReportDocument(title, headers, rows) {
    const periodLabel = getReportPeriodLabel();
    const generatedAt = fmtDate(today());
    const headerHtml = headers.map(h => `<th>${h}</th>`).join("");
    const tableRows = rows.map((row, index) => `
      <tr class="${index === rows.length - 1 ? "total-row" : ""}">
        ${row.map(cell => `<td>${cell}</td>`).join("")}
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html lang="${hubLang}">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
@page { size: A4 landscape; margin: 18mm 14mm; }
body{font-family:"Segoe UI",Tahoma,sans-serif;margin:0;color:#1d2a44;background:#ffffff}
.sheet{padding:12px 4px 0}
.topline{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;border-bottom:2px solid #d9e2f0;padding-bottom:14px}
.brand h1{margin:0;font-size:24px;letter-spacing:.02em}
.brand p{margin:6px 0 0;color:#5d6b84;font-size:13px}
.meta{min-width:245px;border:1px solid #d9e2f0;border-radius:14px;padding:12px 14px;background:#f8fbff}
.meta-row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;font-size:13px}
.meta-row span{color:#5d6b84}
.title-block{text-align:center;padding:24px 0 18px}
.title-block h2{margin:0;font-size:22px}
.title-block p{margin:8px 0 0;color:#5d6b84;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{background:#eef4ff;border:1px solid #cfd8e6;padding:10px 12px;text-align:left}
tbody td{border:1px solid #d7deea;padding:10px 12px;vertical-align:top}
.total-row td{font-weight:800;background:#f4f8ff}
.footnote{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;margin-top:22px}
.footnote-box{border:1px solid #d9e2f0;border-radius:14px;padding:14px 16px;min-height:88px}
.footnote-box strong{display:block;font-size:12px;text-transform:uppercase;color:#5d6b84;letter-spacing:.04em}
.footnote-box p{margin:10px 0 0;line-height:1.6;color:#42526b;font-size:13px}
.signatures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:28px}
.sign-box{padding-top:18px;border-top:1px solid #cfd8e6}
.sign-box strong{display:block;font-size:13px}
.sign-box span{display:block;margin-top:28px;color:#5d6b84;font-size:12px}
.footer{text-align:center;margin-top:24px;color:#7a879c;font-size:11px}
@media print {
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
  <div class="sheet">
    <div class="topline">
      <div class="brand">
        <h1>${state.settings.companyName}</h1>
        <p>VÖEN: ${state.settings.taxId || "0000000000"}</p>
      </div>
      <div class="meta">
        <div class="meta-row"><span>${at.rpt_reportDate}</span><strong>${generatedAt}</strong></div>
        <div class="meta-row"><span>${at.rpt_period}</span><strong>${periodLabel}</strong></div>
        <div class="meta-row"><span>${at.rpt_currency}</span><strong>${state.settings.currency}</strong></div>
      </div>
    </div>
    <div class="title-block">
      <h2>${title}</h2>
      <p>${at.rpt_printSubtitle}</p>
    </div>
    <table>
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="footnote">
      <div class="footnote-box">
        <strong>${at.rpt_printNote}</strong>
        <p>${at.rpt_printNoteText}</p>
      </div>
      <div class="footnote-box">
        <strong>${at.rpt_printSource}</strong>
        <p>Tetavio ERP daxili hesabat modulu, tarix: ${generatedAt}</p>
      </div>
    </div>
    <div class="footer">${at.rpt_printFooter}</div>
  </div>
</body>
</html>`;
  }

  function exportReportPdf(title, rows) {
    const printWindow = window.open("", "_blank", "width=980,height=720");
    if (!printWindow) {
      setBackupStatus({ tone: "warning", message: "PDF görünüşü açıla bilmədi." });
      return;
    }
    printWindow.document.write(buildReportDocument(title, rows, (amount) => currency(amount, state.settings.currency)));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function ReportShell({ title, subtitle, badge, highlights, children, exportRows }) {
    return (
      <section className="view active report-view">
        <section className="report-hero">
          <div className="report-hero-main">
            <p className="eyebrow">Hesabat modulu</p>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <div className="report-hero-actions">
            <label className="report-period-field">
              <span>{at.rpt_period}</span>
              <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
                <option value="Bu ay">{at.rpt_periodThisMonth}</option>
                <option value="Bu rüb">{at.rpt_periodThisQuarter}</option>
                <option value="Cari il">{at.rpt_periodThisYear}</option>
              </select>
            </label>
            <div className="report-meta-chip"><span>{at.rpt_currency}</span><strong>{state.settings.currency}</strong></div>
            <div className="report-meta-chip"><span>{at.rpt_period}</span><strong>{getReportPeriodLabel()}</strong></div>
            <button className="ghost-btn compact-btn" type="button" onClick={() => exportReportPdf(title, exportRows)}>{at.rpt_pdfBtn}</button>
            <button className="primary-btn compact-btn" type="button" onClick={() => exportReportExcel(title, exportRows)}>{at.rpt_excelBtn}</button>
          </div>
        </section>
        <div className="report-highlight-grid">
          {highlights.map((item) => <article className="report-highlight-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}
        </div>
        <div className="panel-grid one-up report-layout">
          <section className="panel">
            <div className="panel-head"><div><h3>{title}</h3><p className="panel-copy">{subtitle}</p></div><span>{badge}</span></div>
            {children}
          </section>
        </div>
      </section>
    );
  }

  function renderFinancialPositionReport() {
    const fpLabel = (key) => ({ liquidFunds: at.fp_liquidFunds, shortReceivables: at.fp_shortReceivables, shortAdvances: at.fp_shortAdvances, recoverableVat: at.fp_recoverableVat, inventory: at.fp_inventory, totalCurrentAssets: at.fp_totalCurrentAssets, nonCurrentAssets: at.fp_nonCurrentAssets, totalAssets: at.fp_totalAssets, shortLiabilities: at.fp_shortLiabilities, longLiabilities: at.fp_longLiabilities, totalLiabilities: at.fp_totalLiabilities, shareCapital: at.fp_shareCapital, retainedEarnings: at.fp_retainedEarnings, periodResult: at.fp_periodResult, totalEquity: at.fp_totalEquity, totalLiabEquity: at.fp_totalLiabEquity }[key] || key);
    const range = getReportRange();
    const previousRange = getPreviousReportRange();
    const profitLossCloseRange = getProfitLossCloseRangeByYear(profitLossCloseYear);
    const prePreviousRange = getRangeBefore(previousRange);
    const lookup = getTrialBalanceLookup(range);
    const previousLookup = getTrialBalanceLookup(previousRange);
    const prePreviousLookup = getTrialBalanceLookup(prePreviousRange);
    const plAccounts = getProfitLossAccountGroups();
    const manualPlFallback = getManualJournalProfitLossFallback(range, plAccounts);
    const previousManualPlFallback = getManualJournalProfitLossFallback(previousRange, plAccounts);
    const prePreviousManualPlFallback = getManualJournalProfitLossFallback(prePreviousRange, plAccounts);
    const lookupPlTotals = getProfitLossTotalsFromLookup(lookup, plAccounts);
    const previousLookupPlTotals = getProfitLossTotalsFromLookup(previousLookup, plAccounts);
    const prePreviousLookupPlTotals = getProfitLossTotalsFromLookup(prePreviousLookup, plAccounts);
    const reportInvoices = state.invoices.filter((item) => isDateInRange(item.dueDate, range));
    const reportReceipts = state.salesReceipts.filter((item) => isDateInRange(item.date, range));
    const reportExpenses = state.expenses.filter((item) => isDateInRange(item.date || item.expenseDate || today(), range));
    const reportBills = state.bills.filter((item) => isDateInRange(item.dueDate, range));
    const previousInvoices = state.invoices.filter((item) => isDateInRange(item.dueDate, previousRange));
    const previousReceipts = state.salesReceipts.filter((item) => isDateInRange(item.date, previousRange));
    const previousExpenses = state.expenses.filter((item) => isDateInRange(item.date || item.expenseDate || today(), previousRange));
    const previousBills = state.bills.filter((item) => isDateInRange(item.dueDate, previousRange));
    const prePreviousInvoices = state.invoices.filter((item) => isDateInRange(item.dueDate, prePreviousRange));
    const prePreviousReceipts = state.salesReceipts.filter((item) => isDateInRange(item.date, prePreviousRange));
    const prePreviousExpenses = state.expenses.filter((item) => isDateInRange(item.date || item.expenseDate || today(), prePreviousRange));
    const prePreviousBills = state.bills.filter((item) => isDateInRange(item.dueDate, prePreviousRange));
    const cashAccounts = getFinancialPositionLineValue(lookup, "liquidFunds");
    const receivables = Math.max(getFinancialPositionLineValue(lookup, "shortReceivables"), Number(totals.receivables || 0));
    const shortAdvance = getFinancialPositionLineValue(lookup, "shortAdvances");
    const recoverableVat = getFinancialPositionLineValue(lookup, "recoverableVat");
    const inventory = getFinancialPositionLineValue(lookup, "inventory");
    const inventoryAccounts = getFinancialPositionLineRows(lookup, "inventory");
    const nonCurrentAssets = getFinancialPositionLineValue(lookup, "nonCurrentAssets");
    const liquidFunds = Number(Math.max(cashAccounts, Number(totals.bank || 0)).toFixed(2));
    const currentAssets = Number((liquidFunds + receivables + shortAdvance + recoverableVat + inventory).toFixed(2));
    const totalAssets = Number((currentAssets + nonCurrentAssets).toFixed(2));

    const currentLiabilities = getFinancialPositionLineValue(lookup, "shortLiabilities");
    const resolvedCurrentLiabilities = currentLiabilities > 0
      ? currentLiabilities
      : Number(totals.payables || 0);
    const longTermLiabilities = getFinancialPositionLineValue(lookup, "longLiabilities");
    const totalLiabilities = Number((resolvedCurrentLiabilities + longTermLiabilities).toFixed(2));

    const currentProfitLossRevenue = Math.max(lookupPlTotals.salesRevenue, manualPlFallback.salesRevenue, Number((reportInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0) + reportReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2)))
      + Math.max(lookupPlTotals.otherOperatingIncome, manualPlFallback.otherOperatingIncome)
      + Math.max(lookupPlTotals.financeIncome, manualPlFallback.financeIncome);
    const currentProfitLossExpense = Math.max(lookupPlTotals.costOfSales, manualPlFallback.costOfSales)
      + Math.max(lookupPlTotals.sellingExpenses, manualPlFallback.sellingExpenses, Number(reportExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)))
      + Math.max(lookupPlTotals.administrativeExpenses, manualPlFallback.administrativeExpenses, Number(reportBills.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)))
      + Math.max(lookupPlTotals.financeExpenses, manualPlFallback.financeExpenses)
      + Math.max(lookupPlTotals.otherOperatingExpenses, manualPlFallback.otherOperatingExpenses)
      + Math.max(lookupPlTotals.incomeTax, manualPlFallback.incomeTax);
    const currentNetResult = Number((currentProfitLossRevenue - currentProfitLossExpense).toFixed(2));

    const shareCapital = getFinancialPositionLineValue(lookup, "shareCapital");
    const previousProfitLossRevenue = Math.max(previousLookupPlTotals.salesRevenue, previousManualPlFallback.salesRevenue, Number((previousInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0) + previousReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2)))
      + Math.max(previousLookupPlTotals.otherOperatingIncome, previousManualPlFallback.otherOperatingIncome)
      + Math.max(previousLookupPlTotals.financeIncome, previousManualPlFallback.financeIncome);
    const previousProfitLossExpense = Math.max(previousLookupPlTotals.costOfSales, previousManualPlFallback.costOfSales)
      + Math.max(previousLookupPlTotals.sellingExpenses, previousManualPlFallback.sellingExpenses, Number(previousExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)))
      + Math.max(previousLookupPlTotals.administrativeExpenses, previousManualPlFallback.administrativeExpenses, Number(previousBills.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)))
      + Math.max(previousLookupPlTotals.financeExpenses, previousManualPlFallback.financeExpenses)
      + Math.max(previousLookupPlTotals.otherOperatingExpenses, previousManualPlFallback.otherOperatingExpenses)
      + Math.max(previousLookupPlTotals.incomeTax, previousManualPlFallback.incomeTax);
    const previousNetResult = Number((previousProfitLossRevenue - previousProfitLossExpense).toFixed(2));

    const explicitRetainedEarnings = getSignedClosingBalance(lookup.get("341"), "credit");
    const explicitPeriodResult = getSignedClosingBalance(lookup.get("801"), "credit");
    const retainedEarnings = Number((explicitRetainedEarnings + previousNetResult).toFixed(2));
    const periodProfit = Number((explicitPeriodResult + (currentNetResult - previousNetResult)).toFixed(2));
    const totalEquity = Number((shareCapital + retainedEarnings + periodProfit).toFixed(2));

    const assetRows = [
      [fpLabel("liquidFunds"), liquidFunds],
      [fpLabel("shortReceivables"), receivables],
      [fpLabel("shortAdvances"), shortAdvance],
      [fpLabel("recoverableVat"), recoverableVat],
      [fpLabel("inventory"), inventory],
      [fpLabel("totalCurrentAssets"), currentAssets],
      [fpLabel("nonCurrentAssets"), nonCurrentAssets],
      [fpLabel("totalAssets"), totalAssets]
    ];
    const liabilityRows = [
      [fpLabel("shortLiabilities"), resolvedCurrentLiabilities],
      [fpLabel("longLiabilities"), longTermLiabilities],
      [fpLabel("totalLiabilities"), totalLiabilities],
      [fpLabel("shareCapital"), shareCapital],
      [fpLabel("retainedEarnings"), retainedEarnings],
      [fpLabel("periodResult"), periodProfit],
      [fpLabel("totalEquity"), totalEquity],
      [fpLabel("totalLiabEquity"), Number((totalLiabilities + totalEquity).toFixed(2))]
    ];
    const exportRows = [
      ...assetRows.map(([label, amount]) => [`${at.fp_prefix}${label}`, amount]),
      ...liabilityRows.map(([label, amount]) => [`${at.fp_liabEquity} / ${label}`, amount])
    ];
    const previousCashAccounts = getFinancialPositionLineValue(previousLookup, "liquidFunds");
    const previousReceivables = getFinancialPositionLineValue(previousLookup, "shortReceivables");
    const previousShortAdvance = getFinancialPositionLineValue(previousLookup, "shortAdvances");
    const previousRecoverableVat = getFinancialPositionLineValue(previousLookup, "recoverableVat");
    const previousInventory = getFinancialPositionLineValue(previousLookup, "inventory");
    const previousNonCurrentAssets = getFinancialPositionLineValue(previousLookup, "nonCurrentAssets");
    const previousLiquidFunds = Number(previousCashAccounts.toFixed(2));
    const previousCurrentAssets = Number((previousLiquidFunds + previousReceivables + previousShortAdvance + previousRecoverableVat + previousInventory).toFixed(2));
    const previousTotalAssets = Number((previousCurrentAssets + previousNonCurrentAssets).toFixed(2));
    const previousCurrentLiabilities = getFinancialPositionLineValue(previousLookup, "shortLiabilities");
    const previousLongTermLiabilities = getFinancialPositionLineValue(previousLookup, "longLiabilities");
    const previousTotalLiabilities = Number((previousCurrentLiabilities + previousLongTermLiabilities).toFixed(2));
    const previousShareCapital = getFinancialPositionLineValue(previousLookup, "shareCapital");
    const prePreviousProfitLossRevenue = Math.max(prePreviousLookupPlTotals.salesRevenue, prePreviousManualPlFallback.salesRevenue, Number((prePreviousInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0) + prePreviousReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2)))
      + Math.max(prePreviousLookupPlTotals.otherOperatingIncome, prePreviousManualPlFallback.otherOperatingIncome)
      + Math.max(prePreviousLookupPlTotals.financeIncome, prePreviousManualPlFallback.financeIncome);
    const prePreviousProfitLossExpense = Math.max(prePreviousLookupPlTotals.costOfSales, prePreviousManualPlFallback.costOfSales)
      + Math.max(prePreviousLookupPlTotals.sellingExpenses, prePreviousManualPlFallback.sellingExpenses, Number(prePreviousExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)))
      + Math.max(prePreviousLookupPlTotals.administrativeExpenses, prePreviousManualPlFallback.administrativeExpenses, Number(prePreviousBills.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)))
      + Math.max(prePreviousLookupPlTotals.financeExpenses, prePreviousManualPlFallback.financeExpenses)
      + Math.max(prePreviousLookupPlTotals.otherOperatingExpenses, prePreviousManualPlFallback.otherOperatingExpenses)
      + Math.max(prePreviousLookupPlTotals.incomeTax, prePreviousManualPlFallback.incomeTax);
    const prePreviousNetResult = Number((prePreviousProfitLossRevenue - prePreviousProfitLossExpense).toFixed(2));
    const previousExplicitRetainedEarnings = getSignedClosingBalance(previousLookup.get("341"), "credit");
    const previousExplicitPeriodResult = getSignedClosingBalance(previousLookup.get("801"), "credit");
    const previousRetainedEarnings = Number((previousExplicitRetainedEarnings + prePreviousNetResult).toFixed(2));
    const previousPeriodProfit = Number((previousExplicitPeriodResult + (previousNetResult - prePreviousNetResult)).toFixed(2));
    const previousTotalEquity = Number((previousShareCapital + previousRetainedEarnings + previousPeriodProfit).toFixed(2));
    const previousAssetRows = [
      [fpLabel("liquidFunds"), previousLiquidFunds],
      [fpLabel("shortReceivables"), previousReceivables],
      [fpLabel("shortAdvances"), previousShortAdvance],
      [fpLabel("recoverableVat"), previousRecoverableVat],
      [fpLabel("inventory"), previousInventory],
      [fpLabel("totalCurrentAssets"), previousCurrentAssets],
      [fpLabel("nonCurrentAssets"), previousNonCurrentAssets],
      [fpLabel("totalAssets"), previousTotalAssets]
    ];
    const previousLiabilityRows = [
      [fpLabel("shortLiabilities"), previousCurrentLiabilities],
      [fpLabel("longLiabilities"), previousLongTermLiabilities],
      [fpLabel("totalLiabilities"), previousTotalLiabilities],
      [fpLabel("shareCapital"), previousShareCapital],
      [fpLabel("retainedEarnings"), previousRetainedEarnings],
      [fpLabel("periodResult"), previousPeriodProfit],
      [fpLabel("totalEquity"), previousTotalEquity],
      [fpLabel("totalLiabEquity"), Number((previousTotalLiabilities + previousTotalEquity).toFixed(2))]
    ];

    const unmappedBalanceSheetAccounts = getUnmappedFinancialPositionAccounts(lookup);
    const cur = state.settings.currency;
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    const currentAssetItems = [
      { label: fpLabel("liquidFunds"), value: liquidFunds, icon: "💵" },
      { label: fpLabel("shortReceivables"), value: receivables, icon: "📄" },
      { label: fpLabel("shortAdvances"), value: shortAdvance, icon: "📤" },
      { label: fpLabel("recoverableVat"), value: recoverableVat, icon: "🧾" },
      { label: fpLabel("inventory"), value: inventory, icon: "📦" },
    ];
    const currentLiabItems = [
      { label: fpLabel("shortLiabilities"), value: resolvedCurrentLiabilities, icon: "⏱️" },
      { label: fpLabel("longLiabilities"), value: longTermLiabilities, icon: "📋" },
    ];
    const equityItems = [
      { label: fpLabel("shareCapital"), value: shareCapital, icon: "🏛️" },
      { label: fpLabel("retainedEarnings"), value: retainedEarnings, icon: "💼" },
      { label: fpLabel("periodResult"), value: periodProfit, icon: periodProfit >= 0 ? "📈" : "📉" },
    ];

    function FpRow({ icon, label, value, total, indent }) {
      const pct = total > 0 ? Math.min((Math.abs(value) / total) * 100, 100) : 0;
      return (
        <div className={`fp-row${indent ? " fp-row-indent" : ""}`}>
          <span className="fp-row-icon">{icon}</span>
          <span className="fp-row-label">{label}</span>
          <div className="fp-row-bar"><div className="fp-row-bar-fill" style={{ width: `${pct}%` }} /></div>
          <strong className="fp-row-value">{currency(value, cur)}</strong>
        </div>
      );
    }

    return (
      <ReportShell
        title={at.fp_reportTitle}
        subtitle={at.fp_reportSubtitle}
        badge={at.fp_badge}
        exportRows={exportRows}
        highlights={[
          { label: at.fp_totalAssets, value: currency(totalAssets, cur) },
          { label: at.fp_totalLiab, value: currency(totalLiabilities, cur) },
          { label: at.fp_totalCap, value: currency(totalEquity, cur) }
        ]}
      >
        {/* Balance check banner */}
        <div className={`fp-balance-banner ${isBalanced ? "fp-balanced" : "fp-unbalanced"}`}>
          <span>{isBalanced ? "✅" : "⚠️"}</span>
          <span>{isBalanced ? at.fp_balanced : `${at.fp_unbalanced}: ${currency(Math.abs(totalAssets - (totalLiabilities + totalEquity)), cur)}`}</span>
        </div>

        {unmappedBalanceSheetAccounts.length ? (
          <div className="fp-diagnostics-card">
            <div className="fp-diagnostics-head">
              <strong>Unmapped balance sheet accounts</strong>
              <span>{unmappedBalanceSheetAccounts.length}</span>
            </div>
            <p>These balance sheet accounts have balances but are not mapped to any report line.</p>
            <div className="fp-diagnostics-list">
              {unmappedBalanceSheetAccounts.map((account) => (
                <div className="fp-diagnostics-item" key={account.accountCode}>
                  <span>{account.accountCode} - {account.accountName}</span>
                  <strong>{currency(account.value, cur)}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="fp-layout">
          {/* ── ASSETS ── */}
          <div className="fp-col">
            <div className="fp-col-header fp-col-assets">
              <div className="fp-col-header-icon">🏦</div>
              <div>
                <span>{at.fp_assets}</span>
                <strong>{currency(totalAssets, cur)}</strong>
              </div>
            </div>

            <div className="fp-section">
              <div className="fp-section-title">{at.fp_currentAssets}</div>
              {currentAssetItems.map(({ label, value, icon }) => (
                <FpRow key={label} icon={icon} label={label} value={value} total={totalAssets} indent />
              ))}
              {inventoryAccounts.length ? (
                <div className="fp-line-meta">
                  Inventory GL accounts: {inventoryAccounts.map((account) => account.accountCode).join(", ")}
                </div>
              ) : null}
              <div className="fp-subtotal">
                <span>{at.fp_totalCurrentAssets}</span>
                <strong>{currency(currentAssets, cur)}</strong>
              </div>
            </div>

            <div className="fp-section">
              <div className="fp-section-title">{at.fp_nonCurrentAssets}</div>
              <FpRow icon="🏗️" label={at.fp_nonCurrentAssets} value={nonCurrentAssets} total={totalAssets} indent />
              <div className="fp-subtotal">
                <span>{at.fp_totalNonCurrentAssets}</span>
                <strong>{currency(nonCurrentAssets, cur)}</strong>
              </div>
            </div>

            <div className="fp-total-row">
              <span>{at.fp_totalAssets}</span>
              <strong>{currency(totalAssets, cur)}</strong>
            </div>
          </div>

          {/* ── LIABILITIES + EQUITY ── */}
          <div className="fp-col">
            <div className="fp-col-header fp-col-liab">
              <div className="fp-col-header-icon">⚖️</div>
              <div>
                <span>{at.fp_liabEquity}</span>
                <strong>{currency(totalLiabilities + totalEquity, cur)}</strong>
              </div>
            </div>

            <div className="fp-section">
              <div className="fp-section-title">{at.fp_liabilities}</div>
              {currentLiabItems.map(({ label, value, icon }) => (
                <FpRow key={label} icon={icon} label={label} value={value} total={totalLiabilities + totalEquity} indent />
              ))}
              <div className="fp-subtotal">
                <span>{at.fp_totalLiabilities}</span>
                <strong>{currency(totalLiabilities, cur)}</strong>
              </div>
            </div>

            <div className="fp-section">
              <div className="fp-section-title">{at.fp_equity}</div>
              {equityItems.map(({ label, value, icon }) => (
                <FpRow key={label} icon={icon} label={label} value={value} total={totalLiabilities + totalEquity} indent />
              ))}
              <div className="fp-subtotal">
                <span>{at.fp_totalEquity}</span>
                <strong>{currency(totalEquity, cur)}</strong>
              </div>
            </div>

            <div className="fp-total-row">
              <span>{at.fp_totalLiabEquity}</span>
              <strong>{currency(totalLiabilities + totalEquity, cur)}</strong>
            </div>
          </div>
        </div>

        {renderComparisonTable(
          [...assetRows, ...liabilityRows],
          [...previousAssetRows, ...previousLiabilityRows],
          range,
          previousRange
        )}
      </ReportShell>
    );
  }

  function getProfitLossCloseRangeByYear(yearValue) {
    const normalizedYear = Number(yearValue || state.settings.fiscalYear || new Date().getFullYear());
    return {
      start: `${normalizedYear}-01-01`,
      end: `${normalizedYear}-12-31`
    };
  }

  function toggleProfitLossCloseByRange(range) {
    const plan = buildProfitLossClosingPlan(range);
    const rangeYear = String(range.start).slice(0, 4);
    const existingAutoCloseJournal = state.manualJournals.find((j) =>
      (j.autoCloseType === "profit_loss_closure" ||
       String(j.journalNumber || "").startsWith("PLC-") ||
       String(j.reference || "").startsWith("P&L close")) &&
      (String(j.reference || "").includes(rangeYear) ||
       String(j.autoCloseKey || "").includes(rangeYear) ||
       String(j.journalNumber || "").includes(rangeYear.replace(/-/g, "")))
    );

    if (existingAutoCloseJournal) {
      const confirmedReopen = window.confirm(`${range.start} - ${range.end} dövrü üçün bağlanışı geri açmaq istəyirsiniz?`);
      if (!confirmedReopen) return;
      setState((current) => ({
        ...current,
        manualJournals: current.manualJournals.filter((journal) => journal.id !== existingAutoCloseJournal.id)
      }));
      window.alert("Bağlanış geri açıldı.");
      return;
    }

    if (!plan.lines.length) {
      window.alert("Seçilmiş il üçün bağlanacaq gəlir və ya xərc qalığı tapılmadı.");
      return;
    }
    if (!guardOperationAccess()) return;

    const confirmed = window.confirm(`${range.start} - ${range.end} dövrü üçün gəlir və xərc hesabları 801 hesabına bağlanacaq. Davam edilsin?`);
    if (!confirmed) return;

    const reference = `P&L close ${plan.range.start} - ${plan.range.end}`;
    const journalNumber = `PLC-${plan.range.end.replaceAll("-", "")}`;
    const nextRecord = {
      id: crypto.randomUUID(),
      createdAt: today(),
      date: plan.journalDate,
      journalNumber,
      reference,
      notes: `Auto close for ${plan.range.start} - ${plan.range.end}`,
      autoGenerated: true,
      autoCloseType: "profit_loss_closure",
      autoCloseKey: plan.periodKey,
      journalLines: plan.lines,
      debitAccount: plan.lines.find((line) => line.entryType === "Debet")?.accountCode || "",
      creditAccount: plan.lines.find((line) => line.entryType === "Kredit")?.accountCode || "",
      debit: plan.debitTotal,
      credit: plan.creditTotal
    };

    setState((current) => {
      const hasPeriodResultAccount = current.chartOfAccounts.some((account) => account.accountCode === "801");
      const nextChartOfAccounts = hasPeriodResultAccount
        ? current.chartOfAccounts
        : [...current.chartOfAccounts, {
            id: "801",
            accountCode: "801",
            accountName: getAccountNameByCode("801"),
            accountType: "Kapital",
            status: "Aktiv",
            balance: 0
          }].sort((left, right) => Number(left.accountCode) - Number(right.accountCode));

      return {
        ...current,
        chartOfAccounts: nextChartOfAccounts,
        manualJournals: [nextRecord, ...current.manualJournals]
      };
    });
    markOperationUsage();
    window.alert("Bağlanış yaradıldı.");
  }

  function renderProfitLossReport() {
    const plLabel = (key) => ({ salesRev: at.pl_salesRev, otherOpIncome: at.pl_otherOpIncome, finIncome: at.pl_finIncome, totalRev: at.pl_totalRev, costOfSales: at.pl_costOfSales, grossProfit: at.pl_grossProfit, selling: at.pl_selling, admin: at.pl_admin, finEx: at.pl_finEx, otherOpEx: at.pl_otherOpEx, totalOpEx: at.pl_totalOpEx, incomeTax: at.pl_incomeTax, netResult: at.pl_netResult }[key] || key);
    const range = getReportRange();
    const previousRange = getPreviousReportRange();
    const plLookupOptions = { excludeAutoCloseTypes: ["profit_loss_closure"] };
    const lookup = getTrialBalanceLookup(range, plLookupOptions);
    const previousLookup = getTrialBalanceLookup(previousRange, plLookupOptions);
    const plAccounts = getProfitLossAccountGroups();
    const manualFallback = getManualJournalProfitLossFallback(range, plAccounts, plLookupOptions);
    const previousManualFallback = getManualJournalProfitLossFallback(previousRange, plAccounts, plLookupOptions);
    const lookupPlTotals = getProfitLossTotalsFromLookup(lookup, plAccounts);
    const previousLookupPlTotals = getProfitLossTotalsFromLookup(previousLookup, plAccounts);
    const profitLossCloseRange = getProfitLossCloseRangeByYear(profitLossCloseYear);
    const profitLossClosingPlan = buildProfitLossClosingPlan(profitLossCloseRange);
    const selectedYearStr = String(profitLossCloseYear);
    const isPLCloseJournal = (j) =>
      j.autoCloseType === "profit_loss_closure" ||
      String(j.journalNumber || "").startsWith("PLC-") ||
      String(j.reference || "").startsWith("P&L close");
    const isForSelectedYear = (j) =>
      String(j.reference || "").includes(selectedYearStr) ||
      String(j.autoCloseKey || "").includes(selectedYearStr) ||
      String(j.journalNumber || "").includes(selectedYearStr.replace(/-/g, ""));
    const hasProfitLossAutoClose = state.manualJournals.some((j) => isPLCloseJournal(j) && isForSelectedYear(j));
    const profitLossCloseYears = [2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020];
    const reportManualJournals = state.manualJournals
      .filter((item) => item.autoCloseType !== "profit_loss_closure")
      .filter((item) => isDateInRange(item.date || item.createdAt || today(), range));
    const manualJournalStats = reportManualJournals.reduce((acc, journal) => {
      const lines = Array.isArray(journal.journalLines) && journal.journalLines.length
        ? journal.journalLines.filter((line) => line.accountCode && Number(line.amount || 0) > 0)
        : [
            journal.debitAccount ? { accountCode: journal.debitAccount, entryType: "Debet", amount: journal.debit } : null,
            journal.creditAccount ? { accountCode: journal.creditAccount, entryType: "Kredit", amount: journal.credit } : null
          ].filter(Boolean);
      if (!lines.length) return acc;
      acc.total += 1;
      let impactsProfitLoss = false;
      lines.forEach((line) => {
        const accountType = inferAccountTypeFromCode(line.accountCode, state.chartOfAccounts.find((account) => account.accountCode === line.accountCode)?.accountType || "");
        if (accountType === "Gəlir") {
          acc.income += 1;
          impactsProfitLoss = true;
        } else if (accountType === "Xərc") {
          acc.expense += 1;
          impactsProfitLoss = true;
        } else {
          acc.balance += 1;
        }
      });
      if (!impactsProfitLoss) acc.balanceOnly += 1;
      return acc;
    }, { total: 0, income: 0, expense: 0, balance: 0, balanceOnly: 0 });
    const reportInvoices = state.invoices.filter((item) => isDateInRange(item.dueDate, range));
    const reportReceipts = state.salesReceipts.filter((item) => isDateInRange(item.date, range));
    const reportExpenses = state.expenses.filter((item) => isDateInRange(item.date || item.expenseDate || today(), range));
    const reportBills = state.bills.filter((item) => isDateInRange(item.dueDate, range));
    const salesRevenue = Math.max(lookupPlTotals.salesRevenue, manualFallback.salesRevenue, Number((reportInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0) + reportReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2)));
    const otherOperatingIncome = Math.max(lookupPlTotals.otherOperatingIncome, manualFallback.otherOperatingIncome);
    const financeIncome = Math.max(lookupPlTotals.financeIncome, manualFallback.financeIncome);
    const totalRevenue = Number((salesRevenue + otherOperatingIncome + financeIncome).toFixed(2));

    const costOfSales = Math.max(lookupPlTotals.costOfSales, manualFallback.costOfSales);
    const grossProfit = Number((totalRevenue - costOfSales).toFixed(2));

    const sellingExpenses = Math.max(lookupPlTotals.sellingExpenses, manualFallback.sellingExpenses, Number(reportExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)));
    const administrativeExpenses = Math.max(lookupPlTotals.administrativeExpenses, manualFallback.administrativeExpenses, Number(reportBills.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)));
    const financeExpenses = Math.max(lookupPlTotals.financeExpenses, manualFallback.financeExpenses);
    const otherOperatingExpenses = Math.max(lookupPlTotals.otherOperatingExpenses, manualFallback.otherOperatingExpenses);
    const operatingExpenses = Number((sellingExpenses + administrativeExpenses + financeExpenses + otherOperatingExpenses).toFixed(2));
    const profitBeforeTax = Number((grossProfit - operatingExpenses).toFixed(2));
    const incomeTax = Math.max(lookupPlTotals.incomeTax, manualFallback.incomeTax);
    const netResult = Number((profitBeforeTax - incomeTax).toFixed(2));
    const rows = [
      [plLabel("salesRev"), salesRevenue],
      [plLabel("otherOpIncome"), otherOperatingIncome],
      [plLabel("finIncome"), financeIncome],
      [plLabel("totalRev"), totalRevenue],
      [plLabel("costOfSales"), costOfSales],
      [plLabel("grossProfit"), grossProfit],
      [plLabel("selling"), sellingExpenses],
      [plLabel("admin"), administrativeExpenses],
      [plLabel("finEx"), financeExpenses],
      [plLabel("otherOpEx"), otherOperatingExpenses],
      [plLabel("incomeTax"), incomeTax],
      [plLabel("netResult"), netResult]
    ];
    const previousInvoices = state.invoices.filter((item) => isDateInRange(item.dueDate, previousRange));
    const previousReceipts = state.salesReceipts.filter((item) => isDateInRange(item.date, previousRange));
    const previousExpenses = state.expenses.filter((item) => isDateInRange(item.date || item.expenseDate || today(), previousRange));
    const previousBills = state.bills.filter((item) => isDateInRange(item.dueDate, previousRange));
    const previousSalesRevenue = Math.max(previousLookupPlTotals.salesRevenue, previousManualFallback.salesRevenue, Number((previousInvoices.reduce((sum, item) => sum + Number(item.amount || 0), 0) + previousReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2)));
    const previousOtherOperatingIncome = Math.max(previousLookupPlTotals.otherOperatingIncome, previousManualFallback.otherOperatingIncome);
    const previousFinanceIncome = Math.max(previousLookupPlTotals.financeIncome, previousManualFallback.financeIncome);
    const previousTotalRevenue = Number((previousSalesRevenue + previousOtherOperatingIncome + previousFinanceIncome).toFixed(2));
    const previousCostOfSales = Math.max(previousLookupPlTotals.costOfSales, previousManualFallback.costOfSales);
    const previousGrossProfit = Number((previousTotalRevenue - previousCostOfSales).toFixed(2));
    const previousSellingExpenses = Math.max(previousLookupPlTotals.sellingExpenses, previousManualFallback.sellingExpenses, Number(previousExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)));
    const previousAdministrativeExpenses = Math.max(previousLookupPlTotals.administrativeExpenses, previousManualFallback.administrativeExpenses, Number(previousBills.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)));
    const previousFinanceExpenses = Math.max(previousLookupPlTotals.financeExpenses, previousManualFallback.financeExpenses);
    const previousOtherOperatingExpenses = Math.max(previousLookupPlTotals.otherOperatingExpenses, previousManualFallback.otherOperatingExpenses);
    const previousIncomeTax = Math.max(previousLookupPlTotals.incomeTax, previousManualFallback.incomeTax);
    const previousRows = [
      [plLabel("salesRev"), previousSalesRevenue],
      [plLabel("otherOpIncome"), previousOtherOperatingIncome],
      [plLabel("finIncome"), previousFinanceIncome],
      [plLabel("totalRev"), previousTotalRevenue],
      [plLabel("costOfSales"), previousCostOfSales],
      [plLabel("grossProfit"), previousGrossProfit],
      [plLabel("selling"), previousSellingExpenses],
      [plLabel("admin"), previousAdministrativeExpenses],
      [plLabel("finEx"), previousFinanceExpenses],
      [plLabel("otherOpEx"), previousOtherOperatingExpenses],
      [plLabel("incomeTax"), previousIncomeTax],
      [plLabel("netResult"), Number((previousGrossProfit - (previousSellingExpenses + previousAdministrativeExpenses + previousFinanceExpenses + previousOtherOperatingExpenses) - previousIncomeTax).toFixed(2))]
    ];

    const cur = (v) => currency(v, state.settings.currency);
    const pct = (v) => totalRevenue > 0 ? Math.min(100, Math.abs((v / totalRevenue) * 100)) : 0;
    const isProfit = netResult >= 0;
    const profitMargin = totalRevenue > 0 ? ((netResult / totalRevenue) * 100).toFixed(1) : "0.0";
    const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";

    function PlRow({ icon, label, value, isTotal, isExpense, indent }) {
      const barPct = pct(value);
      return (
        <div className={`pl-row${isTotal ? " pl-row-total" : ""}${indent ? " pl-row-indent" : ""}`}>
          <div className="pl-row-left">
            <span className="pl-row-icon">{icon}</span>
            <span className="pl-row-label">{label}</span>
          </div>
          <div className="pl-row-right">
            <div className="pl-row-bar-wrap">
              <div className={`pl-row-bar-fill ${isExpense ? "pl-bar-red" : "pl-bar-green"}`} style={{ width: `${barPct}%` }} />
            </div>
            <span className={`pl-row-value${value < 0 ? " pl-value-neg" : ""}`}>{cur(value)}</span>
          </div>
        </div>
      );
    }

    return (
      <ReportShell
        title={at.pl_reportTitle}
        subtitle={at.pl_reportSubtitle}
        badge={at.pl_badge}
        exportRows={rows}
        highlights={[
          { label: at.pl_totalRevenue, value: cur(totalRevenue) },
          { label: at.pl_grossProfit, value: cur(grossProfit) },
          { label: at.pl_operatingExpenses, value: cur(operatingExpenses) },
          { label: at.pl_netOutcome, value: cur(netResult) }
        ]}
      >
        {/* ── Result Banner ── */}
        <div className={`pl-result-banner ${isProfit ? "pl-result-profit" : "pl-result-loss"}`}>
          <div className="pl-result-main">
            <span className="pl-result-emoji">{isProfit ? "📈" : "📉"}</span>
            <div>
              <div className="pl-result-title">{at.pl_netResult}</div>
              <div className="pl-result-amount">{cur(Math.abs(netResult))}</div>
            </div>
          </div>
          <div className="pl-result-metrics">
            <div className="pl-result-metric">
              <span className="pl-metric-val">{profitMargin}%</span>
              <span className="pl-metric-lbl">{at.pl_netMargin}</span>
            </div>
            <div className="pl-result-divider" />
            <div className="pl-result-metric">
              <span className="pl-metric-val">{grossMargin}%</span>
              <span className="pl-metric-lbl">{at.pl_grossMargin}</span>
            </div>
          </div>
        </div>

        <section className="pl-note-card">
          <div className="pl-close-toolbar">
            <div className="pl-close-copy">
              <strong>{at.pl_closeBtn || "Mənfəət / zərəri bağla"}</strong>
              <p>{at.pl_closeHint || "Seçilmiş ilin gəlir və xərc hesablarını 801 hesabına avtomatik bağlayır."}</p>
            </div>
            <div className="pl-close-actions">
              <label className="pl-close-year-field">
                <span>{at.rpt_fiscalYear || "İl"}</span>
                <select value={profitLossCloseYear} onChange={(event) => setProfitLossCloseYear(event.target.value)}>
                  {profitLossCloseYears.map((year) => <option key={`pl-close-year-${year}`} value={String(year)}>{year}</option>)}
                </select>
              </label>
              <button
                className={`compact-btn ${hasProfitLossAutoClose ? "danger-btn" : "primary-btn"}`}
                type="button"
                onClick={() => toggleProfitLossCloseByRange(profitLossCloseRange)}
                disabled={!hasProfitLossAutoClose && !profitLossClosingPlan.lines.length}
              >
                {hasProfitLossAutoClose ? "✕ Bağlanışı ləğv et" : "Bağla"}
              </button>
            </div>
          </div>
          <div className="pl-note-head">
            <strong>Əl ilə daxil edilən əməliyyatların təsiri</strong>
            <span>{reportManualJournals.length} jurnal</span>
          </div>
          <p>
            Bu hesabat yalnız gəlir və xərc hesablarına yazılan manual əməliyyatları sayır.
            Yalnız balans hesabları ilə yazılmış jurnallar mənfəət və zərərə düşmür.
          </p>
          <div className="pl-note-stats">
            <span className="pl-note-chip income">Gəlir xətti: {manualJournalStats.income}</span>
            <span className="pl-note-chip expense">Xərc xətti: {manualJournalStats.expense}</span>
            <span className="pl-note-chip balance">Balans xətti: {manualJournalStats.balance}</span>
            <span className="pl-note-chip neutral">Yalnız balans jurnalı: {manualJournalStats.balanceOnly}</span>
          </div>
        </section>

        {/* ── Flow Sections ── */}
        <div className="pl-flow">

          {/* Revenue */}
          <div className="pl-section">
            <div className="pl-sec-header pl-sec-income">
              <span className="pl-sec-icon">💰</span>
              <span>{at.pl_revenue}</span>
            </div>
            <PlRow icon="🛒" label={at.pl_salesRev} value={salesRevenue} indent />
            <PlRow icon="📦" label={at.pl_otherOpIncome} value={otherOperatingIncome} indent />
            <PlRow icon="🏦" label={at.pl_finIncome} value={financeIncome} indent />
            <PlRow icon="Σ" label={at.pl_totalRev} value={totalRevenue} isTotal />
          </div>

          {/* Cost of Sales + Gross Profit */}
          <div className="pl-section">
            <div className="pl-sec-header pl-sec-cost">
              <span className="pl-sec-icon">🏭</span>
              <span>{at.pl_cogs}</span>
            </div>
            <PlRow icon="🏭" label={at.pl_costOfSales} value={costOfSales} isExpense indent />
            <div className={`pl-gross-band ${grossProfit >= 0 ? "pl-gross-pos" : "pl-gross-neg"}`}>
              <div className="pl-gross-progress">
                <div className="pl-gross-bar" style={{ width: `${totalRevenue > 0 ? Math.min(100, (Math.abs(grossProfit) / totalRevenue) * 100) : 0}%` }} />
              </div>
              <span className="pl-gross-label">{at.pl_grossProfit}</span>
              <strong className="pl-gross-value">{cur(grossProfit)}</strong>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="pl-section">
            <div className="pl-sec-header pl-sec-expense">
              <span className="pl-sec-icon">📋</span>
              <span>{at.pl_opex}</span>
            </div>
            <PlRow icon="🛒" label={at.pl_selling} value={sellingExpenses} isExpense indent />
            <PlRow icon="🏢" label={at.pl_admin} value={administrativeExpenses} isExpense indent />
            <PlRow icon="💳" label={at.pl_finEx} value={financeExpenses} isExpense indent />
            <PlRow icon="📋" label={at.pl_otherOpEx} value={otherOperatingExpenses} isExpense indent />
            <PlRow icon="Σ" label={at.pl_totalOpEx} value={operatingExpenses} isTotal isExpense />
          </div>

          {/* Tax + Net Result */}
          <div className="pl-section">
            <div className="pl-sec-header pl-sec-tax">
              <span className="pl-sec-icon">⚖️</span>
              <span>{at.pl_taxNet}</span>
            </div>
            <div className="pl-pretax-row">
              <span>{at.pl_ebt}</span>
              <span className={profitBeforeTax < 0 ? "pl-value-neg" : ""}>{cur(profitBeforeTax)}</span>
            </div>
            <PlRow icon="📑" label={at.pl_incomeTax} value={incomeTax} isExpense indent />
            <div className={`pl-net-band ${isProfit ? "pl-net-pos" : "pl-net-neg"}`}>
              <span className="pl-net-emoji">{isProfit ? "📈" : "📉"}</span>
              <span className="pl-net-lbl">{isProfit ? at.pl_netProfit : at.pl_netLoss}</span>
              <strong className="pl-net-val">{cur(netResult)}</strong>
            </div>
          </div>

        </div>

        {renderComparisonTable(rows, previousRows, range, previousRange)}
      </ReportShell>
    );
  }

  function renderCashFlowReport() {
    const range = getReportRange();
    const previousRange = getPreviousReportRange();
    const lookup = getTrialBalanceLookup(range);
    const previousLookup = getTrialBalanceLookup(previousRange);
    const reportReceipts = state.salesReceipts.filter((item) => isDateInRange(item.date, range));
    const reportPayments = state.paymentsReceived.filter((item) => isDateInRange(item.date || item.paymentDate || today(), range));
    const reportExpenses = state.expenses.filter((item) => isDateInRange(item.date || item.expenseDate || today(), range));
    const reportBills = state.bills.filter((item) => isDateInRange(item.dueDate, range));
    const reportBankTransactions = state.bankTransactions.filter((item) => isDateInRange(item.date, range));
    const operatingInflows = Number((reportPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0) + reportReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2));
    const operatingOutflows = Number((reportExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) + reportBills.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2));

    const investingInflowCategories = ["aktiv satışı", "əsas vəsait satışı", "investisiya"];
    const financingInflowCategories = ["kredit", "borc", "kapital", "avans"];
    const investingOutflowCategories = ["əsas vəsait", "avadanlıq", "investisiya", "aktiv alışı"];
    const financingOutflowCategories = ["kredit ödənişi", "dividend", "kapitalın qaytarılması", "faiz"];

    const bankRollup = reportBankTransactions.reduce((sum, tx) => {
      const category = String(tx.category || "").toLowerCase();
      const description = String(tx.description || "").toLowerCase();
      const haystack = `${category} ${description}`;
      const amount = Number(tx.amount || 0);
      const isInflow = tx.transactionType === "Mədaxil";

      if (isInflow && investingInflowCategories.some((item) => haystack.includes(item))) {
        sum.investingIn += amount;
      } else if (isInflow && financingInflowCategories.some((item) => haystack.includes(item))) {
        sum.financingIn += amount;
      } else if (!isInflow && investingOutflowCategories.some((item) => haystack.includes(item))) {
        sum.investingOut += amount;
      } else if (!isInflow && financingOutflowCategories.some((item) => haystack.includes(item))) {
        sum.financingOut += amount;
      } else if (isInflow) {
        sum.operatingIn += amount;
      } else {
        sum.operatingOut += amount;
      }

      return sum;
    }, { operatingIn: 0, operatingOut: 0, investingIn: 0, investingOut: 0, financingIn: 0, financingOut: 0 });

    const vatMovement = sumAccountGroup(lookup, ["241", "521"], "debit");
    const adjustedOperatingIn = Number(Math.max(operatingInflows, bankRollup.operatingIn).toFixed(2));
    const adjustedOperatingOut = Number(Math.max(operatingOutflows, bankRollup.operatingOut + vatMovement).toFixed(2));
    const investingNet = Number((bankRollup.investingIn - bankRollup.investingOut).toFixed(2));
    const financingNet = Number((bankRollup.financingIn - bankRollup.financingOut).toFixed(2));
    const operatingNet = Number((adjustedOperatingIn - adjustedOperatingOut).toFixed(2));
    const netCashFlow = Number((operatingNet + investingNet + financingNet).toFixed(2));
    const closingCash = Number(totals.bank.toFixed(2));
    const openingCash = Number((closingCash - netCashFlow).toFixed(2));

    const operatingRows = [
      [at.cf_opIn, adjustedOperatingIn],
      [at.cf_opOut, adjustedOperatingOut],
      [at.cf_opNet, operatingNet]
    ];
    const investingRows = [
      [at.cf_invIn, Number(bankRollup.investingIn.toFixed(2))],
      [at.cf_invOut, Number(bankRollup.investingOut.toFixed(2))],
      [at.cf_invNet, investingNet]
    ];
    const financingRows = [
      [at.cf_finIn, Number(bankRollup.financingIn.toFixed(2))],
      [at.cf_finOut, Number(bankRollup.financingOut.toFixed(2))],
      [at.cf_finNet, financingNet]
    ];
    const exportRows = [
      ...operatingRows.map(([label, amount]) => [`${at.cf_operatingActivity} / ${label}`, amount]),
      ...investingRows.map(([label, amount]) => [`${at.cf_investingActivity} / ${label}`, amount]),
      ...financingRows.map(([label, amount]) => [`${at.cf_financingActivity} / ${label}`, amount]),
      [at.cf_openingCashFlow, openingCash],
      [at.cf_closingCashFlow, closingCash]
    ];
    const previousReceipts = state.salesReceipts.filter((item) => isDateInRange(item.date, previousRange));
    const previousPayments = state.paymentsReceived.filter((item) => isDateInRange(item.date || item.paymentDate || today(), previousRange));
    const previousExpenses = state.expenses.filter((item) => isDateInRange(item.date || item.expenseDate || today(), previousRange));
    const previousBills = state.bills.filter((item) => isDateInRange(item.dueDate, previousRange));
    const previousBankTransactions = state.bankTransactions.filter((item) => isDateInRange(item.date, previousRange));
    const previousOperatingInflows = Number((previousPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0) + previousReceipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2));
    const previousOperatingOutflows = Number((previousExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) + previousBills.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toFixed(2));
    const previousBankRollup = previousBankTransactions.reduce((sum, tx) => {
      const category = String(tx.category || "").toLowerCase();
      const description = String(tx.description || "").toLowerCase();
      const haystack = `${category} ${description}`;
      const amount = Number(tx.amount || 0);
      const isInflow = tx.transactionType === "Mədaxil";

      if (isInflow && investingInflowCategories.some((item) => haystack.includes(item))) sum.investingIn += amount;
      else if (isInflow && financingInflowCategories.some((item) => haystack.includes(item))) sum.financingIn += amount;
      else if (!isInflow && investingOutflowCategories.some((item) => haystack.includes(item))) sum.investingOut += amount;
      else if (!isInflow && financingOutflowCategories.some((item) => haystack.includes(item))) sum.financingOut += amount;
      else if (isInflow) sum.operatingIn += amount;
      else sum.operatingOut += amount;
      return sum;
    }, { operatingIn: 0, operatingOut: 0, investingIn: 0, investingOut: 0, financingIn: 0, financingOut: 0 });
    const previousVatMovement = sumAccountGroup(previousLookup, ["241", "521"], "debit");
    const previousAdjustedOperatingIn = Number(Math.max(previousOperatingInflows, previousBankRollup.operatingIn).toFixed(2));
    const previousAdjustedOperatingOut = Number(Math.max(previousOperatingOutflows, previousBankRollup.operatingOut + previousVatMovement).toFixed(2));
    const previousInvestingNet = Number((previousBankRollup.investingIn - previousBankRollup.investingOut).toFixed(2));
    const previousFinancingNet = Number((previousBankRollup.financingIn - previousBankRollup.financingOut).toFixed(2));
    const previousOperatingNet = Number((previousAdjustedOperatingIn - previousAdjustedOperatingOut).toFixed(2));
    const previousNetCashFlow = Number((previousOperatingNet + previousInvestingNet + previousFinancingNet).toFixed(2));
    const previousClosingCash = Number(sumAccountGroup(previousLookup, ["221", "223", "224", "225"], "debit").toFixed(2));
    const previousOpeningCash = Number((previousClosingCash - previousNetCashFlow).toFixed(2));
    const previousComparisonRows = [
      [at.cf_opNet, previousOperatingNet],
      [at.cf_invNet, previousInvestingNet],
      [at.cf_finNet, previousFinancingNet],
      [at.cf_netPeriodChange, previousNetCashFlow],
      [at.cf_closingCashFlow, previousClosingCash]
    ];

    const cur = (v) => currency(v, state.settings.currency);
    const isPositive = netCashFlow >= 0;
    const maxAbs = Math.max(Math.abs(operatingNet), Math.abs(investingNet), Math.abs(financingNet), 1);
    const barPct = (v) => Math.min(100, (Math.abs(v) / maxAbs) * 100);

    function CfBlock({ icon, title, inLabel, inValue, outLabel, outValue, net, colorClass }) {
      const netPos = net >= 0;
      return (
        <div className={`cf-block ${colorClass}`}>
          <div className="cf-block-header">
            <span className="cf-block-icon">{icon}</span>
            <span className="cf-block-title">{title}</span>
            <span className={`cf-block-badge ${netPos ? "cf-badge-pos" : "cf-badge-neg"}`}>{cur(net)}</span>
          </div>
          <div className="cf-block-body">
            <div className="cf-flow-row cf-inflow">
              <div className="cf-flow-left">
                <span className="cf-flow-dot cf-dot-in" />
                <span className="cf-flow-label">{inLabel}</span>
              </div>
              <div className="cf-flow-right">
                <div className="cf-flow-bar-wrap">
                  <div className="cf-flow-bar cf-bar-in" style={{ width: `${barPct(inValue)}%` }} />
                </div>
                <span className="cf-flow-value">{cur(inValue)}</span>
              </div>
            </div>
            <div className="cf-flow-row cf-outflow">
              <div className="cf-flow-left">
                <span className="cf-flow-dot cf-dot-out" />
                <span className="cf-flow-label">{outLabel}</span>
              </div>
              <div className="cf-flow-right">
                <div className="cf-flow-bar-wrap">
                  <div className="cf-flow-bar cf-bar-out" style={{ width: `${barPct(outValue)}%` }} />
                </div>
                <span className="cf-flow-value cf-value-out">{cur(outValue)}</span>
              </div>
            </div>
            <div className={`cf-net-row ${netPos ? "cf-net-pos" : "cf-net-neg"}`}>
              <span>{at.cf_netFlow}</span>
              <strong>{cur(net)}</strong>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ReportShell
        title={at.cf_reportTitle}
        subtitle={at.cf_reportSubtitle}
        badge={at.cf_badge}
        exportRows={exportRows}
        highlights={[
          { label: at.cf_opCashFlow, value: cur(operatingNet) },
          { label: at.cf_invCashFlow, value: cur(investingNet) },
          { label: at.cf_finCashFlow, value: cur(financingNet) },
          { label: at.cf_netFlow, value: cur(netCashFlow) }
        ]}
      >
        {/* ── Net Cash Banner ── */}
        <div className={`cf-banner ${isPositive ? "cf-banner-pos" : "cf-banner-neg"}`}>
          <div className="cf-banner-left">
            <span className="cf-banner-emoji">{isPositive ? "💧" : "🔻"}</span>
            <div>
              <div className="cf-banner-label">{at.cf_periodChange}</div>
              <div className="cf-banner-amount">{cur(netCashFlow)}</div>
            </div>
          </div>
          <div className="cf-banner-right">
            <div className="cf-banner-stat">
              <span className="cf-bs-val">{cur(openingCash)}</span>
              <span className="cf-bs-lbl">{at.cf_openingCash}</span>
            </div>
            <div className="cf-banner-arrow">{isPositive ? "→" : "→"}</div>
            <div className="cf-banner-stat">
              <span className="cf-bs-val cf-bs-closing">{cur(closingCash)}</span>
              <span className="cf-bs-lbl">{at.cf_closingCash}</span>
            </div>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="cf-kpi-grid">
          <div className="cf-kpi-card cf-kpi-blue">
            <span className="cf-kpi-icon">🔵</span>
            <div className="cf-kpi-val">{cur(operatingNet)}</div>
            <div className="cf-kpi-lbl">{at.cf_opCashFlow}</div>
          </div>
          <div className="cf-kpi-card cf-kpi-purple">
            <span className="cf-kpi-icon">🟣</span>
            <div className="cf-kpi-val">{cur(investingNet)}</div>
            <div className="cf-kpi-lbl">{at.cf_invCashFlow}</div>
          </div>
          <div className="cf-kpi-card cf-kpi-amber">
            <span className="cf-kpi-icon">🟡</span>
            <div className="cf-kpi-val">{cur(financingNet)}</div>
            <div className="cf-kpi-lbl">{at.cf_finCashFlow}</div>
          </div>
          <div className={`cf-kpi-card ${isPositive ? "cf-kpi-green" : "cf-kpi-red"}`}>
            <span className="cf-kpi-icon">{isPositive ? "✅" : "⚠️"}</span>
            <div className="cf-kpi-val">{cur(netCashFlow)}</div>
            <div className="cf-kpi-lbl">{at.cf_netChange}</div>
          </div>
        </div>

        {/* ── 3 Activity Blocks ── */}
        <div className="cf-blocks-grid">
          <CfBlock
            icon="⚙️"
            title={at.cf_operatingActivity}
            inLabel={at.cf_opIn}
            inValue={adjustedOperatingIn}
            outLabel={at.cf_opOut}
            outValue={adjustedOperatingOut}
            net={operatingNet}
            colorClass="cf-block-operating"
          />
          <CfBlock
            icon="📦"
            title={at.cf_investingActivity}
            inLabel={at.cf_invIn}
            inValue={bankRollup.investingIn}
            outLabel={at.cf_invOut}
            outValue={bankRollup.investingOut}
            net={investingNet}
            colorClass="cf-block-investing"
          />
          <CfBlock
            icon="🏦"
            title={at.cf_financingActivity}
            inLabel={at.cf_finIn}
            inValue={bankRollup.financingIn}
            outLabel={at.cf_finOut}
            outValue={bankRollup.financingOut}
            net={financingNet}
            colorClass="cf-block-financing"
          />
        </div>

        {/* ── Cash Bridge ── */}
        <div className="cf-bridge">
          <div className="cf-bridge-item cf-bridge-open">
            <span className="cf-bridge-icon">🏦</span>
            <span className="cf-bridge-label">{at.cf_openingCash}</span>
            <strong className="cf-bridge-val">{cur(openingCash)}</strong>
          </div>
          <div className={`cf-bridge-delta ${operatingNet >= 0 ? "cf-delta-pos" : "cf-delta-neg"}`}>
            <span className="cf-bridge-icon">⚙️</span>
            <span className="cf-bridge-label">{at.cf_operatingActivity}</span>
            <strong>{cur(operatingNet)}</strong>
          </div>
          <div className={`cf-bridge-delta ${investingNet >= 0 ? "cf-delta-pos" : "cf-delta-neg"}`}>
            <span className="cf-bridge-icon">📦</span>
            <span className="cf-bridge-label">{at.cf_investingActivity}</span>
            <strong>{cur(investingNet)}</strong>
          </div>
          <div className={`cf-bridge-delta ${financingNet >= 0 ? "cf-delta-pos" : "cf-delta-neg"}`}>
            <span className="cf-bridge-icon">🏦</span>
            <span className="cf-bridge-label">{at.cf_financingActivity}</span>
            <strong>{cur(financingNet)}</strong>
          </div>
          <div className="cf-bridge-item cf-bridge-close">
            <span className="cf-bridge-icon">💰</span>
            <span className="cf-bridge-label">{at.cf_closingCash}</span>
            <strong className="cf-bridge-val">{cur(closingCash)}</strong>
          </div>
        </div>

        {renderComparisonTable(
          [
            [at.cf_opNet, operatingNet],
            [at.cf_invNet, investingNet],
            [at.cf_finNet, financingNet],
            [at.cf_netPeriodChange, netCashFlow],
            [at.cf_closingCashFlow, closingCash]
          ],
          previousComparisonRows,
          range,
          previousRange
        )}
      </ReportShell>
    );
  }

  function renderEquityChangesReport() {
    const range = getReportRange();
    const previousRange = getPreviousReportRange();
    const lookup = getTrialBalanceLookup(range);
    const previousLookup = getTrialBalanceLookup(previousRange);
    const getCapitalRow = (label, codes) => {
      const matchedRows = codes.map((code) => lookup.get(code)).filter(Boolean);
      const opening = Number(matchedRows.reduce((sum, row) => sum + Number(row.openingCredit || 0) - Number(row.openingDebit || 0), 0).toFixed(2));
      const increase = Number(matchedRows.reduce((sum, row) => sum + Number(row.movementCredit || 0), 0).toFixed(2));
      const decrease = Number(matchedRows.reduce((sum, row) => sum + Number(row.movementDebit || 0), 0).toFixed(2));
      const closing = Number(matchedRows.reduce((sum, row) => sum + Number(row.closingCredit || 0) - Number(row.closingDebit || 0), 0).toFixed(2));
      return { label, opening, increase, decrease, closing };
    };
    const getCapitalRowFromLookup = (sourceLookup, label, codes) => {
      const matchedRows = codes.map((code) => sourceLookup.get(code)).filter(Boolean);
      const opening = Number(matchedRows.reduce((sum, row) => sum + Number(row.openingCredit || 0) - Number(row.openingDebit || 0), 0).toFixed(2));
      const increase = Number(matchedRows.reduce((sum, row) => sum + Number(row.movementCredit || 0), 0).toFixed(2));
      const decrease = Number(matchedRows.reduce((sum, row) => sum + Number(row.movementDebit || 0), 0).toFixed(2));
      const closing = Number(matchedRows.reduce((sum, row) => sum + Number(row.closingCredit || 0) - Number(row.closingDebit || 0), 0).toFixed(2));
      return { label, opening, increase, decrease, closing };
    };

    const rows = [
      getCapitalRow(at.eq_shareCapital, ["301"]),
      getCapitalRow(at.eq_additionalCapital, ["311"]),
      getCapitalRow(at.eq_retainedProfit, ["341"]),
      getCapitalRow(at.eq_periodResult, ["801"])
    ];

    const totalRow = rows.reduce((sum, row) => ({
      label: at.eq_totalCapital,
      opening: Number((sum.opening + row.opening).toFixed(2)),
      increase: Number((sum.increase + row.increase).toFixed(2)),
      decrease: Number((sum.decrease + row.decrease).toFixed(2)),
      closing: Number((sum.closing + row.closing).toFixed(2))
    }), { label: at.eq_totalCapital, opening: 0, increase: 0, decrease: 0, closing: 0 });

    const fullRows = [...rows, totalRow];
    const previousRows = [
      getCapitalRowFromLookup(previousLookup, at.eq_shareCapital, ["301"]),
      getCapitalRowFromLookup(previousLookup, at.eq_additionalCapital, ["311"]),
      getCapitalRowFromLookup(previousLookup, at.eq_retainedProfit, ["341"]),
      getCapitalRowFromLookup(previousLookup, at.eq_periodResult, ["801"])
    ];
    const previousTotalRow = previousRows.reduce((sum, row) => ({
      label: at.eq_totalCapital,
      opening: Number((sum.opening + row.opening).toFixed(2)),
      increase: Number((sum.increase + row.increase).toFixed(2)),
      decrease: Number((sum.decrease + row.decrease).toFixed(2)),
      closing: Number((sum.closing + row.closing).toFixed(2))
    }), { label: at.eq_totalCapital, opening: 0, increase: 0, decrease: 0, closing: 0 });
    const equityEvents = state.manualJournals
      .filter((journal) => Array.isArray(journal.journalLines) && journal.journalLines.some((line) => ["301", "311", "341", "801"].includes(line.accountCode)))
      .slice(0, 3);

    return (
      <ReportShell
        title={at.eq_reportTitle}
        subtitle={at.eq_reportSubtitle}
        badge={at.eq_badge}
        exportRows={fullRows.map((row) => [`${row.label} / ${at.rpt_closingBal}`, row.closing])}
        highlights={[
          { label: at.eq_shareCapital, value: currency(rows[0].closing, state.settings.currency) },
          { label: at.eq_additionalCapital, value: currency(rows[1].closing, state.settings.currency) },
          { label: at.eq_retainedProfit, value: currency(rows[2].closing, state.settings.currency) },
          { label: at.eq_totalCapital, value: currency(totalRow.closing, state.settings.currency) }
        ]}
      >
        <div className="report-step-list">
          <Table
            headers={[at.rpt_item, at.rpt_openingBal, at.rpt_increase, at.rpt_decrease, at.rpt_closingBal]}
            emptyMessage={at.rpt_equityEmpty}
            rows={fullRows.map((row, index) => (
              <tr key={row.label} className={index === fullRows.length - 1 ? "report-total-row" : ""}>
                <td>{row.label}</td>
                <td>{currency(row.opening, state.settings.currency)}</td>
                <td>{currency(row.increase, state.settings.currency)}</td>
                <td>{currency(row.decrease, state.settings.currency)}</td>
                <td>{currency(row.closing, state.settings.currency)}</td>
              </tr>
            ))}
          />
          <div className="section-note-list">
            <div className="section-note">
              <strong>{at.eq_movementSummary}</strong>
              <p>{at.eq_movementNote.replace("{opening}", currency(totalRow.opening, state.settings.currency)).replace("{increase}", currency(totalRow.increase, state.settings.currency)).replace("{decrease}", currency(totalRow.decrease, state.settings.currency))}</p>
            </div>
            <div className="section-note">
              <strong>{at.eq_recentJournal}</strong>
              <p>{equityEvents.length ? equityEvents.map((journal) => `${journal.journalNumber} - ${journal.reference}`).join(" | ") : at.eq_noJournal}</p>
            </div>
          </div>
        </div>
        {renderComparisonTable(
          fullRows.map((row) => [row.label, row.closing]),
          [...previousRows, previousTotalRow].map((row) => [row.label, row.closing]),
          range,
          previousRange
        )}
      </ReportShell>
    );
  }

  function renderAccountCard() {
    const cur = state.settings.currency;
    const accountOptions = getTrialBalanceRows()
      .map((row) => ({
        code: row.accountCode,
        label: `${row.accountCode} - ${row.accountName || getAccountNameByCode(row.accountCode)}`
      }));
    const entityOptions = getAccountCardEntityOptions(accountCardFilters.accountCode);
    const entityLabel = "Qurulmalar";
    const ledgerLines = getAccountCardLedgerLines()
      .filter((line) => !appliedAccountCardFilters.accountCode || line.accountCode === appliedAccountCardFilters.accountCode)
      .filter((line) => !appliedAccountCardFilters.entityName || (line.entityName || "") === appliedAccountCardFilters.entityName);
    const openingBalance = ledgerLines
      .filter((line) => appliedAccountCardFilters.dateFrom && line.date && line.date < appliedAccountCardFilters.dateFrom)
      .reduce((sum, line) => sum + Number(line.debit || 0) - Number(line.credit || 0), 0);
    const periodLines = ledgerLines
      .filter((line) => {
        if (appliedAccountCardFilters.dateFrom && line.date < appliedAccountCardFilters.dateFrom) return false;
        if (appliedAccountCardFilters.dateTo && line.date > appliedAccountCardFilters.dateTo) return false;
        return true;
      })
      .sort((left, right) => {
        const byDate = (left.date || "").localeCompare(right.date || "");
        if (byDate !== 0) return byDate;
        return String(left.reference || "").localeCompare(String(right.reference || ""));
      });
    let runningBalance = openingBalance;
    const renderedRows = periodLines.map((line) => {
      runningBalance += Number(line.debit || 0) - Number(line.credit || 0);
      return {
        ...line,
        runningBalance
      };
    });
    const formatBalance = (value) => `${currency(Math.abs(value || 0), cur)} ${value >= 0 ? "D" : "K"}`;
    const totals = renderedRows.reduce((sum, line) => ({
      debit: sum.debit + Number(line.debit || 0),
      credit: sum.credit + Number(line.credit || 0)
    }), { debit: 0, credit: 0 });
    const selectedAccountTitle = appliedAccountCardFilters.accountCode
      ? accountOptions.find((option) => option.code === appliedAccountCardFilters.accountCode)?.label || `${appliedAccountCardFilters.accountCode} - ${getAccountNameByCode(appliedAccountCardFilters.accountCode)}`
      : "Hesab seçilməyib";

    return (
      <section className="view active">
        <div className="panel account-card-panel">
          <div className="panel-head">
            <div>
              <h3>Hesab kartı</h3>
              <p className="panel-copy">Dövr, hesab və alt bölmə seçərək xronoloji debet, kredit və qalıq dövriyyəsini izləyin.</p>
            </div>
          </div>
          <div className="account-card-filter-grid">
            <label>
              <span>Başlanğıc tarix</span>
              <input
                type="date"
                value={accountCardFilters.dateFrom}
                onChange={(event) => setAccountCardFilters((current) => ({ ...current, dateFrom: event.target.value }))}
              />
            </label>
            <label>
              <span>Son tarix</span>
              <input
                type="date"
                value={accountCardFilters.dateTo}
                onChange={(event) => setAccountCardFilters((current) => ({ ...current, dateTo: event.target.value }))}
              />
            </label>
            <label>
              <span>Hesab</span>
              <select
                value={accountCardFilters.accountCode}
                onChange={(event) => setAccountCardFilters((current) => ({ ...current, accountCode: event.target.value, entityName: "" }))}
              >
                <option value="">Hesab seçin</option>
                {accountOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>{entityLabel}</span>
              <select
                value={accountCardFilters.entityName}
                onChange={(event) => setAccountCardFilters((current) => ({ ...current, entityName: event.target.value }))}
                disabled={!accountCardFilters.accountCode}
              >
                <option value="">{accountCardFilters.accountCode ? `${entityLabel} seçin` : "Əvvəl hesab seçin"}</option>
                {entityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <div className="account-card-apply-wrap">
              <button
                className="primary-btn"
                type="button"
                onClick={() => setAppliedAccountCardFilters({ ...accountCardFilters })}
              >
                Tətbiq et
              </button>
            </div>
          </div>
        </div>

        <div className="panel-grid one-up dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>{selectedAccountTitle}</h3>
                <p className="panel-copy">
                  {appliedAccountCardFilters.entityName
                    ? `${entityLabel}: ${appliedAccountCardFilters.entityName}`
                    : "Hesab üzrə ümumi dövriyyə"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {appliedAccountCardFilters.accountCode && (
                  <>
                    <button className="ghost-btn compact-btn" type="button" onClick={() => {
                      const headers = ["Tarix", "Sənəd", "Mənbə", entityLabel, "Debet", "Kredit", "Qalıq"];
                      const rows = [
                        [
                          appliedAccountCardFilters.dateFrom ? fmtDate(appliedAccountCardFilters.dateFrom) : "—",
                          "Açılış qalığı",
                          "Başlanğıc",
                          appliedAccountCardFilters.entityName || "—",
                          "",
                          "",
                          currency(openingBalance, cur)
                        ],
                        ...renderedRows.map(row => [
                          fmtDate(row.date),
                          row.journalNumber || "—",
                          row.source || "—",
                          row.entityName || "—",
                          currency(row.debit || 0, cur),
                          currency(row.credit || 0, cur),
                          currency(row.runningBalance, cur)
                        ]),
                        [
                          "",
                          "<strong>Cəmi / Son qalıq</strong>",
                          "",
                          "",
                          `<strong>${currency(totals.debit, cur)}</strong>`,
                          `<strong>${currency(totals.credit, cur)}</strong>`,
                          `<strong>${currency(renderedRows.length ? renderedRows[renderedRows.length - 1].runningBalance : openingBalance, cur)}</strong>`
                        ]
                      ];
                      const printWindow = window.open("", "_blank", "width=980,height=720");
                      if (printWindow) {
                        printWindow.document.write(buildTableReportDocument(`Hesab kartı: ${selectedAccountTitle}`, headers, rows));
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => printWindow.print(), 250);
                      }
                    }}>
                      Çap et
                    </button>
                    <button className="primary-btn compact-btn" type="button" onClick={async () => {
                      const headers = ["Tarix", "Sənəd", "Mənbə", entityLabel, "Debet", "Kredit", "Qalıq"];
                      const rows = [
                        [
                          appliedAccountCardFilters.dateFrom ? fmtDate(appliedAccountCardFilters.dateFrom) : "—",
                          "Açılış qalığı",
                          "Başlanğıc",
                          appliedAccountCardFilters.entityName || "—",
                          "",
                          "",
                          Number(openingBalance).toFixed(2)
                        ],
                        ...renderedRows.map(row => [
                          fmtDate(row.date),
                          row.journalNumber || "—",
                          row.source || "—",
                          row.entityName || "—",
                          Number(row.debit || 0).toFixed(2),
                          Number(row.credit || 0).toFixed(2),
                          Number(row.runningBalance).toFixed(2)
                        ]),
                        [
                          "",
                          "Cəmi / Son qalıq",
                          "",
                          "",
                          totals.debit.toFixed(2),
                          totals.credit.toFixed(2),
                          (renderedRows.length ? renderedRows[renderedRows.length - 1].runningBalance : openingBalance).toFixed(2)
                        ]
                      ];
                      const html = buildTableReportDocument(`Hesab kartı: ${selectedAccountTitle}`, headers, rows);
                      await exportHtmlAsExcel(`hesab-karti-${appliedAccountCardFilters.accountCode}`, html);
                    }}>
                      Export
                    </button>
                  </>
                )}
                <span>{appliedAccountCardFilters.dateFrom || "—"} / {appliedAccountCardFilters.dateTo || "—"}</span>
              </div>
            </div>
            {appliedAccountCardFilters.accountCode ? (
              <Fragment>
                <div className="summary-grid compact">
                  <article className="summary-card">
                    <span>Açılış qalığı</span>
                    <strong>{formatBalance(openingBalance)}</strong>
                  </article>
                  <article className="summary-card">
                    <span>Dövr debeti</span>
                    <strong>{currency(totals.debit, cur)}</strong>
                  </article>
                  <article className="summary-card">
                    <span>Dövr krediti</span>
                    <strong>{currency(totals.credit, cur)}</strong>
                  </article>
                  <article className="summary-card">
                    <span>Son qalıq</span>
                    <strong>{formatBalance(renderedRows.length ? renderedRows[renderedRows.length - 1].runningBalance : openingBalance)}</strong>
                  </article>
                </div>
                <Table
                  headers={["Tarix", "Sənəd", "Mənbə", entityLabel, "Debet", "Kredit", "Qalıq"]}
                  emptyMessage="Seçilmiş kriteriyalara uyğun hesab kartı yazısı yoxdur."
                  rows={[
                    <tr key="opening-balance">
                      <td>{appliedAccountCardFilters.dateFrom ? fmtDate(appliedAccountCardFilters.dateFrom) : "—"}</td>
                      <td>Açılış qalığı</td>
                      <td>Başlanğıc</td>
                      <td>{appliedAccountCardFilters.entityName || "—"}</td>
                      <td>{currency(0, cur)}</td>
                      <td>{currency(0, cur)}</td>
                      <td>{formatBalance(openingBalance)}</td>
                    </tr>,
                    ...renderedRows.map((line) => (
                      <tr key={line.id}>
                        <td>{fmtDate(line.date)}</td>
                        <td>
                          <strong>{line.reference || "—"}</strong>
                          {line.refNumber ? <div className="table-subcopy">{line.refNumber}</div> : null}
                        </td>
                        <td>{line.sourceLabel || "—"}</td>
                        <td>{line.entityName || "—"}</td>
                        <td>{currency(line.debit || 0, cur)}</td>
                        <td>{currency(line.credit || 0, cur)}</td>
                        <td>{formatBalance(line.runningBalance)}</td>
                      </tr>
                    ))
                  ]}
                />
              </Fragment>
            ) : (
              <div className="nomen-empty">
                <span className="nomen-empty-icon">📘</span>
                <strong>Hesab seçin və `Tətbiq et` düyməsini basın.</strong>
              </div>
            )}
          </section>
        </div>
      </section>
    );
  }

  function renderDocuments() {
    const query = searches.documents || "";
    const documents = state.documents.filter((item) => matchesSearch(item, query));
    const categoryColors = { Faktura: "doc-cat-invoice", Müqavilə: "doc-cat-contract", "Hesab əlavəsi": "doc-cat-attachment", Qəbz: "doc-cat-receipt" };
    const categoryIcons = { Faktura: "🧾", Müqavilə: "📄", "Hesab əlavəsi": "📎", Qəbz: "🖨️" };

    // ── Overview ──
    if (documentView === "overview") {
      return (
        <section className="view active">
          <div className="bill-hub">
            <div className="bill-hub-card" onClick={() => setDocumentView("journal")}>
              <div className="bill-hub-icon">📂</div>
              <div className="bill-hub-info">
                <h3>{at.hub_docsArchive}</h3>
                <p>{at.hub_docsArchiveDesc}</p>
                <span className="bill-hub-count">{state.documents.length} sənəd</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
            <div className="bill-hub-card" onClick={() => { setDocumentDraft({ title: "", relatedTo: "", category: "Faktura", fileData: null }); setEditingDocument(null); setDocumentView("form"); }}>
              <div className="bill-hub-icon">➕</div>
              <div className="bill-hub-info">
                <h3>{at.hub_docsNew}</h3>
                <p>{at.hub_docsNewDesc}</p>
                <span className="bill-hub-count">{at.newRecord}</span>
              </div>
              <span className="bill-hub-arrow">→</span>
            </div>
          </div>
        </section>
      );
    }

    // ── Journal ──
    if (documentView === "journal") {
      const catCounts = {};
      state.documents.forEach((d) => { catCounts[d.category] = (catCounts[d.category] || 0) + 1; });
      return (
        <section className="view active">
          <div className="doc-journal">
            {/* Header */}
            <div className="doc-journal-header">
              <div className="doc-journal-header-left">
                <button className="ghost-btn" onClick={() => setDocumentView("overview")}>{at.back}</button>
                <div>
                  <h2 className="doc-journal-title">{at.hub_docsArchive}</h2>
                  <p className="doc-journal-sub">Cəmi {state.documents.length} sənəd</p>
                </div>
              </div>
              <button className="primary-btn" onClick={() => { setDocumentDraft({ title: "", relatedTo: "", category: "Faktura", fileData: null }); setEditingDocument(null); setDocumentView("form"); }}>{at.hub_docsNew}</button>
            </div>

            {/* KPI strip */}
            <div className="doc-kpi-grid">
              {["Faktura", "Müqavilə", "Hesab əlavəsi", "Qəbz"].map((cat) => (
                <div key={cat} className={`doc-kpi-card doc-kpi-${cat === "Faktura" ? "blue" : cat === "Müqavilə" ? "purple" : cat === "Hesab əlavəsi" ? "teal" : "amber"}`}>
                  <span className="doc-kpi-icon">{categoryIcons[cat]}</span>
                  <span className="doc-kpi-count">{catCounts[cat] || 0}</span>
                  <span className="doc-kpi-lbl">{cat}</span>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="doc-toolbar">
              <input className="search-input" placeholder={at.searchDoc} value={query} onChange={(e) => setSearches((c) => ({ ...c, documents: e.target.value }))} />
            </div>

            {/* Cards list */}
            {documents.length === 0 ? (
              <div className="doc-empty">📭 {at.noDoc}</div>
            ) : (
              <div className="doc-card-list">
                {documents.map((record) => (
                  <div key={record.id} className="doc-card">
                    <div className={`doc-card-icon-wrap ${categoryColors[record.category] || ""}`}>
                      <span className="doc-card-icon">{categoryIcons[record.category] || "📄"}</span>
                    </div>
                    <div className="doc-card-body">
                      <div className="doc-card-title">{record.title}</div>
                      <div className="doc-card-meta">
                        <span className={`doc-cat-badge ${categoryColors[record.category] || ""}`}>{record.category}</span>
                        <span className="doc-card-related">📎 {record.relatedTo}</span>
                        <span className="doc-card-date">🗓 {fmtDate(record.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="doc-card-actions">
                      {record.fileData?.dataUrl && (
                        <a className="table-btn" href={record.fileData.dataUrl} download={record.fileData.name} title={record.fileData.name}>⬇ Yüklə</a>
                      )}
                      <button className="table-btn" onClick={() => { setDocumentDraft({ title: record.title, relatedTo: record.relatedTo, category: record.category, fileData: record.fileData || null }); setEditingDocument(record.id); setDocumentView("form"); }}>{at.edit}</button>
                      <button className="table-btn danger-btn" onClick={() => { setState((c) => ({ ...c, documents: c.documents.filter((d) => d.id !== record.id) })); if (editingDocument === record.id) { setDocumentDraft({ title: "", relatedTo: "", category: "Faktura", fileData: null }); setEditingDocument(null); } }}>{at.delete}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    // ── Form ──
    return (
      <section className="view active">
        <div className="doc-form-shell">
          <div className="doc-form-header">
            <button className="ghost-btn" onClick={() => { setDocumentDraft({ title: "", relatedTo: "", category: "Faktura", fileData: null }); setEditingDocument(null); setDocumentView("journal"); }}>{at.back}</button>
            <div>
              <h2 className="doc-form-title">{editingDocument ? at.formTitle_docEdit : at.formTitle_docNew}</h2>
              <p className="doc-form-sub">{editingDocument ? "Mövcud sənədin məlumatlarını yenilə" : "Arxivə yeni sənəd daxil et"}</p>
            </div>
          </div>
          <div className="doc-form-body">
            <form className="bill-form-panel" onSubmit={(e) => { submitDocument(e); setDocumentView("journal"); }}>
              <div className="form-grid">
                <label><span>{at.formField_title}</span><input value={documentDraft.title} onChange={(e) => setDocumentDraft((c) => ({ ...c, title: e.target.value }))} placeholder="Sənədin adı" required /></label>
                <label><span>{at.formField_relSection}</span><input value={documentDraft.relatedTo} onChange={(e) => setDocumentDraft((c) => ({ ...c, relatedTo: e.target.value }))} placeholder="Müştəri, təchizatçı və s." required /></label>
                <label><span>{at.formField_category}</span>
                  <select value={documentDraft.category} onChange={(e) => setDocumentDraft((c) => ({ ...c, category: e.target.value }))}>
                    <option value="Faktura">{at.docCatInvoice}</option>
                    <option value="Müqavilə">{at.docCatContract}</option>
                    <option value="Hesab əlavəsi">{at.docCatAttachment}</option>
                    <option value="Qəbz">{at.docCatReceipt}</option>
                  </select>
                </label>
              </div>

              {/* ── Fayl yükləmə ── */}
              <div className="doc-upload-section">
                <p className="doc-upload-label">Fayl yüklə</p>
                <input
                  ref={docFileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setDocumentDraft((c) => ({
                        ...c,
                        fileData: { name: file.name, size: file.size, type: file.type, dataUrl: ev.target.result }
                      }));
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
                {documentDraft.fileData ? (
                  <div className="doc-upload-preview">
                    <span className="doc-upload-icon">📎</span>
                    <div className="doc-upload-info">
                      <strong>{documentDraft.fileData.name}</strong>
                      <span>{(documentDraft.fileData.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button type="button" className="doc-upload-remove" onClick={() => setDocumentDraft((c) => ({ ...c, fileData: null }))}>✕</button>
                  </div>
                ) : (
                  <div className="doc-upload-zone" onClick={() => docFileInputRef.current?.click()}>
                    <span className="doc-upload-zone-icon">☁️</span>
                    <p>Fayl seçmək üçün klikləyin</p>
                    <span className="doc-upload-zone-hint">PDF, Word, Excel, şəkil və s.</span>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button className="primary-btn" type="submit">{editingDocument ? at.ic_updateBtn : at.save}</button>
                <button className="ghost-btn" type="button" onClick={() => { setDocumentDraft({ title: "", relatedTo: "", category: "Faktura", fileData: null }); setEditingDocument(null); setDocumentView("journal"); }}>{at.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

function renderSettings() {
    const activeLangObj = APP_LANGS.find((l) => l.code === hubLang) || APP_LANGS[0];

    // ── Hub view ──────────────────────────────────────────
    if (!settingsTab) {
      return (
        <section className="view active">
          <div className="bill-hub" style={{ gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "100%" }}>
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
        </section>
      );
    }

    // ── Detail views ──────────────────────────────────────
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
            <form
              key={`company-settings-${state.settings.entityType || ""}-${state.settings.companyName || ""}-${state.settings.taxId || ""}-${state.settings.mobilePhone || ""}-${state.settings.currency || ""}-${state.settings.fiscalYear || ""}-${state.settings.uiScale || ""}`}
              className="form-grid"
              onSubmit={saveSettingsToBackend}
            >
              {companySettingsError ? <p className="panel-copy">{companySettingsError}</p> : null}
              {companySettingsLoading ? <p className="panel-copy">Şirkət məlumatları backend ilə sinxronlaşdırılır...</p> : null}
              <label><span>{at.settings_entityType}</span><select name="entityType" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.entityType || "Hüquqi şəxs"}><option value="Fiziki şəxs">{at.settings_entityIndiv}</option><option value="Hüquqi şəxs">{at.settings_entityCompany}</option></select></label>
              <label><span>{at.settings_companyOwnerName}</span><input name="companyName" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.companyName} required /></label>
              <label><span>{at.settings_taxId}</span><input name="taxId" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.taxId} placeholder="0000000000" required /></label>
              <label><span>{at.settings_mobile}</span><input name="mobilePhone" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.mobilePhone || ""} placeholder="+994..." required /></label>
              <label><span>{at.settings_currency}</span><input name="currency" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.currency} required /></label>
              <label><span>{at.settings_fiscalYear}</span><input name="fiscalYear" disabled={profileSaved || companySettingsLoading} defaultValue={state.settings.fiscalYear} required /></label>
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

    if (settingsTab === "system") {
      return renderSettings_System();
    }

    // params
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
              <label className="ops-check-row"><input type="checkbox" name="salespersonField" defaultChecked={state.settings.salespersonField === "Bəli"} /><span>{at.ops_salesperson}</span></label>
            </section>
            <section className="ops-section ops-secondary-grid">
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
    const effectivePlans = backendPlans
      .filter((plan) => plan && plan.isActive !== false)
      .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
    const currentBackendPlanCode = backendSubscription?.plan?.code || "";
    const selectedPaymentPlan = effectivePlans.find((plan) => plan.code === paymentDraft.planCode) || null;

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
                  const left = plan.id === "free" ? `${Math.max(0, Number(user.subscription?.operationLimit || 0) - Number(user.operationsUsed || 0))} əməliyyat` : `${daysUntil(user.subscription?.endsAt) ?? 0} gün`;
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
                  <article className="summary-card"><span>{at.sub_model}</span><strong>{at.sub_demoFree}</strong></article>
                  <article className="summary-card"><span>{at.sub_price}</span><strong>{selectedPaymentPlan ? (selectedPaymentPlan.interval === "NONE" || Number(selectedPaymentPlan.priceMinor || 0) <= 0 ? at.sub_free : `${(Number(selectedPaymentPlan.priceMinor || 0) / 100).toFixed(2)} ${selectedPaymentPlan.currency || "AZN"} / ay`) : "—"}</strong></article>
                  <article className="summary-card"><span>{at.sub_duration}</span><strong>{selectedPaymentPlan ? (selectedPaymentPlan.interval === "NONE" ? "Limitsiz" : `30 ${at.sub_days}`) : "—"}</strong></article>
                </div>
                <div className="payment-consent-card">
                  <label className="payment-consent-check">
                    <input type="checkbox" checked={paymentTermsAccepted} onChange={(event) => setPaymentTermsAccepted(event.target.checked)} />
                    <span>Ödəniş şərtləri ilə tanış oldum və qəbul edirəm</span>
                  </label>
                  <button type="button" className="text-btn payment-consent-link" onClick={() => openBooksLegalPage("payment-terms")}>Ödəniş şərtləri</button>
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
                  <article className="summary-card"><span>{at.sub_priceModel}</span><strong>{currentPlan.id === "free" ? at.sub_free : currentBillingCycle === "demo" ? at.sub_demoFree : currentBillingCycle === "monthly" ? at.team_monthly : at.team_annual}</strong></article>
                  <article className="summary-card"><span>{at.sub_price}</span><strong>{getPlanPriceLabel(currentPlan, currentBillingCycle)}</strong></article>
                  <article className="summary-card"><span>{at.sub_remaining}</span><strong>{currentPlan.id === "free" ? `${Math.max(0, Number(currentPlan.operationLimit || 0) - Number(ownerUser?.operationsUsed || 0))} ${at.sub_opUnitShort}` : `${daysUntil(ownerUser?.subscription?.endsAt) ?? remainingDays ?? 0} ${at.sub_days}`}</strong></article>
                  <article className="summary-card"><span>{at.sub_opLimit}</span><strong>{Number(currentPlan.operationLimit || 0).toLocaleString("en-US")}</strong></article>
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
                  const planIsFree = String(plan.code || "").toUpperCase() === "FREE" || Number(plan.priceMinor || 0) <= 0;
                  const isCurrentBackendPlan = currentBackendPlanCode && String(currentBackendPlanCode) === String(plan.code);
                  const priceLabel = planIsFree
                    ? at.sub_free
                    : `${(Number(plan.priceMinor || 0) / 100).toFixed(2)} ${plan.currency || "AZN"} / ay`;
                  return (
                    <article className={`subscription-plan-card ${isCurrentBackendPlan ? "active" : ""}`} key={plan.code}>
                      <span>{plan.name || plan.code}</span>
                      <strong>{priceLabel}</strong>
                      <p>{plan.code}</p>
                      <small>{planIsFree ? at.sub_freeOps : `${plan.interval === "MONTH" ? `30 ${at.sub_days}` : plan.interval}`}</small>
                      <button className={isCurrentBackendPlan ? "ghost-btn" : "primary-btn"} type="button" onClick={() => {
                        if (planIsFree) {
                          setBooksNotice("FREE plana keçid backend downgrade axını ilə idarə olunur.");
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
        </section>
      </div>
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

  if (activeProduct === "hub") {
    return renderProductHub();
  }

  if (activeProduct === "booksLanding") {
    return renderBooksLanding();
  }
  const appActiveLang = APP_LANGS.find((l) => l.code === hubLang) || APP_LANGS[0];
  const backupTone = backupStatus.tone || "info";

  return (
    <div className={`app-shell${appNavOpen ? " mobile-nav-open" : ""}`} data-ui-scale={state.settings.uiScale || "Avtomatik"} onClick={() => { if (hubLangOpen) setHubLangOpen(false); if (profileMenuOpen) setProfileMenuOpen(false); if (appNavOpen) setAppNavOpen(false); }}>
      <button className={`mobile-nav-overlay${appNavOpen ? " visible" : ""}`} type="button" aria-label={appMenuLabel} onClick={() => setAppNavOpen(false)} />
      <aside className="sidebar" onClick={(event) => event.stopPropagation()}>
        <button className="brand-block" type="button" onClick={() => { setActiveSection("home"); setActiveModule(null); setExpandedSections(new Set(["home"])); setAppNavOpen(false); }}>
          <div className="brand-icon">
            <img src={logoSrc} alt="Tetavio" className="app-logo" />
          </div>
          <div className="brand-copy">
            <strong>Tetavio <span className="brand-erp">ERP</span></strong>
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
          </>
        )}
      </main>
    </div>
  );
}





