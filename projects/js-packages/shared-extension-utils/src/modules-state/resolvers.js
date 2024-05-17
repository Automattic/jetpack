import { setJetpackModules } from './actions';
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

export default { getJetpackModules };
