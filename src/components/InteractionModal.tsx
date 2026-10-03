import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BankAccountData,
  SimProfileData,
  InteractiveZone,
  Vitals,
  InventoryItem
} from '../types/game';
import { sounds } from '../utils/audio';
import {
  Building2,
  Smartphone,
  ShoppingBag,
  BedDouble,
  Droplets,
  CreditCard,
  CheckCircle2,
  Utensils,
  Coffee,
  X,
  Sparkles,
  ShieldCheck,
  Moon,
  Clock,
  DollarSign,
  Heart,
  Flame,
  Zap,
  Info,
  Dices,
  Trophy,
  Gamepad2,
  Coins,
  RotateCw,
  Crown
} from 'lucide-react';

interface InteractionModalProps {
  zone: InteractiveZone;
  onClose: () => void;
  bankAccount: BankAccountData | null;
  simProfile: SimProfileData | null;
  vitals: Vitals;
  onCreateBankAccount: (theme: 'gold' | 'black' | 'neon' | 'blue') => Promise<void>;
  onActivateSim: (phoneNumber: string) => Promise<void>;
  onBuyItem: (item: Omit<InventoryItem, 'quantity'>, payMethod: 'card' | 'cash') => Promise<boolean>;
  onSleep: (hours: number) => void;
  onDrinkFountain: () => void;
  onBetGamble?: (betAmount: number, payMethod: 'card' | 'cash', gameName: string) => Promise<boolean>;
  onWinGamble?: (winAmount: number, payMethod: 'card' | 'cash', gameName: string) => Promise<void>;
  characterName: string;
  cashOnHand: number;
}

export interface RestaurantItem extends Omit<InventoryItem, 'quantity'> {
  category: 'breakfast' | 'mains' | 'drinks' | 'desserts';
}

const RESTAURANT_MENU: RestaurantItem[] = [
  // BREAKFAST
  {
    id: 'rest_b1',
    name: 'Tuscan Sunrise Breakfast Platter',
    type: 'food',
    category: 'breakfast',
    hungerValue: 55,
    hydrationValue: 12,
    energyValue: 25,
    healthValue: 15,
    cost: 16.5,
    icon: '🍳',
    badge: "Chef's Morning Special",
    description: 'Poached free-range eggs, applewood bacon, sourdough toast, grilled tomatoes & roasted herb potatoes.',
  },
  {
    id: 'rest_b2',
    name: 'Fluffy Brioche Pancake Stack',
    type: 'food',
    category: 'breakfast',
    hungerValue: 48,
    hydrationValue: 8,
    energyValue: 30,
    healthValue: 10,
    cost: 13.5,
    icon: '🥞',
    badge: 'Sweet & Hearty',
    description: 'Triple-stacked golden pancakes with fresh berries, whipped mascarpone cream & pure maple syrup.',
  },
  {
    id: 'rest_b3',
    name: 'Avocado Tartine & Smoked Salmon',
    type: 'food',
    category: 'breakfast',
    hungerValue: 42,
    hydrationValue: 15,
    energyValue: 22,
    healthValue: 25,
    cost: 15.0,
    icon: '🥑',
    badge: 'Superfood Boost',
    description: 'Seeded artisan toast, crushed Haas avocado, wild smoked salmon, capers, radishes & lemon zest.',
  },

  // MAINS (LUNCH & DINNER)
  {
    id: 'rest_m1',
    name: 'Wood-Fired Prime Ribeye Steak',
    type: 'food',
    category: 'mains',
    hungerValue: 85,
    hydrationValue: 15,
    energyValue: 35,
    healthValue: 30,
    cost: 32.0,
    icon: '🥩',
    badge: 'Signature Dish',
    description: '10oz grilled black angus ribeye in rosemary truffle butter, garlic mashed potatoes & broccolini.',
  },
  {
    id: 'rest_m2',
    name: 'Wild Forest Mushroom Tagliatelle',
    type: 'food',
    category: 'mains',
    hungerValue: 70,
    hydrationValue: 15,
    energyValue: 25,
    healthValue: 20,
    cost: 22.0,
    icon: '🍝',
    badge: 'Handcrafted Pasta',
    description: 'Fresh egg tagliatelle, chanterelle mushrooms, 24-month aged Parmigiano-Reggiano & white truffle oil.',
  },
  {
    id: 'rest_m3',
    name: 'Bella Vista Gourmet Cheeseburger',
    type: 'food',
    category: 'mains',
    hungerValue: 78,
    hydrationValue: 10,
    energyValue: 20,
    healthValue: 12,
    cost: 18.5,
    icon: '🍔',
    badge: 'Crowd Favorite',
    description: 'Double smashed beef patties, cheddar, balsamic onion jam, garlic aioli & rosemary fries.',
  },
  {
    id: 'rest_m4',
    name: 'Pan-Seared Mediterranean Sea Bass',
    type: 'food',
    category: 'mains',
    hungerValue: 65,
    hydrationValue: 20,
    energyValue: 25,
    healthValue: 35,
    cost: 28.0,
    icon: '🐟',
    badge: 'Heart Healthy',
    description: 'Crispy skin sea bass on herb quinoa, grilled asparagus and saffron citrus beurre blanc.',
  },
  {
    id: 'rest_m5',
    name: 'Restorative Golden Tortellini Broth',
    type: 'food',
    category: 'mains',
    hungerValue: 50,
    hydrationValue: 55,
    energyValue: 25,
    healthValue: 40,
    cost: 14.5,
    icon: '🍲',
    badge: 'Cures Sickness & Cramps',
    description: 'Rich slow-simmered chicken broth, ricotta tortellini, mirepoix & fresh herbs. Relieves dehydration & fatigue!',
  },

  // DRINKS & HYDRATION
  {
    id: 'rest_d1',
    name: 'San Pellegrino Sparkling Mineral Water',
    type: 'drink',
    category: 'drinks',
    hungerValue: 0,
    hydrationValue: 65,
    energyValue: 8,
    healthValue: 15,
    cost: 5.0,
    icon: '💧',
    badge: 'Pure Mineral Hydration',
    description: 'Natural Italian carbonated spring water served chilled with fresh lime slices.',
  },
  {
    id: 'rest_d2',
    name: 'Cold-Pressed Valencia Immunity Citrus',
    type: 'drink',
    category: 'drinks',
    hungerValue: 15,
    hydrationValue: 45,
    energyValue: 22,
    healthValue: 25,
    cost: 6.5,
    icon: '🍊',
    badge: 'Vitamin C Punch',
    description: '100% pure cold-pressed Valencia oranges, ruby grapefruit, ginger root & turmeric.',
  },
  {
    id: 'rest_d3',
    name: 'Double Shot Artisan Iced Vanilla Latte',
    type: 'drink',
    category: 'drinks',
    hungerValue: 12,
    hydrationValue: 30,
    energyValue: 45,
    healthValue: 10,
    cost: 6.0,
    icon: '☕',
    badge: 'Energy Boost',
    description: 'Single-origin espresso, steamed organic milk and Madagascar vanilla bean syrup over ice.',
  },
  {
    id: 'rest_d4',
    name: 'Superberry Coconut Electrolyte Elixir',
    type: 'drink',
    category: 'drinks',
    hungerValue: 20,
    hydrationValue: 55,
    energyValue: 30,
    healthValue: 25,
    cost: 7.5,
    icon: '🫐',
    badge: 'Rapid Rehydration',
    description: 'Raw coconut water, acai, wild blueberries, magnesium and Himalayan pink salt.',
  },

  // DESSERTS
  {
    id: 'rest_s1',
    name: 'Traditional Venetian Tiramisu',
    type: 'food',
    category: 'desserts',
    hungerValue: 32,
    hydrationValue: 5,
    energyValue: 25,
    healthValue: 5,
    cost: 9.5,
    icon: '🍰',
    badge: 'Authentic Recipe',
    description: 'Espresso-soaked ladyfingers, velvety mascarpone cream & Dutch dark cocoa.',
  },
  {
    id: 'rest_s2',
    name: 'Warm Belgian Molten Chocolate Cake',
    type: 'food',
    category: 'desserts',
    hungerValue: 38,
    hydrationValue: 5,
    energyValue: 28,
    healthValue: 5,
    cost: 11.0,
    icon: '🍫',
    badge: 'Decadent Indulgence',
    description: 'Dark Valrhona chocolate lava cake with molten center & vanilla bean gelato.',
  },
];

const STORE_ITEMS: Omit<InventoryItem, 'quantity'>[] = [
  {
    id: 'f1',
    name: 'Breakfast Bagel & Eggs',
    type: 'food',
    hungerValue: 35,
    hydrationValue: 5,
    energyValue: 15,
    cost: 9.5,
    icon: '🥯',
  },
  {
    id: 'f2',
    name: 'Fresh Deli Sandwich',
    type: 'food',
    hungerValue: 50,
    hydrationValue: 10,
    energyValue: 20,
    cost: 14.0,
    icon: '🥪',
  },
  {
    id: 'f3',
    name: 'Gourmet Steak & Greens',
    type: 'food',
    hungerValue: 80,
    hydrationValue: 15,
    energyValue: 35,
    cost: 28.0,
    icon: '🥩',
  },
  {
    id: 'w1',
    name: 'Pure Spring Water Bottle',
    type: 'drink',
    hungerValue: 0,
    hydrationValue: 50,
    energyValue: 5,
    cost: 3.5,
    icon: '💧',
  },
  {
    id: 'w2',
    name: 'Electrolyte Energy Drink',
    type: 'drink',
    hungerValue: 5,
    hydrationValue: 40,
    energyValue: 25,
    cost: 5.5,
    icon: '⚡',
  },
  {
    id: 'w3',
    name: 'Hot Espresso Roast',
    type: 'drink',
    hungerValue: 5,
    hydrationValue: 15,
    energyValue: 40,
    cost: 4.5,
    icon: '☕',
  },
];

export interface PlayingCard {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: string;
  value: number;
}

const DECK_SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const DECK_RANKS = [
  { rank: 'A', value: 11 },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 },
];

function drawRandomCard(): PlayingCard {
  const suit = DECK_SUITS[Math.floor(Math.random() * DECK_SUITS.length)];
  const r = DECK_RANKS[Math.floor(Math.random() * DECK_RANKS.length)];
  return { suit, rank: r.rank, value: r.value };
}

function calculateHand(cards: PlayingCard[]): number {
  let sum = cards.reduce((acc, c) => acc + c.value, 0);
  let aces = cards.filter((c) => c.rank === 'A').length;
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces -= 1;
  }
  return sum;
}

export const InteractionModal: React.FC<InteractionModalProps> = ({
  zone,
  onClose,
  bankAccount,
  simProfile,
  vitals,
  onCreateBankAccount,
  onActivateSim,
  onBuyItem,
  onSleep,
  onDrinkFountain,
  onBetGamble,
  onWinGamble,
  characterName,
  cashOnHand,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<'gold' | 'black' | 'neon' | 'blue'>('gold');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sleepHours, setSleepHours] = useState(8);
  const [storeFeedback, setStoreFeedback] = useState<string | null>(null);
  const [restaurantCategory, setRestaurantCategory] = useState<'all' | 'breakfast' | 'mains' | 'drinks' | 'desserts'>('all');

  // Casino State
  const [casinoTab, setCasinoTab] = useState<'slots' | 'blackjack' | 'roulette'>('slots');
  const [casinoBet, setCasinoBet] = useState(25);
  const [casinoPayMethod, setCasinoPayMethod] = useState<'card' | 'cash'>('card');
  const [casinoFeedback, setCasinoFeedback] = useState<string | null>(null);

  // 1. Slots State
  const [slotReels, setSlotReels] = useState<[string, string, string]>(['7️⃣', '💎', '7️⃣']);
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);
  const [lastSlotWin, setLastSlotWin] = useState<number | null>(null);

  // 2. Blackjack State
  const [bjPhase, setBjPhase] = useState<'betting' | 'player' | 'resolved'>('betting');
  const [playerCards, setPlayerCards] = useState<PlayingCard[]>([]);
  const [dealerCards, setDealerCards] = useState<PlayingCard[]>([]);
  const [bjOutcome, setBjOutcome] = useState<string | null>(null);

  // 3. Roulette State
  const [rouletteType, setRouletteType] = useState<'red' | 'black' | 'green' | 'even' | 'odd' | 'single'>('red');
  const [rouletteSingle, setRouletteSingle] = useState(7);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<{ number: number; color: 'red' | 'black' | 'green' } | null>(null);
  const [rouletteWinMessage, setRouletteWinMessage] = useState<string | null>(null);

  // Phone numbers available for SIM
  const [selectedPhone, setSelectedPhone] = useState('+1 (555) 782-3914');

  const handleBankCreate = async () => {
    setIsProcessing(true);
    try {
      await onCreateBankAccount(selectedTheme);
      sounds.playCashChime();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimActivate = async () => {
    setIsProcessing(true);
    try {
      await onActivateSim(selectedPhone);
      sounds.playNotification();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async (item: Omit<InventoryItem, 'quantity'>, method: 'card' | 'cash') => {
    setStoreFeedback(null);
    if (method === 'card' && (!bankAccount || !bankAccount.isCardActive || bankAccount.balance < item.cost)) {
      setStoreFeedback('Card declined. Check balance or active card status.');
      return;
    }
    if (method === 'cash' && cashOnHand < item.cost) {
      setStoreFeedback('Insufficient physical cash in wallet.');
      return;
    }

    const success = await onBuyItem(item, method);
    if (success) {
      if (item.type === 'food') sounds.playEat();
      else sounds.playDrink();
      setStoreFeedback(`Purchased ${item.name}! Replenished your vitals.`);
      setTimeout(() => setStoreFeedback(null), 3500);
    }
  };

  // Casino Gambling Studio Handlers
  const handleSpinSlots = async () => {
    if (isSlotSpinning) return;
    setCasinoFeedback(null);
    setLastSlotWin(null);

    if (!onBetGamble) return;
    const ok = await onBetGamble(casinoBet, casinoPayMethod, 'Lucky 7s Cyber Slots');
    if (!ok) {
      setCasinoFeedback(
        casinoPayMethod === 'card'
          ? 'Card declined or insufficient checking balance for wager.'
          : 'Insufficient cash in wallet for wager.'
      );
      return;
    }

    setIsSlotSpinning(true);
    sounds.playSlotSpin();

    const symbols = ['🍒', '🍋', '💎', '🔔', '⭐', '7️⃣'];
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      setSlotReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      if (ticks >= 14) {
        clearInterval(interval);
        const roll = Math.random();
        let finalReels: [string, string, string];
        let multiplier = 0;

        // Realistic casino house edge: ~28% win rate, 72% house loss rate
        if (roll < 0.012) {
          finalReels = ['7️⃣', '7️⃣', '7️⃣'];
          multiplier = 50; // Mega 50x (~1.2% chance)
        } else if (roll < 0.035) {
          finalReels = ['⭐', '⭐', '⭐'];
          multiplier = 25; // Super 25x (~2.3% chance)
        } else if (roll < 0.075) {
          finalReels = ['🔔', '🔔', '🔔'];
          multiplier = 15; // 15x (~4% chance)
        } else if (roll < 0.135) {
          finalReels = ['💎', '💎', '💎'];
          multiplier = 10; // 10x (~6% chance)
        } else if (roll < 0.205) {
          finalReels = ['🍋', '🍋', '🍋'];
          multiplier = 5; // 5x (~7% chance)
        } else if (roll < 0.285) {
          finalReels = ['🍒', '🍒', symbols[Math.floor(Math.random() * 4) + 1]];
          multiplier = 2.5; // 2.5x (~8% chance)
        } else {
          multiplier = 0;
          // Exciting loss variations (some near-misses)
          if (roll < 0.48) {
            const teaseSym = symbols[Math.floor(Math.random() * symbols.length)];
            const otherSym = symbols.find((s) => s !== teaseSym) || '🍋';
            finalReels = [teaseSym, teaseSym, otherSym];
          } else {
            const r1 = symbols[Math.floor(Math.random() * symbols.length)];
            let r2 = symbols[Math.floor(Math.random() * symbols.length)];
            let r3 = symbols[Math.floor(Math.random() * symbols.length)];
            if (r1 === r2 && r2 === r3) r3 = r1 === '7️⃣' ? '🍋' : '7️⃣';
            finalReels = [r1, r2, r3];
          }
        }

        setSlotReels(finalReels);
        setIsSlotSpinning(false);

        if (multiplier > 0) {
          const payout = casinoBet * multiplier;
          setLastSlotWin(payout);
          setCasinoFeedback(`🎉 JACKPOT WIN! Multiplier ${multiplier}x paid out +$${payout.toFixed(2)}!`);
          confetti({ particleCount: 85, spread: 75, origin: { y: 0.6 } });
          sounds.playWinFanfare();
          sounds.playCashChime();
          if (onWinGamble) onWinGamble(payout, casinoPayMethod, 'Lucky 7s Slots Win');
        } else {
          setCasinoFeedback(`House wins! ${finalReels.join(' ')} • No match. You lost your $${casinoBet.toFixed(2)} wager.`);
          sounds.playNotification();
        }
      }
    }, 80);
  };

  const handleDealBlackjack = async () => {
    if (!onBetGamble) return;
    setCasinoFeedback(null);
    setBjOutcome(null);

    const ok = await onBetGamble(casinoBet, casinoPayMethod, 'Royale Blackjack');
    if (!ok) {
      setCasinoFeedback(
        casinoPayMethod === 'card'
          ? 'Card declined or insufficient balance for wager.'
          : 'Insufficient cash in wallet for wager.'
      );
      return;
    }

    sounds.playNotification();

    const p1 = drawRandomCard();
    const p2 = drawRandomCard();
    const d1 = drawRandomCard();
    const d2 = drawRandomCard();

    setPlayerCards([p1, p2]);
    setDealerCards([d1, d2]);

    const pScore = calculateHand([p1, p2]);
    const dScore = calculateHand([d1, d2]);

    // Check for Dealer Natural Blackjack
    if (dScore === 21) {
      setBjPhase('resolved');
      if (pScore === 21) {
        setBjOutcome(`🤝 BOTH HIT BLACKJACK 21! Push tie. Wager of $${casinoBet.toFixed(2)} refunded.`);
        sounds.playNotification();
        if (onWinGamble) onWinGamble(casinoBet, casinoPayMethod, 'Blackjack Push Refund');
      } else {
        setBjOutcome(`💥 DEALER NATURAL BLACKJACK 21! Dealer holds [${d1.rank}${d1.suit}, ${d2.rank}${d2.suit}]. House takes $${casinoBet.toFixed(2)}.`);
        sounds.playNotification();
      }
      return;
    }

    if (pScore === 21) {
      const payout = casinoBet * 2.5;
      setBjPhase('resolved');
      setBjOutcome(`🔥 NATURAL BLACKJACK 21! Paid 3:2 (+$${payout.toFixed(2)})`);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      sounds.playWinFanfare();
      sounds.playCashChime();
      if (onWinGamble) onWinGamble(payout, casinoPayMethod, 'Blackjack Natural 21');
      return;
    }

    setBjPhase('player');
  };

  const handleBlackjackHit = () => {
    if (bjPhase !== 'player') return;
    const newCard = drawRandomCard();
    const nextPlayer = [...playerCards, newCard];
    setPlayerCards(nextPlayer);
    sounds.playNotification();

    const score = calculateHand(nextPlayer);
    if (score > 21) {
      setBjPhase('resolved');
      setBjOutcome(`💥 BUST! Your score is ${score} (exceeded 21). House takes your $${casinoBet.toFixed(2)} wager.`);
      sounds.playNotification();
    } else if (score === 21) {
      handleBlackjackStand(nextPlayer);
    }
  };

  const handleBlackjackStand = async (overridePlayer?: PlayingCard[]) => {
    setBjPhase('resolved');
    const finalPlayer = overridePlayer || playerCards;
    const pScore = calculateHand(finalPlayer);

    let currentDealer = [...dealerCards];
    while (calculateHand(currentDealer) < 17) {
      currentDealer.push(drawRandomCard());
    }
    setDealerCards(currentDealer);
    const dScore = calculateHand(currentDealer);

    if (dScore > 21) {
      const payout = casinoBet * 2;
      setBjOutcome(`🎉 DEALER BUSTS (${dScore})! You won +$${payout.toFixed(2)}!`);
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      sounds.playWinFanfare();
      sounds.playCashChime();
      if (onWinGamble) onWinGamble(payout, casinoPayMethod, 'Royale Blackjack Win');
    } else if (pScore > dScore) {
      const payout = casinoBet * 2;
      setBjOutcome(`🎉 YOU WIN! Your ${pScore} beats Dealer's ${dScore} (+$${payout.toFixed(2)})!`);
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      sounds.playWinFanfare();
      sounds.playCashChime();
      if (onWinGamble) onWinGamble(payout, casinoPayMethod, 'Royale Blackjack Win');
    } else if (pScore === dScore) {
      setBjOutcome(`🤝 PUSH TIE (${pScore} - ${dScore})! Wager of $${casinoBet.toFixed(2)} refunded.`);
      sounds.playNotification();
      if (onWinGamble) onWinGamble(casinoBet, casinoPayMethod, 'Blackjack Push Refund');
    } else {
      setBjOutcome(`Dealer wins with ${dScore} vs your ${pScore}. The House takes your $${casinoBet.toFixed(2)} wager.`);
      sounds.playNotification();
    }
  };

  const handleSpinRoulette = async () => {
    if (isRouletteSpinning) return;
    setCasinoFeedback(null);
    setRouletteWinMessage(null);

    if (!onBetGamble) return;
    const ok = await onBetGamble(casinoBet, casinoPayMethod, `Neon Roulette (${rouletteType})`);
    if (!ok) {
      setCasinoFeedback(
        casinoPayMethod === 'card'
          ? 'Card declined or insufficient balance for wager.'
          : 'Insufficient cash in wallet for wager.'
      );
      return;
    }

    setIsRouletteSpinning(true);
    sounds.playSlotSpin();

    setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 37);
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const winningColor: 'red' | 'black' | 'green' =
        winningNumber === 0 ? 'green' : redNumbers.includes(winningNumber) ? 'red' : 'black';

      setRouletteResult({ number: winningNumber, color: winningColor });
      setIsRouletteSpinning(false);

      let won = false;
      let multiplier = 0;

      if (rouletteType === 'red' && winningColor === 'red') {
        won = true;
        multiplier = 2;
      } else if (rouletteType === 'black' && winningColor === 'black') {
        won = true;
        multiplier = 2;
      } else if (rouletteType === 'green' && winningNumber === 0) {
        won = true;
        multiplier = 36;
      } else if (rouletteType === 'even' && winningNumber > 0 && winningNumber % 2 === 0) {
        won = true;
        multiplier = 2;
      } else if (rouletteType === 'odd' && winningNumber % 2 === 1) {
        won = true;
        multiplier = 2;
      } else if (rouletteType === 'single' && winningNumber === rouletteSingle) {
        won = true;
        multiplier = 36;
      }

      if (won) {
        const payout = casinoBet * multiplier;
        setRouletteWinMessage(`🎉 ROULETTE HIT! Landed on ${winningNumber} (${winningColor.toUpperCase()})! Payout: +$${payout.toFixed(2)} (${multiplier}x)`);
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        sounds.playWinFanfare();
        sounds.playCashChime();
        if (onWinGamble) onWinGamble(payout, casinoPayMethod, 'Neon Roulette Win');
      } else {
        setRouletteWinMessage(`Wheel stopped on ${winningNumber} (${winningColor.toUpperCase()}). You bet on ${rouletteType.toUpperCase()}. The House takes your $${casinoBet.toFixed(2)} wager.`);
        sounds.playNotification();
      }
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl p-6 sm:p-8 overflow-hidden text-white max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* BANK ACCOUNT OPENING ZONE */}
        {zone.type === 'bank' && (
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  National Financial District
                </div>
                <h2 className="text-2xl font-black text-white mt-1">Bank of Metropolis</h2>
              </div>
            </div>

            {bankAccount ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Account Active & In Good Standing</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Welcome back, <strong>{bankAccount.cardHolder}</strong>! Your Customer ID is{' '}
                  <span className="font-mono text-white bg-slate-900 px-2 py-0.5 rounded-md font-bold">
                    {bankAccount.customerId}
                  </span>
                  . Your current balance is{' '}
                  <strong className="text-emerald-400 font-mono">
                    ${bankAccount.balance.toFixed(2)}
                  </strong>
                  .
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Debit Card: •••• {bankAccount.cardNumber.slice(-4)}</span>
                  <span>Use your side smartphone to view real-time spending charts!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>
                    <strong>Welcome, new citizen!</strong> Open your primary checking account today to unlock your personal debit card and receiving your initial starting funds.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li><strong className="text-emerald-400">Initial Grant:</strong> $1,500.00 USD starting balance.</li>
                    <li><strong className="text-white">Debit Card:</strong> Zero annual fee, contactless Visa pay.</li>
                    <li><strong className="text-indigo-400">Digital Banking:</strong> Synchronized with your in-game smartphone.</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Choose Your Debit Card Design:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(['gold', 'black', 'neon', 'blue'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTheme(t)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          selectedTheme === t
                            ? 'bg-slate-800 border-amber-400 shadow-lg ring-1 ring-amber-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-full h-8 rounded-lg mb-2 shadow-inner ${
                            t === 'gold'
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                              : t === 'black'
                              ? 'bg-gradient-to-r from-slate-900 to-slate-700'
                              : t === 'neon'
                              ? 'bg-gradient-to-r from-emerald-400 to-cyan-500'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          }`}
                        />
                        <span className="text-[11px] font-bold capitalize text-slate-200">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleBankCreate}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Open Account & Claim $1,500.00 Grant</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SIM SERVICE PROVIDER ZONE */}
        {zone.type === 'sim' && (
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                  High-Speed 5G Network
                </div>
                <h2 className="text-2xl font-black text-white mt-1">Nova Telecom SIM Hub</h2>
              </div>
            </div>

            {simProfile?.isActivated ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>5G Line Fully Activated</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your phone number <strong className="text-white font-mono">{simProfile.phoneNumber}</strong> is active with NovaNet 5G. Peer-to-peer bank transfers and instant online billing are unlocked!
                </p>
                <div className="pt-2 text-xs text-slate-400 font-mono">
                  Data: {simProfile.dataBalanceGb} GB • SMS Authentication: Active
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>
                    <strong>Activate your mobile connection:</strong> Unlocks banking SMS security, instant peer-to-peer transfers, and fast 5G data on your side smartphone.
                  </p>
                  <div className="flex items-center gap-2 text-purple-300 font-medium pt-1">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Free citizen starter SIM package with unlimited local transfers.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Choose Your Mobile Number:
                  </label>
                  <div className="space-y-2">
                    {[
                      '+1 (555) 782-3914',
                      '+1 (555) 438-9201',
                      '+1 (555) 619-8802',
                    ].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedPhone(num)}
                        className={`w-full p-3 rounded-2xl border text-left font-mono flex items-center justify-between transition-all cursor-pointer ${
                          selectedPhone === num
                            ? 'bg-slate-800 border-purple-500 shadow-md ring-1 ring-purple-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs">{num}</span>
                        <span className="text-[10px] text-purple-400">Available</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSimActivate}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      <span>Activate SIM & Unlock P2P Banking</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MARKET / FOOD & WATER STORE ZONE */}
        {zone.type === 'market' && (
          <div className="space-y-5 overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Fresh Groceries & Beverages
                </div>
                <h2 className="text-2xl font-black text-white mt-1">Metro Supermarket & Cafe</h2>
              </div>
            </div>

            {/* Current Vitals Snapshot */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around text-xs">
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Hunger</div>
                <div className="font-bold font-mono text-amber-400">{Math.round(vitals.hunger)}%</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Hydration</div>
                <div className="font-bold font-mono text-cyan-400">{Math.round(vitals.hydration)}%</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Debit Balance</div>
                <div className="font-bold font-mono text-emerald-400">${bankAccount?.balance.toFixed(2) || '0.00'}</div>
              </div>
            </div>

            {storeFeedback && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs text-center font-medium">
                {storeFeedback}
              </div>
            )}

            <div className="space-y-2.5">
              {STORE_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        {item.hungerValue > 0 && <span className="text-amber-400">+{item.hungerValue} Food</span>}
                        {item.hydrationValue > 0 && <span className="text-cyan-400">+{item.hydrationValue} Water</span>}
                        {item.energyValue > 0 && <span className="text-violet-400">+{item.energyValue} Energy</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white">${item.cost.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handlePurchase(item, 'card')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Pay Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESTAURANT / BELLA VISTA BISTRO & DINING ZONE */}
        {zone.type === 'restaurant' && (
          <div className="space-y-5 overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Utensils className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  Artisanal Kitchen & Bar
                </div>
                <h2 className="text-2xl font-black text-white mt-0.5">Bella Vista Bistro & Restaurant</h2>
                <p className="text-xs text-slate-400">
                  Dine in for chef-crafted meals thrice a day to nourish your body and maintain peak physical condition.
                </p>
              </div>
            </div>

            {/* Current Vitals Snapshot */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around text-xs">
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Hunger</div>
                <div className={`font-bold font-mono ${vitals.hunger < 25 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                  {Math.round(vitals.hunger)}%
                </div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Hydration</div>
                <div className={`font-bold font-mono ${vitals.hydration < 25 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                  {Math.round(vitals.hydration)}%
                </div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Health</div>
                <div className="font-bold font-mono text-emerald-400">{Math.round(vitals.health)}%</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Card Balance</div>
                <div className="font-bold font-mono text-emerald-400">
                  ${bankAccount ? bankAccount.balance.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-400">Cash Wallet</div>
                <div className="font-bold font-mono text-amber-300">${cashOnHand.toFixed(2)}</div>
              </div>
            </div>

            {storeFeedback && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold animate-in fade-in flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{storeFeedback}</span>
              </div>
            )}

            {/* Menu Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All Menu' },
                { id: 'breakfast', label: '🍳 Breakfast' },
                { id: 'mains', label: '🥩 Chef Mains' },
                { id: 'drinks', label: '🥤 Beverages' },
                { id: 'desserts', label: '🍰 Desserts' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRestaurantCategory(tab.id as typeof restaurantCategory)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    restaurantCategory === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Menu Items List */}
            <div className="space-y-3">
              {RESTAURANT_MENU.filter(
                (item) => restaurantCategory === 'all' || item.category === restaurantCategory
              ).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl shrink-0 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
                        {item.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{item.name}</h4>
                          {item.badge && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-sm text-white">
                        ${item.cost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Nutritional Vitals Recovery Badges */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                      {item.hungerValue > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold">
                          +{item.hungerValue}% Food
                        </span>
                      )}
                      {item.hydrationValue > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold">
                          +{item.hydrationValue}% Water
                        </span>
                      )}
                      {item.energyValue > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold">
                          +{item.energyValue}% Energy
                        </span>
                      )}
                      {(item.healthValue || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 font-bold">
                          +{item.healthValue}% Health
                        </span>
                      )}
                    </div>

                    {/* Payment Buttons: Card or Cash */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePurchase(item, 'card')}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Debit Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePurchase(item, 'cash')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 cursor-pointer active:scale-95"
                      >
                        Cash
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOME / APARTMENT BEDROOM ZONE */}
        {zone.type === 'home' && (
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <BedDouble className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  Personal Residence
                </div>
                <h2 className="text-2xl font-black text-white mt-1">Cozy City Loft Bed</h2>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                Sleep helps your body recover from daily fatigue, restores health, and resets your physical stamina.
              </p>
              <div className="flex items-center gap-3 pt-2 text-slate-400">
                <span>Current Fatigue: <strong className="text-white">{Math.round(vitals.fatigue)}%</strong></span>
                <span>Current Health: <strong className="text-emerald-400">{Math.round(vitals.health)}%</strong></span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Sleep Duration</span>
                <span className="font-mono text-indigo-400">{sleepHours} Hours</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>2h (Power Nap)</span>
                <span>8h (Full Sleep)</span>
                <span>12h (Deep Rest)</span>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playYawnSleep();
                onSleep(sleepHours);
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Moon className="w-5 h-5" />
              <span>Rest & Sleep for {sleepHours} Hours</span>
            </button>
          </div>
        )}

        {/* WATER FOUNTAIN ZONE */}
        {zone.type === 'fountain' && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Droplets className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">City Public Water Fountain</h2>
              <p className="text-xs text-slate-400 mt-1">
                Cool, fresh filtered municipal water available for all pedestrians.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              Current Hydration:{' '}
              <strong className="text-cyan-400 font-mono text-sm">{Math.round(vitals.hydration)}%</strong>
            </div>

            <button
              onClick={() => {
                sounds.playDrink();
                onDrinkFountain();
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Droplets className="w-5 h-5" />
              <span>Drink Free Fresh Water (+35 Hydration)</span>
            </button>
          </div>
        )}

        {/* CASINO & GAMBLING STUDIO ZONE */}
        {zone.type === 'casino' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400" /> High Roller VIP Gaming Lounge
                </div>
                <h2 className="text-2xl font-black text-white mt-0.5">Metropolis Royale Casino</h2>
                <p className="text-xs text-slate-400">
                  Wager dollars on Cyber Slots, Blackjack, or Roulette. Win massive instant cash payouts!
                </p>
              </div>
            </div>

            {/* Balances & Payment Mode Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] text-slate-400">Card Balance</div>
                  <div className="font-bold font-mono text-emerald-400 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>${bankAccount ? bankAccount.balance.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                  <div className="text-[10px] text-slate-400">Cash in Wallet</div>
                  <div className="font-bold font-mono text-amber-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>${cashOnHand.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Pay method selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCasinoPayMethod('card')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    casinoPayMethod === 'card'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💳 Visa Card
                </button>
                <button
                  type="button"
                  onClick={() => setCasinoPayMethod('cash')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    casinoPayMethod === 'cash'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💵 Cash Wallet
                </button>
              </div>
            </div>

            {/* Feedback message banner */}
            {casinoFeedback && (
              <div
                className={`p-3 rounded-2xl border text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2 ${
                  casinoFeedback.includes('WIN') || casinoFeedback.includes('NATURAL')
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}
              >
                <span>{casinoFeedback}</span>
              </div>
            )}

            {/* Wager Chip Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" /> Current Wager:
                </span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  ${casinoBet.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[10, 25, 50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCasinoBet(amt)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      casinoBet === amt
                        ? 'bg-amber-500 text-slate-950 scale-105 shadow-md font-black'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500/50'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const maxAvail = casinoPayMethod === 'card' ? (bankAccount?.balance || 0) : cashOnHand;
                    if (maxAvail > 0) setCasinoBet(Math.min(1000, Math.floor(maxAvail)));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 font-mono text-xs font-bold cursor-pointer"
                >
                  Max Bet
                </button>
              </div>
            </div>

            {/* Game Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setCasinoTab('slots')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  casinoTab === 'slots'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🎰</span>
                <span>Lucky 7s Slots</span>
              </button>
              <button
                type="button"
                onClick={() => setCasinoTab('blackjack')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  casinoTab === 'blackjack'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🃏</span>
                <span>Royale Blackjack</span>
              </button>
              <button
                type="button"
                onClick={() => setCasinoTab('roulette')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  casinoTab === 'roulette'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🎡</span>
                <span>Neon Roulette</span>
              </button>
            </div>

            {/* GAME 1: LUCKY 7S CYBER SLOTS */}
            {casinoTab === 'slots' && (
              <div className="space-y-4 p-5 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/30 text-center shadow-xl">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> High Stakes 3-Reel Slots • 50x Jackpot
                </div>

                {/* 3 Slot Reels Display */}
                <div className="flex items-center justify-center gap-3 py-3">
                  {slotReels.map((symbol, idx) => (
                    <div
                      key={idx}
                      className={`w-24 h-28 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/60 shadow-inner flex items-center justify-center text-5xl transition-all select-none ${
                        isSlotSpinning ? 'blur-[1px] animate-pulse scale-95 border-amber-400' : 'scale-100'
                      }`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>

                {/* Paytable quick guide */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400">
                  <div>7️⃣ 7️⃣ 7️⃣ = <strong className="text-amber-400 font-bold">50x</strong></div>
                  <div>⭐ ⭐ ⭐ = <strong className="text-yellow-300 font-bold">25x</strong></div>
                  <div>🔔 🔔 🔔 = <strong className="text-cyan-400 font-bold">15x</strong></div>
                  <div>💎 💎 💎 = <strong className="text-sky-300 font-bold">10x</strong></div>
                  <div>🍋 🍋 🍋 = <strong className="text-lime-400 font-bold">5x</strong></div>
                  <div>🍒 🍒 = <strong className="text-rose-400 font-bold">2.5x</strong></div>
                </div>

                {/* Spin Button */}
                <button
                  type="button"
                  disabled={isSlotSpinning}
                  onClick={handleSpinSlots}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RotateCw className={`w-5 h-5 ${isSlotSpinning ? 'animate-spin' : ''}`} />
                  <span>{isSlotSpinning ? 'Spinning Reels...' : `Spin Reels ($${casinoBet.toFixed(2)})`}</span>
                </button>
              </div>
            )}

            {/* GAME 2: ROYALE BLACKJACK */}
            {casinoTab === 'blackjack' && (
              <div className="space-y-4 p-5 rounded-3xl bg-gradient-to-b from-slate-950 to-emerald-950/30 border border-emerald-500/30 text-center shadow-xl">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                  Royale Blackjack 21 • Dealer Stands on 17
                </div>

                {/* Dealer Area */}
                <div className="space-y-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400">Dealer Hand</span>
                    {bjPhase === 'resolved' && (
                      <span className="font-mono font-bold text-emerald-400">
                        Score: {calculateHand(dealerCards)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-h-[52px]">
                    {dealerCards.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">Cards waiting to be dealt...</span>
                    ) : (
                      dealerCards.map((c, idx) => {
                        const isHidden = idx === 1 && bjPhase === 'player';
                        const isRed = c.suit === '♥' || c.suit === '♦';
                        return (
                          <div
                            key={idx}
                            className={`w-12 h-16 rounded-xl border flex flex-col items-center justify-center font-mono font-bold text-xs shadow-md ${
                              isHidden
                                ? 'bg-indigo-900 border-indigo-700 text-indigo-300'
                                : `bg-white border-slate-200 ${isRed ? 'text-rose-600' : 'text-slate-950'}`
                            }`}
                          >
                            {isHidden ? (
                              <span>🂠</span>
                            ) : (
                              <>
                                <span className="text-[10px] leading-none">{c.rank}</span>
                                <span className="text-base leading-none">{c.suit}</span>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Player Area */}
                <div className="space-y-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Your Hand</span>
                    {playerCards.length > 0 && (
                      <span className="font-mono font-bold text-amber-400">
                        Score: {calculateHand(playerCards)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-h-[52px]">
                    {playerCards.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">Press Deal Cards to start hand</span>
                    ) : (
                      playerCards.map((c, idx) => {
                        const isRed = c.suit === '♥' || c.suit === '♦';
                        return (
                          <div
                            key={idx}
                            className={`w-12 h-16 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center font-mono font-bold text-xs shadow-md ${
                              isRed ? 'text-rose-600' : 'text-slate-950'
                            }`}
                          >
                            <span className="text-[10px] leading-none">{c.rank}</span>
                            <span className="text-base leading-none">{c.suit}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {bjOutcome && (
                  <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-xs font-bold text-indigo-300">
                    {bjOutcome}
                  </div>
                )}

                {/* Blackjack Controls */}
                {bjPhase === 'betting' || bjPhase === 'resolved' ? (
                  <button
                    type="button"
                    onClick={handleDealBlackjack}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 transition-all"
                  >
                    <Gamepad2 className="w-5 h-5" />
                    <span>Deal Hand (${casinoBet.toFixed(2)})</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleBlackjackHit}
                      className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      Hit (+ Card)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBlackjackStand()}
                      className="flex-1 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      Stand (Hold)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* GAME 3: NEON ROULETTE */}
            {casinoTab === 'roulette' && (
              <div className="space-y-4 p-5 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-teal-500/30 text-center shadow-xl">
                <div className="text-[11px] font-bold text-teal-400 uppercase tracking-widest">
                  European Neon Roulette • Single Zero 36x Payout
                </div>

                {/* Roulette Wheel Landing Display */}
                <div className="py-4">
                  <div
                    className={`w-28 h-28 mx-auto rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all ${
                      isRouletteSpinning
                        ? 'border-yellow-400 animate-spin bg-slate-900'
                        : rouletteResult
                        ? rouletteResult.color === 'green'
                          ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                          : rouletteResult.color === 'red'
                          ? 'border-rose-500 bg-rose-950 text-rose-300'
                          : 'border-slate-500 bg-slate-950 text-slate-200'
                        : 'border-slate-700 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {isRouletteSpinning ? (
                      <span className="text-2xl animate-pulse">🎡</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black font-mono">
                          {rouletteResult !== null ? rouletteResult.number : '🎡'}
                        </span>
                        {rouletteResult && (
                          <span className="text-[9px] uppercase font-bold tracking-wider">
                            {rouletteResult.color}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {rouletteWinMessage && (
                  <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-xs font-bold text-teal-300">
                    {rouletteWinMessage}
                  </div>
                )}

                {/* Roulette Bet Targets */}
                <div className="space-y-2 text-left">
                  <div className="text-xs font-bold text-slate-300">Select Wager Spot:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRouletteType('red')}
                      className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        rouletteType === 'red'
                          ? 'bg-rose-600 text-white border-white scale-105 shadow-md'
                          : 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Red (2x)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouletteType('black')}
                      className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        rouletteType === 'black'
                          ? 'bg-slate-800 text-white border-white scale-105 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>Black (2x)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouletteType('green')}
                      className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        rouletteType === 'green'
                          ? 'bg-emerald-600 text-white border-white scale-105 shadow-md'
                          : 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>Zero 0 (36x)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRouletteType('even')}
                      className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        rouletteType === 'even'
                          ? 'bg-indigo-600 text-white border-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      Even (2x)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouletteType('odd')}
                      className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        rouletteType === 'odd'
                          ? 'bg-indigo-600 text-white border-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      Odd (2x)
                    </button>
                  </div>
                </div>

                {/* Spin Roulette Button */}
                <button
                  type="button"
                  disabled={isRouletteSpinning}
                  onClick={handleSpinRoulette}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-teal-500/25 cursor-pointer active:scale-95 disabled:opacity-50 transition-all"
                >
                  <RotateCw className={`w-5 h-5 ${isRouletteSpinning ? 'animate-spin' : ''}`} />
                  <span>{isRouletteSpinning ? 'Wheel Spinning...' : `Spin Roulette ($${casinoBet.toFixed(2)})`}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
