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

const paidProduct = ( slug: string, page: string, hasPaidPlanForProduct = true ) => ( {
	[ slug ]: {
		hasPaidPlanForProduct,
		status: 'active',
		manageUrl: `https://example.com/wp-admin/admin.php?page=${ page }`,
	},
} );

describe( 'usePaidMenuSync', () => {
	let fetchMock: jest.Mock;

	beforeEach( () => {
		window.myJetpackInitialState = {
			mainFeatures: { features: [ { product: 'backup', plan_driven: true } ] },
		} as never;
		fetchMock = jest.fn().mockResolvedValue( {
			ok: true,
			text: async () => sidebar( 'my-jetpack', 'jetpack-backup' ),
		} );
		global.fetch = fetchMock;
	} );

	it.each( [
		[
			'refreshes a sidebar drawn before the plan arrived',
			paidProduct( 'backup', 'jetpack-backup' ),
			sidebar( 'my-jetpack' ),
			1,
		],
		[
			'leaves a sidebar that already has the page',
			paidProduct( 'backup', 'jetpack-backup' ),
			sidebar( 'my-jetpack', 'jetpack-backup' ),
			0,
		],
		[
			'ignores a product without a plan',
			paidProduct( 'backup', 'jetpack-backup', false ),
			sidebar( 'my-jetpack' ),
			0,
		],
		[
			'ignores a paid product no plan-driven feature names',
			paidProduct( 'boost', 'jetpack-boost' ),
			sidebar( 'my-jetpack' ),
			0,
		],
	] )( '%s', async ( _case, products, html, fetches ) => {
		document.body.innerHTML = html;
		jest.mocked( useAllProducts ).mockReturnValue( { data: products } as never );

		renderHook( () => usePaidMenuSync() );
		await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( fetches ) );
	} );

	it( 'refreshes once per page view, even when another plan-driven page goes missing later', async () => {
		document.body.innerHTML = sidebar( 'my-jetpack' );
		jest
			.mocked( useAllProducts )
			.mockReturnValue( { data: paidProduct( 'backup', 'jetpack-backup' ) } as never );
		const { rerender } = renderHook( () => usePaidMenuSync() );
		await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( 1 ) );

		window.myJetpackInitialState = {
			mainFeatures: {
				features: [
					{ product: 'backup', plan_driven: true },
					{ product: 'scan', plan_driven: true },
				],
			},
		} as never;
		jest.mocked( useAllProducts ).mockReturnValue( {
			data: {
				...paidProduct( 'backup', 'jetpack-backup' ),
				...paidProduct( 'scan', 'jetpack-scan' ),
			},
		} as never );
		rerender();

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
	} );
} );
