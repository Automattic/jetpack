/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getAuthorsFields } from './fields';
import type { AuthorRow } from './aggregate';
import type { ReactNode } from 'react';

const author: AuthorRow = {
	id: 'id:42',
	label: 'Ada Lovelace',
	avatarUrl: 'https://example.com/ada.png',
	isGroup: true,
	views: 1234,
};

const post: AuthorRow = {
	id: 'id:42|post:id:1',
	parentId: 'id:42',
	parentName: 'Ada Lovelace',
	label: 'Analytical Engine',
	avatarUrl: null,
	postId: '1',
	views: 321,
};

// Field tests do not mount the dynamic report router, so render its Link as
// the internal anchor produced for the post detail route.
jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		params,
		children,
	}: {
		to: string;
		params: Record< string, string >;
		children: ReactNode;
	} ) => <a href={ to.replace( '$postId', params.postId ) }>{ children }</a>,
} ) );

/**
 * Mount an Authors table field's render component.
 *
 * @param fieldId        - The field to render.
 * @param item           - The author row.
 * @param withComparison - Whether comparison deltas are enabled.
 * @return The Testing Library render result.
 */
function renderField( fieldId: 'author' | 'views', item: AuthorRow, withComparison = false ) {
	const field = getAuthorsFields( withComparison ).find( candidate => candidate.id === fieldId );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const FieldComponent = field?.render;

	if ( ! field || ! FieldComponent ) {
		throw new Error( `Authors ${ fieldId } field render callback is unavailable` );
	}

	return render( <FieldComponent item={ item } field={ field as never } /> );
}

describe( 'authors fields', () => {
	it( 'renders the author name with its avatar', () => {
		renderField( 'author', author );

		expect( screen.getByText( 'Ada Lovelace' ) ).toBeInTheDocument();
		expect( screen.getByAltText( 'Avatar of Ada Lovelace' ) ).toHaveAttribute(
			'src',
			'https://example.com/ada.png'
		);
		expect( getAuthorsFields().map( field => field.id ) ).toEqual( [ 'author', 'views' ] );
	} );

	it( 'localizes the untracked-author sentinel for display and search', () => {
		const untracked = { ...author, label: 'Untracked Authors', avatarUrl: null };
		const authorField = getAuthorsFields().find( candidate => candidate.id === 'author' );

		expect( authorField?.getValue?.( { item: untracked } as never ) ).toBe( 'Untracked authors' );

		renderField( 'author', untracked );
		expect( screen.getByText( 'Untracked authors' ) ).toBeInTheDocument();
	} );

	it( 'links nested posts to their single-post details without external-link treatment', () => {
		renderField( 'author', post );

		const link = screen.getByRole( 'link', { name: /Analytical Engine/ } );
		expect( link ).toHaveAttribute( 'href', '/post/1' );
		expect( link ).not.toHaveAttribute( 'target' );
		// eslint-disable-next-line testing-library/no-node-access -- the removed external-link icon has no accessible role or text.
		expect( link.querySelector( 'svg' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Ada Lovelace:' ) ).toBeInTheDocument();
	} );

	it( 'makes author and post labels globally searchable', () => {
		const authorField = getAuthorsFields().find( candidate => candidate.id === 'author' );

		expect( authorField?.getValue?.( { item: author } as never ) ).toBe( 'Ada Lovelace' );
		expect( authorField?.getValue?.( { item: post } as never ) ).toBe( 'Analytical Engine' );
		expect( authorField?.enableGlobalSearch ).toBe( true );
	} );

	it( 'formats the views field for display', () => {
		renderField( 'views', author );
		expect( screen.getByText( author.views.toLocaleString() ) ).toBeInTheDocument();
	} );

	it( 'shows the views delta when a comparison row is available', () => {
		renderField( 'views', { ...post, previousViews: 200 }, true );

		expect( screen.getByText( '321' ) ).toBeInTheDocument();
		expect( screen.getByText( '+61%' ) ).toBeInTheDocument();
	} );

	it( 'hides the views delta when comparison is disabled', () => {
		renderField( 'views', { ...post, previousViews: 200 } );

		expect( screen.queryByText( '+61%' ) ).not.toBeInTheDocument();
	} );
} );
