import { render, screen } from '@testing-library/react';
import { getReferrerFields, type ReferrerRecord } from './fields';

/**
 * Mount the referrer field's render component for a table row.
 *
 * @param item - The referrer row to render.
 * @return The Testing Library render result.
 */
function renderReferrerField( item: ReferrerRecord ) {
	const field = getReferrerFields().find( candidate => candidate.id === 'referrer' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const ReferrerField = field?.render;

	if ( ! field || ! ReferrerField ) {
		throw new Error( 'Referrer field render callback is unavailable' );
	}

	return render( <ReferrerField item={ item } field={ field as never } /> );
}

describe( 'referrer field', () => {
	it( 'renders URL-backed referrers as safe external links', () => {
		renderReferrerField( {
			id: 'search|google.com|https://www.google.com/',
			label: 'google.com',
			group: 'Search Engines',
			views: 10,
			link: 'https://www.google.com/',
		} );

		const link = screen.getByRole( 'link', { name: 'google.com' } );
		expect( link ).toHaveAttribute( 'href', 'https://www.google.com/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'renders referrers without a URL as plain text', () => {
		renderReferrerField( {
			id: '|Unknown|',
			label: 'Unknown',
			group: '',
			views: 2,
		} );

		expect( screen.getByText( 'Unknown' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
