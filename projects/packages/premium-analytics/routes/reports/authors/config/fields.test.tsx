/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { getAuthorsFields } from './fields';
import type { AuthorRow } from './aggregate';

const author: AuthorRow = {
	id: 'id:42',
	name: 'Ada Lovelace',
	avatarUrl: 'https://example.com/ada.png',
	views: 1234,
};

/**
 * Mount an Authors table field's render component.
 *
 * @param fieldId - The field to render.
 * @param item    - The author row.
 * @return The Testing Library render result.
 */
function renderField( fieldId: 'author' | 'views', item: AuthorRow ) {
	const field = getAuthorsFields().find( candidate => candidate.id === fieldId );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const FieldComponent = field?.render;

	if ( ! field || ! FieldComponent ) {
		throw new Error( `Authors ${ fieldId } field render callback is unavailable` );
	}

	return render( <FieldComponent item={ item } field={ field as never } /> );
}

describe( 'authors fields', () => {
	it( 'renders the author name and avatar used by the Authors widget', () => {
		renderField( 'author', author );

		expect( screen.getByText( 'Ada Lovelace' ) ).toBeInTheDocument();
		expect( screen.getByAltText( 'Avatar of Ada Lovelace' ) ).toHaveAttribute(
			'src',
			'https://example.com/ada.png'
		);
	} );

	it( 'localizes the untracked-author sentinel for display and search', () => {
		const untracked = { ...author, name: 'Untracked Authors', avatarUrl: null };
		const authorField = getAuthorsFields().find( candidate => candidate.id === 'author' );

		expect( authorField?.getValue?.( { item: untracked } as never ) ).toBe( 'Untracked authors' );

		renderField( 'author', untracked );
		expect( screen.getByText( 'Untracked authors' ) ).toBeInTheDocument();
	} );

	it( 'formats the views field for display', () => {
		renderField( 'views', author );
		expect( screen.getByText( author.views.toLocaleString() ) ).toBeInTheDocument();
	} );
} );
