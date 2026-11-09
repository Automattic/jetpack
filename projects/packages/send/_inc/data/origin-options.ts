import apiFetch from '@wordpress/api-fetch';
import type { LogOrigin } from './types';
import type { Option } from '@wordpress/dataviews';

let originOptions: Promise< Option[] > | null = null;

/**
 * The Source filter's options, loaded once per page: DataViews' `getElements` needs the same
 * function and answer on every render. `forgetOriginOptions()` loads them again.
 *
 * @return Options, value the origin key.
 */
export function getOriginOptions(): Promise< Option[] > {
	if ( ! originOptions ) {
		const request = apiFetch< LogOrigin[] >( { path: '/jetpack-send/v1/log/origins' } ).then(
			origins => origins.map( ( { key, label } ) => ( { value: key, label } ) )
		);
		// A failed load isn't kept, so the next call tries again.
		request.catch( () => {
			if ( originOptions === request ) {
				originOptions = null;
			}
		} );
		originOptions = request;
	}
	return originOptions;
}

/**
 * Drop the Source filter's options, e.g. after an email is logged or deleted.
 */
export function forgetOriginOptions(): void {
	originOptions = null;
}
