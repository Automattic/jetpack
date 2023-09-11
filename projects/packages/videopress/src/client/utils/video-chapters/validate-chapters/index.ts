import type { VideoPressChapter } from '../types';

/**
 * Calculates the number of seconds from a timestamp in the format hh:mm:ss
 *
 * @param {string} time - The timestamp
 * @returns {number}    - The number of seconds
 */
function getSeconds( time: string ): number {
	const timeSections = time.split( ':' );

	return (
		parseInt( timeSections[ 0 ] ) * 3600 +
		parseInt( timeSections[ 1 ] ) * 60 +
		parseInt( timeSections[ 2 ] )
	);
}

/**
 * Validates the generated chapters against UX restrictions
 *
 * @param {VideoPressChapter[]} chapters - The chapters to be validated
 * @returns {boolean} - Whether the generated chapters are valid or not
 */
export default function validateChapters( chapters: VideoPressChapter[] ): boolean {
	if ( ! chapters || chapters.length === 0 ) {
		return false;
	}

	// The first timestamp should be 00:00:00
	if ( chapters[ 0 ].startAt !== '00:00:00' ) {
		return false;
	}

	// There must be at least 3 chapters
	if ( chapters.length < 3 ) {
		return false;
	}

	// All chapters should have a title
	if ( chapters.some( chapter => ! chapter.title ) ) {
		return false;
	}

	// Chapters should have at least 10 seconds between them
	for ( let i = 0; i < chapters.length - 1; i++ ) {
		const currentChapter = chapters[ i ];
		const nextChapter = chapters[ i + 1 ];

		if ( getSeconds( nextChapter.startAt ) - getSeconds( currentChapter.startAt ) < 10 ) {
			return false;
		}
	}

	return true;
}
