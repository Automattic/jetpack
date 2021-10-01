/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Hook action to run a function before the post is saved.
 *
 * @param {Object}        params  - hook parameters.
 * @param {boolean} params.after  - whether to check the process after the post is saved. Default: True.
 * @param {string} params.process - process to check. Default: 'save'.
 * @param {Function}           fn - callback function.
 * @param {Array}            deps - Hook dependencies.
 */
function useProcessingPost( params, fn, deps = [] ) {
	const { after = true, process = 'save' } = params;
	const selector = 'save' === process ? 'isSavingPost' : 'isPublishingPost';
	const isProcessing = useSelect( select => select( editorStore )[ selector ](), [] );
	const wasProcessing = usePrevious( isProcessing );

	useEffect( () => after === wasProcessing && after !== isProcessing && fn(), [
		isProcessing,
		wasProcessing,
		after,
		fn,
		deps,
	] );
}

/**
 * Hook action to run a function after the post is just saved.
 *
 * @param {Function} fn - callback function.
 * @param {Array}  deps - Hook dependencies.
 * @returns {Function} The hook function.
 */
export function usePostJustSaved( fn, deps ) {
	return useProcessingPost( { after: true, process: 'save' }, fn, deps );
}

/**
 * Hook action to run a function before the post is saved.
 *
 * @param {Function} fn - callback function.
 * @param {Array}  deps - Hook dependencies.
 * @returns {Function} The hook function.
 */
export function usePostJustBeforeSave( fn, deps ) {
	return useProcessingPost( { after: false, process: 'save' }, fn, deps );
}

/**
 * Hook action to run a function after the post is just published.
 *
 * @param {Function} fn - callback function.
 * @param {Array}  deps - Hook dependencies.
 * @returns {Function} The hook function.
 */
export function usePostJustPublished( fn, deps ) {
	return useProcessingPost( { after: true, process: 'publish' }, fn, deps );
}

/**
 * Hook action to run a function before the post is published.
 *
 * @param {Function} fn - callback function.
 * @param {Array}  deps - Hook dependencies.
 * @returns {Function} The hook function.
 */
export function usePostJustBeforePublish( fn, deps ) {
	return useProcessingPost( { after: false, process: 'publish' }, fn, deps );
}
