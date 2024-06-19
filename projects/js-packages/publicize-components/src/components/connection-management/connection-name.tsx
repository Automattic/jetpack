import { ExternalLink, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

type ConnectionNameProps = {
	connection: Connection;
	linkToProfile?: boolean;
	className?: string;
};

/**
 * Connection name component
 *
 * @param {ConnectionNameProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ConnectionName( {
	connection,
	className,
	linkToProfile = true,
}: ConnectionNameProps ) {
	const isUpdating = useSelect(
		select => {
			return select( socialStore ).getUpdatingConnections().includes( connection.connection_id );
		},
		[ connection.connection_id ]
	);

	const name = connection.display_name || connection.external_display;

	return (
		<div className={ clsx( styles[ 'connection-name' ], className ) } title={ name }>
			{ ! linkToProfile || ! connection.profile_link ? (
				<span className={ styles[ 'profile-link' ] }>{ name }</span>
			) : (
				<ExternalLink className={ styles[ 'profile-link' ] } href={ connection.profile_link }>
					{ name }
				</ExternalLink>
			) }
			{ isUpdating ? (
				<Spinner color="black" aria-label={ __( 'Updating account', 'jetpack' ) } />
			) : null }
		</div>
	);
}
