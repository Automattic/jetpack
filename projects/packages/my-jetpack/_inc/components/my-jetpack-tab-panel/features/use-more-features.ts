import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { moduleSwitchKey, useRequestedSwitches } from '../../../data/requested-switch-state';
import { PRODUCT_MODULES } from '../products/mappings';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import {
	LEGACY_MODULES_VISIBLE_ONLY_WHEN_ACTIVE,
	compareModulesByName,
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
 * @param hidden         - Modules that do not apply to the site, left out entirely.
 * @return Non-empty groups by label, each sorted by name, with every leftover module under Other, last.
 */
export function groupMoreFeatures(
	features: MainFeature[],
	groups: MainFeatureModuleGroup[],
	modules: Record< string, MyJetpackModule >,
	productModules: Record< string, string >,
	requested: Record< string, boolean >,
	hidden: ReadonlySet< string > = new Set()
): MoreFeaturesGroup[] {
	const groupOf = new Map(
		groups.flatMap( ( group, index ) => group.modules.map( slug => [ slug, index ] as const ) )
	);
	// A plugin-delivered card switches its plugin, not the module it shares a slug with, so a
	// module a group names still gets its own row: Protect's card vs. Brute Force Protection.
	const covered = new Set(
		features.flatMap( feature => {
			const slug = getFeatureModuleSlug( feature, productModules );
			return feature.in_jetpack || ! groupOf.has( slug ) ? [ slug ] : [];
		} )
	);
	const grouped = groups.map( group => ( { label: group.label, states: [] as FeatureState[] } ) );
	const other: FeatureState[] = [];

	// One pass over the name-sorted modules, so every group reads A to Z.
	for ( const $module of Object.values( modules ).sort( compareModulesByName ) ) {
		if ( ! $module.available || covered.has( $module.module ) || hidden.has( $module.module ) ) {
			continue;
		}

		const index = groupOf.get( $module.module );
		( index === undefined ? other : grouped[ index ].states ).push(
			getModuleFeatureState( $module, requested )
		);
	}
	// Sorted on the translated label, so the order holds in every locale.
	grouped.sort( ( a, b ) => a.label.localeCompare( b.label ) );

	return [ ...grouped, { label: __( 'Other', 'jetpack-my-jetpack' ), states: other } ].filter(
		group => group.states.length > 0
	);
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
 * Classic-theme modules: a block theme has no widget areas for them to act on.
 */
const WIDGET_MODULES = [ 'widgets', 'widget-visibility' ];

/**
 * Modules on their way out, offered only to a site already running them.
 *
 * @return The slugs.
 */
export function getDeprecatedModules(): string[] {
	const isBlockTheme = Boolean( getScriptData()?.myJetpack?.siteEditor?.isBlockTheme );

	return [ ...LEGACY_MODULES_VISIBLE_ONLY_WHEN_ACTIVE, ...( isBlockTheme ? WIDGET_MODULES : [] ) ];
}

// Module-scoped so a module switched off here keeps its row, and its switch back on, until a reload.
let deprecatedActiveOnLoad: ReadonlySet< string > | null = null;

/**
 * The deprecated modules to leave out: those that were off when the modules first loaded.
 *
 * @param modules - Every Jetpack module on the site.
 * @return The slugs to leave out.
 */
export function getHiddenModules( modules: Record< string, MyJetpackModule > ): Set< string > {
	// The store starts out as `{}`, not undefined: taking that as the page-load state would hide
	// a module the moment it is switched off.
	if ( ! deprecatedActiveOnLoad && Object.keys( modules ).length ) {
		deprecatedActiveOnLoad = new Set(
			getDeprecatedModules().filter( slug => modules[ slug ]?.activated )
		);
	}

	return new Set( getDeprecatedModules().filter( slug => ! deprecatedActiveOnLoad?.has( slug ) ) );
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
						requested,
						getHiddenModules( modules )
					)
				: [],
		[ state, modules, requested ]
	);
}
