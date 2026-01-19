import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo } from '@wordpress/element';

const KEY = '_wpas_customize_per_network';

/**
 * Hook to manage per network customization toggle state.
 *
 * @return - An object containing isEnabled boolean and toggle function.
 */
export function usePerNetworkCustomization() {
	const { editPost } = useDispatch( editorStore );

	const isEnabled = useSelect( select => {
		const postMeta = select( editorStore ).getEditedPostAttribute( 'meta' );

		return Boolean( postMeta?.[ KEY ] );
	}, [] );

	const toggle = useCallback( () => {
		// Update post metadata.
		editPost( {
			meta: {
				[ KEY ]: ! isEnabled,
			},
		} );
	}, [ editPost, isEnabled ] );

	return useMemo(
		() => ( {
			isEnabled,
			toggle,
		} ),
		[ isEnabled, toggle ]
	);
}
