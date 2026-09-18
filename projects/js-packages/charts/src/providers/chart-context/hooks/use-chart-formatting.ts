import { useContext } from 'react';
import { GlobalChartsContext } from '../global-charts-provider';
import type { ChartFormatting } from '../../../types';

// A stable reference, so a chart mounted without a provider doesn't rebuild its
// formatting memos on every render.
const RUNTIME_FORMATTING: ChartFormatting = {};

/**
 * The locale and time zone dates are rendered in, as set on `GlobalChartsProvider`.
 *
 * Falls back to the runtime's own rather than throwing: charts render outside a
 * provider, and a host that sets neither gets exactly the browser-default
 * behavior this package had before the context existed.
 *
 * @return The host's formatting context.
 */
export const useChartFormatting = (): ChartFormatting => {
	const context = useContext( GlobalChartsContext );

	return context?.formatting ?? RUNTIME_FORMATTING;
};
