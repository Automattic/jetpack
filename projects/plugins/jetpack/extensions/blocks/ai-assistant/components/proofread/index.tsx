/**
 * External dependencies
 */
import { Modal, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export function Proofread() {
	const [ isProofreadModalVisible, setIsProofreadModalVisible ] = useState( false );
	const toogleProofreadModal = () => {
		setIsProofreadModalVisible( ! isProofreadModalVisible );
	};

	return (
		<div>
			{ isProofreadModalVisible && (
				<Modal title={ __( 'AI Assistant', 'jetpack' ) } onRequestClose={ toogleProofreadModal }>
					<p>{ __( 'AI Assistant', 'jetpack' ) }</p>
				</Modal>
			) }
			<p>
				{ __(
					'Check for mistakes and verify the tone of your post before publishing.',
					'jetpack'
				) }
			</p>
			<Button onClick={ toogleProofreadModal } variant="secondary">
				{ __( 'Proofread post', 'jetpack' ) }
			</Button>
		</div>
	);
}
