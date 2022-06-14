import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import {
	RESET_OPTIONS,
	RESET_OPTIONS_FAIL,
	RESET_OPTIONS_SUCCESS,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	DEV_CARD_DISPLAY,
	DEV_CARD_HIDE,
	MOCK_SWITCH_USER_PERMISSIONS,
	MOCK_SWITCH_THREATS,
	MOCK_SWITCH_REWIND_STATE,
	MOCK_SWITCH_SCAN_STATE,
} from 'state/action-types';

export const resetOptions = options => {
	return dispatch => {
		dispatch( {
			type: RESET_OPTIONS,
		} );
		dispatch(
			createNotice( 'is-info', __( 'Resetting Jetpack options…', 'jetpack' ), {
				id: 'reset-options',
			} )
		);
		return restApi
			.resetOptions( options )
			.then( () => {
				dispatch( {
					type: RESET_OPTIONS_SUCCESS,
				} );
				dispatch( removeNotice( 'reset-options' ) );
				dispatch(
					createNotice( 'is-success', __( 'Options reset.', 'jetpack' ), {
						id: 'reset-options',
						duration: 2000,
					} )
				);
			} )
			.catch( error => {
				dispatch( {
					type: RESET_OPTIONS_FAIL,
					error: error,
				} );
				dispatch( removeNotice( 'reset-options' ) );
				dispatch(
					createNotice( 'is-error', __( 'Options failed to reset.', 'jetpack' ), {
						id: 'reset-options',
					} )
				);
			} );
	};
};

export const enableDevCard = () => {
	return dispatch => {
		dispatch( {
			type: DEV_CARD_DISPLAY,
		} );
	};
};

export const disableDevCard = () => {
	return dispatch => {
		dispatch( {
			type: DEV_CARD_HIDE,
		} );
	};
};

export const switchPlanPreview = slug => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_DATA_FETCH_RECEIVE,
			siteData: { plan: { product_slug: slug } },
		} );
	};
};

const adminMasterPerms = {
	currentUser: {
		isMaster: true,
		isConnected: true,
		permissions: {
			admin_page: true,
			connect: true,
			disconnect: true,
			edit_posts: true,
			manage_modules: true,
			manage_options: true,
			manage_plugins: true,
		},
	},
};

const adminSecondaryPerms = {
	currentUser: {
		isMaster: false,
		permissions: {
			admin_page: true,
			connect: true,
			disconnect: true,
			edit_posts: true,
			manage_modules: true,
			manage_options: true,
			manage_plugins: true,
		},
	},
};

const editorAuthorContributorPerms = {
	currentUser: {
		isMaster: false,
		permissions: {
			admin_page: true,
			connect: false,
			disconnect: false,
			edit_posts: true,
			manage_modules: false,
			manage_options: false,
			manage_plugins: false,
		},
	},
};

const subscriberPerms = {
	currentUser: {
		isMaster: false,
		permissions: {
			admin_page: true,
			connect: false,
			disconnect: false,
			edit_posts: false,
			manage_modules: false,
			manage_options: false,
			manage_plugins: false,
		},
	},
};

const viewStats = {
	currentUser: {
		permissions: {
			view_stats: true,
		},
	},
};

const hideStats = {
	currentUser: {
		permissions: {
			view_stats: false,
		},
	},
};

const isLinked = {
	currentUser: {
		isConnected: true,
	},
};

const isUnlinked = {
	currentUser: {
		isConnected: false,
		isMaster: false,
	},
};

export const switchUserPermission = slug => {
	let userPerms = {};

	return dispatch => {
		switch ( slug ) {
			case 'admin_master':
				userPerms = adminMasterPerms;
				break;
			case 'admin_secondary':
				userPerms = adminSecondaryPerms;
				break;
			case 'editor':
			case 'contributor':
			case 'author':
				userPerms = editorAuthorContributorPerms;
				break;
			case 'subscriber':
				userPerms = subscriberPerms;
				break;
			case 'view_stats':
				userPerms = viewStats;
				break;
			case 'hide_stats':
				userPerms = hideStats;
				break;
			case 'is_linked':
				userPerms = isLinked;
				break;
			case 'is_unlinked':
				userPerms = isUnlinked;
				break;
		}

		dispatch( {
			type: MOCK_SWITCH_USER_PERMISSIONS,
			initialState: userPerms,
		} );
	};
};

export const switchThreats = count => {
	return dispatch => {
		dispatch( {
			type: MOCK_SWITCH_THREATS,
			mockCount: count,
		} );
	};
};

export const switchRewindState = state => {
	return dispatch => {
		dispatch( {
			type: MOCK_SWITCH_REWIND_STATE,
			rewindState: { state: state },
		} );
	};
};

export const switchScanState = state => dispatch => {
	dispatch( {
		type: MOCK_SWITCH_SCAN_STATE,
		scanState: { state },
	} );
};
