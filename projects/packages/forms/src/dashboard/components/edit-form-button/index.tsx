/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type EditFormButtonProps = {
	formId: number;
};

/**
 * Button that navigates to edit the given `jetpack_form`.
 *
 * @param props        - Props.
 * @param props.formId - Form (post) ID.
 * @return JSX element.
 */
export default function EditFormButton( { formId }: EditFormButtonProps ): JSX.Element {
	const onClick = useCallback( () => {
		// Prefer a relative URL so it works regardless of wp-admin path.
		const fallbackEditUrl = `post.php?post=${ formId }&action=edit&post_type=jetpack_form`;
		const url = new URL( fallbackEditUrl, window.location.href );
		window.location.href = url.toString();
	}, [ formId ] );

	return (
		<Button size="compact" variant="secondary" onClick={ onClick }>
			{ __( 'Edit form', 'jetpack-forms' ) }
		</Button>
	);
}
