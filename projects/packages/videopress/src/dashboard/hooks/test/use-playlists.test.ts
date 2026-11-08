import { viewToPlaylistQueryArgs } from '../use-playlists';
import type { View } from '@wordpress/dataviews';

const view = ( overrides: Partial< View > ): View => ( {
	type: 'grid',
	page: 2,
	perPage: 12,
	filters: [],
	...overrides,
} );

describe( 'viewToPlaylistQueryArgs', () => {
	it.each( [
		[ 'title', 'title' ],
		[ 'updated', 'updated' ],
		[ 'videoCount', 'videos' ],
	] )( 'sorts the %s field by orderby=%s', ( field, orderby ) => {
		expect(
			viewToPlaylistQueryArgs( view( { sort: { field, direction: 'asc' } } ) )
		).toMatchObject( { orderby, order: 'asc', page: 2, per_page: 12 } );
	} );

	it( 'sends a trimmed search and leaves unsortable fields to the server default', () => {
		expect(
			viewToPlaylistQueryArgs(
				view( { search: '  trip ', sort: { field: 'duration', direction: 'desc' } } )
			)
		).toEqual( { page: 2, per_page: 12, search: 'trip' } );
	} );
} );

describe( 'viewToPlaylistQueryArgs status filter', () => {
	it( 'sends the statuses picked in the filter', () => {
		expect(
			viewToPlaylistQueryArgs(
				view( {
					filters: [ { field: 'status', operator: 'isAny', value: [ 'draft', 'future' ] } ],
				} )
			)
		).toEqual( { page: 2, per_page: 12, status: [ 'draft', 'future' ] } );
		expect(
			viewToPlaylistQueryArgs(
				view( { filters: [ { field: 'status', operator: 'isAny', value: [] } ] } )
			)
		).toEqual( { page: 2, per_page: 12 } );
	} );
} );
