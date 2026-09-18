/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, LinkButton } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value';
import { CONFIG_STORE } from '../../../store/config/index.ts';
import { getFormEditUrl } from '../../utils.ts';
import type { ConfigSelectors } from '../../../store/config/types.ts';

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
	const configFailed = useSelect(
		select => !! ( select( CONFIG_STORE ) as ConfigSelectors ).getConfigError(),
		[]
	);

	const onClick = useCallback( () => {
		onClickProp?.();
	}, [ onClickProp ] );

	const label = __( 'Edit form', 'jetpack-forms' );

	/*
	 * `adminUrl` arrives asynchronously from the config store, and an href built
	 * without it would be relative — resolving against the wrong base in external
	 * admin contexts. A disabled control isn't navigable, so hold the slot with a
	 * real Button while we wait, then let LinkButton own the href.
	 *
	 * If the config request failed outright there is nothing left to wait for, so
	 * fall through to the relative URL rather than disable the action forever. It
	 * still resolves correctly from wp-admin, which is where this can be reached.
	 */
	if ( ! adminUrl && ! configFailed ) {
		return (
			<Button size="compact" variant="outline" disabled>
				{ label }
			</Button>
		);
	}

	return (
		<LinkButton
			size="compact"
			variant="outline"
			href={ getFormEditUrl( formId, adminUrl ) }
			onClick={ onClick }
		>
			{ label }
		</LinkButton>
	);
}
