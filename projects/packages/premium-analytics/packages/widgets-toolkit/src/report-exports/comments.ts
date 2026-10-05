/**
 * External dependencies
 */
import {
	fetchStatsComments,
	selectStatsCommentsRows,
	type StatsCommentsGroup,
	type StatsCommentsResponse,
	type StatsCommentsRow,
} from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { ReportCsvExporter } from './types';
import type { CsvColumn } from '../helpers/build-csv';

/** One Comments group's rows, with remote post permalinks guarded. */
export function toCommentRows(
	report: StatsCommentsResponse | undefined,
	group: StatsCommentsGroup
): StatsCommentsRow[] {
	const rows = selectStatsCommentsRows( report, group );

	// Author links are relative `edit-comments.php` filters the scheme guard would reject.
	if ( group === 'authors' ) {
		return rows;
	}

	// Only `link` is replaced: row identity can key on the raw link.
	return rows.map( row => ( { ...row, link: safeHttpUrl( row.link ) ?? undefined } ) );
}

function commentsCsvExporter(
	group: StatsCommentsGroup
): ReportCsvExporter< StatsCommentsRow, StatsCommentsRow > {
	return {
		filenamePrefix: `comments-${ group }`,
		hasDateRange: false,
		fetchItems: async () => toCommentRows( await fetchStatsComments(), group ),
		toCsvRows: items => items,
		getColumns: () => {
			const columns: CsvColumn< StatsCommentsRow >[] = [
				{ label: __( 'Name', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
				{ label: __( 'Comments', 'jetpack-premium-analytics-pkg' ), getValue: row => row.value },
			];

			// Author links are relative wp-admin filters that can carry a guest's email.
			if ( group === 'posts' ) {
				columns.push( {
					label: __( 'URL', 'jetpack-premium-analytics-pkg' ),
					getValue: row => row.link ?? '',
				} );
			}

			return columns;
		},
	};
}

export const commentsAuthorsCsvExporter = commentsCsvExporter( 'authors' );
export const commentsPostsCsvExporter = commentsCsvExporter( 'posts' );
