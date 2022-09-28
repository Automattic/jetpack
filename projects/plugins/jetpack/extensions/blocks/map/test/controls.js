import { render, screen } from '@testing-library/react';
import MapControls from '../controls';

const API_STATE_SUCCESS = 2;
const setAttributes = jest.fn();

const defaultProps = {
	attributes: {
		points: [],
		mapDetails: true,
		zoom: 13,
		mapHeight: 300,
	},
	setAttributes,
	clientId: 1,
	state: {
		apiState: API_STATE_SUCCESS,
		apiKeySource: 'site',
		apiKeyControl: '',
		apiKey: 'test-api-key',
		apiRequestOutstanding: false,
	},
	setState: jest.fn(),
};

describe( 'Inspector controls', () => {
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	describe( 'Colors settings panel', () => {
		test( 'displays marker colors correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Marker Color' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Map settings panel', () => {
		test( 'height input shows correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Height in pixels' ) ).toBeInTheDocument();
		} );

		test( 'zoom level shows correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Zoom level' ) ).toBeInTheDocument();
		} );

		test( 'street names toggle shows correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Show street names' ) ).toBeInTheDocument();
		} );

		test( 'scroll to zoom toggle shows correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Scroll to zoom' ) ).toBeInTheDocument();
		} );

		test( 'show fullscreen button toggle shows correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Show Fullscreen Button' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Mapbox access token panel', () => {
		test( 'mapbox access token input shows correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Mapbox Access Token' ) ).toBeInTheDocument();
		} );
	} );
} );
