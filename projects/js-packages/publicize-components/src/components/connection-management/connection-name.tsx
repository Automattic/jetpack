import { ExternalLink, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

type ConnectionNameProps = {
	connection: Connection;
};

/**
 * Connection name component
 *
 * @param {ConnectionNameProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ConnectionName( { connection }: ConnectionNameProps ) {
	const isUpdating = useSelect(
		select => {
			return select( socialStore ).getUpdatingConnections().includes( connection.connection_id );
		},
		[ connection.connection_id ]
	);

	return (
		<div className={ styles[ 'connection-name' ] }>
			{ ! connection.profile_link ? (
				<span className={ styles[ 'profile-link' ] }>{ connection.display_name }</span>
			) : (
				<ExternalLink className={ styles[ 'profile-link' ] } href={ connection.profile_link }>
					{ connection.display_name || connection.external_display }
				</ExternalLink>
			) }
			{ isUpdating ? (
				<Spinner color="black" aria-label={ __( 'Updating account', 'jetpack' ) } />
			) : null }
		</div>
	);
}
