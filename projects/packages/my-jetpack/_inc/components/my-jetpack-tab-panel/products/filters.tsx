import { MenuItem, NavigableMenu, SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import { getProductsFilterChoices } from './utils';

type FiltersProps = {
	onChangeFilter: ( filter: string ) => void;
	selectedFilter?: string;
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
		( filter: string ) => () => {
			if ( selectedFilter !== filter ) {
				onChangeFilter( filter );
			}
		},
		[ onChangeFilter, selectedFilter ]
	);

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
			<NavigableMenu>
				{ getProductsFilterChoices().map( item => {
					const isSelected = selectedFilter === item.value;

					return (
						<MenuItem
							key={ item.value }
							role="menuitemradio"
							isSelected={ isSelected }
							onClick={ onSelectFilter( item.value ) }
							aria-label={ item[ 'aria-label' ] }
						>
							{ item.label }
						</MenuItem>
					);
				} ) }
			</NavigableMenu>
		</div>
	);
}
