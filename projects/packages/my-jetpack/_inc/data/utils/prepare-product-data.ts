import mapObjectKeysToCamel from './to-camel';
import type { ProductCamelCase, ProductSnakeCase } from '../types';

const monthsByTerm: Record< string, number > = { year: 12, 'two years': 24 };

const preparePricing = ( pricing: ProductCamelCase[ 'pricingForUi' ] ) => {
	const months = monthsByTerm[ pricing.productTerm ] || 1;
	return {
		...pricing,
		fullPricePerMonth: Math.round( ( pricing.fullPrice / months ) * 100 ) / 100,
		discountPricePerMonth: Math.round( ( pricing.discountPrice / months ) * 100 ) / 100,
	};
};

export const prepareProductData = ( product: ProductSnakeCase ) => {
	// The mapObjectKeysToCamel is typed correctly, however we are adding new fields
	// to the product object that don't exist on the global state object
	// Therefore we still need to cast the object to the correct type
	const camelProduct = mapObjectKeysToCamel( product ) as ProductCamelCase;

	camelProduct.features = camelProduct.features || [];
	camelProduct.supportedProducts = camelProduct.supportedProducts || [];

	if ( camelProduct.pricingForUi ) {
		camelProduct.pricingForUi = preparePricing( camelProduct.pricingForUi );
		camelProduct.pricingForUi.terms = camelProduct.pricingForUi.terms?.map( term =>
			preparePricing( term as ProductCamelCase[ 'pricingForUi' ] )
		);
	}

	return camelProduct;
};
