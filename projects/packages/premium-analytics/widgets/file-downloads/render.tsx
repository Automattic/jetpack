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
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import {
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
	/** File URL. When present, the row label becomes a link. */
	href?: string;
};

/**
 * Maps normalized file-download rows onto the shape `LeaderboardChart` expects.
 *
 * @param rows - Normalized file-download rows.
 * @return Leaderboard chart data.
 */
function buildLeaderboardData( rows: FileDownloadRow[] ): LeaderboardChartData {
	const maxValue = Math.max( ...rows.map( r => r.value ), 1 );

	return rows.map( ( row, index ) => ( {
		id: `${ index }-${ row.label }`,
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
		previousValue: 0,
		previousShare: 0,
		delta: 0,
	} ) );
}

/**
 * Flattens a normalized file-downloads report into `FileDownloadRow[]`.
 *
 * @param report - Normalized report from the data layer, or undefined while loading.
 * @param max    - Maximum rows to keep (0 = all).
 * @return Normalized rows ready for the leaderboard.
 */
function toFileDownloadRows(
	report: StatsNormalizedReport< StatsFileDownloadsItem > | undefined,
	max: number
): FileDownloadRow[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];
	const sliced = max > 0 ? items.slice( 0, max ) : items;
	return sliced.map( item => ( {
		label: item.shortLabel ?? String( item.label ?? '' ),
		value: item.downloads,
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
};

/**
 * Presentational leaderboard for the "File downloads" widget.
 *
 * Accepts already-fetched rows and handles loading, error, empty, and
 * populated states. Exported so Storybook can exercise those states with
 * fixture rows without needing a live WordPress backend.
 *
 * @param props           - Component props.
 * @param props.rows      - Normalized download rows to render.
 * @param props.isLoading - When true, show a loading overlay.
 * @param props.isError   - When true, show an error message.
 * @return The rendered leaderboard.
 */
export function FileDownloadsLeaderboard( {
	rows = [],
	isLoading = false,
	isError = false,
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
			data={ buildLeaderboardData( rows ) }
			loading={ isLoading }
			withOverlayLabel
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
	const { primary, isLoading, isError } = useStatsFileDownloads(
		reportParams as StatsReportParams
	);

	const rows = toFileDownloadRows(
		primary.data as StatsNormalizedReport< StatsFileDownloadsItem > | undefined,
		max
	);

	return <FileDownloadsLeaderboard rows={ rows } isLoading={ isLoading } isError={ isError } />;
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
