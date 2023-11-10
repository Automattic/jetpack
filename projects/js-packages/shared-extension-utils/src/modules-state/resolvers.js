import { setJetpackModules, fetchModules } from './actions';
import { fetchJetpackModules } from './controls';

/**
 * Yield actions to get the Jetpack modules.
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getJetpackModules() {
	try {
		const data = yield fetchJetpackModules();
		if ( data ) {
			return setJetpackModules( { data } );
		}
	} catch ( e ) {
		console.error( e ); // eslint-disable-line no-console
	}
}

/**
 * When requesting data on particular module
 * we want to make sure to have the latest state
 * @returns {boolean} - if action was completed successfully.
 */
export function isModuleActive() {
	return fetchModules();
}

export default { getJetpackModules, isModuleActive };
