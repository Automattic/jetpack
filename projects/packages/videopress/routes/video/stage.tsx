import AdminPage from '@automattic/jetpack-components/admin-page';
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate, useParams } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import ChaptersHelpModal from '../../src/dashboard/components/video-details/chapters-help-modal';
import HeaderActions from '../../src/dashboard/components/video-details/header-actions';
import PrivacySharingCard from '../../src/dashboard/components/video-details/privacy-sharing-card';
import RatingCard from '../../src/dashboard/components/video-details/rating-card';
import ThumbnailCard from '../../src/dashboard/components/video-details/thumbnail-card';
import { useVideoDetailsForm } from '../../src/dashboard/components/video-details/use-video-details-form';
import VideoDetailsCard from '../../src/dashboard/components/video-details/video-details-card';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useVideo } from '../../src/dashboard/hooks/use-video';
import './style.scss';
import type { LibraryItem, VideoRating } from '../../src/dashboard/types/library';

const isEditable = ( item: LibraryItem ): boolean =>
	item.type === 'videopress' && item.upload.status !== 'failed';

/**
 * Parent breadcrumb item — labelled "VideoPress" in every case, but the
 * link target depends on where the user arrived from. The Stats tab's
 * ranking links tag their navigation with `state: { from: 'overview' }`;
 * we read that here so the breadcrumb routes back to the Stats tab
 * (`/stats`) instead of defaulting to the Videos tab (`/`). TanStack stores
 * user state on `window.history.state`, so reading it directly avoids needing
 * `useLocation` (which `@wordpress/route` doesn't re-export from TanStack).
 * Stable for the lifetime of the mount, so no reactivity hook is needed.
 *
 * @return The parent breadcrumb item.
 */
const getParentBreadcrumbItem = (): { label: string; to: string } => {
	const from = ( window.history.state as { from?: string } | null )?.from;
	return { label: 'VideoPress', to: from === 'overview' ? '/stats' : '/' };
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
				<Link to="/">{ __( 'Back to Videos', 'jetpack-videopress-pkg' ) }</Link>
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
	onAddToNewPost: () => void;
	chaptersOpen: boolean;
	setChaptersOpen: ( open: boolean ) => void;
};

const Editor = ( {
	video,
	onSave,
	isSaving,
	onDelete,
	onDownload,
	onAddToNewPost,
	chaptersOpen,
	setChaptersOpen,
}: EditorProps ) => {
	const { values, update, isDirty, reset } = useVideoDetailsForm( video );

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

	return (
		<AdminPage
			breadcrumbs={
				<Breadcrumbs items={ [ getParentBreadcrumbItem(), { label: video.title } ] } />
			}
			actions={
				<HeaderActions
					canSave={ isDirty && ! isSaving }
					onSave={ handleSave }
					onDownload={ onDownload }
					onDelete={ onDelete }
				/>
			}
		>
			<div className="vp-video-details">
				<ThumbnailCard video={ video } onAddToNewPost={ onAddToNewPost } />
				<VideoDetailsCard
					title={ values.title }
					description={ values.description }
					onChange={ update }
					onOpenChapters={ openChapters }
				/>
				<PrivacySharingCard
					privacy={ values.privacy }
					displayEmbed={ values.displayEmbed }
					allowDownloads={ values.allowDownloads }
					onChange={ update }
				/>
				<RatingCard value={ values.rating } onChange={ onRatingChange } />
			</div>
			<ChaptersHelpModal isOpen={ chaptersOpen } onClose={ closeChapters } />
		</AdminPage>
	);
};

type StageReadyProps = { video: LibraryItem };

const StageReady = ( { video }: StageReadyProps ) => {
	const navigate = useNavigate();
	const { mutate: updateMeta, isPending: isSaving } = useUpdateVideoMeta();
	const { mutate: deleteVideo } = useDeleteVideo();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const [ chaptersOpen, setChaptersOpen ] = useState( false );

	return (
		<Editor
			video={ video }
			isSaving={ isSaving }
			onSave={ ( values, reset ) => {
				updateMeta(
					{ id: video.id, patch: values },
					{
						onSuccess: () => {
							createSuccessNotice( __( 'Video details saved.', 'jetpack-videopress-pkg' ) );
							reset( values );
						},
						onError: () => {
							createErrorNotice( __( 'Failed to save video details.', 'jetpack-videopress-pkg' ) );
						},
					}
				);
			} }
			onDelete={ () => {
				deleteVideo( Number( video.id ), {
					onSuccess: () => {
						createSuccessNotice( __( 'Video deleted.', 'jetpack-videopress-pkg' ) );
						navigate( { href: '/' } );
					},
					onError: () => {
						createErrorNotice( __( 'Failed to delete video.', 'jetpack-videopress-pkg' ) );
					},
				} );
			} }
			onDownload={ () => {
				if ( video.sourceUrl ) {
					window.open( video.sourceUrl, '_blank' );
				}
			} }
			onAddToNewPost={ () => {
				const nonce =
					typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
						? JPVIDEOPRESS_INITIAL_STATE?.API?.contentNonce
						: undefined;
				if ( ! video.guid || ! nonce ) {
					return;
				}
				const url = addQueryArgs( 'post-new.php', {
					videopress_guid: video.guid,
					_wpnonce: nonce,
				} );
				window.open( url, '_blank' );
			} }
			chaptersOpen={ chaptersOpen }
			setChaptersOpen={ setChaptersOpen }
		/>
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
