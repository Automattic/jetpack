/**
 * External dependencies
 */
import { createBlock, parse, serialize } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	CAPTION_FORMAT_MIME_TYPES,
	SUPPORTED_CAPTION_FORMATS,
	TRACK_KIND_OPTIONS,
} from '../../lib/video-tracks';
import { CAPTION_TRACK_META, getSourceTrackMeta } from '../../lib/video-tracks/caption-tracks';
import {
	CAPTION_CUE_BLOCK_NAME,
	formatSecondsAsTimestamp,
	parseCaptionTextTrack,
} from '../../lib/video-tracks/cues';
import {
	canonicalizeLanguageTag,
	getLanguageDisplayName,
	getManualLanguageTagFromTrackKey,
	isGeneratedLanguageKey,
} from '../../lib/video-tracks/language';
/**
 * Types
 */
import type { CaptionTrackRow } from './track-list';
import type { CaptionTrack, SavedCaptionTrack } from '../../lib/video-tracks/caption-tracks';
import type { CaptionCueValidationError } from '../../lib/video-tracks/cues';
import type {
	trackKindOptionProps,
	UploadTrackDataProps,
	VideoTextTrack,
} from '../../lib/video-tracks/types';

export const DEFAULT_KIND: trackKindOptionProps = 'subtitles';
export const DEFAULT_CUE_DURATION_SECONDS = 2;
const LISTABLE_TRACK_KIND_OPTIONS: trackKindOptionProps[] = [ 'captions', 'subtitles' ];

export type UploadFormTrack = {
	kind: trackKindOptionProps;
	srcLang: string;
	label: string;
	tmpFile: File | null;
};

export type ManualTrack = {
	kind: trackKindOptionProps;
	srcLang: string;
	label: string;
};

export type UploadFormMode = 'add' | 'replace';
export type NoticeState = { status: 'success' | 'error'; message: string } | null;
export type CaptionCueBlock = ReturnType< typeof createBlock >;

type TrackApiError = {
	code?: string;
	error?: string;
	message?: string;
};

export const emptyManualTrack = ( srcLang = '' ): ManualTrack => ( {
	kind: DEFAULT_KIND,
	srcLang,
	label: srcLang ? getLanguageDisplayName( srcLang ) : '',
} );

export const emptyUploadForm = ( srcLang = '' ): UploadFormTrack => ( {
	...emptyManualTrack( srcLang ),
	tmpFile: null,
} );

const getTrackLanguageKey = ( track: Pick< VideoTextTrack, 'kind' | 'srcLang' > ) =>
	`${ track.kind }:${ track.srcLang }`;

export const getTrackKey = (
	track: Pick< VideoTextTrack, 'kind' | 'srcLang' > &
		Partial< Pick< VideoTextTrack, 'id' | 'source' > >
) => `${ getTrackLanguageKey( track ) }:${ track.id ?? track.source ?? '' }`;

const getCaptionTrackSourceKey = ( captionTrack: SavedCaptionTrack ) =>
	`${ captionTrack.meta[ CAPTION_TRACK_META.sourceTrackKind ] ?? '' }:${
		captionTrack.meta[ CAPTION_TRACK_META.sourceTrackSrcLang ] ?? ''
	}`;

export const getStoredCaptionTrackKey = ( captionTrack: SavedCaptionTrack ) =>
	`${ captionTrack.meta[ CAPTION_TRACK_META.kind ] }:${
		captionTrack.meta[ CAPTION_TRACK_META.srcLang ]
	}`;

export const isSubtitleTrackKind = ( kind?: string ): kind is trackKindOptionProps =>
	LISTABLE_TRACK_KIND_OPTIONS.includes( kind as trackKindOptionProps );

export const isListableCaptionTrack = ( captionTrack: SavedCaptionTrack ) =>
	isSubtitleTrackKind( captionTrack.meta[ CAPTION_TRACK_META.kind ] ) &&
	!! captionTrack.meta[ CAPTION_TRACK_META.srcLang ];

export const isMatchingSubtitleTrackLanguage = (
	track: Pick< VideoTextTrack, 'kind' | 'srcLang' >,
	srcLang: string
) => isSubtitleTrackKind( track.kind ) && track.srcLang === srcLang;

const isMatchingCaptionTrackLanguage = ( captionTrack: SavedCaptionTrack, srcLang: string ) =>
	isListableCaptionTrack( captionTrack ) &&
	captionTrack.meta[ CAPTION_TRACK_META.srcLang ] === srcLang;

/*
 * File-input `accept` value built from the supported caption formats, including
 * each format's MIME type when known so browsers that filter by MIME still
 * offer the file.
 */
export const ACCEPTED_FILE_TYPES = SUPPORTED_CAPTION_FORMATS.flatMap( extension => {
	const normalizedExtension = extension.startsWith( '.' ) ? extension : `.${ extension }`;
	const mimeType = CAPTION_FORMAT_MIME_TYPES[ normalizedExtension ];
	return mimeType ? [ normalizedExtension, mimeType ] : [ normalizedExtension ];
} ).join( ',' );

export const SUPPORTED_CAPTION_FORMATS_LABEL = SUPPORTED_CAPTION_FORMATS.join( ', ' );

/**
 * Check a file's extension against the supported caption formats.
 *
 * @param {File|null} file - File to check, or null if none was chosen.
 * @return {boolean} Whether the file's extension is supported.
 */
export const isAcceptedTrackFile = ( file: File | null ): boolean => {
	if ( ! file ) {
		return false;
	}

	const lowerName = file.name.toLowerCase();
	return SUPPORTED_CAPTION_FORMATS.some( extension =>
		lowerName.endsWith( extension.startsWith( '.' ) ? extension : `.${ extension }` )
	);
};

/**
 * Type guard for a VideoPress track API response that reports an error, since
 * failed track requests resolve rather than reject.
 *
 * @param {unknown} response - Parsed API response body.
 * @return {boolean} Whether the response describes an error.
 */
export const hasTrackApiError = ( response: unknown ): response is TrackApiError =>
	typeof response === 'object' &&
	response !== null &&
	( ( 'error' in response && !! ( response as TrackApiError ).error ) ||
		( 'code' in response && !! ( response as TrackApiError ).code ) );

/**
 * Extract a human-readable message from a track API error response.
 *
 * @param {unknown} response - Parsed API response body, or a caught error.
 * @param {string}  fallback - Message to use when none can be extracted.
 * @return {string} The resolved error message.
 */
export const getTrackApiErrorMessage = ( response: unknown, fallback: string ): string => {
	if ( typeof response === 'object' && response !== null ) {
		const { code, error: errorCode, message } = response as TrackApiError;
		return message || errorCode || code || fallback;
	}

	return fallback;
};

/**
 * Whether a track was produced by VideoPress's automatic speech recognition,
 * as opposed to a manually authored or uploaded track.
 *
 * @param {VideoTextTrack} track - Track to check.
 * @return {boolean} Whether the track is auto-generated.
 */
export const isAutoGeneratedTrack = ( track: VideoTextTrack ) =>
	Boolean( track.isAutoGenerated ) ||
	track.source === 'asr' ||
	isGeneratedLanguageKey( track.srcLang );

/**
 * Whether a track's processing status allows it to be edited or played.
 *
 * @param {VideoTextTrack} track - Track to check.
 * @return {boolean} Whether the track is ready.
 */
const isTrackReady = ( track: VideoTextTrack ) =>
	! track.status || track.status === 'ready' || track.status === 'serving';

/**
 * Human-readable label for how a track was produced.
 *
 * @param {VideoTextTrack} track - Track to label.
 * @return {string} The source label, or an empty string when none applies.
 */
const getTrackSourceLabel = ( track: VideoTextTrack ) => {
	if ( isAutoGeneratedTrack( track ) ) {
		return __( 'Auto-generated', 'jetpack-videopress-pkg' );
	}

	if ( track.source === 'manual' ) {
		return __( 'Manual', 'jetpack-videopress-pkg' );
	}

	return '';
};

/**
 * Human-readable label for a track's processing status.
 *
 * @param {VideoTextTrack} track - Track to label.
 * @return {string} The status label, or an empty string when none applies.
 */
const getTrackStatusLabel = ( track: VideoTextTrack ) => {
	if ( track.failureReason ) {
		return sprintf(
			/* translators: %s: caption processing failure reason. */
			__( 'Failed: %s', 'jetpack-videopress-pkg' ),
			track.failureReason
		);
	}

	switch ( track.status ) {
		case 'failed':
			return __( 'Failed', 'jetpack-videopress-pkg' );
		case 'processing':
		case 'syncing':
			return __( 'Processing', 'jetpack-videopress-pkg' );
		case 'ready':
		case 'serving':
			return __( 'Ready', 'jetpack-videopress-pkg' );
		default:
			return '';
	}
};

/*
 * Human-readable language name for a track, resolving generated keys such as
 * `auto_en` to their underlying language ("English") rather than the raw code.
 */
export const getTrackLanguageName = ( srcLang: string ) =>
	getLanguageDisplayName( getManualLanguageTagFromTrackKey( srcLang ) || srcLang );

/**
 * Build a filename for a track download, normalizing non-subtitle kinds to
 * the default kind and the language tag to its canonical form when possible.
 *
 * @param {VideoTextTrack} track - Track being downloaded.
 * @return {string} A `.vtt` filename for the track.
 */
export const getDownloadFileName = ( track: VideoTextTrack ) =>
	`${ isSubtitleTrackKind( track.kind ) ? DEFAULT_KIND : track.kind }-${
		canonicalizeLanguageTag( track.srcLang ) ?? track.srcLang
	}.vtt`;

/**
 * Map a cue validation error to the notice message shown before publishing.
 *
 * @param {CaptionCueValidationError} error - Validation error to describe.
 * @return {string} The notice message for the error.
 */
export const getCueValidationNoticeMessage = ( error: CaptionCueValidationError ) => {
	switch ( error.code ) {
		case 'missing_text':
			return sprintf(
				/* translators: %d: subtitle cue number. */
				__( 'Subtitle %d needs text before publishing.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'missing_time':
			return sprintf(
				/* translators: %d: subtitle cue number. */
				__( 'Subtitle %d needs start and end times before publishing.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'invalid_time':
			return sprintf(
				/* translators: %d: subtitle cue number. */
				__( 'Subtitle %d has an invalid timestamp.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'end_before_start':
			return sprintf(
				/* translators: %d: subtitle cue number. */
				__( 'Subtitle %d must end after it starts.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'overlap':
			return sprintf(
				/* translators: 1: subtitle cue number, 2: overlapping subtitle cue number. */
				__( 'Subtitle %1$d overlaps subtitle %2$d.', 'jetpack-videopress-pkg' ),
				error.cueNumber,
				error.previousCueNumber
			);
		default:
			return __( 'Fix subtitle timing before publishing.', 'jetpack-videopress-pkg' );
	}
};

export const createCueBlock = (
	cue?: Partial< { startTime: string; endTime: string; text: string } >
) =>
	createBlock( CAPTION_CUE_BLOCK_NAME, {
		startTime: cue?.startTime ?? '00:00:00.000',
		endTime: cue?.endTime ?? '00:00:02.000',
		text: cue?.text ?? '',
	} );

export const createEmptyCueBlocks = () => [ createCueBlock() ];

/**
 * Parse a plain-text caption track into cue blocks, falling back to a single
 * empty cue when the text contains none.
 *
 * @param {string} trackText - Raw caption track content.
 * @return {CaptionCueBlock[]} The parsed cue blocks.
 */
export const createCueBlocksFromTrackText = ( trackText: string ) => {
	const cues = parseCaptionTextTrack( trackText );
	return cues.length ? cues.map( createCueBlock ) : createEmptyCueBlocks();
};

/**
 * Parse a saved caption track's serialized block content into cue blocks,
 * falling back to a single empty cue when it contains none.
 *
 * @param {SavedCaptionTrack} captionTrack - Saved caption track to parse.
 * @return {CaptionCueBlock[]} The parsed cue blocks.
 */
export const createCueBlocksFromCaptionTrack = ( captionTrack: SavedCaptionTrack ) => {
	const blocks = parse( captionTrack.content ) as CaptionCueBlock[];
	const cueBlocks = blocks.filter( block => block.name === CAPTION_CUE_BLOCK_NAME );
	return cueBlocks.length ? cueBlocks : createEmptyCueBlocks();
};

/**
 * Stable signature of a cue list's content, to tell a real edit from merely
 * viewing a track.
 *
 * @param {CaptionCueBlock[]} blocks - Cue blocks to fingerprint.
 * @return {string} The signature.
 */
export const getCueBlocksSignature = ( blocks: CaptionCueBlock[] ): string =>
	JSON.stringify(
		blocks
			.filter( block => block.name === CAPTION_CUE_BLOCK_NAME )
			.map( block => [
				block.attributes?.startTime ?? '',
				block.attributes?.endTime ?? '',
				block.attributes?.text ?? '',
			] )
	);

/**
 * Derive the manual editor's track fields (kind/language/label) from a saved
 * caption track's stored meta.
 *
 * @param {SavedCaptionTrack} captionTrack - Saved caption track to read.
 * @return {ManualTrack} The corresponding manual track fields.
 */
export const getManualTrackFromCaptionTrack = (
	captionTrack: SavedCaptionTrack
): ManualTrack => ( {
	kind: captionTrack.meta[ CAPTION_TRACK_META.kind ],
	srcLang: captionTrack.meta[ CAPTION_TRACK_META.srcLang ],
	label: captionTrack.meta[ CAPTION_TRACK_META.label ] || captionTrack.title,
} );

/**
 * Resolve the managed track a saved caption track was derived from, so
 * editing a draft can be tied back to the auto-generated or uploaded track it
 * was seeded from. Falls back to a synthetic track built from the stored meta
 * when no matching managed track exists (e.g. it was since deleted).
 *
 * @param {SavedCaptionTrack} captionTrack - Saved caption track to resolve.
 * @param {VideoTextTrack[]}  tracks       - Current managed tracks to search.
 * @return {VideoTextTrack|null} The source track, or null if none is recorded.
 */
export const getSourceTrackFromCaptionTrack = (
	captionTrack: SavedCaptionTrack,
	tracks: VideoTextTrack[]
): VideoTextTrack | null => {
	const sourceKind = captionTrack.meta[ CAPTION_TRACK_META.sourceTrackKind ];
	const sourceSrcLang = captionTrack.meta[ CAPTION_TRACK_META.sourceTrackSrcLang ];
	const sourceSrc = captionTrack.meta[ CAPTION_TRACK_META.sourceTrackSrc ];

	if (
		! sourceKind ||
		! sourceSrcLang ||
		! TRACK_KIND_OPTIONS.includes( sourceKind as trackKindOptionProps )
	) {
		return null;
	}

	const matchingTrack = tracks.find(
		track =>
			track.kind === sourceKind &&
			( track.srcLang === sourceSrcLang || ( !! sourceSrc && track.src === sourceSrc ) )
	);

	if ( matchingTrack ) {
		return matchingTrack;
	}

	const isGeneratedSource = isGeneratedLanguageKey( sourceSrcLang );
	return {
		kind: sourceKind as trackKindOptionProps,
		srcLang: sourceSrcLang,
		label: '',
		src: sourceSrc || '',
		source: isGeneratedSource ? 'asr' : undefined,
		isAutoGenerated: isGeneratedSource ? true : undefined,
	};
};

/**
 * Create a cue that starts at the given video playback time and runs for the
 * default cue duration.
 *
 * @param {number} currentTime - Current video time in seconds.
 * @return {CaptionCueBlock} The new caption cue block.
 */
export const createCueAtPlayhead = ( currentTime: number ) => {
	const seconds = Number.isFinite( currentTime ) ? Math.max( 0, currentTime ) : 0;
	return createCueBlock( {
		startTime: formatSecondsAsTimestamp( seconds ),
		endTime: formatSecondsAsTimestamp( seconds + DEFAULT_CUE_DURATION_SECONDS ),
	} );
};

/**
 * Whether an event target is a form field or editable element, so the manual
 * editor's keyboard shortcuts don't fire while the user is typing in one.
 *
 * @param {EventTarget|null} target - Event target to check.
 * @return {boolean} Whether the target is a form field.
 */
export const isFormFieldTarget = ( target: EventTarget | null ) => {
	if ( ! ( target instanceof HTMLElement ) ) {
		return false;
	}

	return (
		target.isContentEditable ||
		[ 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON' ].includes( target.tagName )
	);
};

/**
 * Find the saved caption track backing a manual editor session: preferably the
 * one derived from the same source track, then an exact kind/language match,
 * then any listable track for the language.
 *
 * @param {SavedCaptionTrack[]} captionTracks - Saved caption tracks to search.
 * @param {ManualTrack}         track         - Manual editor track fields.
 * @param {VideoTextTrack|null} sourceTrack   - Managed track the editor was opened from.
 * @return {SavedCaptionTrack|undefined} The matching caption track.
 */
export const findCaptionTrackForManualTrack = (
	captionTracks: SavedCaptionTrack[],
	track: ManualTrack,
	sourceTrack: VideoTextTrack | null
): SavedCaptionTrack | undefined => {
	if ( sourceTrack ) {
		const sourceKey = getTrackLanguageKey( sourceTrack );
		const sourceCaptionTrack = captionTracks.find(
			captionTrack => getCaptionTrackSourceKey( captionTrack ) === sourceKey
		);
		if ( sourceCaptionTrack ) {
			return sourceCaptionTrack;
		}
	}

	const manualKey = getTrackLanguageKey( track );
	const exactCaptionTrack = captionTracks.find(
		captionTrack => getStoredCaptionTrackKey( captionTrack ) === manualKey
	);
	if ( exactCaptionTrack ) {
		return exactCaptionTrack;
	}

	return captionTracks.find( captionTrack =>
		isMatchingCaptionTrackLanguage( captionTrack, track.srcLang )
	);
};

/**
 * Resolve the managed track an upload or publish for a language updates: the
 * (non-generated) track the editor was opened from, or the existing manual
 * track for the target language. Auto-generated tracks are never updated in
 * place.
 *
 * @param {VideoTextTrack[]}    managedTracks - Current managed tracks.
 * @param {VideoTextTrack|null} sourceTrack   - Managed track the editor was opened from.
 * @param {string}              srcLang       - Canonical target language tag.
 * @return {VideoTextTrack|null} The track to update, or null when it adds a new one.
 */
export const resolveManagedTrackToUpdate = (
	managedTracks: VideoTextTrack[],
	sourceTrack: VideoTextTrack | null,
	srcLang: string
): VideoTextTrack | null => {
	const sourceTrackMatch =
		sourceTrack && ! isAutoGeneratedTrack( sourceTrack )
			? managedTracks.find( track => getTrackKey( track ) === getTrackKey( sourceTrack ) ) ?? null
			: null;
	const manualTrackMatch =
		managedTracks.find(
			track => isMatchingSubtitleTrackLanguage( track, srcLang ) && ! isAutoGeneratedTrack( track )
		) ?? null;

	return sourceTrackMatch || manualTrackMatch;
};

/**
 * Validate the upload form and build the track payload to upload.
 *
 * @param {object}              args                - Builder arguments.
 * @param {UploadFormTrack}     args.form           - Current upload form values.
 * @param {UploadFormMode}      args.mode           - Whether the form adds or replaces a track.
 * @param {VideoTextTrack|null} args.replacingTrack - Track being replaced, in replace mode.
 * @param {VideoTextTrack[]}    args.managedTracks  - Current managed tracks.
 * @return {object} The track to upload, or the validation error to show.
 */
export const buildUploadTrackPayload = ( {
	form,
	mode,
	replacingTrack,
	managedTracks,
}: {
	form: UploadFormTrack;
	mode: UploadFormMode;
	replacingTrack: VideoTextTrack | null;
	managedTracks: VideoTextTrack[];
} ): { track: UploadTrackDataProps } | { error: string } => {
	if ( ! form.tmpFile ) {
		return { error: __( 'Select a subtitle file before saving.', 'jetpack-videopress-pkg' ) };
	}

	if ( ! isAcceptedTrackFile( form.tmpFile ) ) {
		return {
			error: sprintf(
				/* translators: %s: comma-separated list of supported subtitle file extensions. */
				__( 'Supported subtitle formats: %s.', 'jetpack-videopress-pkg' ),
				SUPPORTED_CAPTION_FORMATS_LABEL
			),
		};
	}

	const canonicalSrcLang = canonicalizeLanguageTag( form.srcLang );
	const srcLang =
		mode === 'replace' && replacingTrack
			? canonicalSrcLang ?? replacingTrack.srcLang
			: canonicalSrcLang;

	if ( ! srcLang ) {
		return { error: __( 'Choose a subtitle language.', 'jetpack-videopress-pkg' ) };
	}

	const existingTrack = managedTracks.find(
		track => isMatchingSubtitleTrackLanguage( track, srcLang ) && ! isAutoGeneratedTrack( track )
	);

	if ( mode === 'add' && existingTrack ) {
		return {
			error: __(
				'A subtitle track already exists for that language. Use Replace file on the existing track to upload a new file.',
				'jetpack-videopress-pkg'
			),
		};
	}

	return {
		track: {
			kind: form.kind,
			srcLang,
			label: form.label.trim(),
			tmpFile: form.tmpFile,
		},
	};
};

/**
 * Merge the two track stores into one display list — published/managed tracks
 * first, then local drafts — so the track list renders a single, precomputed
 * model instead of reconciling the stores inline.
 *
 * @param {VideoTextTrack[]}    visibleManagedTracks - Managed subtitle tracks.
 * @param {SavedCaptionTrack[]} draftCaptionTracks   - Local drafts without a managed counterpart.
 * @return {CaptionTrackRow[]} The merged display rows.
 */
export const buildTrackRows = (
	visibleManagedTracks: VideoTextTrack[],
	draftCaptionTracks: SavedCaptionTrack[]
): CaptionTrackRow[] => {
	const managedRows: CaptionTrackRow[] = visibleManagedTracks.map( track => {
		const isGenerated = isAutoGeneratedTrack( track );

		/*
		 * Once a language has a manual track, its edits go through that track:
		 * publishing an edit of the generated captions would overwrite it, so
		 * the generated row loses its Edit action.
		 */
		const hasManualTrackForLanguage =
			isGenerated &&
			visibleManagedTracks.some(
				other =>
					! isAutoGeneratedTrack( other ) &&
					isMatchingSubtitleTrackLanguage(
						other,
						getManualLanguageTagFromTrackKey( track.srcLang )
					)
			);

		return {
			type: 'managed',
			key: getTrackKey( track ),
			title: track.label || getTrackLanguageName( track.srcLang ),
			metaLabels: [
				getTrackSourceLabel( track ),
				getTrackStatusLabel( track ),
				track.isDraft ? __( 'Draft', 'jetpack-videopress-pkg' ) : '',
			].filter( Boolean ),
			isGenerated,
			isReady: isTrackReady( track ),
			isEditable: isTrackReady( track ) && ! hasManualTrackForLanguage,
			track,
		};
	} );

	const draftRows: CaptionTrackRow[] = draftCaptionTracks.map( captionTrack => {
		const localTrack = getManualTrackFromCaptionTrack( captionTrack );
		return {
			type: 'draft',
			key: getStoredCaptionTrackKey( captionTrack ),
			title: localTrack.label || getTrackLanguageName( localTrack.srcLang ),
			captionTrack,
		};
	} );

	return [ ...managedRows, ...draftRows ];
};

/**
 * Build the caption track (CPT) payload for a manual editor save.
 *
 * @param {object}              args                - Payload arguments.
 * @param {'draft'|'publish'}   args.status         - Target status.
 * @param {string}              args.guid           - VideoPress GUID.
 * @param {ManualTrack}         args.manualTrack    - Manual editor track fields.
 * @param {VideoTextTrack|null} args.sourceTrack    - Managed track the editor was opened from.
 * @param {CaptionCueBlock[]}   args.cueBlocks      - Current cue blocks.
 * @param {number|undefined}    args.captionTrackId - Saved caption track being edited, if any.
 * @param {SavedCaptionTrack[]} args.captionTracks  - Saved caption tracks, to reuse the
 *                                                  language's existing record instead of duplicating it.
 * @return {CaptionTrack|null} The payload, or null when no valid language is set.
 */
export const buildCaptionTrackPayload = ( {
	status,
	guid,
	manualTrack,
	sourceTrack,
	cueBlocks,
	captionTrackId,
	captionTracks,
}: {
	status: 'draft' | 'publish';
	guid: string;
	manualTrack: ManualTrack;
	sourceTrack: VideoTextTrack | null;
	cueBlocks: CaptionCueBlock[];
	captionTrackId: number | undefined;
	captionTracks: SavedCaptionTrack[];
} ): CaptionTrack | null => {
	const canonicalSrcLang = canonicalizeLanguageTag( manualTrack.srcLang );
	if ( ! canonicalSrcLang ) {
		return null;
	}

	/*
	 * Reuse the existing caption track for this language so a second save
	 * updates it instead of creating a duplicate: there is one track per
	 * language, so language uniquely resolves the record to write.
	 */
	const existingForLanguage = captionTracks.find( captionTrack =>
		isMatchingCaptionTrackLanguage( captionTrack, canonicalSrcLang )
	);

	return {
		id: captionTrackId ?? existingForLanguage?.id,
		title:
			manualTrack.label.trim() ||
			sprintf(
				/* translators: %s: subtitle track language tag. */
				__( 'Subtitle track %s', 'jetpack-videopress-pkg' ),
				canonicalSrcLang
			),
		content: serialize( cueBlocks ),
		status,
		meta: {
			[ CAPTION_TRACK_META.guid ]: guid,
			[ CAPTION_TRACK_META.kind ]: manualTrack.kind,
			[ CAPTION_TRACK_META.srcLang ]: canonicalSrcLang,
			[ CAPTION_TRACK_META.label ]: manualTrack.label.trim(),
			...getSourceTrackMeta( sourceTrack ),
		},
	};
};
