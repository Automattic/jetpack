import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useJetpackSocialPreferences } from '../../../hooks/use-jetpack-social-preferences';

/**
 * Shows a checkbox to enable/disable pre-publish confirmation for social shares.
 *
 * @return ConfirmationConfig component.
 */
export function ConfirmationConfig(): JSX.Element {
	const { togglePrePublishConfirmation, showPrePublishConfirmation } =
		useJetpackSocialPreferences();

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ __( 'Always confirm before publishing', 'jetpack-publicize-components' ) }
			checked={ showPrePublishConfirmation }
			onChange={ togglePrePublishConfirmation }
		/>
	);
}
