import {
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { format } from '@wordpress/date';
import { useCallback, useReducer } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { Connection } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ClockIcon } from './clock-icon';
import styles from './item-style.module.scss';

export type ScheduledPostItemProps = {
	connection: Connection;
	scheduledAt: number;
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
	const date = format(
		// "Wed, Mar 5, 2025 2:34 PM"
		'D, M j, o g:i A',
		new Date( scheduledAt * 1000 ).toUTCString()
	);

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
