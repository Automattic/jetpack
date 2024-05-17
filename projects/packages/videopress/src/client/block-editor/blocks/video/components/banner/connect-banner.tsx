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
 * @returns {React.ReactElement}       Connect banner component.
 */
export default function ConnectBanner( {
	onConnect,
	isModuleActive,
	isConnected,
	isConnecting,
}: ConnectBannerProps ): React.ReactElement {
	if ( isConnected ) {
		return null;
	}

	let connectButtonText = __( 'Connect', 'jetpack-videopress-pkg' );
	if ( isConnecting ) {
		connectButtonText = __( 'Redirecting…', 'jetpack-videopress-pkg' );
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
					{ connectButtonText }
				</Button>
			}
		>
			{ isModuleActive ? connectYourAccountMessage : connectJetpackModuleMessage }
		</Banner>
	);
}
