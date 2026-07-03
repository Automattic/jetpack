/**
 * Internal dependencies
 */
import { formatChapterTime } from '../chapter-time';
import { extractSingleChapter } from '../extract-video-chapters';

type ChapterInput = {
	seconds: number;
	title: string;
};

/**
 * Rewrites a video description's chapter lines: every line the chapter parser
 * recognizes is removed, and the given chapters are inserted as one block at
 * the position of the first removed line (appended when none existed). Other
 * prose is preserved, aside from whitespace normalization.
 *
 * @param {string}         description - The current video description.
 * @param {ChapterInput[]} chapters    - Chapters sorted by start time; empty removes all chapter lines.
 * @return {string} The rewritten description.
 */
export default function applyChaptersToDescription(
	description: string,
	chapters: ChapterInput[]
): string {
	const lines = ( description ?? '' ).split( '\n' );
	const kept: string[] = [];
	let insertAt: number | null = null;

	for ( const line of lines ) {
		if ( line.trim() && extractSingleChapter( line ) !== null ) {
			if ( insertAt === null ) {
				insertAt = kept.length;
			}
			continue;
		}
		kept.push( line );
	}

	const block = chapters.map(
		chapter => `${ formatChapterTime( chapter.seconds ) } ${ chapter.title.trim() }`
	);

	if ( ! block.length ) {
		return kept
			.join( '\n' )
			.replace( /\n{3,}/g, '\n\n' )
			.trim();
	}

	if ( insertAt === null ) {
		const prose = kept.join( '\n' ).trimEnd();
		return prose ? `${ prose }\n\n${ block.join( '\n' ) }` : block.join( '\n' );
	}

	kept.splice( insertAt, 0, ...block );
	return kept
		.join( '\n' )
		.replace( /\n{3,}/g, '\n\n' )
		.trim();
}
