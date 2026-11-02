/**
 * Internal dependencies
 */
import type { DataFormat } from '../types';

/**
 * A count that is the widget's point, so it shows in full (`18,432`) and
 * gives way to the compact form (`18.4K`) only where the full one is clipped.
 */
export const HEADLINE_COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true },
	preferExact: true,
};
