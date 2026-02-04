/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value';

type EditFormButtonProps = {
	formId: number;
	sourceId?: number;
};

/**
 * Button that navigates to edit the given `jetpack_form`.
 *
 * @param props          - Props.
 * @param props.formId   - Form (post) ID.
 * @param props.sourceId - Optional source form ID for return navigation.
 * @return JSX element.
 */
export default function EditFormButton( { formId, sourceId }: EditFormButtonProps ): JSX.Element {
	const adminUrl = useConfigValue( 'adminUrl' ) || '';

	const sourceParam =
		typeof sourceId === 'number' ? `&source_id=${ encodeURIComponent( String( sourceId ) ) }` : '';
	const editPath = `post.php?post=${ formId }&action=edit${ sourceParam }`;
	const href = adminUrl ? `${ adminUrl }${ editPath }` : editPath;

	return (
		<Button size="compact" variant="secondary" href={ href }>
			{ __( 'Edit form', 'jetpack-forms' ) }
		</Button>
	);
}
