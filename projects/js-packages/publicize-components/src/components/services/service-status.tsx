import { Alert } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
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
 * @return {import('react').ReactNode} Service status component
 */
export function ServiceStatus( { serviceConnections, brokenConnections }: ServiceStatusProps ) {
	const canFix = useSelect(
		select => brokenConnections.some( select( socialStore ).canUserManageConnection ),
		[ brokenConnections ]
	);

	if ( ! serviceConnections.length ) {
		return null;
	}

	if ( brokenConnections.length > 0 ) {
		return (
			<Alert
				level={ canFix ? 'error' : 'warning' }
				showIcon={ false }
				className={ styles[ 'broken-connection-alert' ] }
			>
				{ canFix
					? __(
							'Please fix the broken connections or disconnect them to create more connections.',
							'jetpack-publicize-components'
					  )
					: _n(
							'Broken connection',
							'Broken connections',
							brokenConnections.length,
							'jetpack-publicize-components'
					  ) }
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
