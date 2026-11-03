/**
 * PayPal Payment Buttons — block editor entry point.
 *
 * Picks the paste-code or the API-managed editor from the feature flag PHP
 * puts on the editor state. The two editors are separate components so the
 * API-managed hooks, which call REST routes that only exist while the flag is
 * on, never run for the paste-code path.
 *
 * @package
 */

import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import ReadOnlyBlock from './components/read-only-block';
import ApiManagedEdit from './edit-api-managed';
import PasteCodeEdit from './edit-paste-code';

/**
 * Name of the flag registered by PayPal_Payment_Buttons::register_feature_flags().
 */
export const API_MANAGED_BUTTONS_FLAG = 'paypal-payments-api-managed-buttons';

/**
 * PayPal Payment Buttons edit component.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {Element} Block editor UI.
 */
export default function Edit( props ) {
	if ( hasFeatureFlag( API_MANAGED_BUTTONS_FLAG ) ) {
		return <ApiManagedEdit { ...props } />;
	}

	// The frontend keeps rendering a button created through the API; the editor
	// just cannot change it until the flag is back on, so say so instead of
	// showing an unrelated paste-code form.
	if ( props.attributes.isApiManaged && props.attributes.resourceId ) {
		return (
			<ReadOnlyBlock
				attributes={ props.attributes }
				message={ __(
					'This button is managed through your PayPal account and cannot be edited right now.',
					'jetpack-paypal-payments'
				) }
			/>
		);
	}

	return <PasteCodeEdit { ...props } />;
}
