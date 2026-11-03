/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { FormNameModal, type FormNameModalProps } from './index.tsx';

/**
 * The subset of FormNameModal's contract a create entry point supplies; the rest is the shared
 * copy this component fills in.
 */
export type CreateFormModalProps = Pick< FormNameModalProps, 'isOpen' | 'onClose' | 'onSave' >;

/**
 * The "Create form" naming modal.
 *
 * Wraps FormNameModal with the copy every create entry point shares.
 *
 * @param props         - Component props.
 * @param props.isOpen  - Whether the modal is open.
 * @param props.onClose - Callback when the modal is closed.
 * @param props.onSave  - Called with the chosen title.
 * @return The modal.
 */
export function CreateFormModal( { isOpen, onClose, onSave }: CreateFormModalProps ) {
	return (
		<FormNameModal
			isOpen={ isOpen }
			onClose={ onClose }
			onSave={ onSave }
			title={ __( 'Create form', 'jetpack-forms' ) }
			primaryButtonLabel={ __( 'Create', 'jetpack-forms' ) }
			secondaryButtonLabel={ __( 'Cancel', 'jetpack-forms' ) }
			placeholder={ __( 'Enter form title', 'jetpack-forms' ) }
			busyMessage={ __( 'Opening the editor…', 'jetpack-forms' ) }
			errorMessage={ __( 'Could not create the form. Please try again.', 'jetpack-forms' ) }
		/>
	);
}
