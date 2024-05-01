/**
 * External dependencies
 */
import { AiStatusIndicator, RequestingStateProp } from '@automattic/jetpack-ai-client';
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import './style.scss';

const ModalHeader = ( {
	requestingState,
	onClose,
	title,
}: {
	requestingState: RequestingStateProp;
	onClose: () => void;
	title: string;
} ) => {
	return (
		<div className="ai-assistant-modal__header">
			<div className="ai-assistant-modal__title-wrapper">
				<AiStatusIndicator state={ requestingState } />
				<h1 className="ai-assistant-modal__title">{ title }</h1>
			</div>
			<Button icon={ close } label={ __( 'Close', 'jetpack' ) } onClick={ onClose } />
		</div>
	);
};

export default function AiAssistantModal( {
	children,
	handleClose,
	hideHeader = true,
	requestingState = 'init',
	title = __( 'AI Assistant', 'jetpack' ),
	maxWidth = 720,
}: {
	children: React.ReactNode;
	handleClose: () => void;
	hideHeader?: boolean;
	requestingState?: RequestingStateProp;
	title?: string;
	maxWidth?: number;
} ) {
	return (
		<Modal
			__experimentalHideHeader={ hideHeader }
			className="ai-assistant-modal"
			shouldCloseOnClickOutside={ false }
			onRequestClose={ handleClose }
		>
			<div className="ai-assistant-modal__content" style={ { maxWidth } }>
				<ModalHeader requestingState={ requestingState } onClose={ handleClose } title={ title } />
				<hr className="ai-assistant-modal__divider" />
				{ children }
			</div>
		</Modal>
	);
}
