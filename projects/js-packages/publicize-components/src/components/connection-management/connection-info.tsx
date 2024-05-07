import { Spinner } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { ConnectionStatus, ConnectionStatusProps } from './connection-status';
import styles from './style.module.scss';

type ConnectionInfoProps = ConnectionStatusProps;

/**
 * Connection name component
 *
 * @param {Pick< ConnectionInfoProps, 'connection' >} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
function ConnectionName( { connection }: Pick< ConnectionInfoProps, 'connection' > ) {
	if ( connection.display_name ) {
		if ( ! connection.profile_link ) {
			return <span>{ connection.display_name }</span>;
		}
		return (
			<ExternalLink className={ styles[ 'profile-link' ] } href={ connection.profile_link }>
				{ connection.display_name }
			</ExternalLink>
		);
	}
	return <Spinner color="black" />;
}

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
