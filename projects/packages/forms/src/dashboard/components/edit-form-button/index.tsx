/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value';
import { getFormEditUrl } from '../../utils.ts';

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
	const adminUrl = useConfigValue( 'adminUrl' ) || '';

	const onClick = useCallback( () => {
		const editPath = getFormEditUrl( formId );
		window.location.href = adminUrl ? `${ adminUrl }${ editPath }` : editPath;
	}, [ adminUrl, formId ] );

	return (
		<Button size="compact" variant="secondary" onClick={ onClick }>
			{ __( 'Edit form', 'jetpack-forms' ) }
		</Button>
	);
}
