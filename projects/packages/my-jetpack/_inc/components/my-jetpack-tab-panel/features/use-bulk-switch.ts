import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useInstallPlugins from '../../../data/products/use-install-plugins';
import useAnalytics from '../../../hooks/use-analytics';
import { partitionSelection } from './partition-selection';
import type { FeatureState } from './feature-state';

/**
 * Switching a set of features on or off in one go.
 *
 * A set can mix product-backed features with module-backed ones, so each call fans out
 * to both: the plugin endpoints take a list of products, while the modules store takes
 * one module at a time and so runs in sequence.
 *
 * The plugin hooks bind their product list at render, which would tie every call to
 * whatever was selected when the row rendered. The mutation merges what it is called
 * with over that list, so each call carries its own products and one row's action and
 * a whole selection's can share these handlers.
 *
 * @param states - Every feature on the page.
 * @return Handlers that take the slugs to act on.
 */
export function useBulkSwitch( states: FeatureState[] ) {
	const { recordEvent } = useAnalytics();
	const { createErrorNotice } = useGlobalNotices();
	const { updateJetpackModuleStatus } = useDispatch( modulesStore );

	// Bound to everything switchable, so the hooks' own success notices and refetches
	// cover whichever subset a call turns out to name.
	const switchable = useMemo(
		() => states.filter( state => state.switchable ).map( state => state.feature.product ),
		[ states ]
	);

	const { install } = useInstallPlugins( switchable );
	const { activate } = useActivatePlugins( switchable );
	const { deactivate } = useDeactivatePlugins( switchable );

	const runModules = useCallback(
		async ( names: string[], active: boolean ) => {
			const failed: string[] = [];

			for ( const name of names ) {
				if ( ! ( await updateJetpackModuleStatus( { name, active } ) ) ) {
					failed.push( name );
				}
			}

			if ( failed.length ) {
				createErrorNotice(
					sprintf(
						/* translators: %s is a comma-separated list of module slugs. */
						__( 'Could not update: %s.', 'jetpack-my-jetpack' ),
						failed.join( ', ' )
					)
				);
			}
		},
		[ createErrorNotice, updateJetpackModuleStatus ]
	);

	const activateAll = useCallback(
		async ( slugs: string[] ) => {
			const { toInstall, toActivate, modulesOn } = partitionSelection( states, slugs );

			recordEvent( 'jetpack_myjetpack_features_bulk_activate', { count: slugs.length } );

			if ( toInstall.length ) {
				install( { data: { products: toInstall } } );
			}

			if ( toActivate.length ) {
				activate( { data: { products: toActivate } } );
			}

			await runModules( modulesOn, true );
		},
		[ activate, install, recordEvent, runModules, states ]
	);

	const deactivateAll = useCallback(
		async ( slugs: string[] ) => {
			const { toDeactivate, modulesOff } = partitionSelection( states, slugs );

			recordEvent( 'jetpack_myjetpack_features_bulk_deactivate', { count: slugs.length } );

			if ( toDeactivate.length ) {
				deactivate( { data: { products: toDeactivate } } );
			}

			await runModules( modulesOff, false );
		},
		[ deactivate, recordEvent, runModules, states ]
	);

	return { activateAll, deactivateAll };
}
