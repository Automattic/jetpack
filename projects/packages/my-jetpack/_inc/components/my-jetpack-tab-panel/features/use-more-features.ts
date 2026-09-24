import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { moduleSwitchKey, useRequestedSwitches } from '../../../data/requested-switch-state';
import { PRODUCT_MODULES } from '../products/mappings';
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
 * The module a row was built from, for the rows that have one.
 *
 * @param state - A row from one of these groups.
 * @return The module, or null.
 */
function getStateModule( state: FeatureState ): MyJetpackModule | null {
	return state.control.kind === 'module' ? state.control.module : null;
}

/**
 * Sort the modules the feature list leaves out under their headings.
 *
 * @param features       - The main features, whose modules are already on the tab.
 * @param groups         - The headings, each naming its modules.
 * @param modules        - Every Jetpack module on the site.
 * @param productModules - Product slug to module slug, where the two differ. Ungated, unlike
 *                       the map the cards resolve from: a module a pre-release gate hides on
 *                       its own card is still that card's, and must not surface here instead.
 * @param requested      - Switch key to the value asked of it.
 * @return Non-empty groups by label, each sorted by name, with every leftover module under Other, last.
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

	// Walks the name-sorted modules rather than each group's list, so every group reads A to Z.
	const grouped = groups.map( group => {
		const states = [ ...remaining ]
			.filter( ( [ slug ] ) => group.modules.includes( slug ) )
			.map( ( [ slug, state ] ) => {
				remaining.delete( slug );
				return state;
			} );

		return { label: group.label, states };
	} );
	// Sorted on the translated label, so the order holds in every locale.
	grouped.sort( ( a, b ) => a.label.localeCompare( b.label ) );

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
				? rankBy( group.states, terms, state => {
						const $module = getStateModule( state );

						return $module ? moduleFields( $module ) : [ { value: state.feature.name, weight: 3 } ];
					} ).map( ( { item } ) => item )
				: // A module being switched stays put, for the reason the main list keeps its card.
					group.states.filter( state => matchesFilter( state, filter ) || state.isSwitching ),
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
			state.jetpack === 'active' && modules && state.module_groups?.length
				? groupMoreFeatures(
						state.features,
						state.module_groups,
						modules,
						PRODUCT_MODULES,
						requested
					)
				: [],
		[ state, modules, requested ]
	);
}
