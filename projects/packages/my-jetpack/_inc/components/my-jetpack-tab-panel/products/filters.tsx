import { useBreakpointMatch } from '@automattic/jetpack-components';
import { MenuItem, NavigableMenu, SearchControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import { ProductFilter } from './types';
import { getProductsFilterChoices } from './utils';

type FiltersProps = {
	onChangeFilter: ( filter: ProductFilter ) => void;
	selectedFilter?: ProductFilter;
	search?: string;
	onSearch: ( search: string ) => void;
};

/**
 * Render the filters for the products tab.
 *
 * @param {FiltersProps} props - The component props.
 *
 * @return The rendered component.
 */
export function Filters( { onChangeFilter, onSearch, search, selectedFilter }: FiltersProps ) {
	const onSelectFilter = useCallback(
		( filter: ProductFilter ) => () => {
			if ( selectedFilter !== filter ) {
				onChangeFilter( filter );
			}
		},
		[ onChangeFilter, selectedFilter ]
	);

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<div className={ styles.filters }>
			<SearchControl
				__nextHasNoMarginBottom
				aria-label={ __( 'Search products', 'jetpack-my-jetpack' ) }
				placeholder={ __( 'Search products', 'jetpack-my-jetpack' ) }
				value={ search }
				onChange={ onSearch }
				className={ styles[ 'search-control' ] }
			/>
			{ isSmall ? (
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					options={ getProductsFilterChoices() }
					aria-label={ __( 'Filter products', 'jetpack-my-jetpack' ) }
					onChange={ onChangeFilter }
					value={ selectedFilter }
				/>
			) : (
				<NavigableMenu
					aria-label={ __( 'Filter products', 'jetpack-my-jetpack' ) }
					className={ styles[ 'products-filter' ] }
				>
					{ getProductsFilterChoices().map( item => {
						const isSelected = selectedFilter === item.value;

						return (
							<MenuItem
								key={ item.value }
								role="menuitemradio"
								isSelected={ isSelected }
								onClick={ onSelectFilter( item.value ) }
							>
								{ item.label }
							</MenuItem>
						);
					} ) }
				</NavigableMenu>
			) }
		</div>
	);
}
