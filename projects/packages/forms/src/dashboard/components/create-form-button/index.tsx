/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { create } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { config } from '../../index';
import './style.scss';

type CreateFormButtonProps = {
	label?: string;
	showPatterns?: boolean;
};

/**
 * Renders a button to create a new form.
 *
 * @param {object}  props              - The component props.
 * @param {string}  props.label        - The label for the button.
 * @param {boolean} props.showPatterns - Whether to show the patterns on the editor immediately.
 * @return {JSX.Element}                 The button to create a new form.
 */
export default function CreateFormButton( {
	label = __( 'Create a free form', 'jetpack-forms' ),
	showPatterns = false,
}: CreateFormButtonProps ): JSX.Element {
	const onButtonClickHandler = useCallback( async () => {
		const data = new FormData();

		data.append( 'action', 'create_new_form' );
		data.append( 'newFormNonce', config( 'newFormNonce' ) );

		const response = await fetch( window.ajaxurl, { method: 'POST', body: data } );
		const { post_url }: { post_url: string } = await response.json();

		if ( post_url ) {
			jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
				button: 'forms',
			} );

			window.open( `${ post_url }${ showPatterns ? '&showJetpackFormsPatterns' : '' }` );
		}
	}, [ showPatterns ] );

	return (
		<Button
			variant="primary"
			onClick={ onButtonClickHandler }
			icon={ create }
			className="create-form-button jp-forms__create-form-button--large-green"
		>
			{ label }
		</Button>
	);
}
