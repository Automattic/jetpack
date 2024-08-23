import { useSelect } from '@wordpress/data';
import { store } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import styles from './styles.module.scss';

/**
 *
 * ShareInfo component
 *
 * @param {object} props       - component props
 * @param {object} props.share - share object
 * @return {import('react').ReactNode} - React element
 */
export function ShareInfo( { share } ) {
	const { connections } = useSelect( select => {
		return {
			connections: select( store ).getConnections(),
		};
	}, [] );

	console.log( { share, connections } );

	return (
		<div className={ styles[ 'share-item' ] }>
			{ /* <ConnectionIcon
				serviceName={ connection.service_name }
				label={ connection.display_name || connection.external_display }
				profilePicture={ connection.profile_picture }
			/> */ }
		</div>
	);
}
