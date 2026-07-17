/**
 * External dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useSearch, useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import {
	DashboardSearchParamsProvider,
	type DashboardSearchParamsTuple,
	type SetDashboardSearchParams,
} from './dashboard-search-params-context';
/**
 * Types
 */
import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren< {
	/**
	 * Route id to bind `useSearch` / `useNavigate` to.
	 *
	 * Required because ciab-admin doesn't provide a
	 * "nearest match" for `useSearch()` to infer.
	 */
	from: string;
} >;

/**
 * Convert `@wordpress/route` `search` record shape into `URLSearchParams`.
 *
 * @param search - Search record to convert.
 * @return       - URL search params.
 */
function searchRecordToUrlSearchParams( search: Record< string, unknown > ): URLSearchParams {
	const params = new URLSearchParams();

	for ( const [ key, value ] of Object.entries( search || {} ) ) {
		if ( value === undefined || value === null ) {
			continue;
		}

		if ( Array.isArray( value ) ) {
			for ( const v of value ) {
				if ( v === undefined || v === null ) {
					continue;
				}

				params.append( key, String( v ) );
			}

			continue;
		}

		params.set( key, String( value ) );
	}

	return params;
}

/**
 * Convert `URLSearchParams` into the router `search` record shape.
 *
 * Note: some keys (e.g. `responseIds`) are treated as arrays even when only one value is present.
 *
 * @param params            - URL search params to convert.
 * @param options           - Options.
 * @param options.arrayKeys - Keys that should always be represented as arrays.
 * @return                  - Record suitable for `@wordpress/route` `search`.
 */
function urlSearchParamsToSearchRecord(
	params: URLSearchParams,
	options: {
		/**
		 * Keys that should always be represented as arrays.
		 * For example: `responseIds` is treated as `string[]` by routes that use selection.
		 */
		arrayKeys?: ReadonlySet< string >;
	} = {}
): Record< string, string | string[] > {
	const { arrayKeys = new Set< string >() } = options;
	const out: Record< string, string | string[] > = {};

	for ( const key of params.keys() ) {
		const values = params.getAll( key );

		if ( values.length < 1 ) {
			continue;
		}

		if ( arrayKeys.has( key ) ) {
			out[ key ] = values;
			continue;
		}

		// For non-array keys, always coerce to a scalar string.
		// If multiple values exist for a key, preserve the last one.
		out[ key ] = values[ values.length - 1 ];
	}

	return out;
}

/**
 * Provider for the dashboard search params.
 *
 * @param props          - Props.
 * @param props.from     - Route id to bind `useSearch` / `useNavigate` to.
 * @param props.children - Children.
 * @return               - JSX element.
 */
export default function WpRouteDashboardSearchParamsProvider( {
	from,
	children,
}: Props ): JSX.Element {
	// `useSearch()` re-renders when the router search changes. We'll adapt it to URLSearchParams
	// so shared dashboard code can keep using the URLSearchParams API.
	const search = useSearch( {
		// In this build, the router type isn't registered, so `@wordpress/route` models `from` as `never`.
		// We still want to pass the runtime route id through.
		from: from as unknown as never,
		strict: false,
	} );
	const navigate = useNavigate();
	const searchParams = useMemo( () => searchRecordToUrlSearchParams( search ), [ search ] );

	const setSearchParams: SetDashboardSearchParams = useCallback(
		next => {
			const resolved = typeof next === 'function' ? next( searchParams ) : next;
			const nextSearch = urlSearchParamsToSearchRecord( resolved, {
				arrayKeys: new Set( [ 'responseIds' ] ),
			} );

			type NavigateArg = Parameters< typeof navigate >[ 0 ];
			type SearchOption = NavigateArg extends { search?: infer S } ? S : never;
			type SearchReducer = Exclude< SearchOption, true | undefined >;

			// In `@wordpress/route`, `search` is modeled as a reducer function, but without a registered
			// router type it ends up as a very "loose" signature. We still pass a fully-formed object.
			const replaceSearch = ( () => nextSearch ) as unknown as SearchReducer;

			navigate( { search: replaceSearch } );
		},
		[ navigate, searchParams ]
	);

	const value = useMemo(
		() => [ searchParams, setSearchParams ] as DashboardSearchParamsTuple,
		[ searchParams, setSearchParams ]
	);

	return (
		<DashboardSearchParamsProvider value={ value }>{ children }</DashboardSearchParamsProvider>
	);
}
