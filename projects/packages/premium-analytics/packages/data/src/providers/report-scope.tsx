/**
 * External dependencies
 */
import { type DateRange } from '@jetpack-premium-analytics/datetime';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * What the surface a widget or table is rendering on offers.
 */
export type ReportScope = {
	offersComparison: boolean;

	/**
	 * Applies a range a widget computed as the surface's period, drawing the date
	 * control's attention to it. Absent where the host offers none.
	 */
	openPeriod?: ( range: Required< DateRange > ) => void;
};

// Undeclared hosts keep the comparison behavior they had before report scopes.
const DEFAULT_REPORT_SCOPE: ReportScope = { offersComparison: true };

const ReportScopeContext = createContext< ReportScope >( DEFAULT_REPORT_SCOPE );

/**
 * Declare what the surface below offers, over what an outer provider declared.
 *
 * @param props                  - Provider props.
 * @param props.offersComparison - Whether this surface offers the date comparison.
 * @param props.openPeriod       - How a widget sets this surface's period.
 * @param props.children         - The surface's tree.
 * @return The provider.
 */
export function ReportScopeProvider( {
	offersComparison,
	openPeriod,
	children,
}: Partial< ReportScope > & {
	children: ReactNode;
} ) {
	const inherited = useContext( ReportScopeContext );
	const value = useMemo(
		() => ( {
			...inherited,
			...( offersComparison !== undefined && { offersComparison } ),
			...( openPeriod && { openPeriod } ),
		} ),
		[ inherited, offersComparison, openPeriod ]
	);

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
