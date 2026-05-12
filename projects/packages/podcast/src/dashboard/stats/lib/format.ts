const APP_LABELS: Record< string, string > = {
	apple: 'Apple',
	castbox: 'Castbox',
	castro: 'Castro',
	overcast: 'Overcast',
	pocketcasts: 'Pocket Casts',
	'podcast-addict': 'Podcast Addict',
	spotify: 'Spotify',
	web: 'Web',
	other: 'Other',
};

/**
 * Display label for an app slug.
 *
 * @param app - App slug.
 * @return    Display label.
 */
export function formatAppName( app: string ): string {
	return (
		APP_LABELS[ app ] ??
		app
			.split( '-' )
			.filter( Boolean )
			.map( part => part.charAt( 0 ).toUpperCase() + part.slice( 1 ) )
			.join( ' ' )
	);
}

const PCT_FORMATTER = new Intl.NumberFormat( undefined, {
	style: 'percent',
	maximumFractionDigits: 1,
} );

/**
 * Format a percentage value (25 → "25%"), not a fraction.
 *
 * @param pct - Percentage value.
 * @return    Localized percentage.
 */
export function formatPct( pct: number ): string {
	return PCT_FORMATTER.format( pct / 100 );
}

const DATE_FORMATTER = new Intl.DateTimeFormat( undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
} );

/**
 * Format a YYYY-MM-DD date in local time (matches `@automattic/charts`; UTC would shift east of UTC).
 *
 * @param date - ISO date.
 * @return     Localized date.
 */
export function formatPodcastDate( date: string ): string {
	return DATE_FORMATTER.format( new Date( `${ date }T00:00:00` ) );
}

type DisplayNamesConstructor = new (
	locales: Intl.LocalesArgument | undefined,
	options: { type: 'region' }
) => {
	of: ( code: string ) => string | undefined;
};

let regionNames: { of: ( code: string ) => string | undefined } | null | undefined;

const getRegionNames = () => {
	if ( regionNames !== undefined ) {
		return regionNames;
	}
	const DisplayNames = ( Intl as typeof Intl & { DisplayNames?: DisplayNamesConstructor } )
		.DisplayNames;
	if ( ! DisplayNames ) {
		regionNames = null;
		return regionNames;
	}
	try {
		regionNames = new DisplayNames( undefined, { type: 'region' } );
	} catch {
		regionNames = null;
	}
	return regionNames;
};

/**
 * Localize an ISO 3166-1 country code.
 *
 * @param country  - Country code.
 * @param fallback - Label when empty.
 * @return         Localized name.
 */
export function getCountryName( country: string, fallback: string ): string {
	if ( ! country ) {
		return fallback;
	}
	const normalized = country.toUpperCase();
	const names = getRegionNames();
	if ( ! names ) {
		return normalized;
	}
	try {
		return names.of( normalized ) ?? normalized;
	} catch {
		return normalized;
	}
}
