/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { isValid, parseISO } from 'date-fns';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { MostPopularDayAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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
	 * The share of all-time views that fall on `date`, as a fraction (0–1).
	 */
	share?: number;
};

type MostPopularDayFieldProps = {
	label: string;
	value: string;
	caption: string;
};

/**
 * A single labelled highlight: a small label, the prominent value, and a muted
 * caption beneath it (e.g. "Day" / "August 18" / "2020").
 *
 * @param {MostPopularDayFieldProps} props - The field content.
 * @return The rendered field.
 */
const MostPopularDayField = ( { label, value, caption }: MostPopularDayFieldProps ) => (
	<Stack direction="column" gap="xs">
		<Text variant="body-md">{ label }</Text>
		<Text variant="heading-2xl">{ value }</Text>
		<Text variant="body-md" className={ styles.caption }>
			{ caption }
		</Text>
	</Stack>
);

/**
 * Presentational body for the "Most popular day" widget: the all-time best day
 * for views and how many views it drew. Loading / error / empty are handled by
 * `<WidgetState>` in the report component, so this only renders the populated
 * highlight.
 *
 * @param {MostPopularDayHighlightProps} props - The component props.
 * @return The rendered highlight.
 */
export const MostPopularDayHighlight = ( {
	date,
	views,
	share = 0,
}: MostPopularDayHighlightProps ) => (
	<Stack className={ styles.highlight } direction="column" gap="xl" justify="center">
		<MostPopularDayField
			label={ __( 'Day', 'jetpack-premium-analytics' ) }
			value={ formatDate( date, 'MMMM d' ) }
			caption={ formatDate( date, 'year' ) }
		/>
		<MostPopularDayField
			label={ __( 'Views', 'jetpack-premium-analytics' ) }
			value={ formatMetricValue( views, 'number', { useMultipliers: true, decimals: 1 } ) }
			caption={ sprintf(
				/* translators: %s is a percentage, e.g. "0.32%". */
				__( '%s of views', 'jetpack-premium-analytics' ),
				formatMetricValue( share, 'percentage', { decimals: 2, signDisplay: 'never' } )
			) }
		/>
	</Stack>
);

/**
 * Reads a numeric summary field, returning `undefined` when the key is absent
 * or not a finite number, so a malformed value falls through to the empty state
 * rather than rendering a misleading `0`.
 *
 * @param {Record< string, unknown > | undefined} summary - The site summary.
 * @param {string}                                key     - The field to read.
 * @return The finite number, or undefined when unavailable.
 */
function readCount( summary: Record< string, unknown > | undefined, key: string ) {
	const value = summary?.[ key ];
	const parsed = typeof value === 'string' ? Number( value ) : value;

	return typeof parsed === 'number' && Number.isFinite( parsed ) ? parsed : undefined;
}

/**
 * Parses the best-day field (`YYYY-MM-DD`) into a date. `parseISO` validates the
 * calendar date, so `isValid` rejects the "-" / empty sentinels low-traffic
 * sites send and impossible days like `2020-02-31`, falling through to the empty
 * state. Parsed and formatted in local time, so the calendar day is stable.
 *
 * @param {Record< string, unknown > | undefined} summary - The site summary.
 * @return The best day, or undefined when unavailable.
 */
function readBestDay( summary: Record< string, unknown > | undefined ) {
	const value = summary?.views_best_day;
	if ( typeof value !== 'string' || value === '' ) {
		return undefined;
	}

	const date = parseISO( value );

	return isValid( date ) ? date : undefined;
}

/**
 * Fetches the site stats summary through `useStatsSite` and hands the all-time
 * "best day" fields to the presentational `MostPopularDayHighlight`. The
 * summary is site-wide, so it does not read the dashboard date range.
 *
 * @return The widget content.
 */
function MostPopularDayReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsSite();

	const summary = data?.stats;
	const date = readBestDay( summary );
	const views = readCount( summary, 'views_best_day_total' );
	const totalViews = readCount( summary, 'views' );
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
					error={ {
						description: __(
							"We couldn't load your most popular day. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: [
							{
								label: __( 'Retry', 'jetpack-premium-analytics' ),
								onClick: () => void refetch(),
							},
						],
					} }
					empty={ {
						icon: calendar,
						description: __(
							'Not enough views yet to pick a most popular day.',
							'jetpack-premium-analytics'
						),
					} }
				>
					{ date !== undefined && views !== undefined && (
						<MostPopularDayHighlight
							date={ date }
							views={ views }
							share={ totalViews ? views / totalViews : 0 }
						/>
					) }
				</WidgetState>
			</div>
		</Stack>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme. Host
 * attributes are passed through for the widget contract even though this
 * highlight ignores report params.
 *
 * @param {MostPopularDayWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function MostPopularDay( { attributes = {} }: MostPopularDayWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostPopularDayReport />
		</WidgetRoot>
	);
}
