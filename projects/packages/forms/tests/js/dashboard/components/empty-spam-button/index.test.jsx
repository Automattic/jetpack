/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import EmptySpamButton from '../../../../../src/dashboard/components/empty-spam-button';

// Mock React Router
jest.mock( 'react-router', () => ( {
	useSearchParams: () => [ new URLSearchParams(), jest.fn() ],
} ) );

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
	__experimentalConfirmDialog: ( { children, onCancel, onConfirm, isOpen, confirmButtonText } ) =>
		isOpen ? (
			<div data-testid="confirm-dialog">
				{ children }
				<button onClick={ onCancel }>Cancel</button>
				<button onClick={ onConfirm }>{ confirmButtonText }</button>
			</div>
		) : null,
} ) );

jest.mock( '@wordpress/icons', () => ( {
	trash: 'trash-icon-mock',
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	useEntityRecords: jest.fn(),
	store: 'core',
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

jest.mock( '@wordpress/api-fetch', () =>
	jest.fn( req => {
		if ( req.path && req.path.includes( '/wp/v2/feedback/counts' ) ) {
			return Promise.resolve( { inbox: 0, spam: 1, trash: 0 } );
		}
		return Promise.resolve( { deleted: 1 } );
	} )
);

jest.mock( '@automattic/jetpack-analytics', () => ( {
	tracks: {
		recordEvent: jest.fn(),
	},
} ) );

// Mock the dashboard store
jest.mock( '../../../../../src/dashboard/store', () => ( {
	store: 'dashboard',
} ) );

// Mock WordPress data
jest.mock( '@wordpress/data', () => {
	const mockDispatch = {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		invalidateResolution: jest.fn(),
		setCounts: jest.fn(),
		setCurrentQuery: jest.fn(),
		setSelectedResponses: jest.fn(),
		invalidateCounts: jest.fn(),
	};

	const mockSelect = {
		getSelectedResponsesCount: jest.fn().mockReturnValue( 0 ),
		getCurrentStatus: jest.fn().mockReturnValue( 'trash' ),
		getCurrentQuery: jest.fn().mockReturnValue( {} ),
		getFilters: jest.fn().mockReturnValue( {} ),
		getCounts: jest.fn().mockReturnValue( { inbox: 0, spam: 1, trash: 0 } ),
		getInboxCount: jest.fn().mockReturnValue( 0 ),
		getSpamCount: jest.fn().mockReturnValue( 1 ),
		getTrashCount: jest.fn().mockReturnValue( 0 ),
	};

	return {
		useDispatch: jest.fn( store => {
			if ( store === 'notices' ) {
				return mockDispatch;
			}
			if ( store === 'core' ) {
				return { invalidateResolution: mockDispatch.invalidateResolution };
			}
			if ( store === 'dashboard' ) {
				return {
					setCounts: mockDispatch.setCounts,
					setCurrentQuery: mockDispatch.setCurrentQuery,
					setSelectedResponses: mockDispatch.setSelectedResponses,
					invalidateCounts: mockDispatch.invalidateCounts,
				};
			}
			return {};
		} ),
		useSelect: jest.fn( callback => callback( () => mockSelect ) ),
		store: {
			noticesStore: 'notices',
		},
	};
} );

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

describe( 'EmptySpamButton', () => {
	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		require( '@wordpress/core-data' ).useEntityRecords.mockReturnValue( {
			totalItems: 1,
			isResolving: false,
		} );
	} );

	it( 'renders correctly', () => {
		render( <EmptySpamButton totalItemsSpam={ 1 } isLoadingCounts={ false } /> );

		const button = screen.getByText( 'Delete spam' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveAttribute( 'type', 'button' );
		expect( button ).toBeEnabled();
	} );

	it( 'shows disabled state when trash is empty', () => {
		render( <EmptySpamButton totalItemsSpam={ 0 } isLoadingCounts={ false } /> );

		const button = screen.getByText( 'Delete spam' );
		expect( button ).toBeDisabled();
		expect( button ).toHaveAttribute( 'aria-label', 'Spam is already empty.' );
	} );

	it( 'shows confirmation dialog when clicked', async () => {
		render( <EmptySpamButton totalItemsSpam={ 1 } isLoadingCounts={ false } /> );

		const button = screen.getByText( 'Delete spam' );
		await userEvent.click( button );

		const dialog = screen.getByTestId( 'confirm-dialog' );
		expect( dialog ).toBeInTheDocument();
		expect( screen.getByText( 'Delete forever' ) ).toBeInTheDocument();
	} );

	it( 'empties trash when confirmed', async () => {
		const apiFetch = require( '@wordpress/api-fetch' );
		const { useDispatch } = require( '@wordpress/data' );
		const mockDispatch = useDispatch( 'notices' );

		render( <EmptySpamButton totalItemsSpam={ 1 } isLoadingCounts={ false } /> );

		// Click empty trash button
		const button = screen.getByText( 'Delete spam' );
		await userEvent.click( button );

		// Click confirm button
		const confirmButton = screen.getByText( 'Delete' );
		await userEvent.click( confirmButton );

		// Verify API call
		expect( apiFetch ).toHaveBeenCalledWith( {
			method: 'DELETE',
			path: '/wp/v2/feedback/trash?status=spam',
		} );

		// Verify success notice
		expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith(
			'Response deleted permanently.',
			{ type: 'snackbar', id: 'empty-spam' }
		);
	} );
} );
