import type { VideoPressChapter } from '../types';

/**
 * Converts a raw time string (1:30, 04:20, 1:02:03) to a normalised HH:MM:SS
 * clock string suitable for use as a chapter startAt value.
 *
 * @param {string} time - Raw time string captured by the chapter regex.
 * @return {string} - Normalised HH:MM:SS clock string.
 */
function timeToStartAt( time: string ): string {
	const timeSections = time.split( ':' );
	if ( timeSections[ 0 ].length === 1 ) {
		timeSections[ 0 ] = `0${ timeSections[ 0 ] }`;
	}
	if ( timeSections.length === 2 ) {
		timeSections.unshift( '00' );
	}
	return timeSections.join( ':' );
}

/**
 * Extracts chapter information from a single text line
 *
 * @param {string} line - The line to be processed
 * @return {VideoPressChapter} - Title and start time of the chapter
 */
function extractSingleChapter( line: string ): VideoPressChapter | null {
	// Try an anchored match first: timestamp at the very start of the line.
	// This is the standard YouTube chapter format ("MM:SS Title") and handles
	// colons inside the title correctly — e.g. "04:20 Backups: Pressable vs. Jetpack"
	// — because the title is captured verbatim as everything after the first
	// whitespace, so no colon can be mis-tokenised as a time separator.
	const startRegex =
		/^(?<timeBlock>\(?(?<time>\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})\)?)(?:\s+(?<title>.+))?$/;
	const startResult = startRegex.exec( line );

	if ( startResult != null && startResult.groups != null ) {
		const { time, title = '' } = startResult.groups;
		return {
			startAt: timeToStartAt( time ),
			title: title.trim().replace( /(\s-$)|(^-\s)/, '' ),
		};
	}

	// Fall back to the floating-position regex for non-standard formats such as
	// "⌨️ (00:08:19) Title" or "Title - 2:15" where the timestamp is not at
	// the very start of the line.
	const regex = /(?<timeBlock>\(?(?<time>\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})\)?)/;
	const result = regex.exec( line );

	if ( result == null || result.groups == null ) {
		return null;
	}

	const {
		groups: { timeBlock, time },
	} = result;
	const blockIndex = line.indexOf( timeBlock );
	const remainingLength = line.length - timeBlock.length;

	const title = (
		blockIndex < remainingLength / 2
			? line.substring( blockIndex + timeBlock.length, line.length )
			: line.substring( 0, blockIndex )
	)
		.trim()
		.replace( /(\s-$)|(^-\s)/, '' );

	return { startAt: timeToStartAt( time ), title };
}

/**
 * Extracts chapter information from a single text line
 *
 * @param {string} text - The text to be processed
 * @return {Array<VideoPressChapter>} - Title and start time of all chapters, sorted by start time
 */
export default function extractVideoChapters( text: string ): Array< VideoPressChapter > {
	if ( ! text ) {
		return [];
	}

	const lines = text.split( '\n' );

	const chapters = lines
		.map( line => extractSingleChapter( line ) )
		.filter( chapter => chapter !== null ) as Array< VideoPressChapter >;

	return chapters.sort( ( lineA, lineB ) => {
		return lineA.startAt.localeCompare( lineB.startAt );
	} );
}

export { extractSingleChapter, extractVideoChapters };
