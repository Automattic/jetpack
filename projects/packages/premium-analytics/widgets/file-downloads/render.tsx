/**
 * External dependencies
 */
import {
	useStatsFileDownloads,
	type StatsFileDownloadsItem,
	type StatsNormalizedReport,
	type StatsReportParams,
} from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import {
	calculateDelta,
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { FileDownloadsAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type FileDownloadsRenderAttributes = FileDownloadsAttributes &
	Partial< ReportParamsFieldAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

/**
 * A single normalized file-downloads row, ready for the leaderboard.
 * Exported for Storybook fixture use.
 */
export type FileDownloadRow = {
	/** Display label — filename when available, otherwise relative URL. */
	label: string;
	/** Download count for the period. */
	value: number;
	/** Download count for the comparison period. */
	previousValue?: number;
	/** File URL. When present, the row label becomes a link. */
	href?: string;
};

/**
 * Maps normalized file-download rows onto the shape `LeaderboardChart` expects.
 *
 * @param rows           - Normalized file-download rows.
 * @param withComparison - Whether to derive previous-period shares and deltas.
 * @return Leaderboard chart data.
 */
function buildLeaderboardData(
	rows: FileDownloadRow[],
	withComparison: boolean
): LeaderboardChartData {
	const maxValue = Math.max( ...rows.map( r => r.value ), 1 );
	const maxPreviousValue = Math.max( ...rows.map( r => r.previousValue ?? 0 ), 1 );

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
					{ row.label }
				</Link>
			) : (
				<span className={ styles.labelText } title={ row.label }>
					{ row.label }
				</span>
			),
			currentValue: row.value,
			currentShare: ( row.value / maxValue ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue > 0 ? ( previousValue / maxPreviousValue ) * 100 : 0,
			delta: withComparison ? calculateDelta( row.value, previousValue ) : 0,
		};
	} );
}

function getFileDownloadItemKey( item: StatsFileDownloadsItem ) {
	return item.link ?? String( item.label ?? item.shortLabel ?? '' );
}

/**
 * Flattens a normalized file-downloads report into `FileDownloadRow[]`.
 *
 * @param report           - Normalized report from the data layer, or undefined while loading.
 * @param max              - Maximum rows to keep (0 = all).
 * @param comparisonReport - Optional normalized comparison report.
 * @return Normalized rows ready for the leaderboard.
 */
function toFileDownloadRows(
	report: StatsNormalizedReport< StatsFileDownloadsItem > | undefined,
	max: number,
	comparisonReport?: StatsNormalizedReport< StatsFileDownloadsItem >
): FileDownloadRow[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];
	const sliced = max > 0 ? items.slice( 0, max ) : items;
	const comparisonItems = comparisonReport?.data.flatMap( point => point.items ) ?? [];
	const comparisonByKey = new Map(
		comparisonItems.map( item => [ getFileDownloadItemKey( item ), item.downloads ] )
	);

	return sliced.map( item => ( {
		label: item.shortLabel ?? String( item.label ?? '' ),
		value: item.downloads,
		previousValue: comparisonByKey.get( getFileDownloadItemKey( item ) ),
		href: item.link,
	} ) );
}

/**
 * Props for `FileDownloadsLeaderboard`.
 */
export type FileDownloadsLeaderboardProps = {
	rows?: FileDownloadRow[];
	isLoading?: boolean;
	isError?: boolean;
	withComparison?: boolean;
};

/**
 * Presentational leaderboard for the "File downloads" widget.
 *
 * Accepts already-fetched rows and handles loading, error, empty, and
 * populated states. Exported so Storybook can exercise those states with
 * fixture rows without needing a live WordPress backend.
 *
 * @param props                - Component props.
 * @param props.rows           - Normalized download rows to render.
 * @param props.isLoading      - When true, show a loading overlay.
 * @param props.isError        - When true, show an error message.
 * @param props.withComparison - When true, render previous-period deltas.
 * @return The rendered leaderboard.
 */
export function FileDownloadsLeaderboard( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
}: FileDownloadsLeaderboardProps ) {
	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Could not load file download data.', 'jetpack-premium-analytics' ) }</Text>
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
			showLegend={ false }
			emptyStateText={ __( 'No file downloads in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ DATA_FORMAT }
		/>
	);
}

/**
 * Inner component — rendered inside WidgetRoot, reads dashboard context.
 *
 * @param props     - Props.
 * @param props.max - Max rows to display.
 * @return The rendered leaderboard or state placeholder.
 */
function FileDownloadsInner( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();
	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsFileDownloads( reportParams as StatsReportParams );
	const showLoading = isLoading || ( isFetching && hasData );

	const rows = useMemo(
		() =>
			toFileDownloadRows(
				primary.data as StatsNormalizedReport< StatsFileDownloadsItem > | undefined,
				max,
				hasComparison
					? ( comparison.data as StatsNormalizedReport< StatsFileDownloadsItem > | undefined )
					: undefined
			),
		[ primary.data, max, hasComparison, comparison.data ]
	);

	return (
		<FileDownloadsLeaderboard
			rows={ rows }
			isLoading={ showLoading }
			isError={ isError }
			withComparison={ hasComparison }
		/>
	);
}

/**
 * File downloads widget render component.
 *
 * Shows the most-downloaded files as a ranked leaderboard. Date range comes
 * from the shared dashboard date picker via WidgetRoot.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes (max).
 * @return The rendered widget content.
 */
export default function FileDownloadsWidget( {
	attributes = {},
}: WidgetRenderProps< FileDownloadsRenderAttributes > ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<FileDownloadsInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
