import { useMemo } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import type { MyJetpackModule } from '../../../types';

/**
 * The modules the Features tab does not already account for.
 *
 * This is the same set the legacy Modules screen lists, minus anything a feature
 * already represents — the eventual shape of "More features", once each of these has
 * found a home inside the feature that owns it.
 *
 * @return The remaining modules, sorted by name, and whether they are still loading.
 */
export function useOtherModules(): { modules: MyJetpackModule[]; isLoading: boolean } {
	const { modules, isLoading } = useAllJetpackModules();
	const covered = getMyJetpackWindowInitialState( 'coveredModules' ) as unknown as string[];

	return useMemo( () => {
		const skip = new Set( covered || [] );
		const rest = Object.values( modules || {} ).filter(
			( item: MyJetpackModule ) => item?.module && ! skip.has( item.module )
		);

		rest.sort( ( a, b ) => a.name.localeCompare( b.name ) );

		return { modules: rest, isLoading };
	}, [ covered, isLoading, modules ] );
}
