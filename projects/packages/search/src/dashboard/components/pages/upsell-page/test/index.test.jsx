let mockSelectMethods;

jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children } ) => <div>{ children }</div>,
	AdminSectionHero: ( { children } ) => <div>{ children }</div>,
	Button: ( { children } ) => <button>{ children }</button>,
	Col: ( { children } ) => <div>{ children }</div>,
	Container: ( { children } ) => <div>{ children }</div>,
	PricingCard: () => <div data-testid="pricing-card" />,
	ProductPrice: ( { children } ) => <div>{ children }</div>,
	PricingTable: ( { items, children } ) => (
		<div data-testid="pricing-table">
			<ul>
				{ items.map( item => (
					<li key={ item.name }>{ item.name }</li>
				) ) }
			</ul>
			{ children }
		</div>
	),
	PricingTableColumn: ( { children, primary } ) => (
		<div data-testid={ primary ? 'col-paid' : 'col-free' }>{ children }</div>
	),
	PricingTableHeader: ( { children } ) => <div>{ children }</div>,
	PricingTableItem: ( { isIncluded } ) => (
		<div data-testid={ isIncluded ? 'pti-included' : 'pti-excluded' } />
	),
	PricingTableContext: { Provider: ( { children } ) => <div>{ children }</div> },
	IconTooltip: ( { children } ) => <div>{ children }</div>,
	ThemeProvider: ( { children } ) => <div>{ children }</div>,
	getUserLocale: () => 'en',
} ) );

jest.mock( '@automattic/jetpack-api', () => ( { setApiNonce: jest.fn() } ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	ConnectionError: () => <div data-testid="connection-error" />,
	useConnectionErrorNotice: () => ( { hasConnectionError: false } ),
} ) );

jest.mock( '@automattic/number-formatters', () => ( {
	formatNumberCompact: n => String( n ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children } ) => <button>{ children }</button>,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { fetchSearchPlanInfo: jest.fn( () => Promise.resolve( {} ) ) } ),
	useSelect: callback => callback( () => mockSelectMethods ),
} ) );

jest.mock( '@wordpress/element', () => ( {
	createInterpolateElement: text => text,
} ) );

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin' } ) );
jest.mock( 'components/loading', () => () => <div data-testid="loading" /> );
jest.mock( 'components/price', () => () => <span data-testid="price" /> );
jest.mock( 'components/search-promotion', () => () => <div data-testid="search-promotion" /> );
jest.mock( 'hooks/use-product-checkout-workflow', () => () => ( {
	run: jest.fn(),
	hasCheckoutStarted: false,
} ) );

import { render, screen } from '@testing-library/react';
import UpsellPage from '../index';

const createSelectMethods = ( { isSearchBlocksEnabled = false } = {} ) => ( {
	getAPINonce: jest.fn( () => 'nonce' ),
	isNewPricing202208: jest.fn( () => true ),
	isWpcom: jest.fn( () => false ),
	getSiteAdminUrl: jest.fn( () => 'https://example.com/wp-admin/' ),
	getSearchPricing: jest.fn( () => ( {} ) ),
	getCalypsoSlug: jest.fn( () => 'example.com' ),
	getBlogId: jest.fn( () => 123 ),
	isResolving: jest.fn( () => false ),
	hasStartedResolution: jest.fn( () => true ),
	getPriceBefore: jest.fn( () => 120 ),
	getPriceAfter: jest.fn( () => 120 ),
	getPriceCurrencyCode: jest.fn( () => 'USD' ),
	getPricingDiscountPercentage: jest.fn( () => 0 ),
	getPaidRecordsLimit: jest.fn( () => 10000 ),
	getPaidRequestsLimit: jest.fn( () => 10000 ),
	getAdditionalUnitPrice: jest.fn( () => 1 ),
	getAdditionalUnitQuantity: jest.fn( () => 1000 ),
	isSearchBlocksEnabled: jest.fn( () => isSearchBlocksEnabled ),
} );

describe( 'UpsellPage pricing grid — Search blocks gating', () => {
	test( 'hides the Search blocks rows when the flag is disabled', () => {
		mockSelectMethods = createSelectMethods( { isSearchBlocksEnabled: false } );

		render( <UpsellPage /> );

		expect( screen.queryByText( 'Jetpack Search blocks' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Embedded search page' ) ).not.toBeInTheDocument();
		// Sanity: the base grid still renders.
		expect( screen.getByText( 'Spelling correction' ) ).toBeInTheDocument();
	} );

	test( 'shows the Search blocks rows when the flag is enabled', () => {
		mockSelectMethods = createSelectMethods( { isSearchBlocksEnabled: true } );

		render( <UpsellPage /> );

		expect( screen.getByText( 'Jetpack Search blocks' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Embedded search page' ) ).toBeInTheDocument();
	} );
} );

describe( 'UpsellPage pricing grid — AI Answers (paid-only)', () => {
	test( 'always shows the AI Answers row regardless of the Search blocks gate', () => {
		mockSelectMethods = createSelectMethods( { isSearchBlocksEnabled: false } );
		const { unmount } = render( <UpsellPage /> );
		expect( screen.getByText( 'AI Answers (Preview)' ) ).toBeInTheDocument();
		unmount();

		mockSelectMethods = createSelectMethods( { isSearchBlocksEnabled: true } );
		render( <UpsellPage /> );
		expect( screen.getByText( 'AI Answers (Preview)' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Jetpack Search blocks' ) ).toBeInTheDocument();
	} );
} );
