import { Purchase, MyJetpackProduct, SiteFeatures } from '../types';

/**
 * Decorates products using information from the purchases and site features
 *
 * @param products
 * @param purchases
 * @param site_features
 */

export const decorateProducts = (
	products: Array< MyJetpackProduct >,
	purchases: Array< Purchase >,
	site_features: SiteFeatures
) => {
	// --
	// decorate the product objects with derived attributes
	products.map( product => {
		let decorator = null;
		// If the product has a specific decorator with overrides defined, use that
		// Otherwise, use the base decorator class
		if ( productMapBySlug[ product.slug ] ) {
			decorator = new productMapBySlug[ product.slug ]( product, purchases, site_features );
		} else {
			decorator = new ProductDecorator( product, purchases, site_features );
		}

		// extend the product with the additional attributes & methods
		return decorator.decorateProduct();
	} );

	// return decorated products
	return products;
};

class ProductDecorator {
	product = null;
	purchases = null;
	site_features = null;

	constructor(
		product: MyJetpackProduct,
		purchases: Array< Purchase >,
		site_features: SiteFeatures
	) {
		this.product = product;
		this.purchases = purchases;
		this.site_features = site_features;
	}

	siteHasFeature = ( feature: string ) => {
		// check against stie features list
		return !! feature;
	};

	// whether site has a paid plan for the product
	hasPaidPlanForProduct = product => {
		// check for identifying feature and if it's in the site features
		return !! product;
	};

	decorateProduct = () => {
		const decorations = {
			hasPaidPlanForProduct: this.hasPaidPlanForProduct( this.product ),
		};

		return { ...this.product, ...decorations };
	};
}

class CreatorProductDecorator extends ProductDecorator {
	// Override specific methods like hasPaidPlanForProduct to alter the values of the decorated properties
}

const productMapBySlug = {
	creator: CreatorProductDecorator,
};
