import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import useConnection from '../use-connection';

export interface Props {
	/** The "Connect" button label. */
	connectLabel?: string;
	/** API root URL. */
	apiRoot: string;
	/** API Nonce. */
	apiNonce: string;
	/** Where the connection request is coming from. */
	from?: string;
	/** The redirect admin URI. */
	redirectUri: string;
	/** Registration nonce. */
	registrationNonce: string;
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger?: boolean;
}

/**
 * The RNA connection component.
 *
 * @param {Props} props - The properties.
 * @return {import('react').ReactNode} The RNA connection component.
 */
function ConnectButton( {
	apiRoot,
	apiNonce,
	connectLabel = __( 'Connect', 'jetpack-connection-js' ),
	registrationNonce,
	redirectUri,
	from,
	autoTrigger = false,
}: Props ) {
	const {
		handleRegisterSite,
		isRegistered,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
	} = useConnection( {
		registrationNonce,
		redirectUri,
		apiRoot,
		apiNonce,
		autoTrigger,
		from,
	} );

	return (
		<>
			{ ( ! isRegistered || ! isUserConnected ) && (
				<>
					<Button onClick={ handleRegisterSite } loading={ siteIsRegistering || userIsConnecting }>
						{ connectLabel }
					</Button>
					{ registrationError && (
						<p className="jp-action-button__error">
							{ __( 'An error occurred. Please try again.', 'jetpack-connection-js' ) }
						</p>
					) }
				</>
			) }
		</>
	);
}

export default ConnectButton;
