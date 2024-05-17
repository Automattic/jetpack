import { combineReducers } from '@wordpress/data';
import {
	SET_CREDENTIALS_STATE,
	SET_CREDENTIALS_STATE_IS_FETCHING,
	SET_STATUS,
	SET_STATUS_PROGRESS,
	START_SCAN_OPTIMISTICALLY,
	SET_STATUS_IS_FETCHING,
	SET_SCAN_IS_UNAVAILABLE,
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
	SET_HAS_REQUIRED_PLAN,
	SET_ONBOARDING_PROGRESS,
	SET_WAF_IS_SEEN,
	SET_WAF_UPGRADE_IS_SEEN,
	SET_WAF_IS_ENABLED,
	SET_WAF_IS_UPDATING,
	SET_WAF_IS_TOGGLING,
	SET_WAF_CONFIG,
	SET_WAF_STATS,
} from './actions';

const credentials = ( state = null, action ) => {
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
		case SET_STATUS_PROGRESS:
			return { ...state, currentProgress: action.currentProgress };
		case START_SCAN_OPTIMISTICALLY:
			return { ...state, currentProgress: 0, status: 'optimistically_scanning' };
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

const scanIsUnavailable = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_SCAN_IS_UNAVAILABLE:
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

const hasRequiredPlan = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_HAS_REQUIRED_PLAN:
			return action.hasRequiredPlan;
	}
	return state;
};

const onboardingProgress = ( state = null, action ) => {
	switch ( action.type ) {
		case SET_ONBOARDING_PROGRESS:
			return action.progress;
	}
	return state;
};

const defaultWaf = {
	wafSupported: null,
	bruteForceSupported: null,
	isSeen: false,
	upgradeIsSeen: false,
	isEnabled: false,
	isUpdating: false,
	isToggling: false,
	config: undefined,
	stats: undefined,
};
const waf = ( state = defaultWaf, action ) => {
	switch ( action.type ) {
		case SET_WAF_IS_SEEN:
			return { ...state, isSeen: action.isSeen };
		case SET_WAF_UPGRADE_IS_SEEN:
			return { ...state, upgradeIsSeen: action.upgradeIsSeen };
		case SET_WAF_IS_ENABLED:
			return { ...state, isEnabled: action.isEnabled };
		case SET_WAF_CONFIG:
			return { ...state, config: action.config };
		case SET_WAF_STATS:
			return { ...state, stats: action.stats };
		case SET_WAF_IS_UPDATING:
			return { ...state, isUpdating: action.isUpdating };
		case SET_WAF_IS_TOGGLING:
			return { ...state, isToggling: action.isToggling };
	}
	return state;
};

const reducers = combineReducers( {
	credentials,
	credentialsIsFetching,
	status,
	statusIsFetching,
	scanIsUnavailable,
	scanIsEnqueuing,
	installedPlugins,
	installedThemes,
	wpVersion,
	jetpackScan,
	threatsUpdating,
	modal,
	notice,
	setThreatsFixing,
	hasRequiredPlan,
	onboardingProgress,
	waf,
} );

export default reducers;
