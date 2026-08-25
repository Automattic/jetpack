import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useGlobalChartsContext } from './use-global-charts-context';

// Hide seeded series before paint without triggering React's SSR warning.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Seeds a chart's hidden series once per mount or chart ID change.
 *
 * @param chartId      - The chart ID passed to the provider's visibility methods.
 * @param seriesLabels - Labels to hide from the first defined value. Later values are ignored.
 * @return The resolved hidden-series set.
 */
export const useDefaultHiddenSeries = (
	chartId: string,
	seriesLabels?: readonly string[]
): Set< string > => {
	const { getHiddenSeries, setChartHiddenSeries } = useGlobalChartsContext();
	const seededChartId = useRef< string | undefined >( undefined );
	// Read through a ref so the effect never depends on a new array identity.
	const labelsRef = useRef( seriesLabels );
	labelsRef.current = seriesLabels;
	const hasSeriesLabels = seriesLabels !== undefined;
	const shouldUseDefaults = seededChartId.current !== chartId && hasSeriesLabels;

	useIsomorphicLayoutEffect( () => {
		if ( seededChartId.current === chartId || labelsRef.current === undefined ) {
			return;
		}
		seededChartId.current = chartId;
		setChartHiddenSeries( chartId, labelsRef.current );
	}, [ chartId, hasSeriesLabels, setChartHiddenSeries ] );

	// getHiddenSeries hands out a fresh copy per call, so hold the set still between
	// visibility changes. Charts derive their rendered series from it, and a new
	// identity every render invalidates every memo downstream — including the one
	// the accessible tooltip watches, which closes a tooltip mid-navigation.
	return useMemo(
		() => ( shouldUseDefaults ? new Set( labelsRef.current ) : getHiddenSeries( chartId ) ),
		[ shouldUseDefaults, getHiddenSeries, chartId ]
	);
};
