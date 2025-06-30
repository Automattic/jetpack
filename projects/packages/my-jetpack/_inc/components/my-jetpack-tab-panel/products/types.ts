import { ProductCamelCase } from '../../../data/types';
import { MyJetpackModule } from '../../types';
import {
	JETPACK_MODULES,
	JETPACK_PRODUCTS_WITH_CARD,
	JETPACK_PRODUCTS_WITHOUT_CARD,
} from './constants';

export type ProductCategory = 'recommended' | 'security' | 'growth' | 'performance' | 'other';

export type ProductFilter = ProductCategory | 'all' | 'included';

export type JetpackProductWithCard = ( typeof JETPACK_PRODUCTS_WITH_CARD )[ number ];

export type JetpackProductWithoutCard = ( typeof JETPACK_PRODUCTS_WITHOUT_CARD )[ number ];

export type JetpackProductSlug = JetpackProductWithCard | JetpackProductWithoutCard;

export type JetpackModuleSlug = ( typeof JETPACK_MODULES )[ number ];

export type ProductSection = {
	id: string;
	title: string;
	cards?: Array< {
		product: ProductCamelCase;
		module?: MyJetpackModule;
	} >;
	modules?: Array< MyJetpackModule >;
};
