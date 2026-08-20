/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummary } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	LeaderboardSkeleton,
	MetricList,
	PostTitleLink,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	usePostDetailSearch,
	type MetricListItem,
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
 * report into the shape the list renders. Exported so Storybook can build
 * fixtures for `EmailsList`.
 */
export type EmailRow = {
	/**
	 * Stable identifier for the email (post ID or, as a fallback, the array index).
	 */
	id: string | number;
	/**
	 * Post ID of the newsletter, when the report carries one.
	 */
	postId?: string | number;
	/**
	 * Public URL of the newsletter.
	 */
	link?: string | null;
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
 * The detail-page tab each metric drills into.
 */
const METRIC_SECTION: Record< EmailMetric, string > = {
	opens: 'email-opens',
	clicks: 'email-clicks',
};

type EmailsListProps = {
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
 * Presentational list for the "Emails" widget: the most recently sent emails
 * with their open or click rate.
 *
 * Rows are ordered by send date, not by rate, so they carry no bar — a bar
 * would read as a ranking the order does not express.
 *
 * Renders the populated (ready) state only — loading, error, and empty are
 * handled by `<WidgetState>` in the data-connected `EmailsReport`. Exported so
 * Storybook can exercise the list with fixture rows (there is no analytics
 * backend in Storybook, so the data-connected entry point would only ever show
 * chrome).
 */
export const EmailsList = ( { rows = [], metric = 'opens' }: EmailsListProps ) => {
	const search = usePostDetailSearch( METRIC_SECTION[ metric ] );

	const items = useMemo< MetricListItem[] >(
		() =>
			rows.map( row => {
				const rate = metric === 'clicks' ? row.clicksRate : row.opensRate;

				return {
					id: row.id,
					label: (
						<PostTitleLink
							id={ row.postId }
							label={ row.label }
							link={ row.link }
							search={ search }
							title={ row.label }
						/>
					),
					// The formatter takes a fraction and renders the percent sign,
					// trimming a trailing zero (11.5%, not 11.50%).
					value: formatMetricValue( rate / 100, 'percentage', {
						decimals: 2,
						signDisplay: 'never',
					} ),
				};
			} ),
		[ rows, metric, search ]
	);

	return <MetricList className={ styles.list } items={ items } />;
};

/**
 * Flatten the `useStatsEmailSummary` report into the `{ id, label, opensRate,
 * clicksRate }` rows the list renders, keeping the endpoint's newest-first
 * order and trimming to `max` (`max = 0` keeps all rows).
 */
function toEmailRows( report: StatsEmailSummary | undefined, max: number ): EmailRow[] {
	const items = report?.data?.[ 0 ]?.items ?? [];

	// `quantity` already bounds the request; this slice is the Stats-widget
	// `max = 0 → all rows` convention and a guard against an over-long response.
	return items.slice( 0, max > 0 ? max : undefined ).map( ( item, index ) => ( {
		id: item.id ?? index,
		postId: item.id,
		link: typeof item.link === 'string' ? item.link : null,
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
 * hook and hands the normalized rows to the presentational `EmailsList`, with
 * the loading / error / empty states rendered through `<WidgetState>`.
 */
function EmailsReport( { attributes }: EmailsReportProps ) {
	const metric = attributes?.metric ?? 'opens';

	// The summary endpoint accepts 1–30 rows and silently resets anything outside
	// that range to 10, so the shared limit has to stay inside it.
	const { data, isLoading, isFetching, isError, refetch } = useStatsEmailSummary( {
		quantity: WIDGET_ROW_LIMIT,
	} );

	const rows = useMemo( () => toEmailRows( data, WIDGET_ROW_LIMIT ), [ data ] );

	return (
		<div className={ styles.widget }>
			<div className={ styles.body }>
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
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						icon: envelope,
						description: __(
							'Your latest emails will appear here once you send a newsletter.',
							'jetpack-premium-analytics-pkg'
						),
					} }
					renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
				>
					<EmailsList rows={ rows } metric={ metric } />
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink report="emails" />
			</WidgetFooter>
		</div>
	);
}

/**
 * The displayed rate is the `metric` attribute (`relevance: 'high'`), exposed
 * as a control by the widget host.
 */
export default function Emails( { attributes = {} }: EmailsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<EmailsReport attributes={ attributes } />
		</WidgetRoot>
	);
}
