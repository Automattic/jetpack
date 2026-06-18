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
 * Mirrors contracts/agent-output-schema.json. Length and content constraints
 * (exactly 6 tasks, subtitle <= 200 chars, exactly 2 paragraphs, ...) are
 * enforced by Ajv validation, not by the type system.
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
