import { select } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';
import {
	fetchShareTitleOnly,
	updateShareTitleOnly as updateShareTitleOnlyControl,
} from '../controls';

export const SET_SHARE_TITLE_ONLY = 'SET_SHARE_TITLE_ONLY';

/**
 * Yield actions to update settings
 *
 * @param {object} settings - settings to apply.
 * @yield {object} - an action object.
 * @return {object} - an action object.
 */
export function* updateShareTitleOnly( settings ) {
	try {
		yield setUpdatingShareTitleOnly();
		yield setShareTitleOnly( settings );
		yield updateShareTitleOnlyControl( settings );
		const updatedSettings = yield fetchShareTitleOnly();
		yield setShareTitleOnly( { isEnabled: !! updatedSettings.jetpack_social_share_title_only } );
		return true;
	} catch ( e ) {
		const oldSettings = select( SOCIAL_STORE_ID ).getShareTitleOnly();
		yield setShareTitleOnly( oldSettings );
		return false;
	} finally {
		yield setUpdatingShareTitleOnlyDone();
	}
}

/**
 * Set state updating action
 *
 * @return {object} - an action object.
 */
export function setUpdatingShareTitleOnly() {
	return setShareTitleOnly( { isUpdating: true } );
}

/**
 * Set state updating finished
 *
 * @return {object} - an action object.
 */
export function setUpdatingShareTitleOnlyDone() {
	return setShareTitleOnly( { isUpdating: false } );
}

/**
 * Set Social Image Generator settings action
 *
 * @param {object} options - Social Image Generator settings.
 * @return {object} - an action object.
 */
export function setShareTitleOnly( options ) {
	return { type: SET_SHARE_TITLE_ONLY, options };
}

export default {
	updateShareTitleOnly,
	setShareTitleOnly,
};
