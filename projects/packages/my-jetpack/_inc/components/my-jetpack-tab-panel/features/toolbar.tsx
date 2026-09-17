import { SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import { getFeatureFilters } from './use-feature-filter';
import type { FeatureFilter } from './use-feature-filter';

type FilterPillProps = {
	value: FeatureFilter;
	label: string;
	count: number;
	isActive: boolean;
	onSelect: ( filter: FeatureFilter ) => void;
};

/**
 * One filter pill.
 *
 * @param {FilterPillProps} props          - The component props.
 * @param {string}          props.value    - The filter this pill selects.
 * @param {string}          props.label    - The pill's label.
 * @param {number}          props.count    - How many features this filter shows.
 * @param {boolean}         props.isActive - Whether this filter is the active one.
 * @param {Function}        props.onSelect - Switches the active filter.
 * @return The rendered component.
 */
function FilterPill( { value, label, count, isActive, onSelect }: FilterPillProps ) {
	const onClick = useCallback( () => onSelect( value ), [ onSelect, value ] );

	return (
		<button
			type="button"
			className={ clsx( styles.pill, isActive && styles[ 'pill--selected' ] ) }
			aria-pressed={ isActive }
			onClick={ onClick }
		>
			{ label }
			<span className={ styles.pill__count }>{ count }</span>
		</button>
	);
}

type ToolbarProps = {
	filter: FeatureFilter;
	onFilterChange: ( filter: FeatureFilter ) => void;
	counts: Record< FeatureFilter, number >;
	search: string;
	onSearchChange: ( search: string ) => void;
};

/**
 * The filter pills and the search box above the grid.
 *
 * @param {ToolbarProps} props                - The component props.
 * @param {string}       props.filter         - The active filter.
 * @param {Function}     props.onFilterChange - Switches the active filter.
 * @param {object}       props.counts         - How many features each filter shows.
 * @param {string}       props.search         - The search term.
 * @param {Function}     props.onSearchChange - Updates the search term.
 * @return The rendered component.
 */
export function Toolbar( {
	filter,
	onFilterChange,
	counts,
	search,
	onSearchChange,
}: ToolbarProps ) {
	return (
		<div className={ styles.toolbar }>
			<Stack direction="row" align="center" gap="md" wrap="wrap">
				<Stack
					direction="row"
					align="center"
					gap="sm"
					wrap="wrap"
					role="group"
					aria-label={ __( 'Filter features', 'jetpack-my-jetpack' ) }
					className={ styles.pills }
				>
					{ getFeatureFilters().map( ( { value, label } ) => (
						<FilterPill
							key={ value }
							value={ value }
							label={ label }
							count={ counts[ value ] ?? 0 }
							isActive={ value === filter }
							onSelect={ onFilterChange }
						/>
					) ) }
				</Stack>

				<SearchControl
					__nextHasNoMarginBottom
					value={ search }
					onChange={ onSearchChange }
					aria-label={ __( 'Search features', 'jetpack-my-jetpack' ) }
					placeholder={ __( 'Search features', 'jetpack-my-jetpack' ) }
					className={ styles.search }
				/>
			</Stack>
		</div>
	);
}
