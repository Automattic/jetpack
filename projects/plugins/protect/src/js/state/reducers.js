import { combineReducers } from '@wordpress/data';
import {
	SET_CREDENTIAL_STATE,
	SET_STATUS,
	SET_STATUS_IS_FETCHING,
	SET_INSTALLED_PLUGINS,
	SET_INSTALLED_THEMES,
	SET_WP_VERSION,
	SET_JETPACK_SCAN,
	SET_THREAT_IS_UPDATING,
	SET_MODAL,
	SET_NOTICE,
} from './actions';

const credentialState = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CREDENTIAL_STATE:
			return action.credentialState;
	}
	return state;
};

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

const threatsUpdating = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_THREAT_IS_UPDATING:
			return { ...state, [ action.payload.threatId ]: action.payload.isUpdating };
	}
	return state;
};

const modal = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_MODAL:
			return { ...state, ...action.payload };
	}
	return state;
};

const notice = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_NOTICE:
			return { ...state, ...action.payload };
	}
	return state;
};

const reducers = combineReducers( {
	credentialState,
	status,
	statusIsFetching,
	installedPlugins,
	installedThemes,
	wpVersion,
	jetpackScan,
	productData,
	threatsUpdating,
	modal,
	notice,
} );

export default reducers;
