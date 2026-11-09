import { render, screen } from '@testing-library/react';
import { Component } from 'react';
import { reportError } from '../report-error';
import { StatsErrorBoundary } from '../stats-error-boundary';
import type { ReactNode } from 'react';

jest.mock( '../report-error' );

class OuterBoundary extends Component<
	{ children: ReactNode; onCatch: ( error: unknown ) => void; empty?: boolean },
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
		if ( ! this.state.failed ) {
			return this.props.children;
		}
		return this.props.empty ? null : <p data-testid="outer-fallback">fallback</p>;
	}
}

const Thrower = ( { error }: { error: Error } ): never => {
	throw error;
};

describe( 'StatsErrorBoundary', () => {
	let consoleError: jest.SpyInstance;

	beforeEach( () => {
		consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => undefined );
		( reportError as jest.Mock ).mockClear();
	} );

	afterEach( () => {
		consoleError.mockRestore();
	} );

	it( 'reports the error once with source boundary and the component stack', () => {
		const error = new Error( 'boom' );
		render(
			<OuterBoundary onCatch={ jest.fn() }>
				<StatsErrorBoundary>
					<Thrower error={ error } />
				</StatsErrorBoundary>
			</OuterBoundary>
		);

		expect( reportError ).toHaveBeenCalledTimes( 1 );
		expect( reportError ).toHaveBeenCalledWith( error, 'boundary', {
			componentStack: expect.stringContaining( 'at StatsErrorBoundary' ),
		} );
	} );

	it( 'rethrows the original error object to the surrounding boundary', () => {
		const error = new Error( 'boom' );
		const onCatch = jest.fn();
		render(
			<OuterBoundary onCatch={ onCatch }>
				<StatsErrorBoundary>
					<Thrower error={ error } />
				</StatsErrorBoundary>
			</OuterBoundary>
		);

		expect( onCatch ).toHaveBeenCalledTimes( 1 );
		expect( onCatch.mock.calls[ 0 ][ 0 ] ).toBe( error );
		expect( screen.getByTestId( 'outer-fallback' ) ).toBeInTheDocument();
	} );

	it( 'renders its children unchanged when nothing throws', () => {
		render(
			<StatsErrorBoundary>
				<p data-testid="child">content</p>
			</StatsErrorBoundary>
		);

		expect( screen.getByTestId( 'child' ) ).toHaveTextContent( 'content' );
		expect( reportError ).not.toHaveBeenCalled();
	} );

	it( 'renders nothing of its own', () => {
		const onCatch = jest.fn();
		const { container } = render(
			<OuterBoundary onCatch={ onCatch } empty>
				<StatsErrorBoundary>
					<Thrower error={ new Error( 'boom' ) } />
				</StatsErrorBoundary>
			</OuterBoundary>
		);

		expect( onCatch ).toHaveBeenCalledTimes( 1 );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'reports once when the same child throws on a re-render', () => {
		const error = new Error( 'boom' );
		const tree = (
			<OuterBoundary onCatch={ jest.fn() }>
				<StatsErrorBoundary>
					<Thrower error={ error } />
				</StatsErrorBoundary>
			</OuterBoundary>
		);
		const { rerender } = render( tree );
		rerender( tree );

		expect( reportError ).toHaveBeenCalledTimes( 1 );
	} );
} );
