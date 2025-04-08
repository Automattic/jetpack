import { Alert } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

export type ServiceStatusProps = {
	serviceConnections: Array< Connection >;
	brokenConnections: Array< Connection >;
	reauthConnections: Array< Connection >;
};

/**
 * Service status component
 *
 * @param {ServiceStatusProps} props - Component props
 *
 * @return {import('react').ReactNode} Service status component
 */
export function ServiceStatus( {
	serviceConnections,
	brokenConnections,
	reauthConnections,
}: ServiceStatusProps ) {
	const canFix = useSelect(
		select =>
			brokenConnections.some( select( socialStore ).canUserManageConnection ) ||
			reauthConnections.some( select( socialStore ).canUserManageConnection ),
		[ brokenConnections, reauthConnections ]
	);

	if ( ! serviceConnections.length ) {
		return null;
	}

	if ( brokenConnections.length || reauthConnections.length ) {
		let message: string;
		if ( brokenConnections.length ) {
			message = canFix
				? __(
						'Please fix the broken connections or disconnect them to create more connections.',
						'jetpack-publicize-components'
				  )
				: _n(
						'Broken connection',
						'Broken connections',
						brokenConnections.length,
						'jetpack-publicize-components'
				  );
		} else {
			message = canFix
				? __( 'Reconnect to continue sharing.', 'jetpack-publicize-components' )
				: _n(
						'Expiring connection',
						'Expiring connections',
						reauthConnections.length,
						'jetpack-publicize-components'
				  );
		}
		return (
			<Alert
				level={ canFix ? 'error' : 'warning' }
				showIcon={ false }
				className={ styles[ 'broken-connection-alert' ] }
			>
				{ message }
			</Alert>
		);
	}

	return (
		<span className={ styles[ 'active-connection' ] }>
			{ serviceConnections.length > 1
				? sprintf(
						// translators: %d: Number of connections
						__( '%d connections', 'jetpack-publicize-components' ),
						serviceConnections.length
				  )
				: __( 'Connected', 'jetpack-publicize-components' ) }
		</span>
	);
}
