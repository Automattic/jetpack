import { useBreakpointMatch } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalVStack as VStack,
	Modal,
	TextControl,
	Icon,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './email-preview.scss';
import { check } from '@wordpress/icons';
import illustration from './email-preview-illustration.svg';

export default function EmailPreview( { isModalOpen, closeModal } ) {
	const [ emailSent, setEmailSent ] = useState( false );
	const [ emailSending, setEmailSending ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );
	const { __unstableSaveForPreview } = useDispatch( editorStore );
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const { tracks } = useAnalytics();

	const sendEmailPreview = async () => {
		tracks.recordEvent( 'jetpack_send_email_preview', {
			post_id: postId,
		} );

		setEmailSending( true );

		// Save post revision so that we send what they see in the editor, and not what previous draft/revision might've saved
		// Introduced at GB 16.3 at https://github.com/WordPress/gutenberg/pull/44971
		// @todo Remove the `if` check once WP 6.4 is the minimum supported version
		if ( typeof __unstableSaveForPreview === 'function' ) {
			await __unstableSaveForPreview();
		}

		apiFetch( {
			path: '/wpcom/v2/send-email-preview/',
			method: 'POST',
			data: {
				id: postId,
			},
		} )
			.then( () => {
				setEmailSending( false );
				setEmailSent( true );
			} )
			.catch( e => {
				setEmailSending( false );
				if ( e.message ) {
					setErrorMessage( e.message );
				} else {
					setErrorMessage(
						__( 'Whoops, we have encountered an error. Please try again later.', 'jetpack' )
					);
				}
			} );
	};

	return (
		<>
			{ isModalOpen && (
				<Modal
					className="jetpack-email-preview"
					onRequestClose={ () => {
						closeModal();
						setEmailSent( false );
					} }
				>
					<HStack alignment="topLeft">
						<VStack className="jetpack-email-preview__main" alignment="topLeft">
							<h1 className="jetpack-email-preview__title">
								{ __( 'Send a test email', 'jetpack' ) }
							</h1>
							{ errorMessage && (
								<HStack className="jetpack-email-preview__email-sent">{ errorMessage }</HStack>
							) }
							{ emailSent ? (
								<HStack className="jetpack-email-preview__email-sent">
									<Icon className="jetpack-email-preview__check" icon={ check } size={ 28 } />
									<div className="jetpack-email-preview__sent_text">
										{ __( 'Email sent successfully', 'jetpack' ) }
									</div>
								</HStack>
							) : (
								<HStack>
									<TextControl
										className="jetpack-email-preview__email"
										value={ window?.Jetpack_Editor_Initial_State?.tracksUserData?.email }
										disabled
									/>
									<Button
										className="jetpack-email-preview__button"
										variant="primary"
										onClick={ sendEmailPreview }
										isBusy={ emailSending }
									>
										{ __( 'Send', 'jetpack' ) }
									</Button>
								</HStack>
							) }
						</VStack>
						{ ! isSmall && (
							<img className="jetpack-email-preview__img" src={ illustration } alt="" />
						) }
					</HStack>
				</Modal>
			) }
		</>
	);
}
