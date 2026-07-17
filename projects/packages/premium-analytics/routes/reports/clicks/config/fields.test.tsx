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
			name: `${ row.clickedUrl }(opens in a new tab)`,
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

		// Group rows render bare so DataViews' title styling applies; the
		// leaf opt-out wrapper must not be present.
		const label = screen.getByText( groupRow.clickedUrl );
		// eslint-disable-next-line testing-library/no-node-access -- The presentational leaf wrapper has no accessible query target, so inspect the ancestry directly.
		expect( label.closest( 'span[class]' ) ).toBeNull();
		expect( screen.queryByRole( 'link', { name: groupRow.clickedUrl } ) ).not.toBeInTheDocument();
	} );

	it( 'wraps leaf rows in the title-styling opt-out', () => {
		const field = getClicksFields().find( candidate => candidate.id === 'clickedUrl' );
		const { render: UrlField } = field ?? {};

		if ( ! field || ! UrlField ) {
			throw new Error( 'Clicked URL field render callback is unavailable' );
		}

		render( <UrlField item={ row } field={ field as never } /> );

		const link = screen.getByRole( 'link', {
			name: `${ row.clickedUrl }(opens in a new tab)`,
		} );
		// eslint-disable-next-line testing-library/no-node-access -- The presentational leaf wrapper has no accessible query target, so inspect the ancestry directly.
		expect( link.closest( 'span' ) ).not.toBeNull();
	} );

	it( 'makes URL values globally searchable', () => {
		const fields = getClicksFields();

		expect( fields.find( field => field.id === 'clickedUrl' )?.enableGlobalSearch ).toBe( true );
	} );
} );
