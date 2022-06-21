import { fetchSharesCount } from '../controls';

export const FETCH_SHARES_COUNT = 'FETCH_SHARES_COUNT';
export const SET_SHARES_COUNT = 'SET_SHARES_COUNT';

/**
 * Yield actions to get Shares Count
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getSharesCount() {
	try {
		console.log( ' i am here paaa!!' );
		const sharesCount = yield fetchSharesCount();
		yield setPublicizeSharesCount( sharesCount );
		return true;
	} catch ( e ) {
		return false;
	}
}

/**
 * Set Jetpack share Shares Count action
 *
 * @param sharesCount
 * @returns {object} - an action object.
 */
export function setPublicizeSharesCount( sharesCount ) {
	return { type: SET_SHARES_COUNT, sharesCount };
}

export default { setPublicizeSharesCount };
