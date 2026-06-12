import type { TailoredOutput, WizardInput } from './types.ts';

/**
 * Deterministic fallback when the AI call fails or returns invalid output.
 * Stream F replaces this body with the per-goal picker ported from the PoC's
 * select-tasks.ts. The stub returns a schema-valid default: six real catalog
 * task IDs with launch last.
 */
export function selectFallback( input: WizardInput ): TailoredOutput {
	return {
		tasks: [
			{ id: 'first_post_published', subtitle: 'Write and publish your first post.' },
			{ id: 'site_theme_selected', subtitle: 'Pick a theme that fits your site.' },
			{ id: 'design_edited', subtitle: 'Make the design your own.' },
			{ id: 'verify_email', subtitle: 'Confirm your email address.' },
			{ id: 'drive_traffic', subtitle: 'Help people find your site.' },
			{ id: 'site_launched', subtitle: 'Launch your site for the world to see.' },
		],
		inferred: {
			goal: input.goal,
			brand_name: input.site_name,
		},
		first_post_draft: {
			title: 'Hello from ' + input.site_name,
			paragraphs: [
				'This is the first post on ' + input.site_name + '. It marks the starting point of something new.',
				'There is more to come. Stay tuned for the next update.',
			],
		},
	};
}
