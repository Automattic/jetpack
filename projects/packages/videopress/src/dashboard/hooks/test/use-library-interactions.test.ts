import analytics from '@automattic/jetpack-analytics';
import { act, renderHook } from '@testing-library/react';
import { createElement, StrictMode, type ReactNode } from 'react';
import { SEARCH_SETTLE_MS, useLibraryInteractions } from '../use-library-interactions';
import type { View } from '@wordpress/dataviews';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );
const recordEvent = analytics.tracks.recordEvent as jest.Mock;
const EVENT_NAME = 'jetpack_videopress_library_interaction';
const initialView: View = {
	type: 'grid',
	search: '',
	filters: [],
	sort: { field: 'uploadDate', direction: 'desc' },
};

beforeEach( () => {
	jest.useFakeTimers();
	recordEvent.mockClear();
} );
afterEach( () => {
	jest.clearAllTimers();
	jest.useRealTimers();
} );

describe( 'library interaction metrics', () => {
	it( 'ignores restored state and emits one actual view change under StrictMode', () => {
		const restored: View = {
			...initialView,
			type: 'table',
			search: 'private restored search',
			filters: [ { field: 'privacy', operator: 'is', value: 'private' } ],
			sort: { field: 'title', direction: 'asc' },
		};
		const wrapper = ( { children }: { children: ReactNode } ) =>
			createElement( StrictMode, {}, children );
		const { rerender } = renderHook( useLibraryInteractions, { initialProps: restored, wrapper } );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS ) );
		expect( recordEvent ).not.toHaveBeenCalled();
		rerender( { ...restored, type: 'grid' } );
		rerender( { ...restored, type: 'grid' } );
		expect( recordEvent.mock.calls ).toEqual( [
			[ EVENT_NAME, { interaction: 'view', view_type: 'grid' } ],
		] );
	} );

	it( 'ignores pagination, visible columns, density and equivalent filter ordering', () => {
		const filters: NonNullable< View[ 'filters' ] > = [
			{ field: 'privacy', operator: 'is', value: 'private' },
			{ field: 'type', operator: 'is', value: 'videopress' },
		];
		const { rerender } = renderHook( useLibraryInteractions, {
			initialProps: { ...initialView, filters },
		} );
		rerender( {
			...initialView,
			page: 2,
			perPage: 24,
			fields: [ 'filename' ],
			layout: { density: 'compact' },
			filters: [ { ...filters[ 1 ] }, { ...filters[ 0 ] }, { ...filters[ 0 ] } ],
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it.each( [ 'title', 'filename', 'uploadDate' ] )(
		'records bounded %s sorting and direction changes',
		field => {
			const { rerender } = renderHook( useLibraryInteractions, { initialProps: initialView } );
			rerender( { ...initialView, sort: { field, direction: 'asc' } } );
			rerender( { ...initialView, sort: { field, direction: 'desc' } } );
			expect( recordEvent.mock.calls ).toEqual( [
				[ EVENT_NAME, { interaction: 'sort', field, direction: 'asc' } ],
				[ EVENT_NAME, { interaction: 'sort', field, direction: 'desc' } ],
			] );
		}
	);

	it.each( [
		{ field: 'privacy', operator: 'is', first: 'private', second: 'public' },
		{ field: 'type', operator: 'is', first: 'videopress', second: 'local' },
		{
			field: 'uploadDate',
			operator: 'before',
			first: '2026-01-01T00:00:00Z',
			second: '2026-02-01T00:00:00Z',
		},
	] as const )(
		'records applying, editing and clearing $field without its values',
		( { field, operator, first, second } ) => {
			const { rerender } = renderHook( useLibraryInteractions, { initialProps: initialView } );
			rerender( { ...initialView, filters: [ { field, operator, value: first } ] } );
			rerender( { ...initialView, filters: [ { field, operator, value: second } ] } );
			rerender( initialView );
			expect( recordEvent.mock.calls ).toEqual( [
				[ EVENT_NAME, { interaction: 'filter', field, action: 'applied' } ],
				[ EVENT_NAME, { interaction: 'filter', field, action: 'applied' } ],
				[ EVENT_NAME, { interaction: 'filter', field, action: 'cleared' } ],
			] );
		}
	);

	it( 'ignores unknown fields and unsupported values instead of sending them', () => {
		const { rerender } = renderHook( useLibraryInteractions, { initialProps: initialView } );
		rerender( {
			...initialView,
			sort: { field: 'private customer field', direction: 'asc' },
			filters: [
				{ field: 'private customer field', operator: 'is', value: 'private value' },
				{ field: 'privacy', operator: 'is', value: 'private value' },
				{ field: 'type', operator: 'is', value: 'all' },
				{ field: 'uploadDate', operator: 'before', value: 'not a date' },
			],
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'counts settled searches and clearing, without per-keystroke events or text', () => {
		const { rerender } = renderHook( useLibraryInteractions, { initialProps: initialView } );
		rerender( { ...initialView, search: 'private' } );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS - 1 ) );
		expect( recordEvent ).not.toHaveBeenCalled();
		rerender( { ...initialView, search: 'private customer name' } );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS ) );
		rerender( { ...initialView, search: ' private customer name ' } );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS ) );
		rerender( { ...initialView, search: 'different private title' } );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS ) );
		rerender( { ...initialView, search: '' } );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS ) );
		expect( recordEvent.mock.calls ).toEqual( [
			[ EVENT_NAME, { interaction: 'search', action: 'applied' } ],
			[ EVENT_NAME, { interaction: 'search', action: 'applied' } ],
			[ EVENT_NAME, { interaction: 'search', action: 'cleared' } ],
		] );
	} );

	it( 'does not count searches reverted or abandoned before settling', () => {
		const { rerender, unmount } = renderHook( useLibraryInteractions, {
			initialProps: initialView,
		} );
		rerender( { ...initialView, search: 'private title' } );
		rerender( initialView );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS ) );
		expect( recordEvent ).not.toHaveBeenCalled();
		rerender( { ...initialView, search: 'another private title' } );
		unmount();
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS ) );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'does not restart the search quiet period when a filter changes', () => {
		const { rerender } = renderHook( useLibraryInteractions, { initialProps: initialView } );
		const searching = { ...initialView, search: 'private title' };
		rerender( searching );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS / 2 ) );
		rerender( { ...searching, filters: [ { field: 'type', operator: 'is', value: 'local' } ] } );
		act( () => jest.advanceTimersByTime( SEARCH_SETTLE_MS / 2 ) );
		expect( recordEvent.mock.calls ).toEqual( [
			[ EVENT_NAME, { interaction: 'filter', field: 'type', action: 'applied' } ],
			[ EVENT_NAME, { interaction: 'search', action: 'applied' } ],
		] );
	} );
} );
