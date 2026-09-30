import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';

export interface ProtectedOwnerConfirmationCopy {
	title: string;
	body: string;
	/** Null when the caller did not name a plugin. */
	requestedBy: string | null;
	confirm: string;
	cancel: string;
	/** Label for the support link shown when another account already holds the site. */
	contactSupport: string;
	/** Fallback when the claim fails and the server sends no message. */
	confirmError: string;
	/** Destination for `contactSupport`. */
	supportUrl: string;
}

/**
 * Join plugin names for the requested-by line.
 *
 * @param {string[]} plugins - Plugin names.
 * @return {string|null} A single name, a list, or null when there is nothing to name.
 */
function formatRequestingPlugins( plugins: string[] ): string | null {
	const names = plugins.filter( name => name !== '' );

	if ( names.length === 0 ) {
		return null;
	}

	if ( names.length === 1 ) {
		return names[ 0 ];
	}

	const last = names[ names.length - 1 ];

	return sprintf(
		// translators: %1$s: plugin names except the last. %2$s: the last plugin name.
		__( '%1$s and %2$s', 'jetpack-connection-js' ),
		names.slice( 0, -1 ).join( ', ' ),
		last
	);
}

/**
 * Wording for the protected-owner confirmation.
 *
 * The package dialog uses this. A consumer that renders its own dialog should too,
 * so the explanation does not diverge.
 *
 * @param {object}   [options]                   - Copy options.
 * @param {string}   [options.subject]           - "site" or "store", already translated.
 * @param {string[]} [options.requestingPlugins] - Plugins that asked for a protected owner.
 * @return {ProtectedOwnerConfirmationCopy} The strings and the support link.
 */
export function getProtectedOwnerConfirmationCopy( {
	subject = __( 'site', 'jetpack-connection-js' ),
	requestingPlugins = [],
}: {
	subject?: string;
	requestingPlugins?: string[];
} = {} ): ProtectedOwnerConfirmationCopy {
	const requestedByNames = formatRequestingPlugins( requestingPlugins );

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
		requestedBy: requestedByNames
			? sprintf(
					// translators: %s: plugins that asked for a protected owner.
					__( 'Requested by %s.', 'jetpack-connection-js' ),
					requestedByNames
				)
			: null,
		confirm: __( 'Confirm', 'jetpack-connection-js' ),
		cancel: __( 'Cancel', 'jetpack-connection-js' ),
		contactSupport: __( 'Contact support', 'jetpack-connection-js' ),
		confirmError: __( 'Could not confirm the protected owner.', 'jetpack-connection-js' ),
		supportUrl: getRedirectUrl( 'jetpack-support' ),
	};
}
