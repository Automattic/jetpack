import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

const NAMESPACE = 'jetpack/social';

const KEY = 'temp_social_per_network_customization';

/**
 * TEMPORARY hook to manage per network customization toggle state.
 *
 * TODO: Replace this with a persistent solution once available.
 *
 * @return User preferences.
 */
export function usePerNetworkCustomization() {
	const preferences = useDispatch( preferencesStore );

	const isEnabled = useSelect(
		select => Boolean( select( preferencesStore ).get( NAMESPACE, KEY ) ),
		[]
	);

	const toggle = useCallback( () => preferences.toggle( NAMESPACE, KEY ), [ preferences ] );

	return useMemo(
		() => ( {
			isEnabled,
			toggle,
		} ),
		[ isEnabled, toggle ]
	);
}
