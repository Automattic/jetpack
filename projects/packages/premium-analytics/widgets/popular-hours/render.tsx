/**
 * External dependencies
 */
import { StatsResponseShapeError } from '@jetpack-premium-analytics/data';
import {
	describeError,
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
import { usePopularHours, type PopularHourBucket } from './use-popular-hours';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

export type PopularHoursAttributes = Record< never, never >;

type PopularHoursRenderAttributes = PopularHoursAttributes & Partial< ReportParamsFieldAttributes >;

type PopularHoursWidgetProps = WidgetRenderProps< PopularHoursRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

// Two decimals keep a quiet site's fraction of a view without float noise.
const toHundredths = ( value: number ) => Math.round( value * 100 ) / 100;

const HOUR_COLUMNS: CsvColumn< PopularHourBucket >[] = [
	{
		label: __( 'Hour', 'jetpack-premium-analytics-pkg' ),
		getValue: row => `${ String( row.hour ).padStart( 2, '0' ) }:00`,
	},
	{
		label: __( 'Average views per day', 'jetpack-premium-analytics-pkg' ),
		getValue: row => toHundredths( row.average ),
	},
	{ label: __( 'Total views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.total },
];

function PopularHoursReport() {
	const { buckets, peak, isLoading, isFetching, isError, error, refetch } = usePopularHours();

	const points = useMemo( () => buckets.map( bucket => bucket.average ), [ buckets ] );

	// Keep stale data visible for transient refetch failures. A changed response
	// contract invalidates the cached interpretation, so surface that error.
	const showError = isError && ( ! peak || error instanceof StatsResponseShapeError );
	useReportActions( {
		csv: {
			rows: peak ? buckets : [],
			columns: HOUR_COLUMNS,
			filenamePrefix: 'popular-hours',
			hasDateRange: true,
			status: { isLoading, isFetching, isError },
		},
	} );

	const valueDecimals = peak && peak.average < 10 && ! Number.isInteger( peak.average ) ? 1 : 0;

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
									"We couldn't load your popular hours. Please try again in a moment.",
									'jetpack-premium-analytics-pkg'
								),
								onRetry: refetch,
							} )
						: null
				}
			>
				<PeakDistribution
					label={ peak?.label ?? '' }
					value={ peak?.average ?? 0 }
					points={ points }
					valueDecimals={ valueDecimals }
					valueUnit="views-per-day"
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Render the Popular hours widget inside its shared widget context.
 */
export default function PopularHoursRender( {
	attributes = {},
	setError,
}: PopularHoursWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<PopularHoursReport />
		</WidgetRoot>
	);
}
