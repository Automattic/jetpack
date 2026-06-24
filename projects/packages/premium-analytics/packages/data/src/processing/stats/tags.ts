import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, createStatsListDataPoint } from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsTagsItem extends StatsNormalizedItemBase< StatsTagsItem > {
	value: number;
	link?: unknown;
	labels?: Array< { label: unknown; labelIcon: string; link: unknown } >;
	labelIcon?: string;
}

const tagIcon = ( type: unknown ) => ( type === 'category' ? 'folder' : String( type ?? '' ) );

export function sanitizeStatsTagsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTagsItem > {
	const tags = coerceStatsArray< StatsRecord >( coerceStatsRecord( response ).tags );
	const items = tags.map( item => {
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
			children: hasChildren
				? tagItems.map( tag => ( {
						label: tag.name,
						labelIcon: tagIcon( tag.type ),
						value: 0,
						link: tag.link,
						children: null,
				  } ) )
				: null,
		};
	} );

	return {
		summary: {
			total: items.reduce( ( total, item ) => total + item.value, 0 ),
		},
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
