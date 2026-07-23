export type GoalSlug = 'write' | 'build' | 'sell' | 'newsletter' | 'educate' | 'portfolio';

// The theme showcase's subject-category slugs (the `subject` taxonomy from
// /rest/v1.2/theme-filters). Every category carries free themes, which is why
// the theme task filters by category instead of free-text search.
export type ThemeCategorySlug =
	| 'blog'
	| 'portfolio'
	| 'business'
	| 'store'
	| 'art-design'
	| 'about'
	| 'real-estate'
	| 'health-wellness'
	| 'authors-writers'
	| 'newsletter'
	| 'education'
	| 'magazine'
	| 'music'
	| 'restaurant'
	| 'travel-lifestyle'
	| 'fashion-beauty'
	| 'community-non-profit'
	| 'podcast'
	| 'entertainment';

export interface WizardInput {
	goal: GoalSlug;
	site_name: string;
	description: string;
	locale: string;
}

export interface TailoredTask {
	id: string;
	subtitle: string;
}

export interface TailoredInferred {
	goal: GoalSlug;
	brand_name?: string;
	niche?: string;
	theme_category?: ThemeCategorySlug;
	vibe?: string;
	audience?: string;
	tagline?: string;
	// The goal the AI infers from the site name and description alone. Analytics
	// only: never consumed by tailoring or read-side logic.
	inferred_goal?: GoalSlug;
}

export interface FirstPostDraft {
	title: string;
	subtitle?: string;
	paragraphs: string[];
}

export interface AboutPageDraft {
	title: string;
	paragraphs: string[];
}

/**
 * Mirrors contracts/agent-output-schema.json. Length and content constraints are
 * enforced by validation, not by the type system.
 */
export interface TailoredOutput {
	tasks: TailoredTask[];
	inferred: TailoredInferred;
	first_post_draft: FirstPostDraft;
	// Schema-required for new outputs; optional here because older persisted outputs lack it.
	about_page_draft?: AboutPageDraft;
}

export type TailorSource = 'ai' | 'fallback';

export interface TailorResult {
	source: TailorSource;
	output: TailoredOutput;
}

export type TrackEventProps = Record< string, string | number | boolean | null >;
