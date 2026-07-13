/**
 * External dependencies
 */
import {
	useStatsEmailOpensBreakdown,
	useStatsEmailClicksBreakdown,
	type StatsEmailBreakdown,
} from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chartBar, envelope, link, people, percent, seen, send } from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type EmailMetric, type EmailTopRowAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are dashboard-driven, but this widget reads the all-time per-post
// rate breakdown and ignores the date range. The host (and Storybook) may still
// inject them via `attributes`, so accept them here.
type EmailTopRowRenderAttributes = EmailTopRowAttributes & Partial< ReportParamsFieldAttributes >;
type EmailTopRowWidgetProps = WidgetRenderProps< EmailTopRowRenderAttributes >;

// The scalar summary of a per-post `stats/<opens|clicks>/emails/<postId>/rate` breakdown.
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

/**
 * One row of the metric table below: everything that describes a top-row tile —
 * its summary key, icon, label, whether it is a count or a rate, and which
 * view(s) it belongs to. The tiles and the "does this summary carry email
 * metrics" check both derive from the same table, so they cannot drift.
 */
type EmailMetricSpec = {
	/**
	 * The scalar key on the rate summary, also used as the tile's stable key.
	 */
	key: string;
	/**
	 * Icon shown alongside the label.
	 */
	icon: TileIcon;
	/**
	 * Builds the translated label (deferred so it runs at render time).
	 */
	label: () => string;
	/**
	 * Counts are read with a zero default; rates convert 0–100 to a fraction and
	 * collapse missing/zero to `null` for the placeholder.
	 */
	kind: 'count' | 'rate';
	/**
	 * Which view(s) show this tile, in table order.
	 */
	views: readonly EmailMetric[];
	/**
	 * Skip the tile when its count is zero (upstream hides Unique opens then).
	 */
	hideWhenZero?: boolean;
};

/**
 * The single source of truth for the top-row tiles, in display order. Mirrors
 * the Jetpack Stats "Email top row": the Opens view shows total sends, unique
 * opens (hidden when zero, as upstream does), total opens, and open rate; the
 * Clicks view shows total opens, total clicks, and click rate. The endpoint
 * drops the keys that don't apply to its view, so presence of any of these keys
 * signals real data (see `hasEmailMetrics`).
 */
const EMAIL_METRICS: readonly EmailMetricSpec[] = [
	{
		key: 'total_sends',
		icon: send,
		label: () => __( 'Total emails sent', 'jetpack-premium-analytics' ),
		kind: 'count',
		views: [ 'opens' ],
	},
	{
		key: 'unique_opens',
		icon: people,
		label: () => __( 'Unique opens', 'jetpack-premium-analytics' ),
		kind: 'count',
		views: [ 'opens' ],
		hideWhenZero: true,
	},
	{
		key: 'total_opens',
		icon: seen,
		label: () => __( 'Total opens', 'jetpack-premium-analytics' ),
		kind: 'count',
		views: [ 'opens', 'clicks' ],
	},
	{
		key: 'opens_rate',
		icon: percent,
		label: () => __( 'Open rate', 'jetpack-premium-analytics' ),
		kind: 'rate',
		views: [ 'opens' ],
	},
	{
		key: 'total_clicks',
		icon: link,
		label: () => __( 'Total clicks', 'jetpack-premium-analytics' ),
		kind: 'count',
		views: [ 'clicks' ],
	},
	{
		key: 'clicks_rate',
		icon: chartBar,
		label: () => __( 'Click rate', 'jetpack-premium-analytics' ),
		kind: 'rate',
		views: [ 'clicks' ],
	},
];

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
 * rate so the tile renders the grid's placeholder ("—") instead of "0%". Mirrors
 * the Jetpack Stats top row, which renders "-" for a missing or zero rate: in
 * wp-calypso, `client/my-sites/stats/stats-email-top-row/index.jsx` passes
 * `counts?.opens_rate ? … : null` (a truthy check, so 0 becomes null) and
 * `top-card.jsx` renders a null value as "-".
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
		EMAIL_METRICS.some( spec => {
			const value = summary[ spec.key ];

			return value !== undefined && value !== null && Number.isFinite( Number( value ) );
		} )
	);
}

/**
 * Maps a per-post rate summary onto the ordered top-row tiles for the active
 * view, straight from the `EMAIL_METRICS` table.
 *
 * @param summary - The selected email's rate summary.
 * @param metric  - Which view's tiles to build.
 * @return The ordered metric tiles.
 */
export function toEmailTopRowMetrics(
	summary: EmailRateSummary,
	metric: EmailMetric
): EmailTopRowMetric[] {
	const tiles: EmailTopRowMetric[] = [];

	for ( const spec of EMAIL_METRICS ) {
		if ( ! spec.views.includes( metric ) ) {
			continue;
		}

		const value =
			spec.kind === 'rate' ? readRate( summary, spec.key ) : readCount( summary, spec.key );

		if ( spec.hideWhenZero && ! value ) {
			continue;
		}

		tiles.push( {
			key: spec.key,
			icon: spec.icon,
			label: spec.label(),
			value,
			dataFormat: spec.kind === 'rate' ? RATE_FORMAT : COUNT_FORMAT,
		} );
	}

	return tiles;
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
 * error, and empty states to `<WidgetState>`. The rate breakdowns have no
 * comparison period, so each tile shows a bare formatted value with no delta.
 *
 * @param {EmailTopRowTilesProps} props - The component props.
 * @return The rendered top row.
 */
const EmailTopRowTiles = ( {
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
					<MetricTileGrid tiles={ metrics ?? [] } />
				</WidgetState>
			</div>
		</Stack>
	);
};

/**
 * Resolves the email's post ID from the host-composed report params. `post_id`
 * is typed `string | number` (a string when it comes straight from the URL), so
 * it is coerced to a positive integer; anything else yields `0`, which the
 * widget treats as "no email selected".
 *
 * @param postId - The `post_id` report param.
 * @return The email's post ID, or `0` when none is set.
 */
function toPostId( postId: string | number | undefined ): number {
	const parsed = typeof postId === 'number' ? postId : Number.parseInt( postId ?? '', 10 );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : 0;
}

type EmailTopRowReportProps = {
	/**
	 * Which view's metrics to fetch and show.
	 */
	metric: EmailMetric;
};

/**
 * Fetches the selected email's all-time rate breakdown for the active view and
 * hands its metrics to `EmailTopRowTiles`. The email is scoped by the host
 * through `reportParams.post_id` — the shared single-resource "detail page"
 * param — so the widget needs no id attribute of its own. The Opens and Clicks
 * views each read their own per-post `stats/<opens|clicks>/emails/<postId>/rate`
 * endpoint — the same source the Jetpack Stats top row uses — so the widget
 * resolves a specific email by ID rather than scanning a summary list, and it
 * works for any email regardless of how recently it was sent. Only the active
 * view's request runs.
 *
 * @param {EmailTopRowReportProps} props - The component props.
 * @return The widget content.
 */
function EmailTopRowReport( { metric }: EmailTopRowReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const hasSelection = postId > 0;

	// Both hooks are called every render (hooks rule); only the active view's
	// query is enabled, so a single request runs.
	const opens = useStatsEmailOpensBreakdown( postId, 'rate', {
		enabled: hasSelection && metric === 'opens',
	} );
	const clicks = useStatsEmailClicksBreakdown( postId, 'rate', {
		enabled: hasSelection && metric === 'clicks',
	} );
	const active = metric === 'clicks' ? clicks : opens;

	const summary = ( active.data as StatsEmailBreakdown | undefined )?.summary;
	const metrics = useMemo(
		() => ( hasEmailMetrics( summary ) ? toEmailTopRowMetrics( summary!, metric ) : undefined ),
		[ summary, metric ]
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
 * The email is selected by the host through `reportParams.post_id` (the shared
 * single-resource "detail page" scope) and the view by the `metric` attribute
 * (defaulting to Opens). Host attributes (including `reportParams`) are passed
 * through to `<WidgetRoot>`, which exposes `reportParams` to the inner report;
 * the all-time rate breakdown ignores the date range but reads the single-email
 * scope from `post_id`.
 *
 * @param {EmailTopRowWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function EmailTopRow( { attributes = {} }: EmailTopRowWidgetProps ) {
	const metric: EmailMetric = attributes.metric === 'clicks' ? 'clicks' : 'opens';

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailTopRowReport metric={ metric } />
		</WidgetRoot>
	);
}
