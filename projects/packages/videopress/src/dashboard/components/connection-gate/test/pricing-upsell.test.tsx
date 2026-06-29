import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PricingUpsell from '../pricing-upsell';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-connection/hooks/use-product-checkout-workflow', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

// Render the jetpack-components pricing primitives as light passthroughs so the
// test exercises the upsell's data/CTA wiring without pulling the real (heavy)
// components and their transitive dependencies into jsdom.
jest.mock( '@automattic/jetpack-components/pricing-table', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	PricingTableColumn: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	PricingTableHeader: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	PricingTableItem: () => null,
} ) );
jest.mock( '@automattic/jetpack-components/product-price', () => ( {
	__esModule: true,
	default: () => <div>price</div>,
} ) );
jest.mock( '@automattic/jetpack-components/button', () => ( {
	__esModule: true,
	default: ( { children, onClick }: { children: ReactNode; onClick?: () => void } ) => (
		<button onClick={ onClick }>{ children }</button>
	),
} ) );

const mockUseConnection = useConnection as jest.Mock;
const mockCheckoutWorkflow = useProductCheckoutWorkflow as jest.Mock;

const PRICING = {
	title: 'High quality, ad-free video',
	features: [
		'1TB of storage',
		'Built into WordPress editor',
		'Ad-free player',
		'Unlimited users',
	],
	yearly: {
		slug: 'jetpack_videopress',
		name: 'VideoPress',
		price: 60,
		priceByMonth: 5,
		currency: 'USD',
	},
};

const setPricing = ( pricing: unknown ) => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE = {
		siteData: { adminUrl: 'https://example.com/wp-admin/' },
		jetpackStatus: { calypsoSlug: 'example.com' },
		pricing,
	};
};

let mockRun: jest.Mock;
let mockRegisterSite: jest.Mock;

describe( 'PricingUpsell', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockRun = jest.fn();
		mockRegisterSite = jest.fn();
		mockCheckoutWorkflow.mockReturnValue( { run: mockRun, hasCheckoutStarted: false } );
		mockUseConnection.mockReturnValue( {
			handleRegisterSite: mockRegisterSite,
			userIsConnecting: false,
		} );
		setPricing( PRICING );
	} );

	it( 'drives the checkout workflow with the yearly product slug and redirect', () => {
		render( <PricingUpsell /> );

		expect( mockCheckoutWorkflow ).toHaveBeenCalledWith(
			expect.objectContaining( {
				productSlug: 'jetpack_videopress',
				// Relative to wp-admin; the REST endpoint makes it absolute via
				// `admin_url()`. An absolute URL here would be doubled and 404.
				redirectUrl: 'admin.php?page=jetpack-videopress',
				siteSuffix: 'example.com',
				from: 'jetpack-videopress',
			} )
		);
	} );

	it( 'runs checkout on "Get VideoPress" and registers the site on "Start for free"', async () => {
		const user = userEvent.setup();
		render( <PricingUpsell /> );

		await user.click( screen.getByRole( 'button', { name: 'Get VideoPress' } ) );
		expect( mockRun ).toHaveBeenCalledTimes( 1 );

		await user.click( screen.getByRole( 'button', { name: 'Start for free' } ) );
		expect( mockRegisterSite ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders nothing when pricing data is absent', () => {
		setPricing( undefined );
		const { container } = render( <PricingUpsell /> );
		expect( container ).toBeEmptyDOMElement();
	} );
} );
