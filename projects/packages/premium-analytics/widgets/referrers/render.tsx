/**
 * External dependencies
 */
import {
	useStatsReferrers,
	type StatsNormalizedReport,
	type StatsReferrersItem,
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
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
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
	 * View count for the comparison period.
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
};

function getItemLabel( item: StatsReferrersItem ): string {
	if ( typeof item.label === 'string' && item.label ) {
		return item.label;
	}

	return item.link ?? '';
}

type NormalizedReferrerItem = {
	key: string;
	label: string;
	value: number;
	previousValue: number;
	href?: string;
	icon?: string | null;
	children?: NormalizedReferrerItem[];
};

// Keys are scoped by the parent chain so same-named rows at different drill
// levels (e.g. a "google.com" group and a "google.com" child of Google Search)
// don't collide in the comparison lookup.
function getItemKey( item: StatsReferrersItem, parentKey?: string ): string {
	const ownKey = item.link ?? getItemLabel( item );

	return parentKey ? `${ parentKey } > ${ ownKey }` : ownKey;
}

function buildReferrerItemLookup(
	items: StatsReferrersItem[],
	parentKey?: string
): Map< string, StatsReferrersItem > {
	const lookup = new Map< string, StatsReferrersItem >();

	items.forEach( item => {
		const key = getItemKey( item, parentKey );
		lookup.set( key, item );
		buildReferrerItemLookup( item.children ?? [], key ).forEach( ( value, childKey ) => {
			lookup.set( childKey, value );
		} );
	} );

	return lookup;
}

function normalizeReferrerItem(
	item: StatsReferrersItem,
	comparisonLookup: Map< string, StatsReferrersItem >,
	parent?: { key: string; icon?: string | null }
): NormalizedReferrerItem {
	const key = getItemKey( item, parent?.key );
	const children = ( item.children ?? [] ).map( child =>
		normalizeReferrerItem( child, comparisonLookup, { key, icon: item.icon ?? parent?.icon } )
	);

	return {
		key,
		label: getItemLabel( item ),
		value: item.views,
		previousValue: comparisonLookup.get( key )?.views ?? 0,
		href: item.link ?? undefined,
		icon: item.icon ?? parent?.icon,
		children: children.length ? sortReferrerItems( children ) : undefined,
	};
}

function sortReferrerItems( items: NormalizedReferrerItem[] ): NormalizedReferrerItem[] {
	return [ ...items ].sort( ( a, b ) => b.value - a.value );
}

function toReferrerRow( item: NormalizedReferrerItem ): ReferrerRow {
	return {
		label: item.label,
		value: item.value,
		previousValue: item.previousValue,
		href: item.href,
		icon: item.icon,
		children: item.children?.map( toReferrerRow ),
	};
}

function getItems(
	report: StatsNormalizedReport< StatsReferrersItem > | undefined
): StatsReferrersItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}

/**
 * Flattens a normalized referrers report into `ReferrerRow[]` and attaches
 * matching comparison values when a comparison report is present.
 *
 * @param report           - Primary referrers report.
 * @param comparisonReport - Comparison referrers report.
 * @param max              - Maximum rows to keep. 0 keeps all rows.
 * @return Rows ready for the leaderboard.
 */
export function toReferrerRows(
	report: StatsNormalizedReport< StatsReferrersItem > | undefined,
	comparisonReport: StatsNormalizedReport< StatsReferrersItem > | undefined,
	max: number
): ReferrerRow[] {
	const comparisonLookup = buildReferrerItemLookup( getItems( comparisonReport ) );
	const sorted = sortReferrerItems(
		getItems( report ).map( item => normalizeReferrerItem( item, comparisonLookup ) )
	);
	const sliced = max > 0 ? sorted.slice( 0, max ) : sorted;

	return sliced.map( toReferrerRow );
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
		const previousValue = row.previousValue ?? 0;
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
			previousShare:
				withComparison && previousValue > 0 ? ( previousValue / maxPreviousViews ) * 100 : 0,
			delta: withComparison ? calculateDelta( row.value, previousValue ) : 0,
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
	isLoading?: boolean;
	isError?: boolean;
	withComparison?: boolean;
	onDrillDown?: ( row: ReferrerRow ) => void;
};

/**
 * Presentational leaderboard for the Referrers widget.
 *
 * @param props                - Component props.
 * @param props.rows           - Normalized referrer rows.
 * @param props.isLoading      - When true, show a loading overlay.
 * @param props.isError        - When true, show an error message.
 * @param props.withComparison - When true, render comparison deltas.
 * @param props.onDrillDown    - Callback fired when a row with child referrers is selected.
 * @return The rendered leaderboard.
 */
export function ReferrersLeaderboard( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
	onDrillDown,
}: ReferrersLeaderboardProps ) {
	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Unable to load referrers.', 'jetpack-premium-analytics' ) }</Text>
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
			emptyStateText={ __( 'No referrers in this period.', 'jetpack-premium-analytics' ) }
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
	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsReferrers( statsParams );
	const showLoading = isLoading || ( isFetching && hasData );

	const comparisonReport = comparison.data as
		| StatsNormalizedReport< StatsReferrersItem >
		| undefined;

	const rows = useMemo(
		() =>
			toReferrerRows(
				primary.data as StatsNormalizedReport< StatsReferrersItem > | undefined,
				comparisonReport,
				max
			),
		[ primary.data, comparisonReport, max ]
	);

	// Referrer groups nest twice (group → source → domain), so the drill-down
	// selection is a path of row labels rather than a single row. The shared
	// hook stores the whole path; append/pop happens here.
	const {
		drillDownItem: drillPath,
		drillDown: setDrillPath,
		resetDrillDown,
	} = useWidgetDrillDown< string[] >();

	// Changing the dashboard date range loads a different set of referrers, so
	// any drill-down path from the previous range no longer makes sense — return
	// to the top-level list. Keyed on the range only, so background refetches and
	// comparison toggles keep the current drill position.
	useEffect( () => {
		resetDrillDown();
	}, [ reportParams.from, reportParams.to, resetDrillDown ] );

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

	const activeRows = trail.length ? trail[ trail.length - 1 ].children ?? [] : rows;

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
			<ReferrersLeaderboard
				rows={ activeRows }
				isLoading={ showLoading }
				isError={ isError }
				withComparison={ hasComparison }
				onDrillDown={ drillInto }
			/>
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
