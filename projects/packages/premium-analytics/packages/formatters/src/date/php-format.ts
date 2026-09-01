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

/** Tokens that render a day of the month: unpadded, padded, and its ordinal suffix. */
const DAY_TOKENS = new Set( [ 'j', 'd', 'S' ] );

/** Textual month, spelled out and abbreviated. */
const MONTH_FULL_TOKEN = 'F';
const MONTH_SHORT_TOKEN = 'M';

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
 * Backslash escapes have to be honoured rather than scanned past: `es_ES` ships
 * `j \d\e F \d\e Y`, where `\d` and `\e` spell "de" but are also date tokens.
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
 * Whether a format renders any of the given date parts.
 *
 * Escaped letters spell literal text rather than naming a part, so they do not
 * count: `G\h i` renders an hour, a literal "h", and minutes — not a 12-hour clock.
 *
 * @param phpFormat - PHP `date()` format string.
 * @param tokens    - Token letters to look for.
 * @return Whether the format renders one of them.
 */
export function hasToken( phpFormat: string, tokens: Set< string > ): boolean {
	return toSegments( phpFormat ).some( segment => segment.isToken && tokens.has( segment.char ) );
}

/**
 * Remove the year from a PHP format string, with its adjoining punctuation.
 *
 * WordPress only publishes whole date formats, so a month-and-day format has to
 * be derived from one (`F j, Y` → `F j`, but `Y-m-d` → `m-d`).
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
		// In dot-separated formats the dot also marks the preceding day or month
		// as ordinal (`j.n.Y` → `j.n.`), so keep it.
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
 * Abbreviate the month in a PHP format string.
 *
 * The abbreviation itself still comes from WordPress's translation tables, so a
 * locale that does not shorten its month names keeps them whole.
 *
 * @param phpFormat - PHP `date()` format string.
 * @return The format with a three-letter month, or unchanged when it names none.
 */
export function withShortMonth( phpFormat: string ): string {
	return toSegments( phpFormat )
		.map( segment =>
			segment.isToken && segment.char === MONTH_FULL_TOKEN ? MONTH_SHORT_TOKEN : segment.source
		)
		.join( '' );
}

/**
 * Put the weekday in front of a PHP format string.
 *
 * WordPress publishes no weekday-bearing format, so one has to be derived from
 * the site's. Only the separator is ours, and only the leading position is
 * assumed — every locale core ships puts the weekday first when it names one.
 *
 * @param phpFormat - PHP `date()` format string.
 * @return The format led by its weekday, or unchanged when it already has one.
 */
export function withWeekday( phpFormat: string ): string {
	if ( hasToken( phpFormat, WEEKDAY_TOKENS ) ) {
		return phpFormat;
	}

	return `${ WEEKDAY_FORMAT }${ WEEKDAY_SEPARATOR }${ phpFormat }`;
}

/**
 * The first token at or after `from`, or the segment count where there is none.
 *
 * @param segments - The segments to scan.
 * @param from     - Index to start at.
 * @return The token's index.
 */
function nextTokenAt( segments: Segment[], from: number ): number {
	let at = from;
	while ( at < segments.length && ! segments[ at ].isToken ) {
		at++;
	}

	return at;
}

/**
 * The start of the run of literals that introduces the token at `index`.
 *
 * @param segments - The segments to scan.
 * @param index    - The token's index.
 * @return The run's first index, or `index` where no literal precedes it.
 */
function literalRunStart( segments: Segment[], index: number ): number {
	let at = index - 1;
	while ( at >= 0 && ! segments[ at ].isToken ) {
		at--;
	}

	return at + 1;
}

/**
 * Remove the day from a PHP format string, with its adjoining punctuation.
 *
 * The weekday goes too: neither has anything to name in a month-and-year label.
 * The run to remove is the one after the day (`F j, Y` → `F Y`), or the one
 * before it where nothing follows (`Y-m-d` → `Y-m`).
 *
 * @param phpFormat - PHP `date()` format string.
 * @return The format without its day, or unchanged when it has none.
 */
export function withoutDay( phpFormat: string ): string {
	const segments = toSegments( phpFormat );
	const isDay = ( segment: Segment ): boolean =>
		segment.isToken && ( DAY_TOKENS.has( segment.char ) || WEEKDAY_TOKENS.has( segment.char ) );
	const dropped = new Set< number >();

	for ( let index = 0; index < segments.length; index++ ) {
		if ( ! isDay( segments[ index ] ) ) {
			continue;
		}

		// `jS` spells the day and its suffix as two adjacent tokens.
		let last = index;
		while ( last + 1 < segments.length && isDay( segments[ last + 1 ] ) ) {
			last++;
		}

		const following = nextTokenAt( segments, last + 1 );
		const [ start, end ] =
			following < segments.length
				? [ index, following ]
				: [ literalRunStart( segments, index ), last + 1 ];

		for ( let at = start; at < end; at++ ) {
			dropped.add( at );
		}

		index = last;
	}

	return segments
		.filter( ( _, at ) => ! dropped.has( at ) )
		.map( segment => segment.source )
		.join( '' );
}
