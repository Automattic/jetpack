import { select } from '@wordpress/data';
import { isSimpleSite } from '../site-type-utils';
import {
	fetchJetpackModules,
	updateJetpackModuleStatus as updateJetpackModuleStatusControl,
} from './controls';
import { JETPACK_MODULES_STORE_ID } from '.';

export const SET_JETPACK_MODULES = 'SET_JETPACK_MODULES';
export const SET_MODULE_UPDATING = 'SET_MODULE_UPDATING';

/**
 * Yield actions to update module status
 *
 * @param {object} settings - Jetpack module settings.
 * @param {string} settings.name - Jetpack module name.
 * @param {boolean} settings.active - If the module is active or not.
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* updateJetpackModuleStatus( settings ) {
	try {
		yield setIsUpdating( settings.name, true );
		yield updateJetpackModuleStatusControl( settings );
		const data = yield fetchJetpackModules();
		yield setJetpackModules( { data } );
		return true;
	} catch ( e ) {
		const oldSettings = select( JETPACK_MODULES_STORE_ID ).getJetpackModules();
		yield setJetpackModules( oldSettings );
		return false;
	} finally {
		yield setIsUpdating( settings.name, false );
	}
}

/**
 * Yield actions to update module status
 * @yields {object} - an action object.
 * @returns {boolean} - if operation is successful or not.
 */
export function* fetchModules() {
	// We don't fetch modules for Simple Site and aknowledge that all modules are active
	if ( isSimpleSite() ) {
		return true;
	}
	try {
		yield setIsLoading( true );
		const data = yield fetchJetpackModules();
		yield setJetpackModules( { data } );
		return true;
	} catch ( e ) {
		const oldSettings = select( JETPACK_MODULES_STORE_ID ).getJetpackModules();
		yield setJetpackModules( oldSettings );
		return false;
	} finally {
		yield setIsLoading( false );
	}
}

/**
 * Set modules as loading action
 *
 * @param {boolean} isLoading - If the modules are loading or not.
 * @returns {object} - an action object.
 */
function setIsLoading( isLoading ) {
	return setJetpackModules( { isLoading } );
}

/**
 * Set modules as updating action
 *
 * @param {string} name - Name of the module.
 * @param {boolean} isUpdating - If the modules are updating or not.
 * @returns {object} - an action object.
 */
function setIsUpdating( name, isUpdating ) {
	return { type: SET_MODULE_UPDATING, name, isUpdating };
}

/**
 * Set Jetpack module action
 *
 * @param {object} options - Jetpack settings.
 * @param {object} options.modules - Jetpack modules.
 * @param {boolean} options.isLoading - If the modules are loading or not.
 * @returns {object} - an action object.
 */
export function setJetpackModules( options ) {
	return { type: SET_JETPACK_MODULES, options };
}

export default { updateJetpackModuleStatus, setJetpackModules, fetchModules };
