/**
 * External dependencies
 */
import { Text } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	describeError,
	Sparkline,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
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

// `decimals: 0` would round 166,900 to "167K"; the prototype's secondary figure
// keeps the digit ("166.9k").
const ABBREVIATED_VIEWS_OPTIONS = { useMultipliers: true, decimals: 1 };
const PLAIN_VIEWS_OPTIONS = { decimals: 0 };

/**
 * The busiest weekday over an area chart of the whole week's distribution.
 */
function PopularDaysReport() {
	const { buckets, peak, isLoading, isFetching, isError, error, refetch } = usePopularDays();

	// Averages, matching the headline — plotting totals here would contradict it
	// on any range that samples some weekdays more often than others.
	const points = useMemo( () => buckets.map( bucket => bucket.average ), [ buckets ] );

	// `placeholderData` keeps the prior response on a transient refetch failure,
	// so the error only surfaces when there is nothing left to show. `error` is
	// gated on the same predicate so the two cannot disagree.
	const showError = isError && ! peak;

	const views = peak?.average ?? 0;
	const exactViews = formatMetricValue( views, 'number', PLAIN_VIEWS_OPTIONS );
	const formattedViews = formatMetricValue(
		views,
		'number',
		views >= 1000 ? ABBREVIATED_VIEWS_OPTIONS : PLAIN_VIEWS_OPTIONS
	);

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
				<div className={ styles.body }>
					<div className={ styles.headline }>
						{ /* Not `MetricValue`: it pins a 20px line-height at any font size, which
						    clips 32px glyphs. `heading-2xl` pairs 32px with 40px. */ }
						<Text variant="heading-2xl">{ peak?.label }</Text>
						<Text variant="body-md" className={ styles.views } title={ exactViews }>
							{ sprintf(
								/* translators: %s is a number of views, e.g. "166.9k". */
								__( '%s views', 'jetpack-premium-analytics-pkg' ),
								formattedViews
							) }
						</Text>
					</div>
					<div className={ styles.chart }>
						{ /* `withResponsive` caps width at 1200px by default, stranding space on a
						    wider card. */ }
						<Sparkline data={ points } maxWidth={ Infinity } />
					</div>
				</div>
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
