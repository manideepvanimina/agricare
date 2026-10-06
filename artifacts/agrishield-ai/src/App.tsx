import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  Activity, ArrowLeft, ArrowRight, Bell, CircleHelp, CloudRain, Download,
  FileImage, Leaf, LogOut, Menu, Plus, ScanLine, Search, ShieldCheck, Sprout,
  Trash2, Upload, X,
} from 'lucide-react';
import {
  getGetDashboardQueryKey, getGetScanQueryKey, getListAlertsQueryKey,
  getListScansQueryKey, useCreateScan, useDeleteScan, useGetDashboard,
  useGetScan, useListAlerts, useListScans,
} from '@workspace/api-client-react';
import type { Alert, Scan, ScanInput } from '@workspace/api-client-react';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter, Link, useRoute } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const translations = {
  English: { overview: 'Overview', newScan: 'New scan', history: 'Scan history', alerts: 'Alerts', signIn: 'Sign in', getStarted: 'Get started', greeting: 'Your field, understood.', subtitle: 'A little more clarity for the choices you make in the field.', startScan: 'Start a crop check', seeHistory: 'See scan history', dashboard: 'Field overview', today: 'A steadier view of crop health', health: 'Field health', currentRisk: 'Current risk', scans: 'Scans so far', recent: 'Recent field checks', allScans: 'All checks', weather: 'Weather snapshot', demo: 'Demo estimate', noData: 'Your field notes will appear here after your first scan.', tryFirst: 'Make your first crop check', signOut: 'Sign out', crop: 'Crop', photo: 'Photo (optional)', symptoms: 'What are you noticing?', notes: 'Additional notes', analyze: 'Create demo estimate', report: 'Field report', actions: 'What to do next', alertsTitle: 'Field alerts', historyTitle: 'Your field notes', search: 'Search your scans', compare: 'Compare selected', export: 'Export list', noAlerts: 'No new field alerts. We will keep watch with you.', disclaimer: 'Guidance is informational, not a diagnosis. Confirm important decisions with a local agricultural expert.' },
  Telugu: { overview: 'సారాంశం', newScan: 'కొత్త స్కాన్', history: 'స్కాన్ చరిత్ర', alerts: 'హెచ్చరికలు', signIn: 'సైన్ ఇన్', getStarted: 'ప్రారంభించండి', greeting: 'మీ పొలం, మరింత స్పష్టంగా.', subtitle: 'పొలంలో మీరు తీసుకునే నిర్ణయాలకు కొంత స్పష్టత.', startScan: 'పంటను పరిశీలించండి', seeHistory: 'స్కాన్ చరిత్ర చూడండి', dashboard: 'పొలం సారాంశం', today: 'పంట ఆరోగ్యంపై స్థిరమైన దృష్టి', health: 'పొలం ఆరోగ్యం', currentRisk: 'ప్రస్తుత ప్రమాదం', scans: 'ఇప్పటి వరకు స్కాన్లు', recent: 'ఇటీవలి పరిశీలనలు', allScans: 'అన్ని పరిశీలనలు', weather: 'వాతావరణ వివరాలు', demo: 'డెమో అంచనా', noData: 'మీ మొదటి స్కాన్ తర్వాత పొలం గమనికలు ఇక్కడ కనిపిస్తాయి.', tryFirst: 'మొదటి పంట పరిశీలన చేయండి', signOut: 'సైన్ అవుట్', crop: 'పంట', photo: 'ఫోటో (ఐచ్ఛికం)', symptoms: 'మీరు ఏమి గమనిస్తున్నారు?', notes: 'అదనపు గమనికలు', analyze: 'డెమో అంచనా రూపొందించండి', report: 'పొలం నివేదిక', actions: 'తదుపరి చేయాల్సినవి', alertsTitle: 'పొలం హెచ్చరికలు', historyTitle: 'మీ పొలం గమనికలు', search: 'స్కాన్లలో వెతకండి', compare: 'ఎంచుకున్నవి పోల్చండి', export: 'జాబితా ఎగుమతి', noAlerts: 'కొత్త పొలం హెచ్చరికలు లేవు. మేము మీతో కలిసి గమనిస్తాము.', disclaimer: 'ఇది సమాచార మార్గదర్శకం మాత్రమే; నిర్ధారణ కాదు. ముఖ్య నిర్ణయాలను స్థానిక వ్యవసాయ నిపుణుడితో నిర్ధారించండి.' },
  Hindi: { overview: 'अवलोकन', newScan: 'नई जाँच', history: 'जाँच इतिहास', alerts: 'सूचनाएँ', signIn: 'साइन इन', getStarted: 'शुरू करें', greeting: 'आपका खेत, अब और स्पष्ट।', subtitle: 'खेत में लिए जाने वाले फैसलों के लिए थोड़ी और स्पष्टता।', startScan: 'फसल जाँचें', seeHistory: 'जाँच इतिहास देखें', dashboard: 'खेत का अवलोकन', today: 'फसल स्वास्थ्य को स्थिर नज़र से देखें', health: 'खेत का स्वास्थ्य', currentRisk: 'मौजूदा जोखिम', scans: 'अब तक की जाँच', recent: 'हाल की खेत जाँच', allScans: 'सभी जाँच', weather: 'मौसम की झलक', demo: 'डेमो अनुमान', noData: 'पहली जाँच के बाद खेत की टिप्पणियाँ यहाँ दिखेंगी।', tryFirst: 'पहली फसल जाँच करें', signOut: 'साइन आउट', crop: 'फसल', photo: 'तस्वीर (वैकल्पिक)', symptoms: 'आप क्या देख रहे हैं?', notes: 'अतिरिक्त नोट', analyze: 'डेमो अनुमान बनाएँ', report: 'खेत रिपोर्ट', actions: 'आगे क्या करें', alertsTitle: 'खेत सूचनाएँ', historyTitle: 'आपकी खेत टिप्पणियाँ', search: 'जाँच खोजें', compare: 'चयनित की तुलना', export: 'सूची डाउनलोड', noAlerts: 'कोई नई खेत सूचना नहीं। हम साथ मिलकर नज़र रखेंगे।', disclaimer: 'यह केवल जानकारी है, निदान नहीं। महत्वपूर्ण निर्णय स्थानीय कृषि विशेषज्ञ से पक्का करें।' },
  Tamil: { overview: 'கண்ணோட்டம்', newScan: 'புதிய ஆய்வு', history: 'ஆய்வு வரலாறு', alerts: 'எச்சரிக்கைகள்', signIn: 'உள்நுழை', getStarted: 'தொடங்குங்கள்', greeting: 'உங்கள் வயல், இப்போது தெளிவாக.', subtitle: 'வயலில் நீங்கள் எடுக்கும் முடிவுகளுக்கு இன்னும் கொஞ்சம் தெளிவு.', startScan: 'பயிரைச் சரிபார்க்க', seeHistory: 'ஆய்வு வரலாற்றைப் பார்க்க', dashboard: 'வயல் கண்ணோட்டம்', today: 'பயிர் நலனை அமைதியாகப் பாருங்கள்', health: 'வயல் நலம்', currentRisk: 'தற்போதைய ஆபத்து', scans: 'இதுவரை ஆய்வுகள்', recent: 'சமீபத்திய வயல் ஆய்வுகள்', allScans: 'அனைத்து ஆய்வுகள்', weather: 'வானிலை விவரம்', demo: 'மாதிரி மதிப்பீடு', noData: 'முதல் ஆய்வுக்குப் பிறகு வயல் குறிப்புகள் இங்கே தோன்றும்.', tryFirst: 'முதல் பயிர் ஆய்வைத் தொடங்குங்கள்', signOut: 'வெளியேறு', crop: 'பயிர்', photo: 'புகைப்படம் (விருப்பம்)', symptoms: 'நீங்கள் என்ன கவனிக்கிறீர்கள்?', notes: 'கூடுதல் குறிப்புகள்', analyze: 'மாதிரி மதிப்பீட்டை உருவாக்கு', report: 'வயல் அறிக்கை', actions: 'அடுத்து செய்ய வேண்டியது', alertsTitle: 'வயல் எச்சரிக்கைகள்', historyTitle: 'உங்கள் வயல் குறிப்புகள்', search: 'ஆய்வுகளைத் தேடு', compare: 'தேர்ந்தவற்றை ஒப்பிடு', export: 'பட்டியலை ஏற்று', noAlerts: 'புதிய வயல் எச்சரிக்கைகள் இல்லை. நாங்கள் உங்களுடன் கவனிப்போம்.', disclaimer: 'இது தகவல் வழிகாட்டல் மட்டுமே; நோயறிதல் அல்ல. முக்கிய முடிவுகளை உள்ளூர் வேளாண் நிபுணருடன் உறுதிப்படுத்துங்கள்.' },
  Kannada: { overview: 'ಅವಲೋಕನ', newScan: 'ಹೊಸ ಪರಿಶೀಲನೆ', history: 'ಪರಿಶೀಲನೆ ಇತಿಹಾಸ', alerts: 'ಎಚ್ಚರಿಕೆಗಳು', signIn: 'ಸೈನ್ ಇನ್', getStarted: 'ಪ್ರಾರಂಭಿಸಿ', greeting: 'ನಿಮ್ಮ ಹೊಲ, ಇನ್ನಷ್ಟು ಸ್ಪಷ್ಟವಾಗಿ.', subtitle: 'ಹೊಲದಲ್ಲಿ ನೀವು ಮಾಡುವ ನಿರ್ಧಾರಗಳಿಗೆ ಇನ್ನಷ್ಟು ಸ್ಪಷ್ಟತೆ.', startScan: 'ಬೆಳೆ ಪರಿಶೀಲಿಸಿ', seeHistory: 'ಇತಿಹಾಸ ನೋಡಿ', dashboard: 'ಹೊಲದ ಅವಲೋಕನ', today: 'ಬೆಳೆ ಆರೋಗ್ಯದ ಸ್ಥಿರ ನೋಟ', health: 'ಹೊಲದ ಆರೋಗ್ಯ', currentRisk: 'ಪ್ರಸ್ತುತ ಅಪಾಯ', scans: 'ಇಲ್ಲಿಯವರೆಗಿನ ಪರಿಶೀಲನೆಗಳು', recent: 'ಇತ್ತೀಚಿನ ಹೊಲ ಪರಿಶೀಲನೆಗಳು', allScans: 'ಎಲ್ಲ ಪರಿಶೀಲನೆಗಳು', weather: 'ಹವಾಮಾನ ವಿವರ', demo: 'ಡೆಮೊ ಅಂದಾಜು', noData: 'ಮೊದಲ ಪರಿಶೀಲನೆಯ ನಂತರ ನಿಮ್ಮ ಹೊಲದ ಟಿಪ್ಪಣಿಗಳು ಇಲ್ಲಿ ಕಾಣುತ್ತವೆ.', tryFirst: 'ಮೊದಲ ಬೆಳೆ ಪರಿಶೀಲನೆ ಮಾಡಿ', signOut: 'ಸೈನ್ ಔಟ್', crop: 'ಬೆಳೆ', photo: 'ಫೋಟೋ (ಐಚ್ಛಿಕ)', symptoms: 'ನೀವು ಏನು ಗಮನಿಸುತ್ತಿದ್ದೀರಿ?', notes: 'ಹೆಚ್ಚುವರಿ ಟಿಪ್ಪಣಿಗಳು', analyze: 'ಡೆಮೊ ಅಂದಾಜು ರಚಿಸಿ', report: 'ಹೊಲದ ವರದಿ', actions: 'ಮುಂದೆ ಏನು ಮಾಡಬೇಕು', alertsTitle: 'ಹೊಲದ ಎಚ್ಚರಿಕೆಗಳು', historyTitle: 'ನಿಮ್ಮ ಹೊಲದ ಟಿಪ್ಪಣಿಗಳು', search: 'ಪರಿಶೀಲನೆ ಹುಡುಕಿ', compare: 'ಆಯ್ದವುಗಳನ್ನು ಹೋಲಿಸಿ', export: 'ಪಟ್ಟಿ ರಫ್ತು', noAlerts: 'ಹೊಸ ಹೊಲದ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ. ನಾವು ನಿಮ್ಮೊಂದಿಗೆ ಗಮನಿಸುತ್ತೇವೆ.', disclaimer: 'ಇದು ಮಾಹಿತಿ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ, ರೋಗನಿರ್ಣಯವಲ್ಲ. ಮುಖ್ಯ ನಿರ್ಧಾರಗಳನ್ನು ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.' },
  Marathi: { overview: 'आढावा', newScan: 'नवी तपासणी', history: 'तपासणी इतिहास', alerts: 'सूचना', signIn: 'साइन इन', getStarted: 'सुरू करा', greeting: 'तुमचे शेत, अधिक स्पष्ट.', subtitle: 'शेतात घेतल्या जाणाऱ्या निर्णयांसाठी थोडी अधिक स्पष्टता.', startScan: 'पीक तपासा', seeHistory: 'तपासणी इतिहास पहा', dashboard: 'शेताचा आढावा', today: 'पीक आरोग्याकडे स्थिर नजरेने', health: 'शेताचे आरोग्य', currentRisk: 'सध्याचा धोका', scans: 'आतापर्यंतच्या तपासण्या', recent: 'अलीकडील शेत तपासण्या', allScans: 'सर्व तपासण्या', weather: 'हवामानाचा आढावा', demo: 'डेमो अंदाज', noData: 'पहिल्या तपासणीनंतर तुमच्या शेताच्या नोंदी येथे दिसतील.', tryFirst: 'पहिली पीक तपासणी करा', signOut: 'साइन आउट', crop: 'पीक', photo: 'फोटो (ऐच्छिक)', symptoms: 'तुम्हाला काय दिसत आहे?', notes: 'अतिरिक्त नोंदी', analyze: 'डेमो अंदाज तयार करा', report: 'शेत अहवाल', actions: 'पुढे काय करावे', alertsTitle: 'शेत सूचना', historyTitle: 'तुमच्या शेताच्या नोंदी', search: 'तपासण्या शोधा', compare: 'निवडलेल्या तपासा', export: 'यादी निर्यात', noAlerts: 'नवीन शेत सूचना नाहीत. आम्ही तुमच्यासोबत लक्ष ठेवू.', disclaimer: 'हे केवळ माहितीपर मार्गदर्शन आहे, निदान नाही. महत्त्वाचे निर्णय स्थानिक कृषी तज्ज्ञांकडून तपासून घ्या.' },
  Bengali: { overview: 'সারসংক্ষেপ', newScan: 'নতুন পরীক্ষা', history: 'পরীক্ষার ইতিহাস', alerts: 'সতর্কতা', signIn: 'সাইন ইন', getStarted: 'শুরু করুন', greeting: 'আপনার ক্ষেত, আরও স্পষ্ট।', subtitle: 'ক্ষেতে নেওয়া সিদ্ধান্তে আরও একটু স্বচ্ছতা।', startScan: 'ফসল পরীক্ষা করুন', seeHistory: 'পরীক্ষার ইতিহাস দেখুন', dashboard: 'ক্ষেতের সারসংক্ষেপ', today: 'ফসলের স্বাস্থ্য দেখুন স্থির চোখে', health: 'ক্ষেতের স্বাস্থ্য', currentRisk: 'বর্তমান ঝুঁকি', scans: 'এখন পর্যন্ত পরীক্ষা', recent: 'সাম্প্রতিক ক্ষেত পরীক্ষা', allScans: 'সব পরীক্ষা', weather: 'আবহাওয়ার ঝলক', demo: 'ডেমো অনুমান', noData: 'প্রথম পরীক্ষার পর ক্ষেতের নোট এখানে দেখা যাবে।', tryFirst: 'প্রথম ফসল পরীক্ষা করুন', signOut: 'সাইন আউট', crop: 'ফসল', photo: 'ছবি (ঐচ্ছিক)', symptoms: 'আপনি কী লক্ষ্য করছেন?', notes: 'অতিরিক্ত নোট', analyze: 'ডেমো অনুমান তৈরি করুন', report: 'ক্ষেত প্রতিবেদন', actions: 'এখন কী করবেন', alertsTitle: 'ক্ষেতের সতর্কতা', historyTitle: 'আপনার ক্ষেতের নোট', search: 'পরীক্ষা খুঁজুন', compare: 'নির্বাচিত তুলনা', export: 'তালিকা রপ্তানি', noAlerts: 'নতুন ক্ষেতের সতর্কতা নেই। আমরা আপনার সঙ্গে নজর রাখব।', disclaimer: 'এটি কেবল তথ্যভিত্তিক নির্দেশনা, রোগ নির্ণয় নয়। গুরুত্বপূর্ণ সিদ্ধান্ত স্থানীয় কৃষি বিশেষজ্ঞের সঙ্গে যাচাই করুন।' },
};
type Language = keyof typeof translations;
function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('agri-language');
    return saved && Object.hasOwn(translations, saved) ? (saved as Language) : 'English';
  });
  useEffect(() => {
    const syncLanguage = (event: Event) => setLanguage((event as CustomEvent<Language>).detail);
    window.addEventListener('agrishield-language-change', syncLanguage);
    return () => window.removeEventListener('agrishield-language-change', syncLanguage);
  }, []);
  const change = (value: Language) => {
    setLanguage(value);
    localStorage.setItem('agri-language', value);
    window.dispatchEvent(new CustomEvent('agrishield-language-change', { detail: value }));
  };
  return { language, t: translations[language], change };
}

type LocalScanPhoto = { scanId: string; blob: Blob; fileName: string };
function openPhotoStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('agrishield-local-field-photos', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('scan-photos')) db.createObjectStore('scan-photos', { keyPath: 'scanId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveLocalPhoto(scanId: string, file: File) {
  const db = await openPhotoStore();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('scan-photos', 'readwrite');
    transaction.objectStore('scan-photos').put({ scanId, blob: file, fileName: file.name } satisfies LocalScanPhoto);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }).finally(() => db.close());
}
async function readLocalPhoto(scanId: string): Promise<LocalScanPhoto | undefined> {
  const db = await openPhotoStore();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('scan-photos', 'readonly');
    const request = transaction.objectStore('scan-photos').get(scanId);
    request.onsuccess = () => resolve(request.result as LocalScanPhoto | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
}
async function removeLocalPhoto(scanId: string) {
  const db = await openPhotoStore();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('scan-photos', 'readwrite');
    transaction.objectStore('scan-photos').delete(scanId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }).finally(() => db.close());
}
function useLocalScanPhoto(scanId: string) {
  const [photo, setPhoto] = useState<{ url: string; fileName: string } | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setPhoto(null);
    if (!scanId || typeof indexedDB === 'undefined') return;
    readLocalPhoto(scanId).then((record) => {
      if (active && record?.blob) {
        objectUrl = URL.createObjectURL(record.blob);
        setPhoto({ url: objectUrl, fileName: record.fileName });
      }
    }).catch(() => { /* Local storage can be unavailable; report remains usable. */ });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [scanId]);
  return photo;
}

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" aria-label="AgriShield AI home" className={`inline-flex items-center gap-3 ${light ? 'text-[#f5f0df]' : 'text-[#204b38]'}`} data-testid="link-logo">
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d8a94d] text-[#173b2d]"><Sprout size={23} strokeWidth={1.8} /></span>
    <span className="leading-tight"><span className="block font-display text-[20px] font-semibold tracking-[-.04em]">AgriShield</span><span className="block text-[9px] font-bold uppercase tracking-[.2em] opacity-65">Field companion</span></span>
  </Link>;
}

function MarkIllustration() {
  return <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#dfe5d1] sm:min-h-[440px]">
    <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[#b8c6a3]" />
    <div className="absolute inset-x-0 bottom-[18%] h-[34%] rounded-[50%_50%_0_0] bg-[#8da77a]" />
    <div className="absolute inset-x-0 bottom-[8%] h-[24%] rounded-[50%_50%_0_0] bg-[#66865e]" />
    <div className="absolute left-[13%] top-[12%] h-16 w-16 rounded-full bg-[#e7bb68]" />
    <div className="absolute right-[9%] top-[13%] z-20 max-w-[195px] rounded-2xl border border-white/70 bg-[#f8f5e9]/95 p-4 shadow-lg backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#63805c]">Look closer, not louder</p>
      <p className="mt-2 font-display text-[18px] leading-tight text-[#234a37]">One careful check<br />can change the next step.</p>
    </div>
    <svg viewBox="0 0 420 440" className="relative z-10 h-[90%] max-h-[410px] w-[90%]" role="img" aria-label="Illustration of a healthy crop leaf held up for a field check">
      <path d="M208 386c-8-85-9-163 13-242" fill="none" stroke="#31593b" strokeWidth="11" strokeLinecap="round" />
      <path d="M211 259c-82-14-119-61-114-127 62-9 115 20 126 91" fill="#78975e" stroke="#31593b" strokeWidth="6" strokeLinejoin="round" />
      <path d="M105 139c38 30 73 57 111 101" fill="none" stroke="#d6dfb8" strokeWidth="5" strokeLinecap="round" />
      <path d="M218 206c17-72 67-107 132-97 7 60-22 111-92 121" fill="#9db67b" stroke="#31593b" strokeWidth="6" strokeLinejoin="round" />
      <path d="M339 119c-34 30-72 60-115 94" fill="none" stroke="#dce7c4" strokeWidth="5" strokeLinecap="round" />
      <path d="M221 291c-56 12-90 44-98 96 46 14 91 0 114-47" fill="#597b4e" stroke="#31593b" strokeWidth="6" strokeLinejoin="round" />
      <path d="M131 378c30-29 61-50 94-61" fill="none" stroke="#cbd8a9" strokeWidth="5" strokeLinecap="round" />
      <circle cx="216" cy="384" r="13" fill="#d6a650" />
      <path d="M213 382c-15-32-12-51 8-65 19 17 23 37 7 64" fill="#e9c46c" stroke="#31593b" strokeWidth="4" />
    </svg>
    <div className="absolute bottom-5 left-5 z-20 rounded-full bg-[#f8f5e9]/95 px-3 py-2 text-[11px] font-semibold text-[#31593b]">A companion for the season ahead</div>
  </div>;
}

function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const { t, language, change } = useLanguage();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  return <main className="grain min-h-[100dvh] bg-[#f6f3e9] text-[#1c3d2e]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-9">
      <Logo />
      <nav className="flex items-center gap-3">
        <select aria-label="Choose language" data-testid="select-language" value={language} onChange={(e) => change(e.target.value as Language)} className="h-11 rounded-xl border border-[#d8d4c5] bg-transparent px-3 text-sm font-semibold">
          {Object.keys(translations).map((l) => <option key={l}>{l}</option>)}
        </select>
        <Link href="/sign-in" className="hidden h-11 items-center px-4 text-sm font-bold sm:inline-flex" data-testid="link-sign-in">{t.signIn}</Link>
        <Link href="/sign-up" className="pressable inline-flex h-11 items-center rounded-xl bg-[#28543d] px-5 text-sm font-bold text-[#f7f3e7] shadow-sm" data-testid="link-get-started">{t.getStarted}<ArrowRight size={15} className="ml-2" /></Link>
      </nav>
    </header>
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-16 pt-7 sm:px-9 lg:grid-cols-[1.02fr_.98fr] lg:gap-14 lg:pb-24 lg:pt-12">
      <div className="reveal">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d6d9c5] bg-[#eff0e4] px-3 py-2 text-[11px] font-bold uppercase tracking-[.15em] text-[#54704e]"><ShieldCheck size={14} /> Made for thoughtful field decisions</div>
        <h1 className="max-w-[700px] font-display text-[clamp(3.1rem,7vw,6.6rem)] leading-[.94] tracking-[-.055em] text-[#1d432f]">{t.greeting}<span className="text-[#b98639]"> A companion that listens.</span></h1>
        <p className="mt-6 max-w-[520px] text-lg leading-8 text-[#5e6a58]">{t.subtitle} AgriShield helps you notice patterns, decide what to check next, and keep an eye on changing risk—without pretending an estimate is a certainty.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sign-up" className="pressable inline-flex min-h-14 items-center rounded-2xl bg-[#28543d] px-6 text-base font-bold text-[#f9f5e8]" data-testid="link-create-account">{t.getStarted}<ArrowRight size={17} className="ml-3" /></Link>
          <Link href="/sign-in" className="inline-flex min-h-14 items-center rounded-2xl border border-[#d7d2c2] px-6 text-base font-bold text-[#31513d]" data-testid="link-returning-farmer">{t.signIn}<ArrowRight size={17} className="ml-3" /></Link>
        </div>
        <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#707969]"><CircleHelp size={15} className="mt-0.5 shrink-0" /> Estimates are for learning and observation. A local agricultural expert is the right person to verify important concerns.</p>
      </div>
      <div className="reveal reveal-delay-2"><MarkIllustration /></div>
    </section>
    <section className="border-y border-[#e0dccd] bg-[#eeeade]">
      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-9 sm:grid-cols-3 sm:px-9">
        {[['01', 'Notice', 'Share what you see in the crop, and choose a demo scenario to explore.'], ['02', 'Understand', 'Read a clearly labeled estimate alongside other possibilities and context.'], ['03', 'Check again', 'Get grounded next steps for now, in two days, and over the week.']].map(([n, h, d]) => <div key={n} className="flex gap-4"><span className="font-display text-3xl text-[#bd8b40]">{n}</span><div><h2 className="font-display text-2xl">{h}</h2><p className="mt-1 max-w-xs text-sm leading-6 text-[#677261]">{d}</p></div></div>)}
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-9 lg:grid-cols-[.8fr_1.2fr] lg:py-24">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#9a7434]">A careful kind of help</p><h2 className="mt-4 max-w-lg font-display text-4xl leading-tight tracking-[-.04em] sm:text-5xl">Clear about what we know. Honest about what we don't.</h2></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-[#fffdf6] p-6 soft-shadow"><Activity size={22} className="text-[#618156]" /><h3 className="mt-5 font-display text-2xl">Room for uncertainty</h3><p className="mt-2 text-sm leading-6 text-[#66715f]">A demo estimate is never framed as a confirmed diagnosis. Compare possibilities and use your own field observations.</p></div>
        <div className="rounded-3xl bg-[#e1e8d9] p-6"><FileImage size={22} className="text-[#618156]" /><h3 className="mt-5 font-display text-2xl">Your photo stays yours</h3><p className="mt-2 text-sm leading-6 text-[#66715f]">Images stay on this browser. Photo recognition is not live yet, so no image is uploaded or analyzed.</p></div>
      </div>
    </section>
    <footer className="bg-[#1b402f] px-5 py-8 text-[#ece9d9] sm:px-9">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center"><Logo light /><p className="max-w-xl text-xs leading-5 text-[#bec9b9]">{t.disclaimer} Weather information shown in the app is demo data.</p><Link href="/sign-up" className="text-sm font-bold text-[#e8bd68]" data-testid="link-footer-start">{t.getStarted}<ArrowRight size={14} className="ml-2 inline" /></Link></div>
    </footer>
  </main>;
}

function SignInPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f3efe3] px-4 py-10"><div className="w-full"><div className="mb-6 flex justify-center"><Logo /></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></div>; }
function SignUpPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f3efe3] px-4 py-10"><div className="w-full"><div className="mb-6 flex justify-center"><Logo /></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></div>; }

function Protected({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-[#f6f3e9] p-8"><div className="mx-auto max-w-5xl animate-pulse space-y-5"><div className="h-10 w-48 rounded-xl bg-[#e8e2d3]" /><div className="h-36 rounded-3xl bg-[#e8e2d3]" /><div className="h-64 rounded-3xl bg-[#e8e2d3]" /></div></div>;
  return isSignedIn ? <>{children}</> : <Redirect to="/sign-in" />;
}

const navItems = [
  { href: '/dashboard', key: 'overview' as const, Icon: Activity },
  { href: '/scan', key: 'newScan' as const, Icon: ScanLine },
  { href: '/history', key: 'history' as const, Icon: FileImage },
  { href: '/alerts', key: 'alerts' as const, Icon: Bell },
];
function Shell({ children, title }: { children: ReactNode; title: string }) {
  const { t, language, change } = useLanguage();
  const [loc] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const base = basePath || '/';
  const sidebar = <aside className="flex h-full flex-col bg-[#1d4432] px-4 py-5 text-[#f5f0df]">
    <div className="px-2"><Logo light /></div>
    <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#aebe9e]">Field desk</p>
    <nav className="space-y-1" aria-label="Main navigation">{navItems.map(({ href, key, Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${loc === href || (href === '/scan' && loc.startsWith('/scan/')) ? 'bg-[#315941] text-[#f7d48a]' : 'text-[#e3e8d9] hover:bg-[#284e3b]'}`} data-testid={`nav-${key}`}><Icon size={18} />{t[key]}{href === '/alerts' && <span className="ml-auto h-2 w-2 rounded-full bg-[#d8aa55]" />}</Link>)}</nav>
    <div className="mt-auto rounded-2xl border border-[#41634a] bg-[#254b37] p-4"><div className="mb-2 flex items-center gap-2 text-[#e5bd69]"><ShieldCheck size={17} /><span className="text-xs font-bold">A note on estimates</span></div><p className="text-[11px] leading-5 text-[#c6d2c0]">Demo guidance is not a diagnosis. Ask a local expert before important decisions.</p></div>
    <button onClick={() => signOut({ redirectUrl: base })} className="mt-4 flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#dbe2d4] hover:bg-[#284e3b]" data-testid="button-sign-out"><LogOut size={17} />{t.signOut}</button>
  </aside>;
  return <div className="app-shell min-h-[100dvh] text-[#213d2f]">
    <div className="fixed inset-y-0 left-0 z-30 hidden w-[252px] lg:block">{sidebar}</div>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-[#14291e]/50" onClick={() => setMobileOpen(false)} /><div className="relative h-full w-[min(300px,86vw)]">{sidebar}<button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute right-3 top-5 rounded-full p-2 text-white"><X /></button></div></div>}
    <div className="lg:pl-[252px]">
      <header className="no-print sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e2dece] bg-[#f6f3e9]/95 px-4 backdrop-blur-lg sm:px-8">
        <div className="flex items-center gap-3"><button className="rounded-xl p-2 hover:bg-[#ebe8dc] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-menu"><Menu size={21} /></button><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#84907c]">AgriShield / Field desk</p><h1 className="font-display text-xl leading-tight sm:text-2xl">{title}</h1></div></div>
        <div className="flex items-center gap-3"><select aria-label="Choose interface language" data-testid="select-language" value={language} onChange={(e) => change(e.target.value as Language)} className="h-10 max-w-[124px] rounded-xl border border-[#dcd7c6] bg-[#fbf9f1] px-2 text-xs font-semibold sm:px-3 sm:text-sm">{Object.keys(translations).map((l) => <option key={l}>{l}</option>)}</select><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#e3e8d9] text-sm font-bold text-[#33553d] sm:flex" aria-label="Account">{user?.firstName?.[0] || 'F'}</div></div>
      </header>
      <main className="mx-auto max-w-[1420px] px-4 py-6 sm:px-8 sm:py-9">{children}</main>
    </div>
  </div>;
}

function ErrorState({ retry }: { retry: () => void }) {
  return <div className="rounded-3xl border border-[#e5c5ae] bg-[#fff8f2] p-8 text-center" role="alert"><p className="font-display text-2xl text-[#804831]">We couldn't load your field notes.</p><p className="mt-2 text-sm text-[#78675e]">Check your connection and try again. Your saved scans have not been changed.</p><button onClick={retry} className="mt-5 min-h-11 rounded-xl bg-[#315640] px-5 font-bold text-white" data-testid="button-retry">Try again</button></div>;
}
function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-[#c9cfbb] bg-[#f1f1e7] px-6 py-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e1e8d9] text-[#4e704e]"><Sprout size={26} /></div><h3 className="mt-4 font-display text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#707a6b]">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#92713b]">{eyebrow}</p><h2 className="mt-2 font-display text-3xl tracking-[-.035em] sm:text-4xl">{title}</h2></div>{children}</div>;
}
function DemoWeather({ weather }: { weather?: Scan['weather'] }) {
  if (!weather) return null;
  return <div className="rounded-3xl bg-[#e7eadc] p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#76816e]">Weather · demo</p><p className="mt-1 font-display text-3xl">{Math.round(weather.temperatureC)}°<span className="text-base">C</span></p></div><CloudRain className="text-[#658065]" /></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><span className="block text-[#818778]">Humidity</span><b>{weather.humidityPercent}%</b></div><div><span className="block text-[#818778]">Rain</span><b>{weather.rainfallMm} mm</b></div><div><span className="block text-[#818778]">Wind</span><b>{weather.windKph} km/h</b></div></div></div>;
}
function SeverityPill({ value }: { value: string }) {
  const style = /high|critical|urgent/i.test(value) ? 'bg-[#f6e0d3] text-[#934b31]' : /medium|moderate|watch/i.test(value) ? 'bg-[#f4edcf] text-[#846522]' : 'bg-[#e2ebdf] text-[#456747]';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}
function LocalPhotoTile({ scanId, size = 'small' }: { scanId: string; size?: 'small' | 'large' }) {
  const photo = useLocalScanPhoto(scanId);
  const large = size === 'large';
  return photo ? <img src={photo.url} alt={`Locally saved crop photo: ${photo.fileName}`} className={`${large ? 'h-full min-h-48 w-full' : 'h-full w-full'} object-cover`} /> : <div className={`flex h-full w-full flex-col items-center justify-center bg-[#e9ecdf] text-[#789074] ${large ? 'min-h-48' : ''}`} aria-label="No local photo available"><FileImage size={large ? 30 : 20} /><span className="mt-2 text-[10px] font-semibold">No local photo</span></div>;
}
function ScanCard({ scan, compact = false }: { scan: Scan; compact?: boolean }) {
  return <Link href={`/scan/${scan.id}`} className="group flex min-h-[108px] items-center gap-4 rounded-2xl border border-[#e2dece] bg-[#fbf9f1] p-4 transition hover:-translate-y-0.5 hover:border-[#b8c7ae] hover:shadow-sm" data-testid={`card-scan-${scan.id}`}>
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl"><LocalPhotoTile scanId={scan.id} /></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{scan.crop}</p><SeverityPill value={scan.severity} /></div><p className="mt-1 truncate text-sm text-[#596758]">{scan.disease}</p><p className="mt-1 text-xs text-[#8a9182]">{new Date(scan.createdAt).toLocaleDateString()}</p></div>
    {!compact && <div className="hidden text-right sm:block"><p className="text-xs text-[#819080]">Risk estimate</p><p className="font-display text-2xl">{scan.riskScore}<span className="text-sm">/100</span></p></div>}
    <ArrowRight size={17} className="text-[#95a08f] transition group-hover:translate-x-1 group-hover:text-[#315640]" />
  </Link>;
}
function DashboardPage() {
  const { t } = useLanguage();
  const dashboard = useGetDashboard();
  const scansQuery = useListScans();
  const alertsQuery = useListAlerts();
  const data = dashboard.data;
  const recent = data?.recentScans ?? scansQuery.data?.slice(0, 4) ?? [];
  return <Shell title={t.dashboard}><div className="reveal">
    <PageHeading eyebrow="Your season at a glance" title={t.today}><Link href="/scan" className="pressable inline-flex min-h-12 items-center justify-center rounded-xl bg-[#28543d] px-5 font-bold text-[#faf6e9]" data-testid="link-start-scan"><Plus size={17} className="mr-2" />{t.startScan}</Link></PageHeading>
    {dashboard.isLoading ? <div className="grid gap-4 md:grid-cols-3"><div className="h-40 animate-pulse rounded-3xl bg-[#e8e3d5]" /><div className="h-40 animate-pulse rounded-3xl bg-[#e8e3d5]" /><div className="h-40 animate-pulse rounded-3xl bg-[#e8e3d5]" /></div> : dashboard.isError ? <ErrorState retry={() => dashboard.refetch()} /> : <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl bg-[#28543d] p-6 text-[#f7f2e4] md:col-span-1"><div className="absolute -right-7 -top-9 h-40 w-40 rounded-full border-[22px] border-white/5" /><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#c1cfb5]">{t.health} · {t.demo}</p><div className="mt-5 flex items-end gap-3"><p className="font-display text-5xl">{data?.healthScore ?? '—'}</p><p className="mb-1 text-sm text-[#cbd7c4]">/100 · {data?.healthLabel || 'No estimate yet'}</p></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#e5bb65]" style={{ width: `${Math.min(100, data?.healthScore ?? 0)}%` }} /></div><p className="mt-3 text-xs text-[#cad6c4]">A helpful indicator, not a crop diagnosis.</p></div>
        <div className="rounded-3xl border border-[#e2dece] bg-[#fbf9f1] p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#778274]">{t.currentRisk}</p><div className="mt-5 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2ebd2] text-[#936d2a]"><Activity size={22} /></span><div><p className="font-display text-3xl">{data?.currentRisk || 'Not assessed'}</p><p className="text-xs text-[#7e897a]">Based on saved demo checks</p></div></div><Link href="/history" className="mt-5 inline-flex items-center text-sm font-bold text-[#47684a]">{t.seeHistory}<ArrowRight size={15} className="ml-2" /></Link></div>
        <div className="rounded-3xl border border-[#e2dece] bg-[#fbf9f1] p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#778274]">{t.scans}</p><p className="mt-3 font-display text-5xl">{data?.totalScans ?? scansQuery.data?.length ?? '—'}</p><p className="mt-2 text-sm text-[#758071]">Field checks saved in your account</p><Link href="/history" className="mt-4 inline-flex items-center text-sm font-bold text-[#47684a]">{t.allScans}<ArrowRight size={15} className="ml-2" /></Link></div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
        <section><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-2xl">{t.recent}</h3><Link href="/history" className="text-sm font-bold text-[#4a6a4b]" data-testid="link-all-scans">{t.allScans}<ArrowRight size={14} className="ml-1 inline" /></Link></div><div className="space-y-3">{recent.length ? recent.slice(0, 4).map((s) => <ScanCard key={s.id} scan={s} />) : <EmptyState title={t.noData} text="Start with what you notice in the field; there is no need for a photo." action={<Link href="/scan" className="font-bold text-[#365d40]">{t.tryFirst}<ArrowRight size={14} className="ml-1 inline" /></Link>} />}</div></section>
        <aside className="space-y-4"><DemoWeather weather={data?.weather} /><div className="rounded-3xl border border-[#e2dece] bg-[#fbf9f1] p-5"><div className="flex items-center justify-between"><h3 className="font-display text-xl">Field alerts</h3><Link href="/alerts" className="rounded-lg p-2 text-[#607960] hover:bg-[#eceee4]" aria-label="View alerts"><Bell size={17} /></Link></div>{(alertsQuery.data ?? data?.alerts ?? []).slice(0, 2).length ? (alertsQuery.data ?? data?.alerts ?? []).slice(0, 2).map((a) => <AlertRow key={a.id} alert={a} />) : <p className="mt-3 text-sm leading-6 text-[#778273]">No new field alerts. Keep observing at your own pace.</p>}</div></aside>
      </div>
    </>}
    <p className="mt-8 border-t border-[#e2dece] pt-4 text-xs leading-5 text-[#798273]">{t.disclaimer}</p>
  </div></Shell>;
}

function AlertRow({ alert }: { alert: Alert }) {
  const iconTone = alert.level === 'urgent' ? 'bg-[#f5dfd5] text-[#a15335]' : alert.level === 'watch' ? 'bg-[#f4edd2] text-[#90702c]' : 'bg-[#e3eadf] text-[#52704d]';
  return <Link href={alert.scanId ? `/scan/${alert.scanId}` : '/alerts'} className="mt-3 flex gap-3 rounded-xl bg-[#f3f1e8] p-3 hover:bg-[#eeede2]" data-testid={`alert-${alert.id}`}><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconTone}`}><Bell size={15} /></span><span><b className="block text-sm">{alert.title}</b><span className="mt-1 block text-xs leading-5 text-[#727c6d]">{alert.detail}</span><span className="mt-1 block text-[10px] text-[#92998c]">{new Date(alert.createdAt).toLocaleString()}</span></span></Link>;
}

function ScanPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const createScan = useCreateScan();
  const [crop, setCrop] = useState<ScanInput['crop']>('Rice');
  const [scenario, setScenario] = useState<NonNullable<ScanInput['demoScenario']>>('auto');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    if (scenario === 'rice-fungal') setCrop('Rice');
    if (scenario === 'tomato-leaf') setCrop('Tomato');
    if (scenario === 'cotton-pest') setCrop('Cotton');
  }, [scenario]);
  function pickFile(file?: File) {
    setFileError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setFileError('Choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 8 * 1024 * 1024) { setFileError('That image is larger than 8 MB. Please choose a smaller image.'); return; }
    setPhoto(file);
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createScan.mutate({ data: { crop, imagePath: null, symptoms: symptoms.trim(), notes: notes.trim(), demoScenario: scenario } }, {
      onSuccess: async (scan) => {
        if (photo) {
          try { await saveLocalPhoto(scan.id, photo); } catch { /* The scan report still works if browser storage is unavailable. */ }
        }
        queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        setLocation(`/scan/${scan.id}`);
      },
    });
  }
  return <Shell title={t.newScan}><div className="mx-auto max-w-4xl reveal"><PageHeading eyebrow="A careful field check" title="Tell us what you're seeing"><span className="rounded-full border border-[#d5d9c9] bg-[#edf0e5] px-3 py-2 text-xs font-bold text-[#526a4c]">A few minutes · no diagnosis</span></PageHeading>
    <div className="mb-6 flex gap-3 rounded-2xl border border-[#d8c18e] bg-[#f5eed9] p-4 text-sm leading-6 text-[#62573d]"><CircleHelp className="mt-1 shrink-0 text-[#997431]" size={18} /><p><b>Honest by design.</b> This creates a clearly labeled demo estimate from the scenario you choose. Photos stay in this browser and are not uploaded or analyzed; image analysis is not live yet. When attached to a saved scan, a photo is kept in browser-only storage and will not sync across devices. Weather context is also demo data.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-3xl border border-[#e2dece] bg-[#fbf9f1] p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5eadc] font-display text-lg text-[#426443]">1</span><div><h3 className="font-display text-2xl">Crop and context</h3><p className="text-xs text-[#788374]">Choose what best describes this field check.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold">{t.crop}</span><select value={crop} onChange={(e) => setCrop(e.target.value as ScanInput['crop'])} className="h-12 w-full rounded-xl border border-[#d9d6c8] bg-[#fffdf7] px-3" data-testid="select-crop">{['Rice', 'Tomato', 'Cotton', 'Chilli', 'Maize', 'Wheat', 'Groundnut', 'Potato', 'Other'].map((c) => <option key={c}>{c}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-bold">Demo scenario <span className="font-normal text-[#7e887a]">(used for estimate)</span></span><select value={scenario} onChange={(e) => setScenario(e.target.value as NonNullable<ScanInput['demoScenario']>)} className="h-12 w-full rounded-xl border border-[#d9d6c8] bg-[#fffdf7] px-3" data-testid="select-scenario"><option value="auto">Automatic demo example</option><option value="rice-fungal">Rice · fungal-like example</option><option value="tomato-leaf">Tomato · leaf example</option><option value="cotton-pest">Cotton · pest-like example</option><option value="healthy">Healthy crop example</option><option value="low-confidence">Unclear example</option></select></label></div></section>
      <section className="rounded-3xl border border-[#e2dece] bg-[#fbf9f1] p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5eadc] font-display text-lg text-[#426443]">2</span><div><h3 className="font-display text-2xl">What do you notice?</h3><p className="text-xs text-[#788374]">A few details help you keep a useful record.</p></div></div><label className="block"><span className="mb-2 block text-sm font-bold">{t.symptoms}</span><textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} maxLength={1000} rows={3} placeholder="For example: small pale spots on older leaves, noticed this morning…" className="w-full resize-y rounded-xl border border-[#d9d6c8] bg-[#fffdf7] p-3 text-sm leading-6 placeholder:text-[#999b8d]" data-testid="input-symptoms" /><span className="mt-1 block text-right text-xs text-[#8a9182]">{symptoms.length}/1000</span></label><label className="mt-4 block"><span className="mb-2 block text-sm font-bold">{t.notes}</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} placeholder="Recent changes, field location, or what you have already checked…" className="w-full resize-y rounded-xl border border-[#d9d6c8] bg-[#fffdf7] p-3 text-sm leading-6 placeholder:text-[#999b8d]" data-testid="input-notes" /></label></section>
      <section className="rounded-3xl border border-[#e2dece] bg-[#fbf9f1] p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5eadc] font-display text-lg text-[#426443]">3</span><div><h3 className="font-display text-2xl">{t.photo}</h3><p className="text-xs text-[#788374]">Optional · kept only on this device · maximum 8 MB</p></div></div>{preview ? <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><img src={preview} alt="Local preview of selected crop" className="h-44 w-44 rounded-2xl object-cover" /><div><p className="font-bold">{photo?.name}</p><p className="mt-1 text-sm text-[#747e6f]">Preview only. This image will not be uploaded or analyzed.</p><button type="button" onClick={() => { setPhoto(null); if (inputRef.current) inputRef.current.value = ''; }} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-[#8f4933] hover:bg-[#f7e9df]" data-testid="button-remove-photo"><Trash2 size={15} />Remove photo</button></div></div> : <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-[112px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c9cfbd] bg-[#f5f4eb] text-center hover:border-[#718b66] hover:bg-[#eff1e7]" data-testid="button-select-photo"><Upload size={22} className="text-[#62805a]" /><span className="mt-2 text-sm font-bold">Choose a photo</span><span className="mt-1 text-xs text-[#848b7d]">JPG, PNG, WebP</span></button>}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" aria-label="Choose crop photo" onChange={(e) => pickFile(e.currentTarget.files?.[0])} data-testid="input-photo" />{fileError && <p role="alert" className="mt-3 text-sm font-semibold text-[#a34532]">{fileError}</p>}</section>
      {createScan.isError && <p role="alert" className="rounded-xl bg-[#f8e8df] p-3 text-sm text-[#874a34]">We couldn't create this estimate. Your notes are still here—please try again.</p>}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-[#e8ebdf] p-4 sm:flex-row sm:items-center sm:p-5"><p className="max-w-xl text-xs leading-5 text-[#70796d]">By continuing, you understand this is a demo estimate, not a diagnosis. Please verify concerns with a local agricultural expert.</p><button type="submit" disabled={createScan.isPending} className="pressable inline-flex min-h-14 shrink-0 items-center justify-center rounded-xl bg-[#28543d] px-6 font-bold text-white disabled:opacity-60" data-testid="button-submit-scan">{createScan.isPending ? 'Preparing estimate…' : t.analyze}<ArrowRight size={17} className="ml-3" /></button></div>
    </form>
  </div></Shell>;
}

function ListBlock({ title, items, accent = false }: { title: string; items: string[]; accent?: boolean }) {
  return <section className={`rounded-2xl p-5 ${accent ? 'bg-[#e7ebde]' : 'border border-[#e4dfd0] bg-[#fbf9f1]'}`}><h3 className="font-display text-xl">{title}</h3>{items?.length ? <ul className="mt-3 space-y-3">{items.map((item, i) => <li key={`${i}-${item}`} className="flex gap-3 text-sm leading-6 text-[#546354]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#bd8b40]" />{item}</li>)}</ul> : <p className="mt-3 text-sm text-[#7b8678]">No notes recorded.</p>}</section>;
}
function RiskTimeline({ scan }: { scan: Scan }) {
  const observations = [
    scan.symptoms ? { label: 'Symptoms noted', value: scan.symptoms } : null,
    scan.notes ? { label: 'Additional notes', value: scan.notes } : null,
  ].filter((item): item is { label: string; value: string } => item !== null);
  return (
    <div className="rounded-3xl border border-[#e2dece] bg-[#fbf9f1] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7f897a]">Risk outlook · demo</p>
          <p className="mt-1 font-display text-xl">{scan.riskOutlook}</p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-[#e2c26e] font-display text-xl">{scan.riskScore}</div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {scan.timeline.map((point, i) => (
          <div key={`${point.label}-${i}`} className="relative rounded-xl bg-[#f0efe5] p-3">
            <p className="text-xs font-bold text-[#506249]">{point.label}</p>
            <p className="mt-2 text-sm font-semibold">{point.riskLevel}</p>
            <p className="mt-1 text-xs leading-5 text-[#737d6f]">{point.detail}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-5 text-[#7a8576]">Risk score and outlook are illustrative demo estimates. They are not forecasts or measurements.</p>
      {observations.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#e2dece] bg-white/60 p-4">
          <h3 className="font-display text-lg">Your field notes</h3>
          <div className="mt-2 space-y-3">
            {observations.map((item) => (
              <p key={item.label} className="text-sm leading-6 text-[#596758]">
                <strong className="mr-1 text-[#344c39]">{item.label}:</strong>{item.value}
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-[#e2dece] bg-white/60 p-4">
        <h3 className="font-display text-lg">Sources & local support</h3>
        <p className="mt-1 text-xs leading-5 text-[#687365]">This simulated result is not sourced to a confirmed diagnosis. For locally verified advice, ask an agricultural extension specialist. ICAR describes its Krishi Vigyan Kendras as district-level extension institutions that provide farm advisories.</p>
        <a href="https://www.icar.gov.in/en/krishi-vigyan-kendras-kvks" target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#315d40]">
          ICAR · Krishi Vigyan Kendras <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}
function ReportPage() {
  const [, params] = useRoute('/scan/:scanId');
  const id = params?.scanId || '';
  const scanQuery = useGetScan(id, { query: { enabled: !!id, queryKey: getGetScanQueryKey(id) } });
  const { t } = useLanguage();
  const scan = scanQuery.data;
  const localPhoto = useLocalScanPhoto(scan?.id ?? '');
  const [, setLocation] = useLocation();
  async function share() {
    const text = scan ? `${scan.crop}: ${scan.disease} — demo estimate, not a diagnosis. ${window.location.origin}${basePath}/scan/${scan.id}` : '';
    if (navigator.share) await navigator.share({ title: 'AgriShield field report', text, url: window.location.href });
    else { await navigator.clipboard.writeText(text); window.alert('Report link copied.'); }
  }
  return <Shell title={t.report}><div className="mx-auto max-w-5xl">
     <div className="no-print mb-5 flex items-center justify-between"><button onClick={() => setLocation('/history')} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-[#4e684e] hover:bg-[#e9e9dc]" data-testid="button-back-history"><ArrowLeft size={17} />History</button>{scan && <div className="flex gap-2"><button onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d8d4c5] bg-[#fbf9f1] px-4 text-sm font-bold" data-testid="button-export-report"><Download size={16} />Save / print</button><button onClick={() => void share()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#28543d] px-4 text-sm font-bold text-white" data-testid="button-share-report">Share<ArrowRight size={15} /></button></div>}</div>
    {scanQuery.isLoading ? <div className="h-96 animate-pulse rounded-3xl bg-[#e8e3d5]" /> : scanQuery.isError ? <ErrorState retry={() => scanQuery.refetch()} /> : scan ? <>
      <div className="reveal overflow-hidden rounded-[2rem] bg-[#28543d] text-[#f8f4e8]"><div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-9"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e4bb68] px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#2b4c34]">Demo estimate · not image analysis</span><SeverityPill value={scan.severity} /></div><p className="mt-5 text-xs font-bold uppercase tracking-[.15em] text-[#c2d1b8]">{scan.crop} · {new Date(scan.createdAt).toLocaleString()}</p><h2 className="mt-2 font-display text-4xl tracking-[-.04em] sm:text-5xl">{scan.disease}</h2><p className="mt-1 font-serif text-sm italic text-[#c5d1be]">{scan.scientificName}</p><p className="mt-5 max-w-2xl text-sm leading-7 text-[#e0e8d8]">{scan.explanation}</p><p className="mt-3 text-xs text-[#bdcfb7]">Affected part: {scan.affectedPart} · Estimate confidence: {scan.confidence}%</p></div><div className="flex items-center gap-4 sm:justify-center"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/15"><LocalPhotoTile scanId={scan.id} size="large" /></div><div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#c2d1b8]">Estimated risk</p><p className="mt-1 font-display text-6xl">{scan.riskScore}</p><p className="text-sm text-[#d7e2d1]">{scan.riskLevel} · out of 100</p></div></div></div><div className="border-t border-white/15 bg-[#234b36] px-6 py-4 text-xs leading-5 text-[#d7e0d0] sm:px-9">This is a demo estimate based on the selected demo scenario. No photo is analyzed. {localPhoto ? 'This report image is stored only in this browser and does not sync across devices.' : 'A browser-local photo is not available on this device; images do not sync across devices.'} Use field observations and expert advice to verify.</div></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><div className="space-y-4"><RiskTimeline scan={scan} /><ListBlock title="Possible explanations" items={scan.alternatives} /><div className="grid gap-4 sm:grid-cols-2"><ListBlock title="Likely factors" items={scan.likelyFactors} /><ListBlock title="Other factors to consider" items={scan.possibleFactors} /></div><ListBlock title="What to check to confirm" items={scan.confirmFactors} /></div><div className="space-y-4"><ListBlock title="Check now" items={scan.actionsNow} accent /><ListBlock title="Over the next 48 hours" items={scan.actions48Hours} /><ListBlock title="Over the next 7 days" items={scan.actions7Days} /><ListBlock title="What to avoid" items={scan.avoid} /><ListBlock title="Keep an eye on" items={scan.monitor} /><ListBlock title="For future prevention" items={scan.prevention} /><DemoWeather weather={scan.weather} /></div></div>
      <div className="mt-5 rounded-2xl border border-[#dcc896] bg-[#f4eedc] p-4 text-sm leading-6 text-[#62583f]"><b>Expert verification matters.</b> This guidance is informational and should not be treated as a diagnosis. Confirm concerns and any treatment decisions with a qualified local agricultural expert. No chemical products or treatment doses are prescribed here.</div>
    </> : <EmptyState title="Report not found" text="This scan may have been removed or is no longer available." action={<Link href="/history" className="font-bold text-[#365d40]">Back to history</Link>} />}
  </div></Shell>;
}

function HistoryPage() {
  const { t } = useLanguage();
  const scansQuery = useListScans();
  const removeScan = useDeleteScan();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [compare, setCompare] = useState(false);
  const scans = scansQuery.data ?? [];
  const filtered = useMemo(() => scans.filter((s) => `${s.crop} ${s.disease} ${s.severity}`.toLowerCase().includes(search.toLowerCase())), [scans, search]);
  const compareScans = scans.filter((s) => selected.includes(s.id)).slice(0, 2);
  function exportList() {
    const rows = [['Date', 'Crop', 'Estimate', 'Severity', 'Risk score'], ...filtered.map((s) => [new Date(s.createdAt).toLocaleDateString(), s.crop, s.disease, s.severity, String(s.riskScore)])];
    const blob = new Blob([rows.map((row) => row.map((x) => `"${x.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'agrishield-scan-history.csv'; link.click(); URL.revokeObjectURL(link.href);
  }
  function deleteOne(scan: Scan) {
    if (!window.confirm(`Delete the ${scan.crop} field check for "${scan.disease}"? This cannot be undone.`)) return;
    removeScan.mutate({ scanId: scan.id }, { onSuccess: () => { void removeLocalPhoto(scan.id).catch(() => undefined); queryClient.invalidateQueries({ queryKey: getListScansQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() }); queryClient.removeQueries({ queryKey: getGetScanQueryKey(scan.id) }); setSelected((current) => current.filter((id) => id !== scan.id)); } });
  }
  return <Shell title={t.history}><PageHeading eyebrow="Your field journal" title={t.historyTitle}><div className="flex flex-wrap gap-2"><button onClick={exportList} disabled={!filtered.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d8d4c5] bg-[#fbf9f1] px-4 text-sm font-bold disabled:opacity-50" data-testid="button-export-history"><Download size={16} />{t.export}</button><Link href="/scan" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#28543d] px-4 text-sm font-bold text-white" data-testid="link-new-scan-history"><Plus size={16} />{t.newScan}</Link></div></PageHeading>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84907f]" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} aria-label={t.search} className="h-12 w-full rounded-xl border border-[#ddd9ca] bg-[#fbf9f1] pl-11 pr-4 text-sm" data-testid="input-history-search" /></label><button onClick={() => setCompare((v) => !v)} disabled={selected.length < 2} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold ${selected.length >= 2 ? 'bg-[#e4eadc] text-[#3e6143]' : 'bg-[#e8e5db] text-[#92978a]'}`} data-testid="button-compare">{compare ? 'Hide comparison' : t.compare}{selected.length > 0 && <span className="rounded-full bg-white/70 px-2 py-0.5">{selected.length}/2</span>}</button></div>
    {scansQuery.isLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#e8e3d5]" />)}</div> : scansQuery.isError ? <ErrorState retry={() => scansQuery.refetch()} /> : filtered.length ? <div className="grid gap-3">{filtered.map((scan) => <div key={scan.id} className="flex items-center gap-2"><label className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dedacb] bg-[#fbf9f1]" title="Select scan to compare"><input type="checkbox" aria-label={`Select ${scan.crop} scan to compare`} checked={selected.includes(scan.id)} onChange={() => setSelected((s) => s.includes(scan.id) ? s.filter((id) => id !== scan.id) : s.length < 2 ? [...s, scan.id] : [s[1], scan.id])} data-testid={`checkbox-compare-${scan.id}`} className="h-4 w-4 accent-[#315940]" /></label><div className="min-w-0 flex-1"><ScanCard scan={scan} /></div><button type="button" onClick={() => deleteOne(scan)} disabled={removeScan.isPending} aria-label={`Delete ${scan.crop} scan`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#9b5740] hover:bg-[#f5e5dd] disabled:opacity-50" data-testid={`button-delete-${scan.id}`}><Trash2 size={17} /></button></div>)}</div> : <EmptyState title={search ? 'No matching field checks' : t.noData} text={search ? 'Try a crop name, estimate, or severity.' : 'Your saved scan reports will collect here so you can track what changes over time.'} action={!search && <Link href="/scan" className="inline-flex min-h-11 items-center rounded-xl bg-[#28543d] px-5 font-bold text-white">{t.tryFirst}<ArrowRight size={15} className="ml-2" /></Link>} />}
    {compare && compareScans.length === 2 && <section className="mt-7 rounded-3xl border border-[#ccd3bf] bg-[#edf0e6] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#75846f]">Field check comparison</p><h3 className="mt-1 font-display text-2xl">What changed?</h3></div><button onClick={() => setCompare(false)} aria-label="Close comparison" className="rounded-full p-2 hover:bg-white"><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{compareScans.map((s) => <article key={s.id} className="rounded-2xl bg-[#fbf9f1] p-5"><p className="text-xs text-[#7b8776]">{new Date(s.createdAt).toLocaleDateString()}</p><h4 className="mt-1 font-display text-2xl">{s.crop}</h4><p className="text-sm">{s.disease}</p><div className="mt-4 flex flex-wrap gap-2"><SeverityPill value={s.severity} /><span className="rounded-full bg-[#ebe9dc] px-3 py-1 text-xs font-bold">Risk {s.riskScore}/100</span></div><p className="mt-3 text-sm leading-6 text-[#667161]">{s.riskOutlook}</p><Link href={`/scan/${s.id}`} className="mt-4 inline-flex items-center text-sm font-bold text-[#456747]">Open report<ArrowRight size={14} className="ml-1" /></Link></article>)}</div><p className="mt-4 text-xs text-[#788274]">Both values are demo estimates. Differences do not prove a crop condition has improved or worsened.</p></section>}
    {removeScan.isError && <p role="alert" className="mt-4 rounded-xl bg-[#f8e8df] p-3 text-sm text-[#874a34]">Could not delete this scan. Please try again.</p>}
  </Shell>;
}

function AlertsPage() {
  const { t } = useLanguage();
  const alertsQuery = useListAlerts();
  const dashboard = useGetDashboard();
  const alerts = alertsQuery.data ?? dashboard.data?.alerts ?? [];
  return <Shell title={t.alertsTitle}><PageHeading eyebrow="Notices for your field" title={t.alertsTitle}><span className="rounded-full bg-[#e6eadf] px-3 py-2 text-xs font-bold text-[#57704f]">{alerts.length} {alerts.length === 1 ? 'notice' : 'notices'}</span></PageHeading>
    <div className="mb-5 flex gap-3 rounded-2xl border border-[#ded2ad] bg-[#f4efdf] p-4 text-sm leading-6 text-[#675d45]"><Bell size={18} className="mt-1 shrink-0 text-[#947432]" /><p>Alerts are prompts to look more closely, not claims that a crop is affected. Weather context and scan estimates are demo data.</p></div>
    {alertsQuery.isLoading && dashboard.isLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#e8e3d5]" />)}</div> : alertsQuery.isError && dashboard.isError ? <ErrorState retry={() => { void alertsQuery.refetch(); void dashboard.refetch(); }} /> : alerts.length ? <div className="space-y-3">{alerts.map((alert) => <div key={alert.id} className="rounded-2xl border border-[#e2dece] bg-[#fbf9f1] p-2"><AlertRow alert={alert} /></div>)}</div> : <EmptyState title={t.noAlerts} text="When a saved field check calls for a closer look, the reminder will be kept here." action={<Link href="/scan" className="font-bold text-[#365d40]">{t.startScan}<ArrowRight size={14} className="ml-1 inline" /></Link>} />}
  </Shell>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previous.current !== undefined && previous.current !== userId) client.clear();
      previous.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}
function ClerkRoutes() {
  const [, setLocation] = useLocation();
  const appearance = {
    theme: shadcn,
    cssLayerName: 'clerk',
    variables: { colorPrimary: '#28543d', colorForeground: '#233d2f', colorMutedForeground: '#697567', colorDanger: '#a54d37', colorBackground: '#fbf9f1', colorInput: '#fffdf7', colorInputForeground: '#233d2f', colorNeutral: '#d7d3c4', fontFamily: 'DM Sans, sans-serif', borderRadius: '1rem' },
    elements: { rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fbf9f1] rounded-3xl w-[440px] max-w-full overflow-hidden border border-[#e2dece]', card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none', headerTitle: 'text-[#204b38]', headerSubtitle: 'text-[#697567]', formFieldLabel: 'text-[#344e3c]', footerActionLink: 'text-[#28543d]', footerActionText: 'text-[#697567]', dividerText: 'text-[#697567]', alertText: 'text-[#7b3728]', formFieldSuccessText: 'text-[#315d3a]', identityPreviewEditButton: 'text-[#28543d]', formButtonPrimary: 'bg-[#28543d] hover:bg-[#1f4634] text-white', formFieldInput: 'border-[#d7d3c4] bg-[#fffdf7]', socialButtonsBlockButton: 'border-[#d7d3c4]', socialButtonsBlockButtonText: 'text-[#344e3c]' },
    options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  };
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Your field companion is ready.' } }, signUp: { start: { title: 'Start your field journal', subtitle: 'A little more clarity, season by season.' } } }}>
    <ClerkQueryClientCacheInvalidator />
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard"><Protected><DashboardPage /></Protected></Route>
      <Route path="/scan/:scanId"><Protected><ReportPage /></Protected></Route>
      <Route path="/scan"><Protected><ScanPage /></Protected></Route>
      <Route path="/history"><Protected><HistoryPage /></Protected></Route>
      <Route path="/alerts"><Protected><AlertsPage /></Protected></Route>
      <Route component={NotFound} />
    </Switch>
  </ClerkProvider>;
}
if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function App() {
  if (!clerkPubKey) return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6f3e9] p-8 text-center"><div><Logo /><p className="mt-8 font-display text-3xl">AgriShield needs its sign-in key.</p><p className="mt-2 max-w-lg text-sm text-[#687466]">The Clerk publishable key is not configured for this app. Add VITE_CLERK_PUBLISHABLE_KEY to enable personal field records.</p></div></main>;
  return <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><ClerkRoutes /></WouterRouter></QueryClientProvider>;
}

export default App;
