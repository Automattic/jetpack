import requestExternalAccess from '@automattic/request-external-access';
import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type Props = {
	settingsUrl?: string;
	onConnected: () => void;
	isConnected: boolean;
};

export default function GoogleDriveConnectButton( {
	settingsUrl,
	onConnected,
	isConnected,
}: Props ) {
	const connectingText = __( 'Connecting…', 'jetpack-forms' );
	const connectText = __( 'Connect to Google Drive', 'jetpack-forms' );
	const [ isToggling, setIsToggling ] = useState( false );

	useEffect( () => {
		// Reset local UI state when connection flips
		setIsToggling( false );
	}, [ isConnected ] );

	const handleClick = () => {
		if ( ! settingsUrl ) return;
		setIsToggling( true );
		requestExternalAccess( settingsUrl, ( { keyring_id: keyringId } ) => {
			if ( keyringId ) {
				onConnected();
			} else {
				setIsToggling( false );
			}
		} );
	};

	return (
		<Button
			variant="secondary"
			onClick={ handleClick }
			__next40pxDefaultSize={ true }
			disabled={ ! settingsUrl || isToggling }
		>
			{ isToggling ? connectingText : connectText }
		</Button>
	);
}
