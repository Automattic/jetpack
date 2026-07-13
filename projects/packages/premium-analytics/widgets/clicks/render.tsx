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
	LeaderboardLabel,
	WidgetBackLink,
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	useWidgetDrillDown,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
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
	return {
		label: getItemLabel( item ),
		value: item.views,
		previousValue: item.previousValue,
		...( item.link ? { href: item.link } : {} ),
		icon: item.icon,
		children: item.children?.map( toClickRow ),
		...( item.childrenHaveComparison ? { childrenHaveComparison: true } : {} ),
	};
}

/**
 * Flattens a normalized clicks report into `ClickRow[]` and attaches matching
 * comparison values when a comparison report is present.
 *
 * @param report           - Primary clicks report.
 * @param comparisonReport - Comparison clicks report.
 * @param max              - Maximum rows to keep. 0 keeps all rows.
 * @return Rows ready for the leaderboard.
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
 * Flattens a normalized clicks report into `ClickRow[]` and attaches matching
 * comparison values when a comparison report is present.
 *
 * @param report           - Primary clicks report.
 * @param comparisonReport - Comparison clicks report.
 * @param max              - Maximum rows to keep. 0 keeps all rows.
 * @return Rows ready for the leaderboard.
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
 *
 * @param rows           - Normalized click rows.
 * @param withComparison - Whether to include comparison values and deltas.
 * @param onDrillDown    - Callback fired when a row with child links is selected.
 * @return Leaderboard chart data.
 */
function buildLeaderboardData(
	rows: ClickRow[],
	withComparison: boolean,
	onDrillDown?: ( row: ClickRow ) => void
): LeaderboardChartData {
	const maxCurrentClicks = Math.max( ...rows.map( row => row.value ), 1 );
	const maxPreviousClicks = Math.max( ...rows.map( row => row.previousValue ?? 0 ), 1 );

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue;
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
			currentShare: ( row.value / maxCurrentClicks ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? ( previousValue / maxPreviousClicks ) * 100
					: undefined,
			delta:
				withComparison && previousValue !== undefined
					? calculateDelta( row.value, previousValue )
					: undefined,
			...( hasChildren &&
				onDrillDown && {
					onClick: () => onDrillDown( row ),
					ariaLabel: sprintf(
						/* translators: %s is the clicked link or domain label. */
						__( 'View clicked links for %s', 'jetpack-premium-analytics' ),
						row.label
					),
				} ),
		};
	} );
}

export type ClicksLeaderboardProps = {
	/**
	 * Normalized click rows.
	 */
	rows?: ClickRow[];
	/**
	 * When true, show a loading overlay.
	 */
	isLoading?: boolean;
	/**
	 * When true, show an error message.
	 */
	isError?: boolean;
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
 *
 * @param {ClicksLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export function ClicksLeaderboard( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
	onDrillDown,
}: ClicksLeaderboardProps ) {
	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Could not load clicks data.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isLoading && rows.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows, withComparison, onDrillDown ) }
			loading={ isLoading }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ false }
			emptyStateText={ __( 'No clicks in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ DATA_FORMAT }
		/>
	);
}

type ClicksInnerProps = {
	/**
	 * Maximum rows to display. 0 means all rows returned by the API.
	 */
	max: number;
};

/**
 * Clicks widget inner component. Reads report params from WidgetRoot context
 * and renders the leaderboard, with drill-down into a link's child clicks.
 *
 * @param {ClicksInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function ClicksInner( { max }: ClicksInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const {
		drillDownItem: selectedClickLabel,
		drillDown: selectClick,
		resetDrillDown: clearSelectedClick,
	} = useWidgetDrillDown< string >();
	const statsParams = {
		...reportParams,
		max,
	} as StatsReportParams;
	const { comparisonRows, hasComparison, isLoading, isFetching, hasData, isError } = useStatsClicks(
		statsParams,
		{ maxRows: max }
	);
	const showLoading = isLoading || ( isFetching && hasData );

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

	const handleDrillDown = useCallback(
		( row: ClickRow ) => {
			selectClick( row.label );
		},
		[ selectClick ]
	);

	const backLink = isDrillDown ? (
		<WidgetBackLink
			label={ __( 'All Clicks', 'jetpack-premium-analytics' ) }
			ariaLabel={ __( 'View all clicks', 'jetpack-premium-analytics' ) }
			onClick={ clearSelectedClick }
		/>
	) : null;

	return (
		<div className={ styles.content }>
			{ backLink }
			<ClicksLeaderboard
				rows={ activeRows }
				isLoading={ showLoading }
				isError={ isError }
				withComparison={ withComparison }
				onDrillDown={ isDrillDown ? undefined : handleDrillDown }
			/>
		</div>
	);
}

/**
 * Clicks widget render component.
 *
 * Shows the most-clicked external links as a ranked leaderboard. Date range
 * comes from the shared dashboard date picker via WidgetRoot.
 *
 * @param {ClicksWidgetProps} props - The widget render props.
 * @return The rendered widget content.
 */
export default function ClicksWidget( { attributes = {} }: ClicksWidgetProps ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<ClicksInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
