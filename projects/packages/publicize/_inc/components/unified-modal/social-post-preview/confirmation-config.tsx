import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
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
	const { recordEvent } = useAnalytics();

	const isChecked = preferences.data.showPrePublishConfirmation ?? true;

	const onChange = useCallback(
		( showConfirmation: boolean ) => {
			preferences.set( 'showPrePublishConfirmation', showConfirmation );

			recordEvent( 'jetpack_social_pre_publish_confirmation_toggled', {
				showConfirmation,
				// Let us also pass on the previous preference.
				previousPreference: preferences.data.showPrePublishConfirmation,
			} );
		},
		[ preferences, recordEvent ]
	);

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ __( 'Always confirm before publishing', 'jetpack-publicize-pkg' ) }
			checked={ isChecked }
			onChange={ onChange }
		/>
	);
}
