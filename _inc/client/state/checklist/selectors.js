/**
 * External dependencies
 */
import { get } from 'lodash';

export function isLoading( state ) {
	return state.jetpack.checklist.isLoading;
}

export function getTasks( state ) {
	return get( state, [ 'jetpack', 'checklist', 'checklist', 'tasks' ] );
}
