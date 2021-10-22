import {
	fetchJetpackSetttings as fetchJetpackSetttingsControl,
	updateJetpackSettings as updateJetpackSettingsControl,
} from '../controls';

export const SET_JETPACK_SETTINGS = 'SET_JETPACK_SETTINGS';
export const TOGGLE_SEARCH_MODULE = 'TOGGLE_SEARCH_MODULE';

function* updateJetpackSettings( settings ) {
	yield setJetpackSettings( settings );
	yield updateJetpackSettingsControl( settings );
	const updatedSettings = yield fetchJetpackSetttingsControl();
	return setJetpackSettings( updatedSettings );
}

function setJetpackSettings( options ) {
	return { type: SET_JETPACK_SETTINGS, options };
}

export default { updateJetpackSettings, setJetpackSettings };
