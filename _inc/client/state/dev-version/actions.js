/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	RESET_OPTIONS,
	RESET_OPTIONS_FAIL,
	RESET_OPTIONS_SUCCESS,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	DEV_CARD_DISPLAY,
	DEV_CARD_HIDE,
	JETPACK_SET_INITIAL_STATE
} from 'state/action-types';
import restApi from 'rest-api';

export const resetOptions = ( options ) => {
	return ( dispatch ) => {
		dispatch( {
			type: RESET_OPTIONS
		} );
		dispatch( createNotice( 'is-info', __( 'Resetting Jetpack options…' ), { id: 'reset-options' } ) );
		return restApi.resetOptions( options ).then( () => {
			dispatch( {
				type: RESET_OPTIONS_SUCCESS
			} );
			dispatch( removeNotice( 'reset-options' ) );
			dispatch( createNotice( 'is-success', __( 'Options reset.' ), { id: 'reset-options' } ) );
		} ).catch( error => {
			dispatch( {
				type: RESET_OPTIONS_FAIL,
				error: error
			} );
			dispatch( removeNotice( 'reset-options' ) );
			dispatch( createNotice( 'is-error', __( 'Options failed to reset.' ), { id: 'reset-options' } ) );
		} );
	}
};

export const enableDevCard = () => {
	return ( dispatch ) => {
		dispatch( {
			type: DEV_CARD_DISPLAY
		} );
	}
};

export const disableDevCard = () => {
	return ( dispatch ) => {
		dispatch( {
			type: DEV_CARD_HIDE
		} );
	}
};

export const switchPlanPreview = ( slug ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SITE_DATA_FETCH_RECEIVE,
			siteData: { plan: { product_slug: slug } }
		} );
	}
};

const adminPerms = {
	admin_page: true,
	connect: true,
	disconnect: true,
	edit_posts: true,
	manage_modules: true,
	manage_options: true,
	manage_plugins: true
};

const editorAuthorContributorPerms = {
	admin_page: true,
	connect: false,
	disconnect: false,
	edit_posts: true,
	manage_modules: false,
	manage_options: false,
	manage_plugins: false
};

const subscriberPerms = {
	admin_page: true,
	connect: false,
	disconnect: false,
	edit_posts: false,
	manage_modules: false,
	manage_options: false,
	manage_plugins: false
};

export const switchUserPermission = ( slug ) => {
	let userPerms = {};

	return ( dispatch ) => {
		switch ( slug ) {
			case 'admin':
				userPerms = adminPerms;
				break;
			case 'editor':
			case 'contributor':
			case 'author':
				userPerms = editorAuthorContributorPerms;
				break;
			case 'subscriber':
				userPerms = subscriberPerms;
				break;
		}

		dispatch( {
			type: JETPACK_SET_INITIAL_STATE,
			initialState: { userData: { currentUser: { permissions: userPerms } } }
		} );
	}
};
