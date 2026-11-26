import { safeParseFloat } from '../../utils/parsing';
import { decodeHtmlText } from '../../utils/text';
import { coerceStatsArray, coerceStatsRecord, createStatsListDataPoint } from './utils';
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
	[ key: string ]: unknown;
};

/** The taxonomy a `stats/tags` term belongs to; the endpoint reports every non-category as `tag`. */
export type StatsTagsTermType = 'tag' | 'category';

export type StatsTagsLabel = {
	label: string;
	type: StatsTagsTermType;
	labelIcon: string;
	link: string | null;
};

export interface StatsTagsChildItem extends StatsNormalizedItemBase< null > {
	label: string;
	type: StatsTagsTermType;
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

const termType = ( type: unknown ): StatsTagsTermType =>
	type === 'category' ? 'category' : 'tag';

function getTagName( tag: StatsRecord ): string {
	return decodeHtmlText( tag.name, '' );
}

function getTagLink( tag: StatsRecord ): string | null {
	return typeof tag.link === 'string' ? tag.link : null;
}

function normalizeStatsTagsItem( item: StatsRecord ): StatsTagsItem {
	const tagItems = coerceStatsArray< StatsRecord >( item.tags );
	const hasChildren = tagItems.length > 1;
	const labels = tagItems.map( tag => ( {
		label: getTagName( tag ),
		type: termType( tag.type ),
		labelIcon: tagIcon( tag.type ),
		link: hasChildren ? null : getTagLink( tag ),
	} ) );

	return {
		label: labels,
		labelText: labels.map( label => label.label ).join( ', ' ),
		link: hasChildren ? null : ( labels[ 0 ]?.link ?? null ),
		value: safeParseFloat( item.views ),
		...( hasChildren
			? {
					children: tagItems.map( tag => ( {
						label: getTagName( tag ),
						type: termType( tag.type ),
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
	// `stats/tags` returns one ranked list, never `days` or a `summary`.
	const tags = coerceStatsArray< StatsRecord >( coerceStatsRecord( response ).tags ).map(
		normalizeStatsTagsItem
	);

	return {
		summary: {},
		data: tags.length ? [ createStatsListDataPoint( response, query, tags ) ] : [],
	};
}

/**
 * Narrow `stats/tags` rows to one taxonomy, keeping each row's members of that type.
 *
 * A row groups terms that sit on exactly the same posts, so each member has the row's views.
 * One surviving member becomes a plain linked row, several stay a group, none drops the row.
 *
 * @param items - Normalized rows, ranked by views.
 * @param type  - The taxonomy to keep.
 * @return The rows for that taxonomy, in the same order.
 */
export function selectStatsTagsItemsByType(
	items: StatsTagsItem[],
	type: StatsTagsTermType
): StatsTagsItem[] {
	return items.flatMap( ( item ): StatsTagsItem[] => {
		const members = item.children ?? [];

		if ( ! members.length ) {
			return item.label[ 0 ]?.type === type ? [ item ] : [];
		}

		const kept = members.filter( member => member.type === type );

		if ( kept.length === members.length ) {
			return [ item ];
		}

		if ( ! kept.length ) {
			return [];
		}

		const isGroup = kept.length > 1;

		return [
			{
				...item,
				label: kept.map( member => ( {
					label: member.label,
					type: member.type,
					labelIcon: member.labelIcon,
					link: isGroup ? null : member.link,
				} ) ),
				labelText: kept.map( member => member.label ).join( ', ' ),
				link: isGroup ? null : kept[ 0 ].link,
				children: isGroup ? kept : undefined,
			},
		];
	} );
}
