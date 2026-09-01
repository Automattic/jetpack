import { LinkPreviewData } from '../use-link-preview-post-data/types';

/**
 * No `hyperlinks` here on purpose: which anchors survive into a share message
 * depends on the rendered template, which only the server knows. They arrive
 * per-connection on `ConnectionPreviewData` instead.
 */
export type PostPreviewData = LinkPreviewData & {
	excerpt: string;
	media: Array< {
		type: string;
		url: string;
		alt?: string;
	} >;
};
