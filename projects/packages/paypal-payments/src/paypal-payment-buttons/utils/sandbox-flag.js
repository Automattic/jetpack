/**
 * PayPal Payment Buttons — whether the connection wizard may offer the sandbox.
 *
 * @package
 */

import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';

/**
 * Name of the flag registered by PayPal_Payment_Buttons::register_feature_flags().
 */
export const SANDBOX_FLAG = 'paypal-payments-sandbox';

/**
 * Whether the merchant may connect the PayPal sandbox from the wizard.
 *
 * @return {boolean} True while the flag is on.
 */
export function isSandboxAllowed() {
	return hasFeatureFlag( SANDBOX_FLAG );
}
