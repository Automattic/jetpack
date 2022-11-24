import { Button } from '@wordpress/components';
// import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export function PromotePostButton() {
	const switchModal = () => {
		// console.log( 'open promoted posts modal' );
	};
	return (
		<div className="qr-post-button">
			<Button isSecondary onClick={ switchModal }>
				{ __( 'Promote Post', 'jetpack' ) }
			</Button>

			{ /*{ isModalOpen && (*/ }
			{ /*	<Modal*/ }
			{ /*		title={ __( 'QR Post code', 'jetpack' ) }*/ }
			{ /*		onRequestClose={ closeModal }*/ }
			{ /*		className="qr-post-modal"*/ }
			{ /*	>*/ }
			{ /*		<div className="qr-post-modal__qr-code" ref={ qrCodeRef }>*/ }
			{ /*			<QRPost />*/ }
			{ /*		</div>*/ }
			{ /*	</Modal>*/ }
			{ /*) }*/ }
		</div>
	);
}
