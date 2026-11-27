import { render, screen } from '@testing-library/react';
import ProductOverviewItem from '../product-item';
import useStatusAction from '../use-status-action';

let mockStatus = 'active';
let mockHostPurchaseUrl: string | undefined;

jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: {
		name: 'AI',
		status: mockStatus,
		manageUrl: 'https://example.org/ai',
		hostPurchaseUrl: mockHostPurchaseUrl,
	},
	isLoading: false,
} ) );
jest.mock( '../../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [ 'jetpack-ai' ] },
} ) );
jest.mock( '../use-overview-load-event', () => () => undefined );
jest.mock( '../use-status-action', () =>
	jest.fn( () => ( {
		action: { label: 'Activate AI', onClick: jest.fn() },
		forcedOffReason: null,
	} ) )
);

describe( 'ProductOverviewItem', () => {
	it.each( [
		[ 'active', 'Increase usage', undefined, [ 'More about AI' ] ],
		[ 'can_upgrade', 'Increase usage', undefined, [ 'More about AI', 'Increase usage' ] ],
		[ 'can_upgrade', undefined, undefined, [ 'More about AI', 'Upgrade' ] ],
		[ 'can_upgrade', undefined, '', [ 'More about AI' ] ],
		[ 'module_disabled', 'Increase usage', undefined, [ 'Activate AI' ] ],
	] )(
		'offers the right links when %s with upgrade label %s and host URL %p',
		( status, upgradeLabel, hostPurchaseUrl, links ) => {
			mockStatus = status;
			mockHostPurchaseUrl = hostPurchaseUrl;
			render(
				<ProductOverviewItem
					slug="jetpack-ai"
					admin
					actionLabel="More about AI"
					upgradeLabel={ upgradeLabel }
				/>
			);

			expect(
				[ 'More about AI', 'Increase usage', 'Upgrade', 'Activate AI' ].filter( label =>
					screen.queryByText( label )
				)
			).toEqual( links );
		}
	);

	it( 'names the product by its name prop in place of its own', () => {
		mockStatus = 'active';
		render( <ProductOverviewItem slug="jetpack-ai" admin actionLabel="More" name="Jetpack AI" /> );

		expect( screen.getByText( 'Jetpack AI' ) ).toBeInTheDocument();
		expect( useStatusAction ).toHaveBeenLastCalledWith(
			'jetpack-ai',
			'Activate Jetpack AI',
			null,
			'Jetpack AI'
		);
	} );
} );
