/**
 * Internal dependencies
 */
import type { DataFormat } from '../types';

/**
 * Hours to one decimal, shared by the Videos report and the video detail page.
 */
export const HOURS_DATA_FORMAT: DataFormat = {
	type: 'number',
	options: { decimals: 1, useMultipliers: false, markBelowPrecision: true },
};
