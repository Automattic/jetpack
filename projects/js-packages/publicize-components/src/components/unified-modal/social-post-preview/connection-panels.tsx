/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import {
	Flex,
	FormToggle,
	__experimentalGrid as Grid,
	Panel,
	PanelBody,
	PanelRow,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import {
	getA11yLabelForConnectionPreview,
	getA11yLabelForConnectionToggle,
} from '../../../utils/misc';
import ConnectionIcon from '../../connection-icon';
import { useConnectionState } from '../../form/use-connection-state';
import { PostPreview } from '../../social-post-modal/post-preview';
import styles from './styles.module.scss';

/**
 * Connection Panels component for the social preview modal.
 *
 * @return - Connection Panels component.
 */
export function ConnectionPanels() {
	const { recordEvent } = useAnalytics();
	const { toggleById, connections } = useSocialMediaConnections();
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const onClickConnectionToggle = useCallback(
		( connection: Connection ) => () => {
			toggleById( connection.connection_id );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'preview_modal_small',
				enabled: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleById ]
	);

	return (
		<Panel>
			{ connections.map( connection => {
				const isEnabled = canBeTurnedOn( connection ) && connection.enabled;
				const isDisabled = shouldBeDisabled( connection );

				const ariaLabel = getA11yLabelForConnectionToggle( connection );

				return (
					<Grid key={ connection.connection_id } columns={ 2 } templateColumns="auto 1fr" gap={ 0 }>
						<div className={ styles[ 'toggle-wrapper' ] }>
							<FormToggle
								checked={ isEnabled }
								disabled={ isDisabled }
								aria-label={ ariaLabel }
								onClick={ onClickConnectionToggle( connection ) }
							/>
						</div>
						<PanelBody
							title={
								<div className={ styles[ 'connection-info' ] }>
									<div className={ styles[ 'display-name' ] } title={ connection.display_name }>
										{ connection.display_name }
									</div>
									<ConnectionIcon
										serviceName={ connection.service_name }
										// Avoid screen reader reading the label twice when the item is focused
										label=""
										profilePicture={ connection.profile_picture }
										disabled={ isDisabled }
									/>
								</div>
							}
							buttonProps={ {
								'aria-label': getA11yLabelForConnectionPreview( connection ),
							} }
							initialOpen={ false }
						>
							<PanelRow>
								<fieldset>
									<Flex className={ styles.preview } align="start" direction="column">
										<legend>{ __( 'Preview', 'jetpack-publicize-components' ) }</legend>
										<PostPreview connection={ connection } />
									</Flex>
								</fieldset>
							</PanelRow>
						</PanelBody>
					</Grid>
				);
			} ) }
		</Panel>
	);
}
