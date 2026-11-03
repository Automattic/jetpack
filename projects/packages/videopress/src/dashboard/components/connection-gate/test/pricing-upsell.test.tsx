import analytics from '@automattic/jetpack-analytics';
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import PricingUpsell from '../pricing-upsell';
import type { ReactNode, Ref } from 'react';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

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
jest.mock( '@automattic/jetpack-components/button', () => {
	const { forwardRef } = jest.requireActual( 'react' );
	return {
		__esModule: true,
		default: forwardRef(
			(
				{ children, onClick }: { children: ReactNode; onClick?: () => void },
				ref: Ref< HTMLButtonElement >
			) => (
				<button ref={ ref } onClick={ onClick }>
					{ children }
				</button>
			)
		),
	};
} );

const mockUseConnection = useConnection as jest.Mock;
const mockCheckoutWorkflow = useProductCheckoutWorkflow as jest.Mock;
const recordEvent = analytics.tracks.recordEvent as jest.Mock;
const originalObserver = window.IntersectionObserver;
let observerCallback: IntersectionObserverCallback;
let observe: jest.Mock;

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
		jest.spyOn( document, 'visibilityState', 'get' ).mockReturnValue( 'visible' );
		observe = jest.fn();
		window.IntersectionObserver = jest.fn( callback => {
			observerCallback = callback;
			return { observe, disconnect: jest.fn() };
		} ) as unknown as typeof IntersectionObserver;
		mockRun = jest.fn();
		mockRegisterSite = jest.fn().mockResolvedValue( undefined );
		mockCheckoutWorkflow.mockReturnValue( { run: mockRun, hasCheckoutStarted: false } );
		mockUseConnection.mockReturnValue( {
			handleRegisterSite: mockRegisterSite,
			userIsConnecting: false,
		} );
		setPricing( PRICING );
	} );

	afterEach( () => {
		window.IntersectionObserver = originalObserver;
		jest.restoreAllMocks();
	} );

	it( 'counts exposure of the paid button, without claiming a known video count', () => {
		render( <PricingUpsell /> );
		const button = screen.getByRole( 'button', { name: 'Get VideoPress' } );
		expect( observe ).toHaveBeenCalledWith( button );
		expect( recordEvent ).not.toHaveBeenCalled();
		act( () =>
			observerCallback(
				[
					{
						target: button,
						isIntersecting: true,
						intersectionRatio: 1,
					} as IntersectionObserverEntry,
				],
				{} as IntersectionObserver
			)
		);
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
			location: 'pricing_upsell',
			video_count_known: false,
		} );
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
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upgrade_trigger_link_click', {
			location: 'pricing_upsell',
		} );
		expect( recordEvent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockRun.mock.invocationCallOrder[ 0 ]
		);

		await user.click( screen.getByRole( 'button', { name: 'Start for free' } ) );
		expect( mockRegisterSite ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows an error snackbar when checkout fails', () => {
		dispatch( noticesStore ).removeAllNotices();
		const { rerender } = render( <PricingUpsell /> );
		expect( select( noticesStore ).getNotices() ).toHaveLength( 0 );

		mockCheckoutWorkflow.mockReturnValue( {
			run: mockRun,
			hasCheckoutStarted: false,
			checkoutError: 'Registration failed',
		} );
		rerender( <PricingUpsell /> );

		expect( select( noticesStore ).getNotices() ).toEqual( [
			expect.objectContaining( {
				status: 'error',
				type: 'snackbar',
				content: 'Checkout could not start. Please try again.',
			} ),
		] );
	} );

	it( 'explains why registering the site failed', () => {
		mockUseConnection.mockReturnValue( {
			handleRegisterSite: mockRegisterSite,
			userIsConnecting: false,
			registrationError: { response: { code: 'site_inaccessible_403', message: 'Blocked.' } },
		} );
		render( <PricingUpsell /> );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( /blocked WordPress\.com/ );
	} );

	it( 'renders nothing when pricing data is absent', () => {
		setPricing( undefined );
		const { container } = render( <PricingUpsell /> );
		expect( container ).toBeEmptyDOMElement();
		expect( observe ).not.toHaveBeenCalled();
		expect( recordEvent ).not.toHaveBeenCalled();
	} );
} );
