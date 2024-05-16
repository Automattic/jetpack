import { Connection } from '../../social-store/types';
import { ConnectionName } from '../connection-management/connection-name';
import { Disconnect } from '../connection-management/disconnect';
import { MarkAsShared } from '../connection-management/mark-as-shared';
import styles from './style.module.scss';
import { SupportedService } from './use-supported-services';

export type ServiceConnectionInfoProps = {
	connection: Connection;
	service: SupportedService;
};

export const ServiceConnectionInfo = ( { connection, service }: ServiceConnectionInfoProps ) => {
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
				<div>
					<MarkAsShared connection={ connection } />
				</div>
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
