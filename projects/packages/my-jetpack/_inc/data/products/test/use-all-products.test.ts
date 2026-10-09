import { renderHook } from '@testing-library/react';
import useSimpleQuery from '../../use-simple-query';
import { useAllProducts } from '../use-all-products';

jest.mock( '../../use-simple-query' );

it( 'withdraws cached offers after an API error while retaining paid-plan management', () => {
	window.myJetpackInitialState = {
		products: {
			items: {
				pro: {
					has_paid_plan_for_product: true,
					is_bundle: true,
					manage_paid_plan_purchase_url: 'https://example.org/manage',
					pricing_for_ui: { available: true, terms: [ { available: true } ] },
				},
			},
		},
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( useSimpleQuery ).mockReturnValue( {
		isLoading: false,
		isError: true,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useSimpleQuery > );

	const { result } = renderHook( useAllProducts );
	const pro = result.current.data.pro;
	expect( pro.pricingForUi.available ).toBe( false );
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
						pricing_for_ui: { available: true, terms: [ { available: true } ] },
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
		expect( window.myJetpackInitialState.products.items.pro.pricing_for_ui.available ).toBe( true );
	}
);
