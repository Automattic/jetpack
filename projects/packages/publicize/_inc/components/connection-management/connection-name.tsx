import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

type ConnectionNameProps = {
	connection: Connection;
	/** Link tone. Defaults to the WPDS link default; the modernized chassis passes "neutral". */
	tone?: 'neutral';
};

/**
 * Connection name component
 *
 * @param {ConnectionNameProps} props            - component props
 * @param {Connection}          props.connection - the connection to render
 * @param {string}              props.tone       - optional WPDS link tone
 *
 * @return {import('react').ReactNode} - React element
 */
export function ConnectionName( { connection, tone }: ConnectionNameProps ) {
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
				<Link
					openInNewTab
					tone={ tone }
					className={ styles[ 'profile-link' ] }
					href={ connection.profile_link }
				>
					{ connection.display_name }
				</Link>
			) }
			{ isUpdating ? (
				<Spinner color="black" aria-label={ __( 'Updating account', 'jetpack-publicize-pkg' ) } />
			) : null }
		</div>
	);
}
