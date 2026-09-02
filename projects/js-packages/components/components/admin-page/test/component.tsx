/* eslint-disable testing-library/no-node-access -- these tests check class hooks
   that the `jetpack-admin-page-layout` mixin selects on. */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { render, screen } from '@testing-library/react';
import AdminPage from '../index.tsx';

describe( 'AdminPage', () => {
	it( 'keeps the content hook in step with the admin page layout mixin', () => {
		// jsdom does no layout, so the only automated guard is that the mixin
		// still selects the class this component renders.
		const mixinPath = fileURLToPath(
			new URL(
				'../../../node_modules/@automattic/jetpack-base-styles/admin-page-layout.scss',
				import.meta.url
			)
		);
		expect( readFileSync( mixinPath, 'utf8' ) ).toContain(
			'.jp-admin-page > .jp-admin-page__content'
		);
	} );

	it( 'wraps children in the scrollable content hook when there is no header', () => {
		render(
			<AdminPage showHeader={ false }>
				<p>Page body</p>
			</AdminPage>
		);

		const content = screen.getByText( 'Page body' ).closest( '.jp-admin-page__content' );
		expect( content ).not.toBeNull();
		expect( content.parentElement ).toHaveClass( 'jp-admin-page' );
	} );

	it( 'wraps children in the scrollable content hook with the legacy header', () => {
		render(
			<AdminPage>
				<p>Page body</p>
			</AdminPage>
		);

		const content = screen.getByText( 'Page body' ).closest( '.jp-admin-page__content' );
		expect( content ).not.toBeNull();
		expect( content.parentElement ).toHaveClass( 'jp-admin-page' );
	} );

	it( 'renders the admin-ui page hook instead when a title is given', () => {
		render(
			<AdminPage title="Sample">
				<p>Page body</p>
			</AdminPage>
		);

		const body = screen.getByText( 'Page body' );
		expect( body.closest( '.jp-admin-page__page' ) ).not.toBeNull();
		expect( body.closest( '.jp-admin-page__content' ) ).toBeNull();
	} );
} );
