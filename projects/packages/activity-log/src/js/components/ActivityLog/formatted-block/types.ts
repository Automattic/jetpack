export interface ActivityBlockNode {
	type?: string;
	text?: string | null;
	children?: ActivityBlockContent[];
	url?: string | null;
	activity?: string;
	section?: string;
	intent?: string;
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
