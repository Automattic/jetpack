/**
 * External dependencies
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * What the surface a widget or table is rendering on offers.
 */
export type ReportScope = {
	offersComparison: boolean;
};

// Undeclared hosts keep the comparison behavior they had before report scopes.
const DEFAULT_REPORT_SCOPE: ReportScope = { offersComparison: true };

const ReportScopeContext = createContext< ReportScope >( DEFAULT_REPORT_SCOPE );

/**
 * Declare what the surface below offers.
 *
 * @param props                  - Provider props.
 * @param props.offersComparison - Whether this surface offers the date comparison.
 * @param props.children         - The surface's tree.
 * @return The provider.
 */
export function ReportScopeProvider( {
	offersComparison,
	children,
}: {
	offersComparison: boolean;
	children: ReactNode;
} ) {
	const value = useMemo( () => ( { offersComparison } ), [ offersComparison ] );

	return <ReportScopeContext.Provider value={ value }>{ children }</ReportScopeContext.Provider>;
}

/**
 * Read what the nearest surface offers.
 *
 * @return The nearest declared scope, or the compatibility default.
 */
export function useReportScope(): ReportScope {
	return useContext( ReportScopeContext );
}
