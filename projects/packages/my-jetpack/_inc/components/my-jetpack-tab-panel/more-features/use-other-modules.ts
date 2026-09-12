import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import type { MyJetpackModule } from '../../../types';

export type ModuleGroup = {
	label: string;
	modules: MyJetpackModule[];
};

/**
 * The modules the Features list does not account for, under their group headings.
 *
 * Anything the catalog does not place lands in Other, so a new Jetpack module shows up
 * unsorted rather than vanishing from the list.
 *
 * @return The groups in catalog order, the flat list behind them, and the loading flag.
 */
export function useOtherModules(): {
	groups: ModuleGroup[];
	modules: MyJetpackModule[];
	isLoading: boolean;
} {
	const { modules, isLoading } = useAllJetpackModules();
	const covered = getMyJetpackWindowInitialState( 'coveredModules' ) as unknown as string[];
	const groupDefinitions = getMyJetpackWindowInitialState( 'moduleGroups' ) as unknown as Array< {
		label: string;
		modules: string[];
	} >;

	return useMemo( () => {
		const skip = new Set( covered || [] );
		const rest = Object.values( modules || {} ).filter(
			( item: MyJetpackModule ) => item?.module && ! skip.has( item.module )
		);

		const bySlug = new Map( rest.map( item => [ item.module, item ] ) );
		const placed = new Set< string >();

		const groups: ModuleGroup[] = ( groupDefinitions || [] )
			.map( definition => {
				const members = definition.modules
					.map( slug => bySlug.get( slug ) )
					.filter( ( item ): item is MyJetpackModule => {
						if ( ! item ) {
							return false;
						}

						placed.add( item.module );
						return true;
					} );

				members.sort( ( a, b ) => a.name.localeCompare( b.name ) );

				return { label: definition.label, modules: members };
			} )
			.filter( group => group.modules.length > 0 );

		const unplaced = rest.filter( item => ! placed.has( item.module ) );
		unplaced.sort( ( a, b ) => a.name.localeCompare( b.name ) );

		if ( unplaced.length ) {
			groups.push( { label: __( 'Other', 'jetpack-my-jetpack' ), modules: unplaced } );
		}

		return { groups, modules: rest, isLoading };
	}, [ covered, groupDefinitions, isLoading, modules ] );
}
