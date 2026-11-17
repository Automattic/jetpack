import mapObjectKeysToCamel from './to-camel';
import type { ProductCamelCase, ProductSnakeCase } from '../types';

const monthsByTerm: Record< string, number > = { year: 12, 'two years': 24 };

// A missing or unusable catalog price stays undefined instead of NaN, so ProductPrice shows no amount for it.
const rawPricePerMonth = ( price: number | null | undefined, months: number ) => {
	if ( price == null ) {
		return undefined;
	}
	const monthly = price / months;
	return Number.isFinite( monthly ) ? monthly : undefined;
};

const perMonth = ( price: number | null | undefined, months: number ) => {
	const monthly = rawPricePerMonth( price, months );
	return monthly == null ? undefined : Math.round( monthly * 100 ) / 100;
};

// Tier prices are not rounded: that would change the "% off" figure.
export const tierPricePerMonth = ( price: number | null | undefined ) =>
	rawPricePerMonth( price, 12 );

const preparePricing = ( pricing: ProductCamelCase[ 'pricingForUi' ] ) => {
	const months = monthsByTerm[ pricing.productTerm ] || 1;
	return {
		...pricing,
		fullPricePerMonth: perMonth( pricing.fullPrice, months ),
		discountPricePerMonth: perMonth( pricing.discountPrice, months ),
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
