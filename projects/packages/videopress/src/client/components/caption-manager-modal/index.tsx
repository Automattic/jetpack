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
	TextControl,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { help, plus, upload, trash } from '@wordpress/icons';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { deleteTrackForGuid, TRACK_KIND_OPTIONS, uploadTrackForGuid } from '../../lib/video-tracks';
import {
	CAPTION_DRAFT_META,
	fetchCaptionDrafts,
	getSourceTrackMeta,
	saveCaptionDraft,
} from '../../lib/video-tracks/caption-drafts';
import {
	CAPTION_CUE_BLOCK_NAME,
	captionBlocksToCues,
	formatSecondsAsTimestamp,
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
import type { SavedCaptionDraft } from '../../lib/video-tracks/caption-drafts';
import type {
	trackKindOptionProps,
	UploadTrackDataProps,
	VideoTextTrack,
} from '../../lib/video-tracks/types';
import type { ChangeEvent, ReactElement } from 'react';

registerCaptionCueBlock();

const debug = debugFactory( 'videopress:caption-manager-modal' );

const DEFAULT_KIND: trackKindOptionProps = 'captions';

const ACCEPTED_FILE_TYPES: Record< string, string > = {
	'.vtt': 'text/vtt',
	'.srt': 'application/x-subrip',
};

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

type WorkspaceMode = 'upload' | 'manual';
type UploadFormMode = 'add' | 'replace';
type NoticeState = { status: 'success' | 'error'; message: string } | null;
type CaptionCueBlock = ReturnType< typeof createBlock >;

type TrackApiError = {
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

const DRAFT_NOTICE_LABELS: Record< 'draft' | 'publish', string > = {
	draft: __( 'Caption draft saved.', 'jetpack-videopress-pkg' ),
	publish: __( 'Caption draft saved for publishing.', 'jetpack-videopress-pkg' ),
};

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

const getTrackKey = ( track: Pick< VideoTextTrack, 'kind' | 'srcLang' > ) =>
	`${ track.kind }:${ track.srcLang }`;

const getDraftSourceKey = ( draft: SavedCaptionDraft ) =>
	`${ draft.meta[ CAPTION_DRAFT_META.sourceTrackKind ] ?? '' }:${
		draft.meta[ CAPTION_DRAFT_META.sourceTrackSrcLang ] ?? ''
	}`;

const isAcceptedTrackFile = ( file: File | null ): boolean => {
	if ( ! file ) {
		return false;
	}

	const lowerName = file.name.toLowerCase();
	return Object.keys( ACCEPTED_FILE_TYPES ).some( extension => lowerName.endsWith( extension ) );
};

const hasTrackApiError = ( response: unknown ): response is TrackApiError =>
	typeof response === 'object' &&
	response !== null &&
	'error' in response &&
	!! ( response as TrackApiError ).error;

const getTrackApiErrorMessage = ( response: unknown, fallback: string ): string => {
	if ( typeof response === 'object' && response !== null ) {
		const { error: errorCode, message } = response as TrackApiError;
		return message || errorCode || fallback;
	}

	return fallback;
};

const acceptedFileTypes = Object.entries( ACCEPTED_FILE_TYPES )
	.flatMap( ( [ extension, mimeType ] ) => [ extension, mimeType ] )
	.join( ',' );

const createCueBlock = ( cue?: Partial< { startTime: string; endTime: string; text: string } > ) =>
	createBlock( CAPTION_CUE_BLOCK_NAME, {
		startTime: cue?.startTime ?? '00:00:00.000',
		endTime: cue?.endTime ?? '00:00:02.000',
		text: cue?.text ?? '',
	} );

const createEmptyCueBlocks = () => [ createCueBlock() ];

const createCueBlocksFromTrackText = ( trackText: string ) => {
	const cues = parseCaptionTextTrack( trackText );
	return cues.length ? cues.map( createCueBlock ) : createEmptyCueBlocks();
};

const createCueBlocksFromDraft = ( draft: SavedCaptionDraft ) => {
	const blocks = parse( draft.content ) as CaptionCueBlock[];
	const cueBlocks = blocks.filter( block => block.name === CAPTION_CUE_BLOCK_NAME );
	return cueBlocks.length ? cueBlocks : createEmptyCueBlocks();
};

const getDefaultCueStartTime = ( currentTime: number ) => formatSecondsAsTimestamp( currentTime );

const getDefaultCueEndTime = ( currentTime: number ) => formatSecondsAsTimestamp( currentTime + 2 );

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
	const [ workspaceMode, setWorkspaceMode ] = useState< WorkspaceMode >( 'manual' );
	const [ uploadForm, setUploadForm ] = useState< UploadFormTrack >( emptyUploadForm );
	const [ uploadFormMode, setUploadFormMode ] = useState< UploadFormMode >( 'add' );
	const [ replacingTrack, setReplacingTrack ] = useState< VideoTextTrack | null >( null );
	const [ manualTrack, setManualTrack ] = useState< ManualTrack >( emptyManualTrack );
	const [ manualSourceTrack, setManualSourceTrack ] = useState< VideoTextTrack | null >( null );
	const [ cueBlocks, setCueBlocks ] = useState< CaptionCueBlock[] >( createEmptyCueBlocks );
	const [ drafts, setDrafts ] = useState< SavedCaptionDraft[] >( [] );
	const [ draftId, setDraftId ] = useState< number | undefined >();
	const [ notice, setNotice ] = useState< NoticeState >( null );
	const [ isSavingUpload, setIsSavingUpload ] = useState( false );
	const [ isSavingDraft, setIsSavingDraft ] = useState( false );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ isLoadingDrafts, setIsLoadingDrafts ] = useState( false );
	const [ deletingTrackKey, setDeletingTrackKey ] = useState< string | null >( null );
	const [ currentTime, setCurrentTime ] = useState( 0 );
	const [ pauseWhileTyping, setPauseWhileTyping ] = useState( true );
	const [ shortcutsOpen, setShortcutsOpen ] = useState( false );

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		setWorkspaceMode( 'manual' );
		setUploadForm( emptyUploadForm() );
		setUploadFormMode( 'add' );
		setReplacingTrack( null );
		setManualTrack( emptyManualTrack() );
		setManualSourceTrack( null );
		setCueBlocks( createEmptyCueBlocks() );
		setDraftId( undefined );
		setNotice( null );
	}, [ isOpen ] );

	useEffect( () => {
		if ( ! isOpen || ! guid ) {
			return;
		}

		let isMounted = true;
		setIsLoadingDrafts( true );
		fetchCaptionDrafts( guid )
			.then( loadedDrafts => {
				if ( isMounted ) {
					setDrafts( loadedDrafts );
				}
			} )
			.catch( error => {
				debug( 'fetch caption drafts error', error );
				if ( isMounted ) {
					setDrafts( [] );
				}
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsLoadingDrafts( false );
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

	const activeCue = useMemo( () => {
		return captionBlocksToCues( cueBlocks ).find( cue => {
			const startTime = parseTimestampToSeconds( cue.startTime );
			const endTime = parseTimestampToSeconds( cue.endTime );
			return (
				startTime !== null && endTime !== null && currentTime >= startTime && currentTime <= endTime
			);
		} );
	}, [ cueBlocks, currentTime ] );

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

	const resetUploadForm = useCallback( () => {
		setUploadForm( emptyUploadForm() );
		setUploadFormMode( 'add' );
		setReplacingTrack( null );
		setNotice( null );
	}, [] );

	const findDraftForManualTrack = useCallback(
		( track: ManualTrack, sourceTrack: VideoTextTrack | null ) => {
			if ( sourceTrack ) {
				const sourceKey = getTrackKey( sourceTrack );
				const sourceDraft = drafts.find( draft => getDraftSourceKey( draft ) === sourceKey );
				if ( sourceDraft ) {
					return sourceDraft;
				}
			}

			const manualKey = getTrackKey( track );
			return drafts.find(
				draft =>
					`${ draft.meta[ CAPTION_DRAFT_META.kind ] }:${
						draft.meta[ CAPTION_DRAFT_META.srcLang ]
					}` === manualKey
			);
		},
		[ drafts ]
	);

	const loadTrackText = useCallback( async ( track: VideoTextTrack ) => {
		if ( ! track.src ) {
			return createEmptyCueBlocks();
		}

		try {
			const response = await fetch( track.src );
			if ( ! response.ok ) {
				return createEmptyCueBlocks();
			}
			return createCueBlocksFromTrackText( await response.text() );
		} catch ( error ) {
			debug( 'fetch caption track text error', error );
			return createEmptyCueBlocks();
		}
	}, [] );

	const startManualTrack = useCallback(
		async ( sourceTrack: VideoTextTrack | null = null ) => {
			const nextManualTrack: ManualTrack = sourceTrack
				? {
						kind: sourceTrack.kind,
						srcLang: getManualLanguageTagFromTrackKey( sourceTrack.srcLang ),
						label: sourceTrack.label || formatLanguageTagForDisplay( sourceTrack.srcLang ),
				  }
				: emptyManualTrack();
			const matchingDraft = findDraftForManualTrack( nextManualTrack, sourceTrack );

			setWorkspaceMode( 'manual' );
			setManualTrack( nextManualTrack );
			setManualSourceTrack( sourceTrack );
			setDraftId( matchingDraft?.id );
			setNotice( null );

			if ( matchingDraft ) {
				setCueBlocks( createCueBlocksFromDraft( matchingDraft ) );
				return;
			}

			setCueBlocks( sourceTrack ? await loadTrackText( sourceTrack ) : createEmptyCueBlocks() );
		},
		[ findDraftForManualTrack, loadTrackText ]
	);

	const startUploadTrack = useCallback( ( sourceTrack: VideoTextTrack | null = null ) => {
		setWorkspaceMode( 'upload' );
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

	const deleteTrack = useCallback(
		async ( track: VideoTextTrack ) => {
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

				onTracksChange( tracks.filter( current => getTrackKey( current ) !== key ) );
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
		[ guid, onTracksChange, tracks ]
	);

	const saveUploadedTrack = useCallback( async () => {
		if ( ! uploadForm.tmpFile ) {
			setNotice( {
				status: 'error',
				message: __( 'Select a caption file before saving.', 'jetpack-videopress-pkg' ),
			} );
			return;
		}

		if ( ! isAcceptedTrackFile( uploadForm.tmpFile ) ) {
			setNotice( {
				status: 'error',
				message: __( 'Only .vtt and .srt files are supported.', 'jetpack-videopress-pkg' ),
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

		const existingTrackIndex = tracks.findIndex(
			track => track.kind === uploadForm.kind && track.srcLang === srcLang
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

			const uploadedTrack: VideoTextTrack = {
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
				src: String( src ),
			};

			const updatedTracks = [ ...tracks ];
			const updatedTrackIndex =
				uploadFormMode === 'replace'
					? tracks.findIndex(
							track =>
								track.kind === replacingTrack?.kind && track.srcLang === replacingTrack?.srcLang
					  )
					: existingTrackIndex;

			if ( updatedTrackIndex > -1 ) {
				updatedTracks[ updatedTrackIndex ] = uploadedTrack;
			} else {
				updatedTracks.push( uploadedTrack );
			}

			onTracksChange( updatedTracks );
			resetUploadForm();
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
		onTracksChange,
		replacingTrack,
		resetUploadForm,
		tracks,
		uploadForm,
		uploadFormMode,
	] );

	const buildDraftPayload = useCallback(
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
				id: draftId,
				title:
					manualTrack.label.trim() ||
					sprintf(
						/* translators: %s: caption track language tag. */
						__( 'Caption draft %s', 'jetpack-videopress-pkg' ),
						canonicalSrcLang
					),
				content: cueContent,
				status,
				meta: {
					[ CAPTION_DRAFT_META.guid ]: guid,
					[ CAPTION_DRAFT_META.kind ]: manualTrack.kind,
					[ CAPTION_DRAFT_META.srcLang ]: canonicalSrcLang,
					[ CAPTION_DRAFT_META.label ]: manualTrack.label.trim(),
					...getSourceTrackMeta( manualSourceTrack ),
				},
			};
		},
		[ cueBlocks, draftId, guid, manualSourceTrack, manualTrack ]
	);

	const saveManualDraft = useCallback(
		async ( status: 'draft' | 'publish' = 'draft' ) => {
			const payload = buildDraftPayload( status );
			if ( ! payload ) {
				return null;
			}

			setIsSavingDraft( true );
			setNotice( null );

			try {
				const savedDraft = await saveCaptionDraft( payload );
				setDraftId( savedDraft.id );
				setDrafts( current => {
					const existingIndex = current.findIndex( draft => draft.id === savedDraft.id );
					if ( existingIndex === -1 ) {
						return [ savedDraft, ...current ];
					}
					const next = [ ...current ];
					next[ existingIndex ] = savedDraft;
					return next;
				} );
				setNotice( {
					status: 'success',
					message: DRAFT_NOTICE_LABELS[ status ],
				} );
				return savedDraft;
			} catch ( error ) {
				debug( 'save caption draft error', error );
				setNotice( {
					status: 'error',
					message: __( 'Unable to save caption draft.', 'jetpack-videopress-pkg' ),
				} );
				return null;
			} finally {
				setIsSavingDraft( false );
			}
		},
		[ buildDraftPayload ]
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

		const cues = captionBlocksToCues( cueBlocks );
		if ( ! cues.length ) {
			setNotice( {
				status: 'error',
				message: __(
					'Add at least one complete caption cue before publishing.',
					'jetpack-videopress-pkg'
				),
			} );
			return;
		}

		setIsPublishing( true );
		setNotice( null );

		try {
			const savedDraft = await saveManualDraft( 'publish' );
			if ( ! savedDraft ) {
				return;
			}

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
			const src = await uploadTrackForGuid( trackToUpload, guid );

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

			const uploadedTrack: VideoTextTrack = {
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
				src: String( src ),
			};
			const manualTrackIndex = tracks.findIndex(
				track => track.kind === uploadedTrack.kind && track.srcLang === uploadedTrack.srcLang
			);
			const sourceTrackIndex =
				manualSourceTrack && ! isGeneratedLanguageKey( manualSourceTrack.srcLang )
					? tracks.findIndex( track => getTrackKey( track ) === getTrackKey( manualSourceTrack ) )
					: -1;
			const updatedIndex = sourceTrackIndex > -1 ? sourceTrackIndex : manualTrackIndex;
			const updatedTracks = [ ...tracks ];
			if ( updatedIndex > -1 ) {
				updatedTracks[ updatedIndex ] = uploadedTrack;
			} else {
				updatedTracks.push( uploadedTrack );
			}

			onTracksChange( updatedTracks );
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
	}, [ cueBlocks, guid, manualSourceTrack, manualTrack, onTracksChange, saveManualDraft, tracks ] );

	const addCue = useCallback( () => {
		setCueBlocks( current => [
			...current,
			createCueBlock( {
				startTime: getDefaultCueStartTime( currentTime ),
				endTime: getDefaultCueEndTime( currentTime ),
			} ),
		] );
	}, [ currentTime ] );

	const pausePreviewWhileTyping = useCallback( () => {
		if ( pauseWhileTyping && videoRef.current && ! videoRef.current.paused ) {
			videoRef.current.pause();
		}
	}, [ pauseWhileTyping ] );

	const uploadFormTitle = UPLOAD_FORM_TITLE_LABELS[ uploadFormMode ];
	const fileName = uploadForm.tmpFile?.name;
	const emptyMessage = __(
		'No caption tracks have been added to this video yet.',
		'jetpack-videopress-pkg'
	);
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
						{ isLoadingDrafts && (
							<p>{ __( 'Loading caption drafts…', 'jetpack-videopress-pkg' ) }</p>
						) }
					</div>
					<div className="videopress-caption-manager__header-actions">
						<Button variant="secondary" icon={ help } onClick={ () => setShortcutsOpen( true ) }>
							{ __( 'Keyboard shortcuts', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button
							variant="secondary"
							onClick={ () => void saveManualDraft( 'draft' ) }
							isBusy={ isSavingDraft }
							disabled={ isSavingDraft || isPublishing || workspaceMode !== 'manual' }
						>
							{ __( 'Save Draft', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ publishManualTrack }
							isBusy={ isPublishing }
							disabled={ isSavingDraft || isPublishing || workspaceMode !== 'manual' }
						>
							{ __( 'Publish', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
				</div>

				{ notice && (
					<Notice status={ notice.status } isDismissible={ false }>
						{ notice.message }
					</Notice>
				) }

				<div className="videopress-caption-manager__workspace">
					<section className="videopress-caption-manager__tracks">
						<div className="videopress-caption-manager__tracks-header">
							<h3>{ __( 'Caption tracks', 'jetpack-videopress-pkg' ) }</h3>
							<Button variant="secondary" icon={ plus } onClick={ () => void startManualTrack() }>
								{ __( 'Add track', 'jetpack-videopress-pkg' ) }
							</Button>
						</div>

						{ tracks.length ? (
							<div className="videopress-caption-manager__track-list">
								{ tracks.map( track => {
									const key = getTrackKey( track );
									const language = formatLanguageTagForDisplay( track.srcLang );
									const isDeleting = deletingTrackKey === key;

									return (
										<div className="videopress-caption-manager__track" key={ key }>
											<div className="videopress-caption-manager__track-meta">
												<strong>{ track.label || language }</strong>
												<span>
													{ KIND_LABELS[ track.kind ] } · { language }
												</span>
											</div>
											<div className="videopress-caption-manager__track-actions">
												<Button
													variant="secondary"
													onClick={ () => void startManualTrack( track ) }
													disabled={ isSavingUpload || isPublishing || !! deletingTrackKey }
												>
													{ __( 'Edit manually', 'jetpack-videopress-pkg' ) }
												</Button>
												<Button
													variant="secondary"
													onClick={ () => startUploadTrack( track ) }
													disabled={ isSavingUpload || isPublishing || !! deletingTrackKey }
												>
													{ __( 'Replace file', 'jetpack-videopress-pkg' ) }
												</Button>
												<Button
													variant="link"
													icon={ trash }
													isDestructive
													isBusy={ isDeleting }
													disabled={ isSavingUpload || isDeleting || isPublishing }
													onClick={ () => deleteTrack( track ) }
												>
													{ __( 'Delete', 'jetpack-videopress-pkg' ) }
												</Button>
											</div>
										</div>
									);
								} ) }
							</div>
						) : (
							<div className="videopress-caption-manager__empty">{ emptyMessage }</div>
						) }
					</section>

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
												{ fileName || __( 'Select .vtt or .srt file', 'jetpack-videopress-pkg' ) }
											</Button>
											<p>
												{ sprintf(
													/* translators: %s: allowed caption file extensions. */
													__( 'Allowed formats: %s', 'jetpack-videopress-pkg' ),
													Object.keys( ACCEPTED_FILE_TYPES ).join( ', ' )
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
							<div className="videopress-caption-manager__manual-panel">
								<div
									className="videopress-caption-manager__manual-main"
									onFocus={ pausePreviewWhileTyping }
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
									</div>

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

								<aside className="videopress-caption-manager__preview">
									<div className="videopress-caption-manager__video">
										{ videoSrc ? (
											<video
												ref={ videoRef }
												src={ videoSrc }
												poster={ poster }
												controls
												onTimeUpdate={ event => setCurrentTime( event.currentTarget.currentTime ) }
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
						<li>
							{ __(
								'Use the Add Caption button to insert another cue.',
								'jetpack-videopress-pkg'
							) }
						</li>
						<li>
							{ __(
								'Use the video controls to preview caption timing.',
								'jetpack-videopress-pkg'
							) }
						</li>
					</ul>
				</Modal>
			) }
		</>
	) : null;
}
