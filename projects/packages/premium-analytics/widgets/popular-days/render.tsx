/**
 * External dependencies
 */
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	describeError,
	PeakDistribution,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { usePopularDays } from './use-popular-days';
import type { PopularDaysAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but the host and
// Storybook may also pass them via `attributes`.
type PopularDaysRenderAttributes = PopularDaysAttributes & Partial< ReportParamsFieldAttributes >;

type PopularDaysWidgetProps = WidgetRenderProps< PopularDaysRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function PopularDaysReport() {
	const { buckets, peak, isLoading, isFetching, isError, error, refetch } = usePopularDays();

	// Averages, matching the headline; totals would contradict it on any range
	// that samples some weekdays more often than others.
	const points = useMemo( () => buckets.map( bucket => bucket.average ), [ buckets ] );

	// `placeholderData` keeps the prior response on a transient refetch failure,
	// so the error only surfaces when there is nothing left to show. `error` is
	// gated on the same predicate so the two cannot disagree.
	const showError = isError && ! peak;

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
				empty={ {
					icon: calendar,
					description: __( 'No views in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
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
