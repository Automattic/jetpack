import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGlobalChartsContext } from './use-global-charts-context';

// Hide seeded series before paint without triggering React's SSR warning.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Seeds a chart's hidden series once per mount or chart ID change.
 *
 * @param chartId      - The chart ID passed to the provider's visibility methods.
 * @param seriesLabels - Labels to hide at mount. Omit to leave visibility untouched.
 * @return The resolved hidden-series set.
 */
export const useDefaultHiddenSeries = (
	chartId: string,
	seriesLabels?: string[]
): Set< string > => {
	const { getHiddenSeries, setChartHiddenSeries } = useGlobalChartsContext();
	const seededChartId = useRef< string | undefined >( undefined );
	// Read through a ref so the effect never depends on a new array identity.
	const labelsRef = useRef( seriesLabels );
	labelsRef.current = seriesLabels;
	const shouldUseDefaults = seededChartId.current !== chartId && seriesLabels !== undefined;

	useIsomorphicLayoutEffect( () => {
		if ( seededChartId.current === chartId || ! labelsRef.current ) {
			return;
		}
		seededChartId.current = chartId;
		setChartHiddenSeries( chartId, labelsRef.current );
	}, [ chartId, setChartHiddenSeries ] );

	return shouldUseDefaults ? new Set( seriesLabels ) : getHiddenSeries( chartId );
};
