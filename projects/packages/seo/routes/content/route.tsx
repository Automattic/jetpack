import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';

// The Content route shows the per-post SEO editor in wp-build's native inspector
// sidebar whenever a post is selected via `?postId`.
export const route = {
	/**
	 * Show the inspector only when a post is selected and SEO tools are active —
	 * when the module is off the stage shows the enable card instead of the list,
	 * so a deep-linked `?postId` shouldn't open the (non-savable) editor.
	 *
	 * @param props               - Route props.
	 * @param props.search        - The search parameters.
	 * @param props.search.postId - The selected post id, when set.
	 * @return Whether to render the inspector.
	 */
	inspector: ( { search }: { search: { postId?: string } } ) =>
		isSeoToolsActive() && !! search?.postId,
};
