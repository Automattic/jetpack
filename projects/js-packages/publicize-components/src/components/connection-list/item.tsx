import { ToggleControl } from '@wordpress/components';
import { Connection } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import styles from './item-style.module.scss';

export type ConnectionListItemProps = {
	connection: Connection;
	onToggle: VoidFunction;
};

/**
 * The connection list item component.
 *
 * @param {ConnectionListItemProps} props - The connection list item props.
 * @return {JSX.Element} The connection list item component.
 */
export function ConnectionListItem( { connection, onToggle }: ConnectionListItemProps ) {
	return (
		<div className={ styles.wrapper }>
			<div className={ styles.content }>
				<ConnectionIcon
					serviceName={ connection.service_name }
					label={ connection.display_name }
					profilePicture={ connection.profile_picture }
				/>
				<div className={ styles[ 'display-name' ] }>{ connection.display_name }</div>
			</div>
			<ToggleControl
				className={ styles.toggle }
				checked={ connection.enabled }
				onChange={ onToggle }
				__nextHasNoMarginBottom={ true }
			/>
		</div>
	);
}
