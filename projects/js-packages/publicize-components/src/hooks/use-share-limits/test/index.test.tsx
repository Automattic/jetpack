import { renderHook } from '@testing-library/react';
import { RegistryProvider, createRegistry, createReduxStore } from '@wordpress/data';
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { getMessages, useShareLimits } from '../';
import { SOCIAL_STORE_CONFIG, SOCIAL_STORE_ID } from '../../../social-store';
import { SocialStoreState } from '../../../social-store/types';

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
function createRegistryWithStores( initialState = {} ): WPDataRegistry {
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

const messages = getMessages( 0 );

describe( 'useShareLimits', () => {
	it( 'should return the default values', () => {
		const { result } = renderHook( () => useShareLimits() );

		expect( result.current ).toEqual( {
			status: 'none',
			noticeType: 'default',
			message: getMessages( Infinity ).default,
			usedCount: 0,
			scheduledCount: 0,
			remainingCount: Infinity,
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
				status: 'none',
				noticeType: 'default',
				message: getMessages( 30 ).default,
				usedCount: 0,
				scheduledCount: 0,
				remainingCount: 30,
			},
		},
		{
			name: 'should return "default" with default message when used + scheduled < limit',
			sharesData: {
				publicized_count: 5,
				to_be_publicized_count: 5,
			},
			expected: {
				status: 'none',
				noticeType: 'default',
				message: getMessages( 20 ).default,
				usedCount: 5,
				scheduledCount: 5,
				remainingCount: 20,
			},
		},
		{
			name: 'should return "full" with limit exceeded message when the limit is reached without scheduled posts',
			sharesData: {
				publicized_count: 30,
				to_be_publicized_count: 0,
			},
			expected: {
				status: 'full',
				noticeType: 'error',
				message: messages.full,
				usedCount: 30,
				scheduledCount: 0,
				remainingCount: 0,
			},
		},
		{
			name: 'should return "full" with scheduled shares message when the limit is reached with scheduled posts',
			sharesData: {
				publicized_count: 15,
				to_be_publicized_count: 15,
			},
			expected: {
				status: 'full',
				noticeType: 'error',
				message: messages.full,
				usedCount: 15,
				scheduledCount: 15,
				remainingCount: 0,
			},
		},
		{
			name: 'should return "crossed" with limit exceeded message when the limit is crossed without scheduled posts',
			sharesData: {
				publicized_count: 35, // impossible to reach this number but just in case
				to_be_publicized_count: 0,
			},
			expected: {
				status: 'exceeded',
				noticeType: 'error',
				message: messages.exceeded,
				usedCount: 35,
				scheduledCount: 0,
				remainingCount: 0,
			},
		},
		{
			name: 'should return "crossed" with limit exceeded message when the limit is crossed with scheduled posts',
			sharesData: {
				publicized_count: 30,
				to_be_publicized_count: 5,
			},
			expected: {
				status: 'exceeded',
				noticeType: 'error',
				message: messages.exceeded,
				usedCount: 30,
				scheduledCount: 5,
				remainingCount: 0,
			},
		},
		{
			name: 'should return "approaching" with approaching limit message when the limit is approached without scheduled posts',
			sharesData: {
				publicized_count: 25,
				to_be_publicized_count: 0,
			},
			expected: {
				status: 'approaching',
				noticeType: 'warning',
				message: getMessages( 5 ).approaching,
				usedCount: 25,
				scheduledCount: 0,
				remainingCount: 5,
			},
		},
		{
			name: 'should return "approaching" with approaching limit message when the limit is approached with scheduled posts',
			sharesData: {
				publicized_count: 20,
				to_be_publicized_count: 5,
			},
			expected: {
				status: 'approaching',
				noticeType: 'warning',
				message: getMessages( 5 ).approaching,
				usedCount: 20,
				scheduledCount: 5,
				remainingCount: 5,
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
