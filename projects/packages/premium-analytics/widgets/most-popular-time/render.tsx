/**
 * External dependencies
 */
import { useStatsInsights, type StatsInsightsResponse } from '@jetpack-premium-analytics/data';
import {
	formatHourOfDay,
	formatMetricValue,
	formatMondayFirstWeekday,
} from '@jetpack-premium-analytics/formatters';
import {
	describeError,
	HighlightField,
	HighlightGroup,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { scheduled } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { MostPopularTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the insights
// endpoint ignores them (the peak day and hour come from a fixed server-side
// window, with no comparison period), but WidgetRoot still expects them on
// `attributes`.
type MostPopularTimeRenderAttributes = MostPopularTimeAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostPopularTimeWidgetProps = WidgetRenderProps< MostPopularTimeRenderAttributes >;

/**
 * Renders a whole-percent share of views as the highlight caption; absent when
 * the endpoint sent no share, rather than showing 0%.
 */
function shareCaption( percent?: number ) {
	if ( percent === undefined ) {
		return undefined;
	}
	return sprintf(
		/* translators: %s is a percentage, e.g. "17%". */
		__( '%s of views', 'jetpack-premium-analytics-pkg' ),
		// The report carries whole percents; the formatter takes a fraction.
		formatMetricValue( percent / 100, 'percentage', {
			decimals: 0,
			signDisplay: 'never',
		} )
	);
}

/**
 * Fetches the insights report through the `useStatsInsights` Stats hook and
 * renders the most-popular-time highlights — the peak day and hour, each with
 * its share of views.
 */
function MostPopularTimeReport() {
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsInsights();
	const report = data as StatsInsightsResponse | undefined;
	// The card stands on the day alone: the hour is a second highlight the
	// endpoint may not have sent, and withholding a known best day because of it
	// would report "not enough data" over data there is. Compared against
	// `undefined`, not falsiness — Monday and midnight are both 0.
	const { dayOfWeek, hourOfDay, percent, hourPercent } = report ?? {};
	const isEmpty = dayOfWeek === undefined;
	// `placeholderData` keeps the prior response on a transient refetch failure,
	// so the error only surfaces when there is nothing left to show.
	const showError = isError && isEmpty;

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ showError }
				isEmpty={ isEmpty }
				// Mapped rather than hand-written: a 403 from a reader without stats
				// access is not something retrying fixes, and describeError drops the
				// Retry action for it. Gated on the same predicate as `isError` so the
				// two cannot disagree.
				error={
					showError
						? describeError( error, {
								retryDescription: __(
									"We couldn't load your most popular time. Please try again in a moment.",
									'jetpack-premium-analytics-pkg'
								),
								onRetry: refetch,
						  } )
						: null
				}
				empty={ {
					icon: scheduled,
					description: __(
						'Not enough data to determine your most popular time yet.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				{ dayOfWeek !== undefined && (
					<HighlightGroup>
						<HighlightField
							label={ __( 'Best day', 'jetpack-premium-analytics-pkg' ) }
							value={ formatMondayFirstWeekday( dayOfWeek ) }
							caption={ shareCaption( percent ) }
						/>
						{ hourOfDay !== undefined && (
							<HighlightField
								label={ __( 'Best hour', 'jetpack-premium-analytics-pkg' ) }
								value={ formatHourOfDay( hourOfDay ) }
								caption={ shareCaption( hourPercent ) }
							/>
						) }
					</HighlightGroup>
				) }
			</WidgetState>
		</div>
	);
}

/**
 * Passes host attributes into `WidgetRoot` for the widget contract. The insights
 * report takes no parameters, so the inner component reads nothing from
 * `attributes`.
 */
export default function MostPopularTime( { attributes = {} }: MostPopularTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostPopularTimeReport />
		</WidgetRoot>
	);
}
