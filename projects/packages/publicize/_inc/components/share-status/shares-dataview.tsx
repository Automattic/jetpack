import { type Field, type View, DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { getDate, humanTimeDiff } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PostShareStatus, ShareStatusItem } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ShareStatusAction } from './share-status-action';
import { ShareStatusLabel } from './share-status-label';
import styles from './styles.module.scss';

// Field IDs as constants
const FIELD_CONNECTION = 'connection';
const FIELD_TIME = 'time';
const FIELD_STATUS = 'status';
const FIELD_ACTIONS = 'actions';

const getItemId = ( item: ShareStatusItem ) => {
	return `${ item.external_id || item.connection_id }:${ item.timestamp }`;
};

type SharesDataViewProps = {
	postShareStatus: PostShareStatus;
};

/**
 * The component for the shares data view.
 *
 * @param {SharesDataViewProps} props - The component props.
 *
 * @return {import('react').ReactNode} - The shares data view component.
 */
export function SharesDataView( { postShareStatus }: SharesDataViewProps ) {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		fields: [ FIELD_CONNECTION, FIELD_TIME, FIELD_STATUS, FIELD_ACTIONS ],
	} );

	const fields = useMemo(
		(): Field< ShareStatusItem >[] => [
			{
				id: FIELD_CONNECTION,
				label: __( 'Connection', 'jetpack-publicize-pkg' ),
				enableHiding: false,
				getValue: ( { item } ) => item.external_name,
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
				id: FIELD_TIME,
				label: __( 'Time', 'jetpack-publicize-pkg' ),
				type: 'datetime',
				enableHiding: false,
				getValue: ( { item } ) => new Date( item.timestamp * 1000 ),
				render: ( { item } ) => humanTimeDiff( item.timestamp * 1000, getDate( null ) ),
			},
			{
				id: FIELD_STATUS,
				label: __( 'Status', 'jetpack-publicize-pkg' ),
				enableHiding: false,
				getValue: ( { item } ) => item.status,
				render: ( { item } ) => (
					<ShareStatusLabel status={ item.status } message={ item.message } />
				),
			},
			{
				id: FIELD_ACTIONS,
				label: __( 'Actions', 'jetpack-publicize-pkg' ),
				enableHiding: false,
				render: ( { item } ) => <ShareStatusAction shareItem={ item } />,
			},
		],
		[]
	);

	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( postShareStatus.shares, view, fields );
	}, [ postShareStatus.shares, view, fields ] );

	const onChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );

	return (
		<div className={ styles[ 'dataview-wrapper' ] }>
			<DataViews
				getItemId={ getItemId }
				fields={ fields }
				data={ processedData }
				view={ view }
				defaultLayouts={ { table: {} } }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
			/>
		</div>
	);
}
