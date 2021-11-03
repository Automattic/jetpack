/**
 * Internal dependencies
 */
import {
	fetchJetpackSettings as fetchJetpackSettingsControl,
	updateJetpackSettings as updateJetpackSettingsControl,
} from '../controls';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

function* updateJetpackSettings( settings ) {
	yield setJetpackSettings( settings );
	yield setJetpackSettingsNetworkBusy();
	const updatedSettings = yield updateJetpackSettingsControl( settings );
	yield setJetpackSettingsNetworkFree();
	return setJetpackSettings( updatedSettings );
}

function setJetpackSettingsNetworkBusy() {
	return setJetpackSettings( { isUpdatingOptions: true } );
}

function setJetpackSettingsNetworkFree() {
	return setJetpackSettings( { isUpdatingOptions: false } );
}

function setJetpackSettings( options ) {
	return { type: SET_JETPACK_SETTINGS, options };
}

export default { updateJetpackSettings, setJetpackSettings };
