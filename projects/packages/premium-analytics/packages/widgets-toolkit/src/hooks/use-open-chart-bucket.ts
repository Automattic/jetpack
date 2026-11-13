/**
 * External dependencies
 */
import { useReportScope } from '@jetpack-premium-analytics/data';
import {
	isDrillableInterval,
	parseSiteDateTime,
	reportingTimeZone,
	type IntervalType,
} from '@jetpack-premium-analytics/datetime';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../components/widget-root/context';
import { bucketRange } from '../helpers/period-range';
import type { ClickedBucket } from '../components/metric-tabs-chart/metric-tabs-chart';

/**
 * Opens the clicked chart bucket as the surface's period, cut to the range its series covers: the report range, or the comparison range for a previous-period bucket.
 *
 * @param interval - The bucket size the chart draws, which may differ from the saved one.
 * @return The `MetricTabsChart` `onDatumClick` handler; undefined where the host sets no period or the bucket has nothing smaller to open.
 */
export function useOpenChartBucket( interval: IntervalType ) {
	const { reportParams } = useWidgetRootContext();
	const { openPeriod } = useReportScope();

	return useMemo( () => {
		if ( ! openPeriod || ! isDrillableInterval( interval ) ) {
			return undefined;
		}

		const current = {
			from: parseSiteDateTime( reportParams.from ),
			to: parseSiteDateTime( reportParams.to ),
		};
		const comparison = {
			from: parseSiteDateTime( reportParams.compare_from ),
			to: parseSiteDateTime( reportParams.compare_to ),
		};

		return ( clicked: ClickedBucket ) => {
			const window = clicked.isComparison ? comparison : current;
			const range = bucketRange( clicked, interval, window, {
				timeZone: reportingTimeZone(),
			} );

			if ( range ) {
				openPeriod( range );
			}
		};
	}, [
		openPeriod,
		interval,
		reportParams.from,
		reportParams.to,
		reportParams.compare_from,
		reportParams.compare_to,
	] );
}
