import { ExternalLink, Spinner } from '@wordpress/components';
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
		if ( ! connection.profile_link ) {
			return <span>{ connection.display_name }</span>;
		}
		return (
			<ExternalLink className={ styles[ 'profile-link' ] } href={ connection.profile_link }>
				{ connection.display_name }
			</ExternalLink>
		);
	}
	return <Spinner color="black" />;
}
