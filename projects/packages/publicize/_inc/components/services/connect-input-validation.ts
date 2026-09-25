import { __, sprintf } from '@wordpress/i18n';

/**
 * Connect input values, keyed by input name.
 */
export type ConnectInputValues = Record< string, string >;

export type ConnectInputError = {
	field: string;
	code: 'invalid' | 'duplicate';
	message: string;
};

export type ConnectInputValidation = {
	/**
	 * Normalized values, ready to be sent as connect URL params.
	 */
	values: ConnectInputValues;
	error?: ConnectInputError;
};

export type ValidateConnectInputsOptions = {
	/**
	 * Whether an already-connected account passes. A reconnect re-auths an account in place, so only a fresh connect blocks duplicates.
	 */
	allowDuplicate?: boolean;
	/**
	 * Callback to check whether the handle is already connected to this site.
	 */
	isAlreadyConnected?: ( handle: string ) => boolean;
};

const isValidMastodonUsername = ( username: string ) =>
	/^@?\b([A-Z0-9_]+)@([A-Z0-9.-]+\.[A-Z]{2,})$/gi.test( username );

/**
 * Example valid handles:
 * - domain.tld
 * - username.bsky.social
 * - user-name.bsky.social
 * - my-domain.com
 *
 * @param {string} handle - Handle to validate
 *
 * @return {boolean} - Whether the handle is valid
 */
function isValidBlueskyHandle( handle: string ) {
	const parts = handle.split( '.' ).filter( Boolean );

	// A valid handle should have at least 2 parts - domain, and tld
	if ( parts.length < 2 ) {
		return false;
	}

	return parts.every( part => /^[a-z0-9_-]+$/i.test( part ) );
}

/**
 * Guidance shown while typing, not a submit gate: a `*.bsky.social` handle
 * cannot carry dots in its username part.
 *
 * @param handle - The handle being typed.
 *
 * @return The message to show, or `null` when there is nothing to flag.
 */
export function getBlueskyHandleHint( handle: string ): string | null {
	const suffix = '.bsky.social';

	if ( ! handle.endsWith( suffix ) ) {
		return null;
	}

	if ( ! handle.replace( suffix, '' ).includes( '.' ) ) {
		return null;
	}

	return sprintf(
		/* translators: %s is the handle suffix like .bsky.social */
		__(
			'Bluesky usernames cannot contain dots. If you are using a custom domain, enter it without "%s"',
			'jetpack-publicize-pkg'
		),
		suffix
	);
}

/**
 * Validates and normalizes the inputs a service needs before its connect popup
 * can open. Returns the first error instead of raising a notice, so the connect
 * form and the connection flow's input step can share the rules.
 *
 * @param                                serviceId - The service being connected.
 * @param                                values    - Raw input values, keyed by input name.
 * @param {ValidateConnectInputsOptions} options   - Validation options.
 *
 * @return The normalized values, plus the first error found.
 */
export function validateConnectInputs(
	serviceId: string,
	values: ConnectInputValues,
	{ allowDuplicate, isAlreadyConnected }: ValidateConnectInputsOptions = {}
): ConnectInputValidation {
	switch ( serviceId ) {
		case 'mastodon': {
			const instance = ( values.instance ?? '' ).trim();
			const normalized = { instance };

			if ( ! isValidMastodonUsername( instance ) ) {
				return {
					values: normalized,
					error: {
						field: 'instance',
						code: 'invalid',
						message: __( 'Invalid Mastodon username', 'jetpack-publicize-pkg' ),
					},
				};
			}

			if ( ! allowDuplicate && isAlreadyConnected?.( instance ) ) {
				return {
					values: normalized,
					error: {
						field: 'instance',
						code: 'duplicate',
						message: __( 'This Mastodon account is already connected', 'jetpack-publicize-pkg' ),
					},
				};
			}

			return { values: normalized };
		}

		case 'bluesky': {
			// Let us make the user's life easier by removing the leading "@" if they added it
			const handle = ( values.handle ?? '' ).trim().replace( /^@/, '' );
			const appPassword = ( values.app_password ?? '' ).trim();
			const normalized = { handle, app_password: appPassword };

			if ( ! isValidBlueskyHandle( handle ) ) {
				return {
					values: normalized,
					error: {
						field: 'handle',
						code: 'invalid',
						message: __( 'Invalid Bluesky handle', 'jetpack-publicize-pkg' ),
					},
				};
			}

			if ( ! allowDuplicate && isAlreadyConnected?.( handle ) ) {
				return {
					values: normalized,
					error: {
						field: 'handle',
						code: 'duplicate',
						message: __( 'This Bluesky account is already connected', 'jetpack-publicize-pkg' ),
					},
				};
			}

			if ( ! appPassword ) {
				return {
					values: normalized,
					error: {
						field: 'app_password',
						code: 'invalid',
						message: __( 'Please enter an app password.', 'jetpack-publicize-pkg' ),
					},
				};
			}

			return { values: normalized };
		}

		default:
			// Every other service goes straight to authorization, with no inputs.
			return { values: {} };
	}
}
