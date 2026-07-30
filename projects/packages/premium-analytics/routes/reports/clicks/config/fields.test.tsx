import { render, screen } from '@testing-library/react';
import { getClicksFields, type ClickRow } from './fields';

const row: ClickRow = {
	id: 'wordpress.org|https://wordpress.org/plugins/jetpack-search',
	parentId: 'wordpress.org',
	clickedUrl: 'https://wordpress.org/plugins/jetpack-search',
	href: 'https://wordpress.org/plugins/jetpack-search',
	clicks: 42,
};

/**
 * Mount a Clicks table field's render component.
 *
 * @param fieldId        - The field to render.
 * @param item           - The Clicks row.
 * @param withComparison - Whether comparison deltas are enabled.
 * @return The Testing Library render result.
 */
function renderField( fieldId: 'clickedUrl' | 'clicks', item: ClickRow, withComparison = false ) {
	const field = getClicksFields( withComparison ).find( candidate => candidate.id === fieldId );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- `render` is the DataViews field render component.
	const FieldComponent = field?.render;

	if ( ! field || ! FieldComponent ) {
		throw new Error( `Clicks ${ fieldId } field render callback is unavailable` );
	}

	return render( <FieldComponent item={ item } field={ field as never } /> );
}

describe( 'clicks fields', () => {
	it( 'renders clicked URLs as safe external links', () => {
		const field = getClicksFields().find( candidate => candidate.id === 'clickedUrl' );
		const { render: UrlField } = field ?? {};

		if ( ! field || ! UrlField ) {
			throw new Error( 'Clicked URL field render callback is unavailable' );
		}

		render( <UrlField item={ row } field={ field as never } /> );

		const link = screen.getByRole( 'link', {
			name: ( accessibleName: string ) => accessibleName.startsWith( row.clickedUrl ),
		} );
		expect( link ).toHaveAttribute( 'href', row.href );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'renders clicked URLs with unsafe schemes as plain text', () => {
		const field = getClicksFields().find( candidate => candidate.id === 'clickedUrl' );
		const { render: UrlField } = field ?? {};
		const unsafeRow = { ...row, href: 'javascript:alert(1)' };

		if ( ! field || ! UrlField ) {
			throw new Error( 'Clicked URL field render callback is unavailable' );
		}

		render( <UrlField item={ unsafeRow } field={ field as never } /> );

		expect( screen.getByText( unsafeRow.clickedUrl ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: unsafeRow.clickedUrl } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the title-field styling on group parent rows only', () => {
		const field = getClicksFields().find( candidate => candidate.id === 'clickedUrl' );
		const { render: UrlField } = field ?? {};
		const groupRow: ClickRow = {
			id: 'wordpress.org',
			clickedUrl: 'wordpress.org',
			isGroup: true,
			clicks: 55,
		};

		if ( ! field || ! UrlField ) {
			throw new Error( 'Clicked URL field render callback is unavailable' );
		}

		render( <UrlField item={ groupRow } field={ field as never } /> );

		// Group rows render as plain text so DataViews' title styling applies.
		expect( screen.getByText( groupRow.clickedUrl ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: groupRow.clickedUrl } ) ).not.toBeInTheDocument();
	} );

	it( 'announces the click group on nested URL rows for screen readers', () => {
		const field = getClicksFields().find( candidate => candidate.id === 'clickedUrl' );
		const { render: UrlField } = field ?? {};

		if ( ! field || ! UrlField ) {
			throw new Error( 'Clicked URL field render callback is unavailable' );
		}

		render( <UrlField item={ row } field={ field as never } /> );

		// The nesting is visual-only (no aria-level), so the group context is
		// announced as visually-hidden text before the link.
		expect( screen.getByText( `${ row.parentId }:` ) ).toBeInTheDocument();
	} );

	it( 'omits group context on flat top-level URL rows', () => {
		const field = getClicksFields().find( candidate => candidate.id === 'clickedUrl' );
		const { render: UrlField } = field ?? {};
		const flatRow: ClickRow = { ...row, parentId: undefined };

		if ( ! field || ! UrlField ) {
			throw new Error( 'Clicked URL field render callback is unavailable' );
		}

		render( <UrlField item={ flatRow } field={ field as never } /> );

		expect( screen.queryByText( /:$/ ) ).not.toBeInTheDocument();
	} );

	it( 'makes URL values globally searchable', () => {
		const fields = getClicksFields();

		expect( fields.find( field => field.id === 'clickedUrl' )?.enableGlobalSearch ).toBe( true );
	} );

	it( 'shows the clicks delta when a comparison row is available', () => {
		renderField( 'clicks', { ...row, previousClicks: 28 }, true );

		expect( screen.getByText( '42' ) ).toBeInTheDocument();
		expect( screen.getByText( '+50%' ) ).toBeInTheDocument();
	} );

	it( 'hides the clicks delta when comparison is disabled', () => {
		renderField( 'clicks', { ...row, previousClicks: 28 } );

		expect( screen.getByText( '42' ) ).toBeInTheDocument();
		expect( screen.queryByText( '+50%' ) ).not.toBeInTheDocument();
	} );
} );
