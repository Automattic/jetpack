/**
 * External dependencies
 */
import { memoize, get } from 'lodash';

export function isLoading( state ) {
	return state.jetpack.checklist.isLoading;
}

export function getTasks( state ) {
	return get( state, [ 'jetpack', 'checklist', 'checklist', 'tasks' ] );
}

const memoizedChecklistCompletion = memoize( tasks => {
	const taskKeys = Object.keys( tasks );

	return {
		completed: taskKeys.filter( key => tasks[ key ].completed ).length,
		total: taskKeys.length,
	};
} );

export function getChecklistCompletion( state ) {
	const tasks = getTasks( state );
	return tasks ? memoizedChecklistCompletion( tasks ) : null;
}
