/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';

export const setInitialState = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SET_INITIAL_STATE,
			initialState: window.Initial_State
		} );
	}
}

/**
 * Returns a string of the Connect URL used to connect or link an account
 * to WordPress.com
 *
 * @param  {Object}  state  Global state tree
 * @return {string}         Connect URL
 */
export function getConnectUrl( state ) {
	return state.jetpack.initialState.connectUrl;
}

/**
 * Returns a string of the current Jetpack version defined
 * by JETPACK__VERSION
 *
 * @param  {Object}  state  Global state tree
 * @return {string}         Version number
 */
export function getCurrentVersion( state ) {
	return state.jetpack.initialState.currentVersion;
}

/**
 * Returns an array of HE gravatar ID's
 *
 * @param  {Object}  state  Global state tree
 * @return {array}          array of IDs
 */
export function getHappinessGravatarIds( state ) {
	return state.jetpack.initialState.happinessGravIds;
}

/**
 * Returns bool if current version is Dev version
 * Which means -alpha, -beta, etc...
 *
 * @param  {Object}  state  Global state tree
 * @return {bool} true if dev version
 */
export function isDevVersion( state ) {
	return state.jetpack.initialState.isDevVersion;
}
