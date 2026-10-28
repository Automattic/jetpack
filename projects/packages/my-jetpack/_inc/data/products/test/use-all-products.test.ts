import { renderHook } from '@testing-library/react';
import useSimpleQuery from '../../use-simple-query';
import { useAllProducts } from '../use-all-products';

jest.mock( '../../use-simple-query' );

it( 'retains launched routing while refreshing a previously loaded Pro offer', () => {
	const pro = { is_bundle: true, pricing_for_ui: { available: true, catalog_available: true } };
	window.myJetpackInitialState = {
		products: { items: { pro } },
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( useSimpleQuery ).mockReturnValue( {
		data: { pro },
		isLoading: false,
		isRefetching: true,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useSimpleQuery > );
	const { result } = renderHook( useAllProducts );
	expect( result.current.data.pro.pricingForUi.catalogAvailable ).toBe( true );
	expect( result.current.data.pro.pricingForUi.available ).toBe( true );
} );

it.each( [
	{ isLoading: true, isError: false },
	{ isLoading: false, isError: true },
	{ isLoading: false, isError: false, data: {} },
] )( 'preserves existing offers while only Pro requires a fresh catalog: %j', response => {
	window.myJetpackInitialState = {
		products: {
			items: {
				security: { is_bundle: true, pricing_for_ui: { available: true } },
				growth: { is_bundle: true, pricing_for_ui: { available: true } },
				complete: { is_bundle: true, pricing_for_ui: { available: true } },
				pro: {
					is_bundle: true,
					pricing_for_ui: { available: true, catalog_available: true },
				},
			},
		},
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( useSimpleQuery ).mockReturnValue( {
		...response,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useSimpleQuery > );
	const { result } = renderHook( useAllProducts );
	for ( const slug of [ 'security', 'growth', 'complete' ] ) {
		expect( result.current.data[ slug ].pricingForUi.available ).toBe( true );
	}
	expect( result.current.data.pro.pricingForUi.catalogAvailable ).toBe( false );
	expect( result.current.data.pro.pricingForUi.available ).toBe( false );
} );

it( 'does not enable rollout or sales from server data before the catalog query finishes', () => {
	window.myJetpackInitialState = {
		products: {
			items: {
				pro: {
					is_bundle: true,
					pricing_for_ui: { available: true, catalog_available: true },
				},
			},
		},
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( useSimpleQuery ).mockReturnValue( {
		isLoading: true,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useSimpleQuery > );
	const { result } = renderHook( useAllProducts );
	expect( result.current.data.pro.pricingForUi.catalogAvailable ).toBe( false );
	expect( result.current.data.pro.pricingForUi.available ).toBe( false );
	expect( useSimpleQuery ).toHaveBeenLastCalledWith(
		expect.objectContaining( { options: expect.objectContaining( { enabled: true } ) } )
	);
} );

it( 'withdraws cached offers after an API error while retaining paid-plan management', () => {
	window.myJetpackInitialState = {
		products: {
			items: {
				pro: {
					has_paid_plan_for_product: true,
					is_bundle: true,
					manage_paid_plan_purchase_url: 'https://example.org/manage',
					pricing_for_ui: {
						available: true,
						catalog_available: true,
						terms: [ { available: true } ],
					},
				},
			},
		},
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( useSimpleQuery ).mockReturnValue( {
		data: window.myJetpackInitialState.products.items,
		isLoading: false,
		isError: true,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useSimpleQuery > );

	const { result } = renderHook( useAllProducts );
	const pro = result.current.data.pro;
	expect( pro.pricingForUi.available ).toBe( false );
	expect( pro.pricingForUi.catalogAvailable ).toBe( false );
	expect( pro.pricingForUi.terms?.[ 0 ].available ).toBe( false );
	expect( pro.hasPaidPlanForProduct ).toBe( true );
	expect( pro.managePaidPlanPurchaseUrl ).toBe( 'https://example.org/manage' );
	expect( window.myJetpackInitialState.products.items.pro.pricing_for_ui.available ).toBe( true );
} );

it.each( [ undefined, {}, { pricing_for_ui: {} }, { pricing_for_ui: { available: 'yes' } } ] )(
	'withdraws a cached offer when a successful response omits strict availability: %j',
	freshProduct => {
		window.myJetpackInitialState = {
			products: {
				items: {
					pro: {
						is_bundle: true,
						pricing_for_ui: {
							available: true,
							catalog_available: true,
							terms: [ { available: true } ],
						},
					},
				},
			},
		} as unknown as Window[ 'myJetpackInitialState' ];
		jest.mocked( useSimpleQuery ).mockReturnValue( {
			data: freshProduct === undefined ? {} : { pro: freshProduct },
			isLoading: false,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useSimpleQuery > );

		const { result } = renderHook( useAllProducts );
		expect( result.current.data.pro.pricingForUi.available ).toBe( false );
		expect( result.current.data.pro.pricingForUi.catalogAvailable ).toBe( false );
		expect( window.myJetpackInitialState.products.items.pro.pricing_for_ui.available ).toBe( true );
	}
);

it( 'keeps the catalog gate on for a customer whose Pro change requires support', () => {
	window.myJetpackInitialState = {
		products: { items: { pro: { is_bundle: true, pricing_for_ui: { available: false } } } },
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( useSimpleQuery ).mockReturnValue( {
		data: { pro: { pricing_for_ui: { available: false, catalog_available: true } } },
		isLoading: false,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useSimpleQuery > );
	const { result } = renderHook( useAllProducts );
	expect( result.current.data.pro.pricingForUi.catalogAvailable ).toBe( true );
	expect( result.current.data.pro.pricingForUi.available ).toBe( false );
} );

it( 'keeps server-rendered bundle offers when offline mode disables the query', () => {
	window.myJetpackInitialState = {
		isOfflineFeatures: true,
		products: { items: { security: { is_bundle: true, pricing_for_ui: { available: true } } } },
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( useSimpleQuery ).mockReturnValue( {
		isLoading: false,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useSimpleQuery > );
	const { result } = renderHook( useAllProducts );
	expect( result.current.data.security.pricingForUi.available ).toBe( true );
	expect( useSimpleQuery ).toHaveBeenLastCalledWith(
		expect.objectContaining( {
			options: expect.objectContaining( { enabled: false } ),
		} )
	);
} );
