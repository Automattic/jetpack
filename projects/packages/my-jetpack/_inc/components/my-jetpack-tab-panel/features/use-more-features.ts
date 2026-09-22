import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { moduleSwitchKey, useRequestedSwitches } from '../../../data/requested-switch-state';
import { getProductModules } from '../products/mappings';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import {
	filterAndSortModules,
	hasSearch,
	moduleFields,
	rankBy,
	searchTerms,
} from '../products/utils';
import { getFeatureModuleSlug } from './feature-state';
import { matchesFilter } from './use-feature-filter';
import type { FeatureState } from './feature-state';
import type { FeatureFilter } from './use-feature-filter';
import type { MyJetpackModule } from '../../../types';

export type MoreFeaturesGroup = {
	label: string;
	states: FeatureState[];
};

/**
 * A module as a feature row, so every surface here reads the state the main features do.
 *
 * The synthesized feature carries no plan and is not essential, which is what those filters
 * should answer for a module.
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
			plans: [],
			essential: false,
		} as MainFeature,
		status: ( asked ?? $module.activated ) ? 'active' : 'inactive',
		isSwitching: asked !== undefined,
		control: { kind: 'module', module: $module },
	};
}

/**
 * The module a row was built from.
 *
 * @param state - A row from one of these groups.
 * @return The module.
 */
export function getStateModule( state: FeatureState ): MyJetpackModule {
	return ( state.control as { module: MyJetpackModule } ).module;
}

/**
 * Sort the modules the feature list leaves out under their headings.
 *
 * @param features       - The main features, whose modules are already on the tab.
 * @param groups         - The headings, each naming its modules in display order.
 * @param modules        - Every Jetpack module on the site.
 * @param productModules - Product slug to module slug, where the two differ.
 * @param requested      - Switch key to the value asked of it.
 * @return Non-empty groups in order, with every leftover module under Other, by name.
 */
export function groupMoreFeatures(
	features: MainFeature[],
	groups: MainFeatureModuleGroup[],
	modules: Record< string, MyJetpackModule >,
	productModules: Record< string, string >,
	requested: Record< string, boolean >
): MoreFeaturesGroup[] {
	const covered = new Set(
		features.map( feature => getFeatureModuleSlug( feature, productModules ) )
	);
	// Sorted by name, with the legacy modules dropped, the way the Products tab lists them.
	const remaining = new Map(
		filterAndSortModules( Object.values( modules ) )
			.filter( $module => $module.available && ! covered.has( $module.module ) )
			.map( $module => [ $module.module, getModuleFeatureState( $module, requested ) ] )
	);

	const grouped = groups.map( group => ( {
		label: group.label,
		states: group.modules.flatMap( slug => {
			const state = remaining.get( slug );
			remaining.delete( slug );
			return state ? [ state ] : [];
		} ),
	} ) );

	return [
		...grouped,
		{ label: __( 'Other', 'jetpack-my-jetpack' ), states: [ ...remaining.values() ] },
	].filter( group => group.states.length > 0 );
}

/**
 * Narrow the groups to what the filter or search shows, dropping any left empty.
 *
 * A search replaces the filter, as it does for the main features, and ranks modules the way
 * the Products tab ranks them.
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
			states: terms
				? rankBy( group.states, terms, state => moduleFields( getStateModule( state ) ) ).map(
						( { item } ) => item
					)
				: group.states.filter( state => matchesFilter( state, filter ) ),
		} ) )
		.filter( group => group.states.length > 0 );
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
	// Read here rather than in each row, so a switch in flight is answered once per module.
	const requested = useRequestedSwitches();

	return useMemo(
		() =>
			state.jetpack === 'active' && modules
				? groupMoreFeatures(
						state.features,
						state.module_groups ?? [],
						modules,
						getProductModules(),
						requested
					)
				: [],
		[ state, modules, requested ]
	);
}
