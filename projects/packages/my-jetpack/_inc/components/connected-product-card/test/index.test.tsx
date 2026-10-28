import { render } from '@testing-library/react';
import ConnectedProductCard from '..';

const mockRefetch = jest.fn();
let mockIsRegistered = false;
let mockStatus = 'active';

jest.mock( '../../../hooks/use-my-jetpack-connection', () => ( {
	__esModule: true,
	default: () => ( { isRegistered: mockIsRegistered } ),
} ) );

jest.mock( '../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => ( { detail: { name: 'Backup', status: mockStatus }, refetch: mockRefetch } ),
} ) );

jest.mock( '../../product-card', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const renderCard = () => render( <ConnectedProductCard admin slug="backup" /> );

describe( 'ConnectedProductCard', () => {
	beforeEach( () => {
		mockRefetch.mockClear();
	} );

	it.each( [
		[ 'a connected site with a current status', true, 'active', 0 ],
		[ 'a disconnected site', false, 'needs_first_site_connection', 0 ],
		[ 'a status that predates the connection', true, 'needs_first_site_connection', 1 ],
	] )( 'on mount for %s', ( _, isRegistered, status, refetches ) => {
		mockIsRegistered = isRegistered;
		mockStatus = status;
		renderCard();
		expect( mockRefetch ).toHaveBeenCalledTimes( refetches );
	} );

	it( 'refetches once when the site connects while mounted', () => {
		mockIsRegistered = false;
		mockStatus = 'active';
		const { rerender } = renderCard();
		mockIsRegistered = true;
		rerender( <ConnectedProductCard admin slug="backup" /> );
		rerender( <ConnectedProductCard admin slug="backup" /> );
		expect( mockRefetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
