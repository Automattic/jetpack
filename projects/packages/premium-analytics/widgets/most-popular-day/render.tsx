/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	describeError,
	HighlightField,
	HighlightGroup,
	summaryCount,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, VisuallyHidden } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { MostPopularDayAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The highlight is site-wide and ignores report params, but the host may still
// inject them via `attributes`, so the shape has to accept them.
type MostPopularDayRenderAttributes = MostPopularDayAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostPopularDayWidgetProps = WidgetRenderProps< MostPopularDayRenderAttributes >;

type MostPopularDayHighlightProps = {
	/** The all-time best day for views. */
	date: Date;
	views: number;
	/** Fraction (0–1) of all-time views, or `undefined` with no all-time total. */
	share?: number;
};

// `decimals: 0` would round 102,631 to "103K"; the design's headline keeps the
// digit ("102.6K"). Below the first multiplier it is always ".0", so use plain there.
const ABBREVIATED_COUNT_OPTIONS = { useMultipliers: true, decimals: 1 };
const PLAIN_COUNT_OPTIONS = { decimals: 0 };

/**
 * Presentational body for the "Most popular day" widget. Loading / error / empty
 * are handled by `<WidgetState>` in the report component.
 */
export const MostPopularDayHighlight = ( { date, views, share }: MostPopularDayHighlightProps ) => {
	const fullViews = formatMetricValue( views, 'number', PLAIN_COUNT_OPTIONS );
	const headlineViews = formatMetricValue(
		views,
		'number',
		views >= 1000 ? ABBREVIATED_COUNT_OPTIONS : PLAIN_COUNT_OPTIONS
	);

	return (
		<HighlightGroup>
			<HighlightField
				label={ __( 'Day', 'jetpack-premium-analytics-pkg' ) }
				value={ formatDate( date, 'short' ) }
				caption={ formatDate( date, 'year' ) }
			/>
			<HighlightField
				label={ __( 'Views', 'jetpack-premium-analytics-pkg' ) }
				// An abbreviated headline is read aloud as "102.6 K", so the exact
				// count is what reaches a screen reader.
				value={
					headlineViews === fullViews ? (
						headlineViews
					) : (
						<>
							<span aria-hidden="true">{ headlineViews }</span>
							<VisuallyHidden>{ fullViews }</VisuallyHidden>
						</>
					)
				}
				valueTitle={ fullViews }
				// A summary without an all-time total gives no share to state; "0% of
				// views" would read as a measurement rather than a missing one.
				caption={
					share === undefined
						? undefined
						: sprintf(
								/* translators: %s is a percentage, e.g. "0.32%". */
								__( '%s of views', 'jetpack-premium-analytics-pkg' ),
								formatMetricValue( share, 'percentage', { decimals: 2, signDisplay: 'never' } )
						  )
				}
			/>
		</HighlightGroup>
	);
};

function readBestDay( summary: Record< string, unknown > | undefined ) {
	return parseSiteDateTime( summary?.views_best_day );
}

/**
 * Fetches the site stats summary through `useStatsSite` and hands the all-time
 * "best day" fields to the presentational `MostPopularDayHighlight`. The
 * summary is site-wide, so it does not read the dashboard date range.
 */
function MostPopularDayReport() {
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsSite();

	const summary = data?.stats;
	const date = readBestDay( summary );
	const views = summaryCount( summary, 'views_best_day_total' );
	const totalViews = summaryCount( summary, 'views' );
	// A best day that drew no views is the empty state the copy describes, not a
	// measurement of zero — `summaryCount` reports a present `0` as a number.
	const isEmpty = date === undefined || ! views;

	return (
		<Stack className={ styles.root } direction="column">
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// The query keeps the previous response via `placeholderData`, so only
					// surface the error when there is nothing to show.
					isError={ isError && isEmpty }
					isEmpty={ isEmpty }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load your most popular day. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: () => void refetch(),
					} ) }
					empty={ {
						icon: calendar,
						description: __(
							'Not enough views yet to pick a most popular day.',
							'jetpack-premium-analytics-pkg'
						),
					} }
				>
					{ date !== undefined && views !== undefined && (
						<MostPopularDayHighlight
							date={ date }
							views={ views }
							share={ totalViews ? views / totalViews : undefined }
						/>
					) }
				</WidgetState>
			</div>
		</Stack>
	);
}

/**
 * WidgetRoot provides the analytics query client and chart theme. Host
 * attributes are passed through for the widget contract even though this
 * highlight ignores report params.
 */
export default function MostPopularDay( { attributes = {} }: MostPopularDayWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostPopularDayReport />
		</WidgetRoot>
	);
}
