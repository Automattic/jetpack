/**
 * Internal dependencies
 */
import config from '../stores/config';

export function jetpackURL( url ) {
	if ( config.site.url ) {
		url = url + '&site=' + encodeURIComponent( config.site.url );
	}
	return url;
}
