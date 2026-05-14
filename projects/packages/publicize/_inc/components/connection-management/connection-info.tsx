import { Text } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronDown, info } from '@wordpress/icons';
import { Collapsible, Tooltip } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { XNotice } from '../services/x-notice';
import { ConnectionName } from './connection-name';
import { ConnectionStatus, ConnectionStatusProps } from './connection-status';
import { ConnectionTemplateEditor } from './connection-template';
import { Disconnect } from './disconnect';
import { MarkAsShared } from './mark-as-shared';
import styles from './style.module.scss';
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
export function ConnectionInfo( { connection, service, canMarkAsShared }: ConnectionInfoProps ) {
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
				<div className={ styles[ 'connection-name-wrapper' ] }>
					<div className={ styles[ 'connection-item-name' ] }>
						<ConnectionName connection={ connection } />
					</div>
					{ hasStatus ? (
						<div
							className={ styles[ 'connection-status-wrap' ] }
							onClick={ stopPropagation }
							onKeyDown={ stopPropagation }
							role="presentation"
						>
							<ConnectionStatus connection={ connection } service={ service } />
						</div>
					) : (
						<span className={ styles[ 'connection-network' ] }>{ service?.label }</span>
					) }
				</div>
				<Icon className={ styles.chevron } icon={ chevronDown } />
			</Collapsible.Trigger>
			<Collapsible.Panel className={ styles[ 'connection-panel' ] }>
				<div className={ styles[ 'connection-panel-inner' ] }>
					{ canMarkAsShared && (
						<div className={ styles[ 'mark-shared-wrap' ] }>
							<MarkAsShared connection={ connection } />
							<Tooltip.Root>
								<Tooltip.Trigger
									render={
										<button
											type="button"
											className={ styles[ 'mark-shared-help' ] }
											aria-label={ markAsSharedHelp }
										>
											<Icon icon={ info } size={ 18 } />
										</button>
									}
								/>
								<Tooltip.Popup sideOffset={ 8 }>{ markAsSharedHelp }</Tooltip.Popup>
							</Tooltip.Root>
						</div>
					) }
					<div className={ styles[ 'connection-template-wrap' ] }>
						<ConnectionTemplateEditor connection={ connection } />
					</div>
					{ canManageConnection ? (
						<Disconnect connection={ connection } />
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
