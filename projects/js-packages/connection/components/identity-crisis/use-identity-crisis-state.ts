import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';
import { toConnectedPlugins } from '../../helpers/site-words';
import { STORE_ID } from '../../state/store';
import type { ConnectedPlugin } from '../../helpers/site-words';
import type { IdentityCrisisState } from '../../types';

type StoreSelector = ( storeId: string ) => Record< string, ( ...args: unknown[] ) => unknown >;

interface IdentityCrisisStoreState {
	/** Null outside Safe Mode. */
	state: IdentityCrisisState | null;
	plugins: ConnectedPlugin[];
}

/**
 * Whether a raw store value is the Safe Mode state; the server sends `IdentityCrisisState | null`.
 *
 * @param value - The raw `getIdentityCrisis()` value.
 * @return Whether it can be read as the Safe Mode state.
 */
function isIdentityCrisisState( value: unknown ): value is IdentityCrisisState {
	return (
		!! value &&
		typeof value === 'object' &&
		'canResolve' in value &&
		typeof value.canResolve === 'boolean'
	);
}

/**
 * The Safe Mode state and the connected plugins, from the connection store's initial state.
 *
 * @return The state.
 */
export default function useIdentityCrisisState(): IdentityCrisisStoreState {
	// Raw values only: a list built inside `useSelect` would be new on every call.
	const { state, plugins } = useSelect(
		( select: StoreSelector ) => ( {
			state: select( STORE_ID ).getIdentityCrisis(),
			plugins: select( STORE_ID ).getConnectedPlugins(),
		} ),
		[]
	);

	const connectedPlugins = useMemo( () => toConnectedPlugins( plugins ), [ plugins ] );

	return { state: isIdentityCrisisState( state ) ? state : null, plugins: connectedPlugins };
}
