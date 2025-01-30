import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
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
import type { ViewList, SupportedLayouts, SortDirection, View } from '@wordpress/dataviews';
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

const useCompileData: ( products: JetpackModule[] ) => ProductData[] = products => {
	const allProductData = useAllProducts();
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

const getFields = () => {
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
};

const ProductsTableView: FC< ProductsTableViewProps > = ( { products } ) => {
	const getItemId = useCallback( ( item: ProductData ) => item.product.slug, [] );
	const onChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );
	const isItemClickable = useCallback( () => false, [] );

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

	const [ view, setView ] = useState< View >( {
		type: 'list',
		...defaultLayouts.list,
	} );

	const data = useCompileData( products );
	const fields = getFields();

	const { data: processedData, paginationInfo } = filterSortAndPaginate( data, view, fields );

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
