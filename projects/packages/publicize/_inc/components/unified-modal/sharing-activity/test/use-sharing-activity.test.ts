jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { SharedActivityItem } from '../types';
import { useSharingActivity } from '../use-sharing-activity';
import type { Connection, ScheduledShare, ShareStatusItem } from '../../../../social-store/types';

const mockUseSelect = useSelect as jest.Mock;

const createMockConnection = ( overrides: Partial< Connection > = {} ): Connection => ( {
	connection_id: '123',
	display_name: 'Test User',
	external_handle: '@test',
	external_id: 'ext123',
	profile_link: 'https://example.com/test',
	profile_picture: 'https://example.com/pic.jpg',
	service_label: 'Test Service',
	service_name: 'tumblr',
	shared: false,
	status: 'ok',
	wpcom_user_id: 1,
	enabled: true,
	...overrides,
} );

const createMockShareStatusItem = (
	overrides: Partial< ShareStatusItem > = {}
): ShareStatusItem => ( {
	connection_id: 123,
	status: 'success',
	message: 'https://tumblr.com/test/status/123',
	timestamp: 1700000000,
	service: 'tumblr',
	external_name: 'Test User',
	external_id: 'ext123',
	profile_link: 'https://tumblr.com/test',
	profile_picture: 'https://example.com/pic.jpg',
	...overrides,
} );

const createMockScheduledShare = (
	overrides: Partial< ScheduledShare > = {}
): ScheduledShare => ( {
	id: 1,
	blog_id: 1,
	connection_id: 123,
	message: 'Scheduled post message',
	post_id: 100,
	timestamp: 1700100000,
	wpcom_user_id: 1,
	...overrides,
} );

type MockSelectorData = {
	postId?: number;
	postShareStatus?: {
		shares: ShareStatusItem[];
		loading?: boolean;
		polling?: boolean;
	};
	scheduledShares?: ScheduledShare[];
	isFetchingScheduled?: boolean;
	connections?: Map< string, Connection >;
	deletingIds?: number[];
};

const setupMockUseSelect = ( data: MockSelectorData ) => {
	const {
		postId = 100,
		postShareStatus = { shares: [], loading: false, polling: false },
		scheduledShares = [],
		isFetchingScheduled = false,
		connections = new Map(),
		deletingIds = [],
	} = data;

	mockUseSelect.mockImplementation( ( selector: unknown ) => {
		if ( typeof selector === 'function' ) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const mockSelect = ( store: any ) => {
				// Handle both store objects and store name strings
				const storeName = typeof store === 'string' ? store : store?.name;

				if ( storeName === 'core/editor' ) {
					return {
						getCurrentPostId: () => postId,
					};
				}
				// socialStore or any other store
				return {
					getPostShareStatus: () => postShareStatus,
					getScheduledSharesForPost: () => scheduledShares,
					isFetchingScheduledSharesForPost: () => isFetchingScheduled,
					getConnections: () => Array.from( connections.values() ),
					getConnectionById: ( id: string ) => connections.get( id ),
					isDeletingScheduledShare: ( id: number ) => deletingIds.includes( id ),
				};
			};
			return selector( mockSelect );
		}
		// For direct store access (useSelect(store, []))
		return {
			getConnectionById: ( id: string ) => connections.get( id ),
		};
	} );
};

describe( 'useSharingActivity', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return empty items when no shares exist', () => {
		setupMockUseSelect( {} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.items ).toHaveLength( 0 );
		expect( result.current.sharedCount ).toBe( 0 );
		expect( result.current.scheduledCount ).toBe( 0 );
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'should transform shared items correctly', () => {
		const share = createMockShareStatusItem( {
			connection_id: 456,
			status: 'success',
			message: 'https://tumblr.com/post/123',
			timestamp: 1700000000,
			service: 'tumblr',
			external_name: 'Tumblr User',
			external_id: 'tb123',
		} );

		setupMockUseSelect( {
			postShareStatus: { shares: [ share ], loading: false },
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.items ).toHaveLength( 1 );
		expect( result.current.sharedCount ).toBe( 1 );

		const item = result.current.items[ 0 ];
		expect( item.activityType ).toBe( 'shared' );
		expect( item.status ).toBe( 'success' );
		expect( item.timestamp ).toBe( 1700000000 );
		expect( item.serviceName ).toBe( 'tumblr' );
		expect( item.displayName ).toBe( 'Tumblr User' );

		// Type assertion since we verified activityType above
		const sharedItem = item as SharedActivityItem;
		expect( sharedItem.message ).toBe( 'https://tumblr.com/post/123' );
		expect( sharedItem.originalItem ).toBe( share );
	} );

	it( 'should transform scheduled items correctly when connection exists', () => {
		const connection = createMockConnection( {
			connection_id: '789',
			service_name: 'linkedin',
			display_name: 'LinkedIn User',
			profile_picture: 'https://example.com/linkedin.jpg',
			profile_link: 'https://linkedin.com/user',
		} );

		const scheduledShare = createMockScheduledShare( {
			id: 10,
			connection_id: 789,
			timestamp: 1700200000,
		} );

		setupMockUseSelect( {
			scheduledShares: [ scheduledShare ],
			connections: new Map( [ [ '789', connection ] ] ),
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.items ).toHaveLength( 1 );
		expect( result.current.scheduledCount ).toBe( 1 );

		const item = result.current.items[ 0 ];
		expect( item.activityType ).toBe( 'scheduled' );
		expect( item.status ).toBe( 'scheduled' );
		expect( item.timestamp ).toBe( 1700200000 );
		expect( item.serviceName ).toBe( 'linkedin' );
		expect( item.displayName ).toBe( 'LinkedIn User' );

		// Type assertion since we verified activityType above
		const scheduledItem = item as import('../types').ScheduledActivityItem;
		expect( scheduledItem.scheduleId ).toBe( 10 );
	} );

	it( 'should skip scheduled items when connection does not exist', () => {
		const scheduledShare = createMockScheduledShare( {
			connection_id: 999, // No matching connection
		} );

		setupMockUseSelect( {
			scheduledShares: [ scheduledShare ],
			connections: new Map(), // Empty - no connections
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.items ).toHaveLength( 0 );
		expect( result.current.scheduledCount ).toBe( 0 );
	} );

	it( 'should skip scheduled items being deleted', () => {
		const connection = createMockConnection( { connection_id: '123' } );
		const scheduledShare = createMockScheduledShare( {
			id: 5,
			connection_id: 123,
		} );

		setupMockUseSelect( {
			scheduledShares: [ scheduledShare ],
			connections: new Map( [ [ '123', connection ] ] ),
			deletingIds: [ 5 ], // This item is being deleted
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.items ).toHaveLength( 0 );
		expect( result.current.scheduledCount ).toBe( 0 );
	} );

	it( 'should combine and sort items by timestamp descending', () => {
		const connection = createMockConnection( { connection_id: '100' } );

		const oldShare = createMockShareStatusItem( {
			timestamp: 1700000000,
			external_name: 'Old Share',
		} );
		const newShare = createMockShareStatusItem( {
			timestamp: 1700300000,
			external_name: 'New Share',
		} );
		const scheduledShare = createMockScheduledShare( {
			connection_id: 100,
			timestamp: 1700200000, // In between
		} );

		setupMockUseSelect( {
			postShareStatus: { shares: [ oldShare, newShare ], loading: false },
			scheduledShares: [ scheduledShare ],
			connections: new Map( [ [ '100', connection ] ] ),
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.items ).toHaveLength( 3 );
		expect( result.current.items[ 0 ].timestamp ).toBe( 1700300000 ); // newest first
		expect( result.current.items[ 1 ].timestamp ).toBe( 1700200000 );
		expect( result.current.items[ 2 ].timestamp ).toBe( 1700000000 ); // oldest last
	} );

	it( 'should return correct counts for mixed items', () => {
		const connection = createMockConnection( { connection_id: '100' } );

		const shares = [
			createMockShareStatusItem( { status: 'success' } ),
			createMockShareStatusItem( { status: 'failure' } ),
		];
		const scheduledShares = [
			createMockScheduledShare( { id: 1, connection_id: 100 } ),
			createMockScheduledShare( { id: 2, connection_id: 100 } ),
		];

		setupMockUseSelect( {
			postShareStatus: { shares, loading: false },
			scheduledShares,
			connections: new Map( [ [ '100', connection ] ] ),
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.items ).toHaveLength( 4 );
		expect( result.current.sharedCount ).toBe( 2 );
		expect( result.current.scheduledCount ).toBe( 2 );
	} );

	it( 'should return isLoading true when shares are loading', () => {
		setupMockUseSelect( {
			postShareStatus: { shares: [], loading: true },
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'should return isLoading true when scheduled shares are fetching', () => {
		setupMockUseSelect( {
			isFetchingScheduled: true,
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'should return isPolling from postShareStatus', () => {
		setupMockUseSelect( {
			postShareStatus: { shares: [], loading: false, polling: true },
		} );

		const { result } = renderHook( () => useSharingActivity() );

		expect( result.current.isPolling ).toBe( true );
	} );

	it( 'should generate unique IDs for items', () => {
		const connection = createMockConnection( { connection_id: '100' } );

		const share1 = createMockShareStatusItem( {
			external_id: 'ext1',
			connection_id: 100,
			timestamp: 1700000000,
		} );
		const share2 = createMockShareStatusItem( {
			external_id: 'ext2',
			connection_id: 100,
			timestamp: 1700000001,
		} );
		const scheduledShare = createMockScheduledShare( {
			id: 42,
			connection_id: 100,
		} );

		setupMockUseSelect( {
			postShareStatus: { shares: [ share1, share2 ], loading: false },
			scheduledShares: [ scheduledShare ],
			connections: new Map( [ [ '100', connection ] ] ),
		} );

		const { result } = renderHook( () => useSharingActivity() );

		const ids = result.current.items.map( item => item.id );
		const uniqueIds = new Set( ids );

		expect( uniqueIds.size ).toBe( ids.length );
		expect( ids.some( id => id.startsWith( 'shared-' ) ) ).toBe( true );
		expect( ids.some( id => id.startsWith( 'scheduled-' ) ) ).toBe( true );
	} );
} );
