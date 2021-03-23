/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

export default function getSiteUrl() {
	console.log( 'site url getter running' );
	return get( getJetpackData(), [ 'siteUrl' ], null );
}
