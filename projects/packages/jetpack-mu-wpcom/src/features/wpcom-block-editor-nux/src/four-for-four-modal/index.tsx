import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import postPublishedImage from '../../../../assets/images/post-published.svg';
import { isFourForFourPreview, useJustPublishedPost } from '../../../../common/tour-kit';
import { wpcomTrackEvent } from '../../../../common/tracks';
import NuxModal from '../nux-modal';
import type { JSX, FC } from 'react';

const READER_URL = 'https://wordpress.com/reader/four-for-four?source=editor';

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
	const [ isOptingIn, setIsOptingIn ] = useState( false );
	const [ hasOptInError, setHasOptInError ] = useState( false );

	useEffect( () => {
		if ( justPublished ) {
			setIsOpen( true );
		}
	}, [ justPublished ] );

	const handleOptIn = async () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_four_for_four_opt_in' );
		setIsOptingIn( true );
		setHasOptInError( false );
		if ( await setFourForFourStatus( 'opted_in' ) ) {
			( window.top as Window ).location.href = READER_URL;
			return;
		}
		setIsOptingIn( false );
		setHasOptInError( true );
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
					{ hasOptInError && (
						<p className="wpcom-block-editor-four-for-four-modal__error" role="alert">
							{ __( 'We couldn’t save your choice. Please try again.', 'jetpack-mu-wpcom' ) }
						</p>
					) }
					<Button
						variant="primary"
						onClick={ handleOptIn }
						isBusy={ isOptingIn }
						disabled={ isOptingIn }
					>
						{ __( 'Count me in', 'jetpack-mu-wpcom' ) }
					</Button>
					<Button variant="secondary" onClick={ handleOptOut } disabled={ isOptingIn }>
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
