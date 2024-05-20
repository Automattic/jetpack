import { ConnectionName } from './connection-name';
import { ConnectionStatus, ConnectionStatusProps } from './connection-status';

type ConnectionInfoProps = ConnectionStatusProps;

/**
 * Connection info component
 *
 * @param {ConnectionInfoProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ConnectionInfo( { connection, onReconnect }: ConnectionInfoProps ) {
	return (
		<div>
			<ConnectionName connection={ connection } />
			<ConnectionStatus connection={ connection } onReconnect={ onReconnect } />
		</div>
	);
}
