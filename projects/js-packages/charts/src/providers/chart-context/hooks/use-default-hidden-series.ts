import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useGlobalChartsContext } from './use-global-charts-context';

// Hide seeded series before paint without triggering React's SSR warning.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Seeds a chart's hidden series once per chart ID, the first time the provider
 * sees that ID.
 *
 * The provider owns the record of what has been seeded, not this hook: a
 * mount-scoped one would re-apply the defaults on every remount, and a chart
 * remounts for reasons the reader never thinks of as a new chart — switching
 * between line and bar, tabbing away and back, a resize flipping tabs into a
 * dropdown. Each of those would throw away the series they had just revealed.
 *
 * @param chartId      - The chart ID passed to the provider's visibility methods.
 * @param seriesLabels - Labels to hide when this chart ID is first seen. Later values are ignored.
 * @return The resolved hidden-series set.
 */
export const useDefaultHiddenSeries = (
	chartId: string,
	seriesLabels?: readonly string[]
): Set< string > => {
	const { getHiddenSeries, seedChartHiddenSeries, hasSeededChart } = useGlobalChartsContext();
	// Read through a ref so the effect never depends on a new array identity.
	const labelsRef = useRef( seriesLabels );
	labelsRef.current = seriesLabels;
	const hasSeriesLabels = seriesLabels !== undefined;
	const shouldUseDefaults = hasSeriesLabels && ! hasSeededChart( chartId );

	useIsomorphicLayoutEffect( () => {
		if ( labelsRef.current === undefined ) {
			return;
		}
		seedChartHiddenSeries( chartId, labelsRef.current );
	}, [ chartId, hasSeriesLabels, seedChartHiddenSeries ] );

	// getHiddenSeries hands out a fresh copy per call, so hold the set still between
	// visibility changes. Charts derive their rendered series from it, and a new
	// identity every render invalidates every memo downstream — including the one
	// the accessible tooltip watches, which closes a tooltip mid-navigation.
	return useMemo(
		() => ( shouldUseDefaults ? new Set( labelsRef.current ) : getHiddenSeries( chartId ) ),
		[ shouldUseDefaults, getHiddenSeries, chartId ]
	);
};
