import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { SearchControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import { getFeatureFilters } from './use-feature-filter';
import type { FeatureFilter } from './use-feature-filter';

type FilterPillProps = {
	countPending?: boolean;
	value: FeatureFilter;
	label: string;
	count: number;
	isActive: boolean;
	onSelect: ( filter: FeatureFilter ) => void;
};

/**
 * One filter pill.
 *
 * @param {FilterPillProps} props              - The component props.
 * @param {string}          props.value        - The filter this pill selects.
 * @param {string}          props.label        - The pill's label.
 * @param {number}          props.count        - How many features this filter shows.
 * @param {boolean}         props.countPending - Whether that count is still settling.
 * @param {boolean}         props.isActive     - Whether this filter is the active one.
 * @param {Function}        props.onSelect     - Switches the active filter.
 * @return The rendered component.
 */
function FilterPill( { value, label, count, countPending, isActive, onSelect }: FilterPillProps ) {
	const onClick = useCallback( () => onSelect( value ), [ onSelect, value ] );

	return (
		<button
			type="button"
			className={ clsx( styles.pill, isActive && styles[ 'pill--selected' ] ) }
			aria-pressed={ isActive }
			onClick={ onClick }
		>
			{ label }
			<span className={ styles.pill__count }>
				{ countPending ? (
					<LoadingPlaceholder width={ 12 } height={ 10 } className={ styles[ 'skeleton-count' ] } />
				) : (
					count
				) }
			</span>
		</button>
	);
}

type ToolbarProps = {
	filter: FeatureFilter;
	onFilterChange: ( filter: FeatureFilter ) => void;
	counts: Record< FeatureFilter, number >;
	countsPending?: boolean;
	search: string;
	onSearchChange: ( search: string ) => void;
};

// Only these two are counted from live state; the rest come from the catalog and are
// right from the first paint.
const LIVE_COUNTS: FeatureFilter[] = [ 'active', 'inactive' ];

/**
 * The filter pills and the search box above the grid.
 *
 * @param {ToolbarProps} props                - The component props.
 * @param {string}       props.filter         - The active filter.
 * @param {Function}     props.onFilterChange - Switches the active filter.
 * @param {object}       props.counts         - How many features each filter shows.
 * @param {boolean}      props.countsPending  - Whether those counts are still settling.
 * @param {string}       props.search         - The search term.
 * @param {Function}     props.onSearchChange - Updates the search term.
 * @return The rendered component.
 */
export function Toolbar( {
	filter,
	onFilterChange,
	counts,
	countsPending,
	search,
	onSearchChange,
}: ToolbarProps ) {
	const onSelectFilter = useCallback(
		( value: string ) => onFilterChange( value as FeatureFilter ),
		[ onFilterChange ]
	);

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
							countPending={ countsPending && LIVE_COUNTS.includes( value ) }
							isActive={ value === filter }
							onSelect={ onFilterChange }
						/>
					) ) }
				</Stack>

				{ /* Below the breakpoint the pills above are hidden and this takes over: six
				     of them stack one per row on a phone, which is most of the screen. */ }
				<div className={ styles[ 'filter-select' ] }>
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Filter features', 'jetpack-my-jetpack' ) }
						hideLabelFromVision
						value={ filter }
						options={ getFeatureFilters().map( ( { value, label } ) => ( {
							value,
							// No count until it is a count; the pills alongside do the same.
							label:
								countsPending && LIVE_COUNTS.includes( value )
									? label
									: `${ label } (${ counts[ value ] ?? 0 })`,
						} ) ) }
						onChange={ onSelectFilter }
					/>
				</div>

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
