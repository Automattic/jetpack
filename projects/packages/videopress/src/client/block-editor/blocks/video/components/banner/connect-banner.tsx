/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Banner from './';
/**
 * Types
 */
import type React from 'react';

type ConnectBannerProps = {
	isConnected: boolean;
	isConnecting: boolean;
	isModuleActive: boolean;
	onConnect: () => void;
};

/**
 * Connect Banner component
 *
 * @param {ConnectBannerProps} props - component props
 * @return {React.ReactElement}       Connect banner component.
 */
export default function ConnectBanner( {
	onConnect,
	isModuleActive,
	isConnected,
	isConnecting,
}: ConnectBannerProps ): React.ReactElement {
	if ( isConnected && isModuleActive ) {
		return null;
	}

	const needsActivation = isConnected && ! isModuleActive;

	let connectButtonText = __( 'Connect Jetpack', 'jetpack-videopress-pkg' );
	if ( isConnecting ) {
		connectButtonText = __( 'Redirecting…', 'jetpack-videopress-pkg' );
	}

	let activateButtonText = __( 'Activate VideoPress', 'jetpack-videopress-pkg' );
	if ( isConnecting ) {
		activateButtonText = __( 'Activating…', 'jetpack-videopress-pkg' );
	}

	const connectYourAccountMessage = __(
		'Connect your account to continue using VideoPress',
		'jetpack-videopress-pkg'
	);
	const connectJetpackModuleMessage = __(
		'Enable Jetpack module to continue using VideoPress',
		'jetpack-videopress-pkg'
	);

	return (
		<Banner
			action={
				<Button
					variant="primary"
					onClick={ onConnect }
					disabled={ isConnecting }
					isBusy={ isConnecting }
				>
					{ needsActivation ? activateButtonText : connectButtonText }
				</Button>
			}
			icon={ '' }
		>
			{ needsActivation ? connectJetpackModuleMessage : connectYourAccountMessage }
		</Banner>
	);
}
