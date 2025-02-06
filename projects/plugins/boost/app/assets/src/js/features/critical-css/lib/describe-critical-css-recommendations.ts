import { __, _n, sprintf } from '@wordpress/i18n';
import { CriticalCssErrorDetails } from './stores/critical-css-state-types';
import { castToNumber } from '$lib/utils/cast-to-number';
import type { ErrorSet } from './critical-css-errors';
import type { ComponentType } from 'react';
import UrlComponentsExample from '$features/critical-css/url-components-example/url-components-example';

type Suggestion = {
	paragraph: string;
	list?: string[];
	listLink?: string;
	closingParagraph?: string;
};

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
 * Return a suggestion text paragraph (and sometimes a list of steps) to display
 * for the specified error set.
 *
 * @param {ErrorSet} set Set to offer suggestions for
 */
export function suggestion( set: ErrorSet ): Suggestion {
	const spec = getErrorSpec( set.type );

	if ( spec.suggestion ) {
		return spec.suggestion( set );
	}

	return {
		paragraph: '',
	};
}

/**
 * Returns a React component to display in the footer of the given error set,
 * or null if no component should be displayed.
 *
 * @param {ErrorSet} set Set to get a footer component for.
 */
export function footerComponent( set: ErrorSet ): ComponentType | null {
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
function httpErrorSuggestion( code: number, count: number ): Suggestion {
	switch ( code ) {
		case 401:
		case 403:
			return {
				paragraph: sprintf(
					/* translators: %d is the HTTP error code; either 401 or 403 */
					_n(
						'%d means there is a permission issue in your WordPress site. Please follow these troubleshooting steps for the page:',
						'%d means there is a permission issue in your WordPress site. Please follow these troubleshooting steps for each of the pages:',
						count,
						'jetpack-boost'
					),
					code
				),
				list: [
					__(
						'Check your WordPress settings, or contact your hosting provider to ask why the above URL is unavailable.',
						'jetpack-boost'
					),
					__( '<retry>Try again</retry> to generate the Critical CSS.', 'jetpack-boost' ),
				],
				closingParagraph: __(
					'If this is a private page and not supposed to be viewed publicly, you can safely ignore this message.',
					'jetpack-boost'
				),
			};

		case 404:
			return {
				paragraph: _n(
					'Your WordPress site has reported that the above page does not exist. Please ensure that the URL is correct, and <retry>try again</retry>.',
					'Your WordPress site has reported that the above pages do not exist. Please ensure that the URLs are correct, and <retry>try again</retry>.',
					count,
					'jetpack-boost'
				),
				list: [
					__(
						'Visit the link, and confirm that the page you landed on loads successfully.',
						'jetpack-boost'
					),
					__(
						'If the page shows an error, please verify that the page should be a part of your WordPress site.',
						'jetpack-boost'
					),
					__(
						'Try visiting the link using "Incognito Mode" or "Private Browsing" in your browser to check if the error occurs when you are not logged in.',
						'jetpack-boost'
					),
					__(
						'If you see an error only when not logged into your WordPress site (i.e.: in "Incognito Mode"), then check for plugins which might be enforcing access permissions on your pages. For example, a plugin which only allows authenticated users to view specific areas of your site.',
						'jetpack-boost'
					),
					__(
						'Once you have resolved the error, please <retry>try again</retry>.',
						'jetpack-boost'
					),
				],
				closingParagraph: __(
					'If the page is only accessible to users who are logged in to your WordPress site, or should not be a part of your site then it is safe to ignore this error.',
					'jetpack-boost'
				),
			};

		case 418:
			return {
				paragraph: __(
					'Your WordPress site returned a 418 error which many web hosts use to indicate they rejected your request due to security rules. Please contact your hosting provider for more information.',
					'jetpack-boost'
				),
				list: [
					__(
						'Contact your hosting provider, with details of this issue. Please let them know it is an "HTTP 418" error, which URL(s) are affected, and the time it occurred.',
						'jetpack-boost'
					),
					__(
						'Your hosting provider should be able to advise you on next steps.',
						'jetpack-boost'
					),
					__(
						'If you manage to sort the issue out with your hosting provider, please <retry>try again</retry> to regenerate your Critical CSS.',
						'jetpack-boost'
					),
				],
			};

		case 500:
			return {
				paragraph: _n(
					'Your WordPress site encountered an error while trying to load the above page.',
					'Your WordPress site encountered errors while trying to load the above pages.',
					count,
					'jetpack-boost'
				),
				list: [
					__(
						'Learn about the error and common solutions by <link>clicking here</link>.',
						'jetpack-boost'
					),
					__(
						'If the issue is still not resolved, check your server logs or contact your hosting provider for help to investigate the issue.',
						'jetpack-boost'
					),
					__(
						'Once you have resolved the issue which caused the 500 error, you can <retry>try again</retry>.',
						'jetpack-boost'
					),
				],
				listLink:
					'https://wordpress.org/support/article/common-wordpress-errors/#internal-server-error',
			};

		default:
			return {
				paragraph: _n(
					'Please verify the link is valid and <retry>try again</retry>. We recommend the following:',
					'Please verify each link is valid and <retry>try again</retry>. For each link, we recommend the following:',
					count,
					'jetpack-boost'
				),
				list: [
					__( 'Visit the link and check for an error.', 'jetpack-boost' ),
					__(
						'<retry>Try to generate Critical CSS again</retry>, in case the error was intermittent.',
						'jetpack-boost'
					),
					sprintf(
						/* translators: %d is the HTTP error code; This can be any error code that is not specifically handled. */
						__(
							'Check your server logs for information about the HTTP %d error, or contact your hosting provider for help with investigating the problem.',
							'jetpack-boost'
						),
						code
					),
					__(
						'Once you have resolved the error, please <retry>try again</retry>.',
						'jetpack-boost'
					),
					__(
						'If you need help understanding the error, or investigating what went wrong please contact <support>Jetpack Boost Support</support>.',
						'jetpack-boost'
					),
				],
			};
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
	suggestion?: ( set: ErrorSet ) => Suggestion; // Returns a simple string with suggestions. Gets templated on display.
	footerComponent?: () => ComponentType; // Returns an extra React component to add to the footer of the error.
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
		suggestion: _set => ( {
			paragraph: __(
				'This may indicate that a WordPress plugin is redirecting users who are not logged in to a different location, or it may indicate that your hosting provider is redirecting your WordPress site to a different URL.',
				'jetpack-boost'
			),
			list: [
				__(
					'Try visiting the link using "Incognito Mode" or "Private Browsing" in your browser and note if the page is being redirected.',
					'jetpack-boost'
				),
				__(
					'If it is redirecting, check if a plugin could potentially create the redirection and fix it if appropriate. Otherwise, contact your hosting provider for assistance to fix the URL redirection.',
					'jetpack-boost'
				),
				__(
					'If you believe the issue is resolved, please <retry>try again</retry>.',
					'jetpack-boost'
				),
			],
			closingParagraph: __(
				'If you think that the redirection is valid, then it is safe to ignore this issue.',
				'jetpack-boost'
			),
		} ),
	},

	CrossDomainError: {
		describeSet: set =>
			_n(
				"It looks like this URL doesn't match:",
				"It looks like these URLs don't match:",
				urlCount( set ),
				'jetpack-boost'
			),
		suggestion: set => ( {
			paragraph: _n(
				'Visit the page and complete the following troubleshooting steps.',
				'Visit each page and complete the following troubleshooting steps.',
				urlCount( set ),
				'jetpack-boost'
			),
			list: [
				__(
					'Visit the page and look at the protocol and host name to ensure it matches the one in your <link>WordPress Administration Screen</link>.',
					'jetpack-boost'
				),
				__(
					'If not, then please reach out to your hosting provider and ask why.',
					'jetpack-boost'
				),
				__(
					'If you believe the issue is resolved, please <retry>try again</retry>.',
					'jetpack-boost'
				),
			],
			listLink: 'https://wordpress.org/support/article/administration-screens/',
		} ),
		footerComponent: () => UrlComponentsExample,
	},

	LoadTimeoutError: {
		describeSet: set =>
			_n( 'This page timed out:', 'These pages timed out:', urlCount( set ), 'jetpack-boost' ),
		suggestion: set => ( {
			paragraph: _n(
				'The page timed out during load. There could be various reasons but most likely a plugin is causing this issue. Please complete the following steps.',
				'The pages timed out during load. There could be various reasons but most likely a plugin is causing this issue. Please complete the following steps for each of the pages.',
				urlCount( set ),
				'jetpack-boost'
			),
			list: [
				__( 'Clear the cache in your browser.', 'jetpack-boost' ),
				__( 'Visit the page while not logged into WordPress.', 'jetpack-boost' ),
				__(
					'See how long it takes to load compared to other pages on your site.',
					'jetpack-boost'
				),
				__(
					'If this page is slower than the others, check what plugins are working on that page.',
					'jetpack-boost'
				),
				__( 'Deactivate any plugin that you believe are making the page slow.', 'jetpack-boost' ),
				__( '<retry>Try again</retry> to generate the Critical CSS.', 'jetpack-boost' ),
			],
		} ),
	},

	UrlVerifyError: {
		describeSet: set =>
			_n(
				"Jetpack Boost couldn't verify this page:",
				"Jetpack Boost couldn't verify these pages:",
				urlCount( set ),
				'jetpack-boost'
			),
		suggestion: set => ( {
			paragraph: _n(
				'Please follow the troubleshooting steps below for the page.',
				'Please follow the troubleshooting steps below for each of the pages.',
				urlCount( set ),
				'jetpack-boost'
			),
			list: [
				__( 'Visit the page.', 'jetpack-boost' ),
				__(
					'Verify that the content displayed is a part of your WordPress site, and not an external page managed by a different system.',
					'jetpack-boost'
				),
				__( '<retry>Try again</retry> to generate the Critical CSS.', 'jetpack-boost' ),
			],
		} ),
	},

	EmptyCSSError: {
		describeSet: set =>
			_n(
				'It looks like this page does not contain any relevant CSS in its external style sheet(s):',
				'It looks like these pages do not contain any relevant CSS in their external style sheet(s):',
				urlCount( set ),
				'jetpack-boost'
			),
		suggestion: set => ( {
			paragraph: _n(
				'Please follow the troubleshooting steps below for the page.',
				'Please follow the troubleshooting steps below for each of the pages.',
				urlCount( set ),
				'jetpack-boost'
			),
			list: [
				__( 'Visit the page.', 'jetpack-boost' ),
				__( 'Verify its styles load correctly, and <retry>try again</retry>.', 'jetpack-boost' ),
			],
			closingParagraph: __(
				'If you are using a plugin which embeds your CSS styles directly into your pages, or your site does not use external CSS style sheets, then it is safe to ignore this issue as Critical CSS can only speed up pages which use external styles.',
				'jetpack-boost'
			),
		} ),
	},

	UnknownError: {
		describeSet: set =>
			_n(
				'Something went wrong, which Jetpack Boost did not anticipate. An unexpected error occurred while trying to generate Critical CSS for the following page:',
				'Something went wrong, which Jetpack Boost did not anticipate. An unexpected error occurred while trying to generate Critical CSS for the following pages:',
				urlCount( set ),
				'jetpack-boost'
			),
		rawError: set => Object.values( set.byUrl )[ 0 ].message,
		suggestion: set => ( {
			paragraph: _n(
				'Please follow the troubleshooting steps below for the page.',
				'Please follow the troubleshooting steps below for each of the pages.',
				urlCount( set ),
				'jetpack-boost'
			),
			list: [
				__( 'Visit the page.', 'jetpack-boost' ),
				__( 'Verify that the page loads correctly.', 'jetpack-boost' ),
				__( 'If it does, <retry>try again</retry> to generate the Critical CSS.', 'jetpack-boost' ),
				__(
					'If the error still persist please contact <support>Jetpack Boost Support</support> with a copy of your error message.',
					'jetpack-boost'
				),
			],
		} ),
	},

	XFrameDenyError: {
		describeSet: set =>
			_n(
				"Jetpack Boost couldn't load the following page due to its X-Frame-Options configuration:",
				"Jetpack Boost couldn't load the following page due to their X-Frame-Options configuration:",
				urlCount( set ),
				'jetpack-boost'
			),
		rawError: set => Object.values( set.byUrl )[ 0 ].message,
		suggestion: _set => ( {
			paragraph: __(
				'Jetpack Boost uses iframes while generating your Critical CSS. Unfortunately, your site has a special configuration header which prevents it from loading inside an iframe. The header is called "X-Frame-Options: DENY". This can be added to a WordPress site either by using a plugin, or by server configuration.',
				'jetpack-boost'
			),
			list: [
				__(
					'Check that you are not using any plugins which add extra HTTP headers to your WordPress site, and deactivate them if you are.',
					'jetpack-boost'
				),
				__(
					'If you are unsure of what these headers are, or where they come from please contact your hosting provider and ask them to remove the "X-Frame-Options" header from your site',
					'jetpack-boost'
				),
				__( '<retry>Try again</retry> to generate the Critical CSS.', 'jetpack-boost' ),
			],
		} ),
	},
};

function getErrorSpec( type: string ): ErrorTypeSpec {
	return errorTypeSpecs[ type ] || errorTypeSpecs.UnknownError;
}
