import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Flex, FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import { getA11yLabelForConnectionToggle } from '../../../utils/misc';
import { useConnectionState } from '../../form/use-connection-state';
import styles from './styles.module.scss';

type ConnectionTogglesProps = {
	selectedConnection: Connection;
};

/**
 * Connection Toggles component for the social preview modal.
 *
 * @param {ConnectionTogglesProps} props - The component props.
 * @return - Connection Toggles component.
 */
export function ConnectionToggles( { selectedConnection }: ConnectionTogglesProps ) {
	const { recordEvent } = useAnalytics();
	const { toggleById } = useSocialMediaConnections();
	const { connections } = useSocialMediaConnections();
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const onClickConnectionToggle = useCallback(
		( connection: Connection ) => () => {
			toggleById( connection.connection_id );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'preview_modal',
				enabled: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleById ]
	);

	return (
		<div role="group" aria-label={ __( 'Connection toggles', 'jetpack-publicize-components' ) }>
			{ connections.map( connection => {
				const isEnabled = Boolean( canBeTurnedOn( connection ) && connection.enabled );
				const isDisabled = shouldBeDisabled( connection );
				const isSelected = selectedConnection?.connection_id === connection.connection_id;

				return (
					<Flex
						key={ connection.connection_id }
						className={ clsx( styles[ 'toggle-wrap' ], {
							[ styles[ 'selected-connection' ] ]: isSelected,
						} ) }
					>
						<FormToggle
							checked={ isEnabled }
							disabled={ isDisabled }
							aria-label={ getA11yLabelForConnectionToggle( connection ) }
							onClick={ onClickConnectionToggle( connection ) }
						/>
					</Flex>
				);
			} ) }
		</div>
	);
}
