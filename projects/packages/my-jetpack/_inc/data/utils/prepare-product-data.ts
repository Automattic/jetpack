import mapObjectKeysToCamel from './to-camel';
import type { ProductCamelCase, ProductSnakeCase } from '../types';

const getFullPricePerMonth = ( product: ProductCamelCase ) => {
	return product.pricingForUi.productTerm === 'year'
		? Math.round( ( product.pricingForUi.fullPrice / 12 ) * 100 ) / 100
		: product.pricingForUi.fullPrice;
};

const getDiscountPricePerMonth = ( product: ProductCamelCase ) => {
	return product.pricingForUi.productTerm === 'year'
		? Math.round( ( product.pricingForUi.discountPrice / 12 ) * 100 ) / 100
		: product.pricingForUi.discountPrice;
};

export const prepareProductData = ( product: ProductSnakeCase ) => {
	// The mapObjectKeysToCamel is typed correctly, however we are adding new fields
	// to the product object that don't exist on the global state object
	// Therefore we still need to cast the object to the correct type
	const camelProduct = mapObjectKeysToCamel( product ) as ProductCamelCase;

	camelProduct.features = camelProduct.features || [];
	camelProduct.supportedProducts = camelProduct.supportedProducts || [];

	if ( camelProduct.pricingForUi ) {
		camelProduct.pricingForUi.fullPricePerMonth = getFullPricePerMonth( camelProduct );
		camelProduct.pricingForUi.discountPricePerMonth = getDiscountPricePerMonth( camelProduct );
	}

	return camelProduct;
};
