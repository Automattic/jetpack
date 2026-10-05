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
		getColumns: () => [
			{ label: __( 'Name', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
			{ label: __( 'Comments', 'jetpack-premium-analytics-pkg' ), getValue: row => row.value },
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
		],
	};
}

export const commentsAuthorsCsvExporter = commentsCsvExporter( 'authors' );
export const commentsPostsCsvExporter = commentsCsvExporter( 'posts' );
