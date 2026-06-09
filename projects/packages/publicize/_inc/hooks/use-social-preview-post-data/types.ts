import { LinkPreviewData } from '../use-link-preview-post-data/types';
import type { AnchorLink } from '@automattic/social-previews';

export type PostPreviewData = LinkPreviewData & {
	excerpt: string;
	anchorLinks?: Array< AnchorLink >;
	media: Array< {
		type: string;
		url: string;
		alt?: string;
	} >;
};
