import apiFetch from '@wordpress/api-fetch';
import { Button, Modal, TextControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { PluginMoreMenuItem } from '@wordpress/edit-post';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const PreviewEmail = ( { postId } ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ emailSent, setEmailSent ] = useState( false );

	return (
		<>
			<PluginMoreMenuItem onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Send test email', 'jetpack' ) }
			</PluginMoreMenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Send a test email', 'jetpack' ) }
					onRequestClose={ () => setIsModalOpen( false ) }
				>
					{ emailSent ? (
						<p>{ __( 'Email sent successfully', 'jetpack' ) }</p>
					) : (
						<>
							<TextControl
								value={ window?.Jetpack_Editor_Initial_State?.tracksUserData?.email }
								disabled={ true }
							/>
							<Button
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
						</>
					) }
				</Modal>
			) }
		</>
	);
};

export default compose( [
	withSelect( select => {
		return {
			postId: select( 'core/editor' ).getCurrentPostId(),
		};
	} ),
] )( PreviewEmail );
