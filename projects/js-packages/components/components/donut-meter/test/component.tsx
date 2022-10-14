import { render, screen } from '@testing-library/react';
import DonutMeter, { DonutMeterProps } from '../index';

describe( 'DonutMeter', () => {
	const testProps: DonutMeterProps = {
		segmentCount: 18,
		totalCount: 100,
	};

	it( 'renders the donut meter container', () => {
		render( <DonutMeter { ...testProps } /> );
		expect( screen.getByTestId( 'donut-meter' ) ).toBeInTheDocument();
	} );

	it( 'renders with the correct type class name', () => {
		render( <DonutMeter { ...testProps } useAdaptiveColors type="warning" /> );
		expect( screen.getByTestId( 'donut-meter' ) ).toHaveClass( 'is-warning' );
	} );

	it( 'overrides adaptive colors when an explicit type is specified', () => {
		render( <DonutMeter { ...testProps } useAdaptiveColors type="danger" /> );
		expect( screen.getByTestId( 'donut-meter' ) ).toHaveClass( 'is-danger' );
	} );
} );
