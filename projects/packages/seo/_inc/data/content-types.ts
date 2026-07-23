// Types for the Content tab, which lists supported post types backed by
// WordPress core REST plus the SEO post meta registered in
// `class-jetpack-seo-posts.php`. There is no package REST controller — every
// field here comes from a core REST record's `meta` object.

// The allowed per-post Schema.org override. Mirrors
// `Jetpack_SEO_Posts::ALLOWED_SCHEMA_TYPES` ('' = no override / default).
export type SchemaType = '' | 'article' | 'faq';

// The SEO post meta as it arrives in a core REST record's `meta` object.
export interface SeoPostMeta {
	advanced_seo_description: string;
	jetpack_seo_html_title: string;
	jetpack_seo_noindex: boolean;
	jetpack_seo_schema_type: SchemaType;
}

// The post type slug the Content tab is currently listing/editing.
export type ContentPostType = string;

// A single row in the Content DataViews table. Factual flags only — the table
// reports the *state* of each SEO field, never a score or quality judgement.
export interface ContentRow {
	id: number;
	title: string;
	link: string;
	editLink: string;
	type: string;
	status: string;
	// The four editable SEO meta fields, plus derived presence flags.
	customTitle: string;
	description: string;
	schemaType: SchemaType;
	noindex: boolean;
	hasCustomTitle: boolean;
	hasDescription: boolean;
}

// An option for the post-type filter.
export interface PostTypeOption {
	value: ContentPostType;
	label: string;
}

// The PHP-selected post types preloaded for the Content tab. This keeps the
// client aligned with the supported-type rule used for Overview and llms.txt.
export interface ContentData {
	post_types: Array< {
		slug: ContentPostType;
		label: string;
	} >;
}

// Optimistic adjustment applied to the Overview coverage counts when a post's
// SEO is saved on the Content tab: +1 / -1 / 0 per metric depending on whether
// the field became set or unset.
export interface CoverageDelta {
	schema: number;
	title: number;
	description: number;
	search_visible: number;
}
