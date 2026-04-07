/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock React Router
await jest.unstable_mockModule( 'react-router', () => ( {
	useSearchParams: () => [ new URLSearchParams(), jest.fn() ],
} ) );

// Mock WordPress dependencies
await jest.unstable_mockModule( '@wordpress/components', () => ( {
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

await jest.unstable_mockModule( '@wordpress/icons', () => ( {
	trash: 'trash-icon-mock',
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	useEntityRecords: jest.fn(),
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: jest.fn( req => {
		if ( req.path && req.path.includes( '/wp/v2/feedback/counts' ) ) {
			return Promise.resolve( { inbox: 0, spam: 0, trash: 1 } );
		}
		return Promise.resolve( { deleted: 1 } );
	} ),
} ) );

await jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	default: {
		tracks: {
			recordEvent: jest.fn(),
		},
	},
} ) );

// Mock the dashboard store
await jest.unstable_mockModule( '../../../../../src/dashboard/store', () => ( {
	store: 'dashboard',
} ) );

// Import actual lodash and re-export it - needed for use-inbox-data hook
const actualLodash = await import( 'lodash' );
await jest.unstable_mockModule( 'lodash', () => ( {
	...( actualLodash.default || actualLodash ),
} ) );

// Mock WordPress data
await jest.unstable_mockModule( '@wordpress/data', () => {
	const mockDispatch = {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
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
		getCounts: jest.fn().mockReturnValue( { inbox: 0, spam: 0, trash: 1 } ),
		getInboxCount: jest.fn().mockReturnValue( 0 ),
		getSpamCount: jest.fn().mockReturnValue( 0 ),
		getTrashCount: jest.fn().mockReturnValue( 1 ),
		getInvalidRecords: jest.fn().mockReturnValue( new Set() ),
		hasPendingActions: jest.fn().mockReturnValue( false ),
	};

	return {
		useDispatch: jest.fn( store => {
			if ( store === 'notices' ) {
				return mockDispatch;
			}
			if ( store === 'core' ) {
				return {
					invalidateResolutionForStoreSelector: jest.fn(),
				};
			}
			if ( store === 'dashboard' ) {
				return {
					setCounts: mockDispatch.setCounts,
					setCurrentQuery: mockDispatch.setCurrentQuery,
					setSelectedResponses: mockDispatch.setSelectedResponses,
					invalidateCounts: mockDispatch.invalidateCounts,
					markRecordsAsInvalid: jest.fn(),
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

// Dynamically import the component after mocks are set up
const EmptyTrashButtonModule = await import(
	'../../../../../src/dashboard/components/empty-trash-button'
);
const EmptyTrashButton = EmptyTrashButtonModule.default;

const DashboardSearchParamsModule = await import(
	'../../../../../src/dashboard/router/dashboard-search-params-context'
);
const { DashboardSearchParamsProvider } = DashboardSearchParamsModule;

describe( 'EmptyTrashButton', () => {
	const mockSetSearchParams = jest.fn();
	const mockSearchParams = new URLSearchParams( 'status=trash' );

	beforeEach( async () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		mockSetSearchParams.mockClear();
		const coreDataModule = await import( '@wordpress/core-data' );
		coreDataModule.useEntityRecords.mockReturnValue( {
			totalItems: 1,
			isResolving: false,
		} );
	} );

	const renderWithProvider = component => {
		return render(
			<DashboardSearchParamsProvider value={ [ mockSearchParams, mockSetSearchParams ] }>
				{ component }
			</DashboardSearchParamsProvider>
		);
	};

	it( 'renders correctly', () => {
		renderWithProvider( <EmptyTrashButton totalItemsTrash={ 1 } /> );

		const button = screen.getByText( 'Empty trash' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveAttribute( 'type', 'button' );
		expect( button ).toBeEnabled();
	} );

	it( 'shows disabled state when trash is empty', () => {
		renderWithProvider( <EmptyTrashButton totalItemsTrash={ 0 } /> );

		const button = screen.getByText( 'Empty trash' );
		expect( button ).toBeDisabled();
		expect( button ).toHaveAttribute( 'aria-label', 'Trash is already empty.' );
	} );

	it( 'shows confirmation dialog when clicked', async () => {
		renderWithProvider( <EmptyTrashButton totalItemsTrash={ 1 } /> );

		const button = screen.getByText( 'Empty trash' );
		await userEvent.click( button );

		const dialog = screen.getByTestId( 'confirm-dialog' );
		expect( dialog ).toBeInTheDocument();
		expect( screen.getByText( 'Delete forever' ) ).toBeInTheDocument();
	} );

	it( 'empties trash when confirmed', async () => {
		const { default: apiFetch } = await import( '@wordpress/api-fetch' );
		const { useDispatch } = await import( '@wordpress/data' );
		const mockDispatch = useDispatch( 'notices' );

		renderWithProvider( <EmptyTrashButton totalItemsTrash={ 1 } /> );

		// Click empty trash button
		const button = screen.getByText( 'Empty trash' );
		await userEvent.click( button );

		// Click confirm button
		const confirmButton = screen.getByText( 'Delete' );
		await userEvent.click( confirmButton );

		// Verify API call
		expect( apiFetch ).toHaveBeenCalledWith( {
			method: 'DELETE',
			path: '/wp/v2/feedback/trash',
		} );

		// Verify success notice
		expect( mockDispatch.createSuccessNotice ).toHaveBeenCalledWith(
			'Response deleted permanently.',
			{ type: 'snackbar', id: 'empty-trash' }
		);
	} );
} );
