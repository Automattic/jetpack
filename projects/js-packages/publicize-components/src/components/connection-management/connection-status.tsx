import { __ } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import { SupportedService } from '../services/use-supported-services';
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
				{ __( 'There is an issue with this connection.', 'jetpack' ) }
			</span>
			&nbsp;
			<Reconnect connection={ connection } service={ service } />
		</div>
	);
}
