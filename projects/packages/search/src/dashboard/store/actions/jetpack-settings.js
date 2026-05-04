import analytics from '@automattic/jetpack-analytics';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	removeUpdatingNotice,
	updatingNotice,
	errorNotice,
	successNotice,
} from 'components/global-notices/store/actions';
import { STORE_ID } from '../../store';
import {
	fetchJetpackSettings,
	updateJetpackSettings as updateJetpackSettingsControl,
} from '../controls';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

/**
 * Yield actions to update Search Settings
 *
 * @param {object} settings - settings to apply.
 * @yield {object} - an action object.
 * @return {object} - an action object.
 */
export function* updateJetpackSettings( settings ) {
	try {
		yield updatingNotice();
		yield setUpdatingJetpackSettings();
		yield setJetpackSettings( settings );
		yield updateJetpackSettingsControl( settings );
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return successNotice( __( 'Updated settings.', 'jetpack-search-pkg' ) );
	} catch {
		const oldSettings = Object.fromEntries(
			Object.entries( select( STORE_ID ).getSearchModuleStatus() ).filter(
				( [ k ] ) => k === 'module_active' || k === 'instant_search_enabled'
			)
		);
		yield setJetpackSettings( oldSettings );
		return errorNotice( __( 'Error Update settings…', 'jetpack-search-pkg' ) );
	} finally {
		yield removeUpdatingNotice();
		yield setUpdatingJetpackSettingsDone();
	}
}

/**
 * Set state updating action
 *
 * @return {object} - an action object.
 */
export function setUpdatingJetpackSettings() {
	return setJetpackSettings( { is_updating: true } );
}

/**
 * Set state updating finished
 *
 * @return {object} - an action object.
 */
export function setUpdatingJetpackSettingsDone() {
	return setJetpackSettings( { is_updating: false } );
}

/**
 * Set Jetpack settings action
 *
 * @param {object} options - Jetpack settings.
 * @return {object} - an action object.
 */
export function setJetpackSettings( options ) {
	return { type: SET_JETPACK_SETTINGS, options };
}

/**
 * Set the user's in-flight, unsaved experience selection.
 *
 * @param {string|null} experience - One of the experience IDs, or null to clear.
 * @return {object} - an action object.
 */
export function setPendingExperience( experience ) {
	return setJetpackSettings( { pending_experience: experience } );
}

/**
 * Promote a successfully saved experience selection so the ACTIVE badge can
 * stay on the user's choice (Embedded vs. Classic) for the rest of the session.
 *
 * @param {string} experience - One of the experience IDs.
 * @return {object} - an action object.
 */
export function setLastSavedExperience( experience ) {
	return setJetpackSettings( { last_saved_experience: experience } );
}

/**
 * Save the chosen experience by calling the existing updateJetpackSettings
 * generator, then promoting pending → last_saved on success. The inner
 * generator's optimistic-with-rollback handling covers the failure case
 * (we leave pending in place so the user can retry).
 *
 * The whole feature-selector UI is gated behind `jetpack_search_blocks_enabled`,
 * so we send only `{ experience }`. The back end translates that into whatever
 * it persists, and migrates any pre-existing `module_active` /
 * `instant_search_enabled` booleans on first read.
 *
 * Records a single `jetpack_search_experience_save` analytics event at the
 * point of submit. The event fires regardless of save outcome — same behavior
 * as the legacy per-toggle events in `ModuleControl`. We capture the previous
 * experience by reading the store synchronously before yielding the save.
 *
 * @param {string} experience - The experience to save.
 * @yield {object} - an action object.
 */
export function* saveExperience( experience ) {
	const previousExperience = select( STORE_ID ).getActiveExperience();
	analytics.tracks.recordEvent( 'jetpack_search_experience_save', {
		previous_experience: previousExperience,
		new_experience: experience,
	} );
	yield updateJetpackSettings( { experience } );
	yield setLastSavedExperience( experience );
	yield setPendingExperience( null );
}

export default {
	updateJetpackSettings,
	setJetpackSettings,
	setPendingExperience,
	setLastSavedExperience,
	saveExperience,
};
