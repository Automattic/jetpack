/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummary } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
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
	 * Normalized email rows to render. When omitted, the empty state is shown
	 * (unless `isLoading` is set).
	 */
	rows?: EmailRow[];
	/**
	 * When `true` and there are no rows yet, the full loading overlay is shown.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, an in-place chart spinner is shown over existing rows during a
	 * background refetch. Unlike `isLoading`, this stays `true` while stale data
	 * is on screen.
	 */
	isFetching?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the chart.
	 */
	isError?: boolean;
	/**
	 * Which rate to display. Defaults to `opens`.
	 */
	metric?: EmailMetric;
};

/**
 * Presentational leaderboard for the "Emails" widget. Lists the most recently
 * sent emails with their open or click rate.
 *
 * Takes already-fetched rows and the active metric via props and owns only the
 * loading, error, empty, and populated states. Exported so Storybook can
 * exercise those states with fixture rows (there is no analytics backend in
 * Storybook, so the data-connected entry point would only ever show chrome).
 *
 * @param {EmailsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const EmailsLeaderboard = ( {
	rows = [],
	isLoading = false,
	isFetching = false,
	isError = false,
	metric = 'opens',
}: EmailsLeaderboardProps ) => {
	const data = useMemo( () => buildLeaderboardData( rows, metric ), [ rows, metric ] );

	let body;
	if ( isError ) {
		body = (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Unable to load email stats.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	} else if ( isLoading && rows.length === 0 ) {
		body = <WidgetLoadingOverlay />;
	} else {
		body = (
			<LeaderboardChart
				className={ styles.leaderboard }
				data={ data }
				loading={ isFetching }
				withComparison={ false }
				withOverlayLabel
				showLegend={ false }
				emptyStateText={ __(
					'Your latest emails will appear here once you send a newsletter.',
					'jetpack-premium-analytics'
				) }
				dataFormat={ {
					type: 'percentage',
					options: { decimals: 2, signDisplay: 'never' },
				} }
			/>
		);
	}

	return <div className={ styles.root }>{ body }</div>;
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
 * hook and hands the normalized rows to the presentational `EmailsLeaderboard`.
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

	const { data, isLoading, isFetching, isError } = useStatsEmailSummary( { quantity } );

	const rows = useMemo( () => toEmailRows( data, max ), [ data, max ] );

	return (
		<EmailsLeaderboard
			rows={ rows }
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
			metric={ metric }
		/>
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
