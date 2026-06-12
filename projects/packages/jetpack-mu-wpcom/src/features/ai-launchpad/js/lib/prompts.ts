import type { WizardInput } from './types.ts';

/**
 * Allowed task IDs the model may pick from. Snake_case catalog IDs drawn from
 * launchpad-task-definitions.php (verified 2026-06-02). Kept in lockstep with
 * the TASK_MENU constant in docs/bin/eval-ai-launchpad.mjs so the eval runner
 * exercises the same menu the production prompt does.
 */
export const TASK_MENU: readonly string[] = [
	'first_post_published',
	'first_post_published_newsletter',
	'write_3_posts',
	'site_theme_selected',
	'add_about_page',
	'add_new_page',
	'update_about_page',
	'edit_page',
	'design_edited',
	'design_completed',
	'design_selected',
	'domain_claim',
	'domain_upsell',
	'domain_customize',
	'verify_email',
	'complete_profile',
	'site_title',
	'setup_general',
	'site_launched',
	'blog_launched',
	'woo_launch_site',
	'link_in_bio_launched',
	'set_up_payments',
	'stripe_connected',
	'paid_offer_created',
	'woo_products',
	'woo_customize_store',
	'woo_woocommerce_payments',
	'woo_tax',
	'woo_marketing',
	'woo_add_domain',
	'add_10_email_subscribers',
	'subscribers_added',
	'import_subscribers',
	'newsletter_plan_created',
	'setup_newsletter',
	'customize_welcome_message',
	'enable_subscribers_modal',
	'manage_subscribers',
	'manage_paid_newsletter_plan',
	'add_subscribe_block',
	'earn_money',
	'connect_social_media',
	'sensei_setup',
	'install_custom_plugin',
	'setup_ssh',
	'site_monitoring_page',
	'mobile_app_installed',
	'post_sharing_enabled',
	'share_site',
	'front_page_updated',
	'drive_traffic',
	'start_building_your_audience',
];

/**
 * Build the single combined prompt sent to jetpack-ai-query. Ported from the
 * wp-calypso PoC's buildCombinedPromptFromIntent, adapted to the snake_case
 * catalog menu and the agent-output-schema shape ({ tasks, inferred,
 * first_post_draft }). English only (v1).
 *
 * @param input - The collected wizard input.
 * @return The prompt string.
 */
export function buildTailorPrompt( input: WizardInput ): string {
	const { goal, site_name, description } = input;

	return `You are helping a new WordPress.com user onboard. They have described their site in their own words. Produce THREE things in a single JSON response: a tailored task list, an inferred-context blob, and a starter blog post draft.

Site name: ${ site_name }
Goal: ${ goal }
User description: ${ description }

============ tasks ============
- Pick exactly 6 tasks from the menu below. The "id" of every task MUST come from the menu verbatim (never invent IDs). Write a short English "subtitle" (max 200 characters) for each task explaining what it does for this specific site.
- Build the list in this order:
  STEP 1 - Pick exactly ONE first-creation task that matches the goal:
    - write / blog / articles -> "first_post_published"
    - newsletter / email digest -> "first_post_published_newsletter" or "first_post_published"
    - sell / store / products -> "woo_products"
    - build / portfolio / showcase -> "first_post_published" or "add_about_page"
  STEP 2 - Pick 2-3 niche-specific tasks that match the user's description and goal (e.g. "add_about_page", "woo_customize_store", "set_up_payments", "add_10_email_subscribers", "connect_social_media", "site_theme_selected").
  STEP 3 - Fill the remaining slots with foundation tasks: "site_theme_selected", "complete_profile", "verify_email", "design_edited", "drive_traffic".
  STEP 4 - The 6th and final task MUST be a launch task. Use "site_launched" (canonical) unless a flow-specific launch task fits better: "blog_launched", "woo_launch_site", or "link_in_bio_launched".

  HARD RULES (do not break):
    - Never include "woo_products", "set_up_payments", "stripe_connected", or "woo_woocommerce_payments" UNLESS the goal is sell or the user explicitly mentions selling, products, store, shop, or commerce.
    - Never include "add_10_email_subscribers", "subscribers_added", or "newsletter_plan_created" UNLESS the goal is newsletter or the user explicitly mentions email subscribers or a newsletter.
    - Every "id" must appear in the menu. Drop any task you cannot map to a menu ID.

============ inferred ============
Extract these fields from the user's description. Reused downstream by the theme picker and post draft.
- "goal": echo the goal value above verbatim. One of: write, build, sell, newsletter, educate, portfolio. Required.
- "brand_name": the site name. Per the name-resolution rule below.
- "niche": subject area in a few words (e.g. "long-distance hiking", "handmade ceramics").
- "vibe": aesthetic hint if implied (e.g. "minimal and editorial", "warm and personal"). Omit if neutral.
- "audience": who the site is for, if implied.
- "tagline": a polished site tagline drafted from the description. Max 200 characters. Noun phrase or third person, not first-person.

============ first_post_draft ============
Write a friendly starter blog post the user can edit and publish.
- "title": clear and evocative, max 8 words.
- "subtitle": ONE line, verb-led, max 10 words, describing what publishing this post does for them. Optional.
- "paragraphs": exactly 2 short paragraphs of opening body text. First introduces the topic in a warm, personal voice; second invites the reader in. Plain English, no jargon. Avoid "Welcome to my blog" and "Hello world" cliches.

============ name resolution ============
Treat the "Site name:" value above as THE ONLY brand/name to use anywhere - in the title, subtitle, paragraphs, and inferred.brand_name. It overrides any name mentioned inside the user description. If the description names a different brand, ignore it and use the "Site name:" value.

============ available task menu ============
${ TASK_MENU.map( id => '- ' + id ).join( '\n' ) }

============ format ============
Return only a JSON object matching this schema. Do not include prose, code fences, or commentary. The first character MUST be "{".

{
  "tasks": [ { "id": "...", "subtitle": "..." }, ... 6 total ],
  "inferred": { "goal": "...", "brand_name": "...", "niche": "...", "vibe": "...", "audience": "...", "tagline": "..." },
  "first_post_draft": { "title": "...", "subtitle": "...", "paragraphs": [ "...", "..." ] }
}`;
}
