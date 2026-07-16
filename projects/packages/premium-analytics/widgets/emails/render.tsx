/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummary } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetRoot,
	WidgetState,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type EmailMetric, type EmailsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type EmailsRenderAttributes = EmailsAttributes & Partial< ReportParamsFieldAttributes >;
type EmailsWidgetProps = WidgetRenderProps< EmailsRenderAttributes >;

/**
 * A single normalized email row, flattened from the `useStatsEmailSummary`
 * report into the shape the leaderboard renders. Exported so Storybook can
 * build fixtures for `EmailsLeaderboard`.
 */
export type EmailRow = {
	/**
	 * Stable identifier for the email (post ID or, as a fallback, the array index).
	 */
	id: string | number;
	/**
	 * Email subject line.
	 */
	label: string;
	/**
	 * Open rate as a percentage (0–100).
	 */
	opensRate: number;
	/**
	 * Click rate as a percentage (0–100).
	 */
	clicksRate: number;
};

/**
 * Maps normalized email rows onto the shape `LeaderboardChart` expects. The
 * selected metric drives both the displayed value and the overlay bar width
 * (shares are relative to the highest rate in the set). The emails summary has
 * no comparison period, so the comparison fields are zeroed.
 *
 * @param rows   - The normalized email rows.
 * @param metric - Which rate to display (`opens` or `clicks`).
 * @return The leaderboard chart data.
 */
function buildLeaderboardData( rows: EmailRow[], metric: EmailMetric ): LeaderboardChartData {
	const rateOf = ( row: EmailRow ) => ( metric === 'opens' ? row.opensRate : row.clicksRate );
	// Shares are relative to the real maximum so the top row always fills, even
	// when every rate is below 1%. The `> 0` check guards the divide-by-zero.
	const maxRate = Math.max( ...rows.map( rateOf ), 0 );

	return rows.map( row => {
		const rate = rateOf( row );

		return {
			id: String( row.id ),
			label: (
				<span className={ styles.label } title={ row.label }>
					{ row.label }
				</span>
			),
			// `LeaderboardChart` formats the value as a percentage, so the rate
			// is expressed as a fraction here.
			currentValue: rate / 100,
			currentShare: maxRate > 0 ? ( rate / maxRate ) * 100 : 0,
			previousValue: 0,
			previousShare: 0,
			delta: 0,
		};
	} );
}

type EmailsLeaderboardProps = {
	/**
	 * Normalized email rows to render.
	 */
	rows?: EmailRow[];
	/**
	 * Which rate to display. Defaults to `opens`.
	 */
	metric?: EmailMetric;
};

/**
 * Presentational leaderboard for the "Emails" widget. Lists the most recently
 * sent emails with their open or click rate.
 *
 * Renders the populated (ready) state only — loading, error, and empty are
 * handled by `<WidgetState>` in the data-connected `EmailsReport`. Exported so
 * Storybook can exercise the chart with fixture rows (there is no analytics
 * backend in Storybook, so the data-connected entry point would only ever show
 * chrome).
 *
 * @param {EmailsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const EmailsLeaderboard = ( { rows = [], metric = 'opens' }: EmailsLeaderboardProps ) => {
	const data = useMemo( () => buildLeaderboardData( rows, metric ), [ rows, metric ] );

	return (
		<div className={ styles.root }>
			<LeaderboardChart
				className={ styles.leaderboard }
				data={ data }
				withComparison={ false }
				withOverlayLabel
				showLegend={ false }
				dataFormat={ {
					type: 'percentage',
					options: { decimals: 2, signDisplay: 'never' },
				} }
			/>
		</div>
	);
};

/**
 * Flatten the `useStatsEmailSummary` report into the `{ id, label, opensRate,
 * clicksRate }` rows the leaderboard renders, keeping the endpoint's
 * newest-first order and trimming to `max`.
 *
 * @param report - The normalized email-summary report, or undefined while loading.
 * @param max    - Maximum rows to display; `0` keeps all rows.
 * @return The normalized email rows.
 */
function toEmailRows( report: StatsEmailSummary | undefined, max: number ): EmailRow[] {
	const items = report?.data?.[ 0 ]?.items ?? [];

	// `quantity` already bounds the request; this slice is the Stats-widget
	// `max = 0 → all rows` convention and a guard against an over-long response.
	return items.slice( 0, max > 0 ? max : undefined ).map( ( item, index ) => ( {
		id: item.id ?? index,
		label: String( item.label ?? '' ),
		opensRate: item.opens_rate,
		clicksRate: item.clicks_rate,
	} ) );
}

type EmailsReportProps = {
	attributes?: EmailsAttributes;
};

/**
 * Fetches the email-summary report through the `useStatsEmailSummary` Stats
 * hook and hands the normalized rows to the presentational `EmailsLeaderboard`,
 * with the loading / error / empty states rendered through `<WidgetState>`.
 *
 * @param {EmailsReportProps} props - The component props.
 * @return The widget content.
 */
function EmailsReport( { attributes }: EmailsReportProps ) {
	const max = attributes?.max ?? 10;
	const metric = attributes?.metric ?? 'opens';
	// The summary endpoint accepts 1–30 rows and resets anything outside that
	// range to 10, so request its maximum when the widget wants "all rows".
	const quantity = max > 0 ? Math.min( max, 30 ) : 30;

	const { data, isLoading, isFetching, isError, refetch } = useStatsEmailSummary( { quantity } );

	const rows = useMemo( () => toEmailRows( data, max ), [ data, max ] );

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			// The query keeps the prior response via `placeholderData`, so a failed
			// refetch leaves rows on screen; only surface the error when there is
			// nothing to show.
			isError={ rows.length === 0 && isError }
			isEmpty={ rows.length === 0 }
			error={ {
				description: __(
					"We couldn't load email stats. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: envelope,
				description: __(
					'Your latest emails will appear here once you send a newsletter.',
					'jetpack-premium-analytics'
				),
			} }
		>
			<EmailsLeaderboard rows={ rows } metric={ metric } />
		</WidgetState>
	);
}

/**
 * Widget render entry point.
 *
 * The displayed rate is the `metric` attribute (`relevance: 'high'`), exposed
 * as a control by the widget host. The email summary still reads `max` from
 * props because it does not use report params.
 *
 * @param {EmailsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function Emails( { attributes = {} }: EmailsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<EmailsReport attributes={ attributes } />
		</WidgetRoot>
	);
}
