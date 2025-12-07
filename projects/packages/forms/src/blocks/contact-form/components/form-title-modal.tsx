/**
 * External dependencies
 */
import { Modal, TextControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './form-title-modal.scss';

type FormTitleModalProps = {
	onClose: () => void;
	onSubmit: ( title: string ) => void;
	defaultTitle: string;
	isCreating: boolean;
};

const FormTitleModal = ( { onClose, onSubmit, defaultTitle, isCreating }: FormTitleModalProps ) => {
	const [ title, setTitle ] = useState( defaultTitle );

	const handleSubmit = () => {
		if ( title.trim() ) {
			onSubmit( title.trim() );
		}
	};

	const handleKeyDown = ( event: React.KeyboardEvent ) => {
		if ( event.key === 'Enter' && title.trim() && ! isCreating ) {
			handleSubmit();
		}
	};

	return (
		<Modal
			title={ __( 'Create Reusable Form', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			size="medium"
			className="jetpack-form-title-modal"
		>
			<TextControl
				label={ __( 'Title', 'jetpack-forms' ) }
				value={ title }
				onChange={ setTitle }
				placeholder={ __( 'Enter form title…', 'jetpack-forms' ) }
				help={ __( 'This title will help you identify the form.', 'jetpack-forms' ) }
				onKeyDown={ handleKeyDown }
			/>
			<div className="jetpack-form-title-modal__actions">
				<Button variant="tertiary" onClick={ onClose } disabled={ isCreating }>
					{ __( 'Cancel', 'jetpack-forms' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ handleSubmit }
					disabled={ ! title.trim() || isCreating }
					isBusy={ isCreating }
				>
					{ isCreating ? __( 'Creating…', 'jetpack-forms' ) : __( 'Create Form', 'jetpack-forms' ) }
				</Button>
			</div>
		</Modal>
	);
};

export default FormTitleModal;
