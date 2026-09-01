/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

// Mock dependencies before importing
const mockUseInboxData = jest.fn();
const mockGetItemId = jest.fn();

await jest.unstable_mockModule( '../../../../src/dashboard/hooks/use-inbox-data', () => ( {
	default: mockUseInboxData,
} ) );

await jest.unstable_mockModule( '../../../../src/dashboard/inbox/utils', () => ( {
	getItemId: mockGetItemId,
} ) );

// Dynamically import all dependencies after mocks are set up
const useResponseNavigationModule = await import(
	'../../../../src/dashboard/hooks/use-response-navigation'
);
const useResponseNavigation = useResponseNavigationModule.default;

// Use the mock functions directly
const mockedUseInboxData = mockUseInboxData;
const mockedGetItemId = mockGetItemId;

describe( 'useResponseNavigation', () => {
	const mockSetRecord = jest.fn();
	const mockOnChangeSelection = jest.fn();

	// Mock response data
	const mockRecords = [
		{
			id: 1,
			status: 'publish',
			date: '2025-01-01T00:00:00',
			date_gmt: '2025-01-01T00:00:00',
			author_display_name: 'John Doe',
			author_name: 'John Doe',
			author_email: 'john@example.com',
			author_url: 'https://example.com',
			author_avatar: 'https://example.com/avatar.jpg',
			ip: '127.0.0.1',
			entry_title: 'Contact Form',
			entry_permalink: 'https://example.com/contact',
			has_file: false,
			is_unread: true,
			fields: { name: 'John', email: 'john@example.com' },
		},
		{
			id: 2,
			status: 'publish',
			date: '2025-01-02T00:00:00',
			date_gmt: '2025-01-02T00:00:00',
			author_display_name: 'Jane Smith',
			author_name: 'Jane Smith',
			author_email: 'jane@example.com',
			author_url: 'https://example.com',
			author_avatar: 'https://example.com/avatar2.jpg',
			ip: '127.0.0.2',
			entry_title: 'Contact Form',
			entry_permalink: 'https://example.com/contact',
			has_file: false,
			is_unread: true,
			fields: { name: 'Jane', email: 'jane@example.com' },
		},
		{
			id: 3,
			status: 'publish',
			date: '2025-01-03T00:00:00',
			date_gmt: '2025-01-03T00:00:00',
			author_display_name: 'Bob Johnson',
			author_name: 'Bob Johnson',
			author_email: 'bob@example.com',
			author_url: 'https://example.com',
			author_avatar: 'https://example.com/avatar3.jpg',
			ip: '127.0.0.3',
			entry_title: 'Contact Form',
			entry_permalink: 'https://example.com/contact',
			has_file: false,
			is_unread: false,
			fields: { name: 'Bob', email: 'bob@example.com' },
		},
	];

	beforeEach( () => {
		jest.clearAllMocks();

		// Setup default mock implementations
		mockedGetItemId.mockImplementation( item => item?.id?.toString() ?? '' );

		mockedUseInboxData.mockReturnValue( {
			records: mockRecords,
			totalItemsInbox: 3,
			totalItemsSpam: 0,
			totalItemsTrash: 0,
			isLoadingData: false,
			totalItems: 3,
			totalPages: 1,
			selectedResponsesCount: 0,
			setSelectedResponses: jest.fn(),
			statusFilter: 'draft,publish',
			currentStatus: 'inbox',
			currentQuery: {},
			setCurrentQuery: jest.fn(),
			filterOptions: {},
		} );
	} );

	describe( 'Navigation state', () => {
		it( 'should calculate correct currentIndex for first item', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( 0 );
			expect( result.current.hasNext ).toBe( true );
			expect( result.current.hasPrevious ).toBe( false );
		} );

		it( 'should calculate correct currentIndex for middle item', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 1 ],
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( 1 );
			expect( result.current.hasNext ).toBe( true );
			expect( result.current.hasPrevious ).toBe( true );
		} );

		it( 'should calculate correct currentIndex for last item', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 2 ],
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( 2 );
			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( true );
		} );

		it( 'should return -1 as currentIndex when record is not found', () => {
			const unknownRecord = {
				...mockRecords[ 0 ],
				id: 999,
			};

			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: unknownRecord,
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( -1 );
			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( false );
		} );

		it( 'should handle empty records array', () => {
			mockedUseInboxData.mockReturnValue( {
				records: [],
				totalItemsInbox: 0,
				totalItemsSpam: 0,
				totalItemsTrash: 0,
				isLoadingData: false,
				totalItems: 0,
				totalPages: 0,
				selectedResponsesCount: 0,
				setSelectedResponses: jest.fn(),
				statusFilter: 'draft,publish',
				currentStatus: 'inbox',
				currentQuery: {},
				setCurrentQuery: jest.fn(),
				filterOptions: {},
			} );

			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( -1 );
			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( false );
		} );

		it( 'should handle single record in array', () => {
			mockedUseInboxData.mockReturnValue( {
				records: [ mockRecords[ 0 ] ],
				totalItemsInbox: 1,
				totalItemsSpam: 0,
				totalItemsTrash: 0,
				isLoadingData: false,
				totalItems: 1,
				totalPages: 1,
				selectedResponsesCount: 0,
				setSelectedResponses: jest.fn(),
				statusFilter: 'draft,publish',
				currentStatus: 'inbox',
				currentQuery: {},
				setCurrentQuery: jest.fn(),
				filterOptions: {},
			} );

			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( 0 );
			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( false );
		} );
	} );

	describe( 'Navigation handlers', () => {
		it( 'should navigate to next item correctly', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
					isMobile: true,
				} )
			);

			result.current.handleNext();

			expect( mockSetRecord ).toHaveBeenCalledWith( mockRecords[ 1 ] );
			expect( mockOnChangeSelection ).toHaveBeenCalledWith( [ '2' ] );
		} );

		it( 'should navigate to previous item correctly', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 1 ],
					setRecord: mockSetRecord,
					isMobile: true,
				} )
			);

			result.current.handlePrevious();

			expect( mockSetRecord ).toHaveBeenCalledWith( mockRecords[ 0 ] );
			expect( mockOnChangeSelection ).toHaveBeenCalledWith( [ '1' ] );
		} );

		it( 'should not navigate next when at last item', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 2 ],
					setRecord: mockSetRecord,
				} )
			);

			result.current.handleNext();

			expect( mockSetRecord ).not.toHaveBeenCalled();
			expect( mockOnChangeSelection ).not.toHaveBeenCalled();
		} );

		it( 'should not navigate previous when at first item', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
				} )
			);

			result.current.handlePrevious();

			expect( mockSetRecord ).not.toHaveBeenCalled();
			expect( mockOnChangeSelection ).not.toHaveBeenCalled();
		} );

		it( 'should not navigate when currentIndex is -1', () => {
			const unknownRecord = {
				...mockRecords[ 0 ],
				id: 999,
			};

			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: unknownRecord,
					setRecord: mockSetRecord,
				} )
			);

			result.current.handleNext();
			result.current.handlePrevious();

			expect( mockSetRecord ).not.toHaveBeenCalled();
			expect( mockOnChangeSelection ).not.toHaveBeenCalled();
		} );

		it( 'should handle null onChangeSelection callback', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: null,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
					isMobile: true,
				} )
			);

			// Should not throw when onChangeSelection is null
			expect( () => result.current.handleNext() ).not.toThrow();
			expect( mockSetRecord ).toHaveBeenCalledWith( mockRecords[ 1 ] );
		} );

		it( 'should handle undefined onChangeSelection callback', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: undefined,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
					isMobile: true,
				} )
			);

			// Should not throw when onChangeSelection is undefined
			expect( () => result.current.handleNext() ).not.toThrow();
			expect( mockSetRecord ).toHaveBeenCalledWith( mockRecords[ 1 ] );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'should handle records being null', () => {
			mockedUseInboxData.mockReturnValue( {
				records: null,
				totalItemsInbox: 0,
				totalItemsSpam: 0,
				totalItemsTrash: 0,
				isLoadingData: true,
				totalItems: 0,
				totalPages: 0,
				selectedResponsesCount: 0,
				setSelectedResponses: jest.fn(),
				statusFilter: 'draft,publish',
				currentStatus: 'inbox',
				currentQuery: {},
				setCurrentQuery: jest.fn(),
				filterOptions: {},
			} );

			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 0 ],
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( -1 );
			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( false );

			// Navigation should not work with null records
			result.current.handleNext();
			result.current.handlePrevious();
			expect( mockSetRecord ).not.toHaveBeenCalled();
			expect( mockOnChangeSelection ).not.toHaveBeenCalled();
		} );

		it( 'should handle record being null', () => {
			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: null,
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( -1 );
			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( false );
		} );

		it( 'should update navigation state when record changes', () => {
			const { result, rerender } = renderHook(
				( { record } ) =>
					useResponseNavigation( {
						onChangeSelection: mockOnChangeSelection,
						record,
						setRecord: mockSetRecord,
					} ),
				{
					initialProps: { record: mockRecords[ 0 ] },
				}
			);

			expect( result.current.currentIndex ).toBe( 0 );
			expect( result.current.hasNext ).toBe( true );
			expect( result.current.hasPrevious ).toBe( false );

			// Change to last record
			rerender( { record: mockRecords[ 2 ] } );

			expect( result.current.currentIndex ).toBe( 2 );
			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( true );
		} );

		it( 'should update navigation state when records list changes', () => {
			const { result, rerender } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 1 ],
					setRecord: mockSetRecord,
				} )
			);

			expect( result.current.currentIndex ).toBe( 1 );

			// Update records list - remove first item
			mockedUseInboxData.mockReturnValue( {
				records: mockRecords.slice( 1 ),
				totalItemsInbox: 2,
				totalItemsSpam: 0,
				totalItemsTrash: 0,
				isLoadingData: false,
				totalItems: 2,
				totalPages: 1,
				selectedResponsesCount: 0,
				setSelectedResponses: jest.fn(),
				statusFilter: 'draft,publish',
				currentStatus: 'inbox',
				currentQuery: {},
				setCurrentQuery: jest.fn(),
				filterOptions: {},
			} );

			rerender();

			// Record that was at index 1 is now at index 0
			expect( result.current.currentIndex ).toBe( 0 );
			expect( result.current.hasPrevious ).toBe( false );
		} );

		it( 'should use getItemId for comparison', () => {
			// Mock getItemId to use custom logic
			mockedGetItemId.mockImplementation( item => ( item ? `custom_${ item.id }` : '' ) );

			const { result } = renderHook( () =>
				useResponseNavigation( {
					onChangeSelection: mockOnChangeSelection,
					record: mockRecords[ 1 ],
					setRecord: mockSetRecord,
				} )
			);

			// Should still find the correct index using custom getItemId
			expect( result.current.currentIndex ).toBe( 1 );
			expect( mockedGetItemId ).toHaveBeenCalled();
		} );
	} );
} );
