import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsTagsRawTag = {
	type?: string;
	name?: string;
	link?: string | null;
	[ key: string ]: unknown;
};

export type StatsTagsRawItem = {
	tags?: StatsTagsRawTag[];
	views?: number | string;
	[ key: string ]: unknown;
};

export type StatsTagsRawResponse = {
	date?: string;
	period?: string;
	tags?: StatsTagsRawItem[];
	days?: Record< string, { tags?: StatsTagsRawItem[]; [ key: string ]: unknown } >;
	summary?: { tags?: StatsTagsRawItem[]; [ key: string ]: unknown };
	[ key: string ]: unknown;
};

export type StatsTagsLabel = {
	label: unknown;
	labelIcon: string;
	link: unknown;
};

export interface StatsTagsChildItem extends StatsNormalizedItemBase< null > {
	labelIcon: string;
	value: null;
	link: unknown;
	children: null;
}

export interface StatsTagsItem extends StatsNormalizedItemBase< StatsTagsChildItem > {
	label: string;
	labels: StatsTagsLabel[];
	value: number;
	link: unknown;
	children?: StatsTagsChildItem[];
}

const tagIcon = ( type: unknown ) => ( type === 'category' ? 'folder' : String( type ?? '' ) );

function normalizeStatsTagsItem( item: StatsRecord ): StatsTagsItem {
	const tagItems = coerceStatsArray< StatsRecord >( item.tags );
	const hasChildren = tagItems.length > 1;
	const labels = tagItems.map( tag => ( {
		label: tag.name,
		labelIcon: tagIcon( tag.type ),
		link: hasChildren ? null : tag.link,
	} ) );

	return {
		label: labels.map( label => label.label ).join( ', ' ),
		labels,
		link: hasChildren ? null : labels[ 0 ]?.link,
		value: safeParseFloat( item.views ),
		...( hasChildren
			? {
					children: tagItems.map( tag => ( {
						label: tag.name,
						labelIcon: tagIcon( tag.type ),
						value: null,
						link: tag.link,
						children: null,
					} ) ),
			  }
			: {} ),
	};
}

export function sanitizeStatsTagsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTagsItem > {
	const data = mapStatsReportDataPoints( response, query, [ 'tags' ], normalizeStatsTagsItem );
	const topLevelTags = coerceStatsArray< StatsRecord >( coerceStatsRecord( response ).tags ).map(
		normalizeStatsTagsItem
	);
	const normalizedData = [ ...data ];

	if ( ! normalizedData.length && topLevelTags.length ) {
		normalizedData.push( createStatsListDataPoint( response, query, topLevelTags ) );
	}

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'tags' ] ),
		data: normalizedData,
	};
}
