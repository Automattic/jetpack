import { IconTooltip, Text } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ConnectionName } from '../connection-management/connection-name';
import { ConnectionStatus } from '../connection-management/connection-status';
import { ConnectionTemplateEditor } from '../connection-management/connection-template';
import { Disconnect } from '../connection-management/disconnect';
import { MarkAsShared } from '../connection-management/mark-as-shared';
import styles from './style.module.scss';
import { SupportedService } from './types';

export type ServiceConnectionInfoProps = {
	connection: Connection;
	service: SupportedService;
	canMarkAsShared: boolean;
};

export const ServiceConnectionInfo = ( {
	connection,
	service,
	canMarkAsShared,
}: ServiceConnectionInfoProps ) => {
	const canManageConnection = useSelect(
		select => select( socialStore ).canUserManageConnection( connection ),
		[ connection ]
	);

	return (
		<div className={ styles[ 'service-connection-wrapper' ] }>
			<div className={ styles[ 'service-connection' ] }>
				<div>
					<ConnectionIcon
						className={ styles[ 'profile-pic' ] }
						profilePicture={ connection.profile_picture }
						label={ connection.display_name }
					/>
				</div>
				<div className={ styles[ 'connection-details' ] }>
					<ConnectionName connection={ connection } />
					{ ( conn => {
						/**
						 * Showing only the connection status makes sense only
						 * if the user can disconnect the connection.
						 * Otherwise, non-admin authors will see only the status without any further context.
						 */
						if (
							( conn.status === 'broken' || conn.status === 'must_reauth' ) &&
							canManageConnection
						) {
							return <ConnectionStatus connection={ conn } service={ service } />;
						}

						if ( canMarkAsShared ) {
							return (
								<div className={ styles[ 'mark-shared-wrap' ] }>
									<MarkAsShared connection={ conn } />
									<IconTooltip placement="top" inline={ false } shift>
										{ __(
											'If enabled, the connection will be available to all administrators, editors, and authors.',
											'jetpack-publicize-pkg'
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
										'jetpack-publicize-pkg'
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
					<Disconnect connection={ connection } variant="minimal" />
				</div>
			</div>
			<ConnectionTemplateEditor connection={ connection } />
		</div>
	);
};
