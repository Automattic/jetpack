/**
 * External dependencies
 */
import {
	useStatsEmailOpensBreakdown,
	useStatsEmailClicksBreakdown,
	toPostId,
	type StatsEmailBreakdown,
} from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	MetricTileGridSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { envelope, link, people, percent, seen, send } from '@wordpress/icons';
import { Icon, Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type EmailMetric, type EmailTopRowAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// The all-time per-post rate breakdown ignores the date range, but the host may
// still inject report params via `attributes`, so accept them here.
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
 * The tiles and the "does this summary carry email metrics" check both derive
 * from this shape, so they cannot drift.
 */
type EmailMetricSpec = {
	/** Scalar key on the rate summary, also the tile's stable key. */
	key: string;
	icon: TileIcon;
	/** Deferred so the translation runs at render time. */
	label: () => string;
	/**
	 * Counts are read with a zero default; rates pass through 0–1 fractions and
	 * collapse missing/zero to `null` for the placeholder.
	 */
	kind: 'count' | 'rate';
	views: readonly EmailMetric[];
	/** Upstream hides Unique opens when its count is zero. */
	hideWhenZero?: boolean;
};

/**
 * The top-row tiles, in display order. Total opens comes from the opens rate
 * summary, so the Clicks composition merges the opens and clicks rate summaries
 * before they reach this table.
 */
const EMAIL_METRICS: readonly EmailMetricSpec[] = [
	{
		key: 'total_sends',
		icon: send,
		label: () => __( 'Emails sent', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens' ],
	},
	{
		key: 'unique_opens',
		icon: people,
		label: () => __( 'Unique opens', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens' ],
		hideWhenZero: true,
	},
	{
		key: 'total_opens',
		icon: seen,
		label: () => __( 'Total opens', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens', 'clicks' ],
	},
	{
		key: 'opens_rate',
		icon: percent,
		label: () => __( 'Open rate', 'jetpack-premium-analytics-pkg' ),
		kind: 'rate',
		views: [ 'opens' ],
	},
	{
		key: 'total_clicks',
		icon: link,
		label: () => __( 'Total clicks', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'clicks' ],
	},
	{
		key: 'clicks_rate',
		icon: percent,
		label: () => __( 'Click rate', 'jetpack-premium-analytics-pkg' ),
		kind: 'rate',
		views: [ 'clicks' ],
	},
];

export type EmailTopRowMetric = {
	key: string;
	icon: TileIcon;
	label: string;
	/**
	 * Counts are integers; rates are fractions (0–1). `null` marks a rate the
	 * email doesn't have yet, rendered as a placeholder.
	 */
	value: number | null;
	dataFormat: DataFormat;
};

function readCount( summary: EmailRateSummary, key: string ): number {
	const value = Number( summary[ key ] );

	return Number.isFinite( value ) ? value : 0;
}

/**
 * The endpoint returns rates as 0–1 fractions, which the percentage formatter
 * takes as-is. A missing or zero rate returns `null` so the tile renders the
 * grid's placeholder instead of "0%", mirroring the Jetpack Stats top row.
 */
function readRate( summary: EmailRateSummary, key: string ): number | null {
	const value = Number( summary[ key ] );

	return Number.isFinite( value ) && value !== 0 ? value : null;
}

/**
 * Distinguishes a real (possibly all-zero) email from an empty response, so the
 * widget shows its empty state rather than a row of zeros.
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

/**
 * The view is known before the summaries are, so this is the count the loading
 * shape can draw; `hideWhenZero` may still drop one once the data lands.
 */
function countEmailTopRowTiles( metric: EmailMetric ): number {
	return EMAIL_METRICS.filter( spec => spec.views.includes( metric ) ).length;
}

type EmailTopRowTilesProps = {
	metrics?: EmailTopRowMetric[];
	/** Tiles the active view will show, so the loading shape draws the row coming. */
	tileCount?: number;
	/** `false` prompts to select an email instead of "no stats yet". */
	hasSelection?: boolean;
	isLoading?: boolean;
	isFetching?: boolean;
	isError?: boolean;
	onRetry?: () => void;
};

/**
 * The rate breakdowns have no comparison period, so each tile shows a bare
 * formatted value with no delta.
 */
const EmailTopRowTiles = ( {
	metrics,
	tileCount,
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
							'jetpack-premium-analytics-pkg'
						),
						actions: onRetry
							? [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: onRetry } ]
							: undefined,
					} }
					empty={ {
						icon: envelope,
						description: hasSelection
							? __( 'No stats are available for this email yet.', 'jetpack-premium-analytics-pkg' )
							: __( 'Select an email to see its stats.', 'jetpack-premium-analytics-pkg' ),
					} }
					renderLoading={ <MetricTileGridSkeleton tiles={ tileCount } /> }
				>
					<MetricTileGrid tiles={ metrics ?? [] } />
				</WidgetState>
			</div>
		</Stack>
	);
};

type EmailTopRowReportProps = {
	metric: EmailMetric;
};

/**
 * The email is scoped by the host through `reportParams.post_id` — the shared
 * single-resource "detail page" param. Both views read the opens rate endpoint,
 * and React Query shares that result, so visiting both tabs fetches it once.
 */
function EmailTopRowReport( { metric }: EmailTopRowReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const hasSelection = postId > 0;

	// Both hooks are called every render (hooks rule). Opens supplies the
	// total-opens context in both views; Clicks only runs for the Clicks view.
	const opens = useStatsEmailOpensBreakdown( postId, 'rate', {
		enabled: hasSelection,
	} );
	const clicks = useStatsEmailClicksBreakdown( postId, 'rate', {
		enabled: hasSelection && metric === 'clicks',
	} );
	const activeQueries = metric === 'clicks' ? [ opens, clicks ] : [ opens ];
	const opensSummary = ( opens.data as StatsEmailBreakdown | undefined )?.summary;
	const clicksSummary = ( clicks.data as StatsEmailBreakdown | undefined )?.summary;
	const hasResolvedRequiredData = activeQueries.every( query => query.data !== undefined );
	const metrics = useMemo( () => {
		if ( ! hasResolvedRequiredData ) {
			return undefined;
		}

		const summary =
			metric === 'clicks' && opensSummary && clicksSummary
				? { ...opensSummary, ...clicksSummary }
				: opensSummary;

		return hasEmailMetrics( summary ) ? toEmailTopRowMetrics( summary!, metric ) : undefined;
	}, [ hasResolvedRequiredData, opensSummary, clicksSummary, metric ] );

	const retryActiveQueries = useCallback( () => {
		opens.refetch();
		if ( metric === 'clicks' ) {
			clicks.refetch();
		}
	}, [ clicks, metric, opens ] );

	return (
		<EmailTopRowTiles
			metrics={ metrics }
			tileCount={ countEmailTopRowTiles( metric ) }
			hasSelection={ hasSelection }
			isLoading={ activeQueries.some( query => query.isLoading ) }
			isFetching={ activeQueries.some( query => query.isFetching ) }
			// `placeholderData` keeps complete tiles visible through a transient refetch
			// failure; a first-load failure must not render a partial Clicks row.
			isError={ activeQueries.some( query => query.isError && query.data === undefined ) }
			onRetry={ retryActiveQueries }
		/>
	);
}

export default function EmailTopRow( { attributes = {} }: EmailTopRowWidgetProps ) {
	const metric: EmailMetric = attributes.metric === 'clicks' ? 'clicks' : 'opens';

	return (
		<WidgetRoot attributes={ attributes }>
			<EmailTopRowReport metric={ metric } />
		</WidgetRoot>
	);
}
