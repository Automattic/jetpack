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
import Editor, {
	getParentBreadcrumbItem,
} from '../../src/dashboard/components/video-details/editor';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useUpdateChapters } from '../../src/dashboard/hooks/use-update-chapters';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useInvalidateVideo, useVideo } from '../../src/dashboard/hooks/use-video';
import './style.scss';
import type { LibraryItem } from '../../src/dashboard/types/library';

const isEditable = ( item: LibraryItem ): boolean =>
	item.type === 'videopress' && item.upload.status !== 'failed';

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
