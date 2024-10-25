import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import videoSuccessImage from '../../../../assets/images/video-success.svg';
import {
	useShouldShowVideoCelebrationModal,
	useSiteIntent,
	useHasSeenVideoCelebrationModal,
} from '../../../../common/tour-kit';
import NuxModal from '../nux-modal';
import './style.scss';

// Shows a celebration modal after a video is first uploaded to a site and the editor is saved.
const VideoCelebrationModalInner = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ hasDisplayedModal, setHasDisplayedModal ] = useState( false );
	const isSiteEditor = useSelect( select => !! select( 'core/edit-site' ) );
	const previousIsEditorSaving = useRef( false );
	const { updateHasSeenVideoCelebrationModal } = useHasSeenVideoCelebrationModal();

	const { isEditorSaving } = useSelect( select => {
		if ( isSiteEditor ) {
			const isSavingSite =
				select( 'core' ).isSavingEntityRecord( 'root', 'site' ) &&
				! select( 'core' ).isAutosavingEntityRecord( 'root', 'site' );

			const page = select( 'core/edit-site' ).getPage();
			const pageId = parseInt( page?.context?.postId );
			const isSavingEntity =
				select( 'core' ).isSavingEntityRecord( 'postType', 'page', pageId ) &&
				! select( 'core' ).isAutosavingEntityRecord( 'postType', 'page', pageId );
			const pageEntity = select( 'core' ).getEntityRecord( 'postType', 'page', pageId );

			return {
				isEditorSaving: isSavingSite || isSavingEntity,
				linkUrl: pageEntity?.link,
			};
		}

		const currentPost = select( 'core/editor' ).getCurrentPost();
		const isSavingEntity =
			select( 'core' ).isSavingEntityRecord( 'postType', currentPost?.type, currentPost?.id ) &&
			! select( 'core' ).isAutosavingEntityRecord( 'postType', currentPost?.type, currentPost?.id );

		return {
			isEditorSaving: isSavingEntity,
		};
	} );
	const shouldShowVideoCelebrationModal = useShouldShowVideoCelebrationModal( isEditorSaving );

	useEffect( () => {
		// Conditions to show modal:
		// - user just finished saving
		// - celebration modal hasn't been viewed/isn't visible
		// - site intent is 'videopress'
		// - site has uploaded a video
		if (
			! isEditorSaving &&
			previousIsEditorSaving.current &&
			! hasDisplayedModal &&
			shouldShowVideoCelebrationModal
		) {
			setIsModalOpen( true );
			setHasDisplayedModal( true );
			updateHasSeenVideoCelebrationModal( true );
		}
		previousIsEditorSaving.current = isEditorSaving;
	}, [
		isEditorSaving,
		hasDisplayedModal,
		shouldShowVideoCelebrationModal,
		updateHasSeenVideoCelebrationModal,
	] );

	const closeModal = () => setIsModalOpen( false );
	return (
		<NuxModal
			isOpen={ isModalOpen }
			className="wpcom-site-editor-video-celebration-modal"
			title={ __( 'You’ve added your first video!', 'jetpack-mu-wpcom' ) }
			description={ __(
				'Feel free to keep editing your homepage, or continue and launch your site.',
				'jetpack-mu-wpcom'
			) }
			imageSrc={ videoSuccessImage }
			actionButtons={
				<>
					<Button onClick={ closeModal }>{ __( 'Keep editing', 'jetpack-mu-wpcom' ) }</Button>
					<Button
						isPrimary
						href={ `https://wordpress.com/setup/videopress/launchpad?siteSlug=${ window.location.hostname }` }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Continue and launch', 'jetpack-mu-wpcom' ) }
					</Button>
				</>
			}
			onRequestClose={ closeModal }
		/>
	);
};

const VideoCelebrationModal = () => {
	const { siteIntent: intent } = useSiteIntent();
	if ( 'videopress' === intent ) {
		return <VideoCelebrationModalInner />;
	}
	return null;
};

export default VideoCelebrationModal;
