import type { ProductCamelCase } from '../../data/types';

export interface ProductsTableViewProps {
	products: JetpackModule[];
}

export type ProductData = {
	product: Pick< ProductCamelCase, 'description' | 'name' | 'slug' | 'category' >;
	status: ProductStatus;
};

export interface ListButtonProps {
	slug: JetpackModule;
}
