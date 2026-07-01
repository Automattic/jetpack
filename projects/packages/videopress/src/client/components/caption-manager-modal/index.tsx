/**
 * External dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { createBlock, parse, serialize } from '@wordpress/blocks';
import {
	Button,
	DropZone,
	FormFileUpload,
	Modal,
	Notice,
	TextareaControl,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight, plus, upload } from '@wordpress/icons';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import {
	CAPTION_FORMAT_MIME_TYPES,
	deleteTrackForGuid,
	fetchTrackContentForGuid,
	normalizeVideoTextTrackResponse,
	SUPPORTED_CAPTION_FORMATS,
	TRACK_KIND_OPTIONS,
	uploadTrackForGuid,
} from '../../lib/video-tracks';
import {
	CAPTION_TRACK_META,
	deleteCaptionTrack,
	getSourceTrackMeta,
	saveCaptionTrack,
} from '../../lib/video-tracks/caption-tracks';
import {
	CAPTION_CUE_BLOCK_NAME,
	captionBlocksToCues,
	formatSecondsAsTimestamp,
	getCaptionCueValidationErrors,
	parseCaptionTextInput,
	parseCaptionTextTrack,
	parseTimestampToSeconds,
	serializeCuesToWebVtt,
} from '../../lib/video-tracks/cues';
import {
	canonicalizeLanguageTag,
	formatLanguageTagForDisplay,
	getLanguageDisplayName,
	getManualLanguageTagFromTrackKey,
	getSiteLanguageTag,
	isGeneratedLanguageKey,
} from '../../lib/video-tracks/language';
import {
	focusCueOnMount,
	registerCaptionCueBlock,
	setCurrentCueVideoTime,
} from './caption-cue-block';
import CaptionPreviewPlayer from './caption-preview-player';
import LanguageControl from './language-control';
import TrackList from './track-list';
import { useCaptionTracks } from './use-caption-tracks';
import { useVideoTracks } from './use-video-tracks';
import './style.scss';
/**
 * Types
 */
import type { CaptionPreviewPlayerHandle } from './caption-preview-player';
import type { CaptionTrackRow } from './track-list';
import type { CaptionManagerModalProps } from './types';
import type { SavedCaptionTrack } from '../../lib/video-tracks/caption-tracks';
import type { CaptionCueValidationError } from '../../lib/video-tracks/cues';
import type {
	trackKindOptionProps,
	UploadTrackDataProps,
	VideoTextTrack,
} from '../../lib/video-tracks/types';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';

registerCaptionCueBlock();

const debug = debugFactory( 'videopress:caption-manager-modal' );

const DEFAULT_KIND: trackKindOptionProps = 'subtitles';
const LISTABLE_TRACK_KIND_OPTIONS: trackKindOptionProps[] = [ 'captions', 'subtitles' ];

type UploadFormTrack = {
	kind: trackKindOptionProps;
	srcLang: string;
	label: string;
	tmpFile: File | null;
};

type ManualTrack = {
	kind: trackKindOptionProps;
	srcLang: string;
	label: string;
};

type ModalView = 'tracks' | 'editor';
type WorkspaceMode = 'upload' | 'manual';
type UploadFormMode = 'add' | 'replace';
type NoticeState = { status: 'success' | 'error'; message: string } | null;
type CaptionCueBlock = ReturnType< typeof createBlock >;

type TrackApiError = {
	code?: string;
	error?: string;
	message?: string;
};

const UPLOAD_FORM_TITLE_LABELS: Record< UploadFormMode, string > = {
	add: __( 'Upload subtitle track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace subtitle track', 'jetpack-videopress-pkg' ),
};

const UPLOAD_FORM_ACTION_LABELS: Record< UploadFormMode, string > = {
	add: __( 'Upload track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace track', 'jetpack-videopress-pkg' ),
};

const CAPTION_TRACK_NOTICE_LABELS: Record< 'draft' | 'publish', string > = {
	draft: __( 'Subtitle track draft saved.', 'jetpack-videopress-pkg' ),
	publish: __( 'Subtitle track published.', 'jetpack-videopress-pkg' ),
};

const PREVIEW_SEEK_STEP_SECONDS = 5;

const emptyUploadForm = ( srcLang = '' ): UploadFormTrack => ( {
	kind: DEFAULT_KIND,
	srcLang,
	label: srcLang ? getLanguageDisplayName( srcLang ) : '',
	tmpFile: null,
} );

const emptyManualTrack = ( srcLang = '' ): ManualTrack => ( {
	kind: DEFAULT_KIND,
	srcLang,
	label: srcLang ? getLanguageDisplayName( srcLang ) : '',
} );

const getTrackLanguageKey = ( track: Pick< VideoTextTrack, 'kind' | 'srcLang' > ) =>
	`${ track.kind }:${ track.srcLang }`;

const getTrackKey = (
	track: Pick< VideoTextTrack, 'kind' | 'srcLang' > &
		Partial< Pick< VideoTextTrack, 'id' | 'source' > >
) => `${ getTrackLanguageKey( track ) }:${ track.id ?? track.source ?? '' }`;

const getCaptionTrackSourceKey = ( captionTrack: SavedCaptionTrack ) =>
	`${ captionTrack.meta[ CAPTION_TRACK_META.sourceTrackKind ] ?? '' }:${
		captionTrack.meta[ CAPTION_TRACK_META.sourceTrackSrcLang ] ?? ''
	}`;

const getStoredCaptionTrackKey = ( captionTrack: SavedCaptionTrack ) =>
	`${ captionTrack.meta[ CAPTION_TRACK_META.kind ] }:${
		captionTrack.meta[ CAPTION_TRACK_META.srcLang ]
	}`;

const isSubtitleTrackKind = ( kind?: string ): kind is trackKindOptionProps =>
	LISTABLE_TRACK_KIND_OPTIONS.includes( kind as trackKindOptionProps );

const isListableCaptionTrack = ( captionTrack: SavedCaptionTrack ) =>
	isSubtitleTrackKind( captionTrack.meta[ CAPTION_TRACK_META.kind ] ) &&
	!! captionTrack.meta[ CAPTION_TRACK_META.srcLang ];

const isMatchingSubtitleTrackLanguage = (
	track: Pick< VideoTextTrack, 'kind' | 'srcLang' >,
	srcLang: string
) => isSubtitleTrackKind( track.kind ) && track.srcLang === srcLang;

const isMatchingCaptionTrackLanguage = ( captionTrack: SavedCaptionTrack, srcLang: string ) =>
	isListableCaptionTrack( captionTrack ) &&
	captionTrack.meta[ CAPTION_TRACK_META.srcLang ] === srcLang;

/**
 * Build a file-input `accept` value from supported caption formats, including
 * each format's MIME type when known so browsers that filter by MIME still
 * offer the file.
 *
 * @param {string[]} supportedFormats - Supported file extensions.
 * @return {string} Comma-separated list of extensions and MIME types.
 */
const getAcceptedFileTypes = ( supportedFormats: string[] ) =>
	supportedFormats
		.flatMap( extension => {
			const normalizedExtension = extension.startsWith( '.' ) ? extension : `.${ extension }`;
			const mimeType = CAPTION_FORMAT_MIME_TYPES[ normalizedExtension ];
			return mimeType ? [ normalizedExtension, mimeType ] : [ normalizedExtension ];
		} )
		.join( ',' );

const ACCEPTED_FILE_TYPES = getAcceptedFileTypes( SUPPORTED_CAPTION_FORMATS );
const SUPPORTED_CAPTION_FORMATS_LABEL = SUPPORTED_CAPTION_FORMATS.join( ', ' );

/**
 * Check a file's extension against the supported caption formats.
 *
 * @param {File|null} file             - File to check, or null if none was chosen.
 * @param {string[]}  supportedFormats - Supported file extensions.
 * @return {boolean} Whether the file's extension is supported.
 */
const isAcceptedTrackFile = ( file: File | null, supportedFormats: string[] ): boolean => {
	if ( ! file ) {
		return false;
	}

	const lowerName = file.name.toLowerCase();
	return supportedFormats.some( extension =>
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
const hasTrackApiError = ( response: unknown ): response is TrackApiError =>
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
const getTrackApiErrorMessage = ( response: unknown, fallback: string ): string => {
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
const isAutoGeneratedTrack = ( track: VideoTextTrack ) =>
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
const getTrackLanguageName = ( srcLang: string ) =>
	getLanguageDisplayName( getManualLanguageTagFromTrackKey( srcLang ) || srcLang );

/**
 * Build a filename for a track download, normalizing non-subtitle kinds to
 * the default kind and the language tag to its canonical form when possible.
 *
 * @param {VideoTextTrack} track - Track being downloaded.
 * @return {string} A `.vtt` filename for the track.
 */
const getDownloadFileName = ( track: VideoTextTrack ) =>
	`${ isSubtitleTrackKind( track.kind ) ? DEFAULT_KIND : track.kind }-${
		canonicalizeLanguageTag( track.srcLang ) ?? track.srcLang
	}.vtt`;

/**
 * Map a cue validation error to the notice message shown before publishing.
 *
 * @param {CaptionCueValidationError} error - Validation error to describe.
 * @return {string} The notice message for the error.
 */
const getCueValidationNoticeMessage = ( error: CaptionCueValidationError ) => {
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

const createCueBlock = ( cue?: Partial< { startTime: string; endTime: string; text: string } > ) =>
	createBlock( CAPTION_CUE_BLOCK_NAME, {
		startTime: cue?.startTime ?? '00:00:00.000',
		endTime: cue?.endTime ?? '00:00:02.000',
		text: cue?.text ?? '',
	} );

const createEmptyCueBlocks = () => [ createCueBlock() ];

/**
 * Parse a plain-text caption track into cue blocks, falling back to a single
 * empty cue when the text contains none.
 *
 * @param {string} trackText - Raw caption track content.
 * @return {CaptionCueBlock[]} The parsed cue blocks.
 */
const createCueBlocksFromTrackText = ( trackText: string ) => {
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
const createCueBlocksFromCaptionTrack = ( captionTrack: SavedCaptionTrack ) => {
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
const getCueBlocksSignature = ( blocks: CaptionCueBlock[] ): string =>
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
const getManualTrackFromCaptionTrack = ( captionTrack: SavedCaptionTrack ): ManualTrack => ( {
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
const getSourceTrackFromCaptionTrack = (
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

const getDefaultCueStartTime = ( currentTime: number ) => formatSecondsAsTimestamp( currentTime );

const getDefaultCueEndTime = ( currentTime: number ) => formatSecondsAsTimestamp( currentTime + 2 );

/**
 * Whether an event target is a form field or editable element, so the manual
 * editor's keyboard shortcuts don't fire while the user is typing in one.
 *
 * @param {EventTarget|null} target - Event target to check.
 * @return {boolean} Whether the target is a form field.
 */
const isFormFieldTarget = ( target: EventTarget | null ) => {
	if ( ! ( target instanceof HTMLElement ) ) {
		return false;
	}

	return (
		target.isContentEditable ||
		[ 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON' ].includes( target.tagName )
	);
};

/**
 * Shared VideoPress caption manager modal.
 *
 * @param props                - Component props.
 * @param props.isOpen         - Whether the modal is open.
 * @param props.guid           - VideoPress GUID.
 * @param props.title          - Optional video title.
 * @param props.videoSrc       - Optional preview video source.
 * @param props.poster         - Optional preview poster image.
 * @param props.isPrivate      - Whether the video is private, so previews need a playback token.
 * @param props.tracks         - Current track list.
 * @param props.onClose        - Close handler.
 * @param props.onTracksChange - Called with the updated track list.
 * @return Caption manager modal.
 */
export default function CaptionManagerModal( {
	isOpen,
	guid,
	title,
	videoSrc,
	poster,
	isPrivate,
	tracks,
	onClose,
	onTracksChange,
}: CaptionManagerModalProps ): ReactElement | null {
	const cueEditorRef = useRef< HTMLDivElement >( null );
	const addTrackButtonRef = useRef< HTMLButtonElement >( null );
	const editorWorkspaceRef = useRef< HTMLDivElement >( null );
	const shouldScrollCueEditorToEndRef = useRef( false );
	const playerRef = useRef< CaptionPreviewPlayerHandle >( null );
	const [ modalView, setModalView ] = useState< ModalView >( 'tracks' );
	const [ workspaceMode, setWorkspaceMode ] = useState< WorkspaceMode >( 'manual' );
	const [ uploadForm, setUploadForm ] = useState< UploadFormTrack >( emptyUploadForm );
	const [ uploadFormMode, setUploadFormMode ] = useState< UploadFormMode >( 'add' );
	const [ replacingTrack, setReplacingTrack ] = useState< VideoTextTrack | null >( null );
	const [ manualTrack, setManualTrack ] = useState< ManualTrack >( emptyManualTrack );
	const [ manualSourceTrack, setManualSourceTrack ] = useState< VideoTextTrack | null >( null );
	const [ cueBlocks, setCueBlocks ] = useState< CaptionCueBlock[] >( createEmptyCueBlocks );
	// Signature of the last loaded/saved cue content, to distinguish an edit from viewing.
	const manualBaselineRef = useRef( getCueBlocksSignature( createEmptyCueBlocks() ) );
	// Language/label the editor was seeded with, so changing only those counts as an edit.
	const manualTrackBaselineRef = useRef< Pick< ManualTrack, 'srcLang' | 'label' > >(
		emptyManualTrack()
	);
	// Monotonic id of the current editor workspace; stale async continuations bail out on it.
	const editorRequestIdRef = useRef( 0 );
	const [ captionTrackId, setCaptionTrackId ] = useState< number | undefined >();
	const [ notice, setNotice ] = useState< NoticeState >( null );

	const { managedTracks, setManagedTracks, previewAspectRatio } = useVideoTracks( {
		guid,
		isOpen,
		tracks,
		onError: () =>
			setNotice( {
				status: 'error',
				message: __(
					'Couldn’t load the latest track list for this video. It may be incomplete.',
					'jetpack-videopress-pkg'
				),
			} ),
	} );
	const { captionTracks, setCaptionTracks, isLoadingCaptionTracks } = useCaptionTracks( {
		guid,
		isOpen,
		onError: () =>
			setNotice( {
				status: 'error',
				message: __(
					'Couldn’t load saved subtitle drafts. Any existing drafts may not appear.',
					'jetpack-videopress-pkg'
				),
			} ),
	} );

	const [ isSavingUpload, setIsSavingUpload ] = useState( false );
	const [ isSavingCaptionTrack, setIsSavingCaptionTrack ] = useState( false );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ isLoadingTrackText, setIsLoadingTrackText ] = useState( false );
	const [ deletingTrackKey, setDeletingTrackKey ] = useState< string | null >( null );
	const [ downloadingTrackKey, setDownloadingTrackKey ] = useState< string | null >( null );
	const [ currentTime, setCurrentTime ] = useState( 0 );
	const [ isTextImportOpen, setIsTextImportOpen ] = useState( false );
	const [ captionTextInput, setCaptionTextInput ] = useState( '' );

	// Seed the editor and record the baseline, so opening a track to view isn't a dirty edit.
	const setEditorCueBlocks = useCallback( ( blocks: CaptionCueBlock[] ) => {
		manualBaselineRef.current = getCueBlocksSignature( blocks );
		setCueBlocks( blocks );
	}, [] );

	// Seed the manual track fields and record their baseline, so only later changes are edits.
	const seedManualTrack = useCallback( ( track: ManualTrack ) => {
		manualTrackBaselineRef.current = { srcLang: track.srcLang, label: track.label };
		setManualTrack( track );
	}, [] );

	const resetEditorToTrackList = useCallback( () => {
		editorRequestIdRef.current += 1;
		setWorkspaceMode( 'manual' );
		setModalView( 'tracks' );
		setUploadForm( emptyUploadForm() );
		setUploadFormMode( 'add' );
		setReplacingTrack( null );
		seedManualTrack( emptyManualTrack() );
		setManualSourceTrack( null );
		setEditorCueBlocks( createEmptyCueBlocks() );
		setCaptionTrackId( undefined );
		setIsLoadingTrackText( false );
		setIsTextImportOpen( false );
		setCaptionTextInput( '' );
		setNotice( null );
	}, [ seedManualTrack, setEditorCueBlocks ] );

	// Whether the manual editor holds unsaved work, to guard close/back/drop-to-upload.
	const hasUnsavedManualEdits = useCallback( () => {
		if ( modalView !== 'editor' || workspaceMode !== 'manual' ) {
			return false;
		}

		if ( captionTextInput.trim() ) {
			return true;
		}

		if (
			manualTrack.srcLang !== manualTrackBaselineRef.current.srcLang ||
			manualTrack.label !== manualTrackBaselineRef.current.label
		) {
			return true;
		}

		return getCueBlocksSignature( cueBlocks ) !== manualBaselineRef.current;
	}, [ modalView, workspaceMode, captionTextInput, cueBlocks, manualTrack ] );

	const confirmDiscardManualEdits = useCallback( () => {
		if ( ! hasUnsavedManualEdits() ) {
			return true;
		}

		// eslint-disable-next-line no-alert -- Blocking confirmation so unsaved subtitle edits aren't silently discarded.
		return window.confirm( __( 'Discard unsaved subtitle changes?', 'jetpack-videopress-pkg' ) );
	}, [ hasUnsavedManualEdits ] );

	const handleRequestClose = useCallback( () => {
		if ( confirmDiscardManualEdits() ) {
			onClose();
		}
	}, [ confirmDiscardManualEdits, onClose ] );

	const handleBackToTracks = useCallback( () => {
		if ( confirmDiscardManualEdits() ) {
			resetEditorToTrackList();
		}
	}, [ confirmDiscardManualEdits, resetEditorToTrackList ] );

	useEffect( () => {
		if ( ! shouldScrollCueEditorToEndRef.current ) {
			return;
		}

		shouldScrollCueEditorToEndRef.current = false;
		if ( cueEditorRef.current?.scrollTo ) {
			cueEditorRef.current.scrollTo( {
				top: cueEditorRef.current.scrollHeight,
				behavior: 'smooth',
			} );
		} else if ( cueEditorRef.current ) {
			cueEditorRef.current.scrollTop = cueEditorRef.current.scrollHeight;
		}
	}, [ cueBlocks ] );

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		resetEditorToTrackList();
	}, [ isOpen, resetEditorToTrackList ] );

	/*
	 * Place initial focus deliberately: the "Add track" button in the list, and
	 * the editor workspace container (not a header button or the language field)
	 * when editing, so opening a view never grabs the close button or the picker.
	 */
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		const target = modalView === 'editor' ? editorWorkspaceRef.current : addTrackButtonRef.current;
		target?.focus();
	}, [ isOpen, modalView, workspaceMode ] );

	const visibleCaptionTracks = useMemo(
		() => captionTracks.filter( isListableCaptionTrack ),
		[ captionTracks ]
	);
	const visibleManagedTracks = useMemo(
		() => managedTracks.filter( track => isSubtitleTrackKind( track.kind ) ),
		[ managedTracks ]
	);

	/*
	 * Local caption-track drafts that aren't yet published to VideoPress. These
	 * join the same track list as the managed tracks, marked with a Draft badge.
	 */
	const draftCaptionTracks = useMemo(
		() =>
			visibleCaptionTracks.filter(
				captionTrack =>
					captionTrack.status === 'draft' &&
					! visibleManagedTracks.some( track =>
						isMatchingSubtitleTrackLanguage(
							track,
							captionTrack.meta[ CAPTION_TRACK_META.srcLang ]
						)
					)
			),
		[ visibleCaptionTracks, visibleManagedTracks ]
	);

	/*
	 * Merge the two track stores into one display list — published/managed tracks
	 * first, then local drafts — so the render walks a single, precomputed model
	 * instead of reconciling the stores inline.
	 */
	const trackRows = useMemo< CaptionTrackRow[] >( () => {
		const managedRows: CaptionTrackRow[] = visibleManagedTracks.map( track => ( {
			type: 'managed',
			key: getTrackKey( track ),
			title: track.label || getTrackLanguageName( track.srcLang ),
			metaLabels: [
				getTrackSourceLabel( track ),
				getTrackStatusLabel( track ),
				track.isDraft ? __( 'Draft', 'jetpack-videopress-pkg' ) : '',
			].filter( Boolean ),
			isGenerated: isAutoGeneratedTrack( track ),
			isReady: isTrackReady( track ),
			track,
		} ) );

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
	}, [ visibleManagedTracks, draftCaptionTracks ] );

	/*
	 * Default language for a new track: the site language, unless a track already
	 * exists for it — then leave the picker empty so the user chooses a free one.
	 */
	const defaultLanguageTag = useMemo( () => {
		const usedTags = new Set< string >();
		visibleManagedTracks.forEach( track => {
			const tag =
				getManualLanguageTagFromTrackKey( track.srcLang ) ||
				canonicalizeLanguageTag( track.srcLang );
			if ( tag ) {
				usedTags.add( tag );
			}
		} );
		visibleCaptionTracks.forEach( captionTrack => {
			const tag = captionTrack.meta[ CAPTION_TRACK_META.srcLang ];
			if ( tag ) {
				usedTags.add( tag );
			}
		} );

		const siteLanguage = getSiteLanguageTag();
		return usedTags.has( siteLanguage ) ? '' : siteLanguage;
	}, [ visibleManagedTracks, visibleCaptionTracks ] );

	const editorCues = useMemo( () => captionBlocksToCues( cueBlocks ), [ cueBlocks ] );

	/*
	 * Parse each cue's timestamps once per cue change so the per-timeupdate
	 * lookups below compare plain numbers instead of re-parsing the strings.
	 */
	const cueRanges = useMemo(
		() =>
			editorCues.map( cue => ( {
				start: parseTimestampToSeconds( cue.startTime ),
				end: parseTimestampToSeconds( cue.endTime ),
				text: cue.text,
			} ) ),
		[ editorCues ]
	);

	const activeCueText = useMemo( () => {
		const activeCue = cueRanges.find(
			( { start, end } ) =>
				start !== null && end !== null && currentTime >= start && currentTime <= end
		);
		return activeCue?.text;
	}, [ cueRanges, currentTime ] );

	const cueStartTimes = useMemo(
		() =>
			cueRanges
				.map( ( { start } ) => start )
				.filter( ( start ): start is number => start !== null )
				.sort( ( a, b ) => a - b ),
		[ cueRanges ]
	);

	/*
	 * Memoized so the BlockEditorProvider doesn't reset all editor settings into
	 * its store on every keystroke (a fresh literal would), which dropped keys.
	 */
	const cueEditorSettings = useMemo(
		() => ( {
			allowedBlockTypes: [ CAPTION_CUE_BLOCK_NAME ],
			hasFixedToolbar: false,
			canLockBlocks: false,
			bodyPlaceholder: __( 'Add a subtitle cue.', 'jetpack-videopress-pkg' ),
		} ),
		[]
	);

	const updateUploadForm = useCallback(
		( key: keyof UploadFormTrack, value: string | File | null ) => {
			setUploadForm( current => ( { ...current, [ key ]: value } ) );
			setNotice( null );
		},
		[]
	);

	const applyTracksChange = useCallback(
		( updatedTracks: VideoTextTrack[] ) => {
			setManagedTracks( updatedTracks );
			onTracksChange( updatedTracks );
		},
		[ onTracksChange ]
	);

	const resetUploadForm = useCallback( () => {
		setUploadForm( emptyUploadForm() );
		setUploadFormMode( 'add' );
		setReplacingTrack( null );
		setNotice( null );
	}, [] );

	const findCaptionTrackForManualTrack = useCallback(
		( track: ManualTrack, sourceTrack: VideoTextTrack | null ) => {
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
		},
		[ captionTracks ]
	);

	const startStoredCaptionTrack = useCallback(
		( captionTrack: SavedCaptionTrack ) => {
			setModalView( 'editor' );
			setWorkspaceMode( 'manual' );
			seedManualTrack( getManualTrackFromCaptionTrack( captionTrack ) );
			setManualSourceTrack( getSourceTrackFromCaptionTrack( captionTrack, managedTracks ) );
			setCaptionTrackId( captionTrack.id );
			setEditorCueBlocks( createCueBlocksFromCaptionTrack( captionTrack ) );
			setIsLoadingTrackText( false );
			setIsTextImportOpen( false );
			setCaptionTextInput( '' );
			setNotice( null );
		},
		[ managedTracks, seedManualTrack, setEditorCueBlocks ]
	);

	const loadTrackText = useCallback(
		async ( track: VideoTextTrack ) => {
			const content = await fetchTrackContentForGuid( track, guid );
			if ( ! content ) {
				throw new Error( 'Track content was empty.' );
			}
			return createCueBlocksFromTrackText( content );
		},
		[ guid ]
	);

	const startManualTrack = useCallback(
		async ( sourceTrack: VideoTextTrack | null = null ) => {
			// New workspace: invalidate any in-flight content fetch from a previous one.
			editorRequestIdRef.current += 1;
			const requestId = editorRequestIdRef.current;
			const nextManualTrack: ManualTrack = sourceTrack
				? {
						kind: isAutoGeneratedTrack( sourceTrack ) ? DEFAULT_KIND : sourceTrack.kind,
						srcLang: getManualLanguageTagFromTrackKey( sourceTrack.srcLang ),
						label: sourceTrack.label || formatLanguageTagForDisplay( sourceTrack.srcLang ),
				  }
				: emptyManualTrack( defaultLanguageTag );
			const matchingCaptionTrack = findCaptionTrackForManualTrack( nextManualTrack, sourceTrack );

			setModalView( 'editor' );
			setWorkspaceMode( 'manual' );
			seedManualTrack( nextManualTrack );
			setManualSourceTrack( sourceTrack );
			setCaptionTrackId( matchingCaptionTrack?.id );
			setIsTextImportOpen( false );
			setCaptionTextInput( '' );
			setIsLoadingTrackText( false );
			setNotice( null );

			if ( matchingCaptionTrack ) {
				setEditorCueBlocks( createCueBlocksFromCaptionTrack( matchingCaptionTrack ) );
				return;
			}

			if ( ! sourceTrack ) {
				setEditorCueBlocks( createEmptyCueBlocks() );
				return;
			}

			setEditorCueBlocks( createEmptyCueBlocks() );
			setIsLoadingTrackText( true );
			try {
				const loadedBlocks = await loadTrackText( sourceTrack );
				if ( editorRequestIdRef.current !== requestId ) {
					return;
				}
				setEditorCueBlocks( loadedBlocks );
			} catch ( error ) {
				debug( 'fetch caption track text error', error );
				if ( editorRequestIdRef.current !== requestId ) {
					return;
				}
				setNotice( {
					status: 'error',
					message: __(
						'Unable to load subtitle content. You can try again from the track list or start from an empty subtitle track.',
						'jetpack-videopress-pkg'
					),
				} );
			} finally {
				if ( editorRequestIdRef.current === requestId ) {
					setIsLoadingTrackText( false );
				}
			}
		},
		[
			defaultLanguageTag,
			findCaptionTrackForManualTrack,
			loadTrackText,
			seedManualTrack,
			setEditorCueBlocks,
		]
	);

	const startUploadTrack = useCallback(
		( sourceTrack: VideoTextTrack | null = null ) => {
			setModalView( 'editor' );
			setWorkspaceMode( 'upload' );
			setIsLoadingTrackText( false );
			setIsTextImportOpen( false );
			setCaptionTextInput( '' );
			setUploadFormMode( sourceTrack ? 'replace' : 'add' );
			setReplacingTrack( sourceTrack );
			setUploadForm(
				sourceTrack
					? {
							kind: sourceTrack.kind,
							srcLang: formatLanguageTagForDisplay( sourceTrack.srcLang ),
							label: sourceTrack.label,
							tmpFile: null,
					  }
					: emptyUploadForm( defaultLanguageTag )
			);
			setNotice( null );
		},
		[ defaultLanguageTag ]
	);

	const handleCaptionFileDrop = useCallback(
		( files: File[] ) => {
			const file = files[ 0 ] ?? null;
			if ( ! file ) {
				return;
			}

			if ( ! isAcceptedTrackFile( file, SUPPORTED_CAPTION_FORMATS ) ) {
				setNotice( {
					status: 'error',
					message: sprintf(
						/* translators: %s: comma-separated list of accepted subtitle file extensions. */
						__( 'Accepted formats: %s.', 'jetpack-videopress-pkg' ),
						SUPPORTED_CAPTION_FORMATS_LABEL
					),
				} );
				return;
			}

			// Dropping a file switches to upload mode; confirm so it can't discard unsaved cue edits.
			if ( ! confirmDiscardManualEdits() ) {
				return;
			}

			startUploadTrack();
			updateUploadForm( 'tmpFile', file );
		},
		[ confirmDiscardManualEdits, startUploadTrack, updateUploadForm ]
	);

	const startTextImportTrack = useCallback( () => {
		setModalView( 'editor' );
		setWorkspaceMode( 'manual' );
		seedManualTrack( emptyManualTrack( defaultLanguageTag ) );
		setManualSourceTrack( null );
		setCaptionTrackId( undefined );
		setEditorCueBlocks( createEmptyCueBlocks() );
		setIsLoadingTrackText( false );
		setIsTextImportOpen( true );
		setCaptionTextInput( '' );
		setNotice( null );
	}, [ defaultLanguageTag, seedManualTrack, setEditorCueBlocks ] );

	const deleteTrack = useCallback(
		async ( track: VideoTextTrack ) => {
			const language = formatLanguageTagForDisplay( track.srcLang );
			const shouldDeleteTrack =
				// eslint-disable-next-line no-alert -- Needs a blocking confirmation before deleting a subtitle track.
				window.confirm(
					sprintf(
						/* translators: %s: subtitle track language or label. */
						__( 'Delete the %s subtitle track? This cannot be undone.', 'jetpack-videopress-pkg' ),
						track.label || language
					)
				);

			if ( ! shouldDeleteTrack ) {
				return;
			}

			const key = getTrackKey( track );
			setDeletingTrackKey( key );
			setNotice( null );

			try {
				const response = await deleteTrackForGuid( track, guid );
				if ( hasTrackApiError( response ) ) {
					setNotice( {
						status: 'error',
						message: sprintf(
							/* translators: %s: VideoPress API error. */
							__( 'Track error: %s', 'jetpack-videopress-pkg' ),
							getTrackApiErrorMessage(
								response,
								__( 'Unable to delete track.', 'jetpack-videopress-pkg' )
							)
						),
					} );
					return;
				}

				applyTracksChange( managedTracks.filter( current => getTrackKey( current ) !== key ) );
			} catch ( deleteError ) {
				debug( 'delete track error', deleteError );
				setNotice( {
					status: 'error',
					message: sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							deleteError,
							__( 'Unable to delete track.', 'jetpack-videopress-pkg' )
						)
					),
				} );
			} finally {
				setDeletingTrackKey( null );
			}
		},
		[ applyTracksChange, guid, managedTracks ]
	);

	const deleteDraft = useCallback( async ( captionTrack: SavedCaptionTrack ) => {
		const draft = getManualTrackFromCaptionTrack( captionTrack );
		const shouldDelete =
			// eslint-disable-next-line no-alert -- Needs a blocking confirmation before deleting a subtitle draft.
			window.confirm(
				sprintf(
					/* translators: %s: subtitle track language or label. */
					__( 'Delete the %s subtitle draft? This cannot be undone.', 'jetpack-videopress-pkg' ),
					draft.label || getTrackLanguageName( draft.srcLang )
				)
			);

		if ( ! shouldDelete ) {
			return;
		}

		const key = getStoredCaptionTrackKey( captionTrack );
		setDeletingTrackKey( key );
		setNotice( null );

		try {
			await deleteCaptionTrack( captionTrack.id );
			setCaptionTracks( current => current.filter( item => item.id !== captionTrack.id ) );
		} catch ( deleteError ) {
			debug( 'delete caption draft error', deleteError );
			setNotice( {
				status: 'error',
				message: __( 'Unable to delete the subtitle draft.', 'jetpack-videopress-pkg' ),
			} );
		} finally {
			setDeletingTrackKey( null );
		}
	}, [] );

	const downloadTrack = useCallback(
		async ( track: VideoTextTrack ) => {
			const key = getTrackKey( track );
			setDownloadingTrackKey( key );
			setNotice( null );

			try {
				const content = await fetchTrackContentForGuid( track, guid );
				if ( ! content ) {
					setNotice( {
						status: 'error',
						message: __( 'Unable to download track content.', 'jetpack-videopress-pkg' ),
					} );
					return;
				}

				const url = window.URL.createObjectURL( new Blob( [ content ], { type: 'text/vtt' } ) );
				const link = document.createElement( 'a' );
				link.href = url;
				link.download = getDownloadFileName( track );
				document.body.appendChild( link );
				link.click();
				link.remove();
				/*
				 * Revoke on the next tick: some browsers abort an in-flight download
				 * when the object URL is revoked in the same tick as the click.
				 */
				setTimeout( () => window.URL.revokeObjectURL( url ), 0 );
			} catch ( downloadError ) {
				debug( 'download track error', downloadError );
				setNotice( {
					status: 'error',
					message: __( 'Unable to download track content.', 'jetpack-videopress-pkg' ),
				} );
			} finally {
				setDownloadingTrackKey( null );
			}
		},
		[ guid ]
	);

	const saveUploadedTrack = useCallback( async () => {
		if ( ! uploadForm.tmpFile ) {
			setNotice( {
				status: 'error',
				message: __( 'Select a subtitle file before saving.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		if ( ! isAcceptedTrackFile( uploadForm.tmpFile, SUPPORTED_CAPTION_FORMATS ) ) {
			setNotice( {
				status: 'error',
				message: sprintf(
					/* translators: %s: comma-separated list of supported subtitle file extensions. */
					__( 'Supported subtitle formats: %s.', 'jetpack-videopress-pkg' ),
					SUPPORTED_CAPTION_FORMATS_LABEL
				),
			} );
			return;
		}

		const canonicalSrcLang = canonicalizeLanguageTag( uploadForm.srcLang );
		const srcLang =
			uploadFormMode === 'replace' && replacingTrack
				? canonicalSrcLang ?? replacingTrack.srcLang
				: canonicalSrcLang;

		if ( ! srcLang ) {
			setNotice( {
				status: 'error',
				message: __( 'Choose a subtitle language.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		const existingTrackIndex = managedTracks.findIndex(
			track => isMatchingSubtitleTrackLanguage( track, srcLang ) && ! isAutoGeneratedTrack( track )
		);

		if ( uploadFormMode === 'add' && existingTrackIndex > -1 ) {
			setNotice( {
				status: 'error',
				message: __(
					'A subtitle track already exists for that language. Use Replace file on the existing track to upload a new file.',
					'jetpack-videopress-pkg'
				),
			} );
			return;
		}

		const trackToUpload: UploadTrackDataProps = {
			kind: uploadForm.kind,
			srcLang,
			label: uploadForm.label.trim(),
			tmpFile: uploadForm.tmpFile,
		};

		setIsSavingUpload( true );
		setNotice( null );

		try {
			const trackUpdatePayload = {
				...replacingTrack,
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
			};

			/*
			 * Uploading replaces any existing track for the same kind and language,
			 * so both add and replace go through the same upload call.
			 */
			const src = await uploadTrackForGuid( trackToUpload, guid );

			if ( hasTrackApiError( src ) ) {
				setNotice( {
					status: 'error',
					message: sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							src,
							__( 'Unable to upload track.', 'jetpack-videopress-pkg' )
						)
					),
				} );
				return;
			}

			/*
			 * A replace that also changed the language stores the new track under a
			 * new key; remove the original so it isn't left behind. If that cleanup
			 * fails the old track survives, so warn instead of reporting clean success.
			 */
			let cleanupFailed = false;
			if (
				uploadFormMode === 'replace' &&
				replacingTrack &&
				! isMatchingSubtitleTrackLanguage( replacingTrack, srcLang )
			) {
				try {
					await deleteTrackForGuid(
						{ kind: replacingTrack.kind, srcLang: replacingTrack.srcLang },
						guid
					);
				} catch ( deleteError ) {
					debug( 'remove replaced track error', deleteError );
					cleanupFailed = true;
				}
			}

			// The upload succeeded, so fall back to the known track values if the response has nothing track-like.
			const uploadedTrack = normalizeVideoTextTrackResponse( src, trackUpdatePayload ) ?? {
				...trackUpdatePayload,
				src: trackUpdatePayload.src ?? '',
			};

			const updatedTracks = [ ...managedTracks ];
			const updatedTrackIndex =
				uploadFormMode === 'replace'
					? managedTracks.findIndex(
							track => !! replacingTrack && getTrackKey( track ) === getTrackKey( replacingTrack )
					  )
					: existingTrackIndex;

			if ( updatedTrackIndex > -1 ) {
				updatedTracks[ updatedTrackIndex ] = uploadedTrack;
			} else {
				updatedTracks.push( uploadedTrack );
			}

			applyTracksChange( updatedTracks );
			resetEditorToTrackList();
			setNotice(
				cleanupFailed
					? {
							status: 'error',
							message: __(
								'Subtitle track uploaded, but the previous language’s track couldn’t be removed and may still appear.',
								'jetpack-videopress-pkg'
							),
					  }
					: {
							status: 'success',
							message: __( 'Subtitle track uploaded.', 'jetpack-videopress-pkg' ),
					  }
			);
		} catch ( uploadError ) {
			debug( 'upload track error', uploadError );
			setNotice( {
				status: 'error',
				message: sprintf(
					/* translators: %s: VideoPress API error. */
					__( 'Track error: %s', 'jetpack-videopress-pkg' ),
					getTrackApiErrorMessage(
						uploadError,
						__( 'Unable to upload track.', 'jetpack-videopress-pkg' )
					)
				),
			} );
		} finally {
			setIsSavingUpload( false );
		}
	}, [
		guid,
		applyTracksChange,
		managedTracks,
		replacingTrack,
		resetEditorToTrackList,
		uploadForm,
		uploadFormMode,
	] );

	const buildCaptionTrackPayload = useCallback(
		( status: 'draft' | 'publish' ) => {
			const canonicalSrcLang = canonicalizeLanguageTag( manualTrack.srcLang );
			if ( ! canonicalSrcLang ) {
				setNotice( {
					status: 'error',
					message: __( 'Choose a subtitle language.', 'jetpack-videopress-pkg' ),
				} );
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

			const cueContent = serialize( cueBlocks );
			return {
				id: captionTrackId ?? existingForLanguage?.id,
				title:
					manualTrack.label.trim() ||
					sprintf(
						/* translators: %s: subtitle track language tag. */
						__( 'Subtitle track %s', 'jetpack-videopress-pkg' ),
						canonicalSrcLang
					),
				content: cueContent,
				status,
				meta: {
					[ CAPTION_TRACK_META.guid ]: guid,
					[ CAPTION_TRACK_META.kind ]: manualTrack.kind,
					[ CAPTION_TRACK_META.srcLang ]: canonicalSrcLang,
					[ CAPTION_TRACK_META.label ]: manualTrack.label.trim(),
					...getSourceTrackMeta( manualSourceTrack ),
				},
			};
		},
		[ captionTracks, cueBlocks, captionTrackId, guid, manualSourceTrack, manualTrack ]
	);

	const saveManualCaptionTrack = useCallback(
		async (
			status: 'draft' | 'publish' = 'draft',
			{ announce = true }: { announce?: boolean } = {}
		) => {
			const payload = buildCaptionTrackPayload( status );
			if ( ! payload ) {
				return null;
			}

			setIsSavingCaptionTrack( true );
			setNotice( null );

			try {
				const savedCaptionTrack = await saveCaptionTrack( payload );
				setCaptionTrackId( savedCaptionTrack.id );
				setCaptionTracks( current => {
					const existingIndex = current.findIndex(
						captionTrack => captionTrack.id === savedCaptionTrack.id
					);
					if ( existingIndex === -1 ) {
						return [ savedCaptionTrack, ...current ];
					}
					const next = [ ...current ];
					next[ existingIndex ] = savedCaptionTrack;
					return next;
				} );
				// The editor now matches what was saved, so it's no longer dirty.
				manualBaselineRef.current = getCueBlocksSignature( cueBlocks );
				manualTrackBaselineRef.current = {
					srcLang: manualTrack.srcLang,
					label: manualTrack.label,
				};
				// Publish owns the notice; only announce when Save draft is the whole action.
				if ( announce ) {
					setNotice( {
						status: 'success',
						message: CAPTION_TRACK_NOTICE_LABELS[ status ],
					} );
				}
				return savedCaptionTrack;
			} catch ( error ) {
				debug( 'save caption track error', error );
				if ( announce ) {
					setNotice( {
						status: 'error',
						message: __( 'Unable to save subtitle track.', 'jetpack-videopress-pkg' ),
					} );
				}
				return null;
			} finally {
				setIsSavingCaptionTrack( false );
			}
		},
		[ buildCaptionTrackPayload, cueBlocks, manualTrack ]
	);

	const publishManualTrack = useCallback( async () => {
		const canonicalSrcLang = canonicalizeLanguageTag( manualTrack.srcLang );
		if ( ! canonicalSrcLang ) {
			setNotice( {
				status: 'error',
				message: __( 'Choose a subtitle language.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		const cueValidationErrors = getCaptionCueValidationErrors( cueBlocks );
		if ( cueValidationErrors.length ) {
			setNotice( {
				status: 'error',
				message: getCueValidationNoticeMessage( cueValidationErrors[ 0 ] ),
			} );
			return;
		}

		const cues = captionBlocksToCues( cueBlocks );
		if ( ! cues.length ) {
			setNotice( {
				status: 'error',
				message: __( 'Add at least one subtitle cue before publishing.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		setIsPublishing( true );
		setNotice( null );
		// Tie the post-publish reset to this workspace; a reset or new editor bumps the id.
		const requestId = editorRequestIdRef.current;

		try {
			const vtt = serializeCuesToWebVtt( cues );
			const filename = `${ canonicalSrcLang }-${ manualTrack.kind }.vtt`.replace(
				/[^a-z0-9._-]/gi,
				'-'
			);
			const file = new File( [ vtt ], filename, { type: 'text/vtt' } );
			const trackToUpload: UploadTrackDataProps = {
				kind: manualTrack.kind,
				srcLang: canonicalSrcLang,
				label: manualTrack.label.trim(),
				tmpFile: file,
			};
			const manualTrackIndex = managedTracks.findIndex(
				track =>
					isMatchingSubtitleTrackLanguage( track, trackToUpload.srcLang ) &&
					! isAutoGeneratedTrack( track )
			);
			const sourceTrackIndex =
				manualSourceTrack && ! isAutoGeneratedTrack( manualSourceTrack )
					? managedTracks.findIndex(
							track => getTrackKey( track ) === getTrackKey( manualSourceTrack )
					  )
					: -1;
			const trackToUpdate =
				( sourceTrackIndex > -1 ? managedTracks[ sourceTrackIndex ] : null ) ||
				( manualTrackIndex > -1 ? managedTracks[ manualTrackIndex ] : null );
			const trackUpdatePayload = {
				...trackToUpdate,
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
			};

			// Uploading replaces any existing track for the same kind and language.
			const src = await uploadTrackForGuid( trackToUpload, guid );

			if ( hasTrackApiError( src ) ) {
				setNotice( {
					status: 'error',
					message: sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							src,
							__( 'Unable to publish subtitles.', 'jetpack-videopress-pkg' )
						)
					),
				} );
				return;
			}

			/*
			 * The server only replaces a track with the same kind and language, so
			 * publishing over an existing track under a new kind or language leaves
			 * the original behind; remove it. If that cleanup fails the old track
			 * survives, so warn rather than report clean success.
			 */
			let cleanupFailed = false;
			if (
				trackToUpdate &&
				( trackToUpdate.kind !== trackToUpload.kind ||
					trackToUpdate.srcLang !== trackToUpload.srcLang )
			) {
				try {
					await deleteTrackForGuid(
						{ kind: trackToUpdate.kind, srcLang: trackToUpdate.srcLang },
						guid
					);
				} catch ( deleteError ) {
					debug( 'remove replaced track error', deleteError );
					cleanupFailed = true;
				}
			}

			// The upload succeeded, so fall back to the known track values if the response has nothing track-like.
			const uploadedTrack = normalizeVideoTextTrackResponse( src, trackUpdatePayload ) ?? {
				...trackUpdatePayload,
				src: trackUpdatePayload.src ?? '',
			};
			const updatedIndex = sourceTrackIndex > -1 ? sourceTrackIndex : manualTrackIndex;
			const updatedTracks = [ ...managedTracks ];
			if ( updatedIndex > -1 ) {
				updatedTracks[ updatedIndex ] = uploadedTrack;
			} else {
				updatedTracks.push( uploadedTrack );
			}

			// The VTT is live at this point, so reflect it in the list even if the save below fails.
			applyTracksChange( updatedTracks );

			const savedCaptionTrack = await saveManualCaptionTrack( 'publish', { announce: false } );
			if ( ! savedCaptionTrack ) {
				/*
				 * The VTT is already live on the video; only the local editable copy
				 * failed to save. Say so instead of implying nothing was published.
				 */
				setNotice( {
					status: 'error',
					message: __(
						'Subtitles were published to the video, but saving the editable copy failed. Reopen the track to keep editing.',
						'jetpack-videopress-pkg'
					),
				} );
				return;
			}

			// A late-resolving publish must not wipe an editor the user has since started.
			if ( editorRequestIdRef.current !== requestId ) {
				return;
			}

			resetEditorToTrackList();
			setNotice(
				cleanupFailed
					? {
							status: 'error',
							message: __(
								'Subtitles published, but the previous language’s track couldn’t be removed and may still appear.',
								'jetpack-videopress-pkg'
							),
					  }
					: {
							status: 'success',
							message: __( 'Subtitles published.', 'jetpack-videopress-pkg' ),
					  }
			);
		} catch ( error ) {
			debug( 'publish manual caption track error', error );
			setNotice( {
				status: 'error',
				message: __( 'Unable to publish subtitles.', 'jetpack-videopress-pkg' ),
			} );
		} finally {
			setIsPublishing( false );
		}
	}, [
		applyTracksChange,
		cueBlocks,
		guid,
		managedTracks,
		manualSourceTrack,
		manualTrack,
		resetEditorToTrackList,
		saveManualCaptionTrack,
	] );

	useEffect( () => {
		setCurrentCueVideoTime( currentTime );
	}, [ currentTime ] );

	const addCue = useCallback( () => {
		shouldScrollCueEditorToEndRef.current = true;
		const block = createCueBlock( {
			startTime: getDefaultCueStartTime( currentTime ),
			endTime: getDefaultCueEndTime( currentTime ),
		} );
		focusCueOnMount( block.clientId );
		setCueBlocks( current => [ ...current, block ] );
	}, [ currentTime ] );

	const importCaptionText = useCallback(
		( mode: 'append' | 'replace' = 'replace' ) => {
			const cues = parseCaptionTextInput( captionTextInput );
			if ( ! cues.length ) {
				setNotice( {
					status: 'error',
					message: __( 'Paste subtitle text before importing.', 'jetpack-videopress-pkg' ),
				} );
				return;
			}

			shouldScrollCueEditorToEndRef.current = mode === 'append';
			const newBlocks = cues.map( createCueBlock );
			setCueBlocks( current =>
				mode === 'append'
					? [
							...current.filter( block => String( block.attributes?.text ?? '' ).trim() ),
							...newBlocks,
					  ]
					: newBlocks
			);
			setCaptionTextInput( '' );
			setIsTextImportOpen( false );
			setNotice( {
				status: 'success',
				message: __( 'Subtitle text imported.', 'jetpack-videopress-pkg' ),
			} );
		},
		[ captionTextInput ]
	);

	const seekToAdjacentCue = useCallback(
		( direction: 'next' | 'previous' ) => {
			if ( ! cueStartTimes.length ) {
				return;
			}

			const baseTime = playerRef.current?.getCurrentTime() ?? currentTime;
			const nextTime =
				direction === 'next'
					? cueStartTimes.find( startTime => startTime > baseTime + 0.01 )
					: [ ...cueStartTimes ].reverse().find( startTime => startTime < baseTime - 0.01 );

			if ( nextTime !== undefined ) {
				playerRef.current?.seekTo( nextTime );
			}
		},
		[ cueStartTimes, currentTime ]
	);

	const handleManualEditorKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ) {
				return;
			}

			if ( isFormFieldTarget( event.target ) ) {
				return;
			}

			switch ( event.key.toLowerCase() ) {
				case ' ':
					event.preventDefault();
					playerRef.current?.togglePlayback();
					break;
				case 'arrowleft':
					event.preventDefault();
					playerRef.current?.seekBy( -PREVIEW_SEEK_STEP_SECONDS );
					break;
				case 'arrowright':
					event.preventDefault();
					playerRef.current?.seekBy( PREVIEW_SEEK_STEP_SECONDS );
					break;
				case 'c':
					event.preventDefault();
					addCue();
					break;
				case 'n':
					event.preventDefault();
					seekToAdjacentCue( 'next' );
					break;
				case 'p':
					event.preventDefault();
					seekToAdjacentCue( 'previous' );
					break;
			}
		},
		[ addCue, seekToAdjacentCue ]
	);

	const uploadFormTitle = UPLOAD_FORM_TITLE_LABELS[ uploadFormMode ];
	const fileName = uploadForm.tmpFile?.name;
	const getEditorHeading = () => {
		if ( workspaceMode === 'upload' ) {
			return uploadFormMode === 'replace'
				? __( 'Replace subtitle file', 'jetpack-videopress-pkg' )
				: __( 'Upload subtitle file', 'jetpack-videopress-pkg' );
		}

		return manualSourceTrack || captionTrackId
			? __( 'Edit subtitle track', 'jetpack-videopress-pkg' )
			: __( 'New subtitle track', 'jetpack-videopress-pkg' );
	};
	const emptyMessage = __(
		'No subtitle tracks have been added to this video yet.',
		'jetpack-videopress-pkg'
	);
	const isEditorView = modalView === 'editor';

	/*
	 * Whether the manual editor is updating a track that's already published for
	 * this language: publishing overwrites the live track (so the button reads
	 * "Update"), and saving a draft alongside it doesn't make sense.
	 */
	const isUpdatingPublishedTrack = useMemo(
		() =>
			isEditorView &&
			workspaceMode === 'manual' &&
			visibleManagedTracks.some(
				track =>
					isMatchingSubtitleTrackLanguage(
						track,
						canonicalizeLanguageTag( manualTrack.srcLang ) ?? ''
					) && ! isAutoGeneratedTrack( track )
			),
		[ isEditorView, workspaceMode, visibleManagedTracks, manualTrack.srcLang ]
	);

	const manualLanguageName = useMemo(
		() => ( manualTrack.srcLang ? getLanguageDisplayName( manualTrack.srcLang ) : '' ),
		[ manualTrack.srcLang ]
	);
	const videoTitle = title || __( 'VideoPress video', 'jetpack-videopress-pkg' );
	const showManualLanguageInTitle =
		isEditorView && workspaceMode === 'manual' && !! manualLanguageName;
	const modalHeaderTitle = showManualLanguageInTitle
		? sprintf(
				/* translators: 1: video title. 2: current subtitle language name. */
				__( 'Manage subtitles for %1$s: %2$s', 'jetpack-videopress-pkg' ),
				videoTitle,
				manualLanguageName
		  )
		: sprintf(
				/* translators: %s: video title. */
				__( 'Manage subtitles for %s', 'jetpack-videopress-pkg' ),
				videoTitle
		  );
	const previewPanel = (
		<CaptionPreviewPlayer
			ref={ playerRef }
			guid={ guid }
			videoSrc={ videoSrc }
			poster={ poster }
			isPrivate={ isPrivate }
			previewAspectRatio={ previewAspectRatio }
			activeCueText={ activeCueText }
			onCurrentTimeChange={ setCurrentTime }
		/>
	);

	return isOpen ? (
		<>
			<Modal
				title={ modalHeaderTitle }
				onRequestClose={ handleRequestClose }
				className="videopress-caption-manager"
				focusOnMount={ false }
			>
				<DropZone
					label={ __( 'Drop a subtitle file to upload', 'jetpack-videopress-pkg' ) }
					onFilesDrop={ handleCaptionFileDrop }
				/>

				<div className="videopress-caption-manager__action-bar">
					<div className="videopress-caption-manager__action-bar-start">
						<h3 className="videopress-caption-manager__action-bar-title">
							{ isEditorView
								? getEditorHeading()
								: __( 'Subtitle tracks', 'jetpack-videopress-pkg' ) }
						</h3>
						{ isLoadingTrackText && (
							<span className="videopress-caption-manager__status">
								{ __( 'Loading subtitle content…', 'jetpack-videopress-pkg' ) }
							</span>
						) }
					</div>
					<div className="videopress-caption-manager__action-buttons">
						{ isEditorView ? (
							<>
								<Button
									variant="secondary"
									icon={ isRTL() ? chevronRight : chevronLeft }
									onClick={ handleBackToTracks }
									disabled={ isPublishing || isSavingCaptionTrack }
								>
									{ __( 'Back to tracks', 'jetpack-videopress-pkg' ) }
								</Button>
								{ workspaceMode === 'manual' && (
									<>
										{ ! isTextImportOpen && (
											<Button
												variant="secondary"
												onClick={ () => {
													setIsTextImportOpen( true );
													setNotice( null );
												} }
											>
												{ __( 'Paste text', 'jetpack-videopress-pkg' ) }
											</Button>
										) }
										{ ! isUpdatingPublishedTrack && (
											<Button
												variant="secondary"
												onClick={ () => void saveManualCaptionTrack( 'draft' ) }
												isBusy={ isSavingCaptionTrack }
												disabled={ isSavingCaptionTrack || isPublishing || isLoadingTrackText }
											>
												{ __( 'Save draft', 'jetpack-videopress-pkg' ) }
											</Button>
										) }
										<Button
											variant="primary"
											onClick={ publishManualTrack }
											isBusy={ isPublishing }
											disabled={ isSavingCaptionTrack || isPublishing || isLoadingTrackText }
										>
											{ isUpdatingPublishedTrack
												? __( 'Update', 'jetpack-videopress-pkg' )
												: __( 'Publish', 'jetpack-videopress-pkg' ) }
										</Button>
									</>
								) }
							</>
						) : (
							<>
								<Button
									ref={ addTrackButtonRef }
									variant="secondary"
									icon={ plus }
									onClick={ () => void startManualTrack() }
									disabled={ isPublishing || isSavingCaptionTrack }
								>
									{ __( 'Add track', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button
									variant="secondary"
									onClick={ startTextImportTrack }
									disabled={ isPublishing || isSavingCaptionTrack }
								>
									{ __( 'Paste transcript', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button
									variant="secondary"
									icon={ upload }
									onClick={ () => startUploadTrack() }
									disabled={ isPublishing || isSavingCaptionTrack }
								>
									{ __( 'Upload subtitle file', 'jetpack-videopress-pkg' ) }
								</Button>
							</>
						) }
					</div>
				</div>

				{ notice && (
					<Notice status={ notice.status } isDismissible={ false }>
						{ notice.message }
					</Notice>
				) }

				<div
					className={ `videopress-caption-manager__workspace videopress-caption-manager__workspace--${
						isEditorView ? 'editor' : 'tracks'
					}` }
				>
					{ ! isEditorView && (
						<section className="videopress-caption-manager__tracks">
							<TrackList
								rows={ trackRows }
								isLoading={ isLoadingCaptionTracks }
								emptyMessage={ emptyMessage }
								deletingTrackKey={ deletingTrackKey }
								downloadingTrackKey={ downloadingTrackKey }
								isSavingUpload={ isSavingUpload }
								isPublishing={ isPublishing }
								isLoadingTrackText={ isLoadingTrackText }
								onEditManaged={ track => void startManualTrack( track ) }
								onReplaceManaged={ startUploadTrack }
								onDownloadManaged={ track => void downloadTrack( track ) }
								onDeleteManaged={ deleteTrack }
								onEditDraft={ startStoredCaptionTrack }
								onDeleteDraft={ captionTrack => void deleteDraft( captionTrack ) }
							/>
						</section>
					) }

					{ isEditorView && (
						<section className="videopress-caption-manager__editor">
							{ workspaceMode === 'upload' ? (
								<div
									className="videopress-caption-manager__editor-body videopress-caption-manager__editor-body--upload"
									ref={ editorWorkspaceRef }
									tabIndex={ -1 }
								>
									<div
										className="videopress-caption-manager__upload-panel"
										aria-label={ uploadFormTitle }
									>
										{ uploadFormMode === 'replace' && replacingTrack && (
											<p className="videopress-caption-manager__form-note">
												{ sprintf(
													/* translators: %s: subtitle track language being replaced. */
													__( 'Replacing %s', 'jetpack-videopress-pkg' ),
													getLanguageDisplayName( replacingTrack.srcLang )
												) }
											</p>
										) }

										<div className="videopress-caption-manager__form-grid">
											<LanguageControl
												label={ __( 'Language', 'jetpack-videopress-pkg' ) }
												value={ uploadForm.srcLang }
												onChange={ ( tag, displayName ) => {
													setUploadForm( current => ( {
														...current,
														srcLang: tag,
														label: displayName,
													} ) );
													setNotice( null );
												} }
												disabled={ isSavingUpload || uploadFormMode === 'replace' }
											/>
										</div>

										<FormFileUpload
											accept={ ACCEPTED_FILE_TYPES }
											onChange={ ( event: ChangeEvent< HTMLInputElement > ) => {
												const file = event.target.files?.[ 0 ] ?? null;
												updateUploadForm( 'tmpFile', file );
											} }
											render={ ( { openFileDialog } ) => (
												<div className="videopress-caption-manager__file-picker">
													<Button variant="secondary" icon={ upload } onClick={ openFileDialog }>
														{ fileName || __( 'Select subtitle file', 'jetpack-videopress-pkg' ) }
													</Button>
													<p>
														{ sprintf(
															/* translators: %s: accepted subtitle file extensions. */
															__( 'Accepted formats: %s', 'jetpack-videopress-pkg' ),
															SUPPORTED_CAPTION_FORMATS_LABEL
														) }
													</p>
												</div>
											) }
											__next40pxDefaultSize={ true }
										/>

										<div className="videopress-caption-manager__form-actions">
											{ uploadFormMode === 'replace' && (
												<Button
													variant="secondary"
													onClick={ resetUploadForm }
													disabled={ isSavingUpload }
												>
													{ __( 'Cancel replace', 'jetpack-videopress-pkg' ) }
												</Button>
											) }
											<Button
												variant="primary"
												onClick={ saveUploadedTrack }
												isBusy={ isSavingUpload }
												disabled={ isSavingUpload || ! uploadForm.tmpFile }
											>
												{ UPLOAD_FORM_ACTION_LABELS[ uploadFormMode ] }
											</Button>
										</div>
									</div>
									{ previewPanel }
								</div>
							) : (
								/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Captures keyboard shortcuts for the focused subtitle editing workspace. */
								<div
									className="videopress-caption-manager__editor-body videopress-caption-manager__editor-body--manual videopress-caption-manager__manual-panel"
									role="group"
									aria-label={ __( 'Subtitle editing workspace', 'jetpack-videopress-pkg' ) }
									aria-keyshortcuts="Space ArrowLeft ArrowRight C N P"
									aria-describedby="videopress-caption-manager-shortcuts"
									tabIndex={ 0 }
									onKeyDown={ handleManualEditorKeyDown }
									ref={ editorWorkspaceRef }
								>
									<p
										id="videopress-caption-manager-shortcuts"
										className="videopress-caption-manager__visually-hidden"
									>
										{ __(
											'Keyboard shortcuts: Space plays or pauses the preview, the Left and Right arrow keys seek, C adds a subtitle at the playhead, and N and P jump to the next or previous subtitle.',
											'jetpack-videopress-pkg'
										) }
									</p>
									<div
										className="videopress-caption-manager__manual-main"
										onInput={ () => playerRef.current?.pauseWhileTypingNow() }
									>
										<div className="videopress-caption-manager__manual-meta">
											<LanguageControl
												label={ __( 'Language', 'jetpack-videopress-pkg' ) }
												value={ manualTrack.srcLang }
												onChange={ ( tag, displayName ) => {
													setManualTrack( current => ( {
														...current,
														srcLang: tag,
														label: displayName,
													} ) );
													setNotice( null );
												} }
											/>
										</div>

										{ isTextImportOpen ? (
											<div className="videopress-caption-manager__text-import">
												<TextareaControl
													label={ __( 'Subtitle text', 'jetpack-videopress-pkg' ) }
													help={ __(
														'Paste timed captions to keep their timings, or plain text to create evenly spaced cues.',
														'jetpack-videopress-pkg'
													) }
													value={ captionTextInput }
													onChange={ value => {
														setCaptionTextInput( value );
														setNotice( null );
													} }
													rows={ 10 }
													__nextHasNoMarginBottom={ true }
												/>
												<div className="videopress-caption-manager__text-import-actions">
													<Button
														variant="secondary"
														onClick={ () => {
															setCaptionTextInput( '' );
															setIsTextImportOpen( false );
															setNotice( null );
														} }
													>
														{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
													</Button>
													{ editorCues.length > 0 && (
														<Button
															variant="secondary"
															onClick={ () => importCaptionText( 'append' ) }
															disabled={ ! captionTextInput.trim() }
														>
															{ __( 'Append', 'jetpack-videopress-pkg' ) }
														</Button>
													) }
													<Button
														variant="primary"
														onClick={ () => importCaptionText( 'replace' ) }
														disabled={ ! captionTextInput.trim() }
													>
														{ editorCues.length > 0
															? __( 'Replace', 'jetpack-videopress-pkg' )
															: __( 'Create cues', 'jetpack-videopress-pkg' ) }
													</Button>
												</div>
											</div>
										) : (
											<div className="videopress-caption-manager__cue-editor" ref={ cueEditorRef }>
												<BlockEditorProvider
													value={ cueBlocks }
													onInput={ blocks => setCueBlocks( blocks as CaptionCueBlock[] ) }
													onChange={ blocks => setCueBlocks( blocks as CaptionCueBlock[] ) }
													settings={ cueEditorSettings }
												>
													<BlockList />
												</BlockEditorProvider>
												{ ! cueBlocks.length && (
													<div className="videopress-caption-manager__cue-empty">
														<Button variant="secondary" icon={ plus } onClick={ addCue }>
															{ __( 'Add subtitle', 'jetpack-videopress-pkg' ) }
														</Button>
														<Button
															variant="secondary"
															onClick={ () => {
																setIsTextImportOpen( true );
																setNotice( null );
															} }
														>
															{ __( 'Paste text', 'jetpack-videopress-pkg' ) }
														</Button>
													</div>
												) }
											</div>
										) }
									</div>

									{ previewPanel }
								</div>
							) }
						</section>
					) }
				</div>
			</Modal>
		</>
	) : null;
}
