/**
 * Mock Data Presets
 *
 * Coordinated data scenarios that work across all endpoints.
 * When you have multiple widgets using different endpoints,
 * these presets ensure consistent data patterns.
 *
 * ## Available Presets
 *
 * - **default**: Standard store with consistent orders
 * - **high-volume**: Busy store with lots of activity
 * - **seasonal-spike**: Experiencing a seasonal increase
 * - **slow-period**: Quieter period with fewer orders
 * - **sparse**: Very few orders, lots of empty days
 */

/**
 * Generic mock data parameters that work across all endpoint types.
 *
 * Each generator interprets these parameters according to its domain:
 * - Orders: density = days with orders, volume = orders per day
 * - Visitors: density = days with traffic, volume = visitors * 100
 * - Attribution: density = distribution evenness, volume = total sales scale
 */
export interface MockDataPreset {
	seed: number;
	density: number; // 0-1: data sparsity/distribution (generic)
	volume: number; // Relative amount/magnitude (generic, interpretable)
	description: string;
}

export const MOCK_DATA_PRESETS: Record< string, MockDataPreset > = {
	default: {
		seed: 12345,
		density: 0.9,
		volume: 7,
		description: 'Standard store with consistent activity',
	},
	'high-volume': {
		seed: 11111,
		density: 1.0,
		volume: 20,
		description: 'Busy store with high volume across metrics',
	},
	'seasonal-spike': {
		seed: 22222,
		density: 0.7,
		volume: 15,
		description: 'Store experiencing seasonal spike',
	},
	'slow-period': {
		seed: 33333,
		density: 0.4,
		volume: 3,
		description: 'Store in slow period',
	},
	sparse: {
		seed: 44444,
		density: 0.1,
		volume: 2,
		description: 'Sparse data with minimal activity',
	},
};

/**
 * Get mock params from preset name
 *
 * Returns generic parameters that each generator interprets according to its domain
 */
export function getMockParamsFromPreset( preset: string ): {
	seed: number;
	density: number;
	volume: number;
} {
	const presetConfig = MOCK_DATA_PRESETS[ preset ] || MOCK_DATA_PRESETS.default;
	return {
		seed: presetConfig.seed,
		density: presetConfig.density,
		volume: presetConfig.volume,
	};
}
