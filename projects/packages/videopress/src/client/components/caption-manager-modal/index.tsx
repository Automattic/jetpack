/**
 * External dependencies
 */
import {
	BlockEditorProvider,
	BlockList,
	BlockTools,
	ObserveTyping,
	WritingFlow,
} from '@wordpress/block-editor';
import { createBlock, parse, serialize } from '@wordpress/blocks';
import {
	Button,
	CheckboxControl,
	FormFileUpload,
	Modal,
	Notice,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { download, help, plus, upload, trash } from '@wordpress/icons';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import {
	CAPTION_FORMAT_MIME_TYPES,
	deleteTrackForGuid,
	fetchTrackContentForGuid,
	fetchTrackListForGuid,
	hasTrackId,
	normalizeVideoTextTrackResponse,
	SUPPORTED_CAPTION_FORMATS,
	TRACK_KIND_OPTIONS,
	updateTrackContentForGuid,
	updateTrackForGuid,
	uploadTrackForGuid,
} from '../../lib/video-tracks';
import {
	CAPTION_TRACK_META,
	fetchCaptionTracks,
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
	getManualLanguageTagFromTrackKey,
	isGeneratedLanguageKey,
} from '../../lib/video-tracks/language';
import { registerCaptionCueBlock } from './caption-cue-block';
import './style.scss';
/**
 * Types
 */
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

const DEFAULT_KIND: trackKindOptionProps = 'captions';

const KIND_LABELS: Record< trackKindOptionProps, string > = {
	subtitles: __( 'Subtitles', 'jetpack-videopress-pkg' ),
	captions: __( 'Captions', 'jetpack-videopress-pkg' ),
	descriptions: __( 'Descriptions', 'jetpack-videopress-pkg' ),
	chapters: __( 'Chapters', 'jetpack-videopress-pkg' ),
	metadata: __( 'Metadata', 'jetpack-videopress-pkg' ),
};

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
	add: __( 'Upload caption track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace caption track', 'jetpack-videopress-pkg' ),
};

const UPLOAD_FORM_ACTION_LABELS: Record< UploadFormMode, string > = {
	add: __( 'Upload track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace track', 'jetpack-videopress-pkg' ),
};

const CAPTION_TRACK_NOTICE_LABELS: Record< 'draft' | 'publish', string > = {
	draft: __( 'Caption track draft saved.', 'jetpack-videopress-pkg' ),
	publish: __( 'Caption track published.', 'jetpack-videopress-pkg' ),
};

const PREVIEW_RESUME_DELAY_MS = 1200;
const PREVIEW_SEEK_STEP_SECONDS = 5;

const emptyUploadForm = (): UploadFormTrack => ( {
	kind: DEFAULT_KIND,
	srcLang: '',
	label: '',
	tmpFile: null,
} );

const emptyManualTrack = (): ManualTrack => ( {
	kind: DEFAULT_KIND,
	srcLang: '',
	label: '',
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

const isListableCaptionTrack = ( captionTrack: SavedCaptionTrack ) =>
	TRACK_KIND_OPTIONS.includes( captionTrack.meta[ CAPTION_TRACK_META.kind ] ) &&
	!! captionTrack.meta[ CAPTION_TRACK_META.srcLang ];

const getAcceptedFileTypes = ( supportedFormats: string[] ) =>
	supportedFormats
		.flatMap( extension => {
			const normalizedExtension = extension.startsWith( '.' ) ? extension : `.${ extension }`;
			const mimeType = CAPTION_FORMAT_MIME_TYPES[ normalizedExtension ];
			return mimeType ? [ normalizedExtension, mimeType ] : [ normalizedExtension ];
		} )
		.join( ',' );

const isAcceptedTrackFile = ( file: File | null, supportedFormats: string[] ): boolean => {
	if ( ! file ) {
		return false;
	}

	const lowerName = file.name.toLowerCase();
	return supportedFormats.some( extension =>
		lowerName.endsWith( extension.startsWith( '.' ) ? extension : `.${ extension }` )
	);
};

const hasTrackApiError = ( response: unknown ): response is TrackApiError =>
	typeof response === 'object' &&
	response !== null &&
	( ( 'error' in response && !! ( response as TrackApiError ).error ) ||
		( 'code' in response && !! ( response as TrackApiError ).code ) );

const getTrackApiErrorMessage = ( response: unknown, fallback: string ): string => {
	if ( typeof response === 'object' && response !== null ) {
		const { code, error: errorCode, message } = response as TrackApiError;
		return message || errorCode || code || fallback;
	}

	return fallback;
};

const isAutoGeneratedTrack = ( track: VideoTextTrack ) =>
	Boolean( track.isAutoGenerated ) ||
	track.source === 'asr' ||
	isGeneratedLanguageKey( track.srcLang );

const isTrackReady = ( track: VideoTextTrack ) =>
	! track.status || track.status === 'ready' || track.status === 'serving';

const getTrackSourceLabel = ( track: VideoTextTrack ) => {
	if ( isAutoGeneratedTrack( track ) ) {
		return __( 'Auto-generated', 'jetpack-videopress-pkg' );
	}

	if ( track.source === 'manual' ) {
		return __( 'Manual', 'jetpack-videopress-pkg' );
	}

	return '';
};

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

const getLocalCaptionTrackStatusLabel = ( captionTrack: SavedCaptionTrack ) =>
	captionTrack.status === 'publish'
		? __( 'Published', 'jetpack-videopress-pkg' )
		: __( 'Draft', 'jetpack-videopress-pkg' );

const getDownloadFileName = ( track: VideoTextTrack ) =>
	`${ track.kind }-${ canonicalizeLanguageTag( track.srcLang ) ?? track.srcLang }.vtt`;

const getCueValidationNoticeMessage = ( error: CaptionCueValidationError ) => {
	switch ( error.code ) {
		case 'missing_text':
			return sprintf(
				/* translators: %d: caption cue number. */
				__( 'Caption %d needs text before publishing.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'missing_time':
			return sprintf(
				/* translators: %d: caption cue number. */
				__( 'Caption %d needs start and end times before publishing.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'invalid_time':
			return sprintf(
				/* translators: %d: caption cue number. */
				__( 'Caption %d has an invalid timestamp.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'end_before_start':
			return sprintf(
				/* translators: %d: caption cue number. */
				__( 'Caption %d must end after it starts.', 'jetpack-videopress-pkg' ),
				error.cueNumber
			);
		case 'overlap':
			return sprintf(
				/* translators: 1: caption cue number, 2: overlapping caption cue number. */
				__( 'Caption %1$d overlaps caption %2$d.', 'jetpack-videopress-pkg' ),
				error.cueNumber,
				error.previousCueNumber
			);
		default:
			return __( 'Fix caption timing before publishing.', 'jetpack-videopress-pkg' );
	}
};

const createCueBlock = ( cue?: Partial< { startTime: string; endTime: string; text: string } > ) =>
	createBlock( CAPTION_CUE_BLOCK_NAME, {
		startTime: cue?.startTime ?? '00:00:00.000',
		endTime: cue?.endTime ?? '00:00:02.000',
		text: cue?.text ?? '',
	} );

const getCueBlockAttributes = ( block: CaptionCueBlock ) => ( {
	startTime: String( block.attributes?.startTime ?? '' ),
	endTime: String( block.attributes?.endTime ?? '' ),
	text: String( block.attributes?.text ?? '' ),
} );

const duplicateCueBlock = ( block: CaptionCueBlock ) => {
	const attributes = getCueBlockAttributes( block );
	const start = parseTimestampToSeconds( attributes.startTime );
	const end = parseTimestampToSeconds( attributes.endTime );

	if ( start !== null && end !== null && end > start ) {
		return createCueBlock( {
			...attributes,
			startTime: formatSecondsAsTimestamp( end ),
			endTime: formatSecondsAsTimestamp( end + ( end - start ) ),
		} );
	}

	return createCueBlock( attributes );
};

const createEmptyCueBlocks = () => [ createCueBlock() ];

const createCueBlocksFromTrackText = ( trackText: string ) => {
	const cues = parseCaptionTextTrack( trackText );
	return cues.length ? cues.map( createCueBlock ) : createEmptyCueBlocks();
};

const createCueBlocksFromCaptionTrack = ( captionTrack: SavedCaptionTrack ) => {
	const blocks = parse( captionTrack.content ) as CaptionCueBlock[];
	const cueBlocks = blocks.filter( block => block.name === CAPTION_CUE_BLOCK_NAME );
	return cueBlocks.length ? cueBlocks : createEmptyCueBlocks();
};

const getManualTrackFromCaptionTrack = ( captionTrack: SavedCaptionTrack ): ManualTrack => ( {
	kind: captionTrack.meta[ CAPTION_TRACK_META.kind ],
	srcLang: captionTrack.meta[ CAPTION_TRACK_META.srcLang ],
	label: captionTrack.meta[ CAPTION_TRACK_META.label ] || captionTrack.title,
} );

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
	tracks,
	onClose,
	onTracksChange,
}: CaptionManagerModalProps ): ReactElement | null {
	const videoRef = useRef< HTMLVideoElement >( null );
	const cueEditorRef = useRef< HTMLDivElement >( null );
	const shouldScrollCueEditorToEndRef = useRef( false );
	const previewResumeTimerRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const shouldResumePreviewAfterTypingRef = useRef( false );
	const [ modalView, setModalView ] = useState< ModalView >( 'tracks' );
	const [ workspaceMode, setWorkspaceMode ] = useState< WorkspaceMode >( 'manual' );
	const [ uploadForm, setUploadForm ] = useState< UploadFormTrack >( emptyUploadForm );
	const [ uploadFormMode, setUploadFormMode ] = useState< UploadFormMode >( 'add' );
	const [ replacingTrack, setReplacingTrack ] = useState< VideoTextTrack | null >( null );
	const [ manualTrack, setManualTrack ] = useState< ManualTrack >( emptyManualTrack );
	const [ manualSourceTrack, setManualSourceTrack ] = useState< VideoTextTrack | null >( null );
	const [ managedTracks, setManagedTracks ] = useState< VideoTextTrack[] >( tracks );
	const [ supportedCaptionFormats, setSupportedCaptionFormats ] =
		useState< string[] >( SUPPORTED_CAPTION_FORMATS );
	const [ cueBlocks, setCueBlocks ] = useState< CaptionCueBlock[] >( createEmptyCueBlocks );
	const [ captionTracks, setCaptionTracks ] = useState< SavedCaptionTrack[] >( [] );
	const [ captionTrackId, setCaptionTrackId ] = useState< number | undefined >();
	const [ notice, setNotice ] = useState< NoticeState >( null );
	const [ isSavingUpload, setIsSavingUpload ] = useState( false );
	const [ isSavingCaptionTrack, setIsSavingCaptionTrack ] = useState( false );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ isLoadingCaptionTracks, setIsLoadingCaptionTracks ] = useState( false );
	const [ isLoadingTrackText, setIsLoadingTrackText ] = useState( false );
	const [ deletingTrackKey, setDeletingTrackKey ] = useState< string | null >( null );
	const [ downloadingTrackKey, setDownloadingTrackKey ] = useState< string | null >( null );
	const [ currentTime, setCurrentTime ] = useState( 0 );
	const [ pauseWhileTyping, setPauseWhileTyping ] = useState( true );
	const [ shortcutsOpen, setShortcutsOpen ] = useState( false );
	const [ isTextImportOpen, setIsTextImportOpen ] = useState( false );
	const [ captionTextInput, setCaptionTextInput ] = useState( '' );

	const clearPreviewResumeTimer = useCallback( () => {
		if ( previewResumeTimerRef.current ) {
			clearTimeout( previewResumeTimerRef.current );
			previewResumeTimerRef.current = null;
		}
	}, [] );

	const resetEditorToTrackList = useCallback( () => {
		setWorkspaceMode( 'manual' );
		setModalView( 'tracks' );
		setUploadForm( emptyUploadForm() );
		setUploadFormMode( 'add' );
		setReplacingTrack( null );
		setManualTrack( emptyManualTrack() );
		setManualSourceTrack( null );
		setCueBlocks( createEmptyCueBlocks() );
		setCaptionTrackId( undefined );
		setIsLoadingTrackText( false );
		setIsTextImportOpen( false );
		setCaptionTextInput( '' );
		setNotice( null );
	}, [] );

	useEffect( () => clearPreviewResumeTimer, [ clearPreviewResumeTimer ] );

	useEffect( () => {
		if ( pauseWhileTyping ) {
			return;
		}

		clearPreviewResumeTimer();
		if ( shouldResumePreviewAfterTypingRef.current && videoRef.current?.paused ) {
			videoRef.current.play().catch( error => debug( 'resume preview after typing error', error ) );
		}
		shouldResumePreviewAfterTypingRef.current = false;
	}, [ clearPreviewResumeTimer, pauseWhileTyping ] );

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

	useEffect( () => {
		if ( ! isOpen || ! guid ) {
			return;
		}

		let isMounted = true;
		fetchTrackListForGuid( guid )
			.then( ( { tracks: loadedTracks, supportedFormats } ) => {
				if ( isMounted ) {
					setManagedTracks( loadedTracks );
					setSupportedCaptionFormats( supportedFormats );
				}
			} )
			.catch( error => {
				debug( 'fetch caption tracks error', error );
			} );

		return () => {
			isMounted = false;
		};
	}, [ guid, isOpen ] );

	useEffect( () => {
		if ( ! isOpen || ! guid ) {
			return;
		}

		let isMounted = true;
		setIsLoadingCaptionTracks( true );
		fetchCaptionTracks( guid )
			.then( loadedCaptionTracks => {
				if ( isMounted ) {
					setCaptionTracks( loadedCaptionTracks );
				}
			} )
			.catch( error => {
				debug( 'fetch caption tracks error', error );
				if ( isMounted ) {
					setCaptionTracks( [] );
				}
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsLoadingCaptionTracks( false );
				}
			} );

		return () => {
			isMounted = false;
		};
	}, [ guid, isOpen ] );

	const kindOptions = useMemo(
		() =>
			TRACK_KIND_OPTIONS.map( kind => ( {
				label: KIND_LABELS[ kind ],
				value: kind,
			} ) ),
		[]
	);

	const acceptedFileTypes = useMemo(
		() => getAcceptedFileTypes( supportedCaptionFormats ),
		[ supportedCaptionFormats ]
	);

	const supportedCaptionFormatsLabel = useMemo(
		() => supportedCaptionFormats.join( ', ' ),
		[ supportedCaptionFormats ]
	);
	const visibleCaptionTracks = useMemo(
		() => captionTracks.filter( isListableCaptionTrack ),
		[ captionTracks ]
	);

	const editorCues = useMemo( () => captionBlocksToCues( cueBlocks ), [ cueBlocks ] );

	const activeCue = useMemo( () => {
		return editorCues.find( cue => {
			const startTime = parseTimestampToSeconds( cue.startTime );
			const endTime = parseTimestampToSeconds( cue.endTime );
			return (
				startTime !== null && endTime !== null && currentTime >= startTime && currentTime <= endTime
			);
		} );
	}, [ editorCues, currentTime ] );

	const cueStartTimes = useMemo(
		() =>
			editorCues
				.map( cue => parseTimestampToSeconds( cue.startTime ) )
				.filter( ( startTime ): startTime is number => startTime !== null )
				.sort( ( a, b ) => a - b ),
		[ editorCues ]
	);

	const updateUploadForm = useCallback(
		( key: keyof UploadFormTrack, value: string | File | null ) => {
			setUploadForm( current => ( { ...current, [ key ]: value } ) );
			setNotice( null );
		},
		[]
	);

	const updateManualTrack = useCallback( ( key: keyof ManualTrack, value: string ) => {
		setManualTrack( current => ( { ...current, [ key ]: value } ) );
		setNotice( null );
	}, [] );

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

	const returnToTrackList = useCallback( () => {
		clearPreviewResumeTimer();
		shouldResumePreviewAfterTypingRef.current = false;
		resetEditorToTrackList();
	}, [ clearPreviewResumeTimer, resetEditorToTrackList ] );

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
			return captionTracks.find(
				captionTrack => getStoredCaptionTrackKey( captionTrack ) === manualKey
			);
		},
		[ captionTracks ]
	);

	const startStoredCaptionTrack = useCallback(
		( captionTrack: SavedCaptionTrack ) => {
			setModalView( 'editor' );
			setWorkspaceMode( 'manual' );
			setManualTrack( getManualTrackFromCaptionTrack( captionTrack ) );
			setManualSourceTrack( getSourceTrackFromCaptionTrack( captionTrack, managedTracks ) );
			setCaptionTrackId( captionTrack.id );
			setCueBlocks( createCueBlocksFromCaptionTrack( captionTrack ) );
			setIsLoadingTrackText( false );
			setIsTextImportOpen( false );
			setCaptionTextInput( '' );
			setNotice( null );
		},
		[ managedTracks ]
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
			const nextManualTrack: ManualTrack = sourceTrack
				? {
						kind: sourceTrack.kind,
						srcLang: getManualLanguageTagFromTrackKey( sourceTrack.srcLang ),
						label: sourceTrack.label || formatLanguageTagForDisplay( sourceTrack.srcLang ),
				  }
				: emptyManualTrack();
			const matchingCaptionTrack = findCaptionTrackForManualTrack( nextManualTrack, sourceTrack );

			setModalView( 'editor' );
			setWorkspaceMode( 'manual' );
			setManualTrack( nextManualTrack );
			setManualSourceTrack( sourceTrack );
			setCaptionTrackId( matchingCaptionTrack?.id );
			setIsTextImportOpen( false );
			setCaptionTextInput( '' );
			setIsLoadingTrackText( false );
			setNotice( null );

			if ( matchingCaptionTrack ) {
				setCueBlocks( createCueBlocksFromCaptionTrack( matchingCaptionTrack ) );
				return;
			}

			if ( ! sourceTrack ) {
				setCueBlocks( createEmptyCueBlocks() );
				return;
			}

			setCueBlocks( createEmptyCueBlocks() );
			setIsLoadingTrackText( true );
			try {
				setCueBlocks( await loadTrackText( sourceTrack ) );
			} catch ( error ) {
				debug( 'fetch caption track text error', error );
				setNotice( {
					status: 'error',
					message: __(
						'Unable to load caption content. You can try again from the track list or start from an empty caption track.',
						'jetpack-videopress-pkg'
					),
				} );
			} finally {
				setIsLoadingTrackText( false );
			}
		},
		[ findCaptionTrackForManualTrack, loadTrackText ]
	);

	const startUploadTrack = useCallback( ( sourceTrack: VideoTextTrack | null = null ) => {
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
				: emptyUploadForm()
		);
		setNotice( null );
	}, [] );

	const startTextImportTrack = useCallback( () => {
		clearPreviewResumeTimer();
		shouldResumePreviewAfterTypingRef.current = false;
		setModalView( 'editor' );
		setWorkspaceMode( 'manual' );
		setManualTrack( emptyManualTrack() );
		setManualSourceTrack( null );
		setCaptionTrackId( undefined );
		setCueBlocks( createEmptyCueBlocks() );
		setIsLoadingTrackText( false );
		setIsTextImportOpen( true );
		setCaptionTextInput( '' );
		setNotice( null );
	}, [ clearPreviewResumeTimer ] );

	const deleteTrack = useCallback(
		async ( track: VideoTextTrack ) => {
			const language = formatLanguageTagForDisplay( track.srcLang );
			const shouldDeleteTrack =
				// eslint-disable-next-line no-alert -- Needs a blocking confirmation before deleting a caption track.
				window.confirm(
					sprintf(
						/* translators: %s: caption track language or label. */
						__( 'Delete the %s caption track? This cannot be undone.', 'jetpack-videopress-pkg' ),
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
				window.URL.revokeObjectURL( url );
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
				message: __( 'Select a caption file before saving.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		if ( ! isAcceptedTrackFile( uploadForm.tmpFile, supportedCaptionFormats ) ) {
			setNotice( {
				status: 'error',
				message: sprintf(
					/* translators: %s: comma-separated list of supported caption file extensions. */
					__( 'Supported caption formats: %s.', 'jetpack-videopress-pkg' ),
					supportedCaptionFormatsLabel
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
				message: __( 'Enter a valid BCP-47 language tag.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		const existingTrackIndex = managedTracks.findIndex(
			track =>
				track.kind === uploadForm.kind &&
				track.srcLang === srcLang &&
				! isAutoGeneratedTrack( track )
		);

		if ( uploadFormMode === 'add' && existingTrackIndex > -1 ) {
			setNotice( {
				status: 'error',
				message: __(
					'A track already exists for that kind and language. Use Replace file on the existing track to upload a new file.',
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
			const shouldUpdateExistingTrack =
				uploadFormMode === 'replace' && hasTrackId( replacingTrack?.id );
			const trackUpdatePayload = {
				...replacingTrack,
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
			};
			let src;

			if ( shouldUpdateExistingTrack ) {
				await updateTrackForGuid( trackUpdatePayload, guid );
				src = await updateTrackContentForGuid( trackUpdatePayload, guid, trackToUpload.tmpFile );
			} else {
				src = await uploadTrackForGuid( trackToUpload, guid );
			}

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

			const uploadedTrack = normalizeVideoTextTrackResponse( src, trackUpdatePayload );

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
			returnToTrackList();
			setNotice( {
				status: 'success',
				message: __( 'Caption track uploaded.', 'jetpack-videopress-pkg' ),
			} );
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
		returnToTrackList,
		uploadForm,
		uploadFormMode,
		supportedCaptionFormats,
		supportedCaptionFormatsLabel,
	] );

	const buildCaptionTrackPayload = useCallback(
		( status: 'draft' | 'publish' ) => {
			const canonicalSrcLang = canonicalizeLanguageTag( manualTrack.srcLang );
			if ( ! canonicalSrcLang ) {
				setNotice( {
					status: 'error',
					message: __( 'Enter a valid BCP-47 language tag.', 'jetpack-videopress-pkg' ),
				} );
				return null;
			}

			const cueContent = serialize( cueBlocks );
			return {
				id: captionTrackId,
				title:
					manualTrack.label.trim() ||
					sprintf(
						/* translators: %s: caption track language tag. */
						__( 'Caption track %s', 'jetpack-videopress-pkg' ),
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
		[ cueBlocks, captionTrackId, guid, manualSourceTrack, manualTrack ]
	);

	const saveManualCaptionTrack = useCallback(
		async ( status: 'draft' | 'publish' = 'draft' ) => {
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
				setNotice( {
					status: 'success',
					message: CAPTION_TRACK_NOTICE_LABELS[ status ],
				} );
				return savedCaptionTrack;
			} catch ( error ) {
				debug( 'save caption track error', error );
				setNotice( {
					status: 'error',
					message: __( 'Unable to save caption track.', 'jetpack-videopress-pkg' ),
				} );
				return null;
			} finally {
				setIsSavingCaptionTrack( false );
			}
		},
		[ buildCaptionTrackPayload ]
	);

	const publishManualTrack = useCallback( async () => {
		const canonicalSrcLang = canonicalizeLanguageTag( manualTrack.srcLang );
		if ( ! canonicalSrcLang ) {
			setNotice( {
				status: 'error',
				message: __( 'Enter a valid BCP-47 language tag.', 'jetpack-videopress-pkg' ),
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
				message: __( 'Add at least one caption cue before publishing.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		setIsPublishing( true );
		setNotice( null );

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
					track.kind === trackToUpload.kind &&
					track.srcLang === trackToUpload.srcLang &&
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
			const shouldUpdateExistingTrack = hasTrackId( trackToUpdate?.id );
			const trackUpdatePayload = {
				...trackToUpdate,
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
			};
			let src;

			if ( shouldUpdateExistingTrack ) {
				const metadataResponse = await updateTrackForGuid( trackUpdatePayload, guid );

				if ( hasTrackApiError( metadataResponse ) ) {
					src = metadataResponse;
				} else {
					src = await updateTrackContentForGuid( trackUpdatePayload, guid, vtt );
				}
			} else {
				src = await uploadTrackForGuid( trackToUpload, guid );
			}

			if ( hasTrackApiError( src ) ) {
				setNotice( {
					status: 'error',
					message: sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							src,
							__( 'Unable to publish captions.', 'jetpack-videopress-pkg' )
						)
					),
				} );
				return;
			}

			const savedCaptionTrack = await saveManualCaptionTrack( 'publish' );
			if ( ! savedCaptionTrack ) {
				return;
			}

			const uploadedTrack = normalizeVideoTextTrackResponse( src, trackUpdatePayload );
			const updatedIndex = sourceTrackIndex > -1 ? sourceTrackIndex : manualTrackIndex;
			const updatedTracks = [ ...managedTracks ];
			if ( updatedIndex > -1 ) {
				updatedTracks[ updatedIndex ] = uploadedTrack;
			} else {
				updatedTracks.push( uploadedTrack );
			}

			applyTracksChange( updatedTracks );
			returnToTrackList();
			setNotice( {
				status: 'success',
				message: __( 'Captions published.', 'jetpack-videopress-pkg' ),
			} );
		} catch ( error ) {
			debug( 'publish manual caption track error', error );
			setNotice( {
				status: 'error',
				message: __( 'Unable to publish captions.', 'jetpack-videopress-pkg' ),
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
		returnToTrackList,
		saveManualCaptionTrack,
	] );

	const addCue = useCallback( () => {
		shouldScrollCueEditorToEndRef.current = true;
		setCueBlocks( current => [
			...current,
			createCueBlock( {
				startTime: getDefaultCueStartTime( currentTime ),
				endTime: getDefaultCueEndTime( currentTime ),
			} ),
		] );
	}, [ currentTime ] );

	const importCaptionText = useCallback( () => {
		const cues = parseCaptionTextInput( captionTextInput );
		if ( ! cues.length ) {
			setNotice( {
				status: 'error',
				message: __( 'Paste caption text before importing.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		shouldScrollCueEditorToEndRef.current = false;
		setCueBlocks( cues.map( createCueBlock ) );
		setCaptionTextInput( '' );
		setIsTextImportOpen( false );
		setNotice( {
			status: 'success',
			message: __( 'Caption text imported.', 'jetpack-videopress-pkg' ),
		} );
	}, [ captionTextInput ] );

	const moveCue = useCallback( ( cueIndex: number, direction: 'up' | 'down' ) => {
		setCueBlocks( current => {
			const nextIndex = direction === 'up' ? cueIndex - 1 : cueIndex + 1;
			if ( nextIndex < 0 || nextIndex >= current.length ) {
				return current;
			}

			const nextCueBlocks = [ ...current ];
			[ nextCueBlocks[ cueIndex ], nextCueBlocks[ nextIndex ] ] = [
				nextCueBlocks[ nextIndex ],
				nextCueBlocks[ cueIndex ],
			];
			return nextCueBlocks;
		} );
		setNotice( null );
	}, [] );

	const duplicateCue = useCallback( ( cueIndex: number ) => {
		shouldScrollCueEditorToEndRef.current = true;
		setCueBlocks( current => {
			const sourceBlock = current[ cueIndex ];
			if ( ! sourceBlock ) {
				return current;
			}

			return [
				...current.slice( 0, cueIndex + 1 ),
				duplicateCueBlock( sourceBlock ),
				...current.slice( cueIndex + 1 ),
			];
		} );
		setNotice( null );
	}, [] );

	const seekPreviewTo = useCallback( ( nextTime: number ) => {
		const safeTime = Math.max( 0, nextTime );
		if ( videoRef.current ) {
			videoRef.current.currentTime = safeTime;
		}
		setCurrentTime( safeTime );
	}, [] );

	const seekPreviewBy = useCallback(
		( seconds: number ) => {
			const baseTime = videoRef.current?.currentTime ?? currentTime;
			seekPreviewTo( baseTime + seconds );
		},
		[ currentTime, seekPreviewTo ]
	);

	const togglePreviewPlayback = useCallback( () => {
		const video = videoRef.current;
		if ( ! video ) {
			return;
		}

		if ( video.paused ) {
			video.play().catch( error => debug( 'preview keyboard play error', error ) );
			return;
		}

		video.pause();
	}, [] );

	const seekToAdjacentCue = useCallback(
		( direction: 'next' | 'previous' ) => {
			if ( ! cueStartTimes.length ) {
				return;
			}

			const baseTime = videoRef.current?.currentTime ?? currentTime;
			const nextTime =
				direction === 'next'
					? cueStartTimes.find( startTime => startTime > baseTime + 0.01 )
					: [ ...cueStartTimes ].reverse().find( startTime => startTime < baseTime - 0.01 );

			if ( nextTime !== undefined ) {
				seekPreviewTo( nextTime );
			}
		},
		[ cueStartTimes, currentTime, seekPreviewTo ]
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
					togglePreviewPlayback();
					break;
				case 'arrowleft':
					event.preventDefault();
					seekPreviewBy( -PREVIEW_SEEK_STEP_SECONDS );
					break;
				case 'arrowright':
					event.preventDefault();
					seekPreviewBy( PREVIEW_SEEK_STEP_SECONDS );
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
		[ addCue, seekPreviewBy, seekToAdjacentCue, togglePreviewPlayback ]
	);

	const schedulePreviewResume = useCallback( () => {
		clearPreviewResumeTimer();

		previewResumeTimerRef.current = setTimeout( () => {
			previewResumeTimerRef.current = null;

			if ( ! shouldResumePreviewAfterTypingRef.current ) {
				return;
			}

			shouldResumePreviewAfterTypingRef.current = false;
			const video = videoRef.current;
			if ( video?.paused ) {
				video.play().catch( error => debug( 'resume preview after typing error', error ) );
			}
		}, PREVIEW_RESUME_DELAY_MS );
	}, [ clearPreviewResumeTimer ] );

	const pausePreviewWhileTyping = useCallback( () => {
		if ( ! pauseWhileTyping || ! videoRef.current ) {
			return;
		}

		if ( ! videoRef.current.paused ) {
			shouldResumePreviewAfterTypingRef.current = true;
			videoRef.current.pause();
		}

		if ( shouldResumePreviewAfterTypingRef.current ) {
			schedulePreviewResume();
		}
	}, [ pauseWhileTyping, schedulePreviewResume ] );

	const uploadFormTitle = UPLOAD_FORM_TITLE_LABELS[ uploadFormMode ];
	const fileName = uploadForm.tmpFile?.name;
	const emptyMessage = __(
		'No caption tracks have been added to this video yet.',
		'jetpack-videopress-pkg'
	);
	const isEditorView = modalView === 'editor';
	const manualLanguage = canonicalizeLanguageTag( manualTrack.srcLang ) ?? manualTrack.srcLang;
	const modalHeaderTitle = manualLanguage
		? sprintf(
				/* translators: %s: current caption language tag. */
				__( 'Manage captions: %s', 'jetpack-videopress-pkg' ),
				manualLanguage
		  )
		: __( 'Manage captions', 'jetpack-videopress-pkg' );

	return isOpen ? (
		<>
			<Modal
				title={ modalHeaderTitle }
				onRequestClose={ onClose }
				className="videopress-caption-manager"
			>
				<div className="videopress-caption-manager__header">
					<div>
						<h2>{ title || __( 'VideoPress video', 'jetpack-videopress-pkg' ) }</h2>
						{ isLoadingCaptionTracks && (
							<p>{ __( 'Loading caption tracks…', 'jetpack-videopress-pkg' ) }</p>
						) }
						{ isLoadingTrackText && (
							<p>{ __( 'Loading caption content…', 'jetpack-videopress-pkg' ) }</p>
						) }
					</div>
					<div className="videopress-caption-manager__header-actions">
						{ isEditorView && (
							<Button variant="secondary" onClick={ returnToTrackList }>
								{ __( 'Back to tracks', 'jetpack-videopress-pkg' ) }
							</Button>
						) }
						<Button variant="secondary" icon={ help } onClick={ () => setShortcutsOpen( true ) }>
							{ __( 'Keyboard shortcuts', 'jetpack-videopress-pkg' ) }
						</Button>
						{ isEditorView && workspaceMode === 'manual' && (
							<>
								<Button
									variant="secondary"
									onClick={ () => void saveManualCaptionTrack( 'draft' ) }
									isBusy={ isSavingCaptionTrack }
									disabled={ isSavingCaptionTrack || isPublishing || isLoadingTrackText }
								>
									{ __( 'Save Draft', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ publishManualTrack }
									isBusy={ isPublishing }
									disabled={ isSavingCaptionTrack || isPublishing || isLoadingTrackText }
								>
									{ __( 'Publish', 'jetpack-videopress-pkg' ) }
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
							<div className="videopress-caption-manager__tracks-header">
								<h3>{ __( 'Caption tracks', 'jetpack-videopress-pkg' ) }</h3>
								<div className="videopress-caption-manager__tracks-header-actions">
									<Button
										variant="secondary"
										icon={ plus }
										onClick={ () => void startManualTrack() }
									>
										{ __( 'Add track', 'jetpack-videopress-pkg' ) }
									</Button>
									<Button variant="secondary" onClick={ startTextImportTrack }>
										{ __( 'Paste transcript', 'jetpack-videopress-pkg' ) }
									</Button>
									<Button variant="secondary" icon={ upload } onClick={ () => startUploadTrack() }>
										{ __( 'Upload caption file', 'jetpack-videopress-pkg' ) }
									</Button>
								</div>
							</div>

							{ managedTracks.length ? (
								<div className="videopress-caption-manager__track-list">
									{ managedTracks.map( track => {
										const key = getTrackKey( track );
										const language = formatLanguageTagForDisplay( track.srcLang );
										const isDeleting = deletingTrackKey === key;
										const isDownloading = downloadingTrackKey === key;
										const sourceLabel = getTrackSourceLabel( track );
										const statusLabel = getTrackStatusLabel( track );
										const matchingCaptionTrack = findCaptionTrackForManualTrack(
											{
												kind: track.kind,
												srcLang: getManualLanguageTagFromTrackKey( track.srcLang ),
												label: track.label,
											},
											track
										);
										const localStatusLabel = matchingCaptionTrack
											? getLocalCaptionTrackStatusLabel( matchingCaptionTrack )
											: '';
										const trackLocalStateLabel = track.isDraft
											? __( 'Draft', 'jetpack-videopress-pkg' )
											: localStatusLabel;
										const metaLabels = [
											KIND_LABELS[ track.kind ],
											language,
											sourceLabel,
											statusLabel,
											trackLocalStateLabel,
										].filter( Boolean );
										const isGenerated = isAutoGeneratedTrack( track );
										const isReady = isTrackReady( track );

										return (
											<div className="videopress-caption-manager__track" key={ key }>
												<div className="videopress-caption-manager__track-meta">
													<strong>{ track.label || language }</strong>
													<span>{ metaLabels.join( ' · ' ) }</span>
												</div>
												<div className="videopress-caption-manager__track-actions">
													<Button
														variant="secondary"
														onClick={ () => void startManualTrack( track ) }
														disabled={
															isSavingUpload || isPublishing || !! deletingTrackKey || ! isReady
														}
													>
														{ __( 'Edit manually', 'jetpack-videopress-pkg' ) }
													</Button>
													<Button
														variant="secondary"
														onClick={ () => startUploadTrack( track ) }
														disabled={
															isSavingUpload ||
															isPublishing ||
															!! deletingTrackKey ||
															! isReady ||
															isGenerated
														}
													>
														{ __( 'Replace file', 'jetpack-videopress-pkg' ) }
													</Button>
													<Button
														variant="secondary"
														icon={ download }
														isBusy={ isDownloading }
														onClick={ () => void downloadTrack( track ) }
														disabled={
															isSavingUpload ||
															isPublishing ||
															isDownloading ||
															!! deletingTrackKey ||
															! isReady
														}
													>
														{ __( 'Download', 'jetpack-videopress-pkg' ) }
													</Button>
													<Button
														variant="link"
														icon={ trash }
														isDestructive
														isBusy={ isDeleting }
														disabled={
															isSavingUpload || isDeleting || isDownloading || isPublishing
														}
														onClick={ () => deleteTrack( track ) }
													>
														{ __( 'Delete', 'jetpack-videopress-pkg' ) }
													</Button>
												</div>
											</div>
										);
									} ) }
								</div>
							) : null }

							{ visibleCaptionTracks.length ? (
								<div className="videopress-caption-manager__local-tracks">
									<h4>{ __( 'Local caption tracks', 'jetpack-videopress-pkg' ) }</h4>
									<div className="videopress-caption-manager__track-list">
										{ visibleCaptionTracks.map( captionTrack => {
											const localTrack = getManualTrackFromCaptionTrack( captionTrack );
											const language = formatLanguageTagForDisplay( localTrack.srcLang );
											const trackLabel = localTrack.label || language;
											const metaLabels = [
												KIND_LABELS[ localTrack.kind ],
												language,
												getLocalCaptionTrackStatusLabel( captionTrack ),
											].filter( Boolean );

											return (
												<div
													className="videopress-caption-manager__track"
													key={ `caption-track-${ captionTrack.id }-${ getStoredCaptionTrackKey(
														captionTrack
													) }` }
												>
													<div className="videopress-caption-manager__track-meta">
														<strong>{ trackLabel }</strong>
														<span>{ metaLabels.join( ' · ' ) }</span>
													</div>
													<div className="videopress-caption-manager__track-actions">
														<Button
															variant="secondary"
															onClick={ () => startStoredCaptionTrack( captionTrack ) }
															disabled={
																isSavingUpload ||
																isPublishing ||
																isLoadingTrackText ||
																!! deletingTrackKey
															}
														>
															{ __( 'Edit saved track', 'jetpack-videopress-pkg' ) }
														</Button>
													</div>
												</div>
											);
										} ) }
									</div>
								</div>
							) : null }

							{ ! managedTracks.length && ! visibleCaptionTracks.length ? (
								<div className="videopress-caption-manager__empty">{ emptyMessage }</div>
							) : null }
						</section>
					) }

					{ isEditorView && (
						<section className="videopress-caption-manager__editor">
							<div className="videopress-caption-manager__mode-tabs" role="tablist">
								<Button
									variant={ workspaceMode === 'manual' ? 'primary' : 'secondary' }
									onClick={ () => void startManualTrack( manualSourceTrack ) }
								>
									{ __( 'Create manually', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button
									variant={ workspaceMode === 'upload' ? 'primary' : 'secondary' }
									onClick={ () => startUploadTrack( replacingTrack ) }
								>
									{ __( 'Upload file', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>

							{ workspaceMode === 'upload' ? (
								<div
									className="videopress-caption-manager__upload-panel"
									aria-label={ uploadFormTitle }
								>
									<div className="videopress-caption-manager__form-header">
										<h3>{ uploadFormTitle }</h3>
										{ uploadFormMode === 'replace' && replacingTrack && (
											<p>
												{ sprintf(
													/* translators: %s: caption track language tag. */
													__( 'Replacing %s', 'jetpack-videopress-pkg' ),
													formatLanguageTagForDisplay( replacingTrack.srcLang )
												) }
											</p>
										) }
									</div>

									<FormFileUpload
										accept={ acceptedFileTypes }
										onChange={ ( event: ChangeEvent< HTMLInputElement > ) => {
											const file = event.target.files?.[ 0 ] ?? null;
											updateUploadForm( 'tmpFile', file );
										} }
										render={ ( { openFileDialog } ) => (
											<div className="videopress-caption-manager__file-picker">
												<Button variant="secondary" icon={ upload } onClick={ openFileDialog }>
													{ fileName || __( 'Select caption file', 'jetpack-videopress-pkg' ) }
												</Button>
												<p>
													{ sprintf(
														/* translators: %s: allowed caption file extensions. */
														__( 'Allowed formats: %s', 'jetpack-videopress-pkg' ),
														supportedCaptionFormatsLabel
													) }
												</p>
											</div>
										) }
										__next40pxDefaultSize={ true }
									/>

									<div className="videopress-caption-manager__form-grid">
										<TextControl
											label={ __( 'Label', 'jetpack-videopress-pkg' ) }
											value={ uploadForm.label }
											onChange={ value => updateUploadForm( 'label', value ) }
											disabled={ isSavingUpload }
											__nextHasNoMarginBottom={ true }
											__next40pxDefaultSize={ true }
										/>
										<TextControl
											label={ __( 'Language', 'jetpack-videopress-pkg' ) }
											value={ uploadForm.srcLang }
											onChange={ value => updateUploadForm( 'srcLang', value ) }
											help={ __(
												'Use a BCP-47 language tag, like en, en-US, or pt-BR.',
												'jetpack-videopress-pkg'
											) }
											disabled={ isSavingUpload || uploadFormMode === 'replace' }
											__nextHasNoMarginBottom={ true }
											__next40pxDefaultSize={ true }
										/>
									</div>

									<SelectControl
										label={ __( 'Kind', 'jetpack-videopress-pkg' ) }
										options={ kindOptions }
										value={ uploadForm.kind }
										onChange={ value => updateUploadForm( 'kind', value ) }
										disabled={ isSavingUpload || uploadFormMode === 'replace' }
										__nextHasNoMarginBottom={ true }
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
							) : (
								/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Captures keyboard shortcuts for the focused caption editing workspace. */
								<div
									className="videopress-caption-manager__manual-panel"
									role="group"
									aria-label={ __( 'Caption editing workspace', 'jetpack-videopress-pkg' ) }
									tabIndex={ 0 }
									onKeyDown={ handleManualEditorKeyDown }
								>
									<div
										className="videopress-caption-manager__manual-main"
										onInput={ pausePreviewWhileTyping }
									>
										<div className="videopress-caption-manager__manual-meta">
											<TextControl
												label={ __( 'Label', 'jetpack-videopress-pkg' ) }
												value={ manualTrack.label }
												onChange={ value => updateManualTrack( 'label', value ) }
												__nextHasNoMarginBottom={ true }
												__next40pxDefaultSize={ true }
											/>
											<TextControl
												label={ __( 'Language', 'jetpack-videopress-pkg' ) }
												value={ manualTrack.srcLang }
												onChange={ value => updateManualTrack( 'srcLang', value ) }
												help={ __(
													'Use a BCP-47 language tag, like en, en-US, or pt-BR.',
													'jetpack-videopress-pkg'
												) }
												__nextHasNoMarginBottom={ true }
												__next40pxDefaultSize={ true }
											/>
											<SelectControl
												label={ __( 'Kind', 'jetpack-videopress-pkg' ) }
												options={ kindOptions }
												value={ manualTrack.kind }
												onChange={ value => updateManualTrack( 'kind', value ) }
												__nextHasNoMarginBottom={ true }
												__next40pxDefaultSize={ true }
											/>
										</div>

										<div className="videopress-caption-manager__cue-toolbar">
											<Button variant="secondary" icon={ plus } onClick={ addCue }>
												{ __( 'Caption', 'jetpack-videopress-pkg' ) }
											</Button>
											<Button
												variant="secondary"
												onClick={ () => {
													setIsTextImportOpen( current => ! current );
													setNotice( null );
												} }
												aria-expanded={ isTextImportOpen }
											>
												{ __( 'Paste text', 'jetpack-videopress-pkg' ) }
											</Button>
										</div>

										{ isTextImportOpen && (
											<div className="videopress-caption-manager__text-import">
												<TextareaControl
													label={ __( 'Caption text', 'jetpack-videopress-pkg' ) }
													value={ captionTextInput }
													onChange={ value => {
														setCaptionTextInput( value );
														setNotice( null );
													} }
													rows={ 6 }
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
													<Button
														variant="primary"
														onClick={ importCaptionText }
														disabled={ ! captionTextInput.trim() }
													>
														{ __( 'Replace cues', 'jetpack-videopress-pkg' ) }
													</Button>
												</div>
											</div>
										) }

										<div className="videopress-caption-manager__cue-order">
											{ cueBlocks.map( ( block, cueIndex ) => {
												const attributes = getCueBlockAttributes( block );
												const cueText = attributes.text.trim();
												const cueRange = `${ attributes.startTime || '--:--' } - ${
													attributes.endTime || '--:--'
												}`;

												return (
													<div
														className="videopress-caption-manager__cue-order-row"
														key={ block.clientId }
													>
														<div className="videopress-caption-manager__cue-order-meta">
															<strong>
																{ sprintf(
																	/* translators: %d: caption cue number. */
																	__( 'Caption %d', 'jetpack-videopress-pkg' ),
																	cueIndex + 1
																) }
															</strong>
															<span>{ cueText ? `${ cueRange } · ${ cueText }` : cueRange }</span>
														</div>
														<div className="videopress-caption-manager__cue-order-actions">
															<Button
																variant="tertiary"
																onClick={ () => moveCue( cueIndex, 'up' ) }
																disabled={ cueIndex === 0 }
															>
																{ __( 'Move up', 'jetpack-videopress-pkg' ) }
															</Button>
															<Button
																variant="tertiary"
																onClick={ () => moveCue( cueIndex, 'down' ) }
																disabled={ cueIndex === cueBlocks.length - 1 }
															>
																{ __( 'Move down', 'jetpack-videopress-pkg' ) }
															</Button>
															<Button variant="tertiary" onClick={ () => duplicateCue( cueIndex ) }>
																{ __( 'Duplicate', 'jetpack-videopress-pkg' ) }
															</Button>
														</div>
													</div>
												);
											} ) }
										</div>

										<div className="videopress-caption-manager__cue-editor" ref={ cueEditorRef }>
											<BlockEditorProvider
												value={ cueBlocks }
												onInput={ blocks => setCueBlocks( blocks as CaptionCueBlock[] ) }
												onChange={ blocks => setCueBlocks( blocks as CaptionCueBlock[] ) }
												settings={ {
													allowedBlockTypes: [ CAPTION_CUE_BLOCK_NAME ],
													hasFixedToolbar: false,
													canLockBlocks: false,
													bodyPlaceholder: __( 'Add a caption cue.', 'jetpack-videopress-pkg' ),
												} }
											>
												<BlockTools>
													<WritingFlow>
														<ObserveTyping>
															<BlockList />
														</ObserveTyping>
													</WritingFlow>
												</BlockTools>
											</BlockEditorProvider>
										</div>
									</div>

									<aside className="videopress-caption-manager__preview">
										<div className="videopress-caption-manager__video">
											{ videoSrc ? (
												<video
													ref={ videoRef }
													aria-label={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
													src={ videoSrc }
													poster={ poster }
													controls
													onTimeUpdate={ event =>
														setCurrentTime( event.currentTarget.currentTime )
													}
												/>
											) : (
												<div className="videopress-caption-manager__video-placeholder">
													{ __( 'Video preview unavailable.', 'jetpack-videopress-pkg' ) }
												</div>
											) }
											{ activeCue && (
												<div className="videopress-caption-manager__caption-overlay">
													{ activeCue.text }
												</div>
											) }
										</div>
										<CheckboxControl
											label={ __( 'Pause while typing', 'jetpack-videopress-pkg' ) }
											checked={ pauseWhileTyping }
											onChange={ value => setPauseWhileTyping( Boolean( value ) ) }
											__nextHasNoMarginBottom={ true }
										/>
									</aside>
								</div>
							) }
						</section>
					) }
				</div>
			</Modal>

			{ shortcutsOpen && (
				<Modal
					title={ __( 'Keyboard shortcuts', 'jetpack-videopress-pkg' ) }
					onRequestClose={ () => setShortcutsOpen( false ) }
					className="videopress-caption-manager__shortcuts"
				>
					<ul>
						<li>
							{ __( 'Tab moves through caption and timestamp fields.', 'jetpack-videopress-pkg' ) }
						</li>
						<li>{ __( 'Space plays or pauses the preview.', 'jetpack-videopress-pkg' ) }</li>
						<li>
							{ __( 'Left and Right seek the preview by five seconds.', 'jetpack-videopress-pkg' ) }
						</li>
						<li>
							{ __(
								'C adds a caption cue at the current preview time.',
								'jetpack-videopress-pkg'
							) }
						</li>
						<li>{ __( 'N and P jump to the next or previous cue.', 'jetpack-videopress-pkg' ) }</li>
					</ul>
				</Modal>
			) }
		</>
	) : null;
}
