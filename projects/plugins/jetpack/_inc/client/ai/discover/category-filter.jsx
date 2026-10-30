/**
 * Category filter: capsule pills for the pinned categories, the rest in a
 * More menu, and a select that stands in for both when the toolbar is narrow.
 * The look follows My Jetpack's Features toolbar; the design system has no
 * chip component yet, so the pills are toggle buttons styled with tokens.
 */

import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { Icon, Menu, SelectControl } from '@wordpress/ui';
import { CATEGORY_ICONS } from './category-icons';
import { CATEGORY_LABELS, PINNED_CATEGORIES } from './skills';

export const ALL = 'all';

/**
 * A category's name, with "All" for the unfiltered list.
 *
 * @param {string} key - Category key, or 'all'.
 * @return {string} The category's name.
 */
const labelFor = key => ( key === ALL ? __( 'All', 'jetpack' ) : CATEGORY_LABELS[ key ] );

/**
 * One pill's face: label and count.
 *
 * @param {object} props       - Component props.
 * @param {string} props.label - Category name.
 * @param {number} props.count - Skills in the category.
 * @return {object} Component markup.
 */
function PillFace( { label, count } ) {
	// The space names the pill "SEO 2", not "SEO2". The pill is a flex box, so
	// it collapses on screen and the count's margin does the spacing.
	return (
		<>
			{ label } <span className="jetpack-ai-discover__pill-count">{ count }</span>
		</>
	);
}

/**
 * A pinned category's toggle button.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.category - Category key, or 'all'.
 * @param {boolean}  props.isActive - Whether it is the selected category.
 * @param {number}   props.count    - Skills in the category.
 * @param {Function} props.onSelect - Called with the category key.
 * @return {object} Component markup.
 */
function FilterPill( { category, isActive, count, onSelect } ) {
	const handleClick = useCallback( () => onSelect( category ), [ category, onSelect ] );
	return (
		<button
			type="button"
			className={ `jetpack-ai-discover__pill${ isActive ? ' is-active' : '' }` }
			aria-pressed={ isActive }
			onClick={ handleClick }
		>
			<PillFace label={ labelFor( category ) } count={ count } />
		</button>
	);
}

/**
 * Category filter.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.value    - The selected category key, or 'all'.
 * @param {object}   props.counts   - Skill count per category key, plus `all`.
 * @param {Function} props.onChange - Called with the newly selected key.
 * @return {object} Component markup.
 */
export default function CategoryFilter( { value, counts, onChange } ) {
	const pinned = [ ALL, ...PINNED_CATEGORIES.filter( key => counts[ key ] ) ];
	// Alphabetical in the reader's language, since the menu reads as a list.
	const more = Object.keys( CATEGORY_LABELS )
		.filter( key => ! PINNED_CATEGORIES.includes( key ) && counts[ key ] )
		.sort( ( a, b ) => CATEGORY_LABELS[ a ].localeCompare( CATEGORY_LABELS[ b ] ) );
	const moreSelected = more.includes( value );
	const groupLabel = __( 'Filter skills by category', 'jetpack' );

	// The select lists the pills, then the menu, in the order they appear on
	// screen. Its value is one of these objects, so look it up from this list.
	const options = [ ...pinned, ...more ].map( key => ( {
		value: key,
		label: sprintf(
			/* translators: 1: a skill category, e.g. "SEO"; 2: how many skills it holds. */
			__( '%1$s (%2$d)', 'jetpack' ),
			labelFor( key ),
			counts[ key ]
		),
	} ) );
	const selectedOption = options.find( option => option.value === value ) ?? null;
	const handleSelect = useCallback( option => option && onChange( option.value ), [ onChange ] );

	return (
		<>
			<div className="jetpack-ai-discover__pills" role="group" aria-label={ groupLabel }>
				{ pinned.map( key => {
					return (
						<FilterPill
							key={ key }
							category={ key }
							isActive={ value === key }
							count={ counts[ key ] }
							onSelect={ onChange }
						/>
					);
				} ) }
				{ more.length > 0 && (
					<Menu.Root>
						<Menu.Trigger
							className={ `jetpack-ai-discover__pill jetpack-ai-discover__pill--more${
								moreSelected ? ' is-active' : ''
							}` }
							aria-label={
								moreSelected
									? sprintf(
											/* translators: %s: the selected category, e.g. "Security". */
											__( 'More categories, %s selected', 'jetpack' ),
											CATEGORY_LABELS[ value ]
										)
									: __( 'More categories', 'jetpack' )
							}
						>
							{ moreSelected ? (
								<PillFace label={ CATEGORY_LABELS[ value ] } count={ counts[ value ] } />
							) : (
								__( 'More', 'jetpack' )
							) }
							<Icon icon={ chevronDown } size={ 16 } />
						</Menu.Trigger>
						<Menu.Popup>
							<Menu.RadioGroup value={ moreSelected ? value : null } onValueChange={ onChange }>
								{ more.map( key => (
									<Menu.RadioItem
										key={ key }
										value={ key }
										// Picking a category is the whole job of this menu.
										closeOnClick
										prefix={ <Menu.PrefixIcon icon={ CATEGORY_ICONS[ key ] } size={ 20 } /> }
										suffix={ <span className="jetpack-ai-discover__muted">{ counts[ key ] }</span> }
									>
										<Menu.ItemLabel>{ CATEGORY_LABELS[ key ] }</Menu.ItemLabel>
									</Menu.RadioItem>
								) ) }
							</Menu.RadioGroup>
						</Menu.Popup>
					</Menu.Root>
				) }
			</div>

			{ /* The narrow layout. The stylesheet shows this or the pills, never both. */ }
			<SelectControl
				className="jetpack-ai-discover__filter-select"
				label={ groupLabel }
				hideLabelFromVision
				items={ options }
				value={ selectedOption }
				onValueChange={ handleSelect }
			/>
		</>
	);
}
