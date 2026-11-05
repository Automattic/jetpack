/**
 * Mirrors the `attributes` in `widget.json`. The date range is owned by the
 * dashboard picker, not by these attributes.
 */
export type TopPostsAttributes = {
	/**
	 * Which report the widget shows: published posts and pages (including the
	 * homepage entry, via `skip_archives=1`), or archive pages (taxonomy,
	 * post-type, search, and date archives).
	 */
	contentView?: 'posts' | 'archives';
};

/**
 * Ported from the Jetpack Stats "Most viewed" card. The active view is the
 * `contentView` attribute (`relevance: 'high'`), so the widget host renders
 * its control in the frame header.
 */
export default {
	example: {
		attributes: {
			contentView: 'posts',
		},
	},
};
