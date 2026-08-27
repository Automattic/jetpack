/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useEmailTabScope } from './use-email-tab-scope';

const POST_ID = 91;
const TIME_ZONE = 'UTC';
const PUBLISHED = new Date( '2026-06-22T00:00:00Z' );

describe( 'useEmailTabScope', () => {
	it( 'pins the range from the publish day through today', () => {
		const { result } = renderHook( () => useEmailTabScope( POST_ID, PUBLISHED, TIME_ZONE ) );

		const scope = result.current;
		expect( scope ).toBeDefined();
		expect( scope?.range.from ).toEqual( PUBLISHED );
		expect( scope?.range.to.getTime() ).toBeGreaterThan( PUBLISHED.getTime() );
		expect( scope?.reportParams ).toMatchObject( {
			post_id: POST_ID,
			preset: 'all-time',
		} );
		expect( scope?.reportParams.from.startsWith( '2026-06-22' ) ).toBe( true );
		expect( scope?.reportParams.to ).toBeTruthy();
		expect( scope?.reportParams.interval ).toBeTruthy();
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
