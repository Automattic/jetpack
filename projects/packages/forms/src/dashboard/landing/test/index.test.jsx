/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as ReactRouterDom from 'react-router-dom';
/**
 * Internal dependencies
 */
import * as configModule from '../../index';
import LandingPage from '../index';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: {
			recordEvent: jest.fn(),
		},
	},
} ) );

jest.mock( '../../index', () => ( {
	config: jest.fn(),
} ) );

jest.mock( 'react-router-dom', () => ( {
	...jest.requireActual( 'react-router-dom' ),
	useNavigate: jest.fn(),
} ) );

// Mock dependencies
describe( 'LandingPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'redirects to responses page when hasFeedback is true', () => {
		const mockNavigate = jest.fn();
		jest.spyOn( ReactRouterDom, 'useNavigate' ).mockImplementation( () => mockNavigate );

		configModule.config.mockImplementation( key => ( key === 'hasFeedback' ? true : null ) );

		render(
			<MemoryRouter
				future={ {
					v7_startTransition: true,
					v7_relativeSplatPath: true,
				} }
			>
				<LandingPage />
			</MemoryRouter>
		);

		expect( mockNavigate ).toHaveBeenCalledWith( '/responses' );
	} );

	it( 'does not redirect when hasFeedback is false', () => {
		const mockNavigate = jest.fn();
		jest.spyOn( ReactRouterDom, 'useNavigate' ).mockImplementation( () => mockNavigate );

		configModule.config.mockImplementation( key => ( key === 'hasFeedback' ? false : null ) );

		render(
			<MemoryRouter
				future={ {
					v7_startTransition: true,
					v7_relativeSplatPath: true,
				} }
			>
				<LandingPage />
			</MemoryRouter>
		);

		expect( mockNavigate ).not.toHaveBeenCalled();
	} );
} );
