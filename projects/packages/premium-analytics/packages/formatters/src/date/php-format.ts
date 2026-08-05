/**
 * Helpers for the PHP `date()` format strings WordPress stores in its
 * `date_format` option and hands to the page via `@wordpress/date`.
 */

/** Tokens that render a year: 4-digit, 2-digit, and ISO week-numbering. */
const YEAR_TOKENS = new Set( [ 'Y', 'y', 'o' ] );

/** Tokens that render a weekday: full name, short name, and the two numeric forms. */
const WEEKDAY_TOKENS = new Set( [ 'l', 'D', 'N', 'w' ] );

/** Full weekday name, the form a date-scale label leads with. */
const WEEKDAY_FORMAT = 'l';

/**
 * Separator between the weekday and the date it introduces.
 *
 * Ours rather than WordPress's: no locale datum describes this join, since
 * core publishes no weekday-bearing format to take it from.
 */
const WEEKDAY_SEPARATOR = ', ';

type Segment = {
	/** The original text, backslash included, so re-joining is lossless. */
	source: string;
	/** Whether this renders a date part rather than literal text. */
	isToken: boolean;
	/** The token letter, or the literal character for an escaped segment. */
	char: string;
};

/**
 * Split a PHP format string into tokens and literals.
 *
 * Backslash escapes have to be honoured rather than scanned past: `es_ES`
 * ships `j \d\e F \d\e Y`, where `\d` and `\e` spell the word "de" but are
 * also the letters for the day and timezone tokens.
 *
 * @param phpFormat - PHP `date()` format string.
 * @return The segments, in order.
 */
function toSegments( phpFormat: string ): Segment[] {
	const segments: Segment[] = [];

	for ( let index = 0; index < phpFormat.length; index++ ) {
		const char = phpFormat[ index ];

		if ( char === '\\' && index + 1 < phpFormat.length ) {
			segments.push( {
				source: phpFormat.slice( index, index + 2 ),
				isToken: false,
				char: phpFormat[ index + 1 ],
			} );
			index++;
			continue;
		}

		segments.push( { source: char, isToken: /[A-Za-z]/.test( char ), char } );
	}

	return segments;
}

/**
 * Remove the year from a PHP format string, along with the punctuation that
 * introduces it.
 *
 * WordPress only publishes whole date formats, so a month-and-day format has
 * to be derived from one. The separator run adjoining the year is taken with
 * it — the run on the side facing the rest of the format, which is the side
 * the punctuation belongs to (`F j, Y` → `F j`, but `Y-m-d` → `m-d`). Where
 * the year is the last token, any literal trailing it goes too, since it was
 * qualifying the year (`j F Y г.` → `j F`). A dot immediately before a
 * trailing year is retained because dot-separated locales use it to terminate
 * the preceding ordinal (`j.n.Y` → `j.n.`).
 *
 * @param phpFormat - PHP `date()` format string.
 * @return The format without its year, or unchanged when it has none.
 */
export function withoutYear( phpFormat: string ): string {
	const segments = toSegments( phpFormat );
	const yearAt = segments.findIndex(
		segment => segment.isToken && YEAR_TOKENS.has( segment.char )
	);

	if ( yearAt === -1 ) {
		return phpFormat;
	}

	let precedingToken = yearAt - 1;
	while ( precedingToken >= 0 && ! segments[ precedingToken ].isToken ) {
		precedingToken--;
	}

	let followingToken = yearAt + 1;
	while ( followingToken < segments.length && ! segments[ followingToken ].isToken ) {
		followingToken++;
	}

	let start = yearAt;
	let end = yearAt + 1;

	if ( precedingToken >= 0 ) {
		start = precedingToken + 1;
		// In dot-separated formats the dot also marks the preceding numeric
		// day or month as ordinal (`j.n.Y` → `j.n.`). Keep it while dropping
		// any whitespace before the year.
		if ( segments[ start ]?.source === '.' ) {
			start++;
		}
	}

	if ( followingToken === segments.length ) {
		// Only literals follow the year, and with the token they qualified gone
		// they have nothing left to say: `j F Y г.` → `j F`, not `j F г.`.
		end = segments.length;
	} else if ( precedingToken < 0 ) {
		end = followingToken;
	}

	return [ ...segments.slice( 0, start ), ...segments.slice( end ) ]
		.map( segment => segment.source )
		.join( '' );
}

/**
 * Put the weekday in front of a PHP format string.
 *
 * WordPress publishes no weekday-bearing format, so one has to be derived from
 * the site's. The weekday name still comes from WordPress's translation
 * tables; only the separator is ours, and only the leading position is assumed
 * — every locale core ships puts the weekday first when it names one at all.
 *
 * @param phpFormat - PHP `date()` format string.
 * @return The format led by its weekday, or unchanged when it already has one.
 */
export function withWeekday( phpFormat: string ): string {
	const hasWeekday = toSegments( phpFormat ).some(
		segment => segment.isToken && WEEKDAY_TOKENS.has( segment.char )
	);

	if ( hasWeekday ) {
		return phpFormat;
	}

	return `${ WEEKDAY_FORMAT }${ WEEKDAY_SEPARATOR }${ phpFormat }`;
}
