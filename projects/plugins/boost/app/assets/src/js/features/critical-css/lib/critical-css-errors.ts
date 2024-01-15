import { castToString } from '$lib/utils/cast-to-string';
import { JSONObject } from '$lib/utils/json-types';
import { sortByFrequency } from '$lib/utils/sort-by-frequency';
import {
	CriticalCssErrorDetails,
	CriticalCssState,
	Critical_CSS_Error_Type,
	Provider,
} from './stores/critical-css-state-types';

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

/**
 * Given a Critical CSS State, returns whether or not this represents a fatal error.
 *
 * @param {CriticalCssState} cssState - The CSS State object.
 */
export function isFatalError( cssState: CriticalCssState ): boolean {
	if ( cssState.status === 'error' ) {
		return true;
	}

	if ( cssState.status === 'not_generated' ) {
		return false;
	}

	return ! cssState.providers.some( provider =>
		[ 'success', 'pending' ].includes( provider.status )
	);
}

/**
 * Given a CSS State object, returns all the providers that have errors.
 *
 * @param cssState - The CSS State object.
 */
export function getCriticalCssIssues( cssState: CriticalCssState ): Provider[] {
	return cssState.providers.filter( provider => ( provider.errors?.length || 0 ) > 0 );
}

/**
 * Given a CSS State object, return the most important Set of errors among the recommendations.
 *
 * @param cssState - The CSS State object.
 */
export function getPrimaryErrorSet( cssState: CriticalCssState ): ErrorSet | undefined {
	const issues = getCriticalCssIssues( cssState );

	if ( ! issues.length ) {
		return undefined;
	}

	const importantProviders = [
		'core_front_page',
		'core_posts_page',
		'singular_page',
		'singular_post',
	];

	for ( const key of importantProviders ) {
		const issue = issues.find( r => r.key === key );
		if ( issue ) {
			return groupErrorsByFrequency( issue )[ 0 ];
		}
	}

	return undefined;
}

/**
 * Takes a Provider Key set of errors (in an object keyed by URL), and returns
 * a SortedErrorSet; an array which contains each type of error grouped. Also
 * groups things like HTTP errors by code.
 *
 * @param provider The recommendation the errors belong to.
 */
export function groupErrorsByFrequency( provider: Provider ): ErrorSet[] {
	if ( ! provider.errors ) {
		return [];
	}

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
