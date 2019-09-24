/**
 * External Dependencies
 */
import { get } from 'lodash';

export default function isWpcomSite() {
	return (
		get( 'object' === typeof window ? window : null, [ '_currentSiteType' ], null ) === 'simple'
	);
}
