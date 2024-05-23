import { __ } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import { SupportedService } from '../services/use-supported-services';
import { Reconnect } from './reconnect';

export type ConnectionStatusProps = {
	connection: Connection;
	onConfirmReconnect?: VoidFunction;
	service: SupportedService;
};

/**
 * Connection status component
 *
 * @param {ConnectionStatusProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ConnectionStatus( {
	connection,
	service,
	onConfirmReconnect,
}: ConnectionStatusProps ) {
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
			<Reconnect
				connection={ connection }
				service={ service }
				onConfirmReconnect={ onConfirmReconnect }
			/>
		</div>
	);
}
