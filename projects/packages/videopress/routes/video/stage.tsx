import AdminPage from '@automattic/jetpack-components/admin-page';
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate, useParams } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';
import QueryClientWrapper from '../../src/dashboard/components/QueryClientWrapper';
import ChaptersHelpModal from '../../src/dashboard/components/VideoDetails/chapters-help-modal';
import HeaderActions from '../../src/dashboard/components/VideoDetails/header-actions';
import PrivacySharingCard from '../../src/dashboard/components/VideoDetails/privacy-sharing-card';
import RatingCard from '../../src/dashboard/components/VideoDetails/rating-card';
import ThumbnailCard from '../../src/dashboard/components/VideoDetails/thumbnail-card';
import { useVideoDetailsForm } from '../../src/dashboard/components/VideoDetails/use-video-details-form';
import VideoDetailsCard from '../../src/dashboard/components/VideoDetails/video-details-card';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useVideo } from '../../src/dashboard/hooks/use-video';
import './style.scss';
import type { MockLibraryItem, VideoRating } from '../../src/dashboard/types/library';

const isEditable = ( item: MockLibraryItem ): boolean =>
	item.type === 'videopress' && item.upload.status !== 'failed';

const NotFound = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: 'VideoPress', to: '/library' },
					{ label: __( 'Not found', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-video-details vp-video-details__not-found">
			<Stack direction="column" gap="md" align="center">
				<Text>{ __( "We couldn't find that video.", 'jetpack-videopress-pkg' ) }</Text>
				<Link to="/library">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
		</div>
	</AdminPage>
);

type EditorProps = {
	video: MockLibraryItem;
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
				<Breadcrumbs
					items={ [ { label: 'VideoPress', to: '/library' }, { label: video.title } ] }
				/>
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

const guidFromShortcode = ( shortcode?: string ): string | undefined => {
	const match = shortcode?.match( /\[videopress ([^\]]+)\]/ );
	return match?.[ 1 ];
};

type StageReadyProps = { video: MockLibraryItem };

const StageReady = ( { video }: StageReadyProps ) => {
	const navigate = useNavigate();
	const { mutate: updateMeta, isPending: isSaving } = useUpdateVideoMeta();
	const { mutate: deleteVideo } = useDeleteVideo();
	const { createSuccessNotice } = useGlobalNotices();
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
					}
				);
			} }
			onDelete={ () => {
				deleteVideo( Number( video.id ), {
					onSuccess: () => {
						createSuccessNotice( __( 'Video deleted.', 'jetpack-videopress-pkg' ) );
						navigate( { href: '/library' } );
					},
				} );
			} }
			onDownload={ () => {
				if ( video.sourceUrl ) {
					window.open( video.sourceUrl, '_blank' );
				}
			} }
			onAddToNewPost={ () => {
				const guid = guidFromShortcode( video.shortcode );
				if ( guid ) {
					window.location.href = `post-new.php?videopress=${ guid }`;
				}
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
		return null;
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
