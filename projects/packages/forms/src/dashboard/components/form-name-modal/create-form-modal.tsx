/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { FormNameModal } from './index.tsx';

export type CreateFormModalProps = {
	/**
	 * Whether the modal is open.
	 */
	isOpen: boolean;

	/**
	 * Callback when the modal is closed.
	 */
	onClose: () => void;

	/**
	 * Called with the chosen title. Expected to navigate to the editor, in which case it never
	 * settles and the modal stays busy until the browser gets there.
	 */
	onSave: ( name: string ) => Promise< void >;
};

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

export default CreateFormModal;
