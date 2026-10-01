/**
 * External dependencies
 */
import {
	fetchStatsUtmRows,
	type ReportParams,
	type StatsUtmComparisonItem,
	type StatsUtmComparisonTopPostItem,
	type StatsUtmParam,
	type StatsUtmParams,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { DatedReportCsvExporter } from './types';

/** The UTM report's tabs, one per endpoint dimension. */
export type UtmReportSection =
	'source-medium' | 'campaign-source-medium' | 'source' | 'medium' | 'campaign';

const UTM_DIMENSIONS: Record<
	UtmReportSection,
	{ utmParam: StatsUtmParam; getLabel: () => string }
> = {
	'source-medium': {
		utmParam: 'utm_source,utm_medium',
		getLabel: () => __( 'Source / Medium', 'jetpack-premium-analytics-pkg' ),
	},
	'campaign-source-medium': {
		utmParam: 'utm_campaign,utm_source,utm_medium',
		getLabel: () => __( 'Campaign / Source / Medium', 'jetpack-premium-analytics-pkg' ),
	},
	source: {
		utmParam: 'utm_source',
		getLabel: () => __( 'Source', 'jetpack-premium-analytics-pkg' ),
	},
	medium: {
		utmParam: 'utm_medium',
		getLabel: () => __( 'Medium', 'jetpack-premium-analytics-pkg' ),
	},
	campaign: {
		utmParam: 'utm_campaign',
		getLabel: () => __( 'Campaign', 'jetpack-premium-analytics-pkg' ),
	},
};

/** The dimension's name, which heads both its report tab and its CSV column. */
export function getUtmDimensionLabel( section: UtmReportSection ): string {
	return UTM_DIMENSIONS[ section ].getLabel();
}

/** The report tab that lists a widget's UTM dimension. */
export function getUtmReportSection( utmParam: StatsUtmParam ): UtmReportSection {
	return ( Object.keys( UTM_DIMENSIONS ) as UtmReportSection[] ).find(
		section => UTM_DIMENSIONS[ section ].utmParam === utmParam
	);
}

/** The UTM report's query: every value with its top posts, as Calypso's full UTM report requests. */
export function getUtmReportQueryParams(
	reportParams: ReportParams,
	section: UtmReportSection
): StatsUtmParams {
	// `ReportParams` types `post_id` as its URL string; the UTM query passes it through as-is.
	return {
		...reportParams,
		max: 0,
		summarize: 0,
		query_top_posts: true,
		utmParam: UTM_DIMENSIONS[ section ].utmParam,
	} as StatsUtmParams;
}

/** A UTM parent or nested post row shown in the report table. */
export type UtmReportRow = {
	id: string;
	parentId?: string;
	label: string;
	groupLabel?: string;
	postId?: number;
	views: number;
	previousViews?: number;
	isGroup?: boolean;
};

/**
 * Build a stable id for a post nested under a UTM parent.
 *
 * @param parentId - The UTM parent row id.
 * @param post     - The nested post.
 * @return The post row id.
 */
function getUtmPostRowId( parentId: string, post: StatsUtmComparisonTopPostItem ): string {
	return JSON.stringify( [ parentId, post.id, post.href, post.label ] );
}

/**
 * Flatten comparison-aware UTM items into parent rows followed by their posts.
 *
 * @param items - The merged current/comparison UTM items.
 * @return UTM parents and nested post rows in display order.
 */
export function aggregateUtmRows( items: StatsUtmComparisonItem[] ): UtmReportRow[] {
	return items.flatMap( item => {
		const label = String( item.label ?? '' );
		// The raw tuple distinguishes labels that happen to format identically.
		const id = JSON.stringify( [ 'utm', item.paramValues ?? label ] );
		const parent: UtmReportRow = {
			id,
			label,
			views: item.value,
			previousViews: item.previousValue,
			isGroup: true,
		};
		const posts = ( item.children ?? [] ).map( post => ( {
			id: getUtmPostRowId( id, post ),
			parentId: id,
			label: String( post.label ?? '' ),
			groupLabel: label,
			postId: post.id,
			views: post.value,
			previousViews: post.previousValue,
		} ) );

		return [ parent, ...posts ];
	} );
}

/**
 * Keep nested posts identifiable after the UTM hierarchy is flattened into CSV rows.
 *
 * @param item - The UTM parent or nested post row.
 * @return The UTM value or UTM-qualified post title.
 */
function getUtmCsvLabel( item: UtmReportRow ): string {
	return item.groupLabel ? `${ item.groupLabel } > ${ item.label }` : item.label;
}

function utmCsvExporter(
	section: UtmReportSection
): DatedReportCsvExporter< UtmReportRow, UtmReportRow > {
	return {
		filenamePrefix: `utm-${ section }`,
		hasDateRange: true,
		fetchItems: async reportParams =>
			aggregateUtmRows(
				await fetchStatsUtmRows( getUtmReportQueryParams( reportParams, section ) )
			),
		toCsvRows: items => items,
		getColumns: () => [
			{ label: getUtmDimensionLabel( section ), getValue: getUtmCsvLabel },
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		],
	};
}

export const utmCsvExporters: Record<
	UtmReportSection,
	DatedReportCsvExporter< UtmReportRow, UtmReportRow >
> = {
	'source-medium': utmCsvExporter( 'source-medium' ),
	'campaign-source-medium': utmCsvExporter( 'campaign-source-medium' ),
	source: utmCsvExporter( 'source' ),
	medium: utmCsvExporter( 'medium' ),
	campaign: utmCsvExporter( 'campaign' ),
};
