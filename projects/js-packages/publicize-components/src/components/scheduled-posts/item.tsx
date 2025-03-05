import {
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useCallback, useReducer } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import moment from 'moment';
import { Connection } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ClockIcon } from './clock-icon';
import styles from './item-style.module.scss';

export type ScheduledPostItemProps = {
	connection: Connection;
	scheduledAt: string;
	onDelete: VoidFunction;
	confirmDeletion?: boolean;
};

/**
 * The component to render a single scheduled post.
 *
 * @param {ScheduledPostItemProps} props - Component props.
 * @return - React element
 */
export function ScheduledPostItem( {
	connection,
	scheduledAt,
	onDelete,
	confirmDeletion = true,
}: ScheduledPostItemProps ) {
	const date = moment( scheduledAt ).format( 'llll' );

	const [ showConfirmation, toggleConfirmation ] = useReducer( state => ! state, false );

	const onConfirm = useCallback( () => {
		onDelete();
		toggleConfirmation();
	}, [ onDelete ] );

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.content }>
				<ConnectionIcon
					serviceName={ connection.service_name }
					label={ connection.display_name }
					profilePicture={ connection.profile_picture }
				/>
				<div className={ styles[ 'display-name' ] }>{ connection.display_name }</div>
				<div className={ styles.date }>
					<ClockIcon />
					{ date }
				</div>
			</div>
			<div className={ styles.actions }>
				<Button
					label={ __( 'Delete', 'jetpack-publicize-components' ) }
					icon={ trash }
					className={ styles[ 'delete-button' ] }
					onClick={ confirmDeletion ? toggleConfirmation : onDelete }
				/>
				{ confirmDeletion ? (
					<ConfirmDialog
						isOpen={ showConfirmation }
						onConfirm={ onConfirm }
						onCancel={ toggleConfirmation }
						confirmButtonText={ __( 'Delete', 'jetpack-publicize-components' ) }
					>
						{ __( 'Are you sure you want to delete this post?', 'jetpack-publicize-components' ) }
					</ConfirmDialog>
				) : null }
			</div>
		</div>
	);
}
