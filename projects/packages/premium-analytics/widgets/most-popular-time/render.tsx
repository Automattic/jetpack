/**
 * External dependencies
 */
import { useStatsInsights, type StatsInsightsResponse } from '@jetpack-premium-analytics/data';
import {
	formatHourOfDay,
	formatMetricValue,
	formatWeekday,
} from '@jetpack-premium-analytics/formatters';
import {
	describeError,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import { scheduled } from '@wordpress/icons';
import { Stack, Text } from '@jetpack-premium-analytics/externals';
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

type HighlightProps = {
	/**
	 * The highlight label (e.g. "Best day").
	 */
	label: string;
	/**
	 * The peak value, already localized (e.g. "Tuesday" or "3 pm").
	 */
	value: string;
	/**
	 * The value's share of total views, as a whole percent (0-100).
	 */
	percent: number;
};

/**
 * A single "best day" / "best hour" highlight: a label, the peak value rendered
 * as a large display figure, and its share of total views.
 */
function Highlight( { label, value, percent }: HighlightProps ) {
	return (
		<Stack direction="column" gap="xs">
			<Text variant="heading-md" render={ <h4 /> } className={ styles.label }>
				{ label }
			</Text>
			<Text variant="heading-2xl" className={ styles.value }>
				{ value }
			</Text>
			<Text variant="body-md" className={ styles.caption }>
				{ sprintf(
					/* translators: %s is a percentage, e.g. "17%". */
					__( '%s of views', 'jetpack-premium-analytics-pkg' ),
					// The report carries whole percents; the formatter takes a fraction.
					formatMetricValue( percent / 100, 'percentage', {
						decimals: 0,
						signDisplay: 'never',
					} )
				) }
			</Text>
		</Stack>
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
	// Resolved to one nullable value so emptiness and the render read the same
	// thing; two separate guards could drift and reintroduce the
	// midnight-for-a-missing-hour reading the sanitizer removed. Compared against
	// `undefined`, not falsiness: Monday and midnight are both 0.
	const peak = useMemo( () => {
		const { dayOfWeek, hourOfDay, percent, hourPercent } = report ?? {};

		if ( dayOfWeek === undefined || hourOfDay === undefined ) {
			return null;
		}

		return { dayOfWeek, hourOfDay, percent: percent ?? 0, hourPercent: hourPercent ?? 0 };
	}, [ report ] );

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps the previous response via `placeholderData`, so only
				// surface the error when there is nothing to show.
				isError={ isError && ! peak }
				isEmpty={ ! peak }
				// Mapped rather than hand-written: a 403 from a reader without stats
				// access is not something retrying fixes, and describeError drops the
				// Retry action for it.
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load your most popular time. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={ {
					icon: scheduled,
					description: __(
						'Not enough data to determine your most popular time yet.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				{ peak && (
					<Stack className={ styles.root } direction="column" gap="lg">
						<Highlight
							label={ __( 'Best day', 'jetpack-premium-analytics-pkg' ) }
							// WordPress's locale table is Sunday-first; the endpoint's
							// index is Monday-first.
							value={ formatWeekday( ( peak.dayOfWeek + 1 ) % 7 ) }
							percent={ peak.percent }
						/>
						<Highlight
							label={ __( 'Best hour', 'jetpack-premium-analytics-pkg' ) }
							value={ formatHourOfDay( peak.hourOfDay ) }
							percent={ peak.hourPercent }
						/>
					</Stack>
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
