import { render, screen } from '@testing-library/react';
import ProductOverviewItem from '../product-item';

let mockStatus = 'active';

jest.mock( '../../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: { name: 'AI', status: mockStatus, manageUrl: 'https://example.org/ai' },
	isLoading: false,
} ) );
jest.mock( '../../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [ 'jetpack-ai' ] },
} ) );
jest.mock( '../use-overview-load-event', () => () => undefined );
jest.mock( '../use-status-action', () => () => ( {
	action: { label: 'Activate AI', onClick: jest.fn() },
	forcedOffReason: null,
} ) );

describe( 'ProductOverviewItem', () => {
	it.each( [
		[ 'active', [ 'More about AI' ] ],
		[ 'can_upgrade', [ 'More about AI', 'Increase usage' ] ],
		[ 'module_disabled', [ 'Activate AI' ] ],
	] )( 'offers the right links when %s', ( status, links ) => {
		mockStatus = status;
		render(
			<ProductOverviewItem
				slug="jetpack-ai"
				admin
				actionLabel="More about AI"
				upgradeLabel="Increase usage"
			/>
		);

		expect(
			[ 'More about AI', 'Increase usage', 'Activate AI' ].filter( label =>
				screen.queryByText( label )
			)
		).toEqual( links );
	} );
} );
