import { Text, ActionPopover } from '@automattic/jetpack-components';
import { useCallback, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import ConnectButton from '../connect-button';

const ServiceConnection = ( { service, className = null, size = 'normal' } ) => {
	const connectAccountAnchor = useRef( null );
	const [ connectingAccount, setConnectingAccount ] = useState( {} );
	const onKeyringResult = useCallback( res => {
		console.log( res );
		if ( res?.ID ) {
			console.log( 'Setting', res );
			setConnectingAccount( res );
		}
	}, [] );
	const cancelConnecting = useCallback( () => setConnectingAccount( {} ), [] );
	const currentConnections = useSelect( select => select( store ).getConnections() );

	return (
		<>
			{ connectingAccount?.ID &&
				<ActionPopover
					title={ __( 'Connect account', 'jetpack-social' ) }
					buttonContent={ __( 'Connect', 'jetpack-social' ) }
					noArrow={ false }
					onClose={ cancelConnecting }
					onClick={ cancelConnecting }
					position="bottom"
					anchor={ connectAccountAnchor.current }
				>
					<img width={100} src={ connectingAccount.external_profile_picture } />&nbsp;{ connectingAccount.external_display }
				</ActionPopover>
			}
			<Text>
				<ConnectButton
					connectUrl={ service.connectUrl }
					onClose={ onKeyringResult }
					className={ className }
					key={ service.name }
					size={ size }
					ref={ connectAccountAnchor }
				/>
			</Text>
		</>
	);
};

export default ServiceConnection;
