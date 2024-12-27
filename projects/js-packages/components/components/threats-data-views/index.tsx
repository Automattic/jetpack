import { getFixerAction, type Threat } from '@automattic/jetpack-scan';
import {
	type Action,
	type ActionButton,
	type Filter,
	type View,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import {
	DEFAULT_LAYOUTS,
	THREAT_ACTION_FIX,
	THREAT_ACTION_IGNORE,
	THREAT_ACTION_UNIGNORE,
} from './constants';
import ThreatsDataViewsContext from './context';
import ThreatsStatusToggleGroupControl from './threats-status-toggle-group-control';
import useControlledFields from './use-controlled-fields';

/**
 * DataViews component for displaying security threats.
 *
 * @param {object}   props                             - Component props.
 * @param {Array}    props.data                        - Threats data.
 * @param {Array}    props.filters                     - Initial DataView filters.
 * @param {Array}    props.supportedFields             - Supported fields for the DataView.
 * @param {Function} props.onChangeSelection           - Callback function run when an item is selected.
 * @param {Function} props.onFixThreats                - Threat fix action callback.
 * @param {Function} props.onIgnoreThreats             - Threat ignore action callback.
 * @param {Function} props.onUnignoreThreats           - Threat unignore action callback.
 * @param {Function} props.isThreatEligibleForFix      - Function to determine if a threat is eligible for fixing.
 * @param {Function} props.isThreatEligibleForIgnore   - Function to determine if a threat is eligible for ignoring.
 * @param {Function} props.isThreatEligibleForUnignore - Function to determine if a threat is eligible for unignoring.
 *
 * @return {JSX.Element} The ThreatsDataViews component.
 */
export default function ThreatsDataViews( {
	data,
	filters,
	onChangeSelection,
	supportedFields,
	isThreatEligibleForFix,
	isThreatEligibleForIgnore,
	isThreatEligibleForUnignore,
	onFixThreats,
	onIgnoreThreats,
	onUnignoreThreats,
}: {
	data: Threat[];
	filters?: Filter[];
	onChangeSelection?: ( selectedItemIds: string[] ) => void;
	supportedFields?: string[];
	isThreatEligibleForFix?: ( threat: Threat ) => boolean;
	isThreatEligibleForIgnore?: ( threat: Threat ) => boolean;
	isThreatEligibleForUnignore?: ( threat: Threat ) => boolean;
	onFixThreats?: ( threats: Threat[] ) => void;
	onIgnoreThreats?: ActionButton< Threat >[ 'callback' ];
	onUnignoreThreats?: ActionButton< Threat >[ 'callback' ];
} ): JSX.Element {
	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( {
		type: 'table',
		...DEFAULT_LAYOUTS.table,
		filters: filters ?? DEFAULT_LAYOUTS.table.filters,
	} );

	/**
	 * DataView fields.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#fields-api
	 */
	const { fields, controlFields } = useControlledFields( {
		data,
		view,
		supportedFields,
		onFixThreats,
	} );

	/**
	 * DataView actions - collection of operations that can be performed upon each record.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#actions-object
	 */
	const actions: Action< Threat >[] = useMemo( () => {
		return [
			{
				id: THREAT_ACTION_FIX,
				label: items => {
					return getFixerAction( items[ 0 ] );
				},
				isPrimary: true,
				callback: onFixThreats,
				isEligible( item ) {
					if ( view.type !== 'list' ) {
						return false;
					}
					if ( ! onFixThreats ) {
						return false;
					}
					if ( isThreatEligibleForFix ) {
						return isThreatEligibleForFix( item );
					}
					return !! item.fixable;
				},
			},
			{
				id: THREAT_ACTION_IGNORE,
				label: __( 'Ignore', 'jetpack-components' ),
				isPrimary: true,
				isDestructive: true,
				callback: onIgnoreThreats,
				isEligible( item ) {
					if ( ! onIgnoreThreats ) {
						return false;
					}
					if ( isThreatEligibleForIgnore ) {
						return isThreatEligibleForIgnore( item );
					}
					return item.status === 'current';
				},
			},
			{
				id: THREAT_ACTION_UNIGNORE,
				label: __( 'Unignore', 'jetpack-components' ),
				isPrimary: true,
				isDestructive: true,
				callback: onUnignoreThreats,
				isEligible( item ) {
					if ( ! onUnignoreThreats ) {
						return false;
					}
					if ( isThreatEligibleForUnignore ) {
						return isThreatEligibleForUnignore( item );
					}
					return item.status === 'ignored';
				},
			},
		];
	}, [
		view.type,
		onFixThreats,
		onIgnoreThreats,
		onUnignoreThreats,
		isThreatEligibleForFix,
		isThreatEligibleForIgnore,
		isThreatEligibleForUnignore,
	] );

	/**
	 * Apply the view settings (i.e. filters, sorting, pagination) to the dataset.
	 *
	 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dataviews/src/filter-and-sort-data-view.ts
	 */
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ data, view, fields ] );

	/**
	 * Callback function to update the view state.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#onchangeview-function
	 */
	const onChangeView = useCallback(
		( newView: View ) => setView( currentView => controlFields( currentView, newView ) ),
		[ controlFields ]
	);

	/**
	 * DataView getItemId function - returns the unique ID for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#getitemid-function
	 */
	const getItemId = useCallback( ( item: Threat ) => item.id.toString(), [] );

	return (
		<ThreatsDataViewsContext.Provider value={ { data, view, setView, onChangeView } }>
			<DataViews
				actions={ actions }
				data={ processedData }
				defaultLayouts={ DEFAULT_LAYOUTS }
				fields={ fields }
				getItemId={ getItemId }
				onChangeSelection={ onChangeSelection }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				view={ view }
				header={ <ThreatsStatusToggleGroupControl /> }
			/>
		</ThreatsDataViewsContext.Provider>
	);
}
