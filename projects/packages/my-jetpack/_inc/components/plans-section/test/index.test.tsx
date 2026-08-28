import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import PlansSection from '../index';

jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../data/use-simple-query' );
jest.mock( '../../../hooks/use-my-jetpack-connection' );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../../utils/get-manage-your-plan-url', () => ( {
	__esModule: true,
	default: () => 'https://example.org/manage',
} ) );
jest.mock( '../../../utils/get-purchase-plan-url', () => ( {
	__esModule: true,
	default: () => 'https://example.org/purchase',
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getMyJetpackUrl: ( path = '' ) =>
		`https://example.org/wp-admin/admin.php?page=my-jetpack${ path }`,
} ) );
jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: () => 'https://example.org/connect',
} ) );

const mockUseProduct = useProduct as jest.MockedFunction< typeof useProduct >;
const mockUseSimpleQuery = useSimpleQuery as jest.MockedFunction< typeof useSimpleQuery >;
const mockUseMyJetpackConnection = useMyJetpackConnection as jest.MockedFunction<
	typeof useMyJetpackConnection
>;

const buildPurchase = ( product_name: string ): Purchase =>
	( {
		ID: 1,
		product_name,
		product_slug: 'jetpack_security_t1_yearly',
		partner_name: null,
		partner_slug: null,
		subscribed_date: '2025-01-01T00:00:00+00:00',
		expiry_date: '2026-01-01T00:00:00+00:00',
		expiry_status: 'active',
		domain: 'example.org',
	} ) as unknown as Purchase;

const setPurchases = ( purchases: Purchase[] ) => {
	mockUseSimpleQuery.mockReturnValue( {
		data: purchases,
		isLoading: false,
		isError: false,
	} as ReturnType< typeof useSimpleQuery > );
};

describe( 'PlansSection', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		window.myJetpackInitialState = {
			userIsAdmin: true,
			loadAddLicenseScreen: '1',
		} as unknown as Window[ 'myJetpackInitialState' ];

		mockUseMyJetpackConnection.mockReturnValue( {
			isSiteConnected: true,
			isUserConnected: true,
		} as ReturnType< typeof useMyJetpackConnection > );

		mockUseProduct.mockReturnValue( {
			detail: { hasPaidPlanForProduct: false },
		} as ReturnType< typeof useProduct > );

		setPurchases( [] );
	} );

	describe( 'the license activation link', () => {
		it( 'reads "Activate a license" when the site has no purchases', () => {
			render( <PlansSection /> );

			expect( screen.getByRole( 'link', { name: 'Activate a license' } ) ).toBeInTheDocument();
		} );

		// The label used to read "Activate a new license" whenever the site had a plan, which was
		// wrong: a plan is not a license, so sites with no activated licenses were told otherwise.
		it( 'still reads "Activate a license" when the site already has purchases', () => {
			setPurchases( [ buildPurchase( 'Jetpack Security' ) ] );

			render( <PlansSection /> );

			expect( screen.getByRole( 'link', { name: 'Activate a license' } ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Activate a new license' ) ).not.toBeInTheDocument();
		} );

		it( 'flags the missing user connection when the user is not connected', () => {
			mockUseMyJetpackConnection.mockReturnValue( {
				isSiteConnected: true,
				isUserConnected: false,
			} as ReturnType< typeof useMyJetpackConnection > );

			render( <PlansSection /> );

			expect(
				screen.getByRole( 'link', { name: 'Activate a license (requires a user connection)' } )
			).toBeInTheDocument();
		} );
	} );
} );
