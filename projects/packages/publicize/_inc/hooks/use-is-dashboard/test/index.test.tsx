import { render, screen } from '@testing-library/react';
import { DashboardProvider, useIsDashboard } from '..';

/**
 * Renders the resolved value of `useIsDashboard()` as text for assertions.
 *
 * @return A span containing "true" or "false".
 */
function Probe() {
	return <span>{ useIsDashboard() ? 'true' : 'false' }</span>;
}

describe( 'useIsDashboard', () => {
	test( 'defaults to false with no provider (legacy / block editor)', () => {
		render( <Probe /> );
		expect( screen.getByText( 'false' ) ).toBeInTheDocument();
	} );

	test( 'is true inside a DashboardProvider (chassis)', () => {
		render(
			<DashboardProvider>
				<Probe />
			</DashboardProvider>
		);
		expect( screen.getByText( 'true' ) ).toBeInTheDocument();
	} );
} );
