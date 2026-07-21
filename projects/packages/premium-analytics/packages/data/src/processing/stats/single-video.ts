import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from './utils';

export type StatsSingleVideoDataPoint = {
	period: string;
	value: number;
};

export type StatsSingleVideoPage = {
	label: string;
	link: string;
};

export type StatsSingleVideoReport = {
	data: StatsSingleVideoDataPoint[];
	pages: StatsSingleVideoPage[];
};

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

	return { data, pages };
}
