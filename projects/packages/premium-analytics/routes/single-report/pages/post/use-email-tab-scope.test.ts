/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	DEFAULT_EMAIL_SEND_WINDOW,
	EMAIL_SEND_WINDOWS,
	EMAIL_SEND_WINDOW_DAYS,
	EMAIL_SEND_WINDOW_MONTHS,
	isEmailSendWindow,
	useEmailTabScope,
} from './use-email-tab-scope';

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

	it( 'matches the timeline endpoint cap of 30 buckets per request', () => {
		expect( EMAIL_SEND_WINDOW_DAYS ).toBe( 30 );
		expect( EMAIL_SEND_WINDOW_MONTHS ).toBe( 30 );
	} );

	it( 'opens on the first 30 days, the legacy email page window', () => {
		expect( DEFAULT_EMAIL_SEND_WINDOW ).toBe( 'first-30-days' );
		expect( EMAIL_SEND_WINDOWS.every( isEmailSendWindow ) ).toBe( true );
		expect( isEmailSendWindow( 'first-24-hours' ) ).toBe( false );
		expect( isEmailSendWindow( undefined ) ).toBe( false );
	} );

	it( 'pins the range to the first 30 days after an older send', () => {
		const { result } = renderHook( () => useEmailTabScope( POST_ID, PUBLISHED, TIME_ZONE ) );

		const scope = result.current;
		expect( scope ).toBeDefined();
		expect( scope?.window ).toBe( 'first-30-days' );
		expect( scope?.isLifetimeCapped ).toBe( false );
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

	it( 'pins the send day by the hour', () => {
		const { result } = renderHook( () =>
			useEmailTabScope( POST_ID, PUBLISHED, TIME_ZONE, 'send-day' )
		);

		const scope = result.current;
		expect( scope?.range.from ).toEqual( PUBLISHED );
		expect( scope?.range.to.toISOString() ).toBe( '2026-06-22T23:59:59.999Z' );
		expect( scope?.reportParams ).toMatchObject( { post_id: POST_ID, interval: 'hour' } );
		expect( scope?.isLifetimeCapped ).toBe( false );
	} );

	it( 'pins the first week by the day', () => {
		const { result } = renderHook( () =>
			useEmailTabScope( POST_ID, PUBLISHED, TIME_ZONE, 'first-week' )
		);

		const scope = result.current;
		expect( scope?.range.to.toISOString() ).toBe( '2026-06-28T23:59:59.999Z' );
		expect( scope?.reportParams ).toMatchObject( { interval: 'day' } );
	} );

	it( 'pins the lifetime through today by the month', () => {
		const { result } = renderHook( () =>
			useEmailTabScope( POST_ID, PUBLISHED, TIME_ZONE, 'all-time' )
		);

		const scope = result.current;
		expect( scope?.range.from ).toEqual( PUBLISHED );
		expect( scope?.range.to.toISOString() ).toBe( '2026-08-28T23:59:59.999Z' );
		expect( scope?.reportParams ).toMatchObject( { interval: 'month' } );
		expect( scope?.isLifetimeCapped ).toBe( false );
	} );

	it( 'cuts a lifetime longer than 30 months at the end of the 30th, and says so', () => {
		const old = new Date( '2023-06-15T00:00:00Z' );
		const { result } = renderHook( () => useEmailTabScope( POST_ID, old, TIME_ZONE, 'all-time' ) );

		const scope = result.current;
		expect( scope?.range.from ).toEqual( old );
		// June 2023 is the first of the 30 months, so November 2025 is the last.
		expect( scope?.range.to.toISOString() ).toBe( '2025-11-30T23:59:59.999Z' );
		expect( scope?.isLifetimeCapped ).toBe( true );
	} );

	it( 'ends the send day in the site timezone', () => {
		const sent = new Date( '2026-06-22T04:00:00Z' ); // Midnight in New York.
		const { result } = renderHook( () =>
			useEmailTabScope( POST_ID, sent, 'America/New_York', 'send-day' )
		);

		const scope = result.current;
		expect( scope?.range.from.toISOString() ).toBe( '2026-06-22T04:00:00.000Z' );
		expect( scope?.range.to.toISOString() ).toBe( '2026-06-23T03:59:59.999Z' );
		expect( new Date( scope?.reportParams.from ?? '' ).toISOString() ).toBe(
			'2026-06-22T04:00:00.000Z'
		);
		expect( new Date( scope?.reportParams.to ?? '' ).toISOString() ).toBe(
			'2026-06-23T03:59:59.999Z'
		);
	} );

	it( 'runs through today for a send younger than the window', () => {
		const recent = new Date( '2026-08-20T00:00:00Z' );
		const { result } = renderHook( () => useEmailTabScope( POST_ID, recent, TIME_ZONE ) );

		const scope = result.current;
		expect( scope?.range.from ).toEqual( recent );
		expect( scope?.range.to.toISOString() ).toBe( '2026-08-28T23:59:59.999Z' );
		expect( scope?.reportParams.to.startsWith( '2026-08-28' ) ).toBe( true );
	} );

	it( "moves a young send's window to the new day after the site's midnight", () => {
		jest.setSystemTime( new Date( '2026-08-28T23:59:30Z' ) );
		const recent = new Date( '2026-08-20T00:00:00Z' );
		const { result } = renderHook( () => useEmailTabScope( POST_ID, recent, TIME_ZONE ) );

		act( () => {
			jest.advanceTimersByTime( 60 * 1000 );
		} );

		expect( result.current?.range.to.toISOString() ).toBe( '2026-08-29T23:59:59.999Z' );
		expect( result.current?.reportParams.to.startsWith( '2026-08-29' ) ).toBe( true );
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

	it( 'answers a new scope for a new window', () => {
		const { result, rerender } = renderHook(
			( { window }: { window: 'first-week' | 'first-30-days' } ) =>
				useEmailTabScope( POST_ID, PUBLISHED, TIME_ZONE, window ),
			{ initialProps: { window: 'first-30-days' as const } }
		);
		const first = result.current;

		rerender( { window: 'first-week' } );

		expect( result.current ).not.toBe( first );
		expect( result.current?.window ).toBe( 'first-week' );
	} );
} );
