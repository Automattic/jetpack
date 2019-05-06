/**
 * Internal dependencies
 */
import { SITE_CHECKLIST_RECEIVE, SITE_CHECKLIST_REQUEST } from 'state/action-types';
// import restApi from 'rest-api';

export function requestSiteChecklist() {
	return dispatch => {
		dispatch( { type: SITE_CHECKLIST_REQUEST } );
		// @TODO Make a real API request
		setTimeout( () => {
			dispatch(
				receiveSiteChecklist( {
					designType: null,
					segment: false,
					verticals: [],
					tasks: {
						jetpack_backups: { completed: null },
						jetpack_monitor: { completed: true },
						jetpack_plugin_updates: { completed: null },
						jetpack_sign_in: { completed: true },
					},
				} )
			);
		}, 100 );
	};
}

/**
 * Update checklist in state
 *
 * @param {Object} checklist the new checklist state
 * @return {Object} action object
 */
export function receiveSiteChecklist( checklist ) {
	return {
		type: SITE_CHECKLIST_RECEIVE,
		checklist,
	};
}

// @TODO API Request is like this on .com
// const q = {
// 	path: `/sites/${ action.siteId }/checklist`,
// 	method: 'GET',
// 	apiNamespace: 'rest/v1',
// 	query: {
// 		http_envelope: 1,
// 	},
// };
