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
import { type FileDownloadsAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type FileDownloadsRenderAttributes = FileDownloadsAttributes &
	Partial< ReportParamsFieldAttributes >;
type FileDownloadsWidgetProps = WidgetRenderProps< FileDownloadsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };
const FILE_DOWNLOADS_UNAVAILABLE_STATUS = 404;

function toStatusNumber( value: unknown ): number | null {
	if ( typeof value === 'number' ) {
		return value;
	}

	if ( typeof value === 'string' ) {
		const status = Number.parseInt( value, 10 );
		return Number.isNaN( status ) ? null : status;
	}

	return null;
}

function getErrorStatus( error: unknown ): number | null {
	if ( ! error || typeof error !== 'object' ) {
		return null;
	}

	const err = error as Record< string, unknown >;

	const status = toStatusNumber( err.status );
	if ( status !== null ) {
		return status;
	}

	if ( err.data && typeof err.data === 'object' ) {
		const data = err.data as Record< string, unknown >;
		const dataStatus = toStatusNumber( data.status );
		if ( dataStatus !== null ) {
			return dataStatus;
		}
	}

	if ( err.response && typeof err.response === 'object' ) {
		const response = err.response as Record< string, unknown >;
		const responseStatus = toStatusNumber( response.status );
		if ( responseStatus !== null ) {
			return responseStatus;
		}
	}

	return null;
}

function getErrorText( error: unknown ): string {
	if ( ! error || typeof error !== 'object' ) {
		return '';
	}

	const err = error as Record< string, unknown >;
	const candidates = [
		err.message,
		err.error,
		err.code,
		err.data && typeof err.data === 'object'
			? ( err.data as Record< string, unknown > ).message
			: undefined,
		err.data && typeof err.data === 'object'
			? ( err.data as Record< string, unknown > ).error
			: undefined,
		err.response && typeof err.response === 'object'
			? ( err.response as Record< string, unknown > ).message
			: undefined,
	];

	return candidates
		.filter( ( candidate ): candidate is string => typeof candidate === 'string' )
		.join( ' ' );
}

function getFileDownloadsErrorMessage( error: unknown ) {
	const errorText = getErrorText( error ).toLowerCase();
	const isUnavailableMessage =
		errorText.includes( 'file download' ) &&
		( errorText.includes( 'not available' ) || errorText.includes( 'jetpack site' ) );

	if ( getErrorStatus( error ) === FILE_DOWNLOADS_UNAVAILABLE_STATUS || isUnavailableMessage ) {
		return __(
			'File download stats are not available for Jetpack sites.',
			'jetpack-premium-analytics'
		);
	}

	return undefined;
}

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
			currentShare: ( row.value / maxValue ) * 100,
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? ( previousValue / maxPreviousValue ) * 100
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
		href: item.link,
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
	 * When true, show a loading overlay.
	 */
	isLoading?: boolean;
	/**
	 * When true, show an error message.
	 */
	isError?: boolean;
	/**
	 * When true, render previous-period deltas.
	 */
	withComparison?: boolean;
	/**
	 * Custom error message to show when `isError` is true.
	 */
	errorMessage?: string;
};

/**
 * Presentational leaderboard for the "File downloads" widget.
 *
 * Accepts already-fetched rows and handles loading, error, empty, and
 * populated states. Exported so Storybook can exercise those states with
 * fixture rows without needing a live WordPress backend.
 *
 * @param {FileDownloadsLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export function FileDownloadsLeaderboard( {
	rows = [],
	isLoading = false,
	isError = false,
	withComparison = false,
	errorMessage,
}: FileDownloadsLeaderboardProps ) {
	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>
					{ errorMessage ??
						__( 'Could not load file download data.', 'jetpack-premium-analytics' ) }
				</Text>
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
	const { comparisonRows, hasComparison, isLoading, isFetching, hasData, isError, error } =
		useStatsFileDownloads( reportParams as StatsReportParams, { maxRows: max } );
	const showLoading = isLoading || ( isFetching && hasData );
	const errorMessage = getFileDownloadsErrorMessage( error );

	const rows = useMemo(
		() => toFileDownloadRows( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);
	const withComparison = hasComparison;

	return (
		<div className={ styles.content }>
			<FileDownloadsLeaderboard
				rows={ rows }
				isLoading={ showLoading }
				isError={ isError }
				withComparison={ withComparison }
				errorMessage={ errorMessage }
			/>
		</div>
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
