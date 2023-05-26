import apiFetch from '@wordpress/api-fetch';
import { Button, Flex, FlexBlock, FlexItem, Modal, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './email-preview.scss';

export default function EmailPreview() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ emailSent, setEmailSent ] = useState( false );
	const postId = useSelect( select => select( 'core/editor' ).getCurrentPostId() );

	return (
		<>
			<FlexItem>
				<Button isPrimary onClick={ () => setIsModalOpen( true ) }>
					{ __( 'Send test email', 'jetpack' ) }
				</Button>
			</FlexItem>
			{ isModalOpen && (
				<Modal
					className="jetpack-send-email-preview-modal"
					title={ __( 'Send a test email', 'jetpack' ) }
					onRequestClose={ () => setIsModalOpen( false ) }
				>
					{ emailSent ? (
						<p>{ __( 'Email sent successfully', 'jetpack' ) }</p>
					) : (
						<Flex>
							<FlexBlock>
								<TextControl
									className="email-field"
									value={ window?.Jetpack_Editor_Initial_State?.tracksUserData?.email }
									disabled={ true }
								/>
							</FlexBlock>
							<FlexItem>
								<Button
									className="send-button"
									isPrimary
									onClick={ () => {
										apiFetch( {
											path: '/wpcom/v2/send-email-preview/',
											method: 'POST',
											data: {
												id: postId,
											},
										} )
											.then( () => {
												// Handle response here
												setEmailSent( true );
											} )
											.catch( () => {
												// Handle error here
											} );
									} }
								>
									{ __( 'Send', 'jetpack' ) }
								</Button>
							</FlexItem>
						</Flex>
					) }
				</Modal>
			) }
		</>
	);
}
