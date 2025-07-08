/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
/**
 * Internal dependencies
 */
import EmptyTrashButton from '../../../../../src/dashboard/components/empty-trash-button';

// Mock WordPress dependencies
jest.mock( '@wordpress/components', () => ( {
	Button: props => {
		const { __next40pxDefaultSize, accessibleWhenDisabled, isBusy, showTooltip, ...buttonProps } =
			props;
		return (
			<button type="button" aria-label={ props.label } { ...buttonProps }>
				{ props.children }
			</button>
		);
	},
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	useEntityRecords: jest.fn(),
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	store: {
		noticesStore: 'notices',
	},
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => Promise.resolve( { deleted: 1 } ) ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	tracks: {
		recordEvent: jest.fn(),
	},
} ) );

// Mock the dashboard store
jest.mock( '../../../../../src/dashboard/store', () => ( {
	store: 'dashboard',
} ) );

// Disable console.error for specific known warnings
/* eslint-disable no-console */
const originalError = console.error;
beforeAll( () => {
	console.error = ( ...args ) => {
		if (
			typeof args[ 0 ] === 'string' &&
			( args[ 0 ].includes( 'React does not recognize the' ) ||
				args[ 0 ].includes( 'inside a test was not wrapped in act' ) )
		) {
			return;
		}
		originalError.call( console, ...args );
	};
} );

afterAll( () => {
	console.error = originalError;
} );
/* eslint-enable no-console */

describe( 'EmptyTrashButton', () => {
	const mockDispatch = {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		invalidateResolutionForStore: jest.fn(),
	};

	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		require( '@wordpress/data' ).dispatch.mockReturnValue( mockDispatch );
		require( '@wordpress/core-data' ).useEntityRecords.mockReturnValue( { totalItems: 1 } );
	} );

	it( 'renders correctly', () => {
		render( <EmptyTrashButton /> );

		const button = screen.getByText( 'Empty trash' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveAttribute( 'type', 'button' );
		expect( button ).toBeEnabled();
	} );

	it( 'shows disabled state when trash is empty', () => {
		require( '@wordpress/core-data' ).useEntityRecords.mockReturnValue( { totalItems: 0 } );
		render( <EmptyTrashButton /> );

		const button = screen.getByText( 'Empty trash' );
		expect( button ).toBeDisabled();
		expect( button ).toHaveAttribute( 'aria-label', 'Trash is already empty.' );
	} );

	it( 'shows loading state while emptying trash', async () => {
		render( <EmptyTrashButton /> );

		const button = screen.getByText( 'Empty trash' );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		expect( button ).toBeDisabled();

		// Wait for the API call to complete
		await expect( screen.findByText( 'Empty trash' ) ).resolves.toBeInTheDocument();

		expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith(
			'Response deleted permanently.',
			{ type: 'snackbar', id: 'empty-trash' }
		);
	} );
} );
