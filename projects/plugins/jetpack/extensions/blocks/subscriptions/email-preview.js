import apiFetch from '@wordpress/api-fetch';
import { Button, Flex, FlexItem, Modal, TextControl, Icon } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './email-preview.scss';
import { check } from '@wordpress/icon';
import illustration from './email-preview-illustration.svg';

export default function EmailPreview() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ emailSent, setEmailSent ] = useState( false );
	const [ emailSending, setEmailSending ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( false );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	const sendEmailPreview = () => {
		setEmailSending( true );
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
			<FlexItem>
				<Button variant="primary" onClick={ () => setIsModalOpen( true ) }>
					{ __( 'Send test email', 'jetpack' ) }
				</Button>
			</FlexItem>
			{ isModalOpen && (
				<Modal
					className="jetpack-email-preview"
					title={ __( 'Send a test email', 'jetpack' ) }
					onRequestClose={ () => setIsModalOpen( false ) }
				>
					{ errorMessage && (
						<Flex>
							<FlexItem className="jetpack-email-preview__email-sent">{ errorMessage }</FlexItem>
						</Flex>
					) }
					{ emailSent ? (
						<Flex>
							<FlexItem className="jetpack-email-preview__email-sent">
								<Icon className="jetpack-email-preview__check" icon={ check } />
								{ __( 'Email sent successfully', 'jetpack' ) }
							</FlexItem>
						</Flex>
					) : (
						<Flex>
							<FlexItem>
								<TextControl
									className="jetpack-email-preview__email"
									value={ window?.Jetpack_Editor_Initial_State?.tracksUserData?.email }
									disabled
								/>
							</FlexItem>
							<FlexItem>
								<Button
									className="jetpack-email-preview__button"
									variant="primary"
									onClick={ sendEmailPreview }
									isBusy={ emailSending }
								>
									{ __( 'Send', 'jetpack' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<img className="jetpack-email-preview__img" src={ illustration } alt="" />
							</FlexItem>
						</Flex>
					) }
				</Modal>
			) }
		</>
	);
}
