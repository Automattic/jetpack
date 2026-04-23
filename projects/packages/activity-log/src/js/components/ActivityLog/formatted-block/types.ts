export interface ActivityBlockNode {
	type?: string;
	text?: string | null;
	children?: ActivityBlockContent[];
	url?: string | null;
	activity?: string;
	section?: string;
	intent?: string;
	// `id` arrives on anchor ranges that carry a `section` hint (e.g. the
	// local WP user id on a user anchor). Typed entity ranges put their
	// identifier into a dedicated field (postId/userId/…) instead.
	id?: number | string;
	siteId?: number | string;
	postId?: number | string;
	isTrashed?: boolean;
	commentId?: number | string;
	userId?: number | string;
	name?: string;
	siteSlug?: string;
	pluginSlug?: string;
	themeUri?: string;
	themeSlug?: string;
	version?: string;
	rewindId?: string;
}

export type ActivityBlockContent = string | ActivityBlockNode;

export interface ActivityBlockMeta {
	activity?: string;
	intent?: string;
	section?: string;
	published?: number | string;
}
