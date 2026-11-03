/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { EMAIL_SEND_WINDOW_DAYS, useEmailTabScope } from './use-email-tab-scope';

const POST_ID = 91;
const TIME_ZONE = 'UTC';
const PUBLISHED = new Date( '2026-06-22T00:00:00Z' );

describe( 'useEmailTabScope', () => {
	beforeEach( () => {
		jest.useFakeTimers().setSystemTime( new Date( '2026-08-28T10:00:00Z' ) );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'matches the timeline endpoint cap of 30 daily buckets', () => {
		expect( EMAIL_SEND_WINDOW_DAYS ).toBe( 30 );
	} );

	it( 'pins the range to the first 30 days after an older send', () => {
		const { result } = renderHook( () => useEmailTabScope( POST_ID, PUBLISHED, TIME_ZONE ) );

		const scope = result.current;
		expect( scope ).toBeDefined();
		expect( scope?.range.from ).toEqual( PUBLISHED );
		// Day 30 counted from the send day, at the end of that day.
		expect( scope?.range.to.toISOString() ).toBe( '2026-07-21T23:59:59.999Z' );
		expect( scope?.reportParams ).toMatchObject( {
			post_id: POST_ID,
			interval: 'day',
		} );
		expect( scope?.reportParams.preset ).toBeUndefined();
		expect( scope?.reportParams.from.startsWith( '2026-06-22' ) ).toBe( true );
		expect( scope?.reportParams.to.startsWith( '2026-07-21' ) ).toBe( true );
	} );

	it( 'runs through today for a send younger than the window', () => {
		const recent = new Date( '2026-08-20T00:00:00Z' );
		const { result } = renderHook( () => useEmailTabScope( POST_ID, recent, TIME_ZONE ) );

		const scope = result.current;
		expect( scope?.range.from ).toEqual( recent );
		expect( scope?.range.to.toISOString() ).toBe( '2026-08-28T23:59:59.999Z' );
		expect( scope?.reportParams.to.startsWith( '2026-08-28' ) ).toBe( true );
	} );

	it( 'is undefined until the publish day is known', () => {
		const { result } = renderHook( () => useEmailTabScope( POST_ID, undefined, TIME_ZONE ) );

		expect( result.current ).toBeUndefined();
	} );

	it( 'is undefined without a valid post scope', () => {
		const { result } = renderHook( () => useEmailTabScope( 0, PUBLISHED, TIME_ZONE ) );

		expect( result.current ).toBeUndefined();
	} );

	it( 'keeps the same scope across renders for the same inputs', () => {
		const { result, rerender } = renderHook(
			( { start }: { start: Date } ) => useEmailTabScope( POST_ID, start, TIME_ZONE ),
			{ initialProps: { start: PUBLISHED } }
		);
		const first = result.current;

		rerender( { start: PUBLISHED } );

		expect( result.current ).toBe( first );
	} );
} );
