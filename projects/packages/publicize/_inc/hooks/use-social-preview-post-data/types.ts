import { LinkPreviewData } from '../use-link-preview-post-data/types';

export type PostPreviewData = LinkPreviewData & {
	media: Array< {
		type: string;
		url: string;
		alt?: string;
	} >;
};
