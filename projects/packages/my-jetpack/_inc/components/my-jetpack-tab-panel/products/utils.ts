import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../../types';
import { ProductFilter, ProductSection } from './types';

/**
 * Get the choices for the products filter.
 *
 * @return The choices for the products filter.
 */
export function getProductsFilterChoices() {
	const choices: Array< {
		label: string;
		value: ProductFilter;
	} > = [
		{
			label: __( 'All categories', 'jetpack-my-jetpack' ),
			value: 'all',
		},
		{
			label: __( 'Recommended', 'jetpack-my-jetpack' ),
			value: 'recommended',
		},
		{
			label: __( 'Included in plan', 'jetpack-my-jetpack' ),
			value: 'included',
		},
		{
			label: __( 'Security', 'jetpack-my-jetpack' ),
			value: 'security',
		},
		{
			label: __( 'Growth', 'jetpack-my-jetpack' ),
			value: 'growth',
		},
		{
			label: __( 'Performance', 'jetpack-my-jetpack' ),
			value: 'performance',
		},
		{
			label: __( 'Other', 'jetpack-my-jetpack' ),
			value: 'other',
		},
	];

	return choices;
}

/**
 * Get the title for a section based on its id.
 * @param {string} section - The section id.
 * @return  The title of the section, or undefined if not found.
 */
export function getSectionTitle( section: string ) {
	const option = getProductsFilterChoices().find( item => item.value === section );

	return option?.label;
}

/**
 * Filter sections based on the search term by matching the card and module data with the search term.
 *
 * @param {Array<ProductSection>} sections - The sections to filter.
 * @param {FilterSectionsOptions} options  - The options for filtering sections.
 * @return  The filtered sections.
 */
export function filterSections(
	sections: Array< ProductSection >,
	{ search }: { search: string | undefined }
): Array< ProductSection > {
	if ( ! search ) {
		return sections;
	}

	// TODO Improve search
	return sections
		.map( section => ( {
			...section,
			cards: section.cards?.filter( item => {
				// Search only the values, not the keys
				const str = JSON.stringify(
					Object.values( {
						...item.product,
						...item.module,
					} )
				);

				return str.toLowerCase().includes( search.toLowerCase() );
			} ),
			modules: section.modules?.filter( item => {
				const str = JSON.stringify( Object.values( item ) );

				return str.toLowerCase().includes( search.toLowerCase() );
			} ),
		} ) )
		.filter( section => {
			return section.cards?.length || section.modules?.length;
		} );
}

/**
 * Filter and sort modules based on their name.
 *
 * @param {Array<MyJetpackModule>} modules - The modules to filter and sort.
 * @return The filtered and sorted modules.
 */
export function filterAndSortModules(
	modules: Array< MyJetpackModule >
): Array< MyJetpackModule > {
	const $modules = [ ...modules ].filter( Boolean );

	$modules.sort( ( a, b ) => a.name.localeCompare( b.name ) );

	return $modules;
}
