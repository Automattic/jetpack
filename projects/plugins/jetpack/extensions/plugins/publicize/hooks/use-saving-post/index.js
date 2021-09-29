/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * React hook to detect when the post is just saved.
 * It accepts a dependency array which is passed to useEffect hook.
 *
 * @param {Function} fn - Callback function to run when the post is just saved.
 * @param {Array} deps  - Depencency array.
 */
export function usePostJustSaved( fn, deps ) {
	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );

	useEffect( () => {
		if ( ! ( wasSaving && ! isSaving ) ) {
			return;
		}

		fn();
	}, [ isSaving, wasSaving, fn, deps ] );
}

/**
 * React hook to detect when the post is just published,
 * It accepts a dependency array which is passed to useEffect hook.
 *
 * @param {Function} fn - Callback function to run when the post is just published.
 * @param {Array} deps  - Depencency array.
 */
export function usePostJustPublished( fn, deps ) {
	const isPublishing = useSelect( select => select( editorStore ).isPublishingPost(), [] );
	const wasPublishing = usePrevious( isPublishing );

	useEffect( () => {
		if ( ! ( wasPublishing && ! isPublishing ) ) {
			return;
		}

		fn();
	}, [ isPublishing, wasPublishing, fn, deps ] );
}

/**
 * React hook to detect when the post is going to be published,
 * It accepts a dependency array which is passed to useEffect hook.
 *
 * @param {Function} fn - Callback function to run when the post going to be published.
 * @param {Array} deps  - Depencency array.
 */
export function usePostJustBeforeToPublish( fn, deps ) {
	const isPublishing = useSelect( select => select( editorStore ).isPublishingPost(), [] );
	const wasPublishing = usePrevious( isPublishing );

	useEffect( () => {
		if ( ! ( ! wasPublishing && isPublishing ) ) {
			return;
		}

		fn();
	}, [ isPublishing, wasPublishing, fn, deps ] );
}
