/**
 * External dependencies
 */
import { Modal, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function Proofread() {
	const [ isProofreadModalVisible, setIsProofreadModalVisible ] = useState( false );
	const toggleProofreadModal = () => {
		setIsProofreadModalVisible( ! isProofreadModalVisible );
	};

	return (
		<div>
			{ isProofreadModalVisible && (
				<Modal title={ __( 'AI Assistant', 'jetpack' ) } onRequestClose={ toggleProofreadModal }>
					<p>{ __( 'AI Assistant', 'jetpack' ) }</p>
				</Modal>
			) }
			<p>
				{ __(
					'Check for mistakes and verify the tone of your post before publishing.',
					'jetpack'
				) }
			</p>
			<Button onClick={ toggleProofreadModal } variant="secondary">
				{ __( 'Proofread post', 'jetpack' ) }
			</Button>
		</div>
	);
}
