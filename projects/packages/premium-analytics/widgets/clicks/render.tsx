/**
 * External dependencies
 */
import {
	mergeStatsClicksComparisonRows,
	useStatsClicks,
	type StatsClicksComparisonItem,
	type StatsClicksItem,
	type StatsNormalizedReport,
	type StatsReportParams,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardSkeleton,
	ReportLink,
	WIDGET_ROW_LIMIT,
	WidgetBackLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	calculateDelta,
	getCombinedPeriodMax,
	resolveLeaderboardRowAction,
	safeHttpUrl,
	sharePercentage,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type ClicksAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ClicksRenderAttributes = ClicksAttributes & Partial< ReportParamsFieldAttributes >;
type ClicksWidgetProps = WidgetRenderProps< ClicksRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * A single normalized click row, ready for the leaderboard.
 */
export type ClickRow = {
	/**
	 * Link or domain label.
	 */
	label: string;
	/**
	 * Click count for the selected period.
	 */
	value: number;
	/**
	 * Click count for the comparison period.
	 */
	previousValue?: number;
	/**
	 * External destination URL.
	 */
	href?: string;
	/**
	 * Optional favicon URL.
	 */
	icon?: string | null;
	/**
	 * Child clicked links for drill-down.
	 */
	children?: ClickRow[];
	/**
	 * Whether the child rows have any matching comparison-period rows.
	 */
	childrenHaveComparison?: boolean;
};

function getItemLabel( item: StatsClicksComparisonItem | StatsClicksItem ): string {
	if ( typeof item.label === 'string' && item.label ) {
		return item.label;
	}

	return item.link ?? '';
}

function toClickRow( item: StatsClicksComparisonItem ): ClickRow {
	const href = safeHttpUrl( item.link );

	return {
		label: getItemLabel( item ),
		value: item.views,
		previousValue: item.previousValue,
		...( href ? { href } : {} ),
		icon: item.icon,
		children: item.children?.map( toClickRow ),
		...( item.childrenHaveComparison ? { childrenHaveComparison: true } : {} ),
	};
}

/**
 * Flattens a normalized clicks report into `ClickRow[]` and attaches matching
 * comparison values when a comparison report is present. Rows are capped
 * client-side by `max`; `max = 0` keeps all rows.
 */
export function toClickRowsWithComparison(
	report: StatsNormalizedReport< StatsClicksItem > | undefined,
	comparisonReport: StatsNormalizedReport< StatsClicksItem > | undefined,
	max: number
): { rows: ClickRow[]; hasComparison: boolean } {
	const { rows, hasComparison } = mergeStatsClicksComparisonRows( report, comparisonReport, max );
	const clickRows = rows.map( toClickRow );

	return {
		rows: clickRows,
		hasComparison,
	};
}

/**
 * `toClickRowsWithComparison` without the `hasComparison` flag.
 */
export function toClickRows(
	report: StatsNormalizedReport< StatsClicksItem > | undefined,
	comparisonReport: StatsNormalizedReport< StatsClicksItem > | undefined,
	max: number
): ClickRow[] {
	return toClickRowsWithComparison( report, comparisonReport, max ).rows;
}

/**
 * Maps normalized click rows onto the shape `LeaderboardChart` expects.
 */
function buildLeaderboardData(
	rows: ClickRow[],
	withComparison: boolean,
	onDrillDown?: ( row: ClickRow ) => void
): LeaderboardChartData {
	const maxClicks = getCombinedPeriodMax(
		rows.map( row => row.value ),
		withComparison ? rows.map( row => row.previousValue ) : []
	);

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue;
		const hasChildren = !! row.children?.length;

		return {
			id: `${ index }-${ row.href ?? row.label }`,
			...buildLeaderboardRow( {
				label: row.label,
				media: { kind: 'favicon', url: row.icon ?? undefined },
				action: resolveLeaderboardRowAction( {
					href: row.href,
					hasChildren,
					drillDown: onDrillDown
						? {
								onClick: () => onDrillDown( row ),
								ariaLabel: sprintf(
									/* translators: %s is the clicked link or domain label. */
									__( 'View clicked links for %s', 'jetpack-premium-analytics-pkg' ),
									row.label
								),
						  }
						: undefined,
				} ),
			} ),
			currentValue: row.value,
			currentShare: sharePercentage( row.value, maxClicks ),
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? sharePercentage( previousValue, maxClicks )
					: undefined,
			delta:
				withComparison && previousValue !== undefined
					? calculateDelta( row.value, previousValue )
					: undefined,
		};
	} );
}

export type ClicksLeaderboardProps = {
	/**
	 * Normalized click rows.
	 */
	rows?: ClickRow[];
	/**
	 * When true, render comparison deltas.
	 */
	withComparison?: boolean;
	/**
	 * Callback fired when a row with child links is selected.
	 */
	onDrillDown?: ( row: ClickRow ) => void;
};

/**
 * Presentational leaderboard for the Clicks widget.
 */
export function ClicksLeaderboard( {
	rows = [],
	withComparison = false,
	onDrillDown,
}: ClicksLeaderboardProps ) {
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

/**
 * Clicks widget inner component. Reads report params from WidgetRoot context
 * and renders the leaderboard, with drill-down into a link's child clicks.
 */
function ClicksInner() {
	const { reportParams } = useWidgetRootContext();
	const {
		drillDownItem: selectedClickLabel,
		drillDown: selectClick,
		resetDrillDown: clearSelectedClick,
	} = useWidgetDrillDown< string >();
	const statsParams = {
		...reportParams,
		max: WIDGET_ROW_LIMIT,
	} as StatsReportParams;
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } = useStatsClicks(
		statsParams,
		{ maxRows: WIDGET_ROW_LIMIT }
	);

	const rows = useMemo(
		() => ( comparisonRows?.rows ?? [] ).map( toClickRow ),
		[ comparisonRows ]
	);
	const selectedClick = useMemo(
		() => rows.find( row => row.label === selectedClickLabel ) ?? null,
		[ rows, selectedClickLabel ]
	);
	const isDrillDown = !! selectedClick?.children?.length;
	const activeRows = isDrillDown ? selectedClick.children ?? [] : rows;
	const withComparison = isDrillDown ? !! selectedClick?.childrenHaveComparison : hasComparison;

	// Clear the stored selection only once data has settled without a drillable
	// match, so it can't resurface on a later refetch (WOOA7S-1666) and a valid
	// selection survives in-flight fetches and transient failures.
	useEffect( () => {
		if ( selectedClickLabel && ! isDrillDown && ! isLoading && ! isFetching && ! isError ) {
			clearSelectedClick();
		}
	}, [ selectedClickLabel, isDrillDown, isLoading, isFetching, isError, clearSelectedClick ] );

	const handleDrillDown = useCallback(
		( row: ClickRow ) => {
			selectClick( row.label );
		},
		[ selectClick ]
	);

	const backLink = isDrillDown ? (
		<WidgetBackLink
			label={ __( 'All clicks', 'jetpack-premium-analytics-pkg' ) }
			ariaLabel={ __( 'View all clicks', 'jetpack-premium-analytics-pkg' ) }
			onClick={ clearSelectedClick }
		/>
	) : null;

	return (
		<div className={ styles.content }>
			{ backLink }
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `placeholderData` keeps the prior period's rows on screen while `isError`
				// flips true, so a transient refetch failure should not replace them.
				isError={ rows.length === 0 && isError }
				isEmpty={ activeRows.length === 0 }
				error={ {
					description: __(
						"We couldn't load clicks. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: link,
					description: __( 'No clicks in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
			>
				<ClicksLeaderboard
					rows={ activeRows }
					withComparison={ withComparison }
					onDrillDown={ isDrillDown ? undefined : handleDrillDown }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Shows the most-clicked external links as a ranked leaderboard. Date range
 * comes from the shared dashboard date picker via WidgetRoot.
 */
export default function ClicksWidget( { attributes = {} }: ClicksWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<ClicksInner />
				<WidgetFooter>
					<ReportLink report="clicks" />
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}
