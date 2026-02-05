/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';

type CreateFormButtonProps = {
	label?: string;
	variant?: 'primary' | 'secondary';
	from?: '/forms' | '/responses/$view';
};

/**
 * wp-build only create form button:
 * - creates an auto-draft `jetpack_form`
 * - navigates within the wp-build router so the route `canvas()` opens the editor.
 *
 * @param props         - Props.
 * @param props.label   - Button label.
 * @param props.variant - Button variant.
 * @param props.from    - Route pattern used as the `useSearch( { from } )` context.
 * @return Button.
 */
export default function WpBuildCreateFormButton( {
	label = __( 'Create a form', 'jetpack-forms' ),
	variant = 'secondary',
	from = '/forms',
}: CreateFormButtonProps ): JSX.Element {
	const navigate = useNavigate();
	const searchParams = useSearch( { from } );

	const onClick = useCallback( async () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
			button: 'forms',
		} );

		const newPost = await dispatch( coreStore ).saveEntityRecord( 'postType', 'jetpack_form', {
			title: __( 'Contact Form', 'jetpack-forms' ),
			// Seed the form post with the contact-form block so the editor opens with a form.
			content: '<!-- wp:jetpack/contact-form /-->',
			status: 'auto-draft',
		} );

		navigate( {
			search: {
				...searchParams,
				editFormId: String( ( newPost as { id: number | string } ).id ),
			},
		} );
	}, [ navigate, searchParams ] );

	return (
		<Button
			size="compact"
			variant={ variant }
			onClick={ onClick }
			icon={ plus }
			className="create-form-button"
		>
			{ label }
		</Button>
	);
}
