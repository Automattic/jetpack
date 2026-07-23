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
 * Task ids whose page is hand-authored markup with one AI-written opening line in it.
 *
 * The union is the contract's `page_intros` property list; adding a page task means adding its id
 * here and in both copies of the schema.
 */
export type PageIntroTaskId =
	| 'add_contact_page'
	| 'add_events_page'
	| 'add_video_page'
	| 'add_gallery_page';

/**
 * Opening lines for the page tasks, keyed by the task id they belong to.
 *
 * Every key is optional: the model writes one only for a page task it actually selected.
 */
export type PageIntros = Partial< Record< PageIntroTaskId, string > >;

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
	// Optional in the schema too: present only when a page task carrying an intro was selected.
	page_intros?: PageIntros;
}

export type TailorSource = 'ai' | 'fallback';

export interface TailorResult {
	source: TailorSource;
	output: TailoredOutput;
}

export type TrackEventProps = Record< string, string | number | boolean | null >;
