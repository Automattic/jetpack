/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getJetpackData from './get-jetpack-data';

export default function getWpcomBlogId() {
	let blogId = get( getJetpackData(), [ 'wpcomBlogId' ], null );
	if ( blogId ) {
		blogId = parseInt( blogId, 10 );
	}
	return blogId;
}
