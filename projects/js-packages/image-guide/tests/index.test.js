import { MeasurableImage } from '../src/MeasurableImage';

describe( 'MeasurableImage', () => {
	it( 'returns a class', () => {
		expect( MeasurableImage ).toBeInstanceOf( Function );
		expect( MeasurableImage.constructor ).toBeInstanceOf( Function );
	} );
} );
