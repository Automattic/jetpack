import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import type { ProtectedOwnerConfirmationCopy } from './types.ts';

/**
 * Wording for the protected-owner confirmation.
 *
 * The package dialog uses this. A consumer that renders its own dialog should too,
 * so the explanation does not diverge.
 *
 * @param {object} [options]         - Copy options.
 * @param {string} [options.subject] - "site" or "store", already translated.
 * @return {ProtectedOwnerConfirmationCopy} The strings and the support link.
 */
export function getProtectedOwnerConfirmationCopy( {
	subject = __( 'site', 'jetpack-connection-js' ),
}: {
	subject?: string;
} = {} ): ProtectedOwnerConfirmationCopy {
	return {
		title: sprintf(
			// translators: %s: "site" or "store".
			__( 'Confirm you are the %s owner', 'jetpack-connection-js' ),
			subject
		),
		body: __(
			'This WordPress.com account becomes the confirmed owner. The connection stays locked to this account.',
			'jetpack-connection-js'
		),
		confirm: __( 'Confirm', 'jetpack-connection-js' ),
		cancel: __( 'Cancel', 'jetpack-connection-js' ),
		contactSupport: __( 'Contact support', 'jetpack-connection-js' ),
		confirmError: __( 'Could not confirm the protected owner.', 'jetpack-connection-js' ),
		supportUrl: getRedirectUrl( 'jetpack-support' ),
	};
}
