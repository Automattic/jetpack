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
 * Map an app slug to a display label.
 *
 * @param app - App slug from the stats API.
 * @return    Display label for the app.
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
 * Format a percentage with at most one fractional digit.
 *
 * @param pct - Percentage as a number (25 → "25%"), not a fraction.
 * @return    Localized percentage string.
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
 * Format a YYYY-MM-DD date string in the user's locale. Parse and format in
 * local time to match `@automattic/charts`' parseAsLocalDate; UTC anchoring
 * would shift the label by a day for users east of UTC.
 *
 * @param date - ISO date string.
 * @return     Localized "MMM D, YYYY" date string.
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
 * Resolve an ISO 3166-1 country code to a localized name, with a fallback for
 * unknown or missing codes.
 *
 * @param country  - ISO country code.
 * @param fallback - Label returned when the code is empty.
 * @return         Localized country name, or the uppercased code on environments without Intl.DisplayNames.
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
