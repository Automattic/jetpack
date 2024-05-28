import { ExternalLink, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
	if ( connection.display_name ) {
		return (
			<div className={ styles[ 'connection-name' ] }>
				{ ! connection.profile_link ? (
					<span className={ styles[ 'profile-link' ] }>{ connection.display_name }</span>
				) : (
					<ExternalLink className={ styles[ 'profile-link' ] } href={ connection.profile_link }>
						{ connection.display_name }
					</ExternalLink>
				) }
			</div>
		);
	}
	return <Spinner color="black" aria-label={ __( 'Loading account details', 'jetpack' ) } />;
}
