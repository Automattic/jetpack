import { safeParseFloat } from '../../utils/parsing';
import { decodeHtmlText } from '../../utils/text';
import { coerceStatsArray, coerceStatsRecord, isStatsNumericSummaryValue } from './utils';

export type StatsAuthorDataPoint = {
	/** The bucket's first day, `yyyy-MM-dd`. */
	period: string;
	views: number;
};

/** The author the response describes, as the author page header names them. */
export type StatsAuthorIdentity = {
	id: number;
	name: string;
	avatarUrl: string | null;
};

export type StatsAuthorReport = {
	/** The first day the response covers, which can be later than the requested start. */
	startDate: string | null;
	/** One bucket per period, oldest first. */
	data: StatsAuthorDataPoint[];
	views: number;
	/** Window totals; `null` when the response carries no number. */
	likes: number | null;
	comments: number | null;
	/** The author's earliest published content of any type, `Y-m-d H:i:s` GMT. */
	firstContentDate: string | null;
	/** Whether the views were read through the site-wide ranking (`approximate=true`). */
	approximate: boolean;
	author: StatsAuthorIdentity | null;
};

const optionalNumber = ( value: unknown ): number | null =>
	isStatsNumericSummaryValue( value ) ? safeParseFloat( value ) : null;

const optionalString = ( value: unknown ): string | null =>
	typeof value === 'string' && value !== '' ? value : null;

function sanitizeAuthorIdentity( value: unknown ): StatsAuthorIdentity | null {
	const author = coerceStatsRecord( value );
	const id = safeParseFloat( author.author_id );
	if ( ! Number.isInteger( id ) || id <= 0 ) {
		return null;
	}

	// WPCOM entity-encodes the avatar URL (`&amp;` between its query args).
	const avatarUrl = decodeHtmlText( optionalString( author.avatar ) );

	return {
		id,
		name: decodeHtmlText( author.name, '' ),
		avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : null,
	};
}

export function sanitizeStatsAuthorResponse( response: unknown ): StatsAuthorReport {
	const payload = coerceStatsRecord( response );
	const data = coerceStatsArray< unknown >( payload.data )
		.filter(
			( row ): row is [ string, unknown ] =>
				Array.isArray( row ) && row.length >= 2 && typeof row[ 0 ] === 'string'
		)
		.map( ( [ period, views ] ) => ( { period, views: safeParseFloat( views ) } ) )
		.sort( ( a, b ) => a.period.localeCompare( b.period ) );

	return {
		startDate: optionalString( payload.start_date ),
		data,
		views: safeParseFloat( payload.views ),
		likes: optionalNumber( payload.likes ),
		comments: optionalNumber( payload.comments ),
		firstContentDate: optionalString( payload.first_content_date ),
		approximate: payload.approximate === true,
		author: sanitizeAuthorIdentity( payload.author ),
	};
}
