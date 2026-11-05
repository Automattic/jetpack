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

/**
 * Opens the clicked chart bucket as the surface's period, cut to the widget's report window.
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

		const window = {
			from: parseSiteDateTime( reportParams.from ),
			to: parseSiteDateTime( reportParams.to ),
		};

		return ( date: Date, endDate?: Date ) => {
			const range = bucketRange( { date, endDate }, interval, window, {
				timeZone: reportingTimeZone(),
			} );

			if ( range ) {
				openPeriod( range );
			}
		};
	}, [ openPeriod, interval, reportParams.from, reportParams.to ] );
}
