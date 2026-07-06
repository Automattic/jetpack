/**
 * External dependencies
 */
import { globalErrorManager, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { act, fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportWidget } from '../report-widget';
import type { ReactElement } from 'react';

const baseReport = { isLoading: false, isFetching: false, isError: false, error: null };

// `useGlobalError` warns when called outside `GlobalErrorProvider` (see
// `packages/data/src/providers/global-error-context.tsx`); in product every
// `ReportWidget` is mounted under the dashboard's page-level provider, so tests
// wrap the same way rather than relying on the hook's outside-provider default.
function renderWithProvider( ui: ReactElement ) {
	return render( <GlobalErrorProvider>{ ui }</GlobalErrorProvider> );
}

describe( 'ReportWidget', () => {
	// A page-level global error is process-wide state on `globalErrorManager`;
	// clear it after every test so it never leaks into the next one. Wrapped in
	// `act` because a mounted provider re-renders in response to the change.
	afterEach( () => {
		act( () => {
			globalErrorManager.clearError();
		} );
	} );

	it( 'renders rows via the child render prop when ready', () => {
		renderWithProvider(
			<ReportWidget report={ baseReport } rows={ [ 'a', 'b' ] }>
				{ rows => <div>{ rows.join( ',' ) }</div> }
			</ReportWidget>
		);
		expect( screen.getByText( 'a,b' ) ).toBeInTheDocument();
	} );

	it( 'renders the empty state when there are no rows', () => {
		renderWithProvider(
			<ReportWidget report={ baseReport } rows={ [] } empty={ { description: 'Nothing.' } }>
				{ rows => <div>{ rows.length }</div> }
			</ReportWidget>
		);
		expect( screen.getByText( 'Nothing.' ) ).toBeInTheDocument();
	} );

	it( 'renders an error with a Retry action wired to report.refetch', () => {
		const refetch = jest.fn();
		renderWithProvider(
			<ReportWidget
				report={ { ...baseReport, isError: true, error: new Error( 'x' ), refetch } }
				rows={ [] }
			>
				{ () => <div>rows</div> }
			</ReportWidget>
		);
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'always renders the toolbar, even in a non-ready state', () => {
		renderWithProvider(
			<ReportWidget
				report={ { ...baseReport, isError: true, error: new Error( 'x' ) } }
				rows={ [] }
				toolbar={ <div>toolbar</div> }
			>
				{ () => <div>rows</div> }
			</ReportWidget>
		);
		expect( screen.getByText( 'toolbar' ) ).toBeInTheDocument();
	} );

	it( 'mutes the widget into the error state when there is a page-level global error', () => {
		renderWithProvider(
			<ReportWidget report={ baseReport } rows={ [ 'a', 'b' ] }>
				{ rows => <div>{ rows.join( ',' ) }</div> }
			</ReportWidget>
		);
		// Children render while there is no global error…
		expect( screen.getByText( 'a,b' ) ).toBeInTheDocument();
		// …then a page-level global error mutes the widget into the error state.
		act( () => {
			globalErrorManager.setError( 'network' );
		} );
		// `isGlobalError` forces the error state, so the success children are gone…
		expect( screen.queryByText( 'a,b' ) ).not.toBeInTheDocument();
		// …and the descriptor is muted: empty description, no Retry action.
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
