import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { PRODUCT_STATUSES } from '../../../constants';
import ActionButton from '../index';

const mockUseProduct = jest.fn();
const received: Array< Record< string, unknown > > = [];

// Recorded at the boundary: @wordpress/ui resolves the variant internally, so the
// rendered markup carries no attribute a test could read it back from.
jest.mock( '../secondary-button', () => ( {
	__esModule: true,
	default: ( props: Record< string, unknown > ) => {
		received.push( props );
		return <button type="button">{ props.label as string }</button>;
	},
} ) );

jest.mock( '../../../data/products/use-product', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUseProduct( ...args ),
} ) );

jest.mock( '../../../data/products/use-products-by-ownership', () => {
	const result = { data: { ownedProducts: [] } };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../data/products/use-activate-plugins', () => {
	const result = { activate: () => {}, isPending: false };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../data/products/use-install-plugins', () => {
	const result = { install: () => {}, isPending: false };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../hooks/use-my-jetpack-connection', () => {
	const result = { siteIsRegistering: false, isRegistered: true, isUserConnected: true };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../hooks/use-my-jetpack-navigate', () => {
	const navigate = () => {};
	return { __esModule: true, default: () => navigate };
} );

jest.mock( '../../../hooks/use-analytics', () => {
	const result = { recordEvent: () => {} };
	return { __esModule: true, default: () => result };
} );

const variantFor = ( status: string, variant?: 'primary' | 'secondary' ) => {
	received.length = 0;
	mockUseProduct.mockReturnValue( {
		detail: {
			status,
			manageUrl: 'https://example.org/manage',
			purchaseUrl: 'https://example.org/purchase',
			requiresUserConnection: false,
		},
		isLoading: false,
		isRefetching: false,
	} );

	render( <ActionButton slug="videopress" variant={ variant } /> );

	return received[ received.length - 1 ]?.variant;
};

describe( 'ActionButton variant override', () => {
	it( 'keeps each status\'s own variant when none is given', () => {
		expect( variantFor( PRODUCT_STATUSES.ABSENT ) ).toBe( 'primary' );
		expect( variantFor( PRODUCT_STATUSES.ACTIVE ) ).toBe( 'secondary' );
	} );

	it( 'forces one variant across statuses when given', () => {
		expect( variantFor( PRODUCT_STATUSES.ABSENT, 'secondary' ) ).toBe( 'secondary' );
		expect( variantFor( PRODUCT_STATUSES.CAN_UPGRADE, 'secondary' ) ).toBe( 'secondary' );
		expect( variantFor( PRODUCT_STATUSES.NEEDS_PLAN, 'secondary' ) ).toBe( 'secondary' );
	} );
} );
