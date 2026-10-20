/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	DATE_WINDOW_NOTICE_ID,
	dateWindowNoticeState,
	useDateWindowNotice,
} from './date-window-notice';

const mockCreateInfoNotice = jest.fn();
const mockDispatch: jest.Mock = jest.fn( () => ( { createInfoNotice: mockCreateInfoNotice } ) );

// Lazy: `@wordpress/data` is still loading when this factory runs.
jest.mock( '@wordpress/data', () => {
	const actual = () => jest.requireActual( '@wordpress/data' );
	return new Proxy(
		{},
		{
			get: ( _target, name ) =>
				name === 'dispatch'
					? ( store: unknown ) => mockDispatch( store )
					: actual()[ name as string ],
		}
	);
} );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

afterEach( () => {
	window.history.replaceState( null, '' );
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
	] as const )( 'shows the %s notice the redirect carried, once', ( feature, message ) => {
		window.history.replaceState( { key: 'abc', ...dateWindowNoticeState( feature ) }, '' );

		const { rerender } = renderHook( () => useDateWindowNotice() );
		rerender();

		expect( mockDispatch ).toHaveBeenCalledWith( 'core/notices' );
		expect( mockCreateInfoNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateInfoNotice ).toHaveBeenCalledWith( message, {
			id: DATE_WINDOW_NOTICE_ID,
			type: 'snackbar',
		} );
		expect( window.history.state ).toEqual( { key: 'abc' } );
	} );

	// A preloaded redirect never commits, so a later tab switch or Back lands on an entry without it.
	it( 'shows nothing on an entry no redirect carried a notice to', () => {
		window.history.replaceState( { key: 'abc' }, '' );

		renderHook( () => useDateWindowNotice() );

		expect( mockCreateInfoNotice ).not.toHaveBeenCalled();
	} );
} );
