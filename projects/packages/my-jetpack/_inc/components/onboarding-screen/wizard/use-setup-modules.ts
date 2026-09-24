import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from 'react';
import { requestModuleSwitch } from '../../../data/module-switch';
import { isWanted } from './lib';
import type { MyJetpackModule } from '../../../types';

/**
 * What the wizard offers, in order.
 *
 * Jetpack modules rather than My Jetpack's feature cards, which is not a detail:
 * the Protect card installs the standalone Protect plugin, while what Devin's list
 * means by Brute Force Protection is the `protect` module inside Jetpack. Two of
 * the others have no card at all. Going through modules keeps one control for all
 * six and never installs anything.
 *
 * A plain array, so swapping one out by site type stays a one-line change.
 */
export const SETUP_MODULES = [
	'stats',
	'contact-form',
	'protect',
	'activity-log',
	'subscriptions',
	'monitor',
] as const;

export type SetupModuleSlug = ( typeof SETUP_MODULES )[ number ];

export type SetupModule = {
	slug: SetupModuleSlug;
	// Jetpack's own name and line for the module, already translated. Written here
	// would be a second copy of both, free to drift and untranslated until someone
	// noticed.
	name: string;
	description: string;
	// Whether the site runs it now. Five of the six ship on, so this screen mostly
	// shows the user what was going to happen anyway.
	activated: boolean;
};

/**
 * What became of one module when the choices were applied.
 */
export type SetupModuleResult = {
	slug: SetupModuleSlug;
	name: string;
	// What the user asked for.
	wanted: boolean;
	// Whether the site now agrees. False is the case the finish screen must not hide.
	ok: boolean;
};

/**
 * The six modules the wizard offers, with whatever the site says about them.
 *
 * @return The modules in order, and whether their state is still being read.
 */
export function useSetupModules(): { modules: SetupModule[]; isLoading: boolean } {
	const { modules, isLoading } = useSelect( select => {
		const store = select( modulesStore ) as {
			getJetpackModules: () => Record< string, MyJetpackModule >;
			areModulesLoading: () => boolean;
		};

		return { modules: store.getJetpackModules(), isLoading: store.areModulesLoading() };
	}, [] );

	return useMemo(
		() => ( {
			isLoading,
			// A module Jetpack does not have on this site is left out rather than
			// rendered as a row that cannot be switched.
			modules: SETUP_MODULES.filter( slug => modules?.[ slug ] ).map( slug => ( {
				slug,
				name: modules[ slug ].name,
				description: modules[ slug ].description,
				activated: Boolean( modules[ slug ].activated ),
			} ) ),
		} ),
		[ modules, isLoading ]
	);
}

/**
 * Switch the chosen modules on, and the unchosen ones off.
 *
 * Every switch is reported, including the ones that did not take. The bulk route
 * would be fewer requests, but it answers for plugins and cards this screen does
 * not use, and `requestModuleSwitch` already returns a plain yes or no per module
 * through the same activation queue the rest of My Jetpack switches through.
 *
 * @return The handler, and whether it is running.
 */
export function useApplySetupModules() {
	const { updateJetpackModuleStatus: toggleModule } = useDispatch( modulesStore ) as {
		updateJetpackModuleStatus: ( args: { name: string; active: boolean } ) => Promise< unknown >;
	};
	const [ isApplying, setIsApplying ] = useState( false );

	const apply = useCallback(
		async ( modules: SetupModule[], wanted: Record< string, boolean > ) => {
			setIsApplying( true );

			const results: SetupModuleResult[] = [];

			// One at a time: the queue serialises them anyway, and a module that fails
			// should not be reported against whatever a parallel request did next.
			for ( const module of modules ) {
				const want = isWanted( wanted, module.slug );
				const ok =
					want === module.activated
						? true
						: await requestModuleSwitch( toggleModule, module.slug, want );

				results.push( { slug: module.slug, name: module.name, wanted: want, ok } );
			}

			setIsApplying( false );

			return results;
		},
		[ toggleModule ]
	);

	return { apply, isApplying };
}
