/*
 * This is just to hint to the dependency extraction tool that this package depends on @wordpress/date.
 * The locale is read off the `wp.date` global rather than imported, so there is nothing to bind here.
 * See: https://github.com/Automattic/jetpack/pull/47812#issuecomment-4142452829
 */
import '@wordpress/date';

export const FALLBACK_LOCALE = 'en';
export const FALLBACK_CURRENCY = 'USD';
