import { derived, Readable } from 'svelte/store';
import { castToString } from '../utils/cast-to-string';
import { sortByFrequency } from '../utils/sort-by-frequency';
import { criticalCssState } from './critical-css-state';
import {
	CriticalCssErrorDetails,
	Critical_CSS_Error_Type,
	Provider,
} from './critical-css-state-types';
import { JSONObject } from './data-sync-client';

/**
 * Specification for a set of errors that can appear as a part of a recommendation.
 * Every error in the set is of the same type.
 */
export type ErrorSet = {
	type: Critical_CSS_Error_Type; // Type of errors in this set.
	firstMeta: JSONObject; // Meta from the first error, for convenience.
	byUrl: {
		[ url: string ]: CriticalCssErrorDetails; // Each error keyed by URL.
	};
};

export const criticalCssIssues = derived( criticalCssState, $status => {
	return $status.providers.filter( provider => provider.errors?.length > 0 );
} );

/**
 * Derived datastore: Returns the most important Set of errors among the recommendations.
 * Used for displaying the most important error as a showstopper if no URLS succeeded.
 */
export const primaryErrorSet: Readable< ErrorSet > = derived( criticalCssIssues, $issues => {
	const importantProviders = [
		'core_front_page',
		'core_posts_page',
		'singular_page',
		'singular_post',
	];

	for ( const key of importantProviders ) {
		const issue = $issues.find( r => r.key === key );
		if ( issue ) {
			return groupErrorsByFrequency( issue )[ 0 ];
		}
	}
	return undefined;
} );

/**
 * Takes a Provider Key set of errors (in an object keyed by URL), and returns
 * a SortedErrorSet; an array which contains each type of error grouped. Also
 * groups things like HTTP errors by code.
 *
 * @param provider The recommendation the errors belong to.
 */
export function groupErrorsByFrequency( provider: Provider ): ErrorSet[] {
	const { errors } = provider;
	const groupKeys = errors.map( error => groupKey( error ) );
	const groupOrder = sortByFrequency( groupKeys );

	return groupOrder.map( group => {
		const byUrl = errors.reduce< { [ url: string ]: CriticalCssErrorDetails } >( ( acc, error ) => {
			if ( groupKey( error ) === group ) {
				acc[ error.url ] = error;
			}
			return acc;
		}, {} );
		const first = byUrl[ Object.keys( byUrl )[ 0 ] ];

		return {
			type: first.type,
			firstMeta: first.meta,
			byUrl,
		};
	} );
}

/**
 * Figures out a grouping key for the given Critical CSS error. Used to group
 * "like" errors - such as HTTP errors with the same code, or by type.
 *
 * @param {CriticalCssErrorDetails} error
 */
export function groupKey( error: CriticalCssErrorDetails ) {
	if (
		error.type === 'HttpError' &&
		typeof error.meta === 'object' &&
		error.meta !== null &&
		'code' in error.meta
	) {
		return error.type + '-' + castToString( error.meta.code, '' );
	}

	if ( error.type === 'UnknownError' ) {
		return error.type + '-' + error.message;
	}

	return error.type;
}
