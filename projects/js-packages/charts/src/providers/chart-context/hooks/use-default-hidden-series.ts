import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGlobalChartsContext } from './use-global-charts-context';

// useLayoutEffect on the client so the seeded series is hidden in the first
// painted frame, useEffect on the server to avoid React's SSR warning. Same
// pattern as charts/private/with-responsive.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Seeds a chart's hidden series once per mount.
 *
 * Applies the labels as the chart's entire hidden set, so a remount honours
 * exactly the declared defaults rather than inheriting the previous mount's
 * hides — `hiddenSeries` outlives an unmount. Runs once per mount: re-applying
 * would undo the user's own legend toggles, and "this chart has no hidden entry
 * yet" cannot distinguish a fresh mount from a user who just revealed
 * everything, because an emptied hidden set deletes the entry.
 *
 * @param chartId      - The chart's id, as passed to the provider's visibility methods.
 * @param seriesLabels - Labels to hide at mount. Omit to leave visibility untouched.
 */
export const useDefaultHiddenSeries = ( chartId: string, seriesLabels?: string[] ): void => {
	const { setChartHiddenSeries } = useGlobalChartsContext();
	const seeded = useRef( false );
	// Read through a ref so the effect never depends on a new array identity.
	const labelsRef = useRef( seriesLabels );
	labelsRef.current = seriesLabels;

	useIsomorphicLayoutEffect( () => {
		if ( seeded.current || ! labelsRef.current ) {
			return;
		}
		seeded.current = true;
		setChartHiddenSeries( chartId, labelsRef.current );
	}, [ chartId, setChartHiddenSeries ] );
};
