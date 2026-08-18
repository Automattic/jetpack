/**
 * External dependencies
 */
import { StatsResponseShapeError } from '@jetpack-premium-analytics/data';
import {
	describeError,
	PeakDistribution,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { scheduled } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { usePopularHours } from './use-popular-hours';
import type { PopularHoursAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type PopularHoursRenderAttributes = PopularHoursAttributes & Partial< ReportParamsFieldAttributes >;

type PopularHoursWidgetProps = WidgetRenderProps< PopularHoursRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function PopularHoursReport() {
	const { buckets, peak, isLoading, isFetching, isError, error, refetch } = usePopularHours();

	const points = useMemo( () => buckets.map( bucket => bucket.average ), [ buckets ] );

	// Keep stale data visible for transient refetch failures. A changed response
	// contract invalidates the cached interpretation, so surface that error.
	const showError = isError && ( ! peak || error instanceof StatsResponseShapeError );
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
				empty={ {
					icon: scheduled,
					description: __( 'No views in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
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
