import type { FunnelStep } from '../conversion-funnel-chart';

/**
 * Sample conversion funnel data matching the screenshot
 */
export const sampleFunnelData: FunnelStep[] = [
	{
		id: 'sessions',
		label: 'Sessions',
		rate: 100,
		count: 10000,
	},
	{
		id: 'cart',
		label: 'Cart',
		rate: 71.1,
		count: 7110,
	},
	{
		id: 'checkout',
		label: 'Checkout',
		rate: 52.5,
		count: 5250,
	},
	{
		id: 'purchase',
		label: 'Purchase',
		rate: 10.3,
		count: 1030,
	},
];

/**
 * Sample data with lower conversion rates
 */
export const lowConversionData: FunnelStep[] = [
	{
		id: 'sessions',
		label: 'Sessions',
		rate: 100,
		count: 5000,
	},
	{
		id: 'cart',
		label: 'Cart',
		rate: 45.2,
		count: 2260,
	},
	{
		id: 'checkout',
		label: 'Checkout',
		rate: 28.8,
		count: 1440,
	},
	{
		id: 'purchase',
		label: 'Purchase',
		rate: 6.4,
		count: 320,
	},
];

/**
 * Sample data with high conversion rates
 */
export const highConversionData: FunnelStep[] = [
	{
		id: 'sessions',
		label: 'Sessions',
		rate: 100,
		count: 8000,
	},
	{
		id: 'cart',
		label: 'Cart',
		rate: 85.3,
		count: 6824,
	},
	{
		id: 'checkout',
		label: 'Checkout',
		rate: 72.1,
		count: 5768,
	},
	{
		id: 'purchase',
		label: 'Purchase',
		rate: 18.7,
		count: 1496,
	},
];

/**
 * Sample B2B SaaS funnel data
 */
export const saasSignupData: FunnelStep[] = [
	{
		id: 'visitors',
		label: 'Visitors',
		rate: 100,
		count: 15000,
	},
	{
		id: 'trial',
		label: 'Trial Signup',
		rate: 12.5,
		count: 1875,
	},
	{
		id: 'activation',
		label: 'Activated',
		rate: 8.2,
		count: 1230,
	},
	{
		id: 'subscription',
		label: 'Paid Plan',
		rate: 3.1,
		count: 465,
	},
];
