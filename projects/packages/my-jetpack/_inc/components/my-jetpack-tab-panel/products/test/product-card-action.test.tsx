import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ProductCamelCase } from '../../../../data/types';
import { MyJetpackModule } from '../../../../types';
import { setPendingSuccessNotice } from '../pending-notice';
import { ProductCardAction } from '../product-card-action';
import { reloadPage } from '../reload-page';

// These mocks invoke the per-call onSuccess so the reload handler is exercised.
const mockActivate = jest.fn( ( _vars, opts ) => opts?.onSuccess?.() );
const mockDeactivate = jest.fn( ( _vars, opts ) => opts?.onSuccess?.() );

// Mock the data hooks used by ProductCardAction / ActivationToggle so the
// component can render without the full data/provider stack.
jest.mock( '../../../../data/products/use-activate-plugins', () => ( {
	__esModule: true,
	default: () => ( { activate: mockActivate, isPending: false } ),
} ) );
jest.mock( '../../../../data/products/use-deactivate-plugins', () => ( {
	useDeactivatePlugins: () => ( { deactivate: mockDeactivate, isPending: false } ),
} ) );
jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => ( { isLoading: false, isRefetching: false } ),
} ) );
jest.mock( '../../../../hooks/use-interstitials-state', () => ( {
	useInterstitialsState: () => ( { data: {} } ),
} ) );
jest.mock( '../products-tracking-context', () => ( {
	useProductFiltersContext: () => ( { trackProductAction: jest.fn() } ),
} ) );
// window.location can't be mocked directly, so reloadPage is its own mockable wrapper.
jest.mock( '../reload-page' );
jest.mock( '../pending-notice' );

const buildProduct = ( overrides = {} ) =>
	( {
		slug: 'jetpack-forms',
		name: 'Forms',
		status: 'active',
		hasPaidPlanForProduct: false,
		...overrides,
	} ) as unknown as ProductCamelCase;

const formsModule = { available: true, activated: true } as unknown as MyJetpackModule;

describe( 'ProductCardAction', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.myJetpackInitialState = {
			myJetpackFlags: {},
		} as unknown as Window[ 'myJetpackInitialState' ];
	} );

	it( 'renders the activation toggle for the Forms product instead of a Learn more link', () => {
		render( <ProductCardAction product={ buildProduct() } module={ formsModule } /> );

		// Active product shows the "Active" badge and a toggle, not a "Learn more" button.
		expect( screen.getByText( 'Active' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /learn more/i } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'checkbox' ) ).toBeInTheDocument();
	} );

	it( 'renders the activation toggle for AI even when inactive, instead of a Learn more link', () => {
		// AI is the site-wide master switch: the card must show an inline on/off toggle
		// in both states rather than the "Learn more" upsell that routes to the pricing
		// interstitial. An inactive product with no paid plan would otherwise fall through
		// to the UpgradeAction ("Learn more") path.
		render(
			<ProductCardAction
				product={ buildProduct( { slug: 'jetpack-ai', name: 'AI', status: 'inactive' } ) }
				module={ formsModule }
			/>
		);

		expect( screen.queryByRole( 'button', { name: /learn more/i } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'checkbox' ) ).toBeInTheDocument();
	} );

	it( 'reflects the AI module active state, not product.status (free tier reports can_upgrade)', () => {
		// Jetpack AI on a free site reports status "can_upgrade" even when its module
		// is active. The toggle must follow the module's activated state, or it reads
		// "off" while AI is actually running.
		const activeModule = { available: true, activated: true } as unknown as MyJetpackModule;
		render(
			<ProductCardAction
				product={ buildProduct( { slug: 'jetpack-ai', name: 'AI', status: 'can_upgrade' } ) }
				module={ activeModule }
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
	} );

	it( 'reloads the page after toggling AI: the toggle reads module state the mutation does not update', async () => {
		// The AI toggle is driven by $module.activated (not product.status), and
		// the activate mutation only updates product.status — without a reload
		// the just-flipped toggle keeps showing the old state.
		const inactiveModule = { available: true, activated: false } as unknown as MyJetpackModule;
		render(
			<ProductCardAction
				product={ buildProduct( { slug: 'jetpack-ai', name: 'AI', status: 'inactive' } ) }
				module={ inactiveModule }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockActivate ).toHaveBeenCalled();
		expect( setPendingSuccessNotice ).toHaveBeenCalledWith(
			expect.stringContaining( 'activated' )
		);
		expect( reloadPage ).toHaveBeenCalled();
	} );

	it( 'renders the AI toggle for an ordinary visitor, with no proxy or flag', () => {
		render(
			<MemoryRouter>
				<ProductCardAction
					product={ buildProduct( { slug: 'jetpack-ai', name: 'AI', status: 'inactive' } ) }
					module={ formsModule }
				/>
			</MemoryRouter>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /learn more/i } ) ).not.toBeInTheDocument();
	} );

	it( 'renders an inert toggle for an AI card whose module data is missing', () => {
		render(
			<ProductCardAction
				product={ buildProduct( {
					slug: 'jetpack-ai',
					name: 'AI',
					status: 'active',
					hasPaidPlanForProduct: true,
				} ) }
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
	} );

	it( 'disables the toggle when the Forms module is unavailable', () => {
		const unavailableModule = { available: false, activated: false } as unknown as MyJetpackModule;
		render(
			<ProductCardAction
				product={ buildProduct( { status: 'inactive' } ) }
				module={ unavailableModule }
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
	} );

	it( 'routes a product with no paid plan to its Learn more interstitial', async () => {
		render(
			<MemoryRouter>
				<Routes>
					<Route
						path="/"
						element={
							<ProductCardAction
								product={ buildProduct( { slug: 'search', name: 'Search', status: 'active' } ) }
							/>
						}
					/>
					<Route path="/add-search" element={ <div>Search interstitial</div> } />
				</Routes>
			</MemoryRouter>
		);

		await userEvent.click( screen.getByRole( 'button', { name: /learn more/i } ) );

		expect( screen.getByText( 'Search interstitial' ) ).toBeInTheDocument();
	} );

	it( 'renders a Learn more link for an inactive product that already has a paid plan', () => {
		render(
			<MemoryRouter>
				<ProductCardAction
					product={ buildProduct( {
						slug: 'search',
						name: 'Search',
						status: 'inactive',
						hasPaidPlanForProduct: true,
					} ) }
				/>
			</MemoryRouter>
		);

		expect( screen.getByRole( 'button', { name: /learn more/i } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the activation toggle for a product whose standalone plugin is installed', () => {
		// An inactive status would otherwise reach the "Learn more" branch below.
		render(
			<MemoryRouter>
				<ProductCardAction
					product={ buildProduct( {
						slug: 'boost',
						name: 'Boost',
						status: 'inactive',
						hasPaidPlanForProduct: true,
						standalonePluginInfo: { isStandaloneInstalled: true, isStandaloneActive: true },
					} ) }
				/>
			</MemoryRouter>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect( screen.queryByRole( 'button', { name: /learn more/i } ) ).not.toBeInTheDocument();
	} );

	it( 'reloads the page after deactivating Forms so the admin sidebar updates', async () => {
		render( <ProductCardAction product={ buildProduct() } module={ formsModule } /> );

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockDeactivate ).toHaveBeenCalled();
		// Persists a notice so it survives the reload, then reloads.
		expect( setPendingSuccessNotice ).toHaveBeenCalledWith(
			expect.stringContaining( 'deactivated' )
		);
		expect( reloadPage ).toHaveBeenCalled();
	} );

	it( 'reloads the page after activating Forms so the admin sidebar updates', async () => {
		// Toggle starts off (module inactive), so clicking it activates.
		const inactiveModule = { available: true, activated: false } as unknown as MyJetpackModule;
		render(
			<ProductCardAction
				product={ buildProduct( { status: 'inactive' } ) }
				module={ inactiveModule }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockActivate ).toHaveBeenCalled();
		expect( setPendingSuccessNotice ).toHaveBeenCalledWith(
			expect.stringContaining( 'activated' )
		);
		expect( reloadPage ).toHaveBeenCalled();
	} );

	it( 'reloads the page after toggling VideoPress so the admin sidebar link updates', async () => {
		// The "Jetpack > VideoPress" sidebar item links to the VideoPress library
		// or to the My Jetpack activation interstitial depending on the module
		// state, so toggling it must force a page reload.
		render(
			<ProductCardAction
				product={ buildProduct( {
					slug: 'videopress',
					name: 'VideoPress',
					status: 'active',
					hasPaidPlanForProduct: true,
				} ) }
				module={ formsModule }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockDeactivate ).toHaveBeenCalled();
		expect( setPendingSuccessNotice ).toHaveBeenCalledWith(
			expect.stringContaining( 'deactivated' )
		);
		expect( reloadPage ).toHaveBeenCalled();
	} );

	it( 'does not reload the page when toggling a product with no admin menu changes', async () => {
		render(
			<ProductCardAction
				product={ buildProduct( {
					slug: 'search',
					name: 'Search',
					status: 'active',
					hasPaidPlanForProduct: true,
				} ) }
				module={ formsModule }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockDeactivate ).toHaveBeenCalled();
		expect( reloadPage ).not.toHaveBeenCalled();
	} );
} );
