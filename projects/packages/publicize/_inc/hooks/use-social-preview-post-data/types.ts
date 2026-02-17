import { LinkPreviewData } from '../use-link-preview-post-data/types';

export type PostPreviewData = LinkPreviewData & {
	excerpt: string;
	media: Array< {
		type: string;
		url: string;
		alt?: string;
	} >;
};
