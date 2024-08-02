import { TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { useService } from '../services/use-service';
import { PostPreview } from './post-preview';
import styles from './styles.module.scss';

/**
 * Preview section of the social post modal.
 *
 * @returns {import('react').ReactNode} - Preview section of the social post modal.
 */
export function PreviewSection() {
	const getService = useService();

	const connections = useSelect(
		select => {
			const store = select( socialStore );

			return (
				store
					.getConnections()
					// Ensure the service is supported
					// to avoid errors for old connections like Twitter
					.filter( ( { service_name } ) => getService( service_name ) )
					.map( connection => {
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
					} )
			);
		},
		[ getService ]
	);

	return (
		<div className={ styles[ 'preview-section' ] }>
			<TabPanel tabs={ connections }>
				{ ( tab: ( typeof connections )[ number ] ) => (
					<div className={ styles[ 'preview-content' ] }>
						<PostPreview connection={ tab } />
					</div>
				) }
			</TabPanel>
		</div>
	);
}
