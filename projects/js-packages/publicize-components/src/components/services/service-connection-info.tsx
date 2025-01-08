import { IconTooltip, Text } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ConnectionName } from '../connection-management/connection-name';
import { ConnectionStatus } from '../connection-management/connection-status';
import { Disconnect } from '../connection-management/disconnect';
import { MarkAsShared } from '../connection-management/mark-as-shared';
import styles from './style.module.scss';
import { SupportedService } from './use-supported-services';

export type ServiceConnectionInfoProps = {
	connection: Connection;
	service: SupportedService;
	isAdmin?: boolean;
};

export const ServiceConnectionInfo = ( {
	connection,
	service,
	isAdmin,
}: ServiceConnectionInfoProps ) => {
	const canManageConnection = useSelect(
		select => select( socialStore ).canUserManageConnection( connection ),
		[ connection ]
	);

	return (
		<div className={ styles[ 'service-connection' ] }>
			<div>
				{ connection.profile_picture ? (
					<img
						className={ styles[ 'profile-pic' ] }
						src={ connection.profile_picture }
						alt={ connection.display_name }
					/>
				) : (
					<service.icon iconSize={ 40 } />
				) }
			</div>
			<div className={ styles[ 'connection-details' ] }>
				<ConnectionName connection={ connection } />
				{ ( conn => {
					/**
					 * Showing only the connection status makes sense only
					 * if the user can disconnect the connection.
					 * Otherwise, non-admin authors will see only the status without any further context.
					 */
					if ( conn.status === 'broken' && canManageConnection ) {
						return <ConnectionStatus connection={ conn } service={ service } />;
					}

					// Only admins can mark connections as shared
					if ( isAdmin ) {
						return (
							<div className={ styles[ 'mark-shared-wrap' ] }>
								<MarkAsShared connection={ conn } />
								<IconTooltip placement="top" inline={ false } shift>
									{ __(
										'If enabled, the connection will be available to all administrators, editors, and authors.',
										'jetpack-publicize-components'
									) }
								</IconTooltip>
							</div>
						);
					}

					/**
					 * Now if the user is not an admin, we tell them that the connection
					 * was added by an admin and show the connection status if it's broken.
					 */
					return ! canManageConnection ? (
						<>
							<Text className={ styles.description }>
								{ __(
									'This connection is added by a site administrator.',
									'jetpack-publicize-components'
								) }
							</Text>
							{ conn.status === 'broken' ? (
								<ConnectionStatus connection={ conn } service={ service } />
							) : null }
						</>
					) : null;
				} )( connection ) }
			</div>
			<div className={ styles[ 'connection-actions' ] }>
				<Disconnect
					connection={ connection }
					isDestructive={ false }
					variant="tertiary"
					buttonClassName={ styles.disconnect }
				/>
			</div>
		</div>
	);
};
