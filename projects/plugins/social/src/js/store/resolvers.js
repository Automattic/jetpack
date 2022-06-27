import { setJetpackSettings } from './actions/jetpack-settings';
import { setPublicizeSharesCount } from './actions/shares-count';
import { fetchJetpackSettings, fetchSharesCount } from './controls';

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

/**
 * Yield actions to get Publicize Share Count
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getPublicizeShareCount() {
	try {
		const sharesCount = yield fetchSharesCount();
		if ( sharesCount ) {
			return setPublicizeSharesCount( sharesCount );
		}
	} catch ( e ) {
		// TODO: Add proper error handling here
		console.log( e ); // eslint-disable-line no-console
	}
}

export default { getPublicizeModuleStatus };
