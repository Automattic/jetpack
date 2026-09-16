import { SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { grid, list } from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import { getFeatureFilters } from './use-feature-filter';
import type { FeatureFilter } from './use-feature-filter';
import type { FeatureView } from './use-feature-view';

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

type ViewButtonProps = {
	value: FeatureView;
	label: string;
	icon: JSX.Element;
	isActive: boolean;
	onSelect: ( view: FeatureView ) => void;
};

/**
 * One half of the grid/list switch.
 *
 * @param {ViewButtonProps} props          - The component props.
 * @param {string}          props.value    - The view this button selects.
 * @param {string}          props.label    - The button's accessible name.
 * @param {object}          props.icon     - The icon to draw.
 * @param {boolean}         props.isActive - Whether this view is the active one.
 * @param {Function}        props.onSelect - Switches the view.
 * @return The rendered component.
 */
function ViewButton( { value, label, icon, isActive, onSelect }: ViewButtonProps ) {
	const onClick = useCallback( () => onSelect( value ), [ onSelect, value ] );

	return (
		<button
			type="button"
			className={ clsx( styles[ 'view-button' ], isActive && styles[ 'view-button--selected' ] ) }
			aria-pressed={ isActive }
			aria-label={ label }
			onClick={ onClick }
		>
			<Icon icon={ icon } size={ 20 } />
		</button>
	);
}

type ToolbarProps = {
	filter: FeatureFilter;
	onFilterChange: ( filter: FeatureFilter ) => void;
	counts: Record< FeatureFilter, number >;
	search: string;
	onSearchChange: ( search: string ) => void;
	view: FeatureView;
	onViewChange: ( view: FeatureView ) => void;
};

/**
 * Filter pills, search, and the grid/list switch.
 *
 * @param {ToolbarProps} props                - The component props.
 * @param {string}       props.filter         - The active filter.
 * @param {Function}     props.onFilterChange - Switches the active filter.
 * @param {object}       props.counts         - How many features each filter shows.
 * @param {string}       props.search         - The search term.
 * @param {Function}     props.onSearchChange - Updates the search term.
 * @param {string}       props.view           - The active view.
 * @param {Function}     props.onViewChange   - Switches between grid and list.
 * @return The rendered component.
 */
export function Toolbar( {
	filter,
	onFilterChange,
	counts,
	search,
	onSearchChange,
	view,
	onViewChange,
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

				{ /* Media Library's pattern: two icons that swap how the same set is drawn,
				     next to the controls that decide what is in it. */ }
				<Stack
					direction="row"
					align="center"
					gap="xs"
					role="group"
					aria-label={ __( 'View features as', 'jetpack-my-jetpack' ) }
					className={ styles[ 'view-switch' ] }
				>
					<ViewButton
						value="grid"
						label={ __( 'Grid view', 'jetpack-my-jetpack' ) }
						icon={ grid }
						isActive={ view === 'grid' }
						onSelect={ onViewChange }
					/>
					<ViewButton
						value="list"
						label={ __( 'List view', 'jetpack-my-jetpack' ) }
						icon={ list }
						isActive={ view === 'list' }
						onSelect={ onViewChange }
					/>
				</Stack>
			</Stack>
		</div>
	);
}
