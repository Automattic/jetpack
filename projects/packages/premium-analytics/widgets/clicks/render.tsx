/**
 * External dependencies
 */
import {
	useStatsClicks,
	type StatsClicksItem,
	type StatsNormalizedReport,
	type StatsReportParams,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
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
};

function getItemLabel( item: StatsClicksItem, parentLabel?: string ): string {
	if ( typeof item.label === 'string' && item.label ) {
		return item.label;
	}

	return item.link ?? parentLabel ?? '';
}

type NormalizedClickItem = {
	key: string;
	label: string;
	value: number;
	previousValue: number;
	href?: string;
	icon?: string | null;
	children?: NormalizedClickItem[];
};

function getItemKey( item: StatsClicksItem, parentLabel?: string ): string {
	const label = getItemLabel( item, parentLabel );
	return item.link ?? label;
}

function buildClickItemLookup(
	items: StatsClicksItem[],
	parent?: { label: string }
): Map< string, StatsClicksItem > {
	const lookup = new Map< string, StatsClicksItem >();

	items.forEach( item => {
		const label = getItemLabel( item, parent?.label );
		lookup.set( getItemKey( item, parent?.label ), item );
		( item.children ?? [] ).forEach( child => {
			buildClickItemLookup( [ child ], { label } ).forEach( ( value, key ) => {
				lookup.set( key, value );
			} );
		} );
	} );

	return lookup;
}

function normalizeClickItem(
	item: StatsClicksItem,
	comparisonLookup: Map< string, StatsClicksItem >,
	parent?: { label: string; icon?: string | null }
): NormalizedClickItem {
	const label = getItemLabel( item, parent?.label );
	const key = getItemKey( item, parent?.label );
	const children = ( item.children ?? [] ).map( child =>
		normalizeClickItem( child, comparisonLookup, { label, icon: item.icon ?? parent?.icon } )
	);

	return {
		key,
		label,
		value: item.views,
		previousValue: comparisonLookup.get( key )?.views ?? 0,
		href: item.link ?? undefined,
		icon: item.icon ?? parent?.icon,
		children: children.length ? sortClickItems( children ) : undefined,
	};
}

function sortClickItems( items: NormalizedClickItem[] ): NormalizedClickItem[] {
	return [ ...items ].sort( ( a, b ) => b.value - a.value );
}

function toClickRow( item: NormalizedClickItem ): ClickRow {
	return {
		label: item.label,
		value: item.value,
		previousValue: item.previousValue,
		href: item.href,
		icon: item.icon,
		children: item.children?.map( toClickRow ),
	};
}

function normalizeClickItems(
	items: StatsClicksItem[],
	comparisonLookup: Map< string, StatsClicksItem >
): NormalizedClickItem[] {
	return sortClickItems( items.map( item => normalizeClickItem( item, comparisonLookup ) ) );
}

function getItems(
	report: StatsNormalizedReport< StatsClicksItem > | undefined
): StatsClicksItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
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
	const comparisonLookup = buildClickItemLookup( getItems( comparisonReport ) );
	const sorted = normalizeClickItems( getItems( report ), comparisonLookup );
	const sliced = max > 0 ? sorted.slice( 0, max ) : sorted;

	return sliced.map( toClickRow );
}

type ClickLabelProps = {
	/**
	 * The normalized click row whose favicon and label to render.
	 */
	row: ClickRow;
};

/**
 * Renders a click row's favicon and label.
 *
 * @param {ClickLabelProps} props - The component props.
 * @return The rendered label content.
 */
function ClickLabel( { row }: ClickLabelProps ) {
	return (
		<span className={ styles.labelContent }>
			{ row.icon && <img src={ row.icon } alt="" className={ styles.labelIcon } /> }
			<span className={ styles.labelTitle }>{ row.label }</span>
		</span>
	);
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
		const previousValue = row.previousValue ?? 0;
		const hasChildren = !! row.children?.length;
		const shouldRenderLink = !! row.href && ! hasChildren;

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
					<ClickLabel row={ row } />
				</Link>
			) : (
				<span className={ styles.labelText } title={ row.label }>
					<ClickLabel row={ row } />
				</span>
			),
			currentValue: row.value,
			currentShare: ( row.value / maxCurrentClicks ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue > 0 ? ( previousValue / maxPreviousClicks ) * 100 : 0,
			delta: withComparison ? calculateDelta( row.value, previousValue ) : 0,
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
	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsClicks( statsParams );
	const showLoading = isLoading || ( isFetching && hasData );

	const rows = useMemo(
		() =>
			toClickRows(
				primary.data as StatsNormalizedReport< StatsClicksItem > | undefined,
				comparison.data as StatsNormalizedReport< StatsClicksItem > | undefined,
				max
			),
		[ primary.data, comparison.data, max ]
	);
	const selectedClick = useMemo(
		() => rows.find( row => row.label === selectedClickLabel ) ?? null,
		[ rows, selectedClickLabel ]
	);
	const isDrillDown = !! selectedClick?.children?.length;
	const activeRows = isDrillDown ? selectedClick.children ?? [] : rows;
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
				withComparison={ hasComparison }
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
