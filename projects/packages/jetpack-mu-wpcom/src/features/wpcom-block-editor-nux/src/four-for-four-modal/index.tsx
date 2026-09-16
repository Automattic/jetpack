import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import postPublishedImage from '../../../../assets/images/post-published.svg';
import { useFourForFour } from '../../../../common/tour-kit';
import { wpcomTrackEvent } from '../../../../common/tracks';
import NuxModal from '../nux-modal';
import type { FC } from 'react';

import './style.scss';

const READER_URL = 'https://wordpress.com/reader/four-for-four?source=editor';

// Longest we hold the redirect while the opt-in is being recorded.
const OPT_IN_REDIRECT_DELAY_MS = 1500;

type CoreEditorPlaceholder = {
	getCurrentPostType: ( ...args: unknown[] ) => string;
	isCurrentPostPublished: ( ...args: unknown[] ) => boolean;
};

/**
 * Offer the "4 for 4" program right after a site's first post is published.
 * @return {JSX.Element | null} The modal component or null.
 */
const FourForFourModal: FC = () => {
	const { eligible } = useFourForFour();
	const { setFourForFourStatus } = useDispatch( 'automattic/wpcom-welcome-guide' );

	const postType = useSelect(
		select => ( select( 'core/editor' ) as CoreEditorPlaceholder ).getCurrentPostType(),
		[]
	);
	const isCurrentPostPublished = useSelect(
		select => ( select( 'core/editor' ) as CoreEditorPlaceholder ).isCurrentPostPublished(),
		[]
	);

	const [ isOpen, setIsOpen ] = useState( false );
	const previousIsCurrentPostPublished = useRef( isCurrentPostPublished );

	useEffect( () => {
		if (
			eligible &&
			! previousIsCurrentPostPublished.current &&
			isCurrentPostPublished &&
			postType === 'post'
		) {
			previousIsCurrentPostPublished.current = isCurrentPostPublished;

			// The post published panel takes focus when it appears; opening on the
			// next tick keeps the modal from closing on that outside focus.
			window.setTimeout( () => {
				setIsOpen( true );
			} );
		}
	}, [ eligible, isCurrentPostPublished, postType ] );

	const handleOptIn = () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_four_for_four_opt_in' );

		// Give the opt-in write a moment to land before leaving the editor, but
		// never keep the writer waiting on it.
		let redirected = false;
		const redirect = () => {
			if ( ! redirected ) {
				redirected = true;
				( window.top as Window ).location.href = READER_URL;
			}
		};
		window.setTimeout( redirect, OPT_IN_REDIRECT_DELAY_MS );
		setFourForFourStatus( 'opted_in', { onSettled: redirect } );
	};

	const handleOptOut = () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_four_for_four_opt_out' );
		setFourForFourStatus( 'opted_out' );
		setIsOpen( false );
	};

	const handleDismiss = () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_four_for_four_dismiss' );
		setIsOpen( false );
	};

	return (
		<NuxModal
			isOpen={ isOpen }
			className="wpcom-block-editor-four-for-four-modal"
			title={ __( 'Want your first 4 subscribers?', 'jetpack-mu-wpcom' ) }
			description={ __(
				'Subscribe to 4 other new writers and we’ll put your site in front of other new writers looking for theirs. It takes about two minutes.',
				'jetpack-mu-wpcom'
			) }
			imageSrc={ postPublishedImage }
			actionButtons={
				<>
					<Button variant="primary" onClick={ handleOptIn }>
						{ __( 'Count me in', 'jetpack-mu-wpcom' ) }
					</Button>
					<Button variant="secondary" onClick={ handleOptOut }>
						{ __( 'No thanks', 'jetpack-mu-wpcom' ) }
					</Button>
				</>
			}
			onRequestClose={ handleDismiss }
			onOpen={ () => wpcomTrackEvent( 'calypso_editor_wpcom_four_for_four_modal_show' ) }
		/>
	);
};

export default FourForFourModal;
