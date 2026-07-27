import { fireEvent, render, screen } from '@testing-library/react';
import { getReferrerFields, type ReferrerRecord } from './fields';

/**
 * Mount the referrer field's render component for a table row.
 *
 * @param item - The referrer row to render.
 * @return The Testing Library render result, with `rerender` taking a row.
 */
function renderReferrerField( item: ReferrerRecord ) {
	const field = getReferrerFields().find( candidate => candidate.id === 'referrer' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const ReferrerField = field?.render;

	if ( ! field || ! ReferrerField ) {
		throw new Error( 'Referrer field render callback is unavailable' );
	}

	const utils = render( <ReferrerField item={ item } field={ field as never } /> );

	return {
		...utils,
		rerender: ( nextItem: ReferrerRecord ) =>
			utils.rerender( <ReferrerField item={ nextItem } field={ field as never } /> ),
	};
}

/**
 * Mount the views field's render component for a table row.
 *
 * @param item - The referrer row to render.
 * @return The Testing Library render result.
 */
function renderViewsField( item: ReferrerRecord ) {
	const field = getReferrerFields().find( candidate => candidate.id === 'views' );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const ViewsField = field?.render;

	if ( ! field || ! ViewsField ) {
		throw new Error( 'Views field render callback is unavailable' );
	}

	return render( <ViewsField item={ item } field={ field as never } /> );
}

describe( 'referrer field', () => {
	it( 'renders URL-backed referrers as safe external links', () => {
		renderReferrerField( {
			id: 'search|google.com|https://www.google.com/',
			label: 'google.com',
			views: 10,
			link: 'https://www.google.com/',
		} );

		const link = screen.getByRole( 'link', {
			name: 'google.com (opens in a new tab)',
		} );
		expect( link ).toHaveAttribute( 'href', 'https://www.google.com/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( screen.getByText( 'google.com' ).parentElement?.tagName ).toBe( 'SPAN' );
	} );

	it( 'renders referrers without a URL as plain text', () => {
		renderReferrerField( {
			id: '|Unknown|',
			label: 'Unknown',
			views: 2,
		} );

		expect( screen.getByText( 'Unknown' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'announces the parent group for nested referrer leaves', () => {
		renderReferrerField( {
			id: '["Search Engines","google.com"]',
			parentId: '["Search Engines"]',
			parentLabel: 'Search Engines',
			label: 'google.com',
			views: 10,
			link: 'https://www.google.com/',
		} );

		// The nesting is visual-only (no aria-level), so the parent context is
		// announced as visually-hidden text before the link.
		expect( screen.getByText( 'Search Engines:' ) ).toBeInTheDocument();
	} );

	it( 'renders parent referrers as group labels instead of outbound links', () => {
		renderReferrerField( {
			id: '["Search Engines"]',
			label: 'Search Engines',
			views: 10,
			link: 'https://example.com/search-engines',
			hasChildren: true,
		} );

		expect( screen.getByText( 'Search Engines' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'renders referrers with unsafe URL schemes as plain text', () => {
		renderReferrerField( {
			id: '|Evil|javascript:alert(1)',
			label: 'Evil',
			views: 1,

			link: 'javascript:alert(1)',
		} );

		expect( screen.getByText( 'Evil' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the referrer favicon when the row has an icon', () => {
		renderReferrerField( {
			id: 'search|google.com|https://www.google.com/',
			label: 'google.com',
			views: 10,
			link: 'https://www.google.com/',
			icon: 'https://icons.example/google.png',
		} );

		// The favicon is decorative (empty alt), so it maps to the presentation role.
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://icons.example/google.png'
		);
	} );

	it( 'drops a referrer favicon that cannot be loaded but keeps its slot', () => {
		renderReferrerField( {
			id: 'search|google.com|https://www.google.com/',
			label: 'google.com',
			views: 10,
			link: 'https://www.google.com/',
			icon: 'https://icons.example/missing.png',
		} );

		fireEvent.error( screen.getByRole( 'presentation' ) );

		// The slot stays so the label keeps the indent of siblings whose
		// favicon did load, instead of jumping left once the error fires. The
		// slot is presentational, so structure is the only thing to assert on.
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access -- The reserved slot is a layout box with no role or text.
		expect( screen.getByText( 'google.com' ).previousElementSibling ).not.toBeNull();
	} );

	it( 'retries a referrer favicon when the row renders a different icon', () => {
		const item: ReferrerRecord = {
			id: 'search|google.com|https://www.google.com/',
			label: 'google.com',
			views: 10,
			link: 'https://www.google.com/',
			icon: 'https://icons.example/missing.png',
		};
		const { rerender } = renderReferrerField( item );

		fireEvent.error( screen.getByRole( 'presentation' ) );
		rerender( { ...item, icon: 'https://icons.example/google.png' } );

		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://icons.example/google.png'
		);
	} );

	it( 'reserves the favicon slot when the row has no icon', () => {
		renderReferrerField( {
			id: '|Unknown|',
			label: 'Unknown',
			views: 2,
		} );

		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access -- The reserved slot is a layout box with no role or text.
		expect( screen.getByText( 'Unknown' ).previousElementSibling ).not.toBeNull();
	} );

	it( 'renders the views delta when a comparison value is available', () => {
		renderViewsField( {
			id: '["example.com"]',
			label: 'example.com',
			views: 10,
			previousValue: 8,
		} );

		expect( screen.getByText( '10' ) ).toBeInTheDocument();
		expect( screen.getByText( '+25%' ) ).toBeInTheDocument();
	} );

	it( 'renders only the views count when comparison is disabled', () => {
		renderViewsField( {
			id: '["example.com"]',
			label: 'example.com',
			views: 10,
		} );

		expect( screen.getByText( '10' ) ).toBeInTheDocument();
		expect( screen.queryByText( /%/ ) ).not.toBeInTheDocument();
	} );
} );
