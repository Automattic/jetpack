import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { SearchControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { blockTable, category } from '@wordpress/icons';
import { IconButton, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import { getFeatureFilters } from './use-feature-filter';
import type { FeatureFilter } from './use-feature-filter';
import type { ReactNode } from 'react';

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

export type FeaturesView = 'grid' | 'list';

type ViewButtonProps = {
	value: FeaturesView;
	current: FeaturesView;
	onSelect: ( view: FeaturesView ) => void;
};

/**
 * One of the two buttons that switch between the grid and the list.
 *
 * @param {ViewButtonProps} props          - The component props.
 * @param {string}          props.value    - The view this button shows.
 * @param {string}          props.current  - The view on screen.
 * @param {Function}        props.onSelect - Switches the view.
 * @return The rendered component.
 */
function ViewButton( { value, current, onSelect }: ViewButtonProps ) {
	const onClick = useCallback( () => onSelect( value ), [ onSelect, value ] );
	const isActive = value === current;
	const gridLabel = __( 'Grid view', 'jetpack-my-jetpack' );
	const listLabel = __( 'List view', 'jetpack-my-jetpack' );

	return (
		<IconButton
			icon={ value === 'grid' ? category : blockTable }
			label={ value === 'grid' ? gridLabel : listLabel }
			variant={ isActive ? 'solid' : 'outline' }
			tone="neutral"
			aria-pressed={ isActive }
			className={ styles[ 'view-button' ] }
			onClick={ onClick }
		/>
	);
}

type ToolbarProps = {
	view: FeaturesView;
	onViewChange: ( view: FeaturesView ) => void;
	filter: FeatureFilter;
	onFilterChange: ( filter: FeatureFilter ) => void;
	counts: Record< FeatureFilter, number >;
	countsPending?: boolean;
	search: string;
	onSearchChange: ( search: string ) => void;
	bulk?: ReactNode;
};

// Only these two are counted from live state; the rest come from the catalog and are
// right from the first paint.
const LIVE_COUNTS: FeatureFilter[] = [ 'active', 'inactive' ];

/**
 * The filter pills and the search box above the grid.
 *
 * @param {ToolbarProps} props                - The component props.
 * @param {string}       props.view           - Whether the features show as a grid or a list.
 * @param {Function}     props.onViewChange   - Switches between the grid and the list.
 * @param {string}       props.filter         - The active filter.
 * @param {Function}     props.onFilterChange - Switches the active filter.
 * @param {object}       props.counts         - How many features each filter shows.
 * @param {boolean}      props.countsPending  - Whether those counts are still settling.
 * @param {string}       props.search         - The search term.
 * @param {Function}     props.onSearchChange - Updates the search term.
 * @param {ReactNode}    props.bulk           - The bulk bar, which sticks to the top with the filters.
 * @return The rendered component.
 */
export function Toolbar( {
	view,
	onViewChange,
	filter,
	onFilterChange,
	counts,
	countsPending,
	search,
	onSearchChange,
	bulk,
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
					{ getFeatureFilters( filter ).map( ( { value, label } ) => (
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
						options={ getFeatureFilters( filter ).map( ( { value, label } ) => ( {
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

				<Stack
					direction="row"
					align="center"
					gap="sm"
					role="group"
					aria-label={ __( 'Layout', 'jetpack-my-jetpack' ) }
				>
					<ViewButton value="grid" current={ view } onSelect={ onViewChange } />
					<ViewButton value="list" current={ view } onSelect={ onViewChange } />
				</Stack>
			</Stack>

			{ bulk }
		</div>
	);
}
