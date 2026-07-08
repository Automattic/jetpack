import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { IconButton, Stack, Text } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ConnectionName } from '../connection-management/connection-name';
import { ConnectionStatus } from '../connection-management/connection-status';
import { ConnectionTemplateEditor } from '../connection-management/connection-template';
import { Disconnect } from '../connection-management/disconnect';
import { MarkAsShared } from '../connection-management/mark-as-shared';
import styles from './style-modern.module.scss';
import { SupportedService } from './types';

export type ServiceConnectionInfoProps = {
	connection: Connection;
	service: SupportedService;
	canMarkAsShared: boolean;
};

export const ModernServiceConnectionInfo = ( {
	connection,
	service,
	canMarkAsShared,
}: ServiceConnectionInfoProps ) => {
	const canManageConnection = useSelect(
		select => select( socialStore ).canUserManageConnection( connection ),
		[ connection ]
	);

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="row" gap="lg">
				<div>
					<ConnectionIcon
						className={ styles[ 'profile-pic' ] }
						profilePicture={ connection.profile_picture }
						label={ connection.display_name }
					/>
				</div>
				<Stack
					direction="column"
					align="flex-start"
					gap="sm"
					className={ styles[ 'connection-details' ] }
				>
					<ConnectionName connection={ connection } tone="neutral" />
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
							const markAsSharedHelp = __(
								'If enabled, the connection will be available to all administrators, editors, and authors.',
								'jetpack-publicize-pkg'
							);

							return (
								<Stack direction="row" align="center" gap="sm">
									<MarkAsShared connection={ conn } />
									{ /*
									 * IconButton carries its own tooltip + accessible
									 * label, so it replaces the hand-rolled button and
									 * Tooltip. Now that the modal is a portaled WPDS
									 * Dialog, the tooltip stacks above the frame on its
									 * own — the previous `z-index: 100001` workaround is
									 * no longer needed.
									 */ }
									<IconButton
										variant="minimal"
										tone="neutral"
										size="small"
										label={ markAsSharedHelp }
										icon={ info }
									/>
								</Stack>
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
				</Stack>
				<div className={ styles[ 'connection-actions' ] }>
					<Disconnect connection={ connection } variant="outline" size="compact" tone="neutral" />
				</div>
			</Stack>
			<ConnectionTemplateEditor connection={ connection } />
		</Stack>
	);
};
