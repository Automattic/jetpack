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
	label: string;
	labelIcon: string;
	link: string | null;
};

export interface StatsTagsChildItem extends StatsNormalizedItemBase< null > {
	label: string;
	labelIcon: string;
	value: null;
	link: string | null;
	children: null;
}

export interface StatsTagsItem extends StatsNormalizedItemBase< StatsTagsChildItem > {
	label: StatsTagsLabel[];
	labelText: string;
	value: number;
	link: string | null;
	children?: StatsTagsChildItem[];
}

const tagIcon = ( type: unknown ) => ( type === 'category' ? 'folder' : String( type ?? '' ) );

function getTagName( tag: StatsRecord ): string {
	return typeof tag.name === 'string' ? tag.name : '';
}

function getTagLink( tag: StatsRecord ): string | null {
	return typeof tag.link === 'string' ? tag.link : null;
}

function normalizeStatsTagsItem( item: StatsRecord ): StatsTagsItem {
	const tagItems = coerceStatsArray< StatsRecord >( item.tags );
	const hasChildren = tagItems.length > 1;
	const labels = tagItems.map( tag => ( {
		label: getTagName( tag ),
		labelIcon: tagIcon( tag.type ),
		link: hasChildren ? null : getTagLink( tag ),
	} ) );

	return {
		label: labels,
		labelText: labels.map( label => label.label ).join( ', ' ),
		link: hasChildren ? null : labels[ 0 ]?.link ?? null,
		value: safeParseFloat( item.views ),
		...( hasChildren
			? {
					children: tagItems.map( tag => ( {
						label: getTagName( tag ),
						labelIcon: tagIcon( tag.type ),
						value: null,
						link: getTagLink( tag ),
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
