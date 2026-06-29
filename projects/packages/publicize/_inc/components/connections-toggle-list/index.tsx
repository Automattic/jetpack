import { Button, FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { Connection } from '../../social-store/types';
import { getA11yLabelForConnectionToggle } from '../../utils/misc';
import { ConnectionIcon } from '../connection-icon';
import { useConnectionState } from '../form/use-connection-state';
import styles from './styles.module.scss';

export type ConnectionsToggleListProps = {
	onClickItem: ( connection: Connection ) => void;
	getItemClassName?: ( connection: Connection ) => string;
};

const noop = () => {};

/**
 * The component to render a list of social media connections as a toggle list.
 *
 * @param {ConnectionsToggleListProps} props - The component props.
 * @return React element
 */
export function ConnectionsToggleList( {
	onClickItem,
	getItemClassName,
}: ConnectionsToggleListProps ) {
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();
	const { connections } = useSocialMediaConnections();

	const onClickConnection = useCallback(
		( connection: Connection ) => () => {
			onClickItem( connection );
		},
		[ onClickItem ]
	);

	return (
		<div
			role="group"
			className={ styles.wrapper }
			aria-label={ __( 'Connection toggles', 'jetpack-publicize-pkg' ) }
		>
			{ connections.map( connection => {
				const isSelected = Boolean( canBeTurnedOn( connection ) && connection.enabled );

				const isDisabled = shouldBeDisabled( connection );

				const ariaLabel = getA11yLabelForConnectionToggle( connection );

				return (
					<Button
						key={ connection.connection_id }
						role="switch"
						disabled={ isDisabled }
						icon={
							<ConnectionIcon
								serviceName={ connection.service_name }
								label={ connection.display_name }
								profilePicture={ connection.profile_picture }
								disabled={ isDisabled }
							/>
						}
						iconPosition="right"
						onClick={ onClickConnection( connection ) }
						aria-label={ ariaLabel }
						aria-checked={ isSelected }
						className={ clsx( styles.item, getItemClassName?.( connection ) ) }
					>
						<div className={ styles[ 'connection-info' ] }>
							<FormToggle
								tabIndex={ -1 }
								checked={ isSelected }
								onChange={ noop }
								disabled={ isDisabled }
								aria-label={ ariaLabel }
							/>
							<div className={ styles[ 'display-name' ] } title={ connection.display_name }>
								{ connection.display_name }
							</div>
						</div>
					</Button>
				);
			} ) }
		</div>
	);
}
