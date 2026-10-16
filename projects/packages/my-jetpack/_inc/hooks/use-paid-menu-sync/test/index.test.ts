import { renderHook, waitFor } from '@testing-library/react';
import { useAllProducts } from '../../../data/products/use-all-products';
import { usePaidMenuSync } from '../index';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );
jest.mock( '../../../data/products/use-all-products', () => ( { useAllProducts: jest.fn() } ) );

const sidebar = ( ...pages: string[] ) =>
	`<ul id="adminmenu"><li id="toplevel_page_jetpack"><a href="admin.php?page=my-jetpack">Jetpack</a><ul class="wp-submenu">${ pages
		.map( slug => `<li><a href="admin.php?page=${ slug }">${ slug }</a></li>` )
		.join( '' ) }</ul></li></ul>`;

const backup = ( hasPaidPlanForProduct: boolean ) => ( {
	backup: {
		hasPaidPlanForProduct,
		status: 'active',
		manageUrl: 'https://example.com/wp-admin/admin.php?page=jetpack-backup',
	},
} );

describe( 'usePaidMenuSync', () => {
	let fetchMock: jest.Mock;

	beforeEach( () => {
		fetchMock = jest.fn().mockResolvedValue( {
			ok: true,
			text: async () => sidebar( 'my-jetpack', 'jetpack-backup' ),
		} );
		global.fetch = fetchMock;
	} );

	it.each( [
		[ 'refreshes a sidebar drawn before the plan arrived', true, sidebar( 'my-jetpack' ), 1 ],
		[
			'leaves a sidebar that already has the page',
			true,
			sidebar( 'my-jetpack', 'jetpack-backup' ),
			0,
		],
		[ 'ignores a product without a plan', false, sidebar( 'my-jetpack' ), 0 ],
	] )( '%s', async ( _case, paid, html, fetches ) => {
		document.body.innerHTML = html;
		jest.mocked( useAllProducts ).mockReturnValue( { data: backup( paid ) } as never );

		const { rerender } = renderHook( () => usePaidMenuSync() );
		await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( fetches ) );

		// Once per page view, even if the menu never gains the page.
		rerender();
		expect( fetchMock ).toHaveBeenCalledTimes( fetches );
	} );
} );
