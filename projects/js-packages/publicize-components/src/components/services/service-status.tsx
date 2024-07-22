import { Alert } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

export type ServiceStatusProps = {
	serviceConnections: Array< Connection >;
};

/**
 * Service status component
 *
 * @param {ServiceStatusProps} props - Component props
 *
 * @returns {import('react').ReactNode} Service status component
 */
export function ServiceStatus( { serviceConnections }: ServiceStatusProps ) {
	if ( ! serviceConnections.length ) {
		return null;
	}

	if ( serviceConnections.some( ( { status } ) => status === 'broken' ) ) {
		return (
			<Alert level="error" showIcon={ false } className={ styles[ 'broken-connection-alert' ] }>
				{ __( 'Please fix the broken connections.', 'jetpack' ) }
			</Alert>
		);
	}

	return (
		<span className={ styles[ 'active-connection' ] }>
			{ serviceConnections.length > 1
				? sprintf(
						// translators: %d: Number of connections
						__( '%d connections', 'jetpack' ),
						serviceConnections.length
				  )
				: __( 'Connected', 'jetpack' ) }
		</span>
	);
}
