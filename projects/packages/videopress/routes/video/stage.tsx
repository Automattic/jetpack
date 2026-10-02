import AdminPage from '@automattic/jetpack-components/admin-page';
import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Link, useNavigate, useParams } from '@wordpress/route';
import { Card, Stack, Text } from '@wordpress/ui';
import CaptionManagerModal from '../../src/client/components/caption-manager-modal/lazy';
import { getVideoInfoQueryKeyPrefix } from '../../src/client/components/caption-manager-modal/use-video-tracks';
import { DeleteVideoConfirmationDialog } from '../../src/dashboard/components/delete-video-confirmation-modal';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import ChaptersHelpModal from '../../src/dashboard/components/video-details/chapters-help-modal';
import HeaderActions from '../../src/dashboard/components/video-details/header-actions';
import PreviewPlayer from '../../src/dashboard/components/video-details/preview-player';
import PrivacySharingCard from '../../src/dashboard/components/video-details/privacy-sharing-card';
import RatingCard from '../../src/dashboard/components/video-details/rating-card';
import SubtitlesCard from '../../src/dashboard/components/video-details/subtitles-card';
import ThumbnailCard from '../../src/dashboard/components/video-details/thumbnail-card';
import UploadProgress from '../../src/dashboard/components/video-details/upload-progress';
import { useVideoDetailsForm } from '../../src/dashboard/components/video-details/use-video-details-form';
import VideoDetailsCard from '../../src/dashboard/components/video-details/video-details-card';
import VideoInfoCard from '../../src/dashboard/components/video-details/video-info-card';
import VideoNav from '../../src/dashboard/components/video-nav';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useUpdateChapters } from '../../src/dashboard/hooks/use-update-chapters';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useUpload } from '../../src/dashboard/hooks/use-upload';
import { useUploadUnloadGuard } from '../../src/dashboard/hooks/use-upload-unload-guard';
import { useInvalidateVideo, useVideo } from '../../src/dashboard/hooks/use-video';
import { isChaptersEditorEnabled } from '../../src/dashboard/utils/chapters-editor';
import { isTrimCutEnabled } from '../../src/dashboard/utils/trim-cut';
import { uploadToLibraryItem } from '../../src/dashboard/utils/upload-to-library-item';
import './style.scss';
import type { UploadProgressStatus } from '../../src/dashboard/components/video-details/upload-progress';
import type { UploadItem } from '../../src/dashboard/hooks/use-upload';
import type { LibraryItem, VideoRating } from '../../src/dashboard/types/library';

const isEditable = ( item: LibraryItem ): boolean =>
	item.type === 'videopress' && item.upload.status !== 'failed';

/**
 * Parent breadcrumb item — labelled "VideoPress" in every case, but the
 * link target depends on where the user arrived from. Overview's ranking
 * links tag their navigation with `state: { from: 'stats' }`; we read
 * that here so the breadcrumb routes back to the Overview tab instead of
 * defaulting to Library. TanStack stores user state on `window.history.state`,
 * so reading it directly avoids needing `useLocation` (which `@wordpress/route`
 * doesn't re-export from TanStack). Stable for the lifetime of the mount,
 * so no reactivity hook is needed.
 *
 * @return The parent breadcrumb item.
 */
const getParentBreadcrumbItem = (): { label: string; to: string } => {
	const from = ( window.history.state as { from?: string } | null )?.from;
	return { label: 'VideoPress', to: from === 'stats' ? '/stats' : '/' };
};

const NotFound = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					getParentBreadcrumbItem(),
					{ label: __( 'Not found', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-video-details vp-video-details__not-found">
			<Stack direction="column" gap="md" align="center">
				<Text>{ __( "We couldn't find that video.", 'jetpack-videopress-pkg' ) }</Text>
				<Link to="/">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
		</div>
	</AdminPage>
);

// Placeholder shown while /wp/v2/media/{id} is in flight. Mirrors NotFound's
// AdminPage + breadcrumbs shell so the page chrome stays present rather than
// blanking out the viewport for the duration of the fetch.
const Loading = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					getParentBreadcrumbItem(),
					{ label: __( 'Loading…', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-video-details vp-video-details__loading" aria-busy="true" />
	</AdminPage>
);

type UploadEditorProps = {
	upload?: UploadItem;
	uploadId?: string;
	isUploadComplete?: boolean;
	hasVideoError?: boolean;
	onRetryVideo?: () => void;
};

type EditorProps = UploadEditorProps & {
	video: LibraryItem;
	onSave: (
		values: ReturnType< typeof useVideoDetailsForm >[ 'values' ],
		reset: ReturnType< typeof useVideoDetailsForm >[ 'reset' ]
	) => void;
	isSaving: boolean;
	onDelete: () => void;
	onDownload: () => void;
	onManageCaptions: () => void;
	chaptersOpen: boolean;
	setChaptersOpen: ( open: boolean ) => void;
};

const PendingCard = ( { title }: { title: string } ) => (
	<Card.Root>
		<Card.Header>
			<Card.Title>{ title }</Card.Title>
		</Card.Header>
		<Card.Content>
			<Text>
				{ __( 'Available when the video finishes processing.', 'jetpack-videopress-pkg' ) }
			</Text>
		</Card.Content>
	</Card.Root>
);

const Editor = ( {
	video,
	onSave,
	isSaving,
	onDelete,
	onDownload,
	onManageCaptions,
	chaptersOpen,
	setChaptersOpen,
	upload,
	uploadId,
	isUploadComplete,
	hasVideoError,
	onRetryVideo,
}: EditorProps ) => {
	const { values, update, isDirty, reset } = useVideoDetailsForm( video, {
		uploadId,
		draft: upload?.details,
	} );
	const { saveUploadDetails, retryUpload, retryUploadDetails } = useUpload();
	const { createInfoNotice } = useDispatch( noticesStore );
	const { hasConnectionError } = useConnectionErrorNotice();
	const isPendingUpload = Boolean( upload && video.id === upload.id );
	const showVideoNav = isChaptersEditorEnabled() || isTrimCutEnabled();

	useEffect( () => {
		if ( ! isDirty ) {
			return;
		}
		const onBeforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () => window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ isDirty ] );

	const openChapters = useCallback( () => setChaptersOpen( true ), [ setChaptersOpen ] );
	const closeChapters = useCallback( () => setChaptersOpen( false ), [ setChaptersOpen ] );
	const onRatingChange = useCallback(
		( next: VideoRating ) => update( { rating: next } ),
		[ update ]
	);
	const handleSave = useCallback( () => {
		if ( isPendingUpload ) {
			const changedFields = ( Object.keys( values ) as ( keyof typeof values )[] ).filter(
				key => values[ key ] !== video[ key ]
			);
			saveUploadDetails(
				upload.id,
				Object.fromEntries( changedFields.map( key => [ key, values[ key ] ] ) )
			);
			reset( values );
			createInfoNotice(
				__(
					'Changes queued. They’ll be saved when the upload completes.',
					'jetpack-videopress-pkg'
				),
				{ id: `vp-upload-details-${ upload.id }`, type: 'snackbar' }
			);
			return;
		}
		onSave( values, reset );
	}, [
		isPendingUpload,
		upload,
		video,
		saveUploadDetails,
		createInfoNotice,
		onSave,
		values,
		reset,
	] );
	const confirmNavigation = useCallback( () => {
		return (
			! isDirty ||
			// eslint-disable-next-line no-alert -- Navigation must synchronously confirm before leaving the form.
			window.confirm(
				__(
					'You have unsaved changes. Leave this page and discard them?',
					'jetpack-videopress-pkg'
				)
			)
		);
	}, [ isDirty ] );

	let progressStatus: UploadProgressStatus = 'pending';
	let onRetry: ( () => void ) | undefined;
	if ( isPendingUpload ) {
		if ( upload.detailsError ) {
			progressStatus = 'details-error';
			onRetry = () => retryUploadDetails( upload.id );
		} else if ( upload.status === 'failed' ) {
			progressStatus = 'failed';
			onRetry = () => retryUpload( upload.id );
		} else if ( isUploadComplete ) {
			progressStatus = hasVideoError ? 'loading-error' : 'loading';
			onRetry = onRetryVideo;
		} else {
			progressStatus = upload.status === 'success' ? 'saving' : upload.status;
		}
	}

	return (
		<AdminPage
			breadcrumbs={
				<div
					className="vp-video-details__breadcrumbs"
					onClickCapture={ event => {
						if ( ( event.target as HTMLElement ).closest( 'a' ) && ! confirmNavigation() ) {
							event.preventDefault();
							event.stopPropagation();
						}
					} }
				>
					<Breadcrumbs
						items={ [
							getParentBreadcrumbItem(),
							{
								label: values.title.trim() || __( 'Untitled', 'jetpack-videopress-pkg' ),
							},
						] }
					/>
				</div>
			}
			actions={
				<HeaderActions
					guid={ video.guid }
					canSave={ isDirty && ! isSaving && ! ( isPendingUpload && isUploadComplete ) }
					showMenu={ ! isPendingUpload }
					onSave={ handleSave }
					onManageCaptions={ onManageCaptions }
					onDownload={ onDownload }
					onDelete={ onDelete }
				/>
			}
		>
			{ hasConnectionError && (
				<Stack direction="column">
					<ConnectionError trackingContext="videopress" />
				</Stack>
			) }
			{ showVideoNav && (
				<VideoNav
					videoId={ video.id }
					activeTab="details"
					editorDisabled={ isPendingUpload }
					confirmNavigation={ confirmNavigation }
				/>
			) }
			<div className="vp-video-details">
				<div className="vp-video-details__layout">
					<div className="vp-video-details__canvas">
						<VideoDetailsCard
							video={ video }
							title={ values.title }
							description={ values.description }
							onChange={ update }
							onOpenChapters={ openChapters }
							confirmNavigation={ confirmNavigation }
							showChapters={ ! isPendingUpload }
						/>
						{ isPendingUpload || video.isProcessing ? (
							<PendingCard title={ __( 'Thumbnail', 'jetpack-videopress-pkg' ) } />
						) : (
							<ThumbnailCard video={ video } />
						) }
						{ isPendingUpload ? (
							<PendingCard title={ __( 'Subtitles', 'jetpack-videopress-pkg' ) } />
						) : (
							<SubtitlesCard video={ video } onManageSubtitles={ onManageCaptions } />
						) }
					</div>
					<section
						className="vp-video-details__player-slot"
						aria-label={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
					>
						{ isPendingUpload ? (
							<UploadProgress
								status={ progressStatus }
								fileName={ video.filename }
								progress={ upload?.progress }
								onRetry={ onRetry }
							/>
						) : (
							<PreviewPlayer video={ video } />
						) }
					</section>
					<aside
						className="vp-video-details__inspector"
						aria-label={ __( 'Video settings', 'jetpack-videopress-pkg' ) }
					>
						{ isPendingUpload ? (
							<PendingCard title={ __( 'Video info', 'jetpack-videopress-pkg' ) } />
						) : (
							<VideoInfoCard video={ video } />
						) }
						<PrivacySharingCard
							privacy={ values.privacy }
							displayEmbed={ values.displayEmbed }
							allowDownloads={ values.allowDownloads }
							onChange={ update }
						/>
						<RatingCard value={ values.rating } onChange={ onRatingChange } />
					</aside>
				</div>
			</div>
			<ChaptersHelpModal isOpen={ chaptersOpen } onClose={ closeChapters } />
		</AdminPage>
	);
};

type StageReadyProps = UploadEditorProps & { video: LibraryItem };

// Per-video id so the settle notices replace the in-progress snackbar in
// place (the notices store drops an existing notice with the same id on
// create) instead of stacking a second notice next to it. Keyed by video id
// so two overlapping deletes — start one, navigate away mid-flight, delete
// another — can't clobber each other's notices.
const deletingNoticeId = ( videoId: string ) => `vp-video-deleting-${ videoId }`;

const StageReady = ( { video, ...uploadProps }: StageReadyProps ) => {
	const navigate = useNavigate();
	const invalidateVideo = useInvalidateVideo();
	const { mutate: updateMeta, isPending: isSaving } = useUpdateVideoMeta();
	const { syncChapters } = useUpdateChapters();
	const { mutateAsync: deleteVideo, isPending: isDeleting } = useDeleteVideo();
	const { createSuccessNotice, createErrorNotice, createInfoNotice } = useDispatch( noticesStore );
	const [ chaptersOpen, setChaptersOpen ] = useState( false );
	const [ captionsOpen, setCaptionsOpen ] = useState( false );
	const [ isDeleteConfirmOpen, setDeleteConfirmOpen ] = useState( false );
	const queryClient = useQueryClient();

	/*
	 * The caption manager runs on its own query client, so the page's caches
	 * (the info card's Subtitles row) don't see its changes. Refresh the
	 * video info on close to pick up publishes and deletions.
	 */
	const closeCaptions = useCallback( () => {
		setCaptionsOpen( false );
		void queryClient.invalidateQueries( {
			queryKey: getVideoInfoQueryKeyPrefix( video.guid ?? '' ),
		} );
	}, [ queryClient, video.guid ] );
	// Deletes keep running after an unmount (the user can navigate away via
	// the breadcrumb mid-flight). The notice cleanup below must still happen
	// then, but we shouldn't yank them to the Library if they've moved on.
	const isMountedRef = useRef( true );

	useEffect( () => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, [] );

	const handleDelete = () => {
		if ( isDeleting ) {
			return;
		}
		setDeleteConfirmOpen( false );
		// Deleting can take several seconds (the backend also removes the
		// remote VideoPress copy); surface progress immediately so the
		// action doesn't feel frozen. `explicitDismiss` keeps the snackbar
		// from auto-expiring before the request settles.
		createInfoNotice( __( 'Deleting video…', 'jetpack-videopress-pkg' ), {
			id: deletingNoticeId( video.id ),
			explicitDismiss: true,
			type: 'snackbar',
		} );
		// Promise chain rather than mutate-level callbacks: those are
		// dropped when the component unmounts mid-flight, which would
		// orphan the explicitDismiss notice above forever.
		deleteVideo( Number( video.id ) )
			.then( () => {
				createSuccessNotice( __( 'Video deleted.', 'jetpack-videopress-pkg' ), {
					id: deletingNoticeId( video.id ),
					type: 'snackbar',
				} );
				if ( isMountedRef.current ) {
					navigate( { href: '/' } );
				}
			} )
			.catch( () => {
				createErrorNotice( __( 'Failed to delete video.', 'jetpack-videopress-pkg' ), {
					id: deletingNoticeId( video.id ),
					type: 'snackbar',
				} );
			} );
	};

	return (
		<>
			<Editor
				video={ video }
				{ ...uploadProps }
				// Treat an in-flight delete like an in-flight save: Save stays
				// disabled so a slow delete can't be raced by a meta update
				// against the attachment being removed.
				isSaving={ isSaving || isDeleting }
				onSave={ ( values, reset ) => {
					updateMeta(
						{ id: video.id, patch: values },
						{
							onSuccess: () => {
								// The description is the single source of truth for the
								// player's chapters VTT, so a description change must
								// regenerate that track (the legacy dashboard did; without
								// it the player's chapter menu silently de-syncs). Only
								// after the meta save succeeds — syncing first would bake
								// a never-persisted description into the VTT when the
								// save fails. Fire-and-notice: syncChapters never rejects
								// (failures surface as a warning notice from the hook),
								// so it can't block the save result either way.
								if ( values.description !== video.description ) {
									void syncChapters( video, values.description );
								}
								createSuccessNotice( __( 'Video details saved.', 'jetpack-videopress-pkg' ), {
									type: 'snackbar',
								} );
								reset( values );
							},
							onError: () => {
								createErrorNotice(
									__( 'Failed to save video details.', 'jetpack-videopress-pkg' ),
									{ type: 'snackbar' }
								);
							},
						}
					);
				} }
				onDelete={ () => setDeleteConfirmOpen( true ) }
				onDownload={ () => {
					if ( video.sourceUrl ) {
						window.open( video.sourceUrl, '_blank' );
					}
				} }
				onManageCaptions={ () => setCaptionsOpen( true ) }
				chaptersOpen={ chaptersOpen }
				setChaptersOpen={ setChaptersOpen }
			/>
			{ captionsOpen && (
				<CaptionManagerModal
					isOpen={ captionsOpen }
					guid={ video.guid }
					title={ video.title }
					poster={ video.thumbnailUrl }
					isPrivate={ video.isPrivate }
					tracks={ video.tracks }
					onClose={ closeCaptions }
					onTracksChange={ () => void invalidateVideo( video.id ) }
				/>
			) }
			<DeleteVideoConfirmationDialog
				isOpen={ isDeleteConfirmOpen }
				count={ 1 }
				isDeleting={ isDeleting }
				onCancel={ () => setDeleteConfirmOpen( false ) }
				onConfirm={ handleDelete }
			/>
		</>
	);
};

const StageInner = () => {
	useUploadUnloadGuard();
	const { id } = useParams( { from: '/video/$id' } );
	const { uploadQueue, completedUploads } = useUpload();
	const navigate = useNavigate();
	const isUpload = id.startsWith( 'upload-' );
	const completedId = completedUploads[ id ];
	const uploadId = isUpload
		? id
		: Object.keys( completedUploads ).find( key => completedUploads[ key ] === id );
	const queuedUpload = uploadQueue.find( item => item.id === id );
	const retainedUpload = useRef< UploadItem >();
	// Keep the editor present if queue cleanup precedes a slow attachment fetch.
	if ( queuedUpload ) {
		retainedUpload.current = queuedUpload;
	} else if ( retainedUpload.current?.id !== id ) {
		retainedUpload.current = undefined;
	}
	const upload = queuedUpload ?? retainedUpload.current;
	const { video, isLoading, isError, refetch } = useVideo( isUpload ? ( completedId ?? '' ) : id, {
		pollForRegistration: Boolean( uploadId ),
	} );
	const ready = Boolean( video && isEditable( video ) );

	useEffect( () => {
		if ( isUpload && completedId && ready ) {
			navigate( {
				href: `/video/${ completedId }`,
				replace: true,
				resetScroll: false,
				viewTransition: false,
			} );
		}
	}, [ isUpload, completedId, ready, navigate ] );

	if ( upload || ready ) {
		return (
			<StageReady
				video={ ready ? video : uploadToLibraryItem( upload ) }
				upload={ upload }
				uploadId={ uploadId }
				isUploadComplete={ Boolean( completedId ) }
				hasVideoError={ isError }
				onRetryVideo={ () => void refetch() }
			/>
		);
	}

	if ( isLoading || ( completedId && video?.type === 'local' ) ) {
		return <Loading />;
	}

	return <NotFound />;
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
