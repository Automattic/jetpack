import { render, screen } from '@testing-library/react';
import { getSearchTermsFields } from './fields';
import type { SearchTermRow } from './aggregate';

const row: SearchTermRow = {
	id: 'term:jetpack stats',
	term: 'jetpack stats',
	views: 321,
	previousViews: 200,
};

/**
 * Mount the views field's render component for a Search terms row.
 *
 * @param item           - The Search terms row.
 * @param withComparison - Whether comparison deltas are enabled.
 * @return The Testing Library render result.
 */
function renderViewsField( item: SearchTermRow, withComparison = false ) {
	const field = getSearchTermsFields( withComparison ).find(
		candidate => candidate.id === 'views'
	);
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const ViewsField = field?.render;

	if ( ! field || ! ViewsField ) {
		throw new Error( 'Views field render callback is unavailable' );
	}

	return render( <ViewsField item={ item } field={ field as never } /> );
}

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

	it( 'shows the views delta when comparison is available', () => {
		renderViewsField( row, true );

		expect( screen.getByText( '321' ) ).toBeInTheDocument();
		expect( screen.getByText( '+61%' ) ).toBeInTheDocument();
	} );

	it( 'renders only the views count when comparison is disabled', () => {
		renderViewsField( row );

		expect( screen.getByText( '321' ) ).toBeInTheDocument();
		expect( screen.queryByText( '+61%' ) ).not.toBeInTheDocument();
	} );
} );
