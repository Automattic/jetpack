/**
 * External dependencies
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * What the surface a widget or table is rendering on offers.
 *
 * The date params are one set of search params shared by every surface, so the
 * URL alone cannot say whether the surface the user is looking at has a control
 * for them. A surface declares that once here, and both halves derive from it:
 * whether the header renders the control, and whether the params reach the
 * things that fetch data.
 */
export type ReportScope = {
	offersComparison: boolean;
};

/**
 * Every surface offered the comparison before any of them declared otherwise,
 * so an undeclared tree keeps that behavior.
 */
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
 * Read what the surface offers.
 *
 * @return The nearest declared scope, or the default when nothing declared one.
 */
export function useReportScope(): ReportScope {
	return useContext( ReportScopeContext );
}
