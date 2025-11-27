import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Panel, PanelBody, PanelRow, useNavigator } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import { ConnectionsToggleList } from '../../connections-toggle-list';
import styles from './styles.module.scss';

type SidebarProps = {
	onClickConnection: ( connection: Connection ) => void;
	selectedConnection: Connection | null;
};

/**
 * Sidebar component for the social preview modal.
 *
 * @param {SidebarProps} props - The component props.
 * @return - Sidebar component.
 */
export function Sidebar( { onClickConnection, selectedConnection }: SidebarProps ) {
	const { recordEvent } = useAnalytics();
	const { toggleById } = useSocialMediaConnections();

	const onClickConnectionToggle = useCallback(
		( connection: Connection ) => {
			toggleById( connection.connection_id );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'preview_modal',
				enabled: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleById ]
	);

	const getItemClassName = useCallback(
		( connection: Connection ) => {
			return selectedConnection?.connection_id === connection.connection_id
				? styles[ 'selected-connection' ]
				: undefined;
		},
		[ selectedConnection ]
	);

	const navigator = useNavigator();

	const gotoEditTemplate = useCallback( () => {
		navigator.goTo( '/edit-template' );
	}, [ navigator ] );

	return (
		<div className={ styles.sidebar }>
			<Panel className={ styles.panel }>
				<PanelBody title={ __( 'Account previews', 'jetpack-publicize-components' ) } initialOpen>
					<PanelRow>
						<ConnectionsToggleList
							onClickItem={ onClickConnection }
							onClickToggle={ onClickConnectionToggle }
							getItemClassName={ getItemClassName }
						/>
					</PanelRow>
				</PanelBody>
				<PanelBody
					title={ __( 'Customize', 'jetpack-publicize-components' ) }
					initialOpen={ false }
				>
					<PanelRow>
						{ /* TODO: Replace Edit template button with full image editor UI when SIG integration is complete. */ }
						<Button onClick={ gotoEditTemplate } variant="secondary">
							{ __( 'Edit template', 'jetpack-publicize-components' ) }
						</Button>
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
}
