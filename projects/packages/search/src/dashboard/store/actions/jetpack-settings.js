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

const hasOwnSetting = ( settings, settingName ) =>
	Object.prototype.hasOwnProperty.call( settings ?? {}, settingName );

const getRollbackSettings = settings =>
	Object.fromEntries(
		Object.entries( settings ?? {} ).filter(
			( [ k ] ) =>
				k === 'module_active' ||
				k === 'instant_search_enabled' ||
				k === 'experience' ||
				k === 'reader_chat' ||
				k === 'ai_answers_enabled' ||
				k === 'search_suggestions_enabled' ||
				k === 'override_woocommerce_search_template'
		)
	);

/**
 * Yield actions to update Search Settings
 *
 * @param {object} settings - settings to apply.
 * @yield {object} - an action object.
 * @return {object} - an action object.
 */
export function* updateJetpackSettings( settings = {} ) {
	const store = select( STORE_ID );
	const shouldTrackReaderChat = hasOwnSetting( settings, 'reader_chat' );
	const previousReaderChatEnabled = shouldTrackReaderChat
		? Boolean( store.isReaderChatEnabled() )
		: null;
	const isWpcom = shouldTrackReaderChat ? Boolean( store.isWpcom() ) : false;
	let previousSettings;

	try {
		yield updatingNotice();
		yield setUpdatingJetpackSettings();
		previousSettings = getRollbackSettings( store.getSearchModuleStatus() );
		yield setJetpackSettings( settings );
		const savedSettings = yield updateJetpackSettingsControl( settings );
		if ( shouldTrackReaderChat ) {
			const updatedReaderChatEnabled = hasOwnSetting( savedSettings, 'reader_chat' )
				? Boolean( savedSettings.reader_chat )
				: Boolean( settings.reader_chat );

			if ( updatedReaderChatEnabled !== previousReaderChatEnabled ) {
				analytics.tracks.recordEvent( 'jetpack_reader_chat_toggle', {
					enabled: updatedReaderChatEnabled,
					previous_enabled: previousReaderChatEnabled,
					is_wpcom: isWpcom,
					surface: 'jetpack_search_dashboard',
				} );
			}
		}
		const updatedSettings = yield fetchJetpackSettings();
		yield setJetpackSettings( updatedSettings );
		return successNotice( __( 'Updated settings.', 'jetpack-search-pkg' ) );
	} catch {
		yield setJetpackSettings( previousSettings ?? {} );
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
 * Promote a successfully saved experience selection into `experience` so the
 * ACTIVE badge stays on the user's choice for the rest of the session.
 *
 * Defence-in-depth alongside the post-save `fetchJetpackSettings` round-trip
 * in `updateJetpackSettings` — that fetch already seeds the new value, but
 * writing it explicitly here keeps the UI correct even if the response is
 * shaped slightly differently in development or against an older back end.
 *
 * @param {string} experience - One of the experience IDs.
 * @return {object} - an action object.
 */
export function setActiveExperience( experience ) {
	return setJetpackSettings( { experience } );
}

/**
 * Save the chosen experience by calling the existing updateJetpackSettings
 * generator, then promoting pending → experience only when the inner save
 * actually succeeded. The inner generator catches its own errors and returns
 * a notice action whose `status` distinguishes success from failure — that's
 * the signal we read here. On failure we leave `pending_experience` in place
 * so the user can retry without re-clicking.
 *
 * The whole experience-selector UI is gated behind `jetpack_search_blocks_enabled`,
 * so we send only `{ experience }`. The back end resolves the storage shape —
 * `'off'` deactivates the module, `'inline'` deletes the experience option,
 * `'embedded'` / `'overlay'` write affirmative values — and resolves the
 * payload's active `experience` value the same way on read.
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
	const result = yield updateJetpackSettings( { experience } );
	if ( result?.notice?.status !== 'is-success' ) {
		return;
	}
	yield setActiveExperience( experience );
	yield setPendingExperience( null );
}

export default {
	updateJetpackSettings,
	setJetpackSettings,
	setPendingExperience,
	setActiveExperience,
	saveExperience,
};
