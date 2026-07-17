import { LinkPreviewData } from '../use-link-preview-post-data/types';
import type { Hyperlink } from '@automattic/social-previews';

export type PostPreviewData = LinkPreviewData & {
	excerpt: string;
	hyperlinks?: Array< Hyperlink >;
	media: Array< {
		type: string;
		url: string;
		alt?: string;
	} >;
};
