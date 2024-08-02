import { TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import styles from './styles.module.scss';

/**
 * Preview section of the social post modal.
 *
 * @returns {import('react').ReactNode} - Preview section of the social post modal.
 */
export function PreviewSection() {
	const connections = useSelect( select => {
		const store = select( socialStore );

		return store.getConnections().map( connection => {
			const title = connection.display_name || connection.external_display;
			const name = `${ connection.service_name }-${ connection.connection_id }`;
			const icon = (
				<ConnectionIcon
					label={ title }
					serviceName={ connection.service_name }
					profilePicture={ connection.profile_picture }
				/>
			);

			return {
				...connection,
				// Add the props needed for the TabPanel component
				name,
				title,
				icon,
			};
		} );
	}, [] );

	return (
		<div className={ styles[ 'preview-section' ] }>
			<TabPanel tabs={ connections }>
				{ ( tab: ( typeof connections )[ number ] ) => (
					<div className={ styles[ 'preview-content' ] }>Content for { tab.title }</div>
				) }
			</TabPanel>
		</div>
	);
}
