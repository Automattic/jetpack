import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LAST_TAB_COOKIE } from '../../../../last-tab-cookie.ts';

// Stubbed down to the props this adapter is responsible for handing TanStack.
const linkProps = jest.fn();
await jest.unstable_mockModule( '@wordpress/route', () => ( {
	Link: props => {
		linkProps( props );
		const { to, activeOptions, ...rest } = props;
		// A fragment href keeps the link role without jsdom attempting a document
		// navigation; the real Link routes client-side. `to` is asserted through
		// `linkProps`, not through the rendered anchor.
		return <a href="#" { ...rest } />;
	},
} ) );

const { default: RouteLink } = await import( '../route-link.tsx' );

beforeEach( () => {
	jest.clearAllMocks();
	const path = window.location.pathname.replace( /[^/]*$/, '' );
	document.cookie = `${ LAST_TAB_COOKIE }=; max-age=0; path=${ path }`;
} );

describe( 'RouteLink', () => {
	it( 'matches the active route exactly, so only one item reports aria-current', () => {
		render( <RouteLink href="/forms">Forms</RouteLink> );

		// TanStack appends its own `aria-current="page"` after admin-ui's, and its
		// default prefix matching would mark a second item current.
		expect( linkProps ).toHaveBeenCalledWith(
			expect.objectContaining( { to: '/forms', activeOptions: { exact: true } } )
		);
	} );

	it( 'forwards the anchor props admin-ui sets on the current item', () => {
		render(
			<RouteLink href="/forms" aria-current="page" className="nav-item">
				Forms
			</RouteLink>
		);

		const link = screen.getByRole( 'link', { name: 'Forms' } );
		expect( link ).toHaveAttribute( 'aria-current', 'page' );
		expect( link ).toHaveClass( 'nav-item' );
	} );

	it( 'remembers the section on a click, so the dashboard reopens on it', async () => {
		render( <RouteLink href="/responses/inbox">Responses</RouteLink> );

		await userEvent.click( screen.getByRole( 'link', { name: 'Responses' } ) );

		expect( document.cookie ).toContain( `${ LAST_TAB_COOKIE }=responses` );
	} );

	it( 'leaves the remembered section alone for an href that is not one', async () => {
		render( <RouteLink href="/responses/spam">Spam</RouteLink> );

		await userEvent.click( screen.getByRole( 'link', { name: 'Spam' } ) );

		expect( document.cookie ).not.toContain( LAST_TAB_COOKIE );
	} );
} );
