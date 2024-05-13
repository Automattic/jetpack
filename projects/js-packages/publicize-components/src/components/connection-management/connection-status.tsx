import { __ } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import { Disconnect } from './disconnect';

export type ConnectionStatusProps = {
	connection: Connection;
	onReconnect?: VoidFunction;
};

/**
 * Connection status component
 *
 * @param {ConnectionStatusProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ConnectionStatus( { connection, onReconnect }: ConnectionStatusProps ) {
	if ( connection.status === undefined || connection.status === 'ok' ) {
		return null;
	}

	let notice = __( 'There is an issue with this connection.', 'jetpack' );

	if ( connection.status === 'refresh-failed' ) {
		notice = __( 'The connection seems to have expired.', 'jetpack' );
	}

	return (
		<div>
			<span className="description">{ notice }</span>
			&nbsp;
			<Disconnect
				connection={ connection }
				label={ __( 'Reconnect', 'jetpack' ) }
				showSuccessNotice={ false }
				onDisconnect={ onReconnect }
				variant="link"
				isDestructive={ false }
				showConfirmation={ false }
			/>
		</div>
	);
}
