/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricWithComparison } from '../metric-with-comparison';

describe( 'MetricWithComparison', () => {
	it( 'shows the value and its delta', () => {
		render( <MetricWithComparison value={ 120 } previousValue={ 100 } /> );

		expect( screen.getByText( '120' ) ).toBeInTheDocument();
		expect( screen.getByText( '+20%' ) ).toBeInTheDocument();
	} );

	it( 'keeps a real zero as a value with a delta', () => {
		render( <MetricWithComparison value={ 0 } previousValue={ 100 } /> );

		expect( screen.getByText( '0' ) ).toBeInTheDocument();
		expect( screen.getByText( '-100%' ) ).toBeInTheDocument();
	} );

	it( 'reads an unknown value as a dash and shows no delta', () => {
		render( <MetricWithComparison value={ null } previousValue={ 100 } /> );

		expect( screen.getByText( '—' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( 'No data' ) ).toBeInTheDocument();
		expect( screen.queryByText( '-100%' ) ).not.toBeInTheDocument();
	} );
} );
