/**
 * External dependencies
 */
import {
	fetchStatsTagsRows,
	selectStatsTagsItemsByType,
	type StatsTagsItem,
	type StatsTagsTermType,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { ReportCsvExporter } from './types';

/**
 * `stats/tags` has no "all rows" value (see `StatsTagsParams`), so the report names a ceiling
 * past what a real site produces.
 */
export const TAGS_REPORT_ROW_LIMIT = 1000;

type TagsCsvExporter = ReportCsvExporter< StatsTagsItem, StatsTagsItem >;

export const tagsCsvExporter: TagsCsvExporter = {
	filenamePrefix: 'tags-and-categories',
	hasDateRange: true,
	fetchItems: reportParams => fetchStatsTagsRows( { ...reportParams, max: TAGS_REPORT_ROW_LIMIT } ),
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

const byType = (
	type: StatsTagsTermType,
	filenamePrefix: string,
	getLabelHeader: () => string
): TagsCsvExporter => ( {
	...tagsCsvExporter,
	filenamePrefix,
	fetchItems: async reportParams =>
		selectStatsTagsItemsByType( await tagsCsvExporter.fetchItems( reportParams ), type ),
	getColumns: () => {
		const [ labelColumn, ...columns ] = tagsCsvExporter.getColumns();

		return [ { ...labelColumn, label: getLabelHeader() }, ...columns ];
	},
} );

/** The CSV for a widget narrowed to tags or to categories. */
export const tagsCsvExportersByType: Record< StatsTagsTermType, TagsCsvExporter > = {
	tag: byType( 'tag', 'tags', () => __( 'Tag', 'jetpack-premium-analytics-pkg' ) ),
	category: byType( 'category', 'categories', () =>
		__( 'Category', 'jetpack-premium-analytics-pkg' )
	),
};
