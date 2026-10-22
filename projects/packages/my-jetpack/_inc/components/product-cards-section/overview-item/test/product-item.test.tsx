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
		[ 'active', 'Increase usage', [ 'More about AI' ] ],
		[ 'can_upgrade', 'Increase usage', [ 'More about AI', 'Increase usage' ] ],
		[ 'can_upgrade', undefined, [ 'More about AI', 'Upgrade' ] ],
		[ 'module_disabled', 'Increase usage', [ 'Activate AI' ] ],
	] )( 'offers the right links when %s with upgrade label %s', ( status, upgradeLabel, links ) => {
		mockStatus = status;
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
	} );
} );
