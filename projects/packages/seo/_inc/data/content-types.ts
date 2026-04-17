export type SeoStatus = 'good' | 'fair' | 'poor';

export type SchemaType = '' | 'article' | 'faq' | 'howto' | 'localbusiness' | 'organization';

export interface SeoPostItem {
	id: number;
	title: string;
	permalink: string;
	edit_link: string;
	post_type: string;
	status: string;
	seo_title: string;
	seo_description: string;
	schema_type: SchemaType;
	noindex: boolean;
	seo_status: SeoStatus;
}

export interface SeoPostsResponse {
	items: SeoPostItem[];
	total: number;
	pages: number;
	page: number;
}

export interface SeoPostUpdatePayload {
	seo_title?: string;
	seo_description?: string;
	schema_type?: SchemaType;
	noindex?: boolean;
}
