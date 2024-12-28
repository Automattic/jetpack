import { type Threat } from '@automattic/jetpack-scan';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useCallback, useContext, useMemo } from 'react';
import ThreatModal from '../threat-modal';
import { DEFAULT_LAYOUTS } from './constants';
import { ThreatsDataViewsContext } from './context';
import ThreatsStatusToggleGroupControl from './threats-status-toggle-group-control';
import useActions from './use-actions';
import useControlledFields from './use-controlled-fields';

/**
 * DataViews component for displaying security threats.
 *
 * @return {JSX.Element} The ThreatsDataViews component.
 */
export default function ThreatsDataViews(): JSX.Element {
	/**
	 * Access state and actions from the current context.
	 */
	const { data, view, selectedThreat, setSelectedThreat, connection, credentials } =
		useContext( ThreatsDataViewsContext );

	/**
	 * DataView fields.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#fields-api
	 */
	const { fields, onChangeView } = useControlledFields();

	/**
	 * DataView actions.
	 */
	const { actions } = useActions();

	/**
	 * Apply the view settings (i.e. filters, sorting, pagination) to the dataset.
	 *
	 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dataviews/src/filter-and-sort-data-view.ts
	 */
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ data, view, fields ] );

	/**
	 * DataView getItemId function - returns the unique ID for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#getitemid-function
	 */
	const getItemId = useCallback( ( item: Threat ) => item.id.toString(), [] );

	/**
	 * Callback function to handle the selection change.
	 */
	const onChangeSelection = useCallback(
		( selectedItemIds: string[] ) => {
			const threat = data.find( item => getItemId( item ) === selectedItemIds[ 0 ] );
			if ( threat ) {
				setSelectedThreat( threat );
			}
		},
		[ data, getItemId, setSelectedThreat ]
	);

	/**
	 * Callback function to dismiss the selected threat.
	 */
	const onDismissSelection = useCallback( () => {
		setSelectedThreat( null );
	}, [ setSelectedThreat ] );

	return (
		<>
			<DataViews
				actions={ actions }
				data={ processedData }
				defaultLayouts={ DEFAULT_LAYOUTS }
				fields={ fields }
				getItemId={ getItemId }
				header={ <ThreatsStatusToggleGroupControl /> }
				onChangeSelection={ onChangeSelection }
				onChangeView={ onChangeView }
				onClickItem={ setSelectedThreat }
				paginationInfo={ paginationInfo }
				view={ view }
			/>
			{ selectedThreat && (
				<ThreatModal
					threat={ selectedThreat }
					onRequestClose={ onDismissSelection }
					connection={ connection }
					credentials={ credentials }
				/>
			) }
		</>
	);
}
