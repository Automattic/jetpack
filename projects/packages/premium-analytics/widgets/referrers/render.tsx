/**
 * External dependencies
 */
import {
	useStatsReferrers,
	type StatsReferrersComparisonItem,
	type StatsReportParams,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetBackLink,
	WidgetRoot,
	WidgetState,
	calculateDelta,
	sharePercentage,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { ReferrersAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ReferrersRenderAttributes = ReferrersAttributes & Partial< ReportParamsFieldAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * A single normalized referrer row, ready for the leaderboard.
 */
export type ReferrerRow = {
	/**
	 * Referrer group, source, or domain label.
	 */
	label: string;
	/**
	 * View count for the selected period.
	 */
	value: number;
	/**
	 * View count for the comparison period. Undefined when the row has no
	 * match in the comparison report, so charts suppress the delta instead of
	 * rendering a fake change.
	 */
	previousValue?: number;
	/**
	 * External referrer URL. Used for row identity, comparison matching, and to
	 * render leaf rows (no children) as an outbound link.
	 */
	href?: string;
	/**
	 * Optional favicon URL.
	 */
	icon?: string | null;
	/**
	 * Child referrers for drill-down. Referrer groups can nest twice
	 * (e.g. Search Engines → Google Search → google.com).
	 */
	children?: ReferrerRow[];
	/**
	 * Whether the child rows have any matching comparison-period rows.
	 */
	childrenHaveComparison?: boolean;
};

/**
 * Maps a merged data-layer row (comparison matching, sorting, and the row cap
 * happen in `mergeStatsReferrersComparisonRows`) onto the widget's row shape.
 *
 * @param item - Merged referrers comparison item.
 * @return Row ready for the leaderboard.
 */
export function toReferrerRow( item: StatsReferrersComparisonItem ): ReferrerRow {
	return {
		label: item.label,
		value: item.views,
		previousValue: item.previousValue,
		href: item.link ?? undefined,
		icon: item.icon,
		children: item.children?.map( toReferrerRow ),
		...( item.childrenHaveComparison ? { childrenHaveComparison: true } : {} ),
	};
}

/**
 * Maps normalized referrer rows onto the shape `LeaderboardChart` expects.
 *
 * @param rows           - Normalized referrer rows.
 * @param withComparison - Whether to include comparison values and deltas.
 * @param onDrillDown    - Callback fired when a row with child referrers is selected.
 * @return Leaderboard chart data.
 */
function buildLeaderboardData(
	rows: ReferrerRow[],
	withComparison: boolean,
	onDrillDown?: ( row: ReferrerRow ) => void
): LeaderboardChartData {
	const maxCurrentViews = Math.max( ...rows.map( row => row.value ), 1 );
	const maxPreviousViews = Math.max( ...rows.map( row => row.previousValue ?? 0 ), 1 );

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue;
		const hasPrevious = withComparison && previousValue !== undefined;
		const hasChildren = !! row.children?.length;
		const shouldRenderLink = !! row.href && ! hasChildren;
		const label = (
			<LeaderboardLabel
				label={ row.label }
				imageUrl={ row.icon ?? undefined }
				imageAlt=""
				imageFallback="hidden"
				imageClassName={ styles.labelIcon }
			/>
		);

		return {
			id: `${ index }-${ row.href ?? row.label }`,
			label: shouldRenderLink ? (
				<Link
					className={ styles.labelLink }
					href={ row.href }
					variant="unstyled"
					openInNewTab
					title={ row.label }
				>
					{ label }
				</Link>
			) : (
				<span className={ styles.labelText } title={ row.label }>
					{ label }
				</span>
			),
			currentValue: row.value,
			currentShare: ( row.value / maxCurrentViews ) * 100,
			previousValue,
			previousShare: hasPrevious ? sharePercentage( previousValue, maxPreviousViews ) : undefined,
			delta: hasPrevious ? calculateDelta( row.value, previousValue ) : undefined,
			...( hasChildren &&
				onDrillDown && {
					onClick: () => onDrillDown( row ),
					ariaLabel: sprintf(
						/* translators: %s is the referrer group or domain label. */
						__( 'View referrers for %s', 'jetpack-premium-analytics' ),
						row.label
					),
				} ),
		};
	} );
}

export type ReferrersLeaderboardProps = {
	rows?: ReferrerRow[];
	withComparison?: boolean;
	onDrillDown?: ( row: ReferrerRow ) => void;
};

/**
 * Presentational leaderboard for the Referrers widget. Loading, error, and
 * empty states are owned by the inner component's `WidgetState`.
 *
 * @param props                - Component props.
 * @param props.rows           - Normalized referrer rows.
 * @param props.withComparison - When true, render comparison deltas.
 * @param props.onDrillDown    - Callback fired when a row with child referrers is selected.
 * @return The rendered leaderboard.
 */
export function ReferrersLeaderboard( {
	rows = [],
	withComparison = false,
	onDrillDown,
}: ReferrersLeaderboardProps ) {
	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows, withComparison, onDrillDown ) }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ false }
			dataFormat={ DATA_FORMAT }
		/>
	);
}

function ReferrersInner( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();
	const statsParams = {
		...reportParams,
		max,
	} as StatsReportParams;

	// Row matching (per level, so same-named rows at different drill levels
	// cannot cross-match), the visible-row cap, and the comparison-overlap
	// gate all live in the data layer's merge helper (see AGENTS.md).
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsReferrers( statsParams, { maxRows: max } );

	const rows = useMemo(
		() => ( comparisonRows?.rows ?? [] ).map( toReferrerRow ),
		[ comparisonRows ]
	);

	// Referrer groups nest twice (group → source → domain), so the drill-down
	// selection is a path of row labels rather than a single row. The shared
	// hook stores the whole path; append/pop happens here.
	const {
		drillDownItem: drillPath,
		drillDown: setDrillPath,
		resetDrillDown,
	} = useWidgetDrillDown< string[] >();

	// Resolve the path against the current rows each render, so a refetch that
	// drops a selected row falls back to the deepest level that still exists.
	const trail = useMemo( () => {
		const matched: ReferrerRow[] = [];
		let level = rows;

		for ( const label of drillPath ?? [] ) {
			const row = level.find( candidate => candidate.label === label );

			if ( ! row?.children?.length ) {
				break;
			}

			matched.push( row );
			level = row.children;
		}

		return matched;
	}, [ rows, drillPath ] );

	// When settled data no longer resolves the whole stored path (e.g. the
	// date range changed and the drilled group disappeared), trim it to the
	// deepest level that still exists so stored state matches the view and
	// stale levels can't resurface on a later refetch (WOOA7S-1666). A path
	// that still resolves survives range changes; in-flight fetches keep
	// placeholder rows and errors aren't settled data, so a valid selection
	// survives refetches and transient failures.
	useEffect( () => {
		if (
			! drillPath?.length ||
			isLoading ||
			isFetching ||
			isError ||
			trail.length === drillPath.length
		) {
			return;
		}

		if ( trail.length ) {
			setDrillPath( trail.map( row => row.label ) );
		} else {
			resetDrillDown();
		}
	}, [ drillPath, trail, isLoading, isFetching, isError, setDrillPath, resetDrillDown ] );

	const currentRow = trail.length ? trail[ trail.length - 1 ] : null;
	const activeRows = currentRow ? currentRow.children ?? [] : rows;
	// Drilled levels gate the comparison UI on their own rows' overlap, so a
	// subtree without comparison matches doesn't render placeholder deltas.
	const withComparison = currentRow ? !! currentRow.childrenHaveComparison : hasComparison;

	const drillInto = useCallback(
		( row: ReferrerRow ) => {
			setDrillPath( [ ...( drillPath ?? [] ), row.label ] );
		},
		[ drillPath, setDrillPath ]
	);

	const goBack = useCallback( () => {
		// Step back from the resolved trail, not the raw drillPath, so a refetch
		// that dropped the deepest row still moves the view back one visible level.
		const nextPath = trail.slice( 0, -1 ).map( row => row.label );

		if ( nextPath.length ) {
			setDrillPath( nextPath );
		} else {
			resetDrillDown();
		}
	}, [ trail, setDrillPath, resetDrillDown ] );

	// The back link is labelled after the list it returns to: the parent row
	// one level up, or the full top-level list. The visible label stays short
	// while the accessible name spells out the action.
	const parentLabel = trail.length > 1 ? trail[ trail.length - 2 ].label : null;
	const backLabel = parentLabel ?? __( 'All referrers', 'jetpack-premium-analytics' );
	const backAriaLabel = parentLabel
		? sprintf(
				/* translators: %s is the parent referrer group or source label. */
				__( 'Back to %s', 'jetpack-premium-analytics' ),
				parentLabel
		  )
		: __( 'View all referrers', 'jetpack-premium-analytics' );

	return (
		<div className={ styles.content }>
			{ trail.length > 0 && (
				<WidgetBackLink label={ backLabel } ariaLabel={ backAriaLabel } onClick={ goBack } />
			) }
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The Stats queries carry `placeholderData: previousData => previousData`, so a
				// failed range change keeps the prior period's rows while `isError` flips true.
				// Only surface the error when there's nothing to show, so a transient refetch
				// failure doesn't replace populated rows with the error state.
				isError={ rows.length === 0 && isError }
				isEmpty={ rows.length === 0 }
				error={ {
					description: __(
						"We couldn't load referrers. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: globe,
					description: __( 'No referrers in this period.', 'jetpack-premium-analytics' ),
				} }
			>
				<ReferrersLeaderboard
					rows={ activeRows }
					withComparison={ withComparison }
					onDrillDown={ drillInto }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Referrers widget render component.
 *
 * Shows the websites and search engines referring visitors as a ranked
 * leaderboard. Date range comes from the shared dashboard date picker via
 * WidgetRoot. Referrer groups drill down into their sources and domains.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget content.
 */
export default function ReferrersWidget( {
	attributes = {},
}: WidgetRenderProps< ReferrersRenderAttributes > ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<ReferrersInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
