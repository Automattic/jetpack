import type { WizardInput } from './types.ts';

/**
 * Allowed task IDs the model may pick from, drawn from the catalog. A PHP test
 * guards this list against catalog drift.
 */
export const TASK_MENU: readonly string[] = [
	'first_post_published',
	'first_post_published_newsletter',
	'site_theme_selected',
	'add_about_page',
	'add_new_page',
	'update_about_page',
	'edit_page',
	'design_edited',
	'domain_claim',
	'domain_upsell',
	'domain_customize',
	'verify_email',
	'complete_profile',
	'site_title',
	'setup_general',
	'site_launched',
	'blog_launched',
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
	'share_site',
	'front_page_updated',
	'drive_traffic',
	'start_building_your_audience',
];

/**
 * Build the single combined prompt sent to jetpack-ai-query, producing the
 * inferred blob, task list, and first-post draft in one JSON response. Hard rules
 * mirror the server-side validation so valid output is not rejected.
 *
 * @param input - The collected wizard input.
 * @return The prompt string.
 */
export function buildTailorPrompt( input: WizardInput ): string {
	const { goal, site_name, description } = input;

	return `You are helping a new WordPress.com user onboard. They have described their site in their own words. Your job is to make their onboarding checklist feel hand-picked for THIS site, not generic.

Produce a single JSON object with THREE parts, in this order: an inferred-context blob, a tailored task list, and a starter blog post draft.

Site name: ${ site_name }
Goal: ${ goal }
User description: ${ description }

============ STEP 1 - inferred ============
First, read the description closely and infer the site's context. You will use this to choose and describe the tasks, so do it before anything else.
- "goal": echo the goal value above verbatim. One of: write, build, sell, newsletter, educate, portfolio. Required.
- "brand_name": the site name. Per the name-resolution rule below.
- "niche": the specific subject area in a few words (e.g. "long-distance hiking", "handmade ceramics", "indie game reviews").
- "theme_keyword": ONE lowercase word used to search for matching site designs. Pick the single most significant word for what the site is about, preferring the subject or site type over incidental modifiers: for "my weekend hiking trips" it is "hiking" (never "weekend"); for a handmade-ceramics shop it is "ceramics".
- "vibe": aesthetic hint if implied (e.g. "minimal and editorial", "warm and personal"). Omit if neutral.
- "audience": who the site is for, if implied (e.g. "home cooks", "small-business owners").
- "tagline": a polished site tagline drafted from the description. Max 200 characters. Noun phrase or third person, not first-person.

============ STEP 2 - tasks ============
Now choose the 6 tasks from the menu below that are MOST RELEVANT to this site, judged against the site name, goal, description, and the niche/audience you just inferred. Rank the whole menu by how useful each task is for this specific user and keep the top 6. Do not follow a fixed template - two different sites should get noticeably different lists.

For each chosen task write a "subtitle" (max 200 characters) that is specific and engaging: reference the user's niche, audience, or what they will actually publish or sell, so the checklist reads as written for them. Avoid generic, interchangeable phrasing.

GOOD vs BAD subtitles (illustrations - adapt to the user's own niche, do not copy):
- For a handmade-ceramics studio, "add_about_page" -> GOOD: "Share the story behind your studio and what makes each handmade piece one of a kind." BAD: "Tell visitors who you are."
- For a handmade-ceramics studio, "site_theme_selected" -> GOOD: "Pick a clean, gallery-style theme that lets your ceramics photos take center stage." BAD: "Choose a theme."
- For a weekly cycling newsletter, "first_post_published_newsletter" -> GOOD: "Send your first issue with this week's route, ride notes, and gear picks." BAD: "Send your first newsletter."

HARD RULES (do not break - the server rejects output that violates these):
- Every "id" MUST come from the menu below, verbatim. Never invent IDs. Drop any task you cannot map to a menu ID.
- Return exactly 6 tasks.
- At least one task must create content (e.g. "first_post_published", "first_post_published_newsletter", "woo_products", or "add_about_page").
- The 6th and final task MUST be a launch task: one of "site_launched" (canonical), "blog_launched", or "link_in_bio_launched".
- Only include "woo_products", "woo_customize_store", "set_up_payments", "stripe_connected", or "woo_woocommerce_payments" if the goal is sell OR the user explicitly mentions selling, products, store, shop, or commerce.
- For the sell goal, order the commerce tasks store-first: "woo_customize_store", then "woo_products", then "set_up_payments", keeping the launch task last. Installing WooCommerce is added automatically as the first step, so do not include a task for it.
- Only include "add_10_email_subscribers", "subscribers_added", "newsletter_plan_created", or "import_subscribers" if the goal is newsletter OR the user explicitly mentions email subscribers or a newsletter.
- For the social tasks "connect_social_media" and "drive_traffic", keep the subtitle general - about growing the site's audience and engaging visitors (e.g. "Build the audience of your blog and engage with your visitors."). Do NOT name specific social networks (Instagram, Pinterest, X, Facebook, TikTok, etc.); the user has not said which platforms they use.
- Subtitles must be plain text: no URLs, no HTML, and no template syntax such as {{ }} or [[ ]].

============ STEP 3 - first_post_draft ============
Write a friendly starter blog post the user can edit and publish.
- "title": clear and evocative, max 8 words.
- "subtitle": ONE line, verb-led, max 10 words, describing what publishing this post does for them. Optional.
- "paragraphs": exactly 2 short paragraphs of opening body text. First introduces the topic in a warm, personal voice grounded in the user's niche; second invites the reader in. Plain English, no jargon. Avoid "Welcome to my blog" and "Hello world" cliches.

============ name resolution ============
Treat the "Site name:" value above as THE ONLY brand/name to use anywhere - in the title, subtitle, paragraphs, and inferred.brand_name. It overrides any name mentioned inside the user description. If the description names a different brand, ignore it and use the "Site name:" value.

============ available task menu ============
${ TASK_MENU.map( id => '- ' + id ).join( '\n' ) }

============ format ============
Return only a JSON object matching this schema. Do not include prose, code fences, or commentary. The first character MUST be "{".

{
  "inferred": { "goal": "...", "brand_name": "...", "niche": "...", "theme_keyword": "...", "vibe": "...", "audience": "...", "tagline": "..." },
  "tasks": [ { "id": "...", "subtitle": "..." }, ... 6 total ],
  "first_post_draft": { "title": "...", "subtitle": "...", "paragraphs": [ "...", "..." ] }
}`;
}
