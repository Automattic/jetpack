import { Flex, FormToggle, MenuGroup, MenuItem } from '@wordpress/components';
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
		<MenuGroup className={ styles.wrapper }>
			{ connections.map( connection => {
				const isSelected = canBeTurnedOn( connection ) && connection.enabled;
				const isDisabled = shouldBeDisabled( connection );

				const ariaLabel = getA11yLabelForConnectionToggle( connection );

				return (
					<MenuItem
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
						isSelected={ isSelected }
						onClick={ onClickConnection( connection ) }
						aria-label={ ariaLabel }
						aria-checked={ isSelected }
						className={ clsx( styles.item, getItemClassName?.( connection ) ) }
					>
						<Flex justify="start">
							<FormToggle
								tabIndex={ -1 }
								checked={ isSelected }
								disabled={ isDisabled }
								aria-label={ ariaLabel }
							/>
							<div className={ styles[ 'display-name' ] } title={ connection.display_name }>
								{ connection.display_name }
							</div>
						</Flex>
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
}
