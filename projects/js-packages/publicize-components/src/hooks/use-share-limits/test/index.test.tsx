import { renderHook } from '@testing-library/react';
import { RegistryProvider, createRegistry, createReduxStore } from '@wordpress/data';
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { getMessages, useShareLimits } from '../';
import { SOCIAL_STORE_CONFIG, SOCIAL_STORE_ID } from '../../../social-store';
import { SocialStoreState } from '../../../social-store/types';
import { createActiveConnections } from '../../../utils/test-utils';

type DeepPartial< T > = T extends object
	? {
			[ P in keyof T ]?: DeepPartial< T[ P ] >;
	  }
	: T;

/**
 * Create a registry with stores.
 *
 * @param {Partial< SocialStoreState >} initialState - Initial state for the store.
 *
 * @returns {WPDataRegistry} Registry.
 */
function createRegistryWithStores( initialState = {} ) {
	// Create a registry.
	const registry = createRegistry();

	const socialStore = createReduxStore( SOCIAL_STORE_ID, { ...SOCIAL_STORE_CONFIG, initialState } );
	// Register stores.
	// @ts-expect-error The registry type is not correct. This comment can be removed when register() exists in the type.
	registry.register( socialStore );

	return registry;
}

/**
 * Returns the initial state for the store.
 *
 * @param {Partial< SocialStoreState >} data - Data to override the default state
 *
 * @returns {SocialStoreState} Initial state for the store
 */
function getStoreInitialState( data: DeepPartial< SocialStoreState > ) {
	return {
		...data,
		sharesData: {
			is_share_limit_enabled: true,
			to_be_publicized_count: 0,
			share_limit: 30,
			publicized_count: 0,
			show_advanced_plan_upgrade_nudge: false,
			shared_posts_count: 0,
			...data.sharesData,
		},
	};
}

const messages = getMessages( 30 );

describe( 'useShareLimits', () => {
	it( 'should return the default values', () => {
		const { result } = renderHook( () => useShareLimits() );

		expect( result.current ).toEqual( {
			limitStatus: 'none',
			noticeType: 'default',
			message: messages.default,
		} );
	} );

	const testCases = [
		{
			name: 'should return the default values at the beginning',
			sharesData: {
				publicized_count: 0,
				to_be_publicized_count: 0,
			},
			expected: {
				limitStatus: 'none',
				noticeType: 'default',
				message: messages.default,
			},
		},
		{
			name: 'should return "none" with default messages when used + scheduled < limit',
			sharesData: {
				publicized_count: 5,
				to_be_publicized_count: 5,
			},
			expected: {
				limitStatus: 'none',
				noticeType: 'default',
				message: messages.default,
			},
		},
		{
			name: 'should return "full" with limit exceeded message when the limit is reached without scheduled posts',
			sharesData: {
				publicized_count: 30,
				to_be_publicized_count: 0,
			},
			expected: {
				limitStatus: 'full',
				noticeType: 'error',
				message: messages.limitExceeded,
			},
		},
		{
			name: 'should return "full" with scheduled shares message when the limit is reached with scheduled posts',
			sharesData: {
				publicized_count: 15,
				to_be_publicized_count: 15,
			},
			expected: {
				limitStatus: 'full',
				noticeType: 'warning',
				message: messages.scheduled,
			},
		},
		{
			name: 'should return "crossed" with limit exceeded message when the limit is crossed without scheduled posts',
			sharesData: {
				publicized_count: 35, // impossible to reach this number but just in case
				to_be_publicized_count: 0,
			},
			expected: {
				limitStatus: 'crossed',
				noticeType: 'error',
				message: messages.limitExceeded,
			},
		},
		{
			name: 'should return "crossed" with limit exceeded message when the limit is crossed with scheduled posts',
			sharesData: {
				publicized_count: 30,
				to_be_publicized_count: 5,
			},
			expected: {
				limitStatus: 'crossed',
				noticeType: 'error',
				message: messages.limitExceeded,
			},
		},
		{
			name: 'should return "close" with approaching limit message when the limit is approached without scheduled posts',
			sharesData: {
				publicized_count: 25,
				to_be_publicized_count: 0,
			},
			expected: {
				limitStatus: 'close',
				noticeType: 'warning',
				message: messages.approachingLimit,
			},
		},
		{
			name: 'should return "close" with approaching limit message when the limit is approached with scheduled posts',
			sharesData: {
				publicized_count: 20,
				to_be_publicized_count: 5,
			},
			expected: {
				limitStatus: 'close',
				noticeType: 'warning',
				message: messages.approachingLimit,
			},
		},
		{
			name: 'should return "none" when everything including active connections is well below the limit',
			sharesData: {
				publicized_count: 5,
				to_be_publicized_count: 5,
			},
			connectionData: {
				connections: createActiveConnections( 5 ),
			},
			expected: {
				limitStatus: 'none',
				noticeType: 'default',
				message: messages.default,
			},
		},
		{
			name: 'should return "close" when approaching the limit with active connections',
			sharesData: {
				publicized_count: 10,
				to_be_publicized_count: 10,
			},
			connectionData: {
				connections: createActiveConnections( 5 ),
			},
			expected: {
				limitStatus: 'close',
				noticeType: 'warning',
				message: messages.approachingLimit,
			},
		},
		{
			name: 'should return "full" with a warning when the limit is reached with active connections',
			sharesData: {
				publicized_count: 15,
				to_be_publicized_count: 10,
			},
			connectionData: {
				connections: createActiveConnections( 5 ),
			},
			expected: {
				limitStatus: 'full',
				noticeType: 'warning',
				message: messages.scheduled,
			},
		},
		{
			name: 'should return "crossed" with a warning when the limit is crossed with active connections',
			sharesData: {
				publicized_count: 20,
				to_be_publicized_count: 10,
			},
			connectionData: {
				connections: createActiveConnections( 5 ),
			},
			expected: {
				limitStatus: 'crossed',
				noticeType: 'warning',
				message: messages.scheduled,
			},
		},
	];

	for ( const { name, expected, ...initiaState } of testCases ) {
		describe( 'dynamic tests', () => {
			it( `${ name }`, () => {
				const { result } = renderHook( () => useShareLimits(), {
					wrapper: ( { children } ) => (
						<RegistryProvider
							value={ createRegistryWithStores( getStoreInitialState( initiaState ) ) }
						>
							{ children }
						</RegistryProvider>
					),
				} );

				expect( result.current ).toEqual( expected );
			} );
		} );
	}
} );
