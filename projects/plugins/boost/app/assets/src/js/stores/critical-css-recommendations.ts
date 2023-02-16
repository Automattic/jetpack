import { writable, derived, get } from 'svelte/store';
import { __ } from '@wordpress/i18n';
import api from '../api/api';
import { castToString } from '../utils/cast-to-string';
import { sortByFrequency } from '../utils/sort-by-frequency';
import { criticalCssStatus, updateIssues } from './critical-css-status';
import type { JSONObject } from '../utils/json-types';

type Critical_CSS_Error_Type =
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

export interface CriticalCssErrorDetails {
	url: string;
	message: string;
	meta: JSONObject;
	type: Critical_CSS_Error_Type;
}

export type CriticalCssIssue = {
	provider_name: string;
	key: string;
	status: 'active' | 'dismissed';
	errors: CriticalCssErrorDetails[];
};

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

const issuesStore = derived( criticalCssStatus, $status => {
	return $status.issues || [];
} );

const dismissalErrorStore = writable( null );
export const dismissalError = { subscribe: dismissalErrorStore.subscribe };

/**
 * Derived datastore: contains the number of provider keys which failed in the
 * latest Critical CSS generation run.
 */
export const failedProviderKeyCount = derived( issuesStore, $issues => {
	if ( $issues.length === 0 ) {
		return 0;
	}
	return $issues.reduce( ( acc, curr ) => ( curr.errors.length > 0 ? acc + 1 : acc ), 0 );
} );

/**
 * Store used to track Critical CSS Recommendations which have been dismissed.
 * Exported as a read-only store.
 */
export const dismissedIssues = derived( issuesStore, $issues => {
	if ( $issues.length === 0 ) {
		return [];
	}
	return $issues.filter( r => r.status === 'dismissed' );
} );

/**
 * Derived store containing Critical CSS recommendations which have not been dismissed.
 */
export const activeIssues = derived( issuesStore, $issues => {
	if ( $issues.length === 0 ) {
		return [];
	}
	return $issues.filter( r => r.status === 'active' );
} );

/**
 * Derived datastore: Returns the most important Set of errors among the recommendations.
 * Used for displaying the most important error as a showstopper if no URLS succeeded.
 */
export const primaryErrorSet = derived( issuesStore, $issues => {
	const importantProviders = [
		'core_front_page',
		'core_posts_page',
		'singular_page',
		'singular_post',
	];

	for ( const key of importantProviders ) {
		const issue = $issues.find( r => r.key === key );
		if ( issue ) {
			return groupErrorsByFrequency( issue );
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
export async function clearDismissedIssues(): Promise< void > {
	await api.post( '/recommendations/reset', {
		nonce: Jetpack_Boost.nonces[ 'recommendations/reset' ],
	} );
	const issues = get( issuesStore );
	updateIssues(
		issues.map( issue => {
			issue.status = 'active';
			return issue;
		} )
	);
}

/**
 * Takes a Provider Key set of errors (in an object keyed by URL), and returns
 * a SortedErrorSet; an array which contains each type of error grouped. Also
 * groups things like HTTP errors by code.
 *
 * @param issue The recommendation the errors belong to.
 */
export function groupErrorsByFrequency( issue: CriticalCssIssue ): ErrorSet[] {
	const { errors } = issue;
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
export async function dismissIssue( key: string ): Promise< void > {
	const issues = get( issuesStore );
	const issue = issues.find( el => el.key === key );
	if ( issue ) {
		issue.status = 'dismissed';
		updateIssues( issues );
	}
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
export async function showDismissedIssues() {
	try {
		await clearDismissedIssues();
	} catch ( error ) {
		setDismissalError(
			__( 'Failed to show the dismissed recommendations', 'jetpack-boost' ),
			error
		);
	}
}
