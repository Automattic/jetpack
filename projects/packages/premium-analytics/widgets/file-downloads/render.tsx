/**
 * External dependencies
 */
import {
	useStatsFileDownloads,
	type StatsFileDownloadsComparisonItem,
	type StatsReportParams,
} from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import { Link } from '@jetpack-premium-analytics/externals';
import {
	calculateDelta,
	getCombinedPeriodMax,
	safeHttpUrl,
	LeaderboardChart,
	ReportLink,
	sharePercentage,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type FileDownloadsAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type FileDownloadsRenderAttributes = FileDownloadsAttributes &
	Partial< ReportParamsFieldAttributes >;
type FileDownloadsWidgetProps = WidgetRenderProps< FileDownloadsRenderAttributes >;

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
	const maxValue = getCombinedPeriodMax(
		rows.map( row => row.value ),
		withComparison ? rows.map( row => row.previousValue ) : []
	);

	return rows.map( ( row, index ) => {
		const previousValue = row.previousValue;

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
			currentShare: sharePercentage( row.value, maxValue ),
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? sharePercentage( previousValue, maxValue )
					: undefined,
			delta:
				withComparison && previousValue !== undefined
					? calculateDelta( row.value, previousValue )
					: undefined,
		};
	} );
}

/**
 * Flattens data-layer file-downloads rows into `FileDownloadRow[]`.
 *
 * @param items - Merged file-download rows from the data layer.
 * @return Normalized rows ready for the leaderboard.
 */
function toFileDownloadRows( items: StatsFileDownloadsComparisonItem[] ): FileDownloadRow[] {
	return items.map( item => ( {
		label: item.shortLabel ?? String( item.label ?? '' ),
		value: item.downloads,
		previousValue: item.previousDownloads,
		// The endpoint falls back to a root-relative `relative_url` here.
		href: safeHttpUrl( item.link, { allowRelative: true } ) ?? undefined,
	} ) );
}

/**
 * Props for `FileDownloadsLeaderboard`.
 */
export type FileDownloadsLeaderboardProps = {
	/**
	 * Normalized download rows to render.
	 */
	rows?: FileDownloadRow[];
	/**
	 * When true, render previous-period deltas.
	 */
	withComparison?: boolean;
};

/**
 * Presentational leaderboard for the "File downloads" widget.
 *
 * Accepts already-fetched rows and renders only the populated (ready) state —
 * loading, error, and empty are handled by `<WidgetState>` in the
 * data-connected inner component. Exported so Storybook can render fixture
 * rows without needing a live WordPress backend.
 *
 * @param {FileDownloadsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export function FileDownloadsLeaderboard( {
	rows = [],
	withComparison = false,
}: FileDownloadsLeaderboardProps ) {
	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows, withComparison ) }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ false }
			dataFormat={ DATA_FORMAT }
		/>
	);
}

type FileDownloadsInnerProps = {
	/**
	 * Max rows to display.
	 */
	max: number;
};

/**
 * Inner component — rendered inside WidgetRoot, reads dashboard context.
 *
 * @param {FileDownloadsInnerProps} props - The component props.
 * @return The rendered leaderboard or state placeholder.
 */
function FileDownloadsInner( { max }: FileDownloadsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsFileDownloads( reportParams as StatsReportParams, { maxRows: max } );

	const rows = useMemo(
		() => toFileDownloadRows( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);
	const withComparison = hasComparison;

	return (
		<>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// The Stats queries carry `placeholderData`, so a failed range change
					// keeps the prior period's rows visible; only surface the error when
					// there is nothing to show.
					isError={ rows.length === 0 && isError }
					isEmpty={ rows.length === 0 }
					error={ {
						description: __(
							"We couldn't load file downloads. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						icon: download,
						description: __( 'No file downloads in this period.', 'jetpack-premium-analytics-pkg' ),
					} }
				>
					<FileDownloadsLeaderboard rows={ rows } withComparison={ withComparison } />
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink report="downloads" />
			</WidgetFooter>
		</>
	);
}

/**
 * File downloads widget render component.
 *
 * Shows the most-downloaded files as a ranked leaderboard. Date range comes
 * from the shared dashboard date picker via WidgetRoot.
 *
 * @param {FileDownloadsWidgetProps} props - The widget render props.
 * @return The rendered widget content.
 */
export default function FileDownloadsWidget( { attributes = {} }: FileDownloadsWidgetProps ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<FileDownloadsInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
