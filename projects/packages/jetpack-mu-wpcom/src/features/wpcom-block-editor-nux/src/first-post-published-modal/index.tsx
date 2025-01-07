import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';
import React from 'react';
import postPublishedImage from '../../../../assets/images/post-published.svg';
import { useSiteIntent, useShouldShowFirstPostPublishedModal } from '../../../../common/tour-kit';
import { wpcomTrackEvent } from '../../../../common/tracks';
import NuxModal from '../nux-modal';

import './style.scss';

type CoreEditorPlaceholder = {
	getCurrentPost: ( ...args: unknown[] ) => { link: string };
	getCurrentPostType: ( ...args: unknown[] ) => string;
	isCurrentPostPublished: ( ...args: unknown[] ) => boolean;
};

/**
 * Show the first post publish modal
 * @return {JSX.Element | null} The modal component or null.
 */
const FirstPostPublishedModalInner: React.FC = () => {
	const { link } = useSelect(
		select => ( select( 'core/editor' ) as CoreEditorPlaceholder ).getCurrentPost(),
		[]
	);
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
	const [ isOpen, setIsOpen ] = useState( false );
	const closeModal = () => setIsOpen( false );

	const { siteUrlOption, launchpadScreenOption, siteIntentOption } = window?.launchpadOptions || {};

	let siteUrl = '';
	if ( isURL( siteUrlOption ) ) {
		// https://mysite.wordpress.com/path becomes mysite.wordpress.com
		siteUrl = new URL( siteUrlOption ).hostname;
	}

	useEffect( () => {
		// If the user is set to see the first post modal and current post status changes to publish,
		// open the post publish modal
		if (
			shouldShowFirstPostPublishedModal &&
			! previousIsCurrentPostPublished.current &&
			isCurrentPostPublished &&
			postType === 'post'
		) {
			previousIsCurrentPostPublished.current = isCurrentPostPublished;

			// When the post published panel shows, it is focused automatically.
			// Thus, we need to delay open the modal so that the modal would not be close immediately
			// because the outside of modal is focused
			window.setTimeout( () => {
				setIsOpen( true );
			} );
		}
	}, [ postType, shouldShowFirstPostPublishedModal, isCurrentPostPublished ] );

	const handleViewPostClick = ( event: React.MouseEvent ) => {
		event.preventDefault();
		( window.top as Window ).location.href = link;
	};

	const handleNextStepsClick = ( event: React.MouseEvent ) => {
		event.preventDefault();
		(
			window.top as Window
		 ).location.href = `https://wordpress.com/setup/write/launchpad?siteSlug=${ siteUrl }`;
	};
	return (
		<NuxModal
			isOpen={ isOpen }
			className="wpcom-block-editor-post-published-modal"
			title={ __( 'Your first post is published!', 'jetpack-mu-wpcom' ) }
			description={ __(
				'Congratulations! You did it. View your post to see how it will look on your site.',
				'jetpack-mu-wpcom'
			) }
			imageSrc={ postPublishedImage }
			actionButtons={
				<>
					<Button variant="primary" onClick={ handleViewPostClick }>
						{ __( 'View Post', 'jetpack-mu-wpcom' ) }
					</Button>
					{ launchpadScreenOption === 'full' && siteIntentOption === 'write' && (
						<Button variant="secondary" onClick={ handleNextStepsClick }>
							{ __( 'Next Steps', 'jetpack-mu-wpcom' ) }
						</Button>
					) }
				</>
			}
			onRequestClose={ closeModal }
			onOpen={ () => wpcomTrackEvent( 'calypso_editor_wpcom_first_post_published_modal_show' ) }
		/>
	);
};

const FirstPostPublishedModal = () => {
	const { siteIntent: intent } = useSiteIntent();
	if ( intent === 'write' ) {
		return <FirstPostPublishedModalInner />;
	}
	return null;
};

export default FirstPostPublishedModal;
