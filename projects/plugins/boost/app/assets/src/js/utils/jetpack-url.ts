import { get } from 'svelte/store';
import config from '../stores/config';

export function jetpackURL( url ) {
	const siteUrl = get( config ).site.url;

	if ( siteUrl ) {
		url = url + '&site=' + encodeURIComponent( siteUrl );
	}
	return url;
}
