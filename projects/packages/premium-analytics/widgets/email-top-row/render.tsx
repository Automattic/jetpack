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

type EmailSummaryKey =
	| 'total_sends'
	| 'unique_opens'
	| 'total_opens'
	| 'opens_rate'
	| 'total_clicks'
	| 'unique_clicks'
	| 'clicks_rate';

/**
 * The tiles and the "does this summary carry email metrics" check both derive
 * from this shape, so they cannot drift.
 */
type EmailMetricSpec = {
	/** Scalar key on the rate summary, also the tile's stable key. */
	key: EmailSummaryKey;
	icon: TileIcon;
	/** Deferred so the translation runs at render time. */
	label: () => string;
	views: readonly EmailMetric[];
} & (
	| {
			kind: 'count';
			/** Zero reads as unknown: an email shown here went out, and legacy sends went unrecorded. */
			zeroIsUnknown?: boolean;
			/** The total this unique count attributes; the tile hides when none of it is attributable. */
			uniqueOf?: EmailSummaryKey;
	  }
	| { kind: 'rate'; signals: { total: EmailSummaryKey; unique: EmailSummaryKey } }
);

function readCount( summary: EmailRateSummary, key: EmailSummaryKey ): number | null {
	const value = summary[ key ];

	return typeof value === 'number' && Number.isFinite( value ) ? value : null;
}

/**
 * A 0–1 rate, including a real 0%, or `null` when its sends or unique count is unknown.
 */
function readRate(
	summary: EmailRateSummary,
	key: EmailSummaryKey,
	signals: { total: EmailSummaryKey; unique: EmailSummaryKey }
): number | null {
	const known = isEmailRateKnown( {
		total: readCount( summary, signals.total ) ?? 0,
		unique: readCount( summary, signals.unique ) ?? 0,
		sends: readCount( summary, 'total_sends' ) ?? 0,
	} );

	return known ? readCount( summary, key ) : null;
}

/**
 * Matches the Jetpack Stats top row: a unique count shows when positive or when there
 * were no events at all, and hides when events exist but none were attributable.
 */
function isUniqueCountUnknown(
	summary: EmailRateSummary,
	key: EmailSummaryKey,
	totalKey: EmailSummaryKey
) {
	return ! ( ( readCount( summary, key ) ?? 0 ) > 0 || readCount( summary, totalKey ) === 0 );
}

function readTile( spec: EmailMetricSpec, summary: EmailRateSummary ): number | null {
	if ( spec.kind === 'rate' ) {
		return readRate( summary, spec.key, spec.signals );
	}

	const count = readCount( summary, spec.key );

	return spec.zeroIsUnknown ? count || null : count;
}

/**
 * The top-row tiles, in display order, read from the opens rate summary, with the
 * clicks one merged in.
 */
const EMAIL_METRICS: readonly EmailMetricSpec[] = [
	{
		key: 'total_sends',
		icon: send,
		label: () => __( 'Emails sent', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens' ],
		zeroIsUnknown: true,
	},
	{
		key: 'unique_opens',
		icon: people,
		label: () => __( 'Unique opens', 'jetpack-premium-analytics-pkg' ),
		kind: 'count',
		views: [ 'opens' ],
		uniqueOf: 'total_opens',
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
		signals: { total: 'total_opens', unique: 'unique_opens' },
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
		signals: { total: 'total_clicks', unique: 'unique_clicks' },
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
		spec =>
			spec.views.includes( metric ) &&
			! (
				spec.kind === 'count' &&
				spec.uniqueOf &&
				isUniqueCountUnknown( summary, spec.key, spec.uniqueOf )
			)
	).map( spec => ( {
		key: spec.key,
		icon: spec.icon,
		label: spec.label(),
		value: readTile( spec, summary ),
		dataFormat: spec.kind === 'rate' ? RATE_FORMAT : COUNT_FORMAT,
	} ) );
}

/**
 * The view is known before the summaries are, so this is the count the loading
 * shape can draw; `uniqueOf` may still drop one once the data lands.
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
 * single-resource "detail page" param. The Opens view falls back to the clicks rate
 * endpoint only when the opens one records no sends: a legacy send nulls every opens
 * field, and its opens surface on the clicks endpoint.
 */
function EmailTopRowReport( { metric }: EmailTopRowReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const hasSelection = postId > 0;

	const opens = useStatsEmailOpensBreakdown( postId, 'rate', {
		enabled: hasSelection,
	} );
	const opensSummary = ( opens.data as StatsEmailBreakdown | undefined )?.summary;
	const needsClicks =
		metric === 'clicks' ||
		( opens.isSuccess && ! ( ( readCount( opensSummary ?? {}, 'total_sends' ) ?? 0 ) > 0 ) );
	const clicks = useStatsEmailClicksBreakdown( postId, 'rate', {
		enabled: hasSelection && needsClicks,
	} );
	const clicksSummary = ( clicks.data as StatsEmailBreakdown | undefined )?.summary;
	const activeQueries = needsClicks ? [ opens, clicks ] : [ opens ];
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
		if ( needsClicks ) {
			clicks.refetch();
		}
	}, [ clicks, needsClicks, opens ] );

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
