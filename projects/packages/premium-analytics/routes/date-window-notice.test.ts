/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	DATE_WINDOW_NOTICE_ID,
	queueDateWindowNotice,
	takeDateWindowNotice,
	dateWindowKey,
	useDateWindowNotice,
} from './date-window-notice';

const mockCreateInfoNotice = jest.fn();
let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn( () => ( { createInfoNotice: mockCreateInfoNotice } ) ),
} ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch,
} ) );

const LIMITED = {
	from: '2026-10-09T00:00:00.000+00:00',
	to: '2026-10-15T23:59:59.999+00:00',
	preset: 'last-7-days',
	interval: 'day',
	section: 'traffic',
};

afterEach( () => {
	takeDateWindowNotice( '' );
	jest.clearAllMocks();
} );

describe( 'useDateWindowNotice', () => {
	it.each( [
		[
			'recent-7-days',
			'Your plan doesn’t include that period, so this page shows the last 7 days.',
		],
		[
			'long-date-presets',
			'Your plan doesn’t include that period, so this page shows the last 30 days.',
		],
	] as const )( 'shows the %s notice once the page shows the window', ( feature, message ) => {
		queueDateWindowNotice( feature, LIMITED );
		// The page's search can carry params the window does not name.
		mockSearch = { ...LIMITED, ref: 'utm' };

		const { rerender } = renderHook( () => useDateWindowNotice() );
		rerender();

		expect( dispatch ).toHaveBeenCalledWith( 'core/notices' );
		expect( mockCreateInfoNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateInfoNotice ).toHaveBeenCalledWith( message, {
			id: DATE_WINDOW_NOTICE_ID,
			type: 'snackbar',
		} );
	} );

	it( 'drops a notice queued for a window the page never shows', () => {
		queueDateWindowNotice( 'recent-7-days', LIMITED );
		mockSearch = { ...LIMITED, preset: 'yesterday' };

		const { rerender } = renderHook( () => useDateWindowNotice() );
		mockSearch = LIMITED;
		rerender();

		expect( mockCreateInfoNotice ).not.toHaveBeenCalled();
	} );
} );

it( 'hands a held notice from one bundled copy of the module to another', () => {
	let queueFrom!: typeof queueDateWindowNotice;
	let takeFrom!: typeof takeDateWindowNotice;
	jest.isolateModules( () => {
		queueFrom = jest.requireActual( './date-window-notice' ).queueDateWindowNotice;
	} );
	jest.isolateModules( () => {
		takeFrom = jest.requireActual( './date-window-notice' ).takeDateWindowNotice;
	} );

	queueFrom( 'recent-7-days', LIMITED );

	expect( takeFrom( dateWindowKey( LIMITED ) ) ).toBe( 'recent-7-days' );
} );

describe( 'dateWindowKey', () => {
	it( 'reads a comparison flag the router parsed as a number like the one it was given', () => {
		expect( dateWindowKey( { ...LIMITED, comp: 1 } ) ).toBe(
			dateWindowKey( { ...LIMITED, comp: '1' } )
		);
	} );
} );
