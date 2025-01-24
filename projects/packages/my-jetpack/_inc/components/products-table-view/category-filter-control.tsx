import { Button } from '@automattic/jetpack-components';
import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { PRODUCT_TABLE_CATEGORY } from './constants';
import type { ProductData } from './types';
import type { View } from '@wordpress/dataviews';

type Category = Window[ 'myJetpackInitialState' ][ 'products' ][ 'items' ][ 0 ][ 'category' ] | '';

const CategoryFilterControl = ( {
	data,
	view,
	onChangeView,
}: {
	data: ProductData[];
	view: View;
	onChangeView: ( newView: View ) => void;
} ) => {
	const [ selectedValue, setSelectedValue ] = useState< Category >( '' );
	const [ isOptionsVisible, setIsOptionsVisible ] = useState( false );

	const allUniqueCategories = data.reduce( ( categories, { product } ) => {
		const { category } = product;
		if ( ! categories.includes( category ) ) {
			categories.push( category );
		}
		return categories;
	}, [] as Category[] );

	const onCategoryFilterChange = useCallback(
		( value: Category ) => {
			const newFilters = view.filters.filter( filter => filter.field !== PRODUCT_TABLE_CATEGORY );

			if ( value ) {
				newFilters.push( {
					field: PRODUCT_TABLE_CATEGORY,
					operator: 'is',
					value,
				} );
			}

			onChangeView( {
				...view,
				filters: newFilters,
			} );
			setSelectedValue( value );
			setIsOptionsVisible( false );
		},
		[ onChangeView, view ]
	);

	const toggleOptionsVisibility = useCallback( () => {
		setIsOptionsVisible( ! isOptionsVisible );
	}, [ isOptionsVisible ] );

	const capitalizeLabel = ( label: string ) => {
		return label.charAt( 0 ).toUpperCase() + label.slice( 1 );
	};

	const clearFilter = useCallback( () => {
		onCategoryFilterChange( '' );
	}, [ onCategoryFilterChange ] );

	return (
		<>
			{ selectedValue && (
				<div className="selected-filter-tag">
					<span>
						{ __( 'Filter:', 'jetpack-my-jetpack' ) } { capitalizeLabel( selectedValue ) }
					</span>
					<button onClick={ clearFilter }>x</button>
				</div>
			) }
			{ ! selectedValue && (
				<Button onClick={ toggleOptionsVisibility } variant="secondary">
					{ __( 'Filter by category', 'jetpack-my-jetpack' ) }
				</Button>
			) }
			{ isOptionsVisible && (
				<div>
					<ToggleGroupControl
						value={ selectedValue }
						onChange={ onCategoryFilterChange }
						isBlock
						isDeselectable
						hideLabelFromVision
					>
						{ allUniqueCategories.map( category => {
							return (
								<ToggleGroupControlOption
									key={ category }
									value={ category }
									label={ capitalizeLabel( category ) }
								/>
							);
						} ) }
					</ToggleGroupControl>
				</div>
			) }
		</>
	);
};

export default CategoryFilterControl;
