import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  BankAccountData,
  SimProfileData,
  TransactionData,
  P2PContact,
  TransactionCategory,
  Vitals,
  PhysicalAffliction,
  SmsMessage
} from '../types/game';
import { sounds } from '../utils/audio';
import {
  Smartphone,
  CreditCard,
  PieChart as PieChartIcon,
  Send,
  Wifi,
  Signal,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Fingerprint,
  RefreshCw,
  Search,
  Sparkles,
  Sliders,
  Heart,
  Utensils,
  Droplets,
  Zap,
  Activity,
  Moon,
  Clock,
  Phone,
  PhoneCall,
  MessageSquare,
  Building2,
  Home as HomeIcon,
  X,
  User,
  ArrowLeft,
  AlertCircle,
  Volume2
} from 'lucide-react';

interface MobileAppProps {
  bankAccount: BankAccountData | null;
  simProfile: SimProfileData | null;
  transactions: TransactionData[];
  vitals: Vitals;
  gameHour: number;
  gameDay: number;
  afflictions: PhysicalAffliction[];
  isOpen: boolean;
  onToggle: () => void;
  onSendP2P: (recipient: string, amount: number, note: string) => Promise<boolean>;
  onToggleCardActive: (isActive: boolean) => void;
  onQuickEat?: () => void;
  onQuickDrink?: () => void;
  characterName: string;
}

type AppScreen = 'homescreen' | 'bank' | 'vitals' | 'phone' | 'messages' | 'bistro';
type BankSubTab = 'home' | 'analytics' | 'p2p' | 'cards';

const DEFAULT_SMS: SmsMessage[] = [
  {
    id: 'm1',
    senderName: 'Metro Federal Bank',
    senderPhone: '4091-METRO',
    body: 'Welcome to Metro Bank! Your checking account and initial $1,500 grant have been authorized.',
    timestamp: 'Today, 9:30 AM',
    isRead: false,
    avatarBg: 'bg-amber-500',
  },
  {
    id: 'm2',
    senderName: 'Elena (Roommate)',
    senderPhone: '+1 (555) 902-1142',
    body: 'Hey! Don’t forget to eat lunch today, there is a great restaurant across the plaza. Let me know when you activate your SIM!',
    timestamp: 'Today, 10:15 AM',
    isRead: true,
    avatarBg: 'bg-emerald-500',
  },
  {
    id: 'm3',
    senderName: 'Nova Telecom 5G',
    senderPhone: '555-NOVA',
    body: 'NovaNet 5G coverage is live across the city center. Activate your SIM to enable instant mobile payments.',
    timestamp: 'Yesterday',
    isRead: true,
    avatarBg: 'bg-purple-500',
  },
  {
    id: 'm4',
    senderName: 'Dave Henderson (Landlord)',
    senderPhone: '+1 (555) 304-8921',
    body: 'Apartment keys are in order. Make sure to get plenty of sleep in your bed to stay energized for city life.',
    timestamp: 'Yesterday',
    isRead: true,
    avatarBg: 'bg-indigo-500',
  },
];

const DEFAULT_CONTACTS: P2PContact[] = [
  {
    id: 'c1',
    name: 'Elena Vance (Roommate)',
    customerId: 'CUST-8831-29',
    phoneNumber: '+1 (555) 902-1142',
    avatarBg: 'bg-emerald-500',
    relationship: 'Rent & Groceries',
  },
  {
    id: 'c2',
    name: 'Dave Henderson (Landlord)',
    customerId: 'CUST-4109-88',
    phoneNumber: '+1 (555) 304-8921',
    avatarBg: 'bg-indigo-500',
    relationship: 'Apartment Lease',
  },
  {
    id: 'c3',
    name: 'Bella Vista Bistro',
    customerId: 'CUST-6721-04',
    phoneNumber: '+1 (555) 492-7719',
    avatarBg: 'bg-amber-500',
    relationship: 'Fine Dining & Cafe',
  },
  {
    id: 'c4',
    name: 'Dr. Sarah Lin (Clinic)',
    customerId: 'CUST-3390-12',
    phoneNumber: '+1 (555) 621-4800',
    avatarBg: 'bg-rose-500',
    relationship: 'Medical Services',
  },
];

const CATEGORY_COLORS: Record<TransactionCategory, { bg: string; text: string; hex: string }> = {
  Food: { bg: 'bg-amber-500/10', text: 'text-amber-400', hex: '#f59e0b' },
  Water: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', hex: '#06b6d4' },
  Telecom: { bg: 'bg-purple-500/10', text: 'text-purple-400', hex: '#a855f7' },
  Transfer: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', hex: '#6366f1' },
  Banking: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', hex: '#10b981' },
  Groceries: { bg: 'bg-lime-500/10', text: 'text-lime-400', hex: '#84cc16' },
  Housing: { bg: 'bg-blue-500/10', text: 'text-blue-400', hex: '#3b82f6' },
};

export interface ActiveCallInfo {
  name: string;
  number: string;
  transcript: string;
  seconds: number;
}

export const MobileApp: React.FC<MobileAppProps> = ({
  bankAccount,
  simProfile,
  transactions,
  vitals,
  gameHour,
  gameDay,
  afflictions = [],
  isOpen,
  onToggle,
  onSendP2P,
  onToggleCardActive,
  onQuickEat,
  onQuickDrink,
  characterName,
}) => {
  // Navigation: Starts on Homescreen
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('homescreen');
  const [bankSubTab, setBankSubTab] = useState<BankSubTab>('home');
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'All'>('All');

  // Dialer state
  const [dialedNumber, setDialedNumber] = useState('');
  const [activeCall, setActiveCall] = useState<ActiveCallInfo | null>(null);

  // Call timer effect
  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, seconds: prev.seconds + 1 } : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  // SMS state
  const [messages, setMessages] = useState<SmsMessage[]>(DEFAULT_SMS);
  const [activeThread, setActiveThread] = useState<SmsMessage | null>(null);
  const [newSmsText, setNewSmsText] = useState('');

  // P2P Transfer form state
  const [recipientInput, setRecipientInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Spending analytics aggregation
  const analytics = useMemo(() => {
    const categoryTotals: Record<string, number> = {
      Food: 0,
      Water: 0,
      Telecom: 0,
      Transfer: 0,
      Groceries: 0,
      Housing: 0,
    };
    let totalSpent = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'debit') {
        const cat = tx.category || 'Food';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
        totalSpent += tx.amount;
      }
    });

    const categoriesList = Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name: name as TransactionCategory,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        color: CATEGORY_COLORS[name as TransactionCategory]?.hex || '#94a3b8',
      }))
      .filter((item) => item.amount > 0 || totalSpent === 0);

    return {
      totalSpent,
      categoriesList,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simProfile?.isActivated) {
      sounds.playNotification();
      setTransferStatus({
        success: false,
        message: 'SIM card is not activated. Visit Nova Telecom in the city to unlock online transfers!',
      });
      return;
    }

    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      setTransferStatus({ success: false, message: 'Please enter a valid amount.' });
      return;
    }

    if (!bankAccount || amt > bankAccount.balance) {
      setTransferStatus({ success: false, message: 'Insufficient funds in your bank account.' });
      return;
    }

    if (!recipientInput.trim()) {
      setTransferStatus({ success: false, message: 'Please specify a recipient contact or ID.' });
      return;
    }

    setIsSending(true);
    setTransferStatus(null);

    try {
      const ok = await onSendP2P(recipientInput.trim(), amt, noteInput.trim() || 'P2P Transfer');
      if (ok) {
        sounds.playTransferSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6, x: 0.8 },
        });
        setTransferStatus({
          success: true,
          message: `Successfully transferred $${amt.toFixed(2)} to ${recipientInput}!`,
        });
        setAmountInput('');
        setNoteInput('');
      } else {
        setTransferStatus({ success: false, message: 'Transfer failed. Check balance or try again.' });
      }
    } catch {
      setTransferStatus({ success: false, message: 'Error processing transfer.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleDialNumber = (digit: string) => {
    sounds.playPhoneKey(digit);
    setDialedNumber((prev) => prev + digit);
  };

  const handleCall = (target: string) => {
    sounds.playNotification();
    const clean = target.toLowerCase();
    let name = target;
    let transcript = "The party you dialed is currently unavailable. Please verify the telephone number and dial again.";

    if (clean.includes('4091') || clean.includes('metro')) {
      name = 'Metropolis Federal Bank Helpline';
      transcript = `Thank you for calling Metro Bank Phone Service. Your checking balance is $${bankAccount ? bankAccount.balance.toFixed(2) : '0.00'}. Customer ID: ${bankAccount?.customerId || 'Unassigned'}. Debit Card status: ${bankAccount?.isCardActive ? 'Active' : 'Locked'}.`;
    } else if (clean.includes('555-nova') || clean.includes('nova')) {
      name = 'Nova Telecom Customer Care';
      transcript = simProfile?.isActivated
        ? `NovaNet 5G Automated Care: Your mobile line ${simProfile.phoneNumber} is connected with 50 GB data. Peer-to-peer mobile payments are fully authorized.`
        : 'NovaNet Care: Your SIM profile is pending. Please visit the Nova Telecom storefront in the plaza to activate your SIM.';
    } else if (clean.includes('492') || clean.includes('bistro') || clean.includes('bella') || clean.includes('restaurant')) {
      name = 'Bella Vista Bistro & Restaurant';
      transcript = "Buongiorno! Bella Vista Bistro & Restaurant. Our kitchen is currently serving hot meals. Come by the east plaza terrace to enjoy our wood-fired ribeye and pasta specials!";
    } else if (clean.includes('902') || clean.includes('elena')) {
      name = 'Elena Vance (Roommate)';
      transcript = "Hey! Great to hear from you! Make sure you don't skip your 3 daily meals and drink water regularly so you don't get dehydrated in the city heat!";
    } else if (clean.includes('304') || clean.includes('dave') || clean.includes('landlord')) {
      name = 'Dave Henderson (Landlord)';
      transcript = "Hey! Dave here. Remember to head back to your apartment bed to sleep whenever your fatigue gets low. Rest keeps your health at 100%.";
    } else if (clean.includes('911') || clean.includes('emergency')) {
      name = 'City 911 Emergency EMS Dispatch';
      transcript = "911 Dispatch: If your vitals are critical from starvation or dehydration, immediately consume food, hydrate at the public fountain, or rest in bed!";
    }

    setActiveCall({ name, number: target, transcript, seconds: 0 });
  };

  const handleEndCall = () => {
    sounds.playNotification();
    setActiveCall(null);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSmsText.trim() || !activeThread) return;
    sounds.playNotification();
    const reply: SmsMessage = {
      id: `sms_${Date.now()}`,
      senderName: characterName,
      senderPhone: simProfile?.phoneNumber || 'Me',
      body: newSmsText.trim(),
      timestamp: 'Just now',
      isRead: true,
      avatarBg: 'bg-indigo-600',
    };
    setMessages((prev) => [reply, ...prev]);
    setNewSmsText('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        title="Open Smartphone (Press M or Tab)"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-slate-900/90 text-emerald-400 border border-emerald-500/40 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
      >
        <Smartphone className="w-6 h-6 animate-pulse" />
        <span className="text-xs font-bold text-white group-hover:inline-block hidden transition-all">
          NovaPhone Pro
        </span>
        {afflictions.length > 0 ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-bounce">
            {afflictions.length} Alert
          </span>
        ) : bankAccount ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
            ${bankAccount.balance.toFixed(0)}
          </span>
        ) : null}
      </button>
    );
  }

  // Format time for status bar
  const hourInt = Math.floor(gameHour) % 24;
  const minuteInt = Math.floor((gameHour % 1) * 60);
  const timeString = `${hourInt % 12 === 0 ? 12 : hourInt % 12}:${minuteInt.toString().padStart(2, '0')} ${hourInt >= 12 ? 'PM' : 'AM'}`;

  return (
    <div className="fixed top-3 bottom-3 right-3 z-40 w-[380px] max-w-[95vw] flex flex-col transition-all duration-300">
      {/* Smartphone Outer Body */}
      <div className="relative flex-1 flex flex-col bg-slate-950 rounded-[44px] border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Dynamic Island Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-3 py-1 bg-black rounded-full w-36 h-6 shadow-inner border border-slate-800/60">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
            {simProfile?.isActivated ? '5G Nova' : 'No SIM'}
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-950/80" />
        </div>

        {/* Status Bar */}
        <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[11px] text-slate-300 font-medium z-40 select-none bg-slate-950/80 backdrop-blur-md">
          <span>{timeString}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-tight text-slate-400">
              {simProfile?.isActivated ? '5G' : 'SOS'}
            </span>
            <Signal className={`w-3.5 h-3.5 ${simProfile?.isActivated ? 'text-emerald-400' : 'text-rose-400'}`} />
            <Wifi className="w-3.5 h-3.5 text-white" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">98%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <button
              onClick={onToggle}
              className="ml-1 p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Minimize Phone"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 overflow-y-auto px-4 pb-16 pt-2 text-white scrollbar-thin scrollbar-thumb-slate-800">
          {/* ======================================================== */}
          {/* 1. HOMESCREEN (WITH DIALER, MESSAGE, BODY VITALS, BANK)   */}
          {/* ======================================================== */}
          {currentScreen === 'homescreen' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Homescreen Clock & Weather Widget */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-slate-800/80 shadow-lg text-center space-y-1">
                <div className="text-3xl font-black font-mono tracking-tight text-white">
                  {timeString}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Day {gameDay} • City of Metropolis
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-emerald-400 font-semibold mt-1">
                  <Sparkles className="w-3 h-3" /> NovaOS 18 Live
                </div>
              </div>

              {/* Physical Symptoms Warning Banner (if any) */}
              {afflictions.length > 0 && (
                <div
                  onClick={() => setCurrentScreen('vitals')}
                  className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between cursor-pointer hover:bg-rose-500/25 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                    <div>
                      <div className="font-bold text-white text-[11px]">{afflictions[0].title}</div>
                      <div className="text-[10px] text-rose-300">Tap to diagnose in Body Vitals app</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </div>
              )}

              {/* Core App Grid: Dialer, Message, Body Vitals, Bank */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
                  Installed Applications
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {/* APP 1: METROPOLIS BANK */}
                  <button
                    onClick={() => setCurrentScreen('bank')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-amber-400">
                        <Building2 className="w-7 h-7" />
                      </div>
                      {bankAccount && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-tight text-center">
                      Metro Bank
                    </span>
                  </button>

                  {/* APP 2: BODY VITALS APP (ONLY PLACE VITALS SHOW!) */}
                  <button
                    onClick={() => setCurrentScreen('vitals')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-600 to-rose-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-rose-400">
                        <Heart className="w-7 h-7 fill-rose-500" />
                      </div>
                      {afflictions.length > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[9px] font-black border border-slate-950 animate-bounce">
                          !
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-tight text-center">
                      Body Vitals
                    </span>
                  </button>

                  {/* APP 3: MESSAGES APP */}
                  <button
                    onClick={() => setCurrentScreen('messages')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-emerald-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-emerald-400">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border border-slate-950">
                        2
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-tight text-center">
                      Messages
                    </span>
                  </button>

                  {/* APP 4: DIALER / PHONE APP */}
                  <button
                    onClick={() => setCurrentScreen('phone')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-blue-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-blue-400">
                        <Phone className="w-7 h-7" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-tight text-center">
                      Phone
                    </span>
                  </button>
                </div>

                {/* Secondary Row: Restaurant & Food Delivery */}
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <button
                    onClick={() => setCurrentScreen('bistro')}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-red-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-amber-400">
                        <Utensils className="w-7 h-7" />
                      </div>
                      <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] border border-slate-950">
                        Eats
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-tight text-center">
                      Bistro Eats
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Glance Widget: Metro Bank Balance & Health */}
              <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Metropolis Bank</span>
                  </div>
                  <button
                    onClick={() => setCurrentScreen('bank')}
                    className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Open &rarr;
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Available Checking</div>
                    <div className="text-xl font-black font-mono text-white">
                      {bankAccount ? `$${bankAccount.balance.toFixed(2)}` : '$0.00 (Unopened)'}
                    </div>
                  </div>
                  {bankAccount && (
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {bankAccount.customerId}
                    </span>
                  )}
                </div>
              </div>

              {/* Body Vitals Widget Preview */}
              <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span className="text-xs font-bold text-white">LifeFit Body Vitals</span>
                  </div>
                  <button
                    onClick={() => setCurrentScreen('vitals')}
                    className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                  >
                    Open App &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[9px] text-slate-400">Health</div>
                    <div className="text-xs font-bold text-rose-400">{Math.round(vitals.health)}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[9px] text-slate-400">Hunger</div>
                    <div className="text-xs font-bold text-amber-400">{Math.round(vitals.hunger)}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[9px] text-slate-400">Water</div>
                    <div className="text-xs font-bold text-cyan-400">{Math.round(vitals.hydration)}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[9px] text-slate-400">Energy</div>
                    <div className="text-xs font-bold text-indigo-400">{Math.round(vitals.fatigue)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. BODY VITALS APP (THE ONLY PLACE VITALS ARE SHOWN)     */}
          {/* ======================================================== */}
          {currentScreen === 'vitals' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* App Header with Back to Homescreen */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  onClick={() => setCurrentScreen('homescreen')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-4 h-4" /> Home
                </button>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> LifeFit BioHealth
                </div>
                <span className="w-10" />
              </div>

              {/* Physical Afflictions & Medical Diagnosis */}
              {afflictions.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 animate-pulse" /> Active Medical Symptoms
                  </div>
                  {afflictions.map((aff) => (
                    <div
                      key={aff.id}
                      className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                        <span>{aff.title}</span>
                        <span className="uppercase text-[9px] px-2 py-0.5 rounded-full bg-rose-500/30">
                          {aff.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        {aff.impactDescription}
                      </p>
                      <div className="text-[10px] text-amber-300 font-semibold pt-1">
                        💊 <strong>Treatment:</strong> {aff.cureRecommendation}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No physical afflictions detected. Nutrition & hydration levels stable!</span>
                </div>
              )}

              {/* Physical Health Meter */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-500" /> Overall Physical Health
                  </span>
                  <span className="font-mono font-bold text-rose-400">{Math.round(vitals.health)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                    style={{ width: `${vitals.health}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1">
                    <span>Heart Rate:</span>
                    <strong className={`font-mono flex items-center gap-1 ${vitals.hunger < 20 || vitals.hydration < 20 || vitals.health < 30 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline animate-ping" />
                      {vitals.health < 25 || vitals.hunger < 15 || vitals.hydration < 15 ? 128 : vitals.fatigue < 25 ? 96 : 72} BPM
                    </strong>
                  </span>
                  <span>Status: <strong className={vitals.health > 70 ? 'text-emerald-400' : vitals.health > 35 ? 'text-amber-400' : 'text-rose-400 animate-pulse'}>{vitals.health > 70 ? 'Optimal' : vitals.health > 35 ? 'Compromised' : 'Critical'}</strong></span>
                </div>
              </div>

              {/* 3-Meals a Day Tracker */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-400" /> Hunger & 3 Daily Meals
                  </span>
                  <span className="font-mono font-bold text-amber-400">{Math.round(vitals.hunger)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${vitals.hunger}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className={`p-2.5 rounded-2xl border ${Math.floor(gameHour) >= 7 && Math.floor(gameHour) <= 10 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="text-base mb-0.5">🥣</div>
                    <div className="text-[10px] font-bold">Breakfast</div>
                    <div className="text-[9px] opacity-75">7 - 10 AM</div>
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${Math.floor(gameHour) >= 12 && Math.floor(gameHour) <= 15 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="text-base mb-0.5">🥪</div>
                    <div className="text-[10px] font-bold">Lunch</div>
                    <div className="text-[9px] opacity-75">12 - 3 PM</div>
                  </div>
                  <div className={`p-2.5 rounded-2xl border ${Math.floor(gameHour) >= 18 && Math.floor(gameHour) <= 21 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="text-base mb-0.5">🍲</div>
                    <div className="text-[10px] font-bold">Dinner</div>
                    <div className="text-[9px] opacity-75">6 - 9 PM</div>
                  </div>
                </div>

                {onQuickEat && (
                  <button
                    onClick={onQuickEat}
                    className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                  >
                    <Utensils className="w-3.5 h-3.5" /> Eat Food / Meal (+35 Hunger)
                  </button>
                )}
              </div>

              {/* Hydration Tracker */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-400 fill-cyan-400" /> Hydration Monitor
                  </span>
                  <span className="font-mono font-bold text-cyan-400">{Math.round(vitals.hydration)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${vitals.hydration}%` }}
                  />
                </div>
                {onQuickDrink && (
                  <button
                    onClick={onQuickDrink}
                    className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                  >
                    <Droplets className="w-3.5 h-3.5" /> Drink Fresh Water (+45 Hydration)
                  </button>
                )}
              </div>

              {/* Fatigue & Sleep */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-400" /> Fatigue Level
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{Math.round(vitals.fatigue)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${vitals.fatigue}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Head to your Apartment Bed in the city to sleep and recover 100% fatigue.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. METROPOLIS BANK APP                                   */}
          {/* ======================================================== */}
          {currentScreen === 'bank' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Bank Header with Back to Homescreen */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  onClick={() => setCurrentScreen('homescreen')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-4 h-4" /> Home
                </button>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" /> Metropolis Bank
                </div>
                <span className="w-10" />
              </div>

              {/* Bank Sub Navigation Tabs */}
              <div className="flex items-center justify-around bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
                {(['home', 'analytics', 'p2p', 'cards'] as BankSubTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBankSubTab(tab)}
                    className={`flex-1 py-1.5 rounded-xl capitalize font-bold text-[10px] transition-colors cursor-pointer ${
                      bankSubTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'home' ? 'Account' : tab === 'p2p' ? 'Pay P2P' : tab}
                  </button>
                ))}
              </div>

              {/* BANK SUBTAB 1: ACCOUNT DASHBOARD */}
              {bankSubTab === 'home' && (
                <div className="space-y-4">
                  {/* Balance Card */}
                  <div className="relative p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-indigo-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        Checking Account
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {bankAccount ? bankAccount.customerId : 'Unopened'}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        Available Balance
                      </div>
                      <div className="text-3xl font-black text-white tracking-tight mt-0.5 font-mono">
                        {bankAccount ? `$${bankAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                      </div>
                    </div>

                    {bankAccount ? (
                      <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-slate-300 text-[11px]">Active Visa Debit</span>
                        </div>
                        <span className="font-mono text-indigo-300 text-[11px]">
                          •••• {bankAccount.cardNumber.slice(-4)}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Walk to the Bank of Metropolis door to open your account!</span>
                      </div>
                    )}
                  </div>

                  {/* Transactions list */}
                  <div>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-xs font-bold text-slate-300">Transaction History</span>
                      <span className="text-[10px] text-slate-500">{transactions.length} records</span>
                    </div>
                    <div className="space-y-2">
                      {transactions.slice(0, 5).map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-xl ${
                                tx.type === 'credit'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white truncate max-w-[150px]">
                                {tx.description}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {tx.category} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-xs font-bold font-mono ${
                                tx.type === 'credit' ? 'text-emerald-400' : 'text-white'
                              }`}
                            >
                              {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ${tx.balanceAfter.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BANK SUBTAB 2: ANALYTICS WITH CHARTS */}
              {bankSubTab === 'analytics' && (
                <div className="space-y-4">
                  {/* Donut chart */}
                  <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-center">
                    <div className="text-xs font-bold text-slate-300 mb-2">Category Spending Distribution</div>
                    <div className="relative w-40 h-40 mx-auto my-2 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {analytics.totalSpent === 0 ? (
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#334155" strokeWidth="14" />
                        ) : (
                          (() => {
                            let accumulatedPercent = 0;
                            const circumference = 2 * Math.PI * 38;
                            return analytics.categoriesList.map((cat) => {
                              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                              accumulatedPercent += cat.percentage;
                              return (
                                <circle
                                  key={cat.name}
                                  cx="50"
                                  cy="50"
                                  r="38"
                                  fill="transparent"
                                  stroke={cat.color}
                                  strokeWidth={selectedCategory === cat.name ? 18 : 14}
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                  onClick={() => setSelectedCategory(cat.name)}
                                />
                              );
                            });
                          })()
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">Total Spent</span>
                        <span className="text-base font-black font-mono text-white">${analytics.totalSpent.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                      {analytics.categoriesList.map((cat) => (
                        <div key={cat.name} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px]">
                          <span className="font-semibold text-white">{cat.name}:</span>{' '}
                          <span className="font-mono text-slate-300">${cat.amount.toFixed(2)} ({cat.percentage.toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Activity Bar Chart */}
                  <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800">
                    <div className="text-xs font-bold text-white mb-2">Spending Trends</div>
                    <div className="h-24 flex items-end justify-between gap-2 pt-3 px-1 border-b border-slate-800">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'Today'].map((day, idx) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-emerald-400"
                            style={{ height: `${idx === 6 ? Math.min(100, Math.max(30, analytics.totalSpent * 0.7)) : [20, 45, 30, 60, 40, 75][idx]}%` }}
                          />
                          <span className="text-[9px] text-slate-400">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BANK SUBTAB 3: P2P INSTANT TRANSFERS */}
              {bankSubTab === 'p2p' && (
                <div className="space-y-4">
                  {!simProfile?.isActivated ? (
                    <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/40 text-center space-y-2">
                      <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                      <h4 className="text-xs font-bold text-white">SIM Card Required</h4>
                      <p className="text-[11px] text-slate-300">
                        Visit the Nova Telecom booth to activate your mobile number and unlock online P2P transfers.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleTransferSubmit} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Recipient (Phone or Customer ID)
                        </label>
                        <input
                          type="text"
                          required
                          value={recipientInput}
                          onChange={(e) => setRecipientInput(e.target.value)}
                          placeholder="e.g. CUST-8831-29"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Amount ($ USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max={bankAccount ? bankAccount.balance : 0}
                          required
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          Available: ${bankAccount?.balance.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Dinner, rent..."
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>

                      {transferStatus && (
                        <div className={`p-2.5 rounded-xl text-xs ${transferStatus.success ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                          {transferStatus.message}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSending || !bankAccount || bankAccount.balance <= 0}
                        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                      >
                        <Fingerprint className="w-4 h-4" />
                        <span>Authorize Instant Transfer</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* BANK SUBTAB 4: DEBIT CARD CONTROLS */}
              {bankSubTab === 'cards' && (
                <div className="space-y-4">
                  {bankAccount ? (
                    <>
                      <div className="relative p-5 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 text-slate-950 shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>METRO DEBIT</span>
                          <span className="italic">VISA</span>
                        </div>
                        <div className="my-4 font-mono font-black text-base tracking-widest">
                          {showCardNumber ? bankAccount.cardNumber : `•••• •••• •••• ${bankAccount.cardNumber.slice(-4)}`}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>{characterName || bankAccount.cardHolder}</span>
                          <span>EXP: {bankAccount.expiryDate}</span>
                          <span>CVV: {showCardNumber ? bankAccount.cvv : '•••'}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">Reveal Card Details</span>
                          <button
                            onClick={() => setShowCardNumber(!showCardNumber)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          >
                            {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">Card Lock / Freeze</span>
                          <button
                            onClick={() => onToggleCardActive(!bankAccount.isCardActive)}
                            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${bankAccount.isCardActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          >
                            <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${bankAccount.isCardActive ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 rounded-3xl bg-slate-900 text-center text-xs text-slate-400">
                      No card available. Visit Bank of Metropolis to open account!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. PHONE / DIALER APP                                    */}
          {/* ======================================================== */}
          {currentScreen === 'phone' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  onClick={() => setCurrentScreen('homescreen')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-4 h-4" /> Home
                </button>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-blue-400" /> Phone Dialer
                </div>
                <span className="w-10" />
              </div>

              {/* Number Display */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <div className="font-mono text-xl font-bold text-white h-7 tracking-wider">
                  {dialedNumber || 'Enter number'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Line: {simProfile?.phoneNumber || 'No SIM Card'}
                </div>
              </div>

              {activeCall && (
                <div className="p-4 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{activeCall.name}</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-[11px]">
                      00:{String(activeCall.seconds).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeCall.number}
                  </div>

                  {/* Simulated Voice Transcript */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans shadow-inner">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 mb-1 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 animate-pulse" /> Live Voice Transcript
                    </div>
                    &ldquo;{activeCall.transcript}&rdquo;
                  </div>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndCall}
                    className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>End Telephone Call</span>
                  </button>
                </div>
              )}

              {/* Dialer Keypad */}
              <div className="grid grid-cols-3 gap-2 px-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDialNumber(d)}
                    className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-base font-bold font-mono text-white transition-all active:scale-95 cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => handleCall(dialedNumber || 'Emergency Service')}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                >
                  <PhoneCall className="w-6 h-6" />
                </button>
                {dialedNumber && (
                  <button
                    onClick={() => setDialedNumber('')}
                    className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Fast Contacts Directory */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-300 mb-2">Speed Dial Contacts</div>
                <div className="space-y-1.5">
                  {DEFAULT_CONTACTS.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.phoneNumber}</div>
                      </div>
                      <button
                        onClick={() => handleCall(c.name)}
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. MESSAGES / SMS APP                                    */}
          {/* ======================================================== */}
          {currentScreen === 'messages' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  onClick={() => {
                    if (activeThread) setActiveThread(null);
                    else setCurrentScreen('homescreen');
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-4 h-4" /> {activeThread ? 'Inbox' : 'Home'}
                </button>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Messages
                </div>
                <span className="w-10" />
              </div>

              {activeThread ? (
                /* Thread view */
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="font-bold text-white">{activeThread.senderName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{activeThread.senderPhone}</div>
                  </div>

                  <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 min-h-[160px]">
                    <div className="p-3 rounded-2xl bg-slate-900 text-slate-200 text-xs leading-relaxed max-w-[85%]">
                      {activeThread.body}
                      <div className="text-[9px] text-slate-500 mt-1">{activeThread.timestamp}</div>
                    </div>
                  </div>

                  <form onSubmit={handleSendSms} className="flex gap-2">
                    <input
                      type="text"
                      value={newSmsText}
                      onChange={(e) => setNewSmsText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-emerald-500 text-white cursor-pointer active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                /* Inbox list */
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => setActiveThread(msg)}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-full ${msg.avatarBg} text-white font-bold flex items-center justify-center text-xs shrink-0`}>
                        {msg.senderName[0]}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span className="truncate">{msg.senderName}</span>
                          <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. BELLA VISTA BISTRO & TAKEAWAY APP                      */}
          {/* ======================================================== */}
          {currentScreen === 'bistro' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button
                  onClick={() => setCurrentScreen('homescreen')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-4 h-4" /> Home
                </button>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-400" /> Bella Vista Delivery
                </div>
                <span className="w-10" />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                <div className="text-xs font-bold text-amber-300">East Plaza Kitchen • Takeout & Delivery</div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Order meals thrice a day directly to your location using your Metropolis Bank debit card.
                </p>
              </div>

              {/* Quick Menu items list */}
              <div className="space-y-2.5">
                {[
                  {
                    name: 'Tuscan Sunrise Breakfast Platter',
                    price: 16.5,
                    boost: '+55 Food, +25 Energy, +15 Health',
                    icon: '🍳',
                    action: onQuickEat,
                  },
                  {
                    name: 'Wood-Fired Prime Ribeye Steak',
                    price: 32.0,
                    boost: '+85 Food, +35 Energy, +30 Health',
                    icon: '🥩',
                    action: onQuickEat,
                  },
                  {
                    name: 'Restorative Golden Tortellini Broth',
                    price: 14.5,
                    boost: '+50 Food, +55 Water, +40 Health (Cures Illness)',
                    icon: '🍲',
                    action: onQuickEat,
                  },
                  {
                    name: 'San Pellegrino Sparkling Spring Water',
                    price: 5.0,
                    boost: '+65 Water, +15 Health',
                    icon: '💧',
                    action: onQuickDrink,
                  },
                  {
                    name: 'Superberry Coconut Electrolyte Elixir',
                    price: 7.5,
                    boost: '+55 Water, +20 Food, +25 Health',
                    icon: '🫐',
                    action: onQuickDrink,
                  },
                ].map((dish) => (
                  <div
                    key={dish.name}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{dish.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{dish.name}</div>
                          <div className="text-[10px] text-amber-300/90 font-mono font-medium">{dish.boost}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black font-mono text-white">${dish.price.toFixed(2)}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (dish.action) {
                          dish.action();
                          confetti({ particleCount: 35, spread: 50, origin: { y: 0.7, x: 0.8 } });
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Order & Eat with Metro Card
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Hardware Home Bar (Tapping returns to Homescreen) */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-950 border-t border-slate-800/80 flex items-center justify-center z-50">
          <button
            onClick={() => setCurrentScreen('homescreen')}
            title="Return to Homescreen"
            className="w-32 h-1.5 rounded-full bg-slate-600 hover:bg-white active:scale-95 transition-all cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
