import { __, _x } from '@wordpress/i18n';
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, createStatsListDataPoint } from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsEmailBreakdownItem extends StatsNormalizedItemBase< null > {
	value: number;
	countryCode?: string;
	countryFull?: unknown;
	link?: string;
	/**
	 * Marks the aggregated catch-all row, which always sorts last. Consumers must
	 * key off this rather than the label, which is localized.
	 */
	isOther?: boolean;
	[ key: string ]: unknown;
}

const EMAIL_LINK_TYPES = [
	'post-url',
	'like-post',
	'comment-post',
	'remove-subscription',
] as const;

type EmailLinkType = ( typeof EMAIL_LINK_TYPES )[ number ];

/**
 * The literal WPCOM returns for its aggregated bucket in the `clients` and
 * `devices` breakdowns. Matching it here, at the API boundary, is what lets the
 * row carry a localized label while sorting stays keyed on `isOther`.
 */
const API_OTHER_BUCKET = 'Other';

function isEmailLinkType( value: unknown ): value is EmailLinkType {
	return typeof value === 'string' && EMAIL_LINK_TYPES.includes( value as EmailLinkType );
}

/**
 * Display label for a known internal email link type. Resolved per call, not from
 * a module-level map, so the strings translate against the locale data loaded at
 * render time rather than whatever was loaded when this module was imported.
 *
 * @param linkType - The internal link type reported by the API.
 * @return The localized display label.
 */
function emailLinkLabel( linkType: EmailLinkType ): string {
	switch ( linkType ) {
		case 'post-url':
			return _x( 'Post URL', 'Email link type', 'jetpack-premium-analytics-pkg' );
		case 'like-post':
			return _x( 'Like', 'Email link type', 'jetpack-premium-analytics-pkg' );
		case 'comment-post':
			return _x( 'Comment', 'Email link type', 'jetpack-premium-analytics-pkg' );
		case 'remove-subscription':
			return _x( 'Unsubscribe', 'Email link type', 'jetpack-premium-analytics-pkg' );
	}
}

function otherLabel(): string {
	return __( 'Other', 'jetpack-premium-analytics-pkg' );
}

function otherEmailLinkLabel(): string {
	return _x( 'Other', 'Email link type', 'jetpack-premium-analytics-pkg' );
}

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

/**
 * Comparator ordering breakdown items by value, descending, with the aggregated
 * catch-all row pinned last. Exported for consumers that merge rows from several
 * breakdown reports and need to restore this order — e.g. the email breakdown
 * widget's links view.
 *
 * Pinning keys on `isOther`, never on the label: the label is localized, so a
 * string comparison would silently stop matching in every non-English locale.
 *
 * @param a - The first item.
 * @param b - The second item.
 * @return A standard comparator result.
 */
export function compareEmailBreakdownItems(
	a: Pick< StatsEmailBreakdownItem, 'value' | 'isOther' >,
	b: Pick< StatsEmailBreakdownItem, 'value' | 'isOther' >
): number {
	// Coerce: rows from breakdowns that have no catch-all bucket omit the flag
	// entirely, so `undefined` and `false` must compare equal.
	const aIsOther = Boolean( a.isOther );
	const bIsOther = Boolean( b.isOther );

	if ( aIsOther !== bIsOther ) {
		return aIsOther ? 1 : -1;
	}

	return b.value - a.value;
}

function sortEmailBreakdownItems( items: StatsEmailBreakdownItem[] ): StatsEmailBreakdownItem[] {
	return [ ...items ].sort( compareEmailBreakdownItems );
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
				label: countryFull ?? __( 'Unknown', 'jetpack-premium-analytics-pkg' ),
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
		rows.map( row => {
			const isOther = row[ 0 ] === API_OTHER_BUCKET;

			return {
				label: isOther ? otherLabel() : row[ 0 ],
				value: safeParseFloat( row[ 1 ] ),
				...( isOther && { isOther: true } ),
				children: null,
			};
		} )
	);
}

function parseFieldlessEmailLinkRows( response: StatsRecord ): StatsEmailBreakdownItem[] {
	const internalLinks = coerceStatsArray< unknown[] >( coerceStatsRecord( response.links ).data );
	const userContentLinks = coerceStatsArray< unknown[] >(
		coerceStatsRecord( response[ 'user-content-links' ] ).data
	);
	// flatMap rather than filter+map: the type guard narrows `linkType` for the
	// `emailLinkLabel` call, which a separate filter step would not.
	const items: StatsEmailBreakdownItem[] = internalLinks.flatMap( row => {
		const linkType = row[ 0 ];

		return isEmailLinkType( linkType )
			? [
					{
						label: emailLinkLabel( linkType ),
						value: safeParseFloat( row[ 1 ] ),
						children: null,
					},
			  ]
			: [];
	} );
	const otherInternalLinks = internalLinks.reduce( ( total, row ) => {
		const linkType = row[ 0 ];

		return isEmailLinkType( linkType ) || linkType === 'user_link'
			? total
			: total + safeParseFloat( row[ 1 ] );
	}, 0 );

	if ( otherInternalLinks ) {
		items.push( {
			label: otherEmailLinkLabel(),
			value: otherInternalLinks,
			isOther: true,
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

		const rawLabel = parsed[ labelKey ];
		const country = coerceStatsRecord( countryInfo[ String( rawLabel ) ] );
		// Matrix link payloads keep their API labels; fieldless all-time link payloads map known
		// link types to display labels to match the legacy email stats parser.
		const isOther = matrixKey !== 'countries' && rawLabel === API_OTHER_BUCKET;
		let label = rawLabel;

		if ( isOther ) {
			label = otherLabel();
		} else if ( matrixKey === 'countries' ) {
			label = country.country_full ?? rawLabel;
		}

		return {
			...parsed,
			label,
			...( isOther && { isOther: true } ),
			value: safeParseFloat( parsed[ metricKey ] ),
			countryCode: matrixKey === 'countries' ? String( parsed[ labelKey ] ) : undefined,
			countryFull: country.country_full,
			children: null,
		};
	} );

	return { items: sortEmailBreakdownItems( items ), metricKey };
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
