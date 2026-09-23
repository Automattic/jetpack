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
	isEmailRateKnown,
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
	kind: 'count' | 'rate';
	views: readonly EmailMetric[];
	/** The tile value; `null` renders the grid's placeholder. */
	read: ( summary: EmailRateSummary ) => number | null;
	/** Drop the tile instead of showing a placeholder. */
	isHidden?: ( summary: EmailRateSummary ) => boolean;
};

function readCount( summary: EmailRateSummary, key: string ): number | null {
	const value = summary[ key ];

	return typeof value === 'number' && Number.isFinite( value ) ? value : null;
}

/**
 * Zero sends reads as unknown: an email shown here went out, and legacy sends went
 * unrecorded.
 */
function readSends( summary: EmailRateSummary ): number | null {
	return readCount( summary, 'total_sends' ) || null;
}

/**
 * A 0–1 rate, including a real 0%, or `null` when its sends or unique count is unknown.
 */
function readRate(
	summary: EmailRateSummary,
	key: string,
	totalKey: string,
	uniqueKey: string
): number | null {
	const known = isEmailRateKnown( {
		total: readCount( summary, totalKey ) ?? 0,
		unique: readCount( summary, uniqueKey ) ?? 0,
		sends: readCount( summary, 'total_sends' ) ?? 0,
	} );

	return known ? readCount( summary, key ) : null;
}

/**
 * Matches the Jetpack Stats top row: a unique count shows when positive or when there
 * were no events at all, and hides when events exist but none were attributable.
 */
function isUniqueCountUnknown( summary: EmailRateSummary, key: string, totalKey: string ) {
	return ! ( ( readCount( summary, key ) ?? 0 ) > 0 || readCount( summary, totalKey ) === 0 );
}

/**
 * The top-row tiles, in display order, read from the opens and clicks rate summaries
 * merged together.
 */
const EMAIL_METRICS: readonly EmailMetricSpec[] = [
	{
		key: 'total_sends',
		icon: send,
		label: () => __( 'Emails sent', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens' ],
		read: readSends,
	},
	{
		key: 'unique_opens',
		icon: people,
		label: () => __( 'Unique opens', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens' ],
		read: summary => readCount( summary, 'unique_opens' ),
		isHidden: summary => isUniqueCountUnknown( summary, 'unique_opens', 'total_opens' ),
	},
	{
		key: 'total_opens',
		icon: seen,
		label: () => __( 'Total opens', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens', 'clicks' ],
		read: summary => readCount( summary, 'total_opens' ),
	},
	{
		key: 'opens_rate',
		icon: percent,
		label: () => __( 'Open rate', 'jetpack-premium-analytics-pkg' ),
		kind: 'rate',
		views: [ 'opens' ],
		read: summary => readRate( summary, 'opens_rate', 'total_opens', 'unique_opens' ),
	},
	{
		key: 'total_clicks',
		icon: link,
		label: () => __( 'Total clicks', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'clicks' ],
		read: summary => readCount( summary, 'total_clicks' ),
	},
	{
		key: 'clicks_rate',
		icon: percent,
		label: () => __( 'Click rate', 'jetpack-premium-analytics-pkg' ),
		kind: 'rate',
		views: [ 'clicks' ],
		read: summary => readRate( summary, 'clicks_rate', 'total_clicks', 'unique_clicks' ),
	},
];

export type EmailTopRowMetric = {
	key: string;
	icon: TileIcon;
	label: string;
	/** Counts are integers; rates are 0–1 fractions; `null` is unknown. */
	value: number | null;
	dataFormat: DataFormat;
};

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
	return EMAIL_METRICS.filter(
		spec => spec.views.includes( metric ) && ! spec.isHidden?.( summary )
	).map( spec => ( {
		key: spec.key,
		icon: spec.icon,
		label: spec.label(),
		value: spec.read( summary ),
		dataFormat: spec.kind === 'rate' ? RATE_FORMAT : COUNT_FORMAT,
	} ) );
}

/**
 * The view is known before the summaries are, so this is the count the loading
 * shape can draw; `isHidden` may still drop one once the data lands.
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
 * single-resource "detail page" param. Both views read both rate endpoints: a legacy send
 * has only nulls on the opens endpoint, and its opens surface on the clicks one. React
 * Query shares the results with the post detail tab gate.
 */
function EmailTopRowReport( { metric }: EmailTopRowReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const hasSelection = postId > 0;

	const opens = useStatsEmailOpensBreakdown( postId, 'rate', {
		enabled: hasSelection,
	} );
	const clicks = useStatsEmailClicksBreakdown( postId, 'rate', {
		enabled: hasSelection,
	} );
	const activeQueries = [ opens, clicks ];
	const opensSummary = ( opens.data as StatsEmailBreakdown | undefined )?.summary;
	const clicksSummary = ( clicks.data as StatsEmailBreakdown | undefined )?.summary;
	const hasResolvedRequiredData = activeQueries.every( query => query.data !== undefined );
	const metrics = useMemo( () => {
		if ( ! hasResolvedRequiredData ) {
			return undefined;
		}

		// The active view's endpoint wins where both report a key.
		const summary =
			metric === 'clicks'
				? { ...opensSummary, ...clicksSummary }
				: { ...clicksSummary, ...opensSummary };

		return hasEmailMetrics( summary ) ? toEmailTopRowMetrics( summary, metric ) : undefined;
	}, [ hasResolvedRequiredData, opensSummary, clicksSummary, metric ] );

	const retryActiveQueries = useCallback( () => {
		opens.refetch();
		clicks.refetch();
	}, [ clicks, opens ] );

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
