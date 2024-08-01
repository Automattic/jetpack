import { TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import styles from './styles.module.scss';

/**
 * Preview section of the social post modal.
 *
 * @returns {import('react').ReactNode} - Preview section of the social post modal.
 */
export function PreviewSection() {
	const connections = useSelect(
		select =>
			select( socialStore )
				.getConnections()
				.map( connection => {
					const title = connection.display_name || connection.external_display;

					return {
						...connection,
						name: `${ connection.service_name }-${ connection.connection_id }`,
						title,
						icon: (
							<ConnectionIcon
								label={ title }
								serviceName={ connection.service_name }
								profilePicture={ connection.profile_picture }
							/>
						),
					};
				} ),
		[]
	);

	return (
		<div className={ styles[ 'preview-section' ] }>
			<TabPanel tabs={ connections }>
				{ ( connection: Connection ) => (
					<div className={ styles[ 'preview-content' ] }>
						Content for { connection.display_name || connection.external_display }
					</div>
				) }
			</TabPanel>
		</div>
	);
}
