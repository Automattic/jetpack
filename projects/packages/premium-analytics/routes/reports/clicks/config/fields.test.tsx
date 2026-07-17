import { render, screen } from '@testing-library/react';
import { getClicksFields, type ClickRow } from './fields';

const row: ClickRow = {
	id: 'wordpress.org|https://wordpress.org/plugins/jetpack-search',
	clickedUrl: 'https://wordpress.org/plugins/jetpack-search',
	href: 'https://wordpress.org/plugins/jetpack-search',
	group: 'wordpress.org',
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

		const link = screen.getByRole( 'link', { name: row.clickedUrl } );
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

	it( 'makes URL and group values globally searchable', () => {
		const fields = getClicksFields();

		expect( fields.find( field => field.id === 'clickedUrl' )?.enableGlobalSearch ).toBe( true );
		expect( fields.find( field => field.id === 'group' )?.enableGlobalSearch ).toBe( true );
	} );
} );
