import { combineReducers } from '@wordpress/data';
import {
	SET_CREDENTIALS_STATE,
	SET_CREDENTIALS_STATE_IS_FETCHING,
	SET_STATUS,
	START_SCAN_OPTIMISTICALLY,
	SET_STATUS_IS_FETCHING,
	SET_SCAN_IS_ENQUEUING,
	SET_INSTALLED_PLUGINS,
	SET_INSTALLED_THEMES,
	SET_WP_VERSION,
	SET_JETPACK_SCAN,
	SET_THREAT_IS_UPDATING,
	SET_MODAL,
	SET_NOTICE,
	CLEAR_NOTICE,
	SET_THREATS_ARE_FIXING,
} from './actions';

const credentials = ( state = [], action ) => {
	switch ( action.type ) {
		case SET_CREDENTIALS_STATE:
			return action.credentials;
	}
	return state;
};

const credentialsIsFetching = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_CREDENTIALS_STATE_IS_FETCHING:
			return action.isFetching;
	}
	return state;
};

const status = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_STATUS:
			return action.status;
		case START_SCAN_OPTIMISTICALLY:
			return { ...state, status: 'scanning' };
	}
	return state;
};

const statusIsFetching = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_STATUS_IS_FETCHING:
			return action.status;
	}
	return state;
};

const scanIsEnqueuing = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_SCAN_IS_ENQUEUING:
			return action.isEnqueuing;
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

const setThreatsFixing = ( state = [], action ) => {
	switch ( action.type ) {
		case SET_THREATS_ARE_FIXING:
			return action.threatIds;
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
		case CLEAR_NOTICE:
			return {};
	}
	return state;
};

const reducers = combineReducers( {
	credentials,
	credentialsIsFetching,
	status,
	statusIsFetching,
	scanIsEnqueuing,
	installedPlugins,
	installedThemes,
	wpVersion,
	jetpackScan,
	productData,
	threatsUpdating,
	modal,
	notice,
	setThreatsFixing,
} );

export default reducers;
