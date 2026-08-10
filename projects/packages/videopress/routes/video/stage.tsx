import AdminPage from '@automattic/jetpack-components/admin-page';
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate, useParams } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';
import CaptionManagerModal from '../../src/client/components/caption-manager-modal/lazy';
import { getVideoInfoQueryKeyPrefix } from '../../src/client/components/caption-manager-modal/use-video-tracks';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import ChaptersHelpModal from '../../src/dashboard/components/video-details/chapters-help-modal';
import HeaderActions from '../../src/dashboard/components/video-details/header-actions';
import PreviewPlayer from '../../src/dashboard/components/video-details/preview-player';
import PrivacySharingCard from '../../src/dashboard/components/video-details/privacy-sharing-card';
import RatingCard from '../../src/dashboard/components/video-details/rating-card';
import { useVideoDetailsForm } from '../../src/dashboard/components/video-details/use-video-details-form';
import VideoDetailsCard from '../../src/dashboard/components/video-details/video-details-card';
import VideoInfoCard from '../../src/dashboard/components/video-details/video-info-card';
import VideoNav from '../../src/dashboard/components/video-nav';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useUpdateChapters } from '../../src/dashboard/hooks/use-update-chapters';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useInvalidateVideo, useVideo } from '../../src/dashboard/hooks/use-video';
import { isChaptersEditorEnabled } from '../../src/dashboard/utils/chapters-editor';
import './style.scss';
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

type EditorProps = {
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

const Editor = ( {
	video,
	onSave,
	isSaving,
	onDelete,
	onDownload,
	onManageCaptions,
	chaptersOpen,
	setChaptersOpen,
}: EditorProps ) => {
	const { values, update, isDirty, reset } = useVideoDetailsForm( video );

	// The sub-nav's only sibling tab is the Editor, whose route is stripped
	// from the registry when the chapters editor is off — a one-tab strip
	// would be pointless chrome, and its Editor tab would dead-end.
	const showVideoNav = isChaptersEditorEnabled();

	const openChapters = useCallback( () => {
		setChaptersOpen( true );
	}, [ setChaptersOpen ] );

	const closeChapters = useCallback( () => {
		setChaptersOpen( false );
	}, [ setChaptersOpen ] );

	const onRatingChange = useCallback(
		( next: VideoRating ) => {
			update( { rating: next } );
		},
		[ update ]
	);

	const handleSave = useCallback( () => {
		onSave( values, reset );
	}, [ onSave, values, reset ] );

	// Guard the sub-nav against losing unsaved form edits: the Editor tab
	// is a sibling route, so switching tabs unmounts this form entirely.
	const confirmNavigation = useCallback( () => {
		return (
			! isDirty ||
			// eslint-disable-next-line no-alert -- deliberate synchronous guard; the sub-nav navigation can't await a custom dialog.
			window.confirm(
				__(
					'You have unsaved changes. Leave this page and discard them?',
					'jetpack-videopress-pkg'
				)
			)
		);
	}, [ isDirty ] );

	return (
		<AdminPage
			breadcrumbs={
				// display: contents wrapper — a pure scoping hook so the
				// stylesheet can clamp long video titles in the current-item
				// crumb (Breadcrumbs' own class names are CSS-module hashes).
				<div className="vp-video-details__breadcrumbs">
					{ /*
					 * The crumb reads the FORM's title, not the saved record, so
					 * the page heading tracks what is being typed without
					 * committing it. Two side benefits over reading
					 * `video.title`: no old→new flicker when the post-save
					 * refetch lands, and the 2s processing `refetchInterval`
					 * can't clobber the crumb mid-edit.
					 *
					 * `.trim()` matters. Breadcrumbs only short-circuits on
					 * `items.length === 0`, so a whitespace-only title would
					 * render an empty <h1> — and that <h1> is this page's only
					 * accessible name.
					 */ }
					<Breadcrumbs
						items={ [
							getParentBreadcrumbItem(),
							{ label: values.title.trim() || __( 'Untitled', 'jetpack-videopress-pkg' ) },
						] }
					/>
				</div>
			}
			actions={
				<HeaderActions
					guid={ video.guid }
					canSave={ isDirty && ! isSaving }
					onSave={ handleSave }
					onManageCaptions={ onManageCaptions }
					onDownload={ onDownload }
					onDelete={ onDelete }
				/>
			}
		>
			{ showVideoNav && (
				<VideoNav
					videoId={ video.id }
					activeTab="details"
					confirmNavigation={ confirmNavigation }
				/>
			) }
			<div className="vp-video-details">
				{ /*
				 * Placement rule for this screen: the canvas holds this video —
				 * the frame, what it is called, what it says, and the still it
				 * is represented by. The inspector holds settings that are
				 * picked once from a fixed set, plus the reference values
				 * (link, shortcode, upload date, subtitles) nobody edits inline.
				 * The split is one grid — the same route and the same component
				 * tree serve a video uploaded two seconds ago and one uploaded
				 * two years ago.
				 */ }
				<div className="vp-video-details__layout">
					<div className="vp-video-details__canvas">
						<PreviewPlayer video={ video } />
						<VideoDetailsCard
							video={ video }
							title={ values.title }
							description={ values.description }
							onChange={ update }
							onOpenChapters={ openChapters }
							confirmNavigation={ confirmNavigation }
						/>
					</div>
					<aside
						className="vp-video-details__inspector"
						aria-label={ __( 'Video settings', 'jetpack-videopress-pkg' ) }
					>
						<PrivacySharingCard
							privacy={ values.privacy }
							displayEmbed={ values.displayEmbed }
							allowDownloads={ values.allowDownloads }
							onChange={ update }
						/>
						<VideoInfoCard video={ video } onManageSubtitles={ onManageCaptions } />
						<RatingCard value={ values.rating } onChange={ onRatingChange } />
					</aside>
				</div>
			</div>
			<ChaptersHelpModal isOpen={ chaptersOpen } onClose={ closeChapters } />
		</AdminPage>
	);
};

type StageReadyProps = { video: LibraryItem };

// Per-video id so the settle notices replace the in-progress snackbar in
// place (the notices store drops an existing notice with the same id on
// create) instead of stacking a second notice next to it. Keyed by video id
// so two overlapping deletes — start one, navigate away mid-flight, delete
// another — can't clobber each other's notices.
const deletingNoticeId = ( videoId: string ) => `vp-video-deleting-${ videoId }`;

const StageReady = ( { video }: StageReadyProps ) => {
	const navigate = useNavigate();
	const invalidateVideo = useInvalidateVideo();
	const { mutate: updateMeta, isPending: isSaving } = useUpdateVideoMeta();
	const { syncChapters } = useUpdateChapters();
	const { mutateAsync: deleteVideo, isPending: isDeleting } = useDeleteVideo();
	const { createSuccessNotice, createErrorNotice, createInfoNotice } = useGlobalNotices();
	const [ chaptersOpen, setChaptersOpen ] = useState( false );
	const [ captionsOpen, setCaptionsOpen ] = useState( false );
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

	return (
		<>
			<Editor
				video={ video }
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
								createSuccessNotice( __( 'Video details saved.', 'jetpack-videopress-pkg' ) );
								reset( values );
							},
							onError: () => {
								createErrorNotice(
									__( 'Failed to save video details.', 'jetpack-videopress-pkg' )
								);
							},
						}
					);
				} }
				onDelete={ () => {
					if ( isDeleting ) {
						return;
					}
					// Deleting can take several seconds (the backend also removes the
					// remote VideoPress copy); surface progress immediately so the
					// action doesn't feel frozen. `explicitDismiss` keeps the snackbar
					// from auto-expiring before the request settles.
					createInfoNotice( __( 'Deleting video…', 'jetpack-videopress-pkg' ), {
						id: deletingNoticeId( video.id ),
						explicitDismiss: true,
					} );
					// Promise chain rather than mutate-level callbacks: those are
					// dropped when the component unmounts mid-flight, which would
					// orphan the explicitDismiss notice above forever.
					deleteVideo( Number( video.id ) )
						.then( () => {
							createSuccessNotice( __( 'Video deleted.', 'jetpack-videopress-pkg' ), {
								id: deletingNoticeId( video.id ),
							} );
							if ( isMountedRef.current ) {
								navigate( { href: '/' } );
							}
						} )
						.catch( () => {
							createErrorNotice( __( 'Failed to delete video.', 'jetpack-videopress-pkg' ), {
								id: deletingNoticeId( video.id ),
							} );
						} );
				} }
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
		</>
	);
};

const StageInner = () => {
	const { id } = useParams( { from: '/video/$id' } );
	const { video, isLoading } = useVideo( id );

	if ( isLoading ) {
		return <Loading />;
	}

	if ( ! video || ! isEditable( video ) ) {
		return <NotFound />;
	}

	return <StageReady video={ video } />;
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
