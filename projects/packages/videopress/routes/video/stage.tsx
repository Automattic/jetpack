import AdminPage from '@automattic/jetpack-components/admin-page';
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate, useParams } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';
import ChaptersHelpModal from '../../src/dashboard/components/VideoDetails/chapters-help-modal';
import HeaderActions from '../../src/dashboard/components/VideoDetails/header-actions';
import PrivacySharingCard from '../../src/dashboard/components/VideoDetails/privacy-sharing-card';
import RatingCard from '../../src/dashboard/components/VideoDetails/rating-card';
import ThumbnailCard from '../../src/dashboard/components/VideoDetails/thumbnail-card';
import { useVideoDetailsForm } from '../../src/dashboard/components/VideoDetails/use-video-details-form';
import VideoDetailsCard from '../../src/dashboard/components/VideoDetails/video-details-card';
import { useMockLibrary } from '../../src/dashboard/hooks/use-mock-library';
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
	updateVideoDetails: ReturnType< typeof useMockLibrary >[ 'updateVideoDetails' ];
	deleteItems: ReturnType< typeof useMockLibrary >[ 'deleteItems' ];
	createSuccessNotice: ReturnType< typeof useGlobalNotices >[ 'createSuccessNotice' ];
	navigate: ReturnType< typeof useNavigate >;
	chaptersOpen: boolean;
	setChaptersOpen: ( open: boolean ) => void;
};

const Editor = ( {
	video,
	updateVideoDetails,
	deleteItems,
	createSuccessNotice,
	navigate,
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

	const onSave = useCallback( () => {
		updateVideoDetails( video.id, values );
		createSuccessNotice( __( 'Video details saved.', 'jetpack-videopress-pkg' ) );
		reset( values );
	}, [ updateVideoDetails, video.id, values, createSuccessNotice, reset ] );

	const onDelete = useCallback( () => {
		deleteItems( [ video.id ] );
		createSuccessNotice( __( 'Video deleted.', 'jetpack-videopress-pkg' ) );
		navigate( { href: '/library' } );
	}, [ deleteItems, video.id, createSuccessNotice, navigate ] );

	const onDownload = useCallback( () => {
		// Phase 6 wires this to the real file URL.
	}, [] );

	const onAddToNewPost = useCallback( () => {
		// Phase 6 wires this to the real newPostURL.
	}, [] );

	return (
		<AdminPage
			breadcrumbs={
				<Breadcrumbs
					items={ [ { label: 'VideoPress', to: '/library' }, { label: video.title } ] }
				/>
			}
			actions={
				<HeaderActions
					canSave={ isDirty }
					onSave={ onSave }
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
					allowSharing={ values.allowSharing }
					allowDownloads={ values.allowDownloads }
					onChange={ update }
				/>
				<RatingCard value={ values.rating } onChange={ onRatingChange } />
			</div>
			<ChaptersHelpModal isOpen={ chaptersOpen } onClose={ closeChapters } />
		</AdminPage>
	);
};

const Stage = () => {
	const { id } = useParams( { from: '/video/$id' } );
	const navigate = useNavigate();
	const { items, updateVideoDetails, deleteItems } = useMockLibrary();
	const { createSuccessNotice } = useGlobalNotices();
	const [ chaptersOpen, setChaptersOpen ] = useState( false );

	const video = items.find( item => item.id === id );

	if ( ! video || ! isEditable( video ) ) {
		return <NotFound />;
	}

	return (
		<Editor
			video={ video }
			updateVideoDetails={ updateVideoDetails }
			deleteItems={ deleteItems }
			createSuccessNotice={ createSuccessNotice }
			navigate={ navigate }
			chaptersOpen={ chaptersOpen }
			setChaptersOpen={ setChaptersOpen }
		/>
	);
};

export { Stage as stage };
