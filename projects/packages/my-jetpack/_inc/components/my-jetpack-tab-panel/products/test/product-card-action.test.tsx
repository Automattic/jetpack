import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProductCamelCase } from '../../../../data/types';
import { MyJetpackModule } from '../../../../types';
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
	} );

	it( 'renders the activation toggle for the Forms product instead of a Learn more link', () => {
		render( <ProductCardAction product={ buildProduct() } module={ formsModule } /> );

		// Active product shows the "Active" badge and a toggle, not a "Learn more" button.
		expect( screen.getByText( 'Active' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /learn more/i } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'checkbox' ) ).toBeInTheDocument();
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

	it( 'reloads the page after deactivating Forms so the admin sidebar updates', () => {
		render( <ProductCardAction product={ buildProduct() } module={ formsModule } /> );

		fireEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockDeactivate ).toHaveBeenCalled();
		expect( reloadPage ).toHaveBeenCalled();
	} );

	it( 'reloads the page after activating Forms so the admin sidebar updates', () => {
		render(
			<ProductCardAction
				product={ buildProduct( { status: 'inactive' } ) }
				module={ formsModule }
			/>
		);

		fireEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockActivate ).toHaveBeenCalled();
		expect( reloadPage ).toHaveBeenCalled();
	} );
} );
