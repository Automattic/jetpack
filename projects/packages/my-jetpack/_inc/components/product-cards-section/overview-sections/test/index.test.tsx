import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import OverviewSections from '..';

let mockProducts: Record< string, { status: string } >;

jest.mock( '../../../../hooks/use-filtered-products', () => () => ( {
	filteredOwnedProducts: Object.keys( mockProducts ),
	isLoading: false,
} ) );
jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( { data: mockProducts } ),
} ) );
jest.mock( '../../../../data/products/use-product', () => () => ( { detail: undefined } ) );
jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {} ),
} ) );
jest.mock( '../../stats-card/use-stats-period', () => ( { useStatsPeriod: () => 'day' } ) );
jest.mock( '../../overview-item/product-item', () => ( { slug } ) => <p>{ slug }</p> );
jest.mock( '../../boost-card/overview', () => () => <p>boost</p> );

describe( 'OverviewSections status section', () => {
	it.each( [
		[ 'hides when its only row is the account Connect action', {}, [] ],
		[ 'keeps the rows that have a state', { boost: { status: 'active' } }, [ 'boost' ] ],
	] )( '%s', ( _, otherProducts, rows ) => {
		mockProducts = { 'jetpack-ai': { status: 'user_connection_error' }, ...otherProducts };
		render( <OverviewSections /> );

		expect( Boolean( screen.queryByText( 'What is my site status?' ) ) ).toBe( rows.length > 0 );
		expect( screen.queryByText( 'jetpack-ai' ) ).not.toBeInTheDocument();
		rows.forEach( row => expect( screen.getByText( row ) ).toBeInTheDocument() );
	} );
} );
