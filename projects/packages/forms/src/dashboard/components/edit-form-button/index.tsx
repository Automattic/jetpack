/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { LinkButton } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value';
import { getFormEditUrl } from '../../utils.ts';

type EditFormButtonProps = {
	formId: number;
	onClick?: () => void;
};

/**
 * Button that navigates to edit the given `jetpack_form`.
 *
 * @param props         - Props.
 * @param props.formId  - Form (post) ID.
 * @param props.onClick - Optional callback fired before navigation.
 * @return JSX element.
 */
export default function EditFormButton( {
	formId,
	onClick: onClickProp,
}: EditFormButtonProps ): JSX.Element {
	const adminUrl = ( useConfigValue( 'adminUrl' ) as string ) || '';

	const onClick = useCallback( () => {
		onClickProp?.();
	}, [ onClickProp ] );

	return (
		<LinkButton
			size="compact"
			variant="outline"
			href={ getFormEditUrl( formId, adminUrl ) }
			onClick={ onClick }
		>
			{ __( 'Edit form', 'jetpack-forms' ) }
		</LinkButton>
	);
}
