import { Modal } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import React from 'react';
import {
	START_WRITING_FLOW,
	DESIGN_FIRST_FLOW,
	useSiteIntent,
	useShouldShowSellerCelebrationModal,
	useShouldShowVideoCelebrationModal,
	useShouldShowFirstPostPublishedModal,
} from '../../../../common/tour-kit';
import { wpcomTrackEvent } from '../../../../common/tracks';
import SuggestedTags from './suggested-tags';
import useRecommendedTagsModalDismissed from './use-recommended-tags-modal-dismissed';

import './style.scss';

type CoreEditorPlaceholder = {
	getCurrentPost: ( ...args: unknown[] ) => {
		status: string;
		password: string;
	};
	getCurrentPostType: ( ...args: unknown[] ) => string;
	isCurrentPostPublished: ( ...args: unknown[] ) => boolean;
};

const RecommendedTagsModalInner: React.FC = () => {
	const isDismissedDefault = window?.recommendedTagsModalOptions?.isDismissed || false;
	const { launchpadScreenOption } = window?.launchpadOptions || {};
	const { isDismissed, updateIsDismissed } = useRecommendedTagsModalDismissed( isDismissedDefault );

	const postType = useSelect(
		select => ( select( 'core/editor' ) as CoreEditorPlaceholder ).getCurrentPostType(),
		[]
	);

	const isCurrentPostPublished = useSelect(
		select => ( select( 'core/editor' ) as CoreEditorPlaceholder ).isCurrentPostPublished(),
		[]
	);

	const previousIsCurrentPostPublished = useRef( isCurrentPostPublished );
	const shouldShowFirstPostPublishedModal = useShouldShowFirstPostPublishedModal();
	const shouldShowSellerCelebrationModal = useShouldShowSellerCelebrationModal();
	const shouldShowVideoCelebrationModal =
		useShouldShowVideoCelebrationModal( isCurrentPostPublished );

	const [ isOpen, setIsOpen ] = useState( false );
	const closeModal = () => setIsOpen( false );
	const [ shouldShowSuggestedTags, setShouldShowSuggestedTags ] = useState( true );

	useEffect( () => {
		// The first post will show a different modal.
		if (
			! shouldShowFirstPostPublishedModal &&
			! shouldShowSellerCelebrationModal &&
			! shouldShowVideoCelebrationModal &&
			launchpadScreenOption !== 'full' &&
			! previousIsCurrentPostPublished.current &&
			isCurrentPostPublished &&
			postType === 'post'
		) {
			previousIsCurrentPostPublished.current = isCurrentPostPublished;
			wpcomTrackEvent( 'calypso_editor_recommended_tags_dialog_show' );

			// Deprecated. Kept for backwards-compatibility.
			wpcomTrackEvent( 'calypso_editor_sharing_dialog_show' );

			// When the post published panel shows, it is focused automatically.
			// Thus, we need to delay open the modal so that the modal would not be close immediately
			// because the outside of modal is focused
			window.setTimeout( () => {
				setIsOpen( true );
			} );
		}
	}, [
		postType,
		shouldShowFirstPostPublishedModal,
		shouldShowSellerCelebrationModal,
		shouldShowVideoCelebrationModal,
		isCurrentPostPublished,
		launchpadScreenOption,
	] );

	if ( ! isOpen || ! shouldShowSuggestedTags || isDismissedDefault ) {
		return null;
	}

	return (
		<Modal
			className="wpcom-block-editor-post-published-recommended-tags-modal"
			title=""
			onRequestClose={ closeModal }
		>
			<div className="wpcom-block-editor-post-published-recommended-tags-modal__inner">
				<SuggestedTags
					setShouldShowSuggestedTags={ setShouldShowSuggestedTags }
					onDontShowAgainChange={ () => {
						updateIsDismissed( ! isDismissed );
					} }
				/>
			</div>
		</Modal>
	);
};

const RecommendedTagsModal = () => {
	const { siteIntent: intent } = useSiteIntent();
	if ( intent === START_WRITING_FLOW || intent === DESIGN_FIRST_FLOW ) {
		return null;
	}

	return <RecommendedTagsModalInner />;
};

export default RecommendedTagsModal;
