/**
 * Form Name Modal Component
 *
 * A reusable modal for entering or editing a form name.
 * Used for both creating new forms and renaming existing ones.
 */

import { Button, Modal, TextControl } from '@wordpress/components';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
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

	/**
	 * Message shown alongside the busy primary button while saving.
	 */
	busyMessage?: string;

	/**
	 * Message shown in the dialog when onSave rejects.
	 *
	 * Opt-in: callers whose save handler already reports its own failure (most dashboard mutations
	 * raise a snackbar) should leave this unset rather than report the same failure twice.
	 */
	errorMessage?: string;
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
 * @param props.busyMessage          - Message shown next to the busy primary button.
 * @param props.errorMessage         - Message shown when saving fails.
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
	busyMessage,
	errorMessage,
}: FormNameModalProps ) {
	const [ name, setName ] = useState( initialValue );
	const [ status, setStatus ] = useState< 'idle' | 'saving' | 'failed' >( 'idle' );
	const isSaving = status === 'saving';

	// Reset on open. Clearing the status matters as much as the name: a save that handed off to a
	// page navigation never settles, so a dialog dismissed mid-navigation would otherwise reopen
	// permanently busy in call sites that keep it mounted while closed.
	useEffect( () => {
		if ( isOpen ) {
			setName( initialValue );
			setStatus( 'idle' );
		}
	}, [ isOpen, initialValue ] );

	const handleChange = useCallback( ( value: string ) => {
		setName( value );
		setStatus( current => ( current === 'failed' ? 'idle' : current ) );
	}, [] );

	const handleConfirm = useCallback( async () => {
		if ( isSaving ) {
			return;
		}

		setStatus( 'saving' );
		const finalName = name.trim() || fallbackName || __( 'Untitled Form', 'jetpack-forms' );

		try {
			await onSave( finalName );
			onClose();
			setStatus( 'idle' );
		} catch {
			// onSave threw — keep the modal open, and say so, so the user can retry.
			setStatus( 'failed' );
		}
		// An onSave that hands off to a page navigation settles neither way, so the dialog simply
		// stays busy for as long as the browser takes to get to the next page.
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
		// Always dismissable: an onSave that hands off to a page load never settles, so a dialog that
		// refused to close while busy could never be closed again if that navigation failed to start.
		<Modal title={ title } onRequestClose={ onClose } size="medium">
			<form onSubmit={ onSubmitForm }>
				{ status === 'failed' && errorMessage && (
					<Notice.Root intent="error">
						<Notice.Description>{ errorMessage }</Notice.Description>
					</Notice.Root>
				) }
				<TextControl
					label={ inputLabel || __( 'Name', 'jetpack-forms' ) }
					value={ name }
					onChange={ handleChange }
					__next40pxDefaultSize
					placeholder={ placeholder }
					// Read-only rather than disabled: disabling the focused field drops focus to the
					// document body, out of the dialog, where Escape no longer reaches its handler.
					readOnly={ isSaving }
				/>
				<div className="jp-forms-name-modal__buttons">
					{ /* Mounted whenever the caller supplies copy, so the live region exists before its
					     text does — a region inserted with its content already in place is not announced. */ }
					{ busyMessage && (
						<p className="jp-forms-name-modal__busy-message" aria-live="polite">
							{ isSaving ? busyMessage : '' }
						</p>
					) }
					<Button variant="tertiary" onClick={ onClose }>
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
