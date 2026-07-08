export type GoalSlug = 'write' | 'build' | 'sell' | 'newsletter' | 'educate' | 'portfolio';

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
	theme_keyword?: string;
	vibe?: string;
	audience?: string;
	tagline?: string;
}

export interface FirstPostDraft {
	title: string;
	subtitle?: string;
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
}

export type TailorSource = 'ai' | 'fallback';

export interface TailorResult {
	source: TailorSource;
	output: TailoredOutput;
}

export type TrackEventProps = Record< string, string | number | boolean >;
