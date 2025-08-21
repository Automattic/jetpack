import { ProductCamelCase } from '../../../data/types';
import { MyJetpackModule } from '../../../types';

export type ProductCategory = 'recommended' | 'security' | 'growth' | 'performance' | 'other';

export type ProductFilter = ProductCategory | 'all' | 'included';

export type ProductSection = {
	id: string;
	title: string;
	cards?: Array< {
		product: ProductCamelCase;
		module?: MyJetpackModule;
	} >;
	modules?: Array< MyJetpackModule >;
};
