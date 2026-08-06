/**
 * Pure helpers that treat the video description as the single source of
 * truth for chapters, mirroring the legacy dashboard pipeline: the player
 * consumes a WebVTT 'chapters' track generated from timestamp lines typed
 * into the description.
 *
 * Line recognition reuses the legacy `extractSingleChapter` directly, so a
 * line is a chapter here exactly when the legacy pipeline would treat it as
 * one. Unlike the legacy `extractVideoChapters`, `parseDescription` keeps
 * rows in document order instead of sorting: `serializeDescription` maps
 * `rows[ i ]` onto the i-th recognized line, and ordering problems are
 * surfaced by `validateRows` rather than silently reshuffled.
 */
import { __ } from '@wordpress/i18n';
import { extractSingleChapter } from '../extract-video-chapters';

export type ChapterRow = {
	startAtSeconds: number;
	title: string;
};

export type ParsedDescription = {
	rows: ChapterRow[];
	hasChapterLines: boolean;
};

export type ChapterValidationCode =
	| 'no-chapters'
	| 'first-not-zero'
	| 'too-few-chapters'
	| 'missing-title'
	| 'not-ascending'
	| 'too-close'
	| 'exceeds-duration';

export type ChapterValidationIssue = {
	code: ChapterValidationCode;
	/** Index into `rows` of the offending row, when the issue is row-specific. */
	rowIndex?: number;
	message: string;
};

export type ChapterValidationResult = {
	isValid: boolean;
	issues: ChapterValidationIssue[];
};

/**
 * Convert a normalized `HH:MM:SS` clock time (as produced by the legacy
 * extractor) to total seconds.
 *
 * @param clockTime - Time in `HH:MM:SS` form.
 * @return Total seconds.
 */
function clockTimeToSeconds( clockTime: string ): number {
	const [ hours, minutes, seconds ] = clockTime.split( ':' ).map( Number );
	return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Reduce a title to the normal form the legacy extractor produces: trimmed,
 * with no leading `- ` or trailing ` -`. The extractor applies that strip
 * once per parse, so serializing is only round-trip safe when the written
 * title is a fixpoint of the rule — hence the loop.
 *
 * @param raw - Title as provided by the caller.
 * @return Normalized title.
 */
function normalizeTitle( raw: string ): string {
	let title = raw.trim();
	for (;;) {
		const stripped = title.replace( /(\s-$)|(^-\s)/, '' ).trim();
		if ( stripped === title ) {
			return title;
		}
		title = stripped;
	}
}

/**
 * Format a duration in seconds as `MM:SS` or `H:MM:SS`.
 *
 * Local copy of `formatDuration` in `src/dashboard/utils/format.ts`,
 * duplicated so this shared layer never imports dashboard code (which must
 * not reach client bundles) — keep the two in sync.
 *
 * @param seconds - Total seconds.
 * @return Formatted duration.
 */
function formatDuration( seconds: number ): string {
	const safe = Math.max( 0, Math.floor( seconds ) );
	const h = Math.floor( safe / 3600 );
	const m = Math.floor( ( safe % 3600 ) / 60 );
	const s = safe % 60;
	const pad = ( n: number ) => String( n ).padStart( 2, '0' );
	return h > 0 ? `${ h }:${ pad( m ) }:${ pad( s ) }` : `${ pad( m ) }:${ pad( s ) }`;
}

/**
 * Render one row as a normalized chapter line: `H:MM:SS Title` when the
 * start time reaches an hour, `MM:SS Title` otherwise, and a bare timestamp
 * when the title is empty.
 *
 * @param row - Chapter row to render.
 * @return The normalized line.
 */
function formatChapterLine( row: ChapterRow ): string {
	const timestamp = formatDuration( row.startAtSeconds );
	const title = normalizeTitle( row.title );
	return title ? `${ timestamp } ${ title }` : timestamp;
}

/**
 * Classify each description line with the legacy recognition semantics and
 * return the chapter rows in document order. Non-chapter lines are prose
 * and are never touched by `serializeDescription`.
 *
 * @param text - The video description.
 * @return Rows in document order, plus whether any line was recognized.
 */
export function parseDescription( text: string ): ParsedDescription {
	const rows: ChapterRow[] = [];

	for ( const line of text.split( '\n' ) ) {
		const chapter = extractSingleChapter( line );
		if ( chapter !== null ) {
			rows.push( {
				startAtSeconds: clockTimeToSeconds( chapter.startAt ),
				title: chapter.title,
			} );
		}
	}

	return { rows, hasChapterLines: rows.length > 0 };
}

/**
 * Rewrite the description's chapter lines to match `rows`, byte-preserving
 * every non-chapter line.
 *
 * - Same row count as recognized lines: each recognized line is replaced
 * in place with the normalized form of the corresponding row.
 * - Row count changed: every recognized line is removed and the normalized
 * block is inserted where the first one used to be.
 * - No recognized lines: the block is appended after a blank line (or
 * returned alone when the description is empty).
 *
 * `parseDescription( serializeDescription( text, rows ) ).rows` equals
 * `rows` for rows whose titles are in normal form (see `normalizeTitle`).
 *
 * @param text - The current video description.
 * @param rows - The desired chapter rows, in document order.
 * @return The rewritten description.
 */
export function serializeDescription( text: string, rows: ChapterRow[] ): string {
	const lines = text.split( '\n' );
	const isChapterLine = lines.map( line => extractSingleChapter( line ) !== null );
	const chapterLineCount = isChapterLine.filter( Boolean ).length;

	// Same count: rewrite each recognized line in place.
	if ( chapterLineCount === rows.length ) {
		let rowIndex = 0;
		return lines
			.map( ( line, index ) =>
				isChapterLine[ index ] ? formatChapterLine( rows[ rowIndex++ ] ) : line
			)
			.join( '\n' );
	}

	const block = rows.map( formatChapterLine );

	// Nothing to replace: append the block after a blank separator line.
	if ( chapterLineCount === 0 ) {
		if ( text === '' ) {
			return block.join( '\n' );
		}
		let separator = '\n\n';
		if ( text.endsWith( '\n\n' ) ) {
			separator = '';
		} else if ( text.endsWith( '\n' ) ) {
			separator = '\n';
		}
		return text + separator + block.join( '\n' );
	}

	// Row count changed: drop every recognized line and re-insert the
	// normalized block at the first removed line's position.
	const outLines: string[] = [];
	let insertAt = -1;
	lines.forEach( ( line, index ) => {
		if ( isChapterLine[ index ] ) {
			if ( insertAt === -1 ) {
				insertAt = outLines.length;
			}
		} else {
			outLines.push( line );
		}
	} );
	outLines.splice( insertAt, 0, ...block );
	return outLines.join( '\n' );
}

/**
 * Validate chapter rows against the legacy UX rules (first chapter at 0:00,
 * at least three chapters, all titled, at least 10 seconds apart) plus
 * strictly ascending unique start times and, when a duration is known,
 * start times no later than the video end.
 *
 * @param rows            - Chapter rows in document order.
 * @param durationSeconds - Video duration in seconds; the duration check is
 *                        skipped when absent or not a positive number.
 * @return Structured validity result with one issue per violation.
 */
export function validateRows(
	rows: ChapterRow[],
	durationSeconds?: number
): ChapterValidationResult {
	if ( rows.length === 0 ) {
		return {
			isValid: false,
			issues: [
				{
					code: 'no-chapters',
					message: __( 'Add at least three chapters.', 'jetpack-videopress-pkg' ),
				},
			],
		};
	}

	const issues: ChapterValidationIssue[] = [];

	if ( rows[ 0 ].startAtSeconds !== 0 ) {
		issues.push( {
			code: 'first-not-zero',
			rowIndex: 0,
			message: __( 'The first chapter must start at 0:00.', 'jetpack-videopress-pkg' ),
		} );
	}

	if ( rows.length < 3 ) {
		issues.push( {
			code: 'too-few-chapters',
			message: __( 'At least three chapters are required.', 'jetpack-videopress-pkg' ),
		} );
	}

	rows.forEach( ( row, rowIndex ) => {
		if ( row.title.trim() === '' ) {
			issues.push( {
				code: 'missing-title',
				rowIndex,
				message: __( 'Every chapter needs a title.', 'jetpack-videopress-pkg' ),
			} );
		}
	} );

	for ( let i = 1; i < rows.length; i++ ) {
		const gap = rows[ i ].startAtSeconds - rows[ i - 1 ].startAtSeconds;
		if ( gap <= 0 ) {
			issues.push( {
				code: 'not-ascending',
				rowIndex: i,
				message: __(
					'Chapters must be in ascending order without repeated timestamps.',
					'jetpack-videopress-pkg'
				),
			} );
		} else if ( gap < 10 ) {
			issues.push( {
				code: 'too-close',
				rowIndex: i,
				message: __( 'Chapters must be at least 10 seconds apart.', 'jetpack-videopress-pkg' ),
			} );
		}
	}

	if ( typeof durationSeconds === 'number' && durationSeconds > 0 ) {
		rows.forEach( ( row, rowIndex ) => {
			if ( row.startAtSeconds > durationSeconds ) {
				issues.push( {
					code: 'exceeds-duration',
					rowIndex,
					message: __( 'Chapters cannot start after the video ends.', 'jetpack-videopress-pkg' ),
				} );
			}
		} );
	}

	return { isValid: issues.length === 0, issues };
}
