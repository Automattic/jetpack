/**
 * Form Name Modal Component
 *
 * A reusable modal for entering or editing a form name.
 * Used for both creating new forms and renaming existing ones.
 */

import { Button, Modal, TextControl } from '@wordpress/components';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { FormEvent } from 'react';
import './style.scss';

export type FormNameModalProps = {
	/**
	 * Whether the modal is open.
	 */
	isOpen: boolean;

	/**
	 * Callback when the modal is closed (via cancel/skip or after save).
	 */
	onClose: () => void;

	/**
	 * Async callback when the user confirms.
	 * Receives the trimmed name (or fallback if empty).
	 *
	 * If this callback throws, the modal stays open so the user can retry.
	 * If it resolves successfully, the modal closes automatically.
	 * Do NOT close the modal from within this callback - the component handles
	 * closing based on success/failure.
	 */
	onSave: ( name: string ) => Promise< void >;

	/**
	 * The modal title.
	 */
	title: string;

	/**
	 * Initial value for the text input.
	 */
	initialValue?: string;

	/**
	 * Label for the primary (confirm) button.
	 * @default "Save"
	 */
	primaryButtonLabel?: string;

	/**
	 * Label for the secondary (cancel/skip) button.
	 * @default "Cancel"
	 */
	secondaryButtonLabel?: string;

	/**
	 * Placeholder text for the input field.
	 */
	placeholder?: string;

	/**
	 * Label for the input field.
	 * @default "Name"
	 */
	inputLabel?: string;

	/**
	 * Fallback name to use when the input is empty.
	 * @default "Untitled Form"
	 */
	fallbackName?: string;
};

/**
 * A reusable modal component for entering or editing a form name.
 *
 * @param props                      - Component props.
 * @param props.isOpen               - Whether the modal is open.
 * @param props.onClose              - Callback when the modal is closed.
 * @param props.onSave               - Async callback when the user confirms.
 * @param props.title                - The modal title.
 * @param props.initialValue         - Initial value for the text input.
 * @param props.primaryButtonLabel   - Label for the primary button.
 * @param props.secondaryButtonLabel - Label for the secondary button.
 * @param props.placeholder          - Placeholder text for the input field.
 * @param props.inputLabel           - Label for the input field.
 * @param props.fallbackName         - Fallback name when input is empty.
 * @return The modal component or null if not open.
 */
export function FormNameModal( {
	isOpen,
	onClose,
	onSave,
	title,
	initialValue = '',
	primaryButtonLabel,
	secondaryButtonLabel,
	placeholder,
	inputLabel,
	fallbackName,
}: FormNameModalProps ) {
	const [ name, setName ] = useState( initialValue );
	const [ isSaving, setIsSaving ] = useState( false );

	// Reset name when modal opens with a new initial value
	useEffect( () => {
		if ( isOpen ) {
			setName( initialValue );
		}
	}, [ isOpen, initialValue ] );

	const handleClose = useCallback( () => {
		if ( ! isSaving ) {
			onClose();
		}
	}, [ isSaving, onClose ] );

	const handleConfirm = useCallback( async () => {
		if ( isSaving ) {
			return;
		}

		setIsSaving( true );
		const finalName = name.trim() || fallbackName || __( 'Untitled Form', 'jetpack-forms' );

		try {
			await onSave( finalName );
		} catch {
			// Error handling is left to the caller via onSave
			// Modal stays open on error
		} finally {
			setIsSaving( false );
			onClose();
		}
	}, [ name, fallbackName, isSaving, onSave, onClose ] );

	const onSubmitForm = useCallback(
		( event: FormEvent ) => {
			event.preventDefault();
			handleConfirm();
		},
		[ handleConfirm ]
	);

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal title={ title } onRequestClose={ handleClose } size="medium">
			<form onSubmit={ onSubmitForm }>
				<TextControl
					label={ inputLabel || __( 'Name', 'jetpack-forms' ) }
					value={ name }
					onChange={ setName }
					__next40pxDefaultSize
					placeholder={ placeholder }
					disabled={ isSaving }
				/>
				<div className="jp-forms-name-modal__buttons">
					<Button variant="tertiary" onClick={ handleClose } disabled={ isSaving }>
						{ secondaryButtonLabel || __( 'Cancel', 'jetpack-forms' ) }
					</Button>
					<Button aria-disabled={ isSaving } isBusy={ isSaving } variant="primary" type="submit">
						{ primaryButtonLabel || __( 'Save', 'jetpack-forms' ) }
					</Button>
				</div>
			</form>
		</Modal>
	);
}

export default FormNameModal;
