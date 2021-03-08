/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
//import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MapControls from '../controls';

const API_STATE_SUCCESS = 2;

describe( 'Inspector controls', () => {
	const defaultAttributes = {
		points: [],
		mapDetails: true,
		zoom: 13,
		mapHeight: 300,
	};
	const setAttributes = jest.fn();

	const defaultProps = {
		// 👀 Setup default block props.
		attributes: defaultAttributes,
		setAttributes: jest.fn(),
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

	// 👀 Tests setup.
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	describe( 'Colors settings panel', () => {
		test( 'displays marker colors correctly', () => {
			render( <MapControls { ...defaultProps } /> );

			expect( screen.getByText( 'Marker Color' ) ).toBeInTheDocument();
		} );
	} );

} );
