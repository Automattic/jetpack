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

/** The Tags report's tabs, as `?section=` names them. */
export type TagsReportSection = 'all' | 'tags' | 'categories';

const SECTIONS_BY_TERM_TYPE: Record< StatsTagsTermType, TagsReportSection > = {
	tag: 'tags',
	category: 'categories',
};

/** The taxonomy each section narrows the rows to; `all` keeps both. */
export const TAGS_TERM_TYPES: Record< TagsReportSection, StatsTagsTermType | undefined > = {
	all: undefined,
	tags: 'tag',
	categories: 'category',
};

export function getTagsReportSection( termType?: StatsTagsTermType ): TagsReportSection {
	return termType ? SECTIONS_BY_TERM_TYPE[ termType ] : 'all';
}

/**
 * Name the label column after the rows' taxonomy, in the table and the CSV alike.
 *
 * @param termType - The taxonomy the rows are narrowed to, if any.
 * @return The column label.
 */
export function getTagColumnLabel( termType?: StatsTagsTermType ): string {
	if ( termType === 'tag' ) {
		return __( 'Tag', 'jetpack-premium-analytics-pkg' );
	}

	if ( termType === 'category' ) {
		return __( 'Category', 'jetpack-premium-analytics-pkg' );
	}

	return __( 'Tag or category', 'jetpack-premium-analytics-pkg' );
}

type TagsCsvExporter = ReportCsvExporter< StatsTagsItem, StatsTagsItem >;

export const tagsCsvExporter: TagsCsvExporter = {
	filenamePrefix: 'tags-and-categories',
	hasDateRange: true,
	fetchItems: reportParams => fetchStatsTagsRows( { ...reportParams, max: TAGS_REPORT_ROW_LIMIT } ),
	toCsvRows: items => [ ...items ].sort( ( a, b ) => b.value - a.value ),
	getColumns: () => [
		{ label: getTagColumnLabel(), getValue: row => row.labelText },
		{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.value },
		{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
	],
};

const byType = ( type: StatsTagsTermType, filenamePrefix: string ): TagsCsvExporter => ( {
	...tagsCsvExporter,
	filenamePrefix,
	fetchItems: async reportParams =>
		selectStatsTagsItemsByType( await tagsCsvExporter.fetchItems( reportParams ), type ),
	getColumns: () => {
		const [ labelColumn, ...columns ] = tagsCsvExporter.getColumns();

		return [ { ...labelColumn, label: getTagColumnLabel( type ) }, ...columns ];
	},
} );

/** The CSV for a widget or report tab narrowed to tags or to categories. */
export const tagsCsvExportersByType: Record< StatsTagsTermType, TagsCsvExporter > = {
	tag: byType( 'tag', 'tags' ),
	category: byType( 'category', 'categories' ),
};
