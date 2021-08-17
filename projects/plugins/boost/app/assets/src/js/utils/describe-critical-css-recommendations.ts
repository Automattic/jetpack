/**
 * External dependencies
 */
import type { SvelteComponent } from 'svelte';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ErrorSet } from '../stores/critical-css-recommendations';
import type { CriticalCssErrorDetails } from '../stores/critical-css-status';
import { castToNumber } from './cast-to-number';
import UrlComponentsExample from '../pages/settings/elements/UrlComponentsExample.svelte';

/**
 * Return a string describing the given ErrorSet from a Recommendation.
 *
 * @param {ErrorSet} set Error set to describe
 */
export function describeErrorSet( set: ErrorSet ): string {
	const spec = getErrorSpec( set.type );
	return spec.describeSet( set );
}

/**
 * Return a string with suggestions for how the user can respond to the given
 * ErrorSet from a Recommendation.
 *
 * @param {ErrorSet} set Set to offer suggestions for
 */
export function textSuggestion( set: ErrorSet ): string {
	const spec = getErrorSpec( set.type );

	if ( spec.suggestion ) {
		return spec.suggestion( set );
	}

	return '';
}

/**
 * Returns a Svelte component to display in the footer of the given error set,
 * or null if no component should be displayed.
 *
 * @param {ErrorSet} set Set to get a footer component for.
 */
export function footerComponent( set: ErrorSet ): typeof SvelteComponent | null {
	const spec = getErrorSpec( set.type );

	if ( spec.footerComponent ) {
		return spec.footerComponent();
	}

	return null;
}

/**
 * Return a string with a raw error so the user can have more context for a specific error set.
 *
 * @param {ErrorSet} set Set to get the raw error for.
 */
export function rawError( set: ErrorSet ): string {
	const spec = getErrorSpec( set.type );

	if ( spec.rawError ) {
		return spec.rawError( set );
	}

	return '';
}

/**
 * Offer users a brief explanation of, and suggestion to manage an HTTP error
 * by code.
 *
 * @param {number} code  HTTP code to offer suggestions for.
 * @param {number} count The number of pages which failed with the specified HTTP error.
 */
function httpErrorSuggestion( code: number, count: number ): string {
	switch ( code ) {
		case 401:
		case 403:
			return sprintf(
				/* translators: %d is the HTTP error code; either 401 or 403 */
				_n(
					'%d means there is a permission issue in your WordPress site. Please check your WordPress settings, or contact your hosting provider to ask why the above URL is unavailable and <retry>try again</retry>.',
					'%d means there is a permission issue in your WordPress site. Please check your WordPress settings, or contact your hosting provider to ask why the above URLs are unavailable and <retry>try again</retry>.',
					count,
					'jetpack-boost'
				),
				code
			);

		case 404:
			return _n(
				'Your WordPress site has reported that the above page does not exist. Please ensure that the URL is correct, and <retry>try again</retry>.',
				'Your WordPress site has reported that the above pages do not exist. Please ensure that the URLs are correct, and <retry>try again</retry>.',
				count,
				'jetpack-boost'
			);

		case 418:
			return __(
				'Your WordPress site returned a 418 error which many web hosts use to indicate they rejected your request due to security rules. Please contact your hosting provider for more information.',
				'jetpack-boost'
			);

		case 500:
			return _n(
				'Your WordPress site encountered an error while trying to load the above page. Please check your server logs or contact your hosting provider for help to investigate the issue, and <retry>try again</retry>.',
				'Your WordPress site encountered errors while trying to load the above pages. Please check your server logs or contact your hosting provider for help to investigate the issue, and <retry>try again</retry>.',
				count,
				'jetpack-boost'
			);

		default:
			return _n(
				'This means that your WordPress site sent Jetpack Boost an error when it tried to load the specified page. Please ensure the above link is valid and <retry>try again</retry>.',
				'This means that your WordPress site sent Jetpack Boost an error when it tried to load the above pages. Please ensure the above links are valid and <retry>try again</retry>.',
				count,
				'jetpack-boost'
			);
	}
}

/**
 * Helper function to return a count of affected URLs for an error set.
 *
 * @param {ErrorSet} set Set to count the relevant URLs from.
 */
function urlCount( set: ErrorSet ): number {
	return Object.keys( set.byUrl ).length;
}

/**
 * Error type specifications: Contains information about how to group errors of
 * each type, what recommendations to show, etc.
 */
type ErrorTypeSpec = {
	groupKey?: ( error: CriticalCssErrorDetails ) => string; // Returns a string which helps determine error groupings. If unspecified, type is used.
	describeSet: ( set: ErrorSet ) => string; // Returns a string used to describe a set of this type of error.
	suggestion?: ( set: ErrorSet ) => string; // Returns a simple string with suggestions. Gets templated on display.
	footerComponent?: () => typeof SvelteComponent; // Returns an extra Svelte component to add to the footer of the error.
	rawError?: ( set: ErrorSet ) => string; // Returns a string of the first raw error message
};

const errorTypeSpecs: { [ type: string ]: ErrorTypeSpec } = {
	HttpError: {
		describeSet: set =>
			sprintf(
				/* translators: %d is the HTTP error code. */
				_n(
					'Boost received HTTP error <b>%d</b> on the following page:',
					'Boost received HTTP error <b>%d</b> on the following pages:',
					urlCount( set ),
					'jetpack-boost'
				),
				set.firstMeta.code
			),
		suggestion: set => httpErrorSuggestion( castToNumber( set.firstMeta.code ), urlCount( set ) ),
	},

	RedirectError: {
		describeSet: set =>
			_n(
				'This URL is redirecting to a different page:',
				'These URLs are redirecting to different pages:',
				urlCount( set ),
				'jetpack-boost'
			),
		suggestion: set => {
			const description = __(
				'This may indicate that a WordPress plugin is redirecting users who are not logged in to a different location, or it may indicate that your hosting provider is redirecting your WordPress site to a different URL. ',
				'jetpack-boost'
			);

			const solution = _n(
				'Please visit the above link while not logged into WordPress to see what happens, contact your hosting provider for assistance with URL redirection, and <retry>try again</retry>.',
				'Please visit the above links while not logged into WordPress to see what happens, contact your hosting provider for assistance with URL redirection, and <retry>try again</retry>.',
				urlCount( set ),
				'jetpack-boost'
			);

			return description + solution;
		},
	},

	CrossDomainError: {
		describeSet: set =>
			_n(
				"It looks like this URL doesn't match:",
				"It looks like these URLs don't match:",
				urlCount( set ),
				'jetpack-boost'
			),
		suggestion: set =>
			__(
				'Visit the page and look at the protocol and host name to ensure it matches the one in your <a target="_blank" href="https://wordpress.org/support/article/administration-screens/">WordPress Administration Screen</a>. If not, then please reach out to your hosting provider and ask why. If you believe the issue is resolved, please <retry>try again</retry>.',
				'jetpack-boost'
			),
		footerComponent: () => UrlComponentsExample,
	},

	LoadTimeoutError: {
		describeSet: set =>
			_n( 'This page timed out:', 'These pages timed out:', urlCount( set ), 'jetpack-boost' ),
		suggestion: set =>
			__(
				'Clear your cache in your browser, then visit the page while not logged into WordPress. See how long it takes to load compared to other pages on your site. If this page is slower than the others, check what plugins are working on that page, deactivate them and <retry>try again</retry>.',
				'jetpack-boost'
			),
	},

	UrlVerifyError: {
		describeSet: set =>
			_n(
				"Jetpack Boost couldn't verify this page:",
				"Jetpack Boost couldn't verify these pages:",
				urlCount( set ),
				'jetpack-boost'
			),
		suggestion: set =>
			__(
				'Please load the page, and verify that the content displayed is a part of your WordPress site, and not an external page managed by a different system and <retry>try again</retry>.',
				'jetpack-boost'
			),
	},

	UnknownError: {
		describeSet: set =>
			_n(
				'An unexpected error occurred while trying to generate Critical CSS for the following page:',
				'An unexpected error occurred while trying to generate Critical CSS for the following pages:',
				urlCount( set ),
				'jetpack-boost'
			),
		rawError: set => Object.values( set.byUrl )[ 0 ].message,
		suggestion: set =>
			__(
				'Something went wrong, which Jetpack Boost did not anticipate. Please try visiting the link to check that it works, check the error message below, and <retry>try again</retry>. If you need help, please contact <support>Jetpack Boost Support</support> with a copy of your error message.',
				'jetpack-boost'
			),
	},
};

function getErrorSpec( type: string ): ErrorTypeSpec {
	return errorTypeSpecs[ type ] || errorTypeSpecs.UnknownError;
}
