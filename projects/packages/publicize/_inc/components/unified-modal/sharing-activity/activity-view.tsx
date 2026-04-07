import { Flex } from '@wordpress/components';
import {
	type Field,
	type Filter,
	type SortDirection,
	type View,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SHARING_ACTIVITY_TABS } from '../../../utils';
import ConnectionIcon from '../../connection-icon';
import { ActivityAction } from './activity-action';
import { ActivityStatus } from './activity-status';
import { ReadableTime } from './readable-time';
import styles from './styles.module.scss';
import { SharingActivityFilter, SharingActivityItem } from './types';
import { useSharingActivity } from './use-sharing-activity';

// Field IDs as constants
const FIELD_CONNECTION = 'connection';
const FIELD_TIME = 'time';
const FIELD_STATUS = 'status';
const FIELD_ACTIONS = 'actions';
const FIELD_ACTIVITY_TYPE = 'activityType';

interface ActivityViewProps {
	/**
	 * The current filter to apply.
	 */
	filter?: SharingActivityFilter;
}

/**
 * Get unique ID for a sharing activity item.
 *
 * @param item - The sharing activity item.
 * @return The unique ID for the item.
 */
const getItemId = ( item: SharingActivityItem ): string => item.id;

/**
 * Convert filter name to DataViews filters array.
 *
 * @param filter - The filter name.
 * @return The filters array for DataViews.
 */
function getFiltersForTab( filter: SharingActivityFilter ): Filter[] {
	if ( filter === 'shared' ) {
		return [
			{
				field: FIELD_ACTIVITY_TYPE,
				operator: 'isAny',
				value: [ 'shared' ],
			},
		];
	}
	if ( filter === 'scheduled' ) {
		return [
			{
				field: FIELD_ACTIVITY_TYPE,
				operator: 'isAny',
				value: [ 'scheduled' ],
			},
		];
	}
	return [];
}

/**
 * DataViews component for unified sharing activity.
 *
 * @param {ActivityViewProps} props - Component props.
 * @return React element.
 */
export function ActivityView( { filter = SHARING_ACTIVITY_TABS.ALL }: ActivityViewProps ) {
	const { items, isLoading } = useSharingActivity();

	// DataView state
	const [ view, setView ] = useState< View >( {
		type: 'table',
		titleField: FIELD_CONNECTION,
		fields: [ FIELD_TIME, FIELD_STATUS, FIELD_ACTIONS ],
		sort: {
			field: FIELD_TIME,
			direction: 'desc' as SortDirection,
		},
		filters: getFiltersForTab( filter ),
		page: 1,
		perPage: 10,
	} );

	// Update filters when the tab changes
	useEffect( () => {
		setView( prevView => ( {
			...prevView,
			filters: getFiltersForTab( filter ),
			page: 1,
		} ) );
	}, [ filter ] );

	// Define fields
	const fields = useMemo(
		(): Field< SharingActivityItem >[] => [
			{
				id: FIELD_CONNECTION,
				label: __( 'Account', 'jetpack-publicize-pkg' ),
				enableGlobalSearch: true,
				enableHiding: false,
				getValue: ( { item } ) => item.displayName,
				render: ( { item } ) => (
					<Flex gap={ 4 } justify="start">
						<ConnectionIcon
							serviceName={ item.serviceName }
							label={ item.displayName }
							profilePicture={ item.profilePicture }
						/>
						<div>{ item.displayName }</div>
					</Flex>
				),
			},
			{
				id: FIELD_TIME,
				label: __( 'Time', 'jetpack-publicize-pkg' ),
				type: 'datetime',
				enableHiding: false,
				getValue: ( { item } ) => new Date( item.timestamp * 1000 ),
				render: ( { item } ) => <ReadableTime timestamp={ item.timestamp } />,
			},
			{
				id: FIELD_STATUS,
				label: __( 'Status', 'jetpack-publicize-pkg' ),
				elements: [
					{ value: 'success', label: __( 'Shared', 'jetpack-publicize-pkg' ) },
					{ value: 'failure', label: __( 'Failed', 'jetpack-publicize-pkg' ) },
					{ value: 'scheduled', label: __( 'Scheduled', 'jetpack-publicize-pkg' ) },
				],
				getValue: ( { item } ) => item.status,
				render: ( { item } ) => <ActivityStatus item={ item } />,
			},
			{
				id: FIELD_ACTIONS,
				label: __( 'Actions', 'jetpack-publicize-pkg' ),
				enableHiding: false,
				render: ( { item } ) => <ActivityAction item={ item } />,
			},
			// Hidden field for filtering by activity type
			{
				id: FIELD_ACTIVITY_TYPE,
				label: __( 'Type', 'jetpack-publicize-pkg' ),
				enableHiding: false,
				elements: [
					{ value: 'shared', label: __( 'Shared', 'jetpack-publicize-pkg' ) },
					{ value: 'scheduled', label: __( 'Scheduled', 'jetpack-publicize-pkg' ) },
				],
				getValue: ( { item } ) => item.activityType,
			},
		],
		[]
	);

	// Apply filtering, sorting, and pagination
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( items, view, fields );
	}, [ items, view, fields ] );

	// Handle view changes
	const onChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );

	return (
		<div className={ styles[ 'dataview-wrapper' ] }>
			<DataViews
				isLoading={ isLoading }
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
