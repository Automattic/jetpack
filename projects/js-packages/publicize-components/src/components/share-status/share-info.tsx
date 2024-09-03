import { getDate, humanTimeDiff } from '@wordpress/date';
import ConnectionIcon from '../connection-icon';
import { ShareStatusAction } from './share-status-action';
import { ShareStatusLabel } from './share-status-label';
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
	const { service, external_name, profile_picture, timestamp, status, message, connection_id } =
		share;

	return (
		<div className={ styles[ 'share-item' ] }>
			<ConnectionIcon
				serviceName={ service }
				label={ external_name }
				profilePicture={ profile_picture }
			/>
			<div className={ styles[ 'share-item-name-wrapper' ] }>
				<div className={ styles[ 'share-item-name' ] }>{ external_name }</div>
			</div>
			<div>
				{
					// @ts-expect-error - humanTimeDiff is incorrectly typed, first argument can be a timestamp
					humanTimeDiff( timestamp * 1000, getDate() )
				}
			</div>
			<ShareStatusLabel status={ status } message={ message } />
			<ShareStatusAction
				connectionId={ connection_id }
				status={ status }
				service={ service }
				shareLink={ 'success' === status ? message : '' }
			/>
		</div>
	);
}
