import { CheckboxControl, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useJetpackSocialSettings } from '../../../hooks/use-user-jetpack-social-settings';

/**
 * Shows a checkbox to enable/disable pre-publish confirmation for social shares.
 *
 * @return ConfirmationConfig component.
 */
export function ConfirmationConfig(): JSX.Element {
	const { settings, updateSettings, isLoading, isSaving } = useJetpackSocialSettings();

	const handleChange = useCallback(
		( checked: boolean ) => {
			updateSettings( {
				pre_publish_confirmation: checked ? 'show' : 'hide',
			} );
		},
		[ updateSettings ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	const isEnabled = settings.pre_publish_confirmation === 'show';

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ __( 'Always confirm before publishing', 'jetpack-publicize-components' ) }
			checked={ isEnabled }
			onChange={ handleChange }
			disabled={ isSaving }
		/>
	);
}
