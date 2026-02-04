import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useSocialUserPreferences } from '../../../hooks/use-social-user-preferences';

/**
 * Shows a checkbox to enable/disable pre-publish confirmation for social shares.
 *
 * @return ConfirmationConfig component.
 */
export function ConfirmationConfig(): JSX.Element {
	const preferences = useSocialUserPreferences();

	const isChecked = preferences.data.showPrePublishConfirmation ?? true;

	const onChange = useCallback( () => {
		preferences.set( 'showPrePublishConfirmation', ! isChecked );
	}, [ preferences, isChecked ] );

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ __( 'Always confirm before publishing', 'jetpack-publicize-pkg' ) }
			checked={ isChecked }
			onChange={ onChange }
		/>
	);
}
