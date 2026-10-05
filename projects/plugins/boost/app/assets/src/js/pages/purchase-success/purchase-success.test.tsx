import { render, screen } from '@testing-library/react';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { getUpgradeURL } from '$lib/stores/connection';
import PurchaseSuccess from './purchase-success';

jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( { useDataSync: jest.fn() } ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: () => 'https://jetpack.com/boost/',
	Button: () => null,
} ) );
jest.mock( '$layout/card-page/card-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '$lib/navigation/navigation-context', () => ( {
	useBoostNavigation: () => ( { returnToSettings: jest.fn() } ),
} ) );

it.each( [
	{ active: false, pending: false, writes: 1 },
	{ active: true, pending: true, writes: 0 },
] )(
	'preserves the legacy return with Cloud CSS active=$active',
	( { active, pending, writes } ) => {
		const enable = jest.fn();
		const clearNotice = jest.fn();
		jest.mocked( useDataSync ).mockImplementation( ( _namespace, key ) => {
			return (
				key === 'modules_state'
					? [ { data: { cloud_css: { active, available: true } } }, { mutate: enable } ]
					: [ { data: pending }, { mutate: clearNotice } ]
			) as never;
		} );
		Object.assign( globalThis, { Jetpack_Boost: { assetPath: '/', site: { host: 'other' } } } );

		const checkout = new URL( getUpgradeURL( 'example.com', true, '123' ) );
		expect( checkout.searchParams.get( 'redirect_to' ) ).toBe(
			'admin.php?page=jetpack-boost#/purchase-successful'
		);
		render( <PurchaseSuccess /> );
		expect( enable ).toHaveBeenCalledTimes( writes );
		const mutationOptions = expect.any( Object );
		expect( enable.mock.calls ).toEqual(
			writes ? [ [ { cloud_css: { active: true, available: true } }, mutationOptions ] ] : []
		);
		expect( clearNotice ).toHaveBeenCalledTimes( pending ? 1 : 0 );
		expect( clearNotice.mock.calls ).toEqual( pending ? [ [ false ] ] : [] );
		expect(
			screen.getAllByText( 'Congratulations! Your Jetpack Boost is Now Upgraded!' )
		).toHaveLength( 1 );
	}
);
