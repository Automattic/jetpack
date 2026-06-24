import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, createStatsListDataPoint } from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsEmailBreakdownItem extends StatsNormalizedItemBase< null > {
	value: number;
	countryCode?: string;
	countryFull?: unknown;
	link?: string;
	[ key: string ]: unknown;
}

const emailLinkLabels: Record< string, string > = {
	'post-url': 'Post URL',
	'like-post': 'Like',
	'comment-post': 'Comment',
	'remove-subscription': 'Unsubscribe',
};

function isEmailBreakdownSummaryValue( value: unknown ): boolean {
	return (
		typeof value === 'number' ||
		( typeof value === 'string' && value.trim() !== '' && ! Number.isNaN( Number( value ) ) )
	);
}

function normalizeEmailBreakdownScalarSummary( response: StatsRecord ) {
	return Object.fromEntries(
		Object.entries( response )
			.filter( ( [ , value ] ) => isEmailBreakdownSummaryValue( value ) )
			.map( ( [ key, value ] ) => [ key, safeParseFloat( value ) ] )
	);
}

function sortEmailBreakdownItems( items: StatsEmailBreakdownItem[] ): StatsEmailBreakdownItem[] {
	return [ ...items ].sort( ( a, b ) => {
		if ( a.label === 'Other' ) {
			return 1;
		}

		if ( b.label === 'Other' ) {
			return -1;
		}

		return b.value - a.value;
	} );
}

function parseFieldlessEmailCountryRows( response: StatsRecord ): StatsEmailBreakdownItem[] {
	const countries = coerceStatsArray< unknown[] >( coerceStatsRecord( response.countries ).data );
	const countryInfo = coerceStatsRecord( response[ 'countries-info' ] );

	return sortEmailBreakdownItems(
		countries.map( row => {
			const countryCode = String( row[ 0 ] ?? '' );
			const country = coerceStatsRecord( countryInfo[ countryCode ] );
			const countryFull = country.country_full;

			return {
				label: countryFull ?? 'Unknown',
				value: safeParseFloat( row[ 1 ] ),
				countryCode: countryFull ? countryCode : undefined,
				countryFull,
				region: country.map_region,
				children: null,
			};
		} )
	);
}

function parseFieldlessEmailListRows(
	response: StatsRecord,
	key: 'clients' | 'devices'
): StatsEmailBreakdownItem[] {
	const rows = coerceStatsArray< unknown[] >( coerceStatsRecord( response[ key ] ).data );

	return sortEmailBreakdownItems(
		rows.map( row => ( {
			label: row[ 0 ],
			value: safeParseFloat( row[ 1 ] ),
			children: null,
		} ) )
	);
}

function parseFieldlessEmailLinkRows( response: StatsRecord ): StatsEmailBreakdownItem[] {
	const internalLinks = coerceStatsArray< unknown[] >( coerceStatsRecord( response.links ).data );
	const userContentLinks = coerceStatsArray< unknown[] >(
		coerceStatsRecord( response[ 'user-content-links' ] ).data
	);
	const items: StatsEmailBreakdownItem[] = internalLinks
		.filter( row => typeof row[ 0 ] === 'string' && emailLinkLabels[ row[ 0 ] ] )
		.map( row => ( {
			label: emailLinkLabels[ String( row[ 0 ] ) ],
			value: safeParseFloat( row[ 1 ] ),
			children: null,
		} ) );
	const otherInternalLinks = internalLinks.reduce( ( total, row ) => {
		const linkType = String( row[ 0 ] ?? '' );

		return emailLinkLabels[ linkType ] || linkType === 'user_link'
			? total
			: total + safeParseFloat( row[ 1 ] );
	}, 0 );

	if ( otherInternalLinks ) {
		items.push( {
			label: 'Other',
			value: otherInternalLinks,
			children: null,
		} );
	}

	userContentLinks.forEach( row => {
		const link = typeof row[ 0 ] === 'string' ? row[ 0 ] : undefined;

		items.push( {
			label: link ?? '',
			link,
			value: safeParseFloat( row[ 1 ] ),
			children: null,
		} );
	} );

	return sortEmailBreakdownItems( items );
}

function parseFieldlessEmailBreakdownRows( response: StatsRecord ): StatsEmailBreakdownItem[] {
	if ( coerceStatsArray( coerceStatsRecord( response.countries ).data ).length ) {
		return parseFieldlessEmailCountryRows( response );
	}

	if ( coerceStatsArray( coerceStatsRecord( response.devices ).data ).length ) {
		return parseFieldlessEmailListRows( response, 'devices' );
	}

	if ( coerceStatsArray( coerceStatsRecord( response.clients ).data ).length ) {
		return parseFieldlessEmailListRows( response, 'clients' );
	}

	if (
		coerceStatsArray( coerceStatsRecord( response.links ).data ).length ||
		coerceStatsArray( coerceStatsRecord( response[ 'user-content-links' ] ).data ).length
	) {
		return parseFieldlessEmailLinkRows( response );
	}

	return [];
}

function parseStatsEmailBreakdownRows( response: unknown ): {
	items: StatsEmailBreakdownItem[];
	metricKey?: string;
} {
	const payload = coerceStatsRecord( response );
	const matrixKey = [ 'clients', 'devices', 'countries', 'links', 'user-content-links' ].find(
		key => coerceStatsArray( coerceStatsRecord( payload[ key ] ).fields ).length
	);

	if ( ! matrixKey ) {
		const items = parseFieldlessEmailBreakdownRows( payload );

		return { items, metricKey: items.length ? 'value' : undefined };
	}

	const matrix = coerceStatsRecord( payload[ matrixKey ] );
	const fields = coerceStatsArray< string >( matrix.fields );
	const labelKey = fields[ 0 ] ?? 'label';
	const metricKey = fields.find( field => field.endsWith( '_count' ) ) ?? fields[ 1 ] ?? 'value';
	const countryInfo = coerceStatsRecord( payload[ 'countries-info' ] );
	const items = coerceStatsArray< unknown[] >( matrix.data ).map( record => {
		const parsed: StatsRecord = {};
		record.forEach( ( value, index ) => {
			const field = fields[ index ];

			if ( field ) {
				parsed[ field ] =
					field === labelKey || ! ( typeof value === 'number' || typeof value === 'string' )
						? value
						: safeParseFloat( value );
			}
		} );

		const country = coerceStatsRecord( countryInfo[ String( parsed[ labelKey ] ) ] );
		// Matrix link payloads keep their API labels; fieldless all-time link payloads map known
		// link types to display labels to match the legacy email stats parser.
		const label =
			matrixKey === 'countries' ? country.country_full ?? parsed[ labelKey ] : parsed[ labelKey ];

		return {
			...parsed,
			label,
			value: safeParseFloat( parsed[ metricKey ] ),
			countryCode: matrixKey === 'countries' ? String( parsed[ labelKey ] ) : undefined,
			countryFull: country.country_full,
			children: null,
		};
	} );

	return { items, metricKey };
}

export function sanitizeStatsEmailBreakdownResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsEmailBreakdownItem > {
	const { items, metricKey } = parseStatsEmailBreakdownRows( response );

	if ( ! items.length || ! metricKey ) {
		return {
			summary: normalizeEmailBreakdownScalarSummary( coerceStatsRecord( response ) ),
			data: [],
		};
	}

	return {
		summary: {
			[ metricKey ]: items.reduce( ( total, item ) => total + item.value, 0 ),
		},
		data: [ createStatsListDataPoint( response, query, items ) ],
	};
}
