import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { moduleSwitchKey } from '../../../data/requested-switch-state';
import { getProductModules } from '../products/mappings';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import { hasSearch, rankBy, searchTerms } from '../products/utils';
import { getFeatureModuleSlug } from './feature-state';
import type { FeatureState } from './feature-state';
import type { FeatureFilter } from './use-feature-filter';
import type { MyJetpackModule } from '../../../types';

export type MoreFeaturesGroup = {
	label: string;
	modules: MyJetpackModule[];
};

/**
 * Sort the modules the feature list leaves out under their headings.
 *
 * @param features       - The main features, whose modules are already on the tab.
 * @param groups         - The headings, each naming its modules in display order.
 * @param modules        - Every Jetpack module on the site.
 * @param productModules - Product slug to module slug, where the two differ.
 * @return Non-empty groups in order, with every leftover module under Other, by name.
 */
export function groupMoreFeatures(
	features: MainFeature[],
	groups: MainFeatureModuleGroup[],
	modules: Record< string, MyJetpackModule >,
	productModules: Record< string, string >
): MoreFeaturesGroup[] {
	const covered = new Set(
		features.map( feature => getFeatureModuleSlug( feature, productModules ) )
	);
	const remaining = new Map(
		Object.values( modules )
			.filter( $module => $module.available && ! covered.has( $module.module ) )
			.map( $module => [ $module.module, $module ] )
	);

	const grouped = groups.map( group => {
		const members = group.modules.flatMap( slug => {
			const $module = remaining.get( slug );
			remaining.delete( slug );
			return $module ? [ $module ] : [];
		} );

		return { label: group.label, modules: members };
	} );

	const other = [ ...remaining.values() ].sort( ( a, b ) =>
		a.name.localeCompare( b.name, undefined, { sensitivity: 'base' } )
	);

	return [ ...grouped, { label: __( 'Other', 'jetpack-my-jetpack' ), modules: other } ].filter(
		group => group.modules.length > 0
	);
}

/**
 * Whether a module passes the current filter. Plan and Essential filters describe only the
 * main features, so no module passes them.
 *
 * @param $module - The module to test.
 * @param filter  - The active filter.
 * @return True when the module should be shown.
 */
export function matchesModuleFilter( $module: MyJetpackModule, filter: FeatureFilter ): boolean {
	switch ( filter ) {
		case 'all':
			return true;
		case 'active':
			return $module.activated;
		case 'inactive':
			return ! $module.activated;
		default:
			return false;
	}
}

/**
 * Narrow the groups to what the filter or search shows, dropping any left empty.
 *
 * A search replaces the filter, as it does for the main features.
 *
 * @param groups - The grouped modules.
 * @param filter - The active filter.
 * @param search - The search term.
 * @return The groups still showing something.
 */
export function filterMoreFeatures(
	groups: MoreFeaturesGroup[],
	filter: FeatureFilter,
	search: string
): MoreFeaturesGroup[] {
	const terms = hasSearch( search ) ? searchTerms( search ) : null;

	return groups
		.map( group => ( {
			...group,
			modules: terms
				? rankBy( group.modules, terms, $module => [
						{ value: $module.name, weight: 3 },
						{ value: $module.description, weight: 1 },
						{ value: $module.search_terms, weight: 1 },
					] ).map( ( { item } ) => item )
				: group.modules.filter( $module => matchesModuleFilter( $module, filter ) ),
		} ) )
		.filter( group => group.modules.length > 0 );
}

/**
 * A module as a feature row, so the list view's selection and bulk switch take it as is.
 *
 * @param $module   - The module.
 * @param requested - Switch key to the value asked of it, for a switch still in flight.
 * @return The module's state.
 */
export function getModuleFeatureState(
	$module: MyJetpackModule,
	requested: Record< string, boolean >
): FeatureState {
	const asked = requested[ moduleSwitchKey( $module.module ) ];

	return {
		feature: {
			slug: $module.module,
			name: $module.name,
			description: $module.description,
		} as MainFeature,
		status: ( asked ?? $module.activated ) ? 'active' : 'inactive',
		isSwitching: asked !== undefined,
		control: { kind: 'module', module: $module },
	};
}

/**
 * Jetpack's other modules, grouped for the Features tab.
 *
 * Empty unless Jetpack is active and its modules have loaded: only Jetpack serves the list.
 *
 * @param state - The Features tab's state.
 * @return The grouped modules.
 */
export function useMoreFeatures( state: MainFeaturesState ): MoreFeaturesGroup[] {
	const { modules } = useAllJetpackModules();

	return useMemo(
		() =>
			state.jetpack === 'active' && modules
				? groupMoreFeatures(
						state.features,
						state.module_groups ?? [],
						modules,
						getProductModules()
					)
				: [],
		[ state, modules ]
	);
}
