import type {
	LocalBusinessSettings,
	OpeningHoursDay,
	OrganizationSettings,
} from './schema-settings-types';

export const normalizeProfileUrl = ( profile: string ): string => {
	const trimmed = profile.trim();
	if ( ! trimmed ) {
		return '';
	}

	try {
		const url = new URL( trimmed );
		if ( ! [ 'http:', 'https:' ].includes( url.protocol ) || ! url.hostname.includes( '.' ) ) {
			return '';
		}
		return url.href;
	} catch {
		return '';
	}
};

export const cleanProfileUrls = ( sameAs: string[] ): string[] =>
	Array.from( new Set( sameAs.map( normalizeProfileUrl ).filter( Boolean ) ) );

export const cleanOrganization = ( organization: OrganizationSettings ): OrganizationSettings => ( {
	...organization,
	sameAs: cleanProfileUrls( organization.sameAs ),
} );

const trim = ( value: string ): string => value.trim();

const normalizeCountryCode = ( value: string ): string => {
	const trimmed = trim( value );
	return /^[A-Za-z]{2}$/.test( trimmed ) ? trimmed.toUpperCase() : trimmed;
};

const OPENING_DAYS: OpeningHoursDay[] = [ 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su' ];

export const cleanLocalBusiness = (
	localBusiness: LocalBusinessSettings
): LocalBusinessSettings => ( {
	enabled: localBusiness.enabled,
	address: {
		streetAddress: trim( localBusiness.address.streetAddress ),
		addressLocality: trim( localBusiness.address.addressLocality ),
		addressRegion: trim( localBusiness.address.addressRegion ),
		postalCode: trim( localBusiness.address.postalCode ),
		addressCountry: normalizeCountryCode( localBusiness.address.addressCountry ),
	},
	telephone: trim( localBusiness.telephone ),
	geo: {
		latitude: trim( localBusiness.geo.latitude ),
		longitude: trim( localBusiness.geo.longitude ),
	},
	openingHours: Object.fromEntries(
		OPENING_DAYS.map( day => [
			day,
			{
				opens: trim( localBusiness.openingHours[ day ].opens ),
				closes: trim( localBusiness.openingHours[ day ].closes ),
			},
		] )
	) as LocalBusinessSettings[ 'openingHours' ],
	priceRange: trim( localBusiness.priceRange ),
} );
