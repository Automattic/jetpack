import { Button, Modal, TextControl } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { PluginMoreMenuItem } from '@wordpress/edit-post';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const PreviewEmail = ( { userEmail } ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

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
					<TextControl value={ userEmail } disabled={ true } />
					<Button
						isPrimary
						onClick={ () => {
							// Call the wpcom endpoint here.
							setIsModalOpen( false );
						} }
					>
						Call WPCOM Endpoint
					</Button>
				</Modal>
			) }
		</>
	);
};

export default withSelect( select => {
	const { getCurrentUser } = select( 'core' );
	const currentUser = getCurrentUser();

	return {
		userEmail: currentUser ? currentUser.email : '',
	};
} )( PreviewEmail );
