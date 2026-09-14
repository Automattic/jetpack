/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	AbbreviatedValue,
	describeError,
	summaryCount,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { MostPopularDayAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ReactNode } from 'react';

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

type MostPopularDayFieldProps = {
	label: string;
	value: ReactNode;
	caption?: string;
};

/**
 * A single labelled highlight: a small label, the prominent value, and a muted
 * caption beneath it (e.g. "Day" / "August 18" / "2020").
 */
const MostPopularDayField = ( { label, value, caption }: MostPopularDayFieldProps ) => (
	<Stack direction="column" gap="xs">
		{ /* A heading, like the Most popular time card beside it: the labels carry
		     the card's structure, so screen readers should hear it as structure. */ }
		<Text variant="heading-md" render={ <h4 /> }>
			{ label }
		</Text>
		<Text variant="heading-2xl">{ value }</Text>
		{ caption !== undefined && (
			<Text variant="body-md" className={ styles.caption }>
				{ caption }
			</Text>
		) }
	</Stack>
);

const VIEWS_FORMAT = { type: 'number' as const, options: { useMultipliers: true } };

/**
 * Presentational body for the "Most popular day" widget. Loading / error / empty
 * are handled by `<WidgetState>` in the report component.
 */
export const MostPopularDayHighlight = ( { date, views, share }: MostPopularDayHighlightProps ) => {
	return (
		<Stack className={ styles.highlight } direction="column" gap="xl" justify="center">
			<MostPopularDayField
				label={ __( 'Day', 'jetpack-premium-analytics-pkg' ) }
				value={ formatDate( date, 'short' ) }
				caption={ formatDate( date, 'year' ) }
			/>
			<MostPopularDayField
				label={ __( 'Views', 'jetpack-premium-analytics-pkg' ) }
				value={ <AbbreviatedValue value={ views } dataFormat={ VIEWS_FORMAT } /> }
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
