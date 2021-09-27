/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * React hook to detect when the post is just published.
 * It will run the callback when the post is just published.
 * Also, it accepts a dependency array passed to useEffect hook.
 *
 * @param {Function} fn - Callback function to run when the post is just published.
 * @param {Array} deps  - Depencency array.
 */
export default function usePostJustPublished( fn, deps ) {
	const isPublishing = useSelect( select => select( editorStore ).isPublishingPost(), [] );
	const wasPublishing = usePrevious( isPublishing );

	useEffect( () => {
		if ( ! ( wasPublishing && ! isPublishing ) ) {
			return;
		}

		fn();
	}, [ isPublishing, wasPublishing, fn, deps ] );
}
