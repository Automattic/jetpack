/**
 * External dependencies
 */
import { createContext, useContext } from '@wordpress/element';
/**
 * Types
 */
import type { PropsWithChildren } from 'react';

export type SetDashboardSearchParams = (
	next: URLSearchParams | ( ( prev: URLSearchParams ) => URLSearchParams )
) => void;

export type DashboardSearchParamsTuple = readonly [ URLSearchParams, SetDashboardSearchParams ];

const DashboardSearchParamsContext = createContext< DashboardSearchParamsTuple | null >( null );

/**
 * Dashboard search params provider.
 *
 * @param props          - Props.
 * @param props.value    - Dashboard search params tuple.
 * @param props.children - React children.
 * @return               - JSX element.
 */
export function DashboardSearchParamsProvider( {
	value,
	children,
}: PropsWithChildren< { value: DashboardSearchParamsTuple } > ): JSX.Element {
	return (
		<DashboardSearchParamsContext.Provider value={ value }>
			{ children }
		</DashboardSearchParamsContext.Provider>
	);
}

/**
 * Hook to get the dashboard search params.
 *
 * @return - Dashboard search params tuple.
 * @throws {Error} If the hook is used outside of a DashboardSearchParamsProvider.
 */
export function useDashboardSearchParams(): DashboardSearchParamsTuple {
	const ctx = useContext( DashboardSearchParamsContext );

	if ( ! ctx ) {
		throw new Error(
			'useDashboardSearchParams must be used within a DashboardSearchParamsProvider.'
		);
	}

	return ctx;
}
