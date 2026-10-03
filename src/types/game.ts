/**
 * Game data types and models
 */

export type WeatherType = 'sunny' | 'rainy' | 'foggy' | 'stormy';
export type CharacterGender = 'male' | 'female';

export interface Vitals {
  hunger: number; // 0 - 100 (100 = full, 0 = starving)
  hydration: number; // 0 - 100 (100 = hydrated, 0 = dehydrated)
  fatigue: number; // 0 - 100 (100 = fully rested, 0 = exhausted)
  health: number; // 0 - 100
  stamina: number; // 0 - 100 (used for sprinting)
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'food' | 'drink' | 'item';
  hungerValue: number;
  hydrationValue: number;
  energyValue: number;
  healthValue?: number;
  description?: string;
  badge?: string;
  cost: number;
  icon: string;
  quantity: number;
}

export interface BankAccountData {
  userId: string;
  customerId: string;
  accountNumber: string;
  balance: number;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  isCardActive: boolean;
  themeColor: 'gold' | 'black' | 'neon' | 'blue';
  createdAt: string;
}

export interface SimProfileData {
  userId: string;
  phoneNumber: string;
  carrier: string;
  isActivated: boolean;
  dataBalanceGb: number;
  activatedAt?: string;
}

export type TransactionCategory =
  | 'Food'
  | 'Water'
  | 'Telecom'
  | 'Transfer'
  | 'Banking'
  | 'Groceries'
  | 'Housing';

export interface TransactionData {
  id: string;
  userId: string;
  amount: number;
  type: 'debit' | 'credit';
  category: TransactionCategory;
  description: string;
  recipient?: string;
  timestamp: string;
  balanceAfter: number;
}

export interface P2PContact {
  id: string;
  name: string;
  customerId: string;
  phoneNumber: string;
  avatarBg: string;
  relationship: string;
}

export type QuestStage =
  | 'GO_TO_BANK'
  | 'ACTIVATE_SIM'
  | 'SEND_FIRST_TRANSFER'
  | 'SURVIVE_AND_THRIVE';

export type PhysicalProblem =
  | 'severe_starvation'
  | 'severe_dehydration'
  | 'critical_exhaustion'
  | 'heat_stroke'
  | 'muscle_cramps';

export interface PhysicalAffliction {
  id: PhysicalProblem;
  title: string;
  severity: 'moderate' | 'severe' | 'critical';
  impactDescription: string;
  cureRecommendation: string;
}

export interface SmsMessage {
  id: string;
  senderName: string;
  senderPhone: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  avatarBg: string;
}

export interface InteractiveZone {
  id: string;
  name: string;
  type: 'bank' | 'sim' | 'market' | 'restaurant' | 'home' | 'fountain' | 'atm';
  position: [number, number, number];
  radius: number;
  label: string;
  description: string;
}
