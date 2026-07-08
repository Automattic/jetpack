/**
 * External dependencies
 */
import {
	useStatsArchives,
	useStatsTopPosts,
	type StatsArchivesItem,
	type StatsNormalizedReport,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	formatLegendLabels,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LegendLabels,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TopPostsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * A single normalized top-posts row, flattened from the designated
 * `useStatsTopPosts` report into the shape the leaderboard renders. Exported so
 * Storybook can build fixtures for `TopPostsLeaderboard`.
 */
export type TopPostRow = {
	/**
	 * Row label.
	 */
	label: string;
	/**
	 * View count for the period.
	 */
	value: number;
	/**
	 * View count for the comparison (previous) period. Only used when the
	 * leaderboard is rendered with `withComparison`; omit it for single-period
	 * views.
	 */
	previousValue?: number;
	/**
	 * URL of the published post/page.
	 */
	href?: string;
	/**
	 * Post type, e.g. `post` or `page`.
	 */
	type?: string;
	/**
	 * Stable row key used to align the primary and comparison periods.
	 */
	key?: string;
};

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but the host (and Storybook) may also inject them via `attributes`.
type TopPostsRenderAttributes = TopPostsAttributes & Partial< ReportParamsFieldAttributes >;
type TopPostsWidgetProps = WidgetRenderProps< TopPostsRenderAttributes >;

type TopPostsReportProps = Pick< TopPostsAttributes, 'contentType' | 'num' | 'postType' >;

const DEFAULT_POST_TYPES = [ 'post', 'page' ];
const DEFAULT_CONTENT_TYPE: NonNullable< TopPostsAttributes[ 'contentType' ] > = 'posts-pages';

/**
 * Maps normalized top-posts rows onto the shape `LeaderboardChart` expects.
 * Current shares are computed relative to the most-viewed row so the overlay
 * bars are proportional. When `withComparison` is set, previous-period shares
 * and per-row deltas are derived from each row's `previousValue`; otherwise
 * the comparison fields are zeroed.
 *
 * Each row's label is a link that opens the published post/page in a new tab.
 * The link fills its row so the leaderboard overlay bar gets its height from
 * the label.
 *
 * @param rows           - The normalized top-posts rows.
 * @param withComparison - Whether to derive previous-period shares and deltas.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData( rows: TopPostRow[], withComparison: boolean ): LeaderboardChartData {
	// `1` guards against division by zero when every value is 0.
	const maxCurrentViews = Math.max( ...rows.map( row => row.value ), 1 );
	const maxPreviousViews = Math.max( ...rows.map( row => row.previousValue ?? 0 ), 1 );

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue ?? 0;
		const rowKey = row.key ?? row.href ?? row.label;
		const label = row.href ? (
			<Link
				className={ styles.labelLink }
				href={ row.href }
				variant="unstyled"
				openInNewTab
				title={ row.label }
			>
				{ row.label }
			</Link>
		) : (
			<span className={ styles.labelText } title={ row.label }>
				{ row.label }
			</span>
		);

		return {
			id: `${ index }-${ rowKey }`,
			label,
			currentValue: row.value,
			currentShare: ( row.value / maxCurrentViews ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue > 0 ? ( previousValue / maxPreviousViews ) * 100 : 0,
			delta: withComparison ? calculateDelta( row.value, previousValue ) : 0,
		};
	} );
}

type TopPostsLeaderboardProps = {
	/**
	 * Normalized top-posts rows to render. When omitted, the empty state is shown
	 * (unless `isLoading` is set).
	 */
	rows?: TopPostRow[];
	/**
	 * When `true`, a loading overlay is rendered instead of data.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the chart.
	 */
	isError?: boolean;
	/**
	 * When `true`, render the comparison (previous-period) delta next to each
	 * value, using `previousValue` from each row. Mirrors the overlay
	 * comparison mode of the toolkit's `LeaderboardChart`.
	 */
	withComparison?: boolean;
	/**
	 * When `true`, show the period legend below the chart. Requires
	 * `legendLabels` to be meaningful.
	 */
	showLegend?: boolean;
	/**
	 * Custom legend labels for the current/comparison periods.
	 */
	legendLabels?: LegendLabels;
};

/**
 * Presentational leaderboard for the "Top posts & pages" widget. Renders the
 * most-viewed posts and pages for the period, each row linking to the
 * published content.
 *
 * Takes already-fetched rows via props and is responsible only for the
 * loading, error, empty, and populated states. Exported so Storybook can
 * exercise those states with fixture rows (there is no analytics backend in
 * Storybook, so the data-connected entry point would only ever show chrome).
 *
 * @param {TopPostsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const TopPostsLeaderboard = ( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
	showLegend = false,
	legendLabels,
}: TopPostsLeaderboardProps ) => {
	if ( isError ) {
		return <Text>{ __( 'Unable to load top pages.', 'jetpack-premium-analytics' ) }</Text>;
	}

	if ( isLoading && ( ! rows || rows.length === 0 ) ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows, withComparison ) }
			loading={ isLoading }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ showLegend }
			legendLabels={ legendLabels }
			emptyStateText={ __( 'No views in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
		/>
	);
};

/**
 * Flatten the designated `useStatsTopPosts` report into the `{ label, value,
 * href, type }` rows the leaderboard renders, dropping rows without a link and
 * filtering to posts and pages by default.
 *
 * @param report       - The normalized top-posts report, or undefined while loading.
 * @param allowedTypes - Post types to keep.
 * @return The normalized top-posts rows.
 */
function toTopPostRows(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined,
	allowedTypes: string[]
): TopPostRow[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];

	return items
		.filter(
			( item ): item is StatsTopPostsItem & { link: string } => typeof item.link === 'string'
		)
		.map( item => ( {
			key: item.link ? `link:${ item.link }` : `post:${ String( item.id ) }`,
			label: String( item.label ?? '' ),
			value: item.views,
			href: item.link,
			type: String( item.type ?? '' ),
		} ) )
		.filter( row => row.type && allowedTypes.includes( row.type ) );
}

function getAllowedPostTypes( postType: TopPostsAttributes[ 'postType' ] ): string[] {
	if ( postType === undefined || postType === '' ) {
		return DEFAULT_POST_TYPES;
	}

	const types = Array.isArray( postType ) ? postType : [ postType ];
	const filteredTypes = types.filter( type => type !== '' );

	return filteredTypes.length ? filteredTypes : DEFAULT_POST_TYPES;
}

function getArchiveLabel( row: StatsArchivesItem, ancestors: string[] ) {
	const label = String( row.label ?? '' );

	if ( label === 'home' ) {
		return __( 'Home page / Archives', 'jetpack-premium-analytics' );
	}

	if ( ancestors[ 0 ] === 'tax' && ancestors[ 1 ] ) {
		return sprintf(
			/* translators: 1: taxonomy name, 2: term name. */
			__( '%1$s: %2$s', 'jetpack-premium-analytics' ),
			ancestors[ 1 ],
			label
		);
	}

	return label;
}

function getArchiveChildAncestors( row: StatsArchivesItem, ancestors: string[] ) {
	const label = String( row.label ?? '' );

	if ( ancestors.length === 0 ) {
		return [ label ];
	}

	if ( ancestors[ 0 ] === 'tax' && ancestors.length === 1 ) {
		return [ ancestors[ 0 ], label ];
	}

	return ancestors;
}

function getTopPageRowKey( row: TopPostRow ) {
	return row.key ?? row.href ?? row.label;
}

function flattenArchiveRows( rows: StatsArchivesItem[], ancestors: string[] = [] ): TopPostRow[] {
	return rows.flatMap( row => {
		const children = row.children ?? [];

		if ( children.length ) {
			return flattenArchiveRows( children, getArchiveChildAncestors( row, ancestors ) );
		}

		const href = typeof row.link === 'string' ? row.link : undefined;
		const label = getArchiveLabel( row, ancestors );

		return [
			{
				key: href ?? `${ ancestors.join( '/' ) }/${ label }`,
				label,
				value: row.value,
				href,
				type: 'archive',
			},
		];
	} );
}

function toArchiveRows(
	report: StatsNormalizedReport< StatsArchivesItem > | undefined,
	max = 10
): TopPostRow[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];

	return flattenArchiveRows( items )
		.sort( ( a, b ) => b.value - a.value )
		.slice( 0, max > 0 ? max : undefined );
}

/**
 * Fetches the top-posts report through the designated `useStatsTopPosts` Stats
 * traffic hook and hands the normalized rows to the presentational
 * `TopPostsLeaderboard`. The date range and comparison period come from the
 * dashboard picker via `reportParams`.
 *
 * @param {TopPostsReportProps} props - The component props.
 * @return The widget content.
 */
function TopPostsReport( {
	contentType = DEFAULT_CONTENT_TYPE,
	num = 10,
	postType,
}: TopPostsReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const isArchive = contentType === 'archive';

	// The widget's "Number of results" maps to the WPCOM stats API's `max`; the
	// date range is owned by the dashboard picker and carried in `reportParams`.
	const statsParams = useMemo( () => ( { ...reportParams, max: num } ), [ reportParams, num ] );

	const topPostsReport = useStatsTopPosts( statsParams, { enabled: ! isArchive } );
	const archivesReport = useStatsArchives( statsParams, { enabled: isArchive } );
	const activeReport = isArchive ? archivesReport : topPostsReport;

	const allowedTypes = useMemo( () => {
		return getAllowedPostTypes( postType );
	}, [ postType ] );

	const primaryRows = useMemo(
		() =>
			isArchive
				? toArchiveRows(
						archivesReport.primary.data as StatsNormalizedReport< StatsArchivesItem > | undefined,
						num
				  )
				: toTopPostRows(
						topPostsReport.primary.data as StatsNormalizedReport< StatsTopPostsItem > | undefined,
						allowedTypes
				  ),
		[ archivesReport.primary.data, allowedTypes, isArchive, num, topPostsReport.primary.data ]
	);

	// Comparison-period views keyed by the same stable key the primary rows use.
	// Empty when comparison is disabled or the comparison query returned no rows.
	const previousViewsByKey = useMemo( () => {
		if ( ! activeReport.hasComparison ) {
			return new Map< string, number >();
		}

		if ( isArchive ) {
			return new Map(
				toArchiveRows(
					archivesReport.comparison.data as StatsNormalizedReport< StatsArchivesItem > | undefined,
					0
				).map( row => [ getTopPageRowKey( row ), row.value ] )
			);
		}

		return new Map(
			toTopPostRows(
				topPostsReport.comparison.data as StatsNormalizedReport< StatsTopPostsItem > | undefined,
				allowedTypes
			).map( row => [ getTopPageRowKey( row ), row.value ] )
		);
	}, [
		activeReport.hasComparison,
		allowedTypes,
		archivesReport.comparison.data,
		isArchive,
		topPostsReport.comparison.data,
	] );

	// Only render comparison UI when at least one primary row actually overlaps
	// the comparison period; otherwise unmatched rows would fall to a placeholder
	// `previousValue: 0` and the chart would show a fabricated delta (see AGENTS.md).
	const withComparison =
		activeReport.hasComparison &&
		primaryRows.some( row => previousViewsByKey.has( getTopPageRowKey( row ) ) );

	const rows = useMemo(
		() =>
			withComparison
				? primaryRows.map( row => ( {
						...row,
						previousValue: previousViewsByKey.get( getTopPageRowKey( row ) ) ?? 0,
				  } ) )
				: primaryRows,
		[ primaryRows, previousViewsByKey, withComparison ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );
	const isLoading = activeReport.isLoading || ( activeReport.isFetching && activeReport.hasData );

	return (
		<TopPostsLeaderboard
			rows={ rows }
			isLoading={ isLoading }
			isError={ activeReport.isError }
			withComparison={ withComparison }
			showLegend={ withComparison }
			legendLabels={ legendLabels }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner leaderboard — resolved from the dashboard date
 * range via context, the same way the other Stats widgets read them. The
 * widget's own `num`/`contentType` settings are forwarded to the inner component.
 *
 * @param {TopPostsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TopPosts( { attributes = {} }: TopPostsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TopPostsReport
				contentType={ attributes.contentType ?? DEFAULT_CONTENT_TYPE }
				num={ attributes.num }
				postType={ attributes.postType }
			/>
		</WidgetRoot>
	);
}
