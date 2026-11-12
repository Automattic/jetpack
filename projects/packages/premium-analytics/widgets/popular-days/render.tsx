/**
 * External dependencies
 */
import {
	describeError,
	MetricSparklineSkeleton,
	PeakDistribution,
	WidgetRoot,
	WidgetState,
	useReportActions,
	type CsvColumn,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { usePopularDays } from './use-popular-days';
import type { PopularDayBucket } from './bucket-views-by-weekday';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

/**
 * Configurable attributes for the Popular days widget. There are none: the
 * metric is fixed and the date range comes from the dashboard picker.
 */
export type PopularDaysAttributes = Record< never, never >;

// Report params are usually URL-driven (WidgetRoot's fallback), but the host and
// Storybook may also pass them via `attributes`.
type PopularDaysRenderAttributes = PopularDaysAttributes & Partial< ReportParamsFieldAttributes >;

type PopularDaysWidgetProps = WidgetRenderProps< PopularDaysRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

// Two decimals keep a quiet site's fraction of a view without float noise.
const toHundredths = ( value: number ) => Math.round( value * 100 ) / 100;

const DAY_COLUMNS: CsvColumn< PopularDayBucket >[] = [
	{ label: __( 'Day', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
	{
		label: __( 'Average views', 'jetpack-premium-analytics-pkg' ),
		getValue: row => toHundredths( row.average ),
	},
	{ label: __( 'Total views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.total },
];

function PopularDaysReport() {
	const { buckets, peak, isLoading, isFetching, isError, error, refetch } = usePopularDays();

	// Averages, matching the headline; totals would contradict it on any range
	// that samples some weekdays more often than others.
	const points = useMemo( () => buckets.map( bucket => bucket.average ), [ buckets ] );

	// `placeholderData` keeps the prior response on a transient refetch failure,
	// so the error only surfaces when there is nothing left to show.
	const showError = isError && ! peak;

	useReportActions( {
		csv: {
			rows: peak ? buckets : [],
			columns: DAY_COLUMNS,
			filenamePrefix: 'popular-days',
			hasDateRange: true,
			status: { isLoading, isFetching, isError },
		},
	} );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ showError }
				isEmpty={ ! peak }
				error={
					showError
						? describeError( error, {
								retryDescription: __(
									"We couldn't load your popular days. Please try again in a moment.",
									'jetpack-premium-analytics-pkg'
								),
								onRetry: refetch,
							} )
						: null
				}
				renderLoading={ <MetricSparklineSkeleton withHeadlineCount /> }
			>
				<PeakDistribution
					label={ peak?.label ?? '' }
					value={ peak?.average ?? 0 }
					points={ points }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * WidgetRoot provides the query client, chart theme, and resolved report params.
 */
export default function PopularDaysRender( { attributes = {}, setError }: PopularDaysWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<PopularDaysReport />
		</WidgetRoot>
	);
}
