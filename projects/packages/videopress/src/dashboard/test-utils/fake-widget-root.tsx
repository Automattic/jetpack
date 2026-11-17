/**
 * External dependencies
 */
import { createContext, useContext, type ReactNode } from 'react';

type ReportParams = Record< string, unknown >;

type FakeWidgetRootProps = {
	attributes?: { reportParams?: ReportParams };
	children: ReactNode;
};

/**
 * Stand-ins for the SDK's `WidgetRoot` and `useWidgetRootContext`, for use inside a `jest.mock` factory.
 *
 * @param getPageParams - Returns the page's report params, read at render time.
 * @return The two SDK members.
 */
export function fakeWidgetRoot( getPageParams: () => ReportParams ) {
	const RootContext = createContext< { reportParams: ReportParams } >( { reportParams: {} } );

	return {
		// Resolves like the real root: non-empty host `reportParams`, otherwise the page's params.
		WidgetRoot: ( { attributes, children }: FakeWidgetRootProps ) => {
			const hostParams = attributes?.reportParams;
			const reportParams =
				hostParams && Object.keys( hostParams ).length > 0 ? hostParams : getPageParams();

			return <RootContext.Provider value={ { reportParams } }>{ children }</RootContext.Provider>;
		},
		useWidgetRootContext: () => useContext( RootContext ),
	};
}
