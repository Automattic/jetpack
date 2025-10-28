import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type Props = {
	onDisconnected: () => void;
	isConnected: boolean;
};

export default function GoogleDriveDisconnectButton( { onDisconnected, isConnected }: Props ) {
	const disconnectingText = __( 'Disconnecting…', 'jetpack-forms' );
	const disconnectText = __( 'Disconnect Google Drive', 'jetpack-forms' );
	const [ isToggling, setIsToggling ] = useState( false );

	useEffect( () => {
		setIsToggling( false );
	}, [ isConnected ] );

	const handleClick = () => {
		setIsToggling( true );
		apiFetch( { method: 'DELETE', path: '/wp/v2/feedback/integrations/google-drive' } )
			.then( ( response: { deleted: boolean } ) => {
				if ( response.deleted ) {
					onDisconnected();
				}
			} )
			.finally( () => {
				setIsToggling( false );
			} );
	};

	return (
		<Button variant="link" onClick={ handleClick } disabled={ isToggling }>
			{ isToggling ? disconnectingText : disconnectText }
		</Button>
	);
}
