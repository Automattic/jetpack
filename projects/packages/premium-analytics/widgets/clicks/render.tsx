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
	WidgetLoadingOverlay,
	WidgetRoot,
	calculateDelta,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { ClicksAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ClicksRenderAttributes = ClicksAttributes & Partial< ReportParamsFieldAttributes >;

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
};

function getItemLabel( item: StatsClicksItem, parentLabel?: string ): string {
	if ( typeof item.label === 'string' && item.label ) {
		if ( parentLabel && item.label.startsWith( '/' ) ) {
			return `${ parentLabel }${ item.label }`;
		}

		return item.label;
	}

	return item.link ?? parentLabel ?? '';
}

type NormalizedClickItem = {
	key: string;
	label: string;
	value: number;
	href?: string;
	icon?: string | null;
};

function flattenClickItems(
	items: StatsClicksItem[],
	parent?: { label: string; icon?: string | null }
): NormalizedClickItem[] {
	return items.flatMap( item => {
		const label = getItemLabel( item, parent?.label );
		const children = item.children ?? [];

		if ( children.length ) {
			return flattenClickItems( children, { label, icon: item.icon ?? parent?.icon } );
		}

		return [
			{
				key: item.link ?? label,
				label,
				value: item.views,
				href: item.link ?? undefined,
				icon: item.icon ?? parent?.icon,
			},
		];
	} );
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
	const comparisonLookup = new Map(
		flattenClickItems( getItems( comparisonReport ) ).map( item => [ item.key, item.value ] )
	);
	const items = flattenClickItems( getItems( report ) );
	const sliced = max > 0 ? items.slice( 0, max ) : items;

	return sliced.map( item => {
		return {
			label: item.label,
			value: item.value,
			previousValue: comparisonLookup.get( item.key ) ?? 0,
			href: item.href,
			icon: item.icon,
		};
	} );
}

function ClickLabel( { row }: { row: ClickRow } ) {
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
 * @return Leaderboard chart data.
 */
function buildLeaderboardData( rows: ClickRow[], withComparison: boolean ): LeaderboardChartData {
	const maxCurrentClicks = Math.max( ...rows.map( row => row.value ), 1 );
	const maxPreviousClicks = Math.max( ...rows.map( row => row.previousValue ?? 0 ), 1 );

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue ?? 0;

		return {
			id: `${ index }-${ row.href ?? row.label }`,
			label: row.href ? (
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
		};
	} );
}

export type ClicksLeaderboardProps = {
	rows?: ClickRow[];
	isLoading?: boolean;
	isError?: boolean;
	withComparison?: boolean;
};

/**
 * Presentational leaderboard for the Clicks widget.
 *
 * @param props                - Component props.
 * @param props.rows           - Normalized click rows.
 * @param props.isLoading      - When true, show a loading overlay.
 * @param props.isError        - When true, show an error message.
 * @param props.withComparison - When true, render comparison deltas.
 * @return The rendered leaderboard.
 */
export function ClicksLeaderboard( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
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
			data={ buildLeaderboardData( rows, withComparison ) }
			loading={ isLoading }
			withComparison={ withComparison }
			withOverlayLabel
			emptyStateText={ __( 'No clicks in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ DATA_FORMAT }
		/>
	);
}

function ClicksInner( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();
	const statsParams = {
		...reportParams,
		max,
	} as StatsReportParams;
	const { primary, comparison, hasComparison, isLoading, isError } = useStatsClicks( statsParams );

	const rows = useMemo(
		() =>
			toClickRows(
				primary.data as StatsNormalizedReport< StatsClicksItem > | undefined,
				comparison.data as StatsNormalizedReport< StatsClicksItem > | undefined,
				max
			),
		[ primary.data, comparison.data, max ]
	);

	return (
		<ClicksLeaderboard
			rows={ rows }
			isLoading={ isLoading }
			isError={ isError }
			withComparison={ hasComparison }
		/>
	);
}

/**
 * Clicks widget render component.
 *
 * Shows the most-clicked external links as a ranked leaderboard. Date range
 * comes from the shared dashboard date picker via WidgetRoot.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget content.
 */
export default function ClicksWidget( {
	attributes = {},
}: WidgetRenderProps< ClicksRenderAttributes > ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<ClicksInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
