/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSearchParams as useReactRouterSearchParams } from 'react-router';
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

/**
 * React Router implementation of the dashboard search params provider.
 *
 * @param props          - Props.
 * @param props.children - Children.
 * @return               - JSX element.
 */
export default function ReactRouterDashboardSearchParamsProvider( {
	children,
}: PropsWithChildren ): JSX.Element {
	const [ searchParams, setReactRouterSearchParams ] = useReactRouterSearchParams();

	const setSearchParams = setReactRouterSearchParams as unknown as SetDashboardSearchParams;

	const value = useMemo(
		() => [ searchParams, setSearchParams ] as DashboardSearchParamsTuple,
		[ searchParams, setSearchParams ]
	);

	return (
		<DashboardSearchParamsProvider value={ value }>{ children }</DashboardSearchParamsProvider>
	);
}
