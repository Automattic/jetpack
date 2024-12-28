import { type Threat } from '@automattic/jetpack-scan';
import { type Filter, type View } from '@wordpress/dataviews';
import { useState, createContext, useMemo } from 'react';
import { DEFAULT_LAYOUTS } from './constants';
import { ActionCallbacks, ConnectionProps, CredentialsProps } from './types';
import { type ThreatsDataViewsContext as ThreatsDataViewsContextType } from './types';

export const ThreatsDataViewsContext = createContext< ThreatsDataViewsContextType >( {
	connection: {},
	credentials: {},
	data: [],
	supportedFields: [],
	actionCallbacks: {},
	view: {
		type: 'table',
		...DEFAULT_LAYOUTS.table,
	},
	setView: () => {},
	forceShowFields: [],
	setForceShowFields: () => {},
	onChangeView: () => {},
	onUpgrade: () => {},
	selectedThreat: null,
	setSelectedThreat: () => {},
} );

/**
 * DataViews component for displaying security threats.
 *
 * @param {object}      props                 - Component props.
 * @param {object}      props.actionCallbacks - Action callbacks.
 * @param {JSX.Element} props.children        - Child components.
 * @param {object}      props.connection      - Connection state.
 * @param {object}      props.credentials     - Credentials state.
 * @param {Array}       props.data            - Threats data.
 * @param {Array}       props.initialFilters  - Initial DataView filters.
 * @param {Function}    props.onUpgrade       - Upgrade callback.
 * @param {Array}       props.supportedFields - Supported fields for the DataView.
 *
 * @return {JSX.Element} The ThreatsDataViews component.
 */
export function ThreatsDataViewsContextProvider( {
	actionCallbacks = {},
	children,
	connection,
	credentials,
	data,
	initialFilters,
	onUpgrade,
	supportedFields,
}: {
	actionCallbacks?: ActionCallbacks;
	children?: JSX.Element;
	connection?: ConnectionProps;
	credentials?: CredentialsProps;
	data: Threat[];
	initialFilters?: Filter[];
	onUpgrade?: () => void;
	supportedFields?: string[];
} ): JSX.Element {
	/**
	 * State to manage the selected threat.
	 */
	const [ selectedThreat, setSelectedThreat ] = useState< Threat | null >( null );

	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( {
		type: 'table',
		...DEFAULT_LAYOUTS.table,
		filters: initialFilters ?? DEFAULT_LAYOUTS.table.filters,
	} );

	// Fields that have been manually enabled by the user, and should not be hidden.
	const [ forceShowFields, setForceShowFields ] = useState< string[] >( [] );

	const value = useMemo(
		() => ( {
			actionCallbacks,
			connection,
			credentials,
			data,
			selectedThreat,
			supportedFields,
			view,
			onUpgrade,
			setSelectedThreat,
			setView,
			forceShowFields,
			setForceShowFields,
		} ),
		[
			actionCallbacks,
			connection,
			credentials,
			data,
			selectedThreat,
			supportedFields,
			view,
			onUpgrade,
			forceShowFields,
			setForceShowFields,
		]
	);

	return (
		<ThreatsDataViewsContext.Provider value={ value }>
			{ children }
		</ThreatsDataViewsContext.Provider>
	);
}
