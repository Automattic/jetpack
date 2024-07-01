import { stripCacheParams } from '$features/critical-css/error-description/error-description';
import { FormattedURL } from '$features/critical-css/error-description/types';
import { ErrorSet } from '$features/critical-css/lib/critical-css-errors';

function formatErrorSetUrls( errorSet: ErrorSet ): FormattedURL[] {
	return Object.entries( errorSet.byUrl ).map( ( [ url, error ] ) => {
		let href = url;
		if ( error.meta.url && typeof error.meta.url === 'string' ) {
			href = error.meta.url;
		}
		return {
			href,
			label: stripCacheParams( url ),
		};
	} );
}

export default formatErrorSetUrls;
