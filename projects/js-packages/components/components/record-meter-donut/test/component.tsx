import { render, screen } from '@testing-library/react';
import DonutMeter, { DonutMeterProps } from '../index';

describe( 'DonutMeter', () => {
	const testProps: DonutMeterProps = {
		segmentCount: 18,
		totalCount: 100,
	};

	it( 'renders the donut svg', () => {
		render( <DonutMeter { ...testProps } /> );
		expect( screen.getByTestId( 'donut-meter_svg' ) ).toBeInTheDocument();
	} );
} );
