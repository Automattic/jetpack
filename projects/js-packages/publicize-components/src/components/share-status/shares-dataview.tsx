import { useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { getDate, humanTimeDiff } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { ShareStatusItem } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ShareStatusAction } from './share-status-action';
import { ShareStatusLabel } from './share-status-label';
import styles from './styles.module.scss';

const getItemId = ( item: ShareStatusItem ) => {
	return `${ item.external_id || item.connection_id }:${ item.timestamp }`;
};

const noop = () => {};

/**
 * The component for the shares data view.
 *
 * @return {import('react').ReactNode} - The shares data view component.
 */
export function SharesDataView() {
	const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

	return (
		<div className={ styles[ 'dataview-wrapper' ] }>
			<DataViews
				getItemId={ getItemId }
				fields={ [
					{
						id: 'connection',
						label: __( 'Connection', 'jetpack' ),
						render: ( { item } ) => (
							<div className={ styles[ 'connection-name' ] }>
								<ConnectionIcon
									serviceName={ item.service }
									label={ item.external_name }
									profilePicture={ item.profile_picture }
								/>
								<div className={ styles[ 'share-item-name-wrapper' ] }>
									<div className={ styles[ 'share-item-name' ] }>{ item.external_name }</div>
								</div>
							</div>
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						id: 'timestamp',
						label: __( 'Time', 'jetpack' ),
						render: ( { item } ) => {
							return humanTimeDiff(
								// @ts-expect-error - humanTimeDiff is incorrectly typed, first argument can be a timestamp
								item.timestamp * 1000,
								getDate( null )
							);
						},
						enableSorting: false,
						enableHiding: false,
					},
					{
						id: 'status',
						label: __( 'Status', 'jetpack' ),
						render: ( { item } ) => (
							<ShareStatusLabel status={ item.status } message={ item.message } />
						),
						enableSorting: false,
						enableHiding: false,
					},
					{
						id: 'actions',
						label: __( 'Actions', 'jetpack' ),
						render: ( { item } ) => (
							<ShareStatusAction
								connectionId={ item.connection_id }
								status={ item.status }
								shareLink={ 'success' === item.status ? item.message : '' }
							/>
						),
						enableSorting: false,
						enableHiding: false,
					},
				] }
				data={ shareStatus.shares }
				view={ { type: 'table' } }
				defaultLayouts={ { table: {} } }
				onChangeView={ noop }
				paginationInfo={ {
					totalItems: shareStatus.shares.length,
					totalPages: 1,
				} }
			/>
		</div>
	);
}
