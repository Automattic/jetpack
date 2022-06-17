import { setJetpackSettings } from './actions/jetpack-settings';
import { fetchJetpackSettings } from './controls';

/**
 * Yield actions to get Publicize Module Status
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getPublicizeModuleStatus() {
	try {
		const settings = yield fetchJetpackSettings();
		if ( settings ) {
			return setJetpackSettings( settings );
		}
	} catch ( e ) {
		// TODO: Add proper error handling here
		console.log( e ); // eslint-disable-line no-console
	}
}

export default { getPublicizeModuleStatus };
