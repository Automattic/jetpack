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

let mockChartsProviderError: Error | null = null;

jest.mock( '../../charts-provider', () => ( {
	ChartsProvider: ( { children }: { children: ReactNode } ) => {
		if ( mockChartsProviderError ) {
			throw mockChartsProviderError;
		}
		return children;
	},
} ) );

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
	beforeEach( () => {
		( reportError as jest.Mock ).mockClear();
		mockChartsProviderError = null;
	} );

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

	it( 'reports a crash in a provider it wraps', () => {
		const error = new Error( 'provider boom' );
		const onCatch = jest.fn();
		setMockRouteSearch();
		mockChartsProviderError = error;

		render(
			<TestBoundary onCatch={ onCatch }>
				<WidgetRoot>
					<p>child</p>
				</WidgetRoot>
			</TestBoundary>
		);

		expect( reportError ).toHaveBeenCalledTimes( 1 );
		expect( reportError ).toHaveBeenCalledWith( error, 'boundary', expect.anything() );
		expect( onCatch.mock.calls[ 0 ][ 0 ] ).toBe( error );
		expect( console ).toHaveErrored();
	} );
} );
