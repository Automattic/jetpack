import { ExternalLink } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import { SupportedService } from '../services/use-supported-services';
import { Disconnect } from './disconnect';
import { Reconnect } from './reconnect';

export type ConnectionStatusProps = {
	connection: Connection;
	service?: SupportedService;
	fixConnectionLink?: boolean;
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
	fixConnectionLink,
}: ConnectionStatusProps ) {
	if ( connection.status !== 'broken' ) {
		return null;
	}

	let fix = null;

	if ( fixConnectionLink ) {
		fix = <ExternalLink href={ fixConnectionLink }>{ __( 'Fix now', 'jetpack' ) }</ExternalLink>;
	} else {
		fix = service ? (
			<Reconnect connection={ connection } service={ service } />
		) : (
			<Disconnect connection={ connection } variant="link" isDestructive={ false } />
		);
	}

	return (
		<div>
			<span className="description">
				{ service
					? __( 'There is an issue with this connection.', 'jetpack' )
					: _x( 'This platform is no longer supported.', '', 'jetpack' ) }
			</span>
			&nbsp;
			{ fix }
		</div>
	);
}
