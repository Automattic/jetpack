import { writable, derived } from 'svelte/store';
import api from '../api/api';
import { castToString } from '../utils/cast-to-string';
import { objectFilter } from '../utils/object-filter';
import { sortByFrequency } from '../utils/sort-by-frequency';
import { CriticalCssErrorDetails, criticalCssStatus } from './critical-css-status';
import type { JSONObject } from '../utils/json-types';

const importantProviders = [
	'core_front_page',
	'core_posts_page',
	'singular_page',
	'singular_post',
];

// eslint-disable-next-line camelcase
const initialState = Jetpack_Boost.criticalCssDismissedRecommendations || [];
const dismissed = writable< string[] >( initialState );

/**
 * Specification for a set of errors that can appear as a part of a recommendation.
 * Every error in the set is of the same type.
 */
export type ErrorSet = {
	type: string; // Type of errors in this set.
	firstMeta: JSONObject; // Meta from the first error, for convenience.
	byUrl: {
		[ url: string ]: CriticalCssErrorDetails; // Each error keyed by URL.
	};
};

/**
 * Specification of the Recommendation data structure used for display.
 */
type Recommendation = {
	key: string; // Provider Key associated with this recommendation.
	label: string; // Label for the Provider Key.
	errors: ErrorSet[]; // Sets of errors grouped for display. Mostly grouped by error type, but can also group by HTTP error code.
};

/**
 * Derived store containing Critical CSS recommendations based on Critical CSS
 * status and the provider key errors inside.
 */
export const recommendations = derived( criticalCssStatus, state => {
	if ( ! state.providers_errors ) {
		return [];
	}

	return Object.entries( state.providers_errors ).map< Recommendation >(
		( [ key, urlErrors ] ) => ( {
			key,
			label: state.provider_key_labels[ key ] || key,
			errors: groupErrorsByFrequency( urlErrors ),
		} )
	);
} );

/**
 * Store used to track Critical CSS Recommendations which have been dismissed.
 * Exported as a read-only store.
 */
export const dismissedRecommendations = { subscribe: dismissed.subscribe };

/**
 * Derived store containing Critical CSS recommendations which have not been dismissed.
 */
export const activeRecommendations = derived(
	[ recommendations, dismissedRecommendations ],
	( [ recommends, dismisses ] ) => recommends.filter( r => ! dismisses.includes( r.key ) )
);

/**
 * Derived datastore: Returns the most important Set of errors among the recommendations.
 * Used for displaying the most important error as a showstopper if no URLS succeeded.
 */
export const primaryErrorSet = derived( recommendations, recommends => {
	for ( const key of importantProviders ) {
		const recommendation = recommends.find( r => r.key === key );
		if ( recommendation ) {
			return recommendation.errors[ 0 ];
		}
	}

	return undefined;
} );

/**
 * Store used to track Critical CSS Recommendations dismissal error.
 */
export const dismissalError = writable( null );

/**
 * Set the dismissal error if something wrong occurred
 * during the event to dismiss a recommendation or the event
 * to clear the dismissed recommendations.
 *
 * @param {string} title Error display title.
 * @param {Object} error Error.
 */
export function setDismissalError( title: string, error: JSONObject ): void {
	dismissalError.set( {
		title,
		error,
	} );
}

/**
 * Dismiss the recommendation associated with the given provider key. Calls the
 * API to update the back end in lock-step.
 *
 * @param {string} key Key of recommendation to dismiss.
 */
export async function dismissRecommendation( key: string ): Promise< void > {
	await api.post( '/recommendations/dismiss', {
		providerKey: key,
		// eslint-disable-next-line camelcase
		nonce: Jetpack_Boost.nonces[ 'recommendations/dismiss' ],
	} );
	dismissed.update( keys => [ ...keys, key ] );
}

/**
 * Clear all the dismissed recommendations.
 */
export async function clearDismissedRecommendations(): Promise< void > {
	await api.post( '/recommendations/reset', {
		// eslint-disable-next-line camelcase
		nonce: Jetpack_Boost.nonces[ 'recommendations/reset' ],
	} );
	dismissed.set( [] );
}

/**
 * Takes a Provider Key set of errors (in an object keyed by URL), and returns
 * a SortedErrorSet; an array which contains each type of error grouped. Also
 * groups things like HTTP errors by code.
 *
 * @param {Object} errors Errors in an object keyed by URL to group
 */
function groupErrorsByFrequency( errors: {
	[ url: string ]: CriticalCssErrorDetails;
} ): ErrorSet[] {
	const groupKeys = Object.values( errors ).map( groupKey );
	const groupOrder = sortByFrequency( groupKeys );

	return groupOrder.map( group => {
		const byUrl = objectFilter( errors, v => groupKey( v ) === group );
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
function groupKey( error: CriticalCssErrorDetails ) {
	if ( error.type === 'HttpError' ) {
		return error.type + '-' + castToString( error.meta.code, '' );
	}

	if ( error.type === 'UnknownError' ) {
		return error.type + '-' + error.message;
	}

	return error.type;
}
