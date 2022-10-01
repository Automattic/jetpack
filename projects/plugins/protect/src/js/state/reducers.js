import { combineReducers } from '@wordpress/data';
import {
	SET_STATUS,
	SET_STATUS_IS_FETCHING,
	SET_INSTALLED_PLUGINS,
	SET_INSTALLED_THEMES,
	SET_WP_VERSION,
	SET_JETPACK_SCAN,
} from './actions';

const status = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_STATUS:
			return action.status;
	}
	return state;
};

const statusIsFetching = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_STATUS_IS_FETCHING:
			return action.status;
	}
	return state;
};

const installedPlugins = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_INSTALLED_PLUGINS:
			return action.plugins;
	}
	return state;
};

const installedThemes = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_INSTALLED_THEMES:
			return action.themes;
	}
	return state;
};

const wpVersion = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_WP_VERSION:
			return action.version;
	}
	return state;
};

const jetpackScan = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_JETPACK_SCAN:
			return action.scan;
	}
	return state;
};

const productData = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_JETPACK_SCAN:
			return action.productData;
	}
	return state;
};

const reducers = combineReducers( {
	status,
	statusIsFetching,
	installedPlugins,
	installedThemes,
	wpVersion,
	jetpackScan,
	productData,
} );

export default reducers;
