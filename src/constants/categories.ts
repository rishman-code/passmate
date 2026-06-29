import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export const DVSA_CATEGORIES = [
  'Alertness',
  'Attitude',
  'Safety and Your Vehicle',
  'Safety Margins',
  'Hazard Awareness',
  'Vulnerable Road Users',
  'Other Types of Vehicle',
  'Vehicle Handling',
  'Motorway Rules',
  'Rules of the Road',
  'Road and Traffic Signs',
  'Documents',
  'Accidents',
  'Vehicle Loading',
] as const;

export type DVSACategory = (typeof DVSA_CATEGORIES)[number];

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORY_ICONS: Record<DVSACategory, IoniconName> = {
  Alertness: 'eye-outline',
  Attitude: 'heart-outline',
  'Safety and Your Vehicle': 'car-outline',
  'Safety Margins': 'resize-outline',
  'Hazard Awareness': 'warning-outline',
  'Vulnerable Road Users': 'walk-outline',
  'Other Types of Vehicle': 'bus-outline',
  'Vehicle Handling': 'speedometer-outline',
  'Motorway Rules': 'trail-sign-outline',
  'Rules of the Road': 'document-text-outline',
  'Road and Traffic Signs': 'stop-circle-outline',
  Documents: 'folder-outline',
  Accidents: 'medkit-outline',
  'Vehicle Loading': 'cube-outline',
};

export const MOCK_TEST_QUESTION_COUNT = 50;
export const MOCK_TEST_DURATION_SECONDS = 57 * 60;
export const MOCK_TEST_PASS_SCORE = 43;
export const PREMIUM_PRICE = '£5.99';
