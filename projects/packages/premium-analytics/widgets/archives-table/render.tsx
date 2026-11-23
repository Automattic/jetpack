/**
 * External dependencies
 */
import { useStatsArchives } from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import {
	DataViewsDrilldownNative,
	WidgetRoot,
	WidgetState,
	archivesCsvExporter,
	buildArchiveRows,
	describeError,
	getPostsReportQueryParams,
	useReportActions,
	useWidgetRootContext,
	type ArchiveRow,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { getArchivesFields } from './fields';
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

export type ArchivesTableAttributes = Record< never, never >;

type ArchivesTableRenderAttributes = ArchivesTableAttributes &
	Partial< ReportParamsFieldAttributes >;

const INITIAL_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			views: { align: 'end' as const },
		},
	},
};

/**
 * Stable row id for the archives table.
 *
 * @param item - The archive row.
 * @return The row id.
 */
function getArchiveRowId( item: ArchiveRow ): string {
	return item.id;
}

/**
 * The parent row of a nested archive row.
 *
 * @param item - The archive row.
 * @return The parent row ID, if the row is nested.
 */
function getArchiveRowParentId( item: ArchiveRow ): string | undefined {
	return item.parentId;
}

/**
 * Every archive page of the period, grouped by type, as a searchable table.
 *
 * @return The table, or the state that stands in for it.
 */
function ArchivesTable() {
	const { reportParams } = useWidgetRootContext();

	const recordsParams = useMemo(
		() => getPostsReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const { primary, comparisonRows, hasComparison, isLoading, isFetching, isError, error, refetch } =
		useStatsArchives( recordsParams );
	const items = useMemo( () => comparisonRows?.rows ?? [], [ comparisonRows ] );
	const rows = useMemo( () => buildArchiveRows( items ), [ items ] );
	const fields = useMemo( () => getArchivesFields( hasComparison ), [ hasComparison ] );

	useReportActions( {
		csv: {
			exporter: archivesCsvExporter,
			status: { isLoading, isFetching, isError: primary.isError },
			rowCount: items.length,
		},
	} );

	return (
		<Stack direction="column" className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ rows.length === 0 && isError }
				isEmpty={ rows.length === 0 }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load posts. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
			>
				<div className={ styles.table }>
					<DataViewsDrilldownNative< ArchiveRow >
						data={ rows }
						fields={ fields }
						getItemId={ getArchiveRowId }
						getItemParentId={ getArchiveRowParentId }
						initialView={ INITIAL_VIEW }
						searchLabel={ __( 'Search archives', 'jetpack-premium-analytics-pkg' ) }
						hideLevelMarkers
						collapsible
						defaultExpanded="none"
					/>
				</div>
			</WidgetState>
		</Stack>
	);
}

/**
 * The archives table of the All pages report.
 *
 * @param {WidgetRenderProps} props - The host's props.
 * @return The widget.
 */
export default function ArchivesTableWidget( {
	attributes = {},
}: WidgetRenderProps< ArchivesTableRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ArchivesTable />
		</WidgetRoot>
	);
}
