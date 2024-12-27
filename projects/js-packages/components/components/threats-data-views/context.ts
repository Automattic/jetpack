import { Threat } from '@automattic/jetpack-scan';
import { View } from '@wordpress/dataviews';
import { createContext } from 'react';
import { DEFAULT_LAYOUTS } from './constants';

export interface ThreatsDataViewsContextInterface {
	view: View;
	setView: ( view: View ) => void;
	onChangeView?: ( view: View ) => void;
	data: Threat[];
}

const ThreatsDataViewsContext = createContext< ThreatsDataViewsContextInterface >( {
	view: {
		type: 'table',
		...DEFAULT_LAYOUTS.table,
	},
	setView: () => {},
	onChangeView: () => {},
	data: [],
} );

export default ThreatsDataViewsContext;
