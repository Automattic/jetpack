/**
 * Internal dependencies
 */
import { SITE_CHECKLIST_RECEIVE, SITE_CHECKLIST_REQUEST } from 'state/action-types';
import restApi from 'rest-api';

export function requestSiteChecklist() {
	return dispatch => {
		dispatch( { type: SITE_CHECKLIST_REQUEST } );
		restApi
			.getChecklistData()
			.then( receiveSiteChecklist )
			.then( dispatch );
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
