/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { useEntityRecords } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { useAnnouncements } from '../use-announcements';
import type { Announcement } from '../../../types';

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecords: jest.fn(),
} ) );

const CHANNELS = [ 'my-plugin' ];
const SCOPE = 'jetpack-announcements/whats-new';

const newest: Announcement = {
	id: 'my-plugin/newest',
	date: '2026-11-20T00:00:00+00:00',
	title: 'Newest',
	excerpt: '',
	content: '',
	media: null,
	link: '',
	channels: CHANNELS,
};

// The store's action answers a promise, which `act` must not be handed.
const storePreference = ( key: string, value: unknown ): void => {
	void ( dispatch( preferencesStore ) as { set: ( ...args: unknown[] ) => unknown } ).set(
		SCOPE,
		key,
		value
	);
};

const storedSeen = () =>
	( select( preferencesStore ) as { get: ( ...args: unknown[] ) => unknown } ).get( SCOPE, 'seen' );

describe( 'useAnnouncements', () => {
	beforeEach( () => {
		jest.mocked( useEntityRecords ).mockReturnValue( { records: [ newest ] } as never );
	} );

	afterEach( () => {
		act( () => {
			storePreference( 'seen', undefined );
			storePreference( 'teaserOff', undefined );
		} );
	} );

	it( 'stops teasing an announcement as soon as it is marked, and keeps when in the preferences', () => {
		const { result } = renderHook( () => useAnnouncements( CHANNELS ) );
		expect( result.current.teaser ).toBe( newest );

		act( () => result.current.markSeen( newest.id ) );

		expect( result.current.teaser ).toBeNull();
		expect( result.current.announcements ).toEqual( [ newest ] );
		expect( storedSeen() ).toEqual( { [ newest.id ]: expect.any( String ) } );
	} );

	it( 'leaves alone what the preferences already hold as seen', () => {
		const seen = { [ newest.id ]: '2026-11-21T09:00:00.000Z' };
		act( () => storePreference( 'seen', seen ) );

		const { result } = renderHook( () => useAnnouncements( CHANNELS ) );
		act( () => result.current.markSeen( newest.id ) );

		expect( result.current.teaser ).toBeNull();
		expect( storedSeen() ).toEqual( seen );
	} );

	it( 'teases nothing while the user has the teaser off, and again once it is back on', () => {
		const { result } = renderHook( () => useAnnouncements( CHANNELS ) );
		expect( result.current.teaser ).toBe( newest );

		act( () => storePreference( 'teaserOff', true ) );

		expect( result.current.teaser ).toBeNull();
		expect( result.current.announcements ).toEqual( [ newest ] );

		act( () => storePreference( 'teaserOff', false ) );

		expect( result.current.teaser ).toBe( newest );
	} );
} );
