import { render, screen } from '@testing-library/react';
import { getClicksFields, type ClickRow } from './fields';

const row: ClickRow = {
	id: 'wordpress.org|https://wordpress.org/plugins/jetpack-search',
	parentId: 'wordpress.org',
	clickedUrl: 'https://wordpress.org/plugins/jetpack-search',
	href: 'https://wordpress.org/plugins/jetpack-search',
	clicks: 42,
};

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
} );
