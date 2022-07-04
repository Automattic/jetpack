import { fetchSharesCount } from '../controls';

export const SET_SHARES_COUNT = 'SET_SHARES_COUNT';

/**
 * Yield actions to get Shares Count
 *
 * @yields {object} - an action object.
 * @returns {object} - an action object.
 */
export function* getSharesCount() {
	try {
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
 * @param {object} sharesCount - settings to apply.
 * @returns {object} - an action object.
 */
export function setPublicizeSharesCount( sharesCount ) {
	return { type: SET_SHARES_COUNT, sharesCount };
}

export default { setPublicizeSharesCount, getSharesCount };
