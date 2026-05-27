import { viewToParams } from '@/routes/activity/view-to-params';
import {
	defaultView,
	loadView,
	saveView,
	STORAGE_KEY,
	withCategoryFilter,
} from '@/routes/activity/views';

describe( 'Activity views — persistence + adapter', () => {
	beforeEach( () => {
		window.localStorage.clear();
	} );

	describe( 'defaultView', () => {
		it( 'is a table view sorted by timestamp DESC at 25/page', () => {
			expect( defaultView.type ).toBe( 'table' );
			expect( defaultView.sort ).toEqual( { field: 'timestamp', direction: 'desc' } );
			expect( defaultView.perPage ).toBe( 25 );
			expect( defaultView.fields ).toEqual( [
				'subject',
				'category',
				'outcome',
				'source',
				'timestamp',
			] );
		} );
	} );

	describe( 'loadView / saveView', () => {
		it( 'returns defaultView when nothing is persisted', () => {
			expect( loadView() ).toEqual( defaultView );
		} );

		it( 'round-trips a saved view', () => {
			const v = {
				...defaultView,
				perPage: 50,
				filters: [ { field: 'category', operator: 'is' as const, value: 'logins' } ],
			};
			saveView( v );
			expect( loadView() ).toEqual( v );
		} );

		it( 'falls back to defaultView on corrupt storage', () => {
			window.localStorage.setItem( STORAGE_KEY, 'not-json' );
			expect( loadView() ).toEqual( defaultView );
		} );

		it( 'ignores non-table views on save', () => {
			// @ts-expect-error -- testing the safety branch
			saveView( { type: 'grid' } );
			expect( window.localStorage.getItem( STORAGE_KEY ) ).toBeNull();
		} );
	} );

	describe( 'withCategoryFilter', () => {
		it( 'pins a category filter, replacing any existing one', () => {
			const start = {
				...defaultView,
				filters: [
					{ field: 'category', operator: 'is' as const, value: 'comments' },
					{ field: 'outcome', operator: 'is' as const, value: 'block' },
				],
			};
			const next = withCategoryFilter( start, 'logins' );
			expect( next.filters ).toEqual( [
				{ field: 'outcome', operator: 'is', value: 'block' },
				{ field: 'category', operator: 'is', value: 'logins' },
			] );
		} );

		it( 'clears the category filter when category is null', () => {
			const start = {
				...defaultView,
				filters: [ { field: 'category', operator: 'is' as const, value: 'logins' } ],
			};
			expect( withCategoryFilter( start, null ).filters ).toEqual( [] );
		} );
	} );

	describe( 'viewToParams', () => {
		it( 'defaults everything to all / page 1 / 25 per page', () => {
			expect( viewToParams( defaultView ) ).toEqual( {
				page: 1,
				perPage: 25,
				category: 'all',
				outcome: 'all',
				source: 'all',
				search: '',
			} );
		} );

		it( 'translates filters into params', () => {
			const next = viewToParams( {
				...defaultView,
				search: 'spammer',
				page: 3,
				filters: [
					{ field: 'category', operator: 'is' as const, value: 'logins' },
					{ field: 'outcome', operator: 'is' as const, value: 'block' },
				],
			} );
			expect( next ).toEqual( {
				page: 3,
				perPage: 25,
				category: 'logins',
				outcome: 'block',
				source: 'all',
				search: 'spammer',
			} );
		} );
	} );
} );
