/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useCreateForm from '../../hooks/use-create-form.ts';

type CreateFormButtonProps = {
	label?: string;
	showPatterns?: boolean;
	variant?: 'primary' | 'secondary';
};

/**
 * Renders a button to create a new form.
 *
 * @param {object}  props              - The component props.
 * @param {string}  props.label        - The label for the button.
 * @param {boolean} props.showPatterns - Whether to show the patterns on the editor immediately.
 * @param {string}  props.variant      - The button variant (primary or secondary).
 * @return {JSX.Element}                 The button to create a new form.
 */
export default function CreateFormButton( {
	label = __( 'Create a form', 'jetpack-forms' ),
	showPatterns = false,
	variant = 'secondary',
}: CreateFormButtonProps ): JSX.Element {
	const { openNewForm } = useCreateForm();

	const onButtonClickHandler = useCallback(
		() =>
			openNewForm( {
				showPatterns,
				analyticsEvent: () => {
					jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
						button: 'forms',
					} );
				},
			} ),
		[ openNewForm, showPatterns ]
	);

	return (
		<Button
			size="compact"
			variant={ variant }
			onClick={ onButtonClickHandler }
			icon={ plus }
			className="create-form-button"
		>
			{ label }
		</Button>
	);
}
