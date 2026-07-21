/**
 * External dependencies
 */
import debugFactory from 'debug';

const debug = debugFactory( 'videopress:video-tracks:cues' );

export const CAPTION_CUE_BLOCK_NAME = 'videopress/caption-cue';

export type CaptionCue = {
	startTime: string;
	endTime: string;
	text: string;
};

export type CaptionCueValidationErrorCode =
	| 'missing_text'
	| 'missing_time'
	| 'invalid_time'
	| 'end_before_start'
	| 'overlap';

export type CaptionCueValidationError =
	| {
			code: Exclude< CaptionCueValidationErrorCode, 'overlap' >;
			cueNumber: number;
	  }
	| {
			code: 'overlap';
			cueNumber: number;
			previousCueNumber: number;
	  };

type CaptionCueBlock = {
	name: string;
	attributes?: Partial< CaptionCue >;
};

const TIME_LINE_PATTERN =
	/^\s*(?:(?:\d+\s*)?\n)?(?<start>\d+:\d{2}(?::\d{2})?[.,]\d{3}|\d+:\d{2}:\d{2})\s+-->\s+(?<end>\d+:\d{2}(?::\d{2})?[.,]\d{3}|\d+:\d{2}:\d{2})/m;
const TRANSCRIPT_CUE_DURATION_SECONDS = 4;

/**
 * Clean up cue text before serializing it to WebVTT, collapsing blank lines
 * (which WebVTT reads as the end of a cue) and escaping arrow sequences that
 * would otherwise be parsed as a timing line.
 *
 * @param {string} text - Raw cue text.
 * @return {string} WebVTT-safe cue text.
 */
const sanitizeCueText = ( text: string ): string =>
	text
		.trim()
		.replace( /\r\n?/g, '\n' )
		// Collapse blank lines: WebVTT ends a cue at a blank line, which would split it and drop the rest.
		.replace( /\n\s*\n/g, '\n' )
		.split( '--!>' )
		.join( '->' )
		.split( '-->' )
		.join( '->' );

/**
 * Convert a timestamp into seconds.
 *
 * @param value - Timestamp in `HH:MM:SS.mmm`, `MM:SS.mmm`, or seconds.
 * @return Seconds, or null when invalid.
 */
export function parseTimestampToSeconds( value: string ): number | null {
	const trimmed = value.trim().replace( ',', '.' );
	if ( ! trimmed ) {
		return null;
	}

	if ( /^\d+(?:\.\d+)?$/.test( trimmed ) ) {
		return Number( trimmed );
	}

	/*
	 * `HH:MM:SS.mmm` or `MM:SS.mmm`, rejecting out-of-range or partial input like `:30`,
	 * `00:99:99`, or `-1:30` rather than parsing it into a nonsensical time.
	 */
	const match = trimmed.match( /^(?:(\d+):)?([0-5]?\d):([0-5]?\d(?:\.\d+)?)$/ );
	if ( ! match ) {
		return null;
	}

	const hours = match[ 1 ] ? Number( match[ 1 ] ) : 0;
	const minutes = Number( match[ 2 ] );
	const seconds = Number( match[ 3 ] );

	return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds as a WebVTT timestamp.
 *
 * @param seconds - Seconds.
 * @return WebVTT timestamp.
 */
export function formatSecondsAsTimestamp( seconds: number ): string {
	const totalMilliseconds = Math.round( Math.max( 0, seconds ) * 1000 );
	const hours = Math.floor( totalMilliseconds / 3600000 );
	const minutes = Math.floor( ( totalMilliseconds % 3600000 ) / 60000 );
	const wholeSeconds = Math.floor( ( totalMilliseconds % 60000 ) / 1000 );
	const milliseconds = totalMilliseconds % 1000;

	return (
		[
			String( hours ).padStart( 2, '0' ),
			String( minutes ).padStart( 2, '0' ),
			String( wholeSeconds ).padStart( 2, '0' ),
		].join( ':' ) + `.${ String( milliseconds ).padStart( 3, '0' ) }`
	);
}

/**
 * Normalize user-entered cue timestamps to WebVTT form.
 *
 * @param value - User-entered timestamp.
 * @return WebVTT timestamp, or empty string when invalid.
 */
export function normalizeCueTimestamp( value: string ): string {
	const seconds = parseTimestampToSeconds( value );
	return seconds === null ? '' : formatSecondsAsTimestamp( seconds );
}

/**
 * Extract caption cues from serialized caption cue blocks.
 *
 * @param blocks - Parsed WordPress blocks.
 * @return Caption cues.
 */
export function captionBlocksToCues( blocks: CaptionCueBlock[] ): CaptionCue[] {
	return blocks
		.filter( block => block.name === CAPTION_CUE_BLOCK_NAME )
		.map( block => ( {
			startTime: normalizeCueTimestamp( block.attributes?.startTime ?? '' ),
			endTime: normalizeCueTimestamp( block.attributes?.endTime ?? '' ),
			text: String( block.attributes?.text ?? '' ).trim(),
		} ) )
		.filter( cue => cue.startTime && cue.endTime && cue.text );
}

/**
 * Validate caption cue blocks before publishing.
 *
 * @param blocks - Parsed WordPress blocks.
 * @return Validation errors.
 */
export function getCaptionCueValidationErrors(
	blocks: CaptionCueBlock[]
): CaptionCueValidationError[] {
	const errors: CaptionCueValidationError[] = [];
	const timedCues: Array< { cueNumber: number; start: number; end: number } > = [];

	blocks
		.filter( block => block.name === CAPTION_CUE_BLOCK_NAME )
		.forEach( ( block, index ) => {
			const cueNumber = index + 1;
			const text = String( block.attributes?.text ?? '' ).trim();
			const rawStartTime = String( block.attributes?.startTime ?? '' ).trim();
			const rawEndTime = String( block.attributes?.endTime ?? '' ).trim();

			if ( ! text ) {
				errors.push( { code: 'missing_text', cueNumber } );
			}

			if ( ! rawStartTime || ! rawEndTime ) {
				errors.push( { code: 'missing_time', cueNumber } );
				return;
			}

			const start = parseTimestampToSeconds( rawStartTime );
			const end = parseTimestampToSeconds( rawEndTime );

			if ( start === null || end === null ) {
				errors.push( { code: 'invalid_time', cueNumber } );
				return;
			}

			if ( end <= start ) {
				errors.push( { code: 'end_before_start', cueNumber } );
				return;
			}

			timedCues.push( { cueNumber, start, end } );
		} );

	timedCues
		.sort( ( a, b ) => a.start - b.start )
		.reduce< { cueNumber: number; end: number } | null >( ( previousCue, cue ) => {
			if ( previousCue && cue.start < previousCue.end ) {
				errors.push( {
					code: 'overlap',
					cueNumber: cue.cueNumber,
					previousCueNumber: previousCue.cueNumber,
				} );
			}

			if ( ! previousCue || cue.end > previousCue.end ) {
				return { cueNumber: cue.cueNumber, end: cue.end };
			}

			return previousCue;
		}, null );

	return errors;
}

/**
 * Serialize caption cues to valid WebVTT.
 *
 * @param cues - Caption cues.
 * @return WebVTT document.
 */
export function serializeCuesToWebVtt( cues: CaptionCue[] ): string {
	const body = cues
		.map( cue => {
			const startTime = normalizeCueTimestamp( cue.startTime );
			const endTime = normalizeCueTimestamp( cue.endTime );
			const text = sanitizeCueText( cue.text );
			// Skip invalid cues rather than emit a malformed ` --> ` line that corrupts the document.
			if ( ! startTime || ! endTime || ! text ) {
				return null;
			}
			return `${ startTime } --> ${ endTime }\n${ text }`;
		} )
		.filter( ( entry ): entry is string => entry !== null )
		.join( '\n\n' );

	return body ? `WEBVTT\n\n${ body }\n` : 'WEBVTT\n\n';
}

/**
 * Parse a WebVTT or SRT document into caption cues.
 *
 * @param content - Track file content.
 * @return Caption cues.
 */
export function parseCaptionTextTrack( content: string ): CaptionCue[] {
	let droppedCues = 0;
	const cues = content
		.replace( /^\uFEFF/, '' )
		// Normalize CRLF/CR line endings so multi-line cue text carries no stray `\r`.
		.replace( /\r\n?/g, '\n' )
		.split( /\n\s*\n/g )
		.map( block => {
			const match = block.match( TIME_LINE_PATTERN );
			if ( ! match?.groups ) {
				return null;
			}

			const timeLineIndex = block.split( /\n/ ).findIndex( line => line.includes( '-->' ) );
			const text = block
				.split( /\n/ )
				.slice( timeLineIndex + 1 )
				.join( '\n' )
				.trim();

			const cue: CaptionCue = {
				startTime: normalizeCueTimestamp( match.groups.start ),
				endTime: normalizeCueTimestamp( match.groups.end ),
				text,
			};

			// Block looked like a cue but timing or text was invalid; count the silent drop.
			if ( ! cue.startTime || ! cue.endTime || ! cue.text ) {
				droppedCues += 1;
				return null;
			}

			return cue;
		} )
		.filter( ( cue ): cue is CaptionCue => cue !== null );

	if ( droppedCues ) {
		debug( '%d cue(s) skipped for invalid timing or empty text', droppedCues );
	}

	return cues;
}

/**
 * Convert transcript-like text into evenly-spaced editable cue placeholders.
 *
 * @param content            - Plain transcript text.
 * @param startAtSeconds     - First cue start time.
 * @param cueDurationSeconds - Duration for each generated cue.
 * @return Caption cues.
 */
export function parseCaptionTranscript(
	content: string,
	startAtSeconds = 0,
	cueDurationSeconds = TRANSCRIPT_CUE_DURATION_SECONDS
): CaptionCue[] {
	const safeDuration = Math.max( 1, cueDurationSeconds );

	return (
		content
			.replace( /^\uFEFF/, '' )
			.split( /\n+/ )
			.map( line => line.trim() )
			// Skip headers, bare cue numbers, and timing lines from malformed timed tracks.
			.filter(
				line =>
					line && ! /^WEBVTT$/i.test( line ) && ! /^\d+$/.test( line ) && ! line.includes( '-->' )
			)
			.map( ( text, index ) => {
				const start = startAtSeconds + index * safeDuration;
				return {
					startTime: formatSecondsAsTimestamp( start ),
					endTime: formatSecondsAsTimestamp( start + safeDuration ),
					text,
				};
			} )
	);
}

/**
 * Parse pasted caption text, preferring timed caption cues before falling back
 * to transcript-like lines.
 *
 * @param content - Pasted caption or transcript text.
 * @return Caption cues.
 */
export function parseCaptionTextInput( content: string ): CaptionCue[] {
	const timedCues = parseCaptionTextTrack( content );
	return timedCues.length ? timedCues : parseCaptionTranscript( content );
}
