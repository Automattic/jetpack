import { getSearchTermsFields } from './fields';

describe( 'search terms fields', () => {
	it( 'makes the search term searchable and both columns sortable', () => {
		const fields = getSearchTermsFields();
		const term = fields.find( field => field.id === 'term' );
		const views = fields.find( field => field.id === 'views' );

		expect( term ).toEqual(
			expect.objectContaining( { enableGlobalSearch: true, enableSorting: true } )
		);
		expect( views ).toEqual( expect.objectContaining( { enableSorting: true } ) );
	} );
} );
