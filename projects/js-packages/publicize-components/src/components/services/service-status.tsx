import { Button } from '@automattic/jetpack-components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

export type ServiceStatusProps = {
	serviceConnections: Array< Connection >;
	onClickBroken?: VoidFunction;
};

/**
 * Service status component
 *
 * @param {ServiceStatusProps} props - Component props
 *
 * @returns {import('react').ReactNode} Service status component
 */
export function ServiceStatus( { serviceConnections, onClickBroken }: ServiceStatusProps ) {
	if ( ! serviceConnections.length ) {
		return null;
	}

	if ( serviceConnections.some( ( { status } ) => status === 'broken' ) ) {
		return (
			<span>
				<Button
					variant="link"
					className={ styles[ 'broken-connection' ] }
					onClick={ onClickBroken }
				>
					{ serviceConnections.length > 1
						? __( 'Broken connections', 'jetpack' )
						: _x( 'Broken connection', '', 'jetpack' ) }
				</Button>
			</span>
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
