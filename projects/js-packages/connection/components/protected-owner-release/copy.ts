import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import type { ProtectedOwnerReleaseCopy } from './types.ts';

/**
 * Wording for the protected-owner release.
 *
 * The package dialog uses this. A consumer that renders its own dialog should too,
 * so the explanation does not diverge.
 *
 * @param {object} [options]         - Copy options.
 * @param {string} [options.subject] - "site" or "store", already translated.
 * @return {ProtectedOwnerReleaseCopy} The strings and the support link.
 */
export function getProtectedOwnerReleaseCopy( {
	subject = __( 'site', 'jetpack-connection-js' ),
}: {
	subject?: string;
} = {} ): ProtectedOwnerReleaseCopy {
	return {
		title: sprintf(
			// translators: %s: "site" or "store".
			__( 'Release ownership of this %s', 'jetpack-connection-js' ),
			subject
		),
		body: sprintf(
			// translators: %s: "site" or "store".
			__(
				'Releasing ownership turns off features that require a confirmed owner. Any connected administrator will then be able to confirm ownership of this %s.',
				'jetpack-connection-js'
			),
			subject
		),
		release: __( 'Release ownership', 'jetpack-connection-js' ),
		cancel: __( 'Cancel', 'jetpack-connection-js' ),
		contactSupport: __( 'Contact support', 'jetpack-connection-js' ),
		releaseError: __( 'Could not release the protected owner.', 'jetpack-connection-js' ),
		supportUrl: getRedirectUrl( 'jetpack-support' ),
	};
}
