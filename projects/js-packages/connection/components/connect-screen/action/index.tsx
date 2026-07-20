import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import type { MouseEvent, ReactNode, SyntheticEvent } from 'react';

export type Props = {
	// The Connect Button label
	buttonLabel: string;
	// Callback to be called on button click
	handleButtonClick?: ( e?: Event | SyntheticEvent | MouseEvent< HTMLElement > ) => void;
	// Whether the button is loading or not
	buttonIsLoading?: boolean;
	// Whether the error message appears or not
	displayButtonError?: boolean;
	// The connection error code
	errorCode?: string;
	// Whether the site is in offline mode
	isOfflineMode?: boolean;
};

/**
 * Maps a connection error code (and offline mode) to a user-facing message.
 *
 * @param {string}  errorCode     - The connection error code.
 * @param {boolean} isOfflineMode - Whether the site is in offline mode.
 * @return {import('react').ReactNode} The error message, or undefined if there isn't one.
 */
export const getConnectScreenErrorMessage = (
	errorCode?: string,
	isOfflineMode?: boolean
): ReactNode => {
	// Explicit error code takes precedence over the offline mode.
	switch ( errorCode ) {
		case 'fail_domain_forbidden':
		case 'fail_ip_forbidden':
		case 'fail_domain_tld':
		case 'fail_subdomain_wpcom':
		case 'siteurl_private_ip':
			return __(
				'Your site host is on a private network. Sites can connect to WordPress.com only on public sites.',
				'jetpack-connection-js'
			);
		case 'connection_disabled':
			return __( 'This site has been suspended.', 'jetpack-connection-js' );
	}

	if ( isOfflineMode ) {
		return createInterpolateElement(
			__( 'Unavailable in <a>Offline Mode</a>', 'jetpack-connection-js' ),
			{
				a: (
					<a
						href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		);
	}

	return undefined;
};

/**
 * The shared Connect Screen action: the primary connect button, its loading
 * state, and the connection error message. Used by both the Basic and
 * Required Plan connect screens.
 *
 * @param {Props} props - The properties.
 * @return {import('react').ReactNode} The Connect Screen Action component.
 */
function ConnectScreenAction( {
	buttonLabel,
	handleButtonClick,
	buttonIsLoading,
	displayButtonError,
	errorCode,
	isOfflineMode,
}: Props ) {
	return (
		<>
			<Button
				className="jp-connection__connect-screen__action-button"
				onClick={ handleButtonClick }
				loading={ buttonIsLoading }
				disabled={ isOfflineMode }
			>
				{ buttonLabel }
			</Button>
			{ ( displayButtonError || isOfflineMode ) && (
				<p className="jp-connection__connect-screen__error">
					{ getConnectScreenErrorMessage( errorCode, isOfflineMode ) ||
						__( 'An error occurred. Please try again.', 'jetpack-connection-js' ) }
				</p>
			) }
		</>
	);
}

export default ConnectScreenAction;
