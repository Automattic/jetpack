import { Button, IconTooltip } from '@automattic/jetpack-components';
import { Panel, PanelBody } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import { useReducer } from 'react';
import ConnectionIcon from '../connection-icon';
import { ConnectionName } from './connection-name';
import { ConnectionStatus, ConnectionStatusProps } from './connection-status';
import { Disconnect } from './disconnect';
import { MarkAsShared } from './mark-as-shared';
import styles from './style.module.scss';

type ConnectionInfoProps = ConnectionStatusProps;

/**
 * Connection info component
 *
 * @param {ConnectionInfoProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ConnectionInfo( { connection, service }: ConnectionInfoProps ) {
	const [ isPanelOpen, togglePanel ] = useReducer( state => ! state, false );

	return (
		<>
			<div className={ styles[ 'connection-item' ] }>
				<ConnectionIcon
					serviceName={ connection.service_name }
					label={ connection.display_name }
					profilePicture={ connection.profile_picture }
				/>
				<div className={ styles[ 'connection-name-wrapper' ] }>
					<div className={ styles[ 'connection-item-name' ] }>
						<ConnectionName connection={ connection } />
					</div>
					<ConnectionStatus connection={ connection } service={ service } />
				</div>
				<Button
					size={ 'small' }
					className={ styles[ 'learn-more' ] }
					variant="tertiary"
					onClick={ togglePanel }
					aria-label={
						isPanelOpen
							? __( 'Close panel', 'jetpack' )
							: _x( 'Open panel', 'Accessibility label', 'jetpack' )
					}
				>
					{ <Icon className={ styles.chevron } icon={ isPanelOpen ? chevronUp : chevronDown } /> }
				</Button>
			</div>
			<Panel className={ styles[ 'connection-panel' ] }>
				<PanelBody opened={ isPanelOpen } onToggle={ togglePanel }>
					<div className={ styles[ 'mark-shared-wrap' ] }>
						<MarkAsShared connection={ connection } />
						<IconTooltip>
							{ __(
								'If enabled, the connection will be available to all administrators, editors, and authors.',
								'jetpack'
							) }
						</IconTooltip>
					</div>
					<Disconnect connection={ connection } />
				</PanelBody>
			</Panel>
		</>
	);
}
