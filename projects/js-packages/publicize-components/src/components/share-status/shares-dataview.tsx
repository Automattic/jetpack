import { DataViews } from '@wordpress/dataviews';
import { getDate, humanTimeDiff } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { PostShareStatus, ShareStatusItem } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ShareStatusAction } from './share-status-action';
import { ShareStatusLabel } from './share-status-label';
import styles from './styles.module.scss';

const getItemId = ( item: ShareStatusItem ) => {
	return `${ item.external_id || item.connection_id }:${ item.timestamp }`;
};

const noop = () => {};

type SharesDataViewProps = {
	postShareStatus: PostShareStatus;
};

/**
 * The component for the shares data view.
 *
 * @param {SharesDataViewProps} props - The component props.
 *
 * @return - The shares data view component.
 */
export function SharesDataView( { postShareStatus }: SharesDataViewProps ) {
	return (
		<div className={ styles[ 'dataview-wrapper' ] }>
			<DataViews
				isLoading={ postShareStatus.loading }
				getItemId={ getItemId }
				data={ postShareStatus.shares }
				view={ { type: 'table', fields: [ 'connection', 'timestamp', 'status', 'actions' ] } }
				defaultLayouts={ { table: {} } }
				onChangeView={ noop }
				paginationInfo={ {
					totalItems: postShareStatus.shares.length,
					totalPages: 1,
				} }
				fields={ [
					{
						id: 'connection',
						label: __( 'Connection', 'jetpack-publicize-components' ),
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
					},
					{
						id: 'timestamp',
						label: __( 'Time', 'jetpack-publicize-components' ),
						render: ( { item } ) => {
							return humanTimeDiff(
								// @ts-expect-error - humanTimeDiff is incorrectly typed, first argument can be a timestamp
								item.timestamp * 1000,
								getDate( null )
							);
						},
					},
					{
						id: 'status',
						label: __( 'Status', 'jetpack-publicize-components' ),
						render: ( { item } ) => (
							<ShareStatusLabel status={ item.status } message={ item.message } />
						),
					},
					{
						id: 'actions',
						label: __( 'Actions', 'jetpack-publicize-components' ),
						render: ( { item } ) => <ShareStatusAction shareItem={ item } />,
					},
				].map( field => ( {
					...field,
					enableSorting: false,
					enableHiding: false,
				} ) ) }
			/>
		</div>
	);
}
