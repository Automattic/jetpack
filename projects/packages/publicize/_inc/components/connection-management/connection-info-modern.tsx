import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, info } from '@wordpress/icons';
import { Collapsible, Icon, IconButton, Stack, Text } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { XNotice } from '../services/x-notice';
import { ConnectionName } from './connection-name';
import { ConnectionStatus, ConnectionStatusProps } from './connection-status';
import { ConnectionTemplateEditor } from './connection-template';
import { Disconnect } from './disconnect';
import { MarkAsShared } from './mark-as-shared';
import styles from './style-modern.module.scss';
import type { SyntheticEvent } from 'react';

type ConnectionInfoProps = ConnectionStatusProps & {
	canMarkAsShared: boolean;
};

const stopPropagation = ( event: SyntheticEvent ) => event.stopPropagation();

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

	return (
		<Collapsible.Root open={ isPanelOpen } onOpenChange={ setIsPanelOpen }>
			<Collapsible.Trigger
				className={ styles[ 'connection-row' ] }
				nativeButton={ false }
				render={ <div /> }
			>
				<ConnectionIcon
					serviceName={ connection.service_name }
					label={ connection.display_name }
					profilePicture={ connection.profile_picture }
					size="medium"
				/>
				<Stack direction="column" gap="xs" className={ styles[ 'connection-name-wrapper' ] }>
					{ /*
					 * The profile-name link lives inside the row, which doubles as
					 * the Collapsible.Trigger. Without stopping propagation a click
					 * on the link would also toggle the disclosure (and an anchor
					 * inside role="button" is invalid nesting). Mirror the
					 * connection-status-wrap below so the link opens the profile
					 * without toggling the panel.
					 */ }
					<Text
						variant="body-lg"
						className={ styles[ 'connection-item-name' ] }
						onClick={ stopPropagation }
						onKeyDown={ stopPropagation }
						role="presentation"
					>
						<ConnectionName connection={ connection } tone="neutral" />
					</Text>
					{ hasStatus ? (
						<Stack
							direction="column"
							gap="xs"
							onClick={ stopPropagation }
							onKeyDown={ stopPropagation }
							role="presentation"
						>
							<ConnectionStatus connection={ connection } service={ service } />
						</Stack>
					) : (
						<Text variant="body-md" className={ styles[ 'connection-network' ] }>
							{ service?.label }
						</Text>
					) }
				</Stack>
				<Icon className={ styles.chevron } icon={ chevronDown } />
			</Collapsible.Trigger>
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
					{ service?.id === 'x' && <XNotice /> }
				</div>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
