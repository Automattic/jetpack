/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	describeError,
	summaryCount,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text, VisuallyHidden } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { MostPopularDayAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ReactNode } from 'react';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but this highlight is site-wide and ignores them. The host (and
// Storybook) may still inject them via `attributes`, so accept them here.
type MostPopularDayRenderAttributes = MostPopularDayAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostPopularDayWidgetProps = WidgetRenderProps< MostPopularDayRenderAttributes >;

type MostPopularDayHighlightProps = {
	/**
	 * The all-time best day for views.
	 */
	date: Date;
	/**
	 * The number of views recorded on `date`.
	 */
	views: number;
	/**
	 * The share of all-time views that fall on `date`, as a fraction (0–1), or
	 * `undefined` when the summary carries no all-time total to divide by.
	 */
	share?: number;
};

type MostPopularDayFieldProps = {
	label: string;
	value: ReactNode;
	/** The unabbreviated value, when `value` renders a shortened form of it. */
	valueTitle?: string;
	caption?: string;
};

/**
 * A single labelled highlight: a small label, the prominent value, and a muted
 * caption beneath it (e.g. "Day" / "August 18" / "2020").
 */
const MostPopularDayField = ( { label, value, valueTitle, caption }: MostPopularDayFieldProps ) => (
	<Stack direction="column" gap="xs">
		<Text variant="body-md">{ label }</Text>
		<Text variant="heading-2xl" title={ valueTitle }>
			{ value }
		</Text>
		{ caption !== undefined && (
			<Text variant="body-md" className={ styles.caption }>
				{ caption }
			</Text>
		) }
	</Stack>
);

// `decimals: 0` would round 102,631 to "103K"; the design's headline keeps the
// digit ("102.6K"). Below the first multiplier that digit is only ever ".0", so
// the count renders whole there — the same split Total views makes.
const ABBREVIATED_COUNT_OPTIONS = { useMultipliers: true, decimals: 1 };
const PLAIN_COUNT_OPTIONS = { decimals: 0 };

/**
 * Presentational body for the "Most popular day" widget: the all-time best day
 * for views and how many views it drew. Loading / error / empty are handled by
 * `<WidgetState>` in the report component, so this only renders the populated
 * highlight.
 */
export const MostPopularDayHighlight = ( { date, views, share }: MostPopularDayHighlightProps ) => {
	const fullViews = formatMetricValue( views, 'number', PLAIN_COUNT_OPTIONS );
	const headlineViews = formatMetricValue(
		views,
		'number',
		views >= 1000 ? ABBREVIATED_COUNT_OPTIONS : PLAIN_COUNT_OPTIONS
	);

	return (
		<Stack className={ styles.highlight } direction="column" gap="xl" justify="center">
			<MostPopularDayField
				label={ __( 'Day', 'jetpack-premium-analytics-pkg' ) }
				value={ formatDate( date, 'short' ) }
				caption={ formatDate( date, 'year' ) }
			/>
			<MostPopularDayField
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
		</Stack>
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
	const isEmpty = date === undefined || views === undefined;

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
