/**
 * External dependencies
 */
import { isEqual } from 'lodash';
/**
 * Internal dependencies
 */
import {
	fetchJetpackSettings,
	updateJetpackSettings as updateJetpackSettingsControl,
} from '../controls';
import { successNotice } from 'components/global-notices/store/actions';
import { removeUpdatingNotice, updatingNotice } from 'components/global-notices/store/actions';
import { __ } from '@wordpress/i18n';
import { errorNotice } from '../../components/global-notices/store/actions';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

/**
 * Yield actions to update Search Settings
 *
 * @param {object} settings
 * @returns object - yield an action object.
 */
export function* updateJetpackSettings( settings, oldSettings ) {
	try {
		yield setJetpackSettings( settings );
		yield setUpdatingJetpackSettings();
		yield updateJetpackSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return successNotice( __( 'Updated settings.' ) );
	} catch ( e ) {
		// TODO toggle back
		yield setJetpackSettings( oldSettings );
		return errorNotice( __( 'Error Update settings...' ) );
	} finally {
		yield setUpdatingJetpackSettingsDone();
	}
}

/**
 * @returns {object} - an action to set network busy.
 */
export function* setUpdatingJetpackSettings() {
	yield updatingNotice();
	return setJetpackSettings( { is_updating: true } );
}

/**
 *
 * @returns {object} - an action to set network free.
 */
export function* setUpdatingJetpackSettingsDone() {
	yield removeUpdatingNotice();
	return setJetpackSettings( { is_updating: false } );
}

export function setJetpackSettings( options ) {
	return { type: SET_JETPACK_SETTINGS, options };
}

export default { updateJetpackSettings, setJetpackSettings };
