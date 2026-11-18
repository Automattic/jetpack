import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useProduct from '../../../data/products/use-product';
import useSitePurchases from '../../../data/use-site-purchases';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { getConnectUrl } from '../../../utils/connect-url';
import PlansSection from '../index';

const NAMES = { myJetpackPlans: 'my_jetpack_plans' };
let mockConnectionFrom: typeof NAMES | undefined;
const mockRecordEvent = jest.fn();

jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../data/use-site-purchases' );
jest.mock( '../../../hooks/use-my-jetpack-connection' );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );
jest.mock( '../../../utils/connect-url', () => ( {
	getConnectUrl: jest.fn( () => 'https://wordpress.com/connect' ),
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
	getScriptData: () => ( { myJetpack: {} } ),
	getMyJetpackUrl: ( path = '' ) =>
		`https://example.org/wp-admin/admin.php?page=my-jetpack${ path }`,
} ) );
jest.mock( '@automattic/jetpack-connection', () => ( {
	get CONNECTION_FROM() {
		return mockConnectionFrom;
	},
} ) );

const mockUseProduct = useProduct as jest.MockedFunction< typeof useProduct >;
const mockUseSitePurchases = useSitePurchases as jest.MockedFunction< typeof useSitePurchases >;
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
	mockUseSitePurchases.mockReturnValue( {
		data: purchases,
		isLoading: false,
		isError: false,
	} as ReturnType< typeof useSitePurchases > );
};

const setUserConnected = ( isUserConnected: boolean ) => {
	mockUseMyJetpackConnection.mockReturnValue( {
		isSiteConnected: true,
		isUserConnected,
	} as ReturnType< typeof useMyJetpackConnection > );
};

describe( 'PlansSection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockConnectionFrom = NAMES;

		window.myJetpackInitialState = {
			userIsAdmin: true,
			loadAddLicenseScreen: '1',
		} as unknown as Window[ 'myJetpackInitialState' ];

		setUserConnected( true );

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
			setUserConnected( false );

			render( <PlansSection /> );

			expect(
				screen.getByRole( 'link', { name: 'Activate a license (requires a user connection)' } )
			).toBeInTheDocument();
		} );

		it( 'connects the user under the Plans name, then returns to the license screen', () => {
			setUserConnected( false );

			render( <PlansSection /> );

			expect( getConnectUrl ).toHaveBeenCalledWith(
				'my_jetpack_plans',
				'https://example.org/wp-admin/admin.php?page=my-jetpack#/add-license'
			);
			expect( screen.getByRole( 'link', { name: /Activate a license/ } ) ).toHaveAttribute(
				'href',
				'https://wordpress.com/connect'
			);
		} );

		it( 'connects as `my-jetpack` when the shared connection script predates CONNECTION_FROM', () => {
			mockConnectionFrom = undefined;
			setUserConnected( false );

			render( <PlansSection /> );

			expect( getConnectUrl ).toHaveBeenCalledWith( 'my-jetpack', expect.any( String ) );
		} );

		it.each( [
			[ 'connects the user first', false, { from: 'my_jetpack_plans' } ],
			[ 'opens the license screen directly', true, undefined ],
		] )( 'reports the name only on a click that %s', async ( _, isUserConnected, properties ) => {
			setUserConnected( isUserConnected );
			render( <PlansSection /> );
			const link = screen.getByRole( 'link', { name: /Activate a license/ } );
			link.addEventListener( 'click', event => event.preventDefault() );

			await userEvent.click( link );

			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_myjetpack_activate_license_click',
				properties
			);
		} );
	} );

	describe( 'the "View included features" link', () => {
		it( 'opens the included Features filter when the catalog includes a feature', () => {
			window.myJetpackInitialState.mainFeatures = {
				features: [ { included: true } ],
			} as MainFeaturesState;
			render( <PlansSection /> );

			expect( screen.getByRole( 'link', { name: 'View included features' } ) ).toHaveAttribute(
				'href',
				'https://example.org/wp-admin/admin.php?page=my-jetpack#/features?filter=included'
			);
		} );

		it.each( [ undefined, { features: [ { included: false } ] } ] )(
			'does not offer an empty included list even when there is a purchase (%s)',
			catalog => {
				setPurchases( [ buildPurchase( 'Domain registration' ) ] );
				window.myJetpackInitialState.mainFeatures = catalog as MainFeaturesState;
				render( <PlansSection /> );

				expect(
					screen.queryByRole( 'link', { name: 'View included features' } )
				).not.toBeInTheDocument();
			}
		);
	} );

	const HOST_PLANS = 'https://host.example/plans?site=a&back=b';
	const HOST_PURCHASES = 'https://host.example/purchases';
	const COMPLETE_UPSELL = [
		expect.stringContaining( 'Upgrade to Complete' ),
		expect.stringContaining( 'wordpress.com/checkout/123/jetpack_complete?' ),
	];

	it.each( [
		[
			'sends a site with Pro to Complete checkout',
			'jetpack_pro_yearly',
			{ purchase: '', manage: '' },
			[ COMPLETE_UPSELL ],
			[ 'https://example.org/manage' ],
			[ { product_slug: 'jetpack_complete' } ],
		],
		[
			'keeps the Complete upsell when the host answers only for manage',
			'jetpack_pro_yearly',
			{ purchase: '', manage: HOST_PURCHASES },
			[ COMPLETE_UPSELL ],
			[ HOST_PURCHASES ],
			[ { product_slug: 'jetpack_complete' } ],
		],
		[
			"sends a site with Pro to the host's plans, with no Complete upsell",
			'jetpack_pro_yearly',
			{ purchase: HOST_PLANS, manage: HOST_PURCHASES },
			[ [ expect.stringContaining( 'Upgrade your plan' ), HOST_PLANS ] ],
			[ HOST_PURCHASES ],
			[ {} ],
		],
		[
			"sends a site with no purchases to the host's plans, with nothing to manage",
			null,
			{ purchase: HOST_PLANS, manage: HOST_PURCHASES },
			[ [ expect.stringContaining( 'Upgrade your plan' ), HOST_PLANS ] ],
			[],
			[ {} ],
		],
		[
			'offers nothing to manage when the host hides the manage link',
			'jetpack_pro_yearly',
			{ purchase: HOST_PLANS, manage: false as const },
			[ [ expect.stringContaining( 'Upgrade your plan' ), HOST_PLANS ] ],
			[],
			[ {} ],
		],
		[
			"offers nothing to buy when the host has no plan above the site's",
			'jetpack_pro_yearly',
			{ purchase: false as const, manage: HOST_PURCHASES },
			[],
			[ HOST_PURCHASES ],
			[],
		],
	] )( '%s', async ( _, productSlug, planUrls, purchaseLinks, manageLinks, clicks ) => {
		window.myJetpackInitialState.blogID = '123';
		window.myJetpackInitialState.planUrls = planUrls;
		setPurchases(
			productSlug ? [ { ...buildPurchase( 'A plan' ), product_slug: productSlug } as Purchase ] : []
		);
		render( <PlansSection /> );
		const hrefs = ( name: RegExp ) =>
			screen.queryAllByRole( 'link', { name } ).map( link => link.getAttribute( 'href' ) );
		const links = screen.queryAllByRole( 'link', { name: /Purchase a plan|Upgrade/ } );
		links.forEach( link => link.addEventListener( 'click', event => event.preventDefault() ) );

		expect( links.map( link => [ link.textContent, link.getAttribute( 'href' ) ] ) ).toEqual(
			purchaseLinks
		);
		expect( hrefs( /Manage your plan/ ) ).toEqual( manageLinks );
		expect( screen.getByRole( 'link', { name: /Activate a license/ } ) ).toBeInTheDocument();
		await Promise.all( links.map( link => userEvent.click( link ) ) );
		expect( mockRecordEvent.mock.calls ).toEqual(
			clicks.map( properties => [ 'jetpack_myjetpack_plans_purchase_click', properties ] )
		);
	} );
} );
