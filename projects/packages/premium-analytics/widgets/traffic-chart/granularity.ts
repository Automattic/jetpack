/**
 * External dependencies
 */
import { getAllowedIntervalsForPreset, type ReportParams } from '@jetpack-premium-analytics/data';
import { defaultPeriodForInterval } from '@jetpack-premium-analytics/widgets-toolkit';
import { useEffect, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { TrafficPeriod } from './use-traffic-chart';
import type { TrafficChartAttributes, TrafficChartGranularity } from './widget';

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires.
const TRAFFIC_PERIODS = [ 'day', 'week', 'month' ] as const satisfies readonly TrafficPeriod[];

/**
 * Default granularity for the dashboard interval: opens the control at the
 * granularity the range implies (and, until the user picks one explicitly,
 * keeps following the range). The dropdown only offers hour/day/week/month,
 * so a coarser dashboard interval (quarter/year) collapses onto month.
 *
 * Hourly is resolved locally rather than via the shared
 * `defaultPeriodForInterval` helper: its mapping table has no `hour` entry,
 * and adding one there would flip its "unsupported" fallback toward the
 * coarsest end for every other widget that doesn't offer hourly (the
 * helper's clamp only handles "too coarse", not "too fine").
 *
 * @param interval - The dashboard-derived interval.
 * @return The matching selectable granularity.
 */
export function resolveAutoPeriod( interval?: string ): TrafficPeriod {
	return interval === 'hour' ? 'hour' : defaultPeriodForInterval( interval, TRAFFIC_PERIODS );
}

/**
 * Group-by granularities selectable for the dashboard range: the range's
 * allowed intervals (the same rule the date picker resolves `interval` with)
 * narrowed to the dropdown's options, with intervals coarser than the
 * dropdown offers (quarter/year) collapsing onto month — mirroring
 * `resolveAutoPeriod`, so the selectable set always contains what Auto
 * resolves to.
 *
 * @param reportParams - The dashboard report params.
 * @return The selectable granularities.
 */
export function enabledTrafficPeriods( reportParams: ReportParams ): Set< TrafficPeriod > {
	const allowed = getAllowedIntervalsForPreset(
		reportParams.preset,
		reportParams.from,
		reportParams.to
	);

	return new Set(
		allowed.map( interval =>
			interval === 'quarter' || interval === 'year' ? 'month' : interval
		)
	);
}

/**
 * Resolve the granularity the chart fetches with. An explicit selection holds
 * while the range still allows it; once the range disallows it the chart
 * renders as Auto immediately and the stored attribute is reset to `auto`
 * (when the host supports writes), so the stored value and the rendered chart
 * cannot drift apart.
 *
 * @param granularity   - The stored granularity attribute.
 * @param reportParams  - The dashboard report params.
 * @param setAttributes - Host attribute writer, when available.
 * @return The granularity to fetch with.
 */
export function useTrafficPeriod(
	granularity: TrafficChartGranularity,
	reportParams: ReportParams,
	setAttributes?: ( next: Partial< TrafficChartAttributes > ) => void
): TrafficPeriod {
	const enabled = useMemo( () => enabledTrafficPeriods( reportParams ), [ reportParams ] );
	const isExplicitAllowed = granularity !== 'auto' && enabled.has( granularity );

	useEffect( () => {
		if ( granularity !== 'auto' && ! enabled.has( granularity ) ) {
			setAttributes?.( { granularity: 'auto' } );
		}
	}, [ granularity, enabled, setAttributes ] );

	return isExplicitAllowed ? granularity : resolveAutoPeriod( reportParams.interval );
}
