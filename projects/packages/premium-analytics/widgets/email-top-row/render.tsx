/**
 * External dependencies
 */
import {
	useStatsEmailOpensBreakdown,
	useStatsEmailClicksBreakdown,
	type StatsEmailBreakdown,
} from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chartBar, envelope, link, people, percent, seen, send } from '@wordpress/icons';
import { Icon, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type EmailStatType, type EmailTopRowAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are dashboard-driven, but this widget reads the all-time per-post
// rate breakdown and ignores the date range. The host (and Storybook) may still
// inject them via `attributes`, so accept them here.
type EmailTopRowRenderAttributes = EmailTopRowAttributes & Partial< ReportParamsFieldAttributes >;
type EmailTopRowWidgetProps = WidgetRenderProps< EmailTopRowRenderAttributes >;

// The scalar summary of a per-post `stats/<statType>/emails/<postId>/rate` breakdown.
type EmailRateSummary = StatsEmailBreakdown[ 'summary' ];

type TileIcon = ComponentProps< typeof Icon >[ 'icon' ];

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const RATE_FORMAT: DataFormat = {
	type: 'percentage',
	options: { decimals: 1, signDisplay: 'never' },
};

// Shown in place of a rate tile when the email has no rate yet (mirrors the
// Jetpack Stats top row, which renders "-" for a missing or zero rate).
const NO_RATE_PLACEHOLDER = '—';

// The scalar keys a `rate` breakdown may carry. The endpoint drops the keys that
// don't apply to its stat type, so presence of any of these signals real data.
const EMAIL_METRIC_KEYS = [
	'total_sends',
	'total_opens',
	'unique_opens',
	'opens_rate',
	'total_clicks',
	'clicks_rate',
] as const;

/**
 * A single top-row tile: an icon, a label, and the formatted metric value.
 */
export type EmailTopRowMetric = {
	/**
	 * Stable key for the tile.
	 */
	key: string;
	/**
	 * Icon shown alongside the label.
	 */
	icon: TileIcon;
	/**
	 * Label shown next to the icon (e.g. "Total opens").
	 */
	label: string;
	/**
	 * The value to render. Counts are integers; rates are fractions (0–1). `null`
	 * marks a rate the email doesn't have yet, rendered as a placeholder.
	 */
	value: number | null;
	/**
	 * How to format the value.
	 */
	dataFormat: DataFormat;
};

/**
 * Reads a count field off a rate summary, defaulting a missing or non-numeric
 * value to 0.
 *
 * @param summary - The email rate summary.
 * @param key     - The count field to read.
 * @return The count.
 */
function readCount( summary: EmailRateSummary, key: string ): number {
	const value = Number( summary[ key ] );

	return Number.isFinite( value ) ? value : 0;
}

/**
 * Reads a rate field (0–100 percentage) off a rate summary and converts it to a
 * fraction for the percentage formatter. Returns `null` for a missing or zero
 * rate so the tile can render the placeholder, matching the Jetpack Stats top row.
 *
 * @param summary - The email rate summary.
 * @param key     - The rate field to read.
 * @return The rate as a fraction (0–1), or `null` when unavailable.
 */
function readRate( summary: EmailRateSummary, key: string ): number | null {
	const value = Number( summary[ key ] );

	return Number.isFinite( value ) && value !== 0 ? value / 100 : null;
}

/**
 * Whether a rate summary carries any of the email metric fields. Distinguishes a
 * real (possibly all-zero) email from an empty response for a post that has no
 * stats, so the widget can show its empty state rather than a row of zeros.
 *
 * @param summary - The email rate summary, or undefined while loading.
 * @return Whether the summary holds email metrics.
 */
export function hasEmailMetrics( summary: EmailRateSummary | undefined ): boolean {
	return (
		!! summary &&
		EMAIL_METRIC_KEYS.some( key => {
			const value = summary[ key ];

			return value !== undefined && value !== null && Number.isFinite( Number( value ) );
		} )
	);
}

/**
 * Maps a per-post rate summary onto the ordered top-row tiles for the active
 * view. Mirrors the Jetpack Stats "Email top row": the Opens view shows total
 * sends, unique opens (hidden when zero, as upstream does), total opens, and
 * open rate; the Clicks view shows total opens, total clicks, and click rate.
 *
 * @param summary  - The selected email's rate summary.
 * @param statType - Which view's tiles to build.
 * @return The ordered metric tiles.
 */
export function toEmailTopRowMetrics(
	summary: EmailRateSummary,
	statType: EmailStatType
): EmailTopRowMetric[] {
	if ( statType === 'clicks' ) {
		return [
			{
				key: 'total_opens',
				icon: seen,
				label: __( 'Total opens', 'jetpack-premium-analytics' ),
				value: readCount( summary, 'total_opens' ),
				dataFormat: COUNT_FORMAT,
			},
			{
				key: 'total_clicks',
				icon: link,
				label: __( 'Total clicks', 'jetpack-premium-analytics' ),
				value: readCount( summary, 'total_clicks' ),
				dataFormat: COUNT_FORMAT,
			},
			{
				key: 'clicks_rate',
				icon: chartBar,
				label: __( 'Click rate', 'jetpack-premium-analytics' ),
				value: readRate( summary, 'clicks_rate' ),
				dataFormat: RATE_FORMAT,
			},
		];
	}

	const tiles: EmailTopRowMetric[] = [
		{
			key: 'total_sends',
			icon: send,
			label: __( 'Total emails sent', 'jetpack-premium-analytics' ),
			value: readCount( summary, 'total_sends' ),
			dataFormat: COUNT_FORMAT,
		},
		{
			key: 'unique_opens',
			icon: people,
			label: __( 'Unique opens', 'jetpack-premium-analytics' ),
			value: readCount( summary, 'unique_opens' ),
			dataFormat: COUNT_FORMAT,
		},
		{
			key: 'total_opens',
			icon: seen,
			label: __( 'Total opens', 'jetpack-premium-analytics' ),
			value: readCount( summary, 'total_opens' ),
			dataFormat: COUNT_FORMAT,
		},
		{
			key: 'opens_rate',
			icon: percent,
			label: __( 'Open rate', 'jetpack-premium-analytics' ),
			value: readRate( summary, 'opens_rate' ),
			dataFormat: RATE_FORMAT,
		},
	];

	// Upstream hides the Unique opens tile when there are no unique opens.
	return tiles.filter(
		tile => tile.key !== 'unique_opens' || readCount( summary, 'unique_opens' ) > 0
	);
}

type EmailTopRowTilesProps = {
	/**
	 * The ordered metric tiles to render. When omitted, the empty state is shown
	 * (unless the widget is loading or in error).
	 */
	metrics?: EmailTopRowMetric[];
	/**
	 * Whether an email is selected. Drives the empty-state message: a prompt to
	 * select an email when `false`, or a "no stats yet" message when `true`.
	 */
	hasSelection?: boolean;
	/**
	 * First load with no data yet — shows the loading overlay.
	 */
	isLoading?: boolean;
	/**
	 * Background refetch with data shown — a non-blocking busy overlay.
	 */
	isFetching?: boolean;
	/**
	 * Whether the request failed — shows the error state.
	 */
	isError?: boolean;
	/**
	 * Re-runs the request from the error state's Retry action.
	 */
	onRetry?: () => void;
};

/**
 * Presentational top row for the "Email top row" widget. Renders the selected
 * email's headline totals as bordered metric tiles and delegates the loading,
 * error, and empty states to `<WidgetState>`. Exported so Storybook and tests can
 * exercise it with fixture metrics. The rate breakdowns have no comparison period,
 * so each tile shows a bare formatted value with no delta.
 *
 * @param {EmailTopRowTilesProps} props - The component props.
 * @return The rendered top row.
 */
export const EmailTopRowTiles = ( {
	metrics,
	hasSelection = false,
	isLoading = false,
	isFetching = false,
	isError = false,
	onRetry,
}: EmailTopRowTilesProps ) => {
	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ ! metrics || metrics.length === 0 }
					error={ {
						description: __(
							"We couldn't load this email's stats. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: onRetry
							? [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: onRetry } ]
							: undefined,
					} }
					empty={ {
						icon: envelope,
						description: hasSelection
							? __( 'No stats are available for this email yet.', 'jetpack-premium-analytics' )
							: __( 'Select an email to see its stats.', 'jetpack-premium-analytics' ),
					} }
				>
					<div className={ styles.grid }>
						{ metrics?.map( metric => (
							<div key={ metric.key } className={ styles.tile }>
								<div className={ styles.tileHeader }>
									<Icon icon={ metric.icon } size={ 24 } className={ styles.tileIcon } />
									<Text className={ styles.tileLabel }>{ metric.label }</Text>
								</div>
								{ metric.value === null ? (
									<Text className={ styles.tilePlaceholder }>{ NO_RATE_PLACEHOLDER }</Text>
								) : (
									<MetricWithComparison
										value={ metric.value }
										dataFormat={ metric.dataFormat }
										fontSize="xl"
										className={ styles.tileValue }
									/>
								) }
							</div>
						) ) }
					</div>
				</WidgetState>
			</div>
		</Stack>
	);
};

type EmailTopRowReportProps = {
	/**
	 * The selected email's post ID.
	 */
	postId?: number;
	/**
	 * Which view's metrics to fetch and show.
	 */
	statType: EmailStatType;
};

/**
 * Fetches the selected email's all-time rate breakdown for the active view and
 * hands its metrics to `EmailTopRowTiles`. The Opens and Clicks views each read
 * their own per-post `stats/<statType>/emails/<postId>/rate` endpoint — the same
 * source the Jetpack Stats top row uses — so the widget resolves a specific email
 * by ID rather than scanning a summary list, and it works for any email
 * regardless of how recently it was sent. Only the active view's request runs.
 *
 * @param {EmailTopRowReportProps} props - The component props.
 * @return The widget content.
 */
function EmailTopRowReport( { postId, statType }: EmailTopRowReportProps ) {
	const hasSelection = Number.isInteger( postId ) && ( postId ?? 0 ) > 0;
	const safePostId = hasSelection ? ( postId as number ) : 0;

	// Both hooks are called every render (hooks rule); only the active view's
	// query is enabled, so a single request runs.
	const opens = useStatsEmailOpensBreakdown( safePostId, 'rate', {
		enabled: hasSelection && statType === 'opens',
	} );
	const clicks = useStatsEmailClicksBreakdown( safePostId, 'rate', {
		enabled: hasSelection && statType === 'clicks',
	} );
	const active = statType === 'clicks' ? clicks : opens;

	const summary = ( active.data as StatsEmailBreakdown | undefined )?.summary;
	const metrics = useMemo(
		() => ( hasEmailMetrics( summary ) ? toEmailTopRowMetrics( summary!, statType ) : undefined ),
		[ summary, statType ]
	);

	return (
		<EmailTopRowTiles
			metrics={ metrics }
			hasSelection={ hasSelection }
			isLoading={ active.isLoading }
			isFetching={ active.isFetching }
			isError={ active.isError }
			onRetry={ active.refetch }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * The email is selected by the `postId` attribute and the view by `statType`
 * (defaulting to Opens), both supplied by the host. Host attributes (including
 * `reportParams`) are passed through to `<WidgetRoot>` for the widget contract
 * even though the all-time rate breakdown ignores the date range.
 *
 * @param {EmailTopRowWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function EmailTopRow( { attributes = {} }: EmailTopRowWidgetProps ) {
	const statType: EmailStatType = attributes.statType === 'clicks' ? 'clicks' : 'opens';

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailTopRowReport postId={ attributes.postId } statType={ statType } />
		</WidgetRoot>
	);
}
