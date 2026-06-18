import { ProductCamelCase } from '../../../data/types';
import { MyJetpackModule } from '../../../types';

export type ProductCategory = 'recommended' | 'security' | 'growth' | 'performance' | 'other';

export type ProductFilter = ProductCategory | 'all' | 'included';

export type CardItem = {
	product: ProductCamelCase;
	module?: MyJetpackModule;
};

export type ProductSection = {
	id: string;
	title: string;
	cards?: Array< CardItem >;
	modules?: Array< MyJetpackModule >;
};

/**
 * A single relevance-ranked search result, which can be either a product card or a module.
 * Rendered as a uniform compact row in the search results list.
 */
export type SearchResultItem =
	| { kind: 'card'; card: CardItem }
	| { kind: 'module'; module: MyJetpackModule };
