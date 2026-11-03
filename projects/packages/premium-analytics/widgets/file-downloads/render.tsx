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
import {
	WIDGET_ROW_LIMIT,
	fileDownloadsCsvExporter,
	safeHttpUrl,
	LeaderboardChart,
	LeaderboardSkeleton,
	buildLeaderboardRow,
	resolveLeaderboardRowAction,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
	useReportActions,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { useNoViewsEmptyState } from '../use-no-views-empty-state';
import styles from './style.module.css';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type FileDownloadsAttributes = Record< never, never >;

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
 */
function buildLeaderboardData( rows: FileDownloadRow[] ): LeaderboardChartData {
	return rows.map( ( row, index ) => ( {
		id: `${ index }-${ row.href ?? row.label }`,
		...buildLeaderboardRow( {
			label: row.label,
			media: { kind: 'none' },
			action: resolveLeaderboardRowAction( { href: row.href, hasChildren: false } ),
		} ),
		currentValue: row.value,
		previousValue: row.previousValue,
	} ) );
}

function toFileDownloadRows( items: StatsFileDownloadsComparisonItem[] ): FileDownloadRow[] {
	return items.map( item => ( {
		label: item.shortLabel ?? String( item.label ?? '' ),
		value: item.downloads,
		previousValue: item.previousDownloads,
		// The endpoint falls back to a root-relative `relative_url` here.
		href: safeHttpUrl( item.link, { allowRelative: true } ) ?? undefined,
	} ) );
}

export type FileDownloadsLeaderboardProps = {
	rows?: FileDownloadRow[];
	withComparison?: boolean;
};

/**
 * Renders only the populated state — the data-connected inner component owns the
 * rest. Exported so Storybook can render fixture rows without a live backend.
 */
export function FileDownloadsLeaderboard( {
	rows = [],
	withComparison = false,
}: FileDownloadsLeaderboardProps ) {
	return (
		<LeaderboardChart
			chartTitle={ __( 'Top downloaded', 'jetpack-premium-analytics-pkg' ) }
			data={ buildLeaderboardData( rows ) }
			withComparison={ withComparison }
			withOverlayLabel
			showLegend={ false }
			dataFormat={ DATA_FORMAT }
			columns={ { label: __( 'Files', 'jetpack-premium-analytics-pkg' ), metric: 'downloads' } }
		/>
	);
}

function FileDownloadsInner() {
	const { reportParams } = useWidgetRootContext();
	const { primary, comparisonRows, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsFileDownloads( reportParams as StatsReportParams, { maxRows: WIDGET_ROW_LIMIT } );

	const rows = useMemo(
		() => toFileDownloadRows( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);
	const withComparison = hasComparison;
	const emptyState = useNoViewsEmptyState(
		{ isLoading, isError, isEmpty: rows.length === 0 },
		__( 'You don’t have downloads recorded yet.', 'jetpack-premium-analytics-pkg' )
	);

	useReportActions( {
		csv: {
			exporter: fileDownloadsCsvExporter,
			status: { isLoading, isFetching, isError: primary.isError },
			rowCount: rows.length,
		},
	} );

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ emptyState.isLoading }
				isFetching={ isFetching }
				// `placeholderData` keeps the prior period's rows on screen, so a
				// transient refetch failure should not replace them with an error.
				isError={ rows.length === 0 && isError }
				isEmpty={ rows.length === 0 }
				error={ {
					description: __(
						"We couldn't load file downloads. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ emptyState.empty }
				renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
			>
				<FileDownloadsLeaderboard rows={ rows } withComparison={ withComparison } />
			</WidgetState>
		</div>
	);
}

/**
 * Shows the most-downloaded files as a ranked leaderboard. Date range comes
 * from the shared dashboard date picker via WidgetRoot.
 */
export default function FileDownloadsWidget( { attributes = {} }: FileDownloadsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<FileDownloadsInner />
			</div>
		</WidgetRoot>
	);
}
