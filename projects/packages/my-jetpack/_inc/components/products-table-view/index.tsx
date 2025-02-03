import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useCallback, useState, useMemo } from 'react';
import { useAllProducts } from '../../data/products/use-all-products';
import ActionButton from '../action-button';
import {
	PRODUCT_TABLE_TITLE,
	PRODUCT_TABLE_DESCRIPTION,
	PRODUCT_TABLE_STATUS,
	PRODUCT_TABLE_ICON,
	PRODUCT_TABLE_CATEGORY,
} from './constants';
import AntiSpamIcon from './icons/anti-spam';
import BackupIcon from './icons/backup';
import BoostIcon from './icons/boost';
import CrmIcon from './icons/crm';
import JetpackAiIcon from './icons/jetpack-ai';
import ProtectIcon from './icons/protect';
import SearchIcon from './icons/search';
import SocialIcon from './icons/social';
import StatsIcon from './icons/stats';
import VideopressIcon from './icons/videopress';
import type { ProductsTableViewProps, ProductData } from './types';
import type { ProductCamelCase } from '../../data/types';
import type {
	ViewList,
	SupportedLayouts,
	SortDirection,
	View,
	Operator,
	Option,
} from '@wordpress/dataviews';
import type { FC } from 'react';

import './style.scss';

const PRODUCT_ICONS = {
	backup: BackupIcon,
	protect: ProtectIcon,
	'anti-spam': AntiSpamIcon,
	'jetpack-ai': JetpackAiIcon,
	boost: BoostIcon,
	search: SearchIcon,
	videopress: VideopressIcon,
	stats: StatsIcon,
	crm: CrmIcon,
	social: SocialIcon,
};

const compileData: (
	products: JetpackModule[],
	allProductData: {
		[ key: string ]: ProductCamelCase;
	}
) => ProductData[] = ( products, allProductData ) => {
	const data = products.map( product => {
		const productData = allProductData[ product ];
		const { description, name, status, slug, category } = productData;
		return {
			product: {
				description,
				name,
				slug,
				category,
			},
			status,
		};
	} );

	return data;
};

const getCategories: (
	products: JetpackModule[],
	allProductData: {
		[ key: string ]: ProductCamelCase;
	}
) => Option[] = ( products, allProductData ) => {
	const categories = [
		...new Set(
			products.map( product => {
				const productData = allProductData[ product ];
				return productData.category;
			} )
		),
	];

	const categoryOptions = categories.map( category => ( {
		value: category,
		label: category,
	} ) );

	return categoryOptions;
};

const ProductsTableView: FC< ProductsTableViewProps > = ( { products } ) => {
	const getItemId = useCallback( ( item: ProductData ) => item.product.slug, [] );
	const onChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );
	const isItemClickable = useCallback( () => false, [] );
	const allProductData = useAllProducts();

	const baseView: ViewList = {
		sort: {
			field: PRODUCT_TABLE_TITLE,
			direction: 'asc' as SortDirection,
		},
		type: 'list',
		filters: [],
		page: 1,
		perPage: 10,
	};

	const defaultLayouts: SupportedLayouts = {
		list: {
			...baseView,
			fields: [ PRODUCT_TABLE_DESCRIPTION, PRODUCT_TABLE_STATUS ],
			titleField: PRODUCT_TABLE_TITLE,
			mediaField: PRODUCT_TABLE_ICON,
			showMedia: true,
		},
	};

	const categories = useMemo(
		() => getCategories( products, allProductData ),
		[ products, allProductData ]
	);

	const fields = useMemo( () => {
		return [
			{
				id: PRODUCT_TABLE_TITLE,
				label: __( 'Title', 'jetpack-my-jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				getValue( { item }: { item: ProductData } ) {
					return item.product.name;
				},
				render: ( { item }: { item: ProductData } ) => {
					const { product } = item;
					return <div>{ product.name }</div>;
				},
			},
			{
				id: PRODUCT_TABLE_DESCRIPTION,
				label: __( 'Description', 'jetpack-my-jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				getValue( { item }: { item: ProductData } ) {
					return item.product.description;
				},
				render: ( { item }: { item: ProductData } ) => {
					const { product } = item;
					return <div>{ product.description }</div>;
				},
			},
			{
				id: PRODUCT_TABLE_CATEGORY,
				label: __( 'Category', 'jetpack-my-jetpack' ),
				enableGlobalSearch: true,
				enableHiding: true,
				filterBy: {
					isPrimary: true,
					operators: [ 'is' ] as Operator[],
				},
				elements: categories.length > 1 ? categories : [],
				isVisible: () => false,
				getValue( { item }: { item: ProductData } ) {
					return item.product.category;
				},
			},
			{
				id: PRODUCT_TABLE_ICON,
				label: __( 'Icon', 'jetpack-my-jetpack' ),
				enableGlobalSearch: false,
				enableHiding: false,
				render( { item }: { item: ProductData } ) {
					const { product } = item;
					const Icon = PRODUCT_ICONS[ product.slug ];
					return <Icon />;
				},
			},
			{
				id: PRODUCT_TABLE_STATUS,
				label: 'Status',
				enableGlobalSearch: false,
				enableHiding: false,
				getValue( { item }: { item: ProductData } ) {
					return item.status;
				},
				render: ( { item }: { item: ProductData } ) => {
					const { product } = item;
					const { slug } = product;

					return <ActionButton slug={ slug } tracksIdentifier="product_list_item" />;
				},
			},
		];
		// Having this re-calculate on every change of "categories" was causing unnecessary re-renders
		// and a 'jumping' of the CTA buttons. Having categories as a dependency here is unnecessary
		// and leaving it out doesn't cause the values to be incorrect.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const [ view, setView ] = useState< View >( {
		type: 'list',
		...defaultLayouts.list,
	} );

	const data = useMemo(
		() => compileData( products, allProductData ),
		[ allProductData, products ]
	);

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( data, view, fields ),
		[ data, fields, view ]
	);

	return (
		<DataViews
			actions={ [] }
			data={ processedData }
			fields={ fields }
			view={ view }
			getItemId={ getItemId }
			paginationInfo={ paginationInfo }
			onChangeView={ onChangeView }
			defaultLayouts={ defaultLayouts }
			isItemClickable={ isItemClickable }
		/>
	);
};

export default ProductsTableView;
