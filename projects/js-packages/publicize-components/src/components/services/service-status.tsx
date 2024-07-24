import { Alert } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

export type ServiceStatusProps = {
	serviceConnections: Array< Connection >;
	brokenConnections: Array< Connection >;
};

/**
 * Service status component
 *
 * @param {ServiceStatusProps} props - Component props
 *
 * @returns {import('react').ReactNode} Service status component
 */
export function ServiceStatus( { serviceConnections, brokenConnections }: ServiceStatusProps ) {
	if ( ! serviceConnections.length ) {
		return null;
	}

	if ( brokenConnections.length > 0 ) {
		const canFix = brokenConnections.some( ( { can_disconnect } ) => can_disconnect );

		return (
			<Alert
				level={ canFix ? 'error' : 'warning' }
				showIcon={ false }
				className={ styles[ 'broken-connection-alert' ] }
			>
				{ canFix
					? __(
							'Please fix the broken connections or disconnect them to create more connections.',
							'jetpack'
					  )
					: _n( 'Broken connection', 'Broken connections', brokenConnections.length, 'jetpack' ) }
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
