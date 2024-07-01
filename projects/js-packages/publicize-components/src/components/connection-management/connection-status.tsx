import { __, _x } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import { SupportedService } from '../services/use-supported-services';
import { Disconnect } from './disconnect';
import { Reconnect } from './reconnect';

export type ConnectionStatusProps = {
	connection: Connection;
	service: SupportedService;
};

/**
 * Connection status component
 *
 * @param {ConnectionStatusProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ConnectionStatus( { connection, service }: ConnectionStatusProps ) {
	if ( connection.status !== 'broken' ) {
		return null;
	}

	return (
		<div>
			<span className="description">
				{ service
					? __( 'There is an issue with this connection.', 'jetpack' )
					: _x( 'This platform is no longer supported.', '', 'jetpack' ) }
			</span>
			&nbsp;
			{ service ? (
				<Reconnect connection={ connection } service={ service } />
			) : (
				<Disconnect connection={ connection } variant="link" isDestructive={ false } />
			) }
		</div>
	);
}
