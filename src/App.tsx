import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  User,
  fbSignOut
} from './firebase';
import {
  Vitals,
  WeatherType,
  QuestStage,
  BankAccountData,
  SimProfileData,
  TransactionData,
  InteractiveZone,
  InventoryItem,
  CharacterGender,
  PhysicalAffliction,
  SmsMessage
} from './types/game';
import { AuthScreen } from './components/AuthScreen';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MobileApp, DEFAULT_SMS } from './components/MobileApp';
import { InteractionModal } from './components/InteractionModal';
import { sounds } from './utils/audio';
import { LogOut, Volume2, VolumeX, Smartphone, Heart, CreditCard, DollarSign, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Character Persona (Male / Female)
  const [gender, setGender] = useState<CharacterGender | null>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  // Simulation Clock & Weather
  const [gameHour, setGameHour] = useState(9.5); // 9:30 AM
  const [gameDay, setGameDay] = useState(1);
  const [weather, setWeather] = useState<WeatherType>('sunny');

  // Survival Vitals
  const [vitals, setVitals] = useState<Vitals>({
    hunger: 75,
    hydration: 80,
    fatigue: 85,
    health: 95,
    stamina: 100,
    weightKg: 70, // 70kg baseline normal athletic weight
    stomachFullness: 75,
  });
  const [cashOnHand, setCashOnHand] = useState(50.0);
  const [isVitalsMinimized, setIsVitalsMinimized] = useState(false);
  const [isVomiting, setIsVomiting] = useState(false);
  const [vomitAlert, setVomitAlert] = useState<string | null>(null);

  // Quest Progression
  const [questStage, setQuestStage] = useState<QuestStage>('GO_TO_BANK');

  // Banking & Telecom State
  const [bankAccount, setBankAccount] = useState<BankAccountData | null>(null);
  const [simProfile, setSimProfile] = useState<SimProfileData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  // UI state
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [modalZone, setModalZone] = useState<InteractiveZone | null>(null);
  const [nearestZoneDistance, setNearestZoneDistance] = useState<number | null>(null);
  const [nearestZoneName, setNearestZoneName] = useState<string | null>(null);
  const [clinicAlert, setClinicAlert] = useState<string | null>(null);

  // SMS & Real-time Debit Alerts
  const [messages, setMessages] = useState<SmsMessage[]>(DEFAULT_SMS);
  const [debitNotification, setDebitNotification] = useState<{
    id: string;
    amount: number;
    merchant: string;
    balanceAfter: number;
    type: 'debit' | 'credit';
  } | null>(null);

  // Real-time Debit Notification & Bank SMS Dispatcher
  const triggerDebitAlert = (amount: number, merchant: string, newBalance: number) => {
    setDebitNotification({
      id: `deb_${Date.now()}`,
      amount,
      merchant,
      balanceAfter: newBalance,
      type: 'debit',
    });
    sounds.playNotification();

    const hourInt = Math.floor(gameHour) % 24;
    const minuteInt = Math.floor((gameHour % 1) * 60);
    const isPm = hourInt >= 12;
    const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
    const timeStr = `${displayHour.toString().padStart(2, '0')}:${minuteInt.toString().padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;

    const cardLast4 = bankAccount?.cardNumber ? bankAccount.cardNumber.slice(-4) : '4821';
    const debitSms: SmsMessage = {
      id: `sms_debit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      senderName: 'Bank of Metropolis',
      senderPhone: '4091-METRO',
      body: `Debit Alert: $${amount.toFixed(2)} charged to Visa Card ending in ${cardLast4} at ${merchant} (Day ${gameDay}, ${timeStr}). Available Balance: $${newBalance.toFixed(2)}.`,
      timestamp: `Day ${gameDay}, ${timeStr}`,
      isRead: false,
      avatarBg: 'bg-amber-500',
    };

    setMessages((prev) => [debitSms, ...prev]);

    setTimeout(() => {
      setDebitNotification((current) => (current?.amount === amount ? null : current));
    }, 4500);
  };

  // Real-time Credit Notification & Bank SMS Dispatcher
  const triggerCreditAlert = (amount: number, source: string, newBalance: number) => {
    setDebitNotification({
      id: `crd_${Date.now()}`,
      amount,
      merchant: source,
      balanceAfter: newBalance,
      type: 'credit',
    });
    sounds.playCashChime();

    const hourInt = Math.floor(gameHour) % 24;
    const minuteInt = Math.floor((gameHour % 1) * 60);
    const isPm = hourInt >= 12;
    const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
    const timeStr = `${displayHour.toString().padStart(2, '0')}:${minuteInt.toString().padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;

    const creditSms: SmsMessage = {
      id: `sms_credit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      senderName: 'Bank of Metropolis',
      senderPhone: '4091-METRO',
      body: `Credit Alert: $${amount.toFixed(2)} credited to your checking account from ${source} (Day ${gameDay}, ${timeStr}). Available Balance: $${newBalance.toFixed(2)}.`,
      timestamp: `Day ${gameDay}, ${timeStr}`,
      isRead: false,
      avatarBg: 'bg-emerald-500',
    };

    setMessages((prev) => [creditSms, ...prev]);

    setTimeout(() => {
      setDebitNotification((current) => (current?.amount === amount ? null : current));
    }, 4500);
  };

  // Real-time calculation of physical problems from vitals
  const afflictions = useMemo<PhysicalAffliction[]>(() => {
    const list: PhysicalAffliction[] = [];

    // 1. Starvation / Hunger
    if (vitals.hunger <= 10) {
      list.push({
        id: 'severe_starvation',
        title: 'Critical Starvation & Hypoglycemia',
        severity: 'critical',
        impactDescription: 'Severe stomach cramping, dizziness, walk speed reduced by 50%. Rapid health decay!',
        cureRecommendation: 'Dine at Bella Vista Bistro immediately or order a hot meal.',
      });
    } else if (vitals.hunger <= 25) {
      list.push({
        id: 'severe_starvation',
        title: 'Severe Hunger & Low Blood Sugar',
        severity: 'severe',
        impactDescription: 'Stomach cramping and weak stamina. Movement speed slowed.',
        cureRecommendation: 'Eat breakfast, lunch, or dinner at the restaurant or market.',
      });
    }

    // 2. Dehydration
    if (vitals.hydration <= 10) {
      list.push({
        id: 'severe_dehydration',
        title: 'Critical Dehydration & Organ Strain',
        severity: 'critical',
        impactDescription: 'Extreme thirst, blurred vision, sprint disabled, losing health!',
        cureRecommendation: 'Drink mineral water or drink freely from the Central Water Fountain.',
      });
    } else if (vitals.hydration <= 25) {
      list.push({
        id: 'severe_dehydration',
        title: 'Acute Dehydration & Fatigue',
        severity: 'severe',
        impactDescription: 'Dry throat, sluggish movement, inability to sustain sprint.',
        cureRecommendation: 'Drink fresh water from the public fountain or buy drinks.',
      });
    }

    // 3. Sleep / Fatigue
    if (vitals.fatigue <= 10) {
      list.push({
        id: 'critical_exhaustion',
        title: 'Extreme Sleep Deprivation & Delirium',
        severity: 'critical',
        impactDescription: 'Heavy drooping eyelids, stumbling gait, micro-sleep episodes.',
        cureRecommendation: 'Head to your apartment bedroom and sleep for 6-8 hours.',
      });
    } else if (vitals.fatigue <= 20) {
      list.push({
        id: 'critical_exhaustion',
        title: 'Severe Physical Exhaustion',
        severity: 'moderate',
        impactDescription: 'Muscular fatigue. Walk speed slowed.',
        cureRecommendation: 'Rest in apartment bed or have an espresso roast.',
      });
    }

    // 4. Critical Health
    if (vitals.health <= 20) {
      list.push({
        id: 'muscle_cramps',
        title: 'Near Physical Collapse',
        severity: 'critical',
        impactDescription: 'Vital signs dangerously low! Fainting imminent if neglected.',
        cureRecommendation: 'Consume hot soup, hydrate, and sleep immediately.',
      });
    }

    // 5. Malnutrition & Lean Gaunt Physique
    if (vitals.weightKg < 56 || vitals.hunger < 25) {
      list.push({
        id: 'severe_malnutrition_lean',
        title: 'Gaunt / Emaciated Lean Physique',
        severity: 'severe',
        impactDescription: 'Character is visibly skinny and lean due to inadequate food intake. Low physical mass.',
        cureRecommendation: 'Dine thrice a day at Bella Vista Bistro to rebuild healthy body weight and muscle.',
      });
    }

    // 6. Overeating / Vomiting
    if (isVomiting || (vitals.stomachFullness && vitals.stomachFullness > 100)) {
      list.push({
        id: 'overeating_vomit',
        title: isVomiting ? 'Active Vomiting Episode' : 'Overstuffed Stomach & Nausea',
        severity: isVomiting ? 'critical' : 'severe',
        impactDescription: isVomiting
          ? 'Violently retching and vomiting from eating too much food! Rapid dehydration and exhaustion.'
          : 'Stomach is at maximum capacity (>100%). Any more food will cause you to vomit!',
        cureRecommendation: 'Stop eating immediately. Sip cool water once nausea subsides.',
      });
    }

    return list;
  }, [vitals, isVomiting]);

  // 1. Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Load and Sync Firestore Data when User is Authenticated
  useEffect(() => {
    if (!user) {
      setBankAccount(null);
      setSimProfile(null);
      setTransactions([]);
      setGender(null);
      setShowCharacterSelect(false);
      return;
    }

    const uid = user.uid;

    // A. Sync User Profile Document
    const userDocPath = `users/${uid}`;
    const userRef = doc(db, 'users', uid);

    getDoc(userRef)
      .then(async (snap) => {
        if (!snap.exists()) {
          setShowCharacterSelect(true);
          const initialProfile = {
            uid,
            displayName: user.displayName || 'Player',
            email: user.email || '',
            gender: 'male',
            hunger: 75,
            hydration: 80,
            fatigue: 85,
            health: 95,
            cashOnHand: 50.0,
            questStage: 'GO_TO_BANK',
            gameDay: 1,
            gameHour: 9.5,
            weather: 'sunny',
            updatedAt: new Date().toISOString(),
          };
          try {
            await setDoc(userRef, initialProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, userDocPath);
          }
        } else {
          const data = snap.data();
          if (data) {
            if (data.gender) {
              setGender(data.gender as CharacterGender);
            } else {
              setShowCharacterSelect(true);
            }
            if (data.questStage) setQuestStage(data.questStage as QuestStage);
            if (data.gameDay) setGameDay(data.gameDay);
            if (data.cashOnHand !== undefined) setCashOnHand(data.cashOnHand);
          }
        }
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.GET, userDocPath);
      });

    // B. Real-time Bank Account Listener
    const bankDocPath = `users/${uid}/bankAccounts/main`;
    const bankUnsub = onSnapshot(
      doc(db, 'users', uid, 'bankAccounts', 'main'),
      (snap) => {
        if (snap.exists()) {
          const bData = snap.data() as BankAccountData;
          setBankAccount(bData);
          setQuestStage((prev) => (prev === 'GO_TO_BANK' ? 'ACTIVATE_SIM' : prev));
        } else {
          setBankAccount(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, bankDocPath);
      }
    );

    // C. Real-time SIM Profile Listener
    const simDocPath = `users/${uid}/simProfiles/main`;
    const simUnsub = onSnapshot(
      doc(db, 'users', uid, 'simProfiles', 'main'),
      (snap) => {
        if (snap.exists()) {
          const sData = snap.data() as SimProfileData;
          setSimProfile(sData);
          if (sData.isActivated) {
            setQuestStage((prev) =>
              prev === 'ACTIVATE_SIM' ? 'SEND_FIRST_TRANSFER' : prev
            );
          }
        } else {
          setSimProfile(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, simDocPath);
      }
    );

    // D. Real-time Transactions Listener
    const txColPath = `users/${uid}/transactions`;
    const txQuery = query(collection(db, 'users', uid, 'transactions'), orderBy('timestamp', 'desc'));
    const txUnsub = onSnapshot(
      txQuery,
      (snap) => {
        const list: TransactionData[] = [];
        snap.forEach((docItem) => {
          list.push({ id: docItem.id, ...(docItem.data() as Omit<TransactionData, 'id'>) });
        });
        setTransactions(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, txColPath);
      }
    );

    return () => {
      bankUnsub();
      simUnsub();
      txUnsub();
    };
  }, [user]);

  // Handle Character Gender selection
  const handleSelectGender = async (selectedGender: CharacterGender, customName: string) => {
    setGender(selectedGender);
    setShowCharacterSelect(false);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          gender: selectedGender,
          displayName: customName,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to update gender:', err);
      }
    }
  };

  // 3. Real-life Character Simulation Clock & Needs Loop
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Advance game clock: 1 real second = 0.5 game minutes
      setGameHour((prevHour) => {
        let nextHour = prevHour + 0.05;
        if (nextHour >= 24) {
          nextHour = 0;
          setGameDay((d) => d + 1);
        }
        return nextHour;
      });

      // Deplete biological vitals realistically
      setVitals((prev) => {
        // Hydration depletion: higher when weather is sunny/hot midday
        let hydrationRate = 0.12;
        if (weather === 'sunny') hydrationRate *= 1.4;
        const newHydration = Math.max(0, prev.hydration - hydrationRate);

        // Hunger depletion: 3 meals a day cycle
        const newHunger = Math.max(0, prev.hunger - 0.09);

        // Fatigue accumulation: faster during rain or low stamina
        let fatigueRate = 0.07;
        if (weather === 'rainy' || weather === 'stormy') fatigueRate *= 1.3;
        const newFatigue = Math.max(0, prev.fatigue - fatigueRate);

        // Health impact: physical consequences of neglected vitals!
        let healthDelta = 0;
        if (newHunger <= 20) {
          healthDelta -= 0.35; // Severe starvation damage
        }
        if (newHydration <= 20) {
          healthDelta -= 0.45; // Dehydration organ stress damage
        }
        if (newFatigue <= 10) {
          healthDelta -= 0.25; // Sleep deprivation damage
        }
        if (newHunger > 50 && newHydration > 50 && newFatigue > 50 && prev.health < 100) {
          healthDelta += 0.2; // Natural regeneration
        }
        let newHealth = Math.min(100, Math.max(0, prev.health + healthDelta));

        // Dynamic Weight & Leanness Simulation:
        // If hunger is low (< 35) or starved, body burns reserves and becomes lean & gaunt!
        let weightDelta = 0;
        if (newHunger < 20) {
          weightDelta = -0.06; // Rapid loss of weight & muscle mass
        } else if (newHunger < 40) {
          weightDelta = -0.02; // Becoming lean from not eating properly
        } else if (newHunger >= 60 && newHunger <= 85) {
          // Normalize towards healthy athletic weight 70kg
          if ((prev.weightKg || 70) < 70) weightDelta = 0.02;
          else if ((prev.weightKg || 70) > 72) weightDelta = -0.01;
        } else if (newHunger > 90) {
          weightDelta = 0.03; // Gaining weight when consistently overfed
        }
        const currentW = prev.weightKg !== undefined ? prev.weightKg : 70;
        const newWeight = Math.min(88, Math.max(48, currentW + weightDelta));

        // Digestion of stomach fullness towards hunger
        const currentFullness = prev.stomachFullness !== undefined ? prev.stomachFullness : prev.hunger;
        const newFullness = Math.max(0, currentFullness - 0.12);

        // Critical Collapse: If health reaches 0, trigger clinic emergency resuscitation
        if (newHealth <= 0) {
          sounds.playNotification();
          setClinicAlert(
            "🚑 Emergency Medical Resuscitation: You collapsed due to acute starvation and dehydration! Metropolis Emergency Medics transported you to Central Clinic and administered emergency IV fluids. Please remember to dine at the restaurant or market, hydrate regularly, and get adequate sleep!"
          );
          setCashOnHand((c) => Math.max(0, c - 25)); // Emergency clinic fee
          return {
            hunger: 50,
            hydration: 55,
            fatigue: 60,
            health: 65,
            stamina: 80,
            weightKg: Math.max(55, currentW),
            stomachFullness: 50,
          };
        }

        // Stamina auto-recharge
        const newStamina = Math.min(100, prev.stamina + 1.2);

        return {
          hunger: newHunger,
          hydration: newHydration,
          fatigue: newFatigue,
          health: newHealth,
          stamina: newStamina,
          weightKg: newWeight,
          stomachFullness: newFullness,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, weather]);

  // Global Keyboard shortcuts (M to toggle phone, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setIsPhoneOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setModalZone(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 4. ACTION: Open Bank Account at Bank of Metropolis
  const handleCreateBankAccount = async (theme: 'gold' | 'black' | 'neon' | 'blue') => {
    if (!user) return;
    const uid = user.uid;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const customerId = `CUST-${randomSuffix}-${Math.floor(10 + Math.random() * 89)}`;
    const accountNumber = `4091-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cardNumber = `4532${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;

    const newAccount: BankAccountData = {
      userId: uid,
      customerId,
      accountNumber,
      balance: 1500.0, // Initial balance grant as requested!
      cardNumber,
      cardHolder: user.displayName || 'Citizen',
      expiryDate: '09/29',
      cvv: `${Math.floor(100 + Math.random() * 899)}`,
      isCardActive: true,
      themeColor: theme,
      createdAt: new Date().toISOString(),
    };

    const initialTx: Omit<TransactionData, 'id'> = {
      userId: uid,
      amount: 1500.0,
      type: 'credit',
      category: 'Banking',
      description: 'Initial Citizen Grant & Account Opening Bonus',
      timestamp: new Date().toISOString(),
      balanceAfter: 1500.0,
    };

    const bankDocPath = `users/${uid}/bankAccounts/main`;
    try {
      await setDoc(doc(db, 'users', uid, 'bankAccounts', 'main'), newAccount);
      const txRef = doc(collection(db, 'users', uid, 'transactions'));
      await setDoc(txRef, initialTx);

      await updateDoc(doc(db, 'users', uid), {
        questStage: 'ACTIVATE_SIM',
      });
      setQuestStage('ACTIVATE_SIM');
      sounds.playCashChime();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, bankDocPath);
    }
  };

  // 5. ACTION: Activate SIM Card at Nova Telecom
  const handleActivateSim = async (phoneNumber: string) => {
    if (!user) return;
    const uid = user.uid;

    const newSim: SimProfileData = {
      userId: uid,
      phoneNumber,
      carrier: 'Nova Mobile 5G',
      isActivated: true,
      dataBalanceGb: 50,
      activatedAt: new Date().toISOString(),
    };

    const simDocPath = `users/${uid}/simProfiles/main`;
    try {
      await setDoc(doc(db, 'users', uid, 'simProfiles', 'main'), newSim);
      await updateDoc(doc(db, 'users', uid), {
        questStage: 'SEND_FIRST_TRANSFER',
      });
      setQuestStage('SEND_FIRST_TRANSFER');
      sounds.playNotification();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, simDocPath);
    }
  };

  // 6. ACTION: Peer-to-Peer Instant Transfer
  const handleSendP2P = async (recipient: string, amount: number, note: string): Promise<boolean> => {
    if (!user || !bankAccount || bankAccount.balance < amount || !simProfile?.isActivated) {
      return false;
    }
    const uid = user.uid;
    const newBalance = bankAccount.balance - amount;

    try {
      // 1. Update bank account balance
      await updateDoc(doc(db, 'users', uid, 'bankAccounts', 'main'), {
        balance: newBalance,
      });

      // 2. Add transaction record
      const txRef = doc(collection(db, 'users', uid, 'transactions'));
      await setDoc(txRef, {
        userId: uid,
        amount,
        type: 'debit',
        category: 'Transfer',
        description: `P2P Transfer to ${recipient} (${note})`,
        recipient,
        timestamp: new Date().toISOString(),
        balanceAfter: newBalance,
      });

      // 3. Record in global p2p registry
      const p2pRef = doc(collection(db, 'p2pTransfers'));
      await setDoc(p2pRef, {
        senderId: uid,
        senderName: user.displayName || 'Player',
        recipientTarget: recipient,
        amount,
        note,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });

      if (questStage === 'SEND_FIRST_TRANSFER') {
        await updateDoc(doc(db, 'users', uid), {
          questStage: 'SURVIVE_AND_THRIVE',
        });
        setQuestStage('SURVIVE_AND_THRIVE');
      }

      // Trigger real-time on-screen notification & SMS message as debited!
      triggerDebitAlert(amount, `P2P to ${recipient}`, newBalance);

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/transactions`);
      return false;
    }
  };

  // 7. ACTION: Buy Food / Drink Item at Supermarket or Cafe
  const handleBuyItem = async (
    item: Omit<InventoryItem, 'quantity'>,
    method: 'card' | 'cash'
  ): Promise<boolean> => {
    if (!user) return false;
    const uid = user.uid;

    if (method === 'card') {
      if (!bankAccount || !bankAccount.isCardActive || bankAccount.balance < item.cost) {
        return false;
      }
      const newBalance = bankAccount.balance - item.cost;
      try {
        await updateDoc(doc(db, 'users', uid, 'bankAccounts', 'main'), {
          balance: newBalance,
        });
        const txRef = doc(collection(db, 'users', uid, 'transactions'));
        await setDoc(txRef, {
          userId: uid,
          amount: item.cost,
          type: 'debit',
          category: item.type === 'drink' ? 'Water' : 'Food',
          description: `Store Purchase: ${item.name}`,
          timestamp: new Date().toISOString(),
          balanceAfter: newBalance,
        });

        // Trigger real-time on-screen notification & debited SMS message!
        triggerDebitAlert(item.cost, item.name, newBalance);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/bankAccounts/main`);
        return false;
      }
    } else {
      if (cashOnHand < item.cost) return false;
      setCashOnHand((prev) => prev - item.cost);
      sounds.playNotification();
    }

    // Check for Overeating / Emesis Vomiting
    const isFoodItem = item.type === 'food' || item.hungerValue > 0;
    const currentFullness = vitals.stomachFullness !== undefined ? vitals.stomachFullness : vitals.hunger;
    const willOvereat = isFoodItem && (currentFullness + item.hungerValue > 115 || vitals.hunger >= 96);

    if (willOvereat) {
      // Violent Emesis episode
      setIsVomiting(true);
      sounds.playVomit();
      setVomitAlert(
        "🤢 Emesis / Overeating Warning: You ate too much food! Your stomach was completely overstuffed and rejected the food. Character is violently retching and vomiting. Rehydrate with water immediately!"
      );

      setTimeout(() => {
        setIsVomiting(false);
      }, 5000);

      // Expel stomach contents with harsh dehydration and fatigue penalty
      setVitals((prev) => ({
        ...prev,
        stomachFullness: 15,
        hunger: 25, // expelled food
        hydration: Math.max(10, prev.hydration - 35), // rapid dehydration
        fatigue: Math.max(10, prev.fatigue - 20), // visceral exhaustion
        health: Math.max(15, prev.health - 12),
      }));

      return true;
    }

    // Apply immediate nutritional benefits to vitals
    setVitals((prev) => {
      const nextHunger = Math.min(100, prev.hunger + item.hungerValue);
      const nextHydration = Math.min(100, prev.hydration + item.hydrationValue);
      const nextFatigue = Math.min(100, prev.fatigue + item.energyValue);
      const nextFullness = Math.min(115, (prev.stomachFullness || prev.hunger) + item.hungerValue);

      // Good nutritious eating gradually restores lean gaunt body towards healthy 70kg
      let currentW = prev.weightKg !== undefined ? prev.weightKg : 70;
      if (item.hungerValue > 20 && currentW < 70) {
        currentW = Math.min(70, currentW + 0.6);
      }

      return {
        ...prev,
        hunger: nextHunger,
        hydration: nextHydration,
        fatigue: nextFatigue,
        stomachFullness: nextFullness,
        weightKg: currentW,
        health: Math.min(
          100,
          prev.health +
            (item.healthValue !== undefined
              ? item.healthValue
              : item.hungerValue > 40
              ? 15
              : 5)
        ),
      };
    });

    return true;
  };

  // 8. ACTION: Sleep in Apartment Bed
  const handleSleep = (hours: number) => {
    // Advance simulation time by selected hours
    setGameHour((prev) => {
      let h = prev + hours;
      if (h >= 24) {
        h = h % 24;
        setGameDay((d) => d + 1);
      }
      return h;
    });

    // Fully restore fatigue & heal health
    setVitals((prev) => ({
      ...prev,
      fatigue: 100,
      health: Math.min(100, prev.health + hours * 3),
      hunger: Math.max(15, prev.hunger - hours * 3), // sleeping naturally burns slight hunger
      hydration: Math.max(15, prev.hydration - hours * 3.5),
    }));
  };

  // 9. ACTION: Drink from Public Fountain
  const handleDrinkFountain = () => {
    setVitals((prev) => ({
      ...prev,
      hydration: Math.min(100, prev.hydration + 35),
    }));
  };

  // Quick Consume from HUD
  const handleQuickDrink = () => {
    if (cashOnHand >= 3 || (bankAccount && bankAccount.balance >= 3)) {
      handleBuyItem(
        {
          id: 'quick_water',
          name: 'Spring Water',
          type: 'drink',
          hungerValue: 0,
          hydrationValue: 45,
          energyValue: 5,
          cost: 3.0,
          icon: '💧',
        },
        bankAccount ? 'card' : 'cash'
      );
    } else {
      handleDrinkFountain();
      sounds.playDrink();
    }
  };

  const handleQuickEat = () => {
    if (cashOnHand >= 10 || (bankAccount && bankAccount.balance >= 10)) {
      handleBuyItem(
        {
          id: 'quick_sandwich',
          name: 'Deli Sandwich',
          type: 'food',
          hungerValue: 40,
          hydrationValue: 5,
          energyValue: 15,
          cost: 9.0,
          icon: '🥪',
        },
        bankAccount ? 'card' : 'cash'
      );
    }
  };

  const handleToggleCardActive = async (isActive: boolean) => {
    if (!user || !bankAccount) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'bankAccounts', 'main'), {
        isCardActive: isActive,
      });
      sounds.playNotification();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/bankAccounts/main`);
    }
  };

  // 10. ACTION: Bet in Gambling Studio (Deduct dollars from Account or Cash + trigger debit notification & debited SMS)
  const handleBetGamble = async (
    betAmount: number,
    payMethod: 'card' | 'cash',
    gameName: string
  ): Promise<boolean> => {
    if (!user) return false;
    const uid = user.uid;

    if (payMethod === 'card') {
      if (!bankAccount || !bankAccount.isCardActive || bankAccount.balance < betAmount) {
        return false;
      }
      const newBalance = bankAccount.balance - betAmount;
      try {
        await updateDoc(doc(db, 'users', uid, 'bankAccounts', 'main'), {
          balance: newBalance,
        });

        const txRef = doc(collection(db, 'users', uid, 'transactions'));
        await setDoc(txRef, {
          userId: uid,
          amount: betAmount,
          type: 'debit',
          category: 'Gaming',
          description: `Casino Wager: ${gameName}`,
          timestamp: new Date().toISOString(),
          balanceAfter: newBalance,
        });

        // Show real-time on-screen debit notification and send Bank SMS as debited!
        triggerDebitAlert(betAmount, `Casino: ${gameName}`, newBalance);
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/bankAccounts/main`);
        return false;
      }
    } else {
      if (cashOnHand < betAmount) return false;
      setCashOnHand((prev) => prev - betAmount);
      sounds.playNotification();
      return true;
    }
  };

  // 11. ACTION: Win Cash/Earnings from Gambling Studio (Credit to Account or Wallet + trigger credit notification)
  const handleWinGamble = async (
    winAmount: number,
    payMethod: 'card' | 'cash',
    gameName: string
  ): Promise<void> => {
    if (!user) return;
    const uid = user.uid;

    if (payMethod === 'card' && bankAccount) {
      const newBalance = bankAccount.balance + winAmount;
      try {
        await updateDoc(doc(db, 'users', uid, 'bankAccounts', 'main'), {
          balance: newBalance,
        });

        const txRef = doc(collection(db, 'users', uid, 'transactions'));
        await setDoc(txRef, {
          userId: uid,
          amount: winAmount,
          type: 'credit',
          category: 'Gaming',
          description: `Casino Payout Win: ${gameName}`,
          timestamp: new Date().toISOString(),
          balanceAfter: newBalance,
        });

        triggerCreditAlert(winAmount, `Casino: ${gameName}`, newBalance);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/bankAccounts/main`);
      }
    } else {
      setCashOnHand((prev) => prev + winAmount);
      sounds.playCashChime();
    }
  };

  // Near zone change handler from 3D Canvas
  const handleNearZoneChange = useCallback((zone: InteractiveZone | null, distance: number | null) => {
    setNearestZoneDistance((prev) => (prev === distance ? prev : distance));
    setNearestZoneName((prev) => (prev === (zone ? zone.name : null) ? prev : (zone ? zone.name : null)));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Loading LifeQuest 3D Simulator...
        </p>
      </div>
    );
  }

  // If not signed in with Google, render AuthScreen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas
        gender={gender || 'male'}
        weather={weather}
        vitals={vitals}
        gameHour={gameHour}
        isVomiting={isVomiting}
        onNearZoneChange={handleNearZoneChange}
        onInteract={(zone) => {
          setIsVitalsMinimized(true);
          setModalZone(zone);
        }}
      />

      {/* Heads-Up Display (Vitals show inside Smartphone app only!) */}
      <HUD
        weather={weather}
        gameHour={gameHour}
        gameDay={gameDay}
        questStage={questStage}
        nearestZoneDistance={nearestZoneDistance}
        nearestZoneName={nearestZoneName}
        afflictions={afflictions}
        onTogglePhone={() => setIsPhoneOpen((prev) => !prev)}
        onSetWeather={(w) => setWeather(w)}
      />

      {/* Side Smartphone with Real-time Spending Analytics & P2P Transfers & Body Vitals */}
      <MobileApp
        bankAccount={bankAccount}
        simProfile={simProfile}
        transactions={transactions}
        vitals={vitals}
        gameHour={gameHour}
        gameDay={gameDay}
        afflictions={afflictions}
        messages={messages}
        onSendMessage={(msg) => setMessages((prev) => [msg, ...prev])}
        isOpen={isPhoneOpen}
        onToggle={() => setIsPhoneOpen((prev) => !prev)}
        onSendP2P={handleSendP2P}
        onToggleCardActive={handleToggleCardActive}
        onQuickEat={handleQuickEat}
        onQuickDrink={handleQuickDrink}
        characterName={user.displayName || 'Citizen'}
      />

      {/* Character Gender & Persona Selection Modal */}
      {showCharacterSelect && (
        <CharacterSelectModal
          initialName={user.displayName || 'Citizen'}
          onSelect={handleSelectGender}
        />
      )}

      {/* Interactive Zone Modal (Bank / SIM / Market / Restaurant / Casino / Bed / Fountain) */}
      {modalZone && (
        <InteractionModal
          zone={modalZone}
          onClose={() => setModalZone(null)}
          bankAccount={bankAccount}
          simProfile={simProfile}
          vitals={vitals}
          onCreateBankAccount={handleCreateBankAccount}
          onActivateSim={handleActivateSim}
          onBuyItem={handleBuyItem}
          onSleep={handleSleep}
          onDrinkFountain={handleDrinkFountain}
          onBetGamble={handleBetGamble}
          onWinGamble={handleWinGamble}
          characterName={user.displayName || 'Citizen'}
          cashOnHand={cashOnHand}
        />
      )}

      {/* Real-time Banking Debit / Credit Push Notification Toast */}
      {debitNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-3xl p-4 shadow-2xl text-white backdrop-blur-md flex items-center justify-between gap-3 shadow-amber-500/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner ${
                  debitNotification.type === 'debit'
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                    : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                }`}
              >
                {debitNotification.type === 'debit' ? (
                  <CreditCard className="w-5 h-5 text-amber-400" />
                ) : (
                  <DollarSign className="w-6 h-6 text-emerald-400 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bank of Metropolis
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      debitNotification.type === 'debit'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {debitNotification.type === 'debit' ? 'DEBITED' : 'CREDITED'}
                  </span>
                </div>
                <div className="text-sm font-black text-white mt-0.5 flex items-center gap-2">
                  <span
                    className={
                      debitNotification.type === 'debit'
                        ? 'text-rose-400 font-mono'
                        : 'text-emerald-400 font-mono'
                    }
                  >
                    {debitNotification.type === 'debit' ? '-' : '+'}$
                    {debitNotification.amount.toFixed(2)}
                  </span>
                  <span className="text-slate-300 font-normal text-xs truncate max-w-[170px]">
                    at {debitNotification.merchant}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Avail. Balance: <strong className="text-white font-mono font-bold">${debitNotification.balanceAfter.toFixed(2)}</strong> • SMS Sent 💬
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPhoneOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer shadow transition-all active:scale-95"
              >
                Open SMS &rarr;
              </button>
              <button
                type="button"
                onClick={() => setDebitNotification(null)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Vomiting / Emesis Alert Toast */}
      {vomitAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in slide-in-from-top duration-300">
          <div className="bg-lime-950/95 border-2 border-lime-500 rounded-3xl p-4 shadow-2xl text-white backdrop-blur-md flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center text-xl shrink-0 animate-bounce">
              🤢
            </div>
            <div className="flex-1 text-xs">
              <div className="font-black text-lime-400 text-sm flex items-center justify-between">
                <span>Overeating Emesis Episode</span>
                {isVomiting && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/30 text-lime-300 font-mono animate-pulse">
                    RETCHING NOW
                  </span>
                )}
              </div>
              <p className="text-slate-200 mt-1 leading-snug">
                {vomitAlert}
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => setIsPhoneOpen(true)}
                  className="px-3 py-1 rounded-xl bg-lime-600 hover:bg-lime-500 text-white font-bold text-[11px] cursor-pointer"
                >
                  Check Vitals in Phone &rarr;
                </button>
                <button
                  onClick={() => setVomitAlert(null)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Medical Resuscitation Alert Modal */}
      {clinicAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500 rounded-[32px] p-6 shadow-2xl text-white space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl animate-bounce">
              🚑
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-400">Emergency Clinic Resuscitation</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {clinicAlert}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              Vitals stabilized to 65% Health • Emergency care fee of $25 applied.
            </div>
            <button
              onClick={() => {
                setClinicAlert(null);
                setIsPhoneOpen(true);
              }}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Open Body Vitals in Phone</span>
            </button>
          </div>
        </div>
      )}

      {/* Top-Right Account & Logout Pill */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs text-white flex items-center gap-2 shadow-lg">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {user.displayName ? user.displayName[0] : 'U'}
            </div>
          )}
          <span className="font-semibold max-w-[120px] truncate hidden sm:inline">
            {user.displayName || user.email}
          </span>
          <button
            onClick={() => fbSignOut(auth)}
            title="Sign out of Google Account"
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
