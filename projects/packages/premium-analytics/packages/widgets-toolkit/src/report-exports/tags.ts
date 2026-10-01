/**
 * External dependencies
 */
import { fetchStatsTagsRows, type StatsTagsItem } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { UndatedReportCsvExporter } from './types';

/** The Tags report's row cap; the widget's ten-row request would truncate the file. */
export const TAGS_REPORT_ROW_LIMIT = 1000;

export const tagsCsvExporter: UndatedReportCsvExporter< StatsTagsItem, StatsTagsItem > = {
	filenamePrefix: 'tags-and-categories',
	hasDateRange: false,
	fetchItems: () => fetchStatsTagsRows( { max: TAGS_REPORT_ROW_LIMIT } ),
	toCsvRows: items => [ ...items ].sort( ( a, b ) => b.value - a.value ),
	getColumns: () => [
		{
			label: __( 'Tag or category', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.labelText,
		},
		{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.value },
		{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
	],
};
