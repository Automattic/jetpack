import { render, screen } from '@testing-library/react';
import { ModernizationProvider, useIsModernized } from '..';

/**
 * Renders the resolved value of `useIsModernized()` as text for assertions.
 *
 * @return A span containing "true" or "false".
 */
function Probe() {
	return <span>{ useIsModernized() ? 'true' : 'false' }</span>;
}

describe( 'useIsModernized', () => {
	test( 'defaults to false with no provider (legacy / block editor)', () => {
		render( <Probe /> );
		expect( screen.getByText( 'false' ) ).toBeInTheDocument();
	} );

	test( 'is true inside a ModernizationProvider (chassis)', () => {
		render(
			<ModernizationProvider>
				<Probe />
			</ModernizationProvider>
		);
		expect( screen.getByText( 'true' ) ).toBeInTheDocument();
	} );
} );
