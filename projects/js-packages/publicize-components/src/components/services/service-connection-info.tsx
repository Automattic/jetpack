import { IconTooltip, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
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
					if ( conn.status === 'broken' ) {
						return <ConnectionStatus connection={ conn } service={ service } />;
					}

					if ( isAdmin ) {
						return (
							<div className={ styles[ 'mark-shared-wrap' ] }>
								<MarkAsShared connection={ conn } />
								<IconTooltip placement="top" inline={ false } shift>
									{ __(
										'If enabled, the connection will be available to all administrators, editors, and authors.',
										'jetpack'
									) }
								</IconTooltip>
							</div>
						);
					}

					return ! conn.can_disconnect ? (
						<Text className={ styles.description }>
							{ __( 'This connection is added by a site administrator.', 'jetpack' ) }
						</Text>
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
