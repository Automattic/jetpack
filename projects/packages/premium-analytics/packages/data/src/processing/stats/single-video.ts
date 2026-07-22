import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

export type StatsSingleVideoDataPoint = {
	period: string;
	value: number;
};

export type StatsSingleVideoPage = {
	label: string;
	link: string;
};

export type StatsSingleVideoPost = {
	id?: number;
	title?: string;
	date?: string;
	mimeType?: string;
};

export type StatsSingleVideoReport = {
	data: StatsSingleVideoDataPoint[];
	pages: StatsSingleVideoPage[];
	post: StatsSingleVideoPost | null;
};

function sanitizeSingleVideoPost( value: unknown ): StatsSingleVideoPost | null {
	if ( ! isStatsRecord( value ) ) {
		return null;
	}

	const id = Number( value.ID );

	return {
		...( ( typeof value.ID === 'number' || typeof value.ID === 'string' ) &&
		Number.isInteger( id ) &&
		id > 0
			? { id }
			: {} ),
		...( typeof value.post_title === 'string' ? { title: value.post_title } : {} ),
		...( typeof value.post_date === 'string' ? { date: value.post_date } : {} ),
		...( typeof value.post_mime_type === 'string' ? { mimeType: value.post_mime_type } : {} ),
	};
}

export function sanitizeStatsSingleVideoResponse( response: unknown ): StatsSingleVideoReport {
	const payload = coerceStatsRecord( response );
	const data = coerceStatsArray< unknown >( payload.data )
		.filter(
			( row ): row is [ string, unknown ] =>
				Array.isArray( row ) && row.length >= 2 && typeof row[ 0 ] === 'string'
		)
		.map( ( [ period, value ] ) => ( {
			period,
			value: safeParseFloat( value ),
		} ) );
	const pages = coerceStatsArray< unknown >( payload.pages )
		.filter( ( page ): page is string => typeof page === 'string' )
		.map( page => ( { label: page, link: page } ) );
	const post = sanitizeSingleVideoPost( payload.post );

	return { data, pages, post };
}
