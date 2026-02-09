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
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
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
	const [ isCreating, setIsCreating ] = useState( false );

	const onClick = useCallback( async () => {
		if ( isCreating ) {
			return;
		}

		setIsCreating( true );
		try {
			jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_cta_click', {
				button: 'forms',
			} );

			const newPost = await dispatch( coreStore ).saveEntityRecord(
				'postType',
				'jetpack_form',
				{
					title: __( 'Contact Form', 'jetpack-forms' ),
					// Seed the form post with the contact-form block so the editor opens with a form.
					content: '<!-- wp:jetpack/contact-form /-->',
					status: 'auto-draft',
				},
				{ throwOnError: true }
			);

			const newPostId = Number( ( newPost as { id?: number | string } | undefined )?.id );
			if ( ! Number.isFinite( newPostId ) || newPostId <= 0 ) {
				throw new Error( 'Failed to create a form: missing post id.' );
			}

			navigate( {
				search: {
					...searchParams,
					editFormId: String( newPostId ),
				},
			} );
		} catch {
			dispatch( noticesStore ).createErrorNotice(
				__( 'Failed to create a form. Please try again.', 'jetpack-forms' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsCreating( false );
		}
	}, [ isCreating, navigate, searchParams ] );

	return (
		<Button
			size="compact"
			variant={ variant }
			onClick={ onClick }
			disabled={ isCreating }
			isBusy={ isCreating }
			icon={ plus }
			className="create-form-button"
		>
			{ label }
		</Button>
	);
}
