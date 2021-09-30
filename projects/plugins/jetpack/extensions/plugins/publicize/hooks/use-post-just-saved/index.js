/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * React hook to detect when the post is just saved.
 * It will run the callback when the post is just saved.
 * Also, it accepts a dependency array passed to useEffect hook.
 *
 * @param {Function} fn - Callback function to run when the post is just saved.
 * @param {Array} deps  - Depencency array.
 */
export default function usePostJustSaved( fn, deps ) {
	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );

	useEffect( () => {
		if ( ! ( wasSaving && ! isSaving ) ) {
			return;
		}

		fn();
	}, [ isSaving, wasSaving, fn, deps ] );
}
