import type { OrganizationSettings } from './schema-settings-types';

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
