/**
 * External Dependencies
 */
import { get } from 'lodash';

export default function isWpcomSite() {
	return (
		'object' === typeof window ? window._currentSiteType === 'simple' : false
	);
}
