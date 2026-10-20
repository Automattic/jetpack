import { prepareProductData } from '../prepare-product-data';
import type { ProductSnakeCase } from '../../types';

it.each( [
	[ 'year', 348, 29 ],
	[ 'two years', 552, 23 ],
	[ 'month', 75, 75 ],
] )(
	'normalizes %s prices for the summary and term selector',
	( product_term, full_price, monthly ) => {
		const pricing = { product_term, full_price, discount_price: full_price };
		const product = {
			pricing_for_ui: { ...pricing, terms: [ pricing ] },
		} as unknown as ProductSnakeCase;
		const prepared = prepareProductData( product );
		expect( prepared.pricingForUi.fullPricePerMonth ).toBe( monthly );
		expect( prepared.pricingForUi.terms?.[ 0 ].fullPricePerMonth ).toBe( monthly );
		expect( prepared.pricingForUi.terms?.[ 0 ].fullPrice ).toBe( full_price );
	}
);
