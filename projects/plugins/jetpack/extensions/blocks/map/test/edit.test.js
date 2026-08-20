import { render, waitFor } from '@testing-library/react';
import { useBlockEditingMode } from '@wordpress/block-editor';
import MapEdit from '../edit';

// Mock apiFetch to prevent crashes, simulate a successful token fetch, and trigger API_STATE_SUCCESS
jest.mock( '@wordpress/api-fetch', () =>
	jest.fn( () =>
		Promise.resolve( {
			service_api_key: 'dummy-test-key',
			service_api_key_source: 'wpcom',
		} )
	)
);

// Mock getCoordinates to prevent unhandled promise rejections when geoCodeAddress runs
jest.mock( '../get-coordinates.js', () => ( {
	getCoordinates: jest.fn( () => Promise.resolve( { features: [] } ) ),
} ) );

// Mock the block-editor dependencies
jest.mock( '@wordpress/block-editor', () => {
	const actual = jest.requireActual( '@wordpress/block-editor' );
	return {
		...actual,
		useBlockEditingMode: jest.fn(),
	};
} );

describe( 'Map Block - edit', () => {
	const defaultProps = {
		attributes: {
			zoom: 10,
			points: [],
		},
		setAttributes: jest.fn(),
		isSelected: true,
		className: 'wp-block-jetpack-map',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should disable resize handles when blockEditingMode is contentOnly (Write Mode)', async () => {
		useBlockEditingMode.mockReturnValue( 'contentOnly' );

		const { container } = render( <MapEdit { ...defaultProps } /> );

		// Wait until the resizable container renders (verifying API_STATE_SUCCESS is reached)
		await waitFor( () => {
			// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
			const mapWrapper = container.querySelector( '.wp-block-jetpack-map__map_wrapper' );
			expect( mapWrapper ).not.toBeNull();
		} );

		// Verify the handle class is missing
		// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
		const resizeHandle = container.querySelector( '.components-resizable-box__handle' );
		expect( resizeHandle ).toBeNull();
	} );

	it( 'should show resize handles when blockEditingMode is default', async () => {
		useBlockEditingMode.mockReturnValue( 'default' );

		const { container } = render( <MapEdit { ...defaultProps } /> );

		// Wait for the resizable container wrapper to exist
		await waitFor( () => {
			// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
			const resizableContainer = container.querySelector( '.components-resizable-box__container' );
			expect( resizableContainer ).not.toBeNull();
		} );
	} );
} );
