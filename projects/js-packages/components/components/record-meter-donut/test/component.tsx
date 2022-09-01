import { render, screen } from '@testing-library/react';
import RecordMeterDonut, { RecordMeterDonutProps } from '../index';

describe( 'RecordMeterDonut', () => {
	const testProps: RecordMeterDonutProps = {
		segmentCount: 18,
		totalCount: 100,
	};

	it( 'renders the donut svg', () => {
		render( <RecordMeterDonut { ...testProps } /> );
		expect( screen.getByTestId( 'record-meter-donut_svg' ) ).toBeInTheDocument();
	} );
} );
