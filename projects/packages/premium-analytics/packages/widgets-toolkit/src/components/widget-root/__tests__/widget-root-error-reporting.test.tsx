import { render } from '@testing-library/react';
import { Component } from 'react';
import { setMockRouteSearch } from '../../../../../../tests/js/route-test-utils';
import { reportError } from '../../../../../error-reporting/src/report-error';
import { WidgetRoot } from '../widget-root';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual(
		'../../../../../../tests/js/route-test-utils'
	);

	return mockWordPressRoute;
} );
jest.mock( '../../../../../error-reporting/src/report-error' );

class TestBoundary extends Component<
	{ children: ReactNode; onCatch: ( error: unknown ) => void },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch( error: unknown ) {
		this.props.onCatch( error );
	}

	render() {
		return this.state.failed ? null : this.props.children;
	}
}

const Thrower = ( { error }: { error: Error } ): never => {
	throw error;
};

describe( 'WidgetRoot error reporting', () => {
	it( 'reports a crashing child once and lets it reach the surrounding boundary', () => {
		const error = new Error( 'boom' );
		const onCatch = jest.fn();
		setMockRouteSearch();

		render(
			<TestBoundary onCatch={ onCatch }>
				<WidgetRoot>
					<Thrower error={ error } />
				</WidgetRoot>
			</TestBoundary>
		);

		expect( reportError ).toHaveBeenCalledTimes( 1 );
		expect( reportError ).toHaveBeenCalledWith( error, 'boundary', expect.anything() );
		expect( onCatch.mock.calls[ 0 ][ 0 ] ).toBe( error );
		expect( console ).toHaveErrored();
	} );
} );
