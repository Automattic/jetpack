/* eslint-disable wpcalypso/no-unsafe-wp-apis */
import { FlexBlock, FormToggle, __experimentalHStack as HStack } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { store } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { ConnectionName } from '../connection-management/connection-name';
import {
	ConnectionStatus,
	ConnectionStatusProps,
} from '../connection-management/connection-status';
import styles from './styles.module.scss';
import { useConnectionState } from './use-connection-state';

type ConnectionsListItemProps = ConnectionStatusProps & {
	onToggle: VoidFunction;
};

/**
 * Renders an individual connection item.
 *
 * @param {ConnectionsListItemProps} props - The component props.
 *
 * @returns {import('react').ReactElement} The rendered component.
 */
export function ConnectionsListItem( { connection, service, onToggle }: ConnectionsListItemProps ) {
	const instanceId = useInstanceId( ConnectionsListItem );
	const id = `connections-list-item-${ instanceId }`;

	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();
	const { connectionsAdminUrl } = usePublicizeConfig();

	const useAdminUiV1 = useSelect( select => select( store ).useAdminUiV1(), [] );

	return (
		<div className={ styles[ 'connection-wrap' ] }>
			<HStack justify="space-between" spacing={ 2 } className={ styles[ 'connection-toggle' ] }>
				<FlexBlock as="label" htmlFor={ id }>
					<ConnectionIcon
						serviceName={ connection.service_name }
						label={ connection.display_name || connection.external_display }
						profilePicture={ connection.profile_picture }
					/>
					<ConnectionName
						connection={ connection }
						linkToProfile={ false }
						className={ styles[ 'connection-name' ] }
					/>
				</FlexBlock>
				<FormToggle
					id={ id }
					checked={ canBeTurnedOn( connection ) && connection.enabled }
					onChange={ onToggle }
					disabled={ shouldBeDisabled( connection ) }
				/>
			</HStack>
			<ConnectionStatus
				connection={ connection }
				service={ service }
				// For WPCOM sites, point to connections management in Calypso
				fixConnectionLink={ ! useAdminUiV1 ? connectionsAdminUrl : undefined }
			/>
		</div>
	);
}
