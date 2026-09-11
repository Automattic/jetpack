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
	isActive: boolean;
	onSelect: ( filter: FeatureFilter ) => void;
};

/**
 * One filter pill.
 *
 * @param {FilterPillProps} props          - The component props.
 * @param {string}          props.value    - The filter this pill selects.
 * @param {string}          props.label    - The pill's label.
 * @param {boolean}         props.isActive - Whether this filter is the active one.
 * @param {Function}        props.onSelect - Switches the active filter.
 * @return The rendered component.
 */
function FilterPill( { value, label, isActive, onSelect }: FilterPillProps ) {
	const onClick = useCallback( () => onSelect( value ), [ onSelect, value ] );

	return (
		<button
			type="button"
			className={ clsx( styles.pill, isActive && styles[ 'pill--selected' ] ) }
			aria-pressed={ isActive }
			onClick={ onClick }
		>
			{ label }
		</button>
	);
}

type ToolbarProps = {
	filter: FeatureFilter;
	onFilterChange: ( filter: FeatureFilter ) => void;
	search: string;
	onSearchChange: ( search: string ) => void;
};

/**
 * Filter pills and search for the features grid.
 *
 * @param {ToolbarProps} props                - The component props.
 * @param {string}       props.filter         - The active filter.
 * @param {Function}     props.onFilterChange - Switches the active filter.
 * @param {string}       props.search         - The search term.
 * @param {Function}     props.onSearchChange - Updates the search term.
 * @return The rendered component.
 */
export function Toolbar( { filter, onFilterChange, search, onSearchChange }: ToolbarProps ) {
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
