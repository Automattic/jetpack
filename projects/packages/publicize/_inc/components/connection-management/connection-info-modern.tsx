import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, info } from '@wordpress/icons';
import { Collapsible, Icon, IconButton, Stack, Text } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { useServiceLabel } from '../services/use-service-label';
import { ConnectionName } from './connection-name';
import { ConnectionStatus, ConnectionStatusProps } from './connection-status';
import { ConnectionTemplateEditor } from './connection-template';
import { Disconnect } from './disconnect';
import { MarkAsShared } from './mark-as-shared';
import styles from './style-modern.module.scss';

type ConnectionInfoProps = ConnectionStatusProps & {
	canMarkAsShared: boolean;
};

/**
 * Connection info component
 *
 * @param {ConnectionInfoProps} props - component props
 *
 * @return React element
 */
export function ModernConnectionInfo( {
	connection,
	service,
	canMarkAsShared,
}: ConnectionInfoProps ) {
	const [ isPanelOpen, setIsPanelOpen ] = useState( false );

	const getServiceLabel = useServiceLabel();

	const { canManageConnection, isUnsupported } = useSelect(
		select => {
			const { canUserManageConnection, getServicesBy } = select( socialStore );

			return {
				canManageConnection: canUserManageConnection( connection ),
				isUnsupported: getServicesBy( 'status', 'unsupported' ).some(
					( { id } ) => id === connection.service_name
				),
			};
		},
		[ connection ]
	);

	const hasStatus =
		connection.status === 'broken' || connection.status === 'must_reauth' || isUnsupported;

	const markAsSharedHelp = __(
		'If enabled, the connection will be available to all administrators, editors, and authors.',
		'jetpack-publicize-pkg'
	);

	const toggleLabel = sprintf(
		/* translators: %1$s: name of the connected social media account. %2$s: name of the social network, e.g. Facebook. */
		__( 'Toggle details for %1$s on %2$s', 'jetpack-publicize-pkg' ),
		connection.display_name,
		getServiceLabel( connection.service_name )
	);

	return (
		<Collapsible.Root open={ isPanelOpen } onOpenChange={ setIsPanelOpen }>
			{ /*
			 * The row is a plain container, not the trigger: it holds the profile
			 * name link (and, when broken, the Reconnect link), and an interactive
			 * <a> may not be nested inside a role="button". Only the chevron is the
			 * disclosure trigger, so the links stay siblings of the button.
			 */ }
			<div className={ styles[ 'connection-row' ] }>
				<ConnectionIcon
					serviceName={ connection.service_name }
					label={ connection.display_name }
					profilePicture={ connection.profile_picture }
					size="medium"
				/>
				<Stack direction="column" gap="xs" className={ styles[ 'connection-name-wrapper' ] }>
					<Text variant="body-lg" className={ styles[ 'connection-item-name' ] }>
						<ConnectionName connection={ connection } tone="neutral" />
					</Text>
					{ hasStatus ? (
						<ConnectionStatus connection={ connection } service={ service } />
					) : (
						<Text variant="body-md" className={ styles[ 'connection-network' ] }>
							{ service?.label }
						</Text>
					) }
				</Stack>
				<Collapsible.Trigger className={ styles[ 'panel-toggle' ] } aria-label={ toggleLabel }>
					<Icon className={ styles.chevron } icon={ chevronDown } />
				</Collapsible.Trigger>
			</div>
			<Collapsible.Panel className={ styles[ 'connection-panel' ] }>
				<div className={ styles[ 'connection-panel-inner' ] }>
					{ canMarkAsShared && (
						<Stack
							direction="row"
							align="center"
							gap="sm"
							className={ styles[ 'mark-shared-wrap' ] }
						>
							<MarkAsShared connection={ connection } />
							<IconButton
								variant="minimal"
								tone="neutral"
								size="small"
								label={ markAsSharedHelp }
								icon={ info }
							/>
						</Stack>
					) }
					<div className={ styles[ 'connection-template-wrap' ] }>
						<ConnectionTemplateEditor connection={ connection } />
					</div>
					{ canManageConnection ? (
						<Disconnect connection={ connection } size="compact" tone="neutral" />
					) : (
						<Text className={ styles.description }>
							{ __( 'This connection is added by a site administrator.', 'jetpack-publicize-pkg' ) }
						</Text>
					) }
				</div>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
