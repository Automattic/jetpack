import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import postPublishedImage from '../../../../assets/images/post-published.svg';
import { isFourForFourPreview, useJustPublishedPost } from '../../../../common/tour-kit';
import { wpcomTrackEvent } from '../../../../common/tracks';
import NuxModal from '../nux-modal';
import type { FC } from 'react';

const READER_URL = 'https://wordpress.com/reader/four-for-four?source=editor';

// Longest we hold the redirect while the opt-in is being recorded.
const OPT_IN_REDIRECT_DELAY_MS = 1500;

/**
 * Offer the "4 for 4" program right after a site's first post is published.
 * Rendered only when the site is eligible; see block-editor-nux.jsx.
 * @return {JSX.Element} The modal component.
 */
const FourForFourModal: FC = () => {
	const { setFourForFourStatus } = useDispatch( 'automattic/wpcom-welcome-guide' );
	const justPublished = useJustPublishedPost();
	// `?four-for-four=preview` opens the modal on load so the prompt can be
	// tested without publishing a first post.
	const [ isOpen, setIsOpen ] = useState( isFourForFourPreview() );

	useEffect( () => {
		if ( justPublished ) {
			setIsOpen( true );
		}
	}, [ justPublished ] );

	const handleOptIn = () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_four_for_four_opt_in' );
		const timeout = new Promise( resolve =>
			window.setTimeout( resolve, OPT_IN_REDIRECT_DELAY_MS )
		);
		Promise.race( [ setFourForFourStatus( 'opted_in' ), timeout ] ).then( () => {
			( window.top as Window ).location.href = READER_URL;
		} );
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
			className="wpcom-block-editor-post-published-modal wpcom-block-editor-four-for-four-modal"
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
