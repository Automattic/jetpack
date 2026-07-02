/**
 * External dependencies
 */
import { useStatsInsights, type StatsInsightsResponse } from '@jetpack-premium-analytics/data';
import {
	BarChart,
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	type BarChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { format, parse } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './most-popular-time.module.css';
import type { MostPopularTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the insights
// endpoint ignores them (it reports across the whole site lifetime with no
// comparison period), but WidgetRoot still expects them on `attributes`.
type MostPopularTimeRenderAttributes = MostPopularTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The insights `hourly_views` timestamps arrive as `YYYY-MM-DD HH:mm:ss`
 * strings; this parses one back into a `Date` so its hour can be formatted for
 * the bar-chart axis.
 */
const HOURLY_VIEWS_TIMESTAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/**
 * Maps the insights `hourlyViews` map (timestamp → view count) onto the single
 * series `BarChart` expects, labelling each bar with its hour of day. Entries
 * are ordered chronologically by their timestamp key.
 *
 * @param hourlyViews - The insights hourly-views map, or undefined while loading.
 * @return The bar-chart series data.
 */
function toHourlyChartData( hourlyViews: StatsInsightsResponse[ 'hourlyViews' ] ): BarChartData {
	if ( ! hourlyViews ) {
		return [];
	}

	const points = Object.entries( hourlyViews )
		.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
		.map( ( [ timestamp, views ] ) => ( {
			label: format( parse( timestamp, HOURLY_VIEWS_TIMESTAMP_FORMAT, new Date() ), 'ha' ),
			value: views,
		} ) );

	if ( points.length === 0 ) {
		return [];
	}

	return [ { label: __( 'Views', 'jetpack-premium-analytics' ), data: points } ];
}

/**
 * Fetches the insights report through the `useStatsInsights` Stats hook and
 * renders the most-popular-time highlight — the peak hour and its share of
 * views — above a bar chart of views across the day.
 *
 * @return The widget content.
 */
function MostPopularTimeReport() {
	const { data, isLoading, isError } = useStatsInsights();
	const report = data as StatsInsightsResponse | undefined;

	const chartData = useMemo< BarChartData >(
		() => toHourlyChartData( report?.hourlyViews ),
		[ report?.hourlyViews ]
	);

	if ( isError ) {
		return (
			<Text className={ styles.placeholder }>
				{ __( 'Unable to load insights.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	}

	if ( isLoading && ! report?.hour ) {
		return <WidgetLoadingOverlay />;
	}

	if ( ! report?.hour ) {
		return (
			<Text className={ styles.placeholder }>
				{ __(
					'Not enough data to determine your most popular time yet.',
					'jetpack-premium-analytics'
				) }
			</Text>
		);
	}

	return (
		<Stack className={ styles.root } gap="md">
			<Stack className={ styles.highlight } align="center" gap="xs">
				<Text variant="heading-2xl" className={ styles.hour }>
					{ report.hour }
				</Text>
				<Stack direction="row" align="baseline" justify="center" gap="xs">
					<MetricWithComparison
						value={ ( report.hourPercent ?? 0 ) / 100 }
						dataFormat={ {
							type: 'percentage',
							options: { decimals: 0, signDisplay: 'never' },
						} }
						fontSize="lg"
					/>
					<Text variant="body-md" className={ styles.caption }>
						{ __( 'of views', 'jetpack-premium-analytics' ) }
					</Text>
				</Stack>
			</Stack>
			{ chartData.length > 0 && (
				<BarChart
					className={ styles.chart }
					chartData={ chartData }
					dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
					emptyStateText={ __(
						'No hourly view data for this period.',
						'jetpack-premium-analytics'
					) }
				/>
			) }
		</Stack>
	);
}

/**
 * Widget render entry point.
 *
 * Passes host attributes into `WidgetRoot` for the widget contract. The insights
 * report takes no parameters, so the inner component reads nothing from
 * `attributes`.
 *
 * @param {WidgetRenderProps< MostPopularTimeRenderAttributes >} props - The render props supplied by the widget host.
 * @return The rendered widget.
 */
export default function MostPopularTime( {
	attributes = {},
}: WidgetRenderProps< MostPopularTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostPopularTimeReport />
		</WidgetRoot>
	);
}
