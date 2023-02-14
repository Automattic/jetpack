import { writable, derived } from 'svelte/store';
import { __ } from '@wordpress/i18n';
import api from '../api/api';
import { castToString } from '../utils/cast-to-string';
import { objectFilter } from '../utils/object-filter';
import { sortByFrequency } from '../utils/sort-by-frequency';
import type { JSONObject } from '../utils/json-types';

type Critical_CSS_Error_Types =
	| 'SuccessTargetError'
	| 'UrlError'
	| 'HttpError'
	| 'UnknownError'
	| 'CrossDomainError'
	| 'LoadTimeoutError'
	| 'RedirectError'
	| 'UrlVerifyError'
	| 'EmptyCSSError'
	| 'XFrameDenyError';

interface CriticalCssErrorDetails {
	message: string;
	type: Critical_CSS_Error_Types;
	meta: JSONObject;
}

type Critical_CSS_Issue = {
	provider_name: string;
	key: string;
	errors: {
		url: string;
		message: string;
		type: Critical_CSS_Error_Types;
		meta: JSONObject;
	}[];
};

const { criticalCSS } = Jetpack_Boost;
const initialIssues: Critical_CSS_Issue[] = criticalCSS?.status
	? Object.entries( criticalCSS.status.providers_errors ).reduce< Critical_CSS_Issue[] >(
			( issues, [ providerKey, urlErrors ] ) => {
				const { provider_key_labels } = criticalCSS.status;
				const providerName = provider_key_labels?.[ providerKey ] ?? providerKey;
				const existingIssue = issues.find( issue => issue.provider_name === providerName );
				const errors = Object.entries( urlErrors ).map( ( [ url, error ] ) => ( {
					url,
					message: error.message,
					type: error.type,
					meta: error.meta,
				} ) );
				if ( existingIssue ) {
					existingIssue.errors.push( ...errors );
				} else {
					issues.push( { provider_name: providerName, key: providerKey, errors } );
				}
				return issues;
			},
			[]
	  )
	: [];
console.log(initialIssues);

const issuesStore = writable< Critical_CSS_Issue[] >( initialIssues );

export type Critical_CSS_Recommendations = {
	providers_errors?: {
		[ providerKey: string ]: {
			[ url: string ]: CriticalCssErrorDetails;
		};
	};
	provider_key_labels?: { [ name: string ]: string };
};
const initialRecommendations: Critical_CSS_Recommendations =
	Jetpack_Boost.criticalCSS?.status || {};
const initialState = Jetpack_Boost.criticalCssDismissedRecommendations || [];
const recommendationStore = writable< Critical_CSS_Recommendations >( initialRecommendations );
const dismissed = writable< string[] >( initialState );
const dismissalErrorStore = writable( null );
export const dismissalError = { subscribe: dismissalErrorStore.subscribe };

/**
 * Derived datastore: contains the number of provider keys which failed in the
 * latest Critical CSS generation run.
 */
export const failedProviderKeyCount = derived( issuesStore, $issues =>
	$issues.reduce((acc, curr) => curr.errors.length > 0 ? acc + 1 : acc, 0)
);

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
export const recommendations = derived( recommendationStore, state => {
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
	const importantProviders = [
		'core_front_page',
		'core_posts_page',
		'singular_page',
		'singular_post',
	];

	for ( const key of importantProviders ) {
		const recommendation = recommends.find( r => r.key === key );
		if ( recommendation ) {
			return recommendation.errors[ 0 ];
		}
	}

	return undefined;
} );

/**
 * Set the dismissal error if something wrong occurred
 * during the event to dismiss a recommendation or the event
 * to clear the dismissed recommendations.
 *
 * @param {string} title Error display title.
 * @param {Object} error Error.
 */
function setDismissalError( title: string, error: JSONObject ): void {
	dismissalErrorStore.set( {
		title,
		error,
	} );
}

/**
 * Clear all the dismissed recommendations.
 */
export async function clearDismissedRecommendations(): Promise< void > {
	await api.post( '/recommendations/reset', {
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
export function groupKey( error: CriticalCssErrorDetails ) {
	if ( error.type === 'HttpError' ) {
		return error.type + '-' + castToString( error.meta.code, '' );
	}

	if ( error.type === 'UnknownError' ) {
		return error.type + '-' + error.message;
	}

	return error.type;
}

/**
 * Dismiss the recommendation associated with the given provider key. Calls the
 * API to update the back end in lock-step.
 *
 * @param {string} key Key of recommendation to dismiss.
 */
export async function dismissRecommendation( key: string ): Promise< void > {
	dismissed.update( keys => [ ...keys, key ] );
	try {
		await api.post( '/recommendations/dismiss', {
			providerKey: key,
			nonce: Jetpack_Boost.nonces[ 'recommendations/dismiss' ],
		} );
	} catch ( error ) {
		setDismissalError( __( 'Failed to dismiss recommendation', 'jetpack-boost' ), error );
	}
}
/**
 * Show the previously dismissed recommendations.
 */
export async function showDismissedRecommendations() {
	try {
		await clearDismissedRecommendations();
	} catch ( error ) {
		setDismissalError(
			__( 'Failed to show the dismissed recommendations', 'jetpack-boost' ),
			error
		);
	}
}
