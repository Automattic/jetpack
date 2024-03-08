import { PreflightTestStatus } from './constants';

/**
 * Returns the current status of the preflight tests.
 * @param {object} state - State tree
 * @returns {Array} Preflight statuses
 */
export const getPreflightStatus = state => {
	if ( ! state.jetpack.rewind.preflight.featureEnabled ) {
		return PreflightTestStatus.FAILED;
	}

	return state.jetpack.rewind.preflight.overallStatus || PreflightTestStatus.PENDING;
};

/**
 * Returns true if currently requesting preflight tests.
 *
 * @param   {object}  state - State tree
 * @returns {boolean} Whether preflight status is being requested
 */
export function isFetchingPreflightStatus( state ) {
	return state.jetpack.rewind.preflight.isFetching;
}

/**
 * Returns true if preflight tests has loaded.
 *
 * @param   {object}  state - State tree
 * @returns {boolean} Whether preflight status has been loaded
 */
export function hasLoadedPreflightStatus( state ) {
	return state.jetpack.rewind.preflight.hasLoaded;
}
