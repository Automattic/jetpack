/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { siteHasNeverPublishedPostPath } from './constants';

export type SiteHasNeverPublishedPostResponse = boolean;

export function fetchSiteHasNeverPublishedPost() {
	return apiFetch< SiteHasNeverPublishedPostResponse >( {
		path: siteHasNeverPublishedPostPath,
	} );
}
