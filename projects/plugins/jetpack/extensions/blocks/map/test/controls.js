import { render, screen } from '@testing-library/react';
import MapControls from '../controls';

// Mock `useSetting` from `@wordpress/block-editor` to override a setting.
// This approach was recommended at p1667855007139489-slack-C45SNKV4Z
jest.mock( '@wordpress/block-editor/build/components/use-setting', () => {
	const { default: useSetting } = jest.requireActual(
		'@wordpress/block-editor/build/components/use-setting'
	);
	const settings = {
		'color.defaultGradients': true,
		'color.defaultPalette': true,
	};
	const aliases = {
		'color.palette.default': 'color.palette',
		'color.gradients.default': 'color.gradients',
	};
	return path => {
		let ret = settings.hasOwnProperty( path ) ? settings[ path ] : useSetting( path );
		if ( ret === undefined && aliases.hasOwnProperty( path ) ) {
			ret = useSetting( aliases[ path ] );
		}
		return ret;
	};
} );

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
	mapProvider: 'mapbox',
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

		test( 'street names toggle shows correctly when mapProvider is mapbox', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Show street names' ) ).toBeInTheDocument();
		} );

		test( "street names toggle shows doesn't show when mapProvider is mapkit", () => {
			const props = { ...defaultProps, mapProvider: 'mapkit' };

			render( <MapControls { ...props } /> );

			expect( screen.queryByText( 'Show street names' ) ).not.toBeInTheDocument();
		} );

		test( 'scroll to zoom toggle shows correctly when mapProvider is mapbox', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Scroll to zoom' ) ).toBeInTheDocument();
		} );

		test( 'scroll to zoom toggle  shows correctly when mapProvider when mapProvider is mapkit', () => {
			const props = { ...defaultProps, mapProvider: 'mapkit' };

			render( <MapControls { ...props } /> );

			expect( screen.getByText( 'Scroll to zoom' ) ).toBeInTheDocument();
		} );

		test( 'show fullscreen button toggle shows correctly when mapProvider is mapbox', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Show Fullscreen Button' ) ).toBeInTheDocument();
		} );

		test( 'show fullscreen button toggle shows correctly', () => {
			const props = { ...defaultProps, mapProvider: 'mapkit' };

			render( <MapControls { ...props } /> );

			expect( screen.queryByText( 'Show Fullscreen Button' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Mapbox access token panel', () => {
		test( 'mapbox access token input shows correctly when mapProvider is mapbox', () => {
			render( <MapControls { ...defaultProps } /> );
			expect( screen.getByText( 'Mapbox Access Token' ) ).toBeInTheDocument();
		} );

		test( "mapbox access token input doesn't show when mapProvider is mapkit", () => {
			const props = { ...defaultProps, mapProvider: 'mapkit' };
			render( <MapControls { ...props } /> );
			expect( screen.queryByText( 'Mapbox Access Token' ) ).not.toBeInTheDocument();
		} );
	} );
} );
