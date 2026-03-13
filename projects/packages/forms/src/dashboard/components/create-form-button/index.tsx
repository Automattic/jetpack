/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Button } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useCreateForm from '../../hooks/use-create-form.ts';
import { FormNameModal } from '../form-name-modal';

type CreateFormButtonProps = {
	label?: string;
	showPatterns?: boolean;
	variant?: 'primary' | 'secondary';
	showIcon?: boolean;
	showNameModal?: boolean;
};

/**
 * Renders a button to create a new form.
 *
 * @param {object}  props               - The component props.
 * @param {string}  props.label         - The label for the button.
 * @param {boolean} props.showPatterns  - Whether to show the patterns on the editor immediately.
 * @param {string}  props.variant       - The button variant (primary or secondary).
 * @param {boolean} props.showIcon      - Whether to show the plus icon.
 * @param {boolean} props.showNameModal - Whether to show a modal asking for the form name before creating.
 * @return {JSX.Element}                  The button to create a new form.
 */
export default function CreateFormButton( {
	label = __( 'Create a form', 'jetpack-forms' ),
	showPatterns = false,
	variant = 'secondary',
	showIcon = true,
	showNameModal = false,
}: CreateFormButtonProps ): JSX.Element {
	const { openNewForm } = useCreateForm();
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const onButtonClickHandler = useCallback( () => {
		if ( showNameModal ) {
			setIsModalOpen( true );
			return;
		}
		openNewForm( {
			showPatterns,
			analyticsEvent: () => {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
					button: 'forms',
				} );
			},
		} );
	}, [ showNameModal, openNewForm, showPatterns ] );

	const handleModalClose = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	const handleModalSave = useCallback(
		async ( formTitle: string ) => {
			await openNewForm( {
				showPatterns,
				formTitle,
				analyticsEvent: () => {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
						button: 'forms',
					} );
				},
			} );
		},
		[ openNewForm, showPatterns ]
	);

	return (
		<>
			<Button
				size="compact"
				variant={ variant }
				onClick={ onButtonClickHandler }
				icon={ showIcon ? plus : undefined }
				className="create-form-button"
			>
				{ label }
			</Button>
			<FormNameModal
				isOpen={ isModalOpen }
				onClose={ handleModalClose }
				onSave={ handleModalSave }
				title={ __( 'Create form', 'jetpack-forms' ) }
				primaryButtonLabel={ __( 'Create', 'jetpack-forms' ) }
				secondaryButtonLabel={ __( 'Cancel', 'jetpack-forms' ) }
				placeholder={ __( 'Enter form title', 'jetpack-forms' ) }
			/>
		</>
	);
}
