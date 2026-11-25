import requireSeoTools from '../../_inc/data/require-seo-tools';

// The Content route shows the per-post SEO editor in wp-build's native inspector
// sidebar whenever a post is selected via `?postId`.
export const route = {
	beforeLoad: requireSeoTools,

	/**
	 * Show the inspector only when a post is selected.
	 *
	 * @param props               - Route props.
	 * @param props.search        - The search parameters.
	 * @param props.search.postId - The selected post id, when set.
	 * @return Whether to render the inspector.
	 */
	inspector: ( { search }: { search: { postId?: string } } ) => !! search?.postId,
};
