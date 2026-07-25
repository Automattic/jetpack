import type { GoalSlug, WizardInput } from './types.ts';

/**
 * An AI-facing description of one task on the menu.
 *
 * These strings are written for the model, not for users — they never render in the UI, and
 * they deliberately do not reuse catalog title copy, which is too terse to disambiguate (three
 * separate ids render as some variation of "change the design").
 *
 * Everything here is taste, including `goals` — the prompt tells the model to read it as an
 * affinity, not a filter. Anything that must always hold is enforced deterministically in PHP —
 * see AI_Launchpad_REST::GOAL_RESTRICTED_TASK_IDS and GOAL_EXCLUDED_TASK_IDS — because a rule
 * stated only in prose is a rule the model can quietly ignore.
 *
 * The two lists may disagree in one direction only.
 *
 * `goals` BROADER than the PHP rule is fine — the split doing its job. A task can be a tasteful fit
 * for a goal it is not allowed on; the rule still blocks it. The payment tasks are the live example,
 * annotated for `newsletter` as well as `sell` but permitted only on `sell`. Do not "fix" that by
 * widening the PHP rule.
 *
 * `goals` NARROWER than the PHP rule is a bug: a task this table calls goal-specific would be
 * selectable on every goal. If you add a single-goal `goals` here, add the matching entry to
 * GOAL_RESTRICTED_TASK_IDS too, or the annotation is the only thing holding it back — and
 * annotations are not enforcement.
 */
export interface TaskAnnotation {
	/** Task id, matching the shared catalog or the AI Launchpad task registry. */
	id: string;
	/** What completing this task actually does. */
	what: string;
	/** The signal that makes this task a good fit. */
	pickWhen: string;
	/** Counter-signal, for judgement calls only. Never for rules that must hold. */
	avoidWhen?: string;
	/** Goal affinity, omitted for tasks that suit any site. */
	goals?: readonly GoalSlug[];
}

/**
 * The tasks the model may pick from, each described well enough to rank against a specific site.
 *
 * Catalog `id_map` twins are the same underlying task, so only one of each pair is offered; the
 * dropped twin remaps onto the kept one on read (see wpcom_ai_launchpad_remap_task_id). Dropped:
 * first_post_published_newsletter, link_in_bio_launched, subscribers_added, drive_traffic.
 *
 * Most ids come from the shared launchpad catalog; the rest are defined by the AI Launchpad's
 * own registry (AI_Launchpad_Task_Registry). A PHP test guards every id against both sources,
 * and another guards that every registry id reaches this menu — a registry task nothing offers
 * to the model can still build, render and complete, so the failure is silent.
 */
export const TASK_ANNOTATIONS: readonly TaskAnnotation[] = [
	{
		id: 'first_post_published',
		what: "Publishes the site's first blog post, pre-filled in the editor with an AI-written draft.",
		pickWhen:
			'the site publishes written content — a blog, a journal, essays, reviews, dispatches.',
		goals: [ 'write', 'newsletter', 'educate' ],
	},
	{
		id: 'site_theme_selected',
		what: 'Opens the theme showcase, pre-filtered to a category matching the site, to pick a design.',
		pickWhen: 'almost always — the theme frames how everything else on the site looks.',
	},
	{
		id: 'add_about_page',
		what: 'Creates a draft About page pre-filled with AI-written copy about this specific site.',
		pickWhen: 'visitors will want to know who is behind the site or what it is for.',
	},
	{
		id: 'add_new_page',
		what: 'Opens the editor to create any new page from scratch, with no starting content.',
		pickWhen: 'the site needs a page this menu has no dedicated task for.',
		avoidWhen: 'a more specific page task already covers what the site needs.',
	},
	{
		id: 'add_contact_page',
		// Deliberately no `goals`. Whether people need to reach a person is a property of the niche, not
		// of the wizard goal: a shop, a studio, a tutor and a B&B all need it and pick four different
		// goals. It also keeps the entry out of the single-goal rule, since nothing in PHP restricts it.
		//
		// The menu already has a generic "add a page" and a dedicated About page, so this has to be
		// separable from both or it is noise in the ranking: About says who is behind the site, this
		// opens a channel back, and add_new_page defers to whichever specific task fits.
		what: 'Creates a draft Contact page with a working contact form on it, introduced by an AI-written line.',
		pickWhen:
			'someone has to reach a person before anything can happen — an enquiry, a commission, a booking, a quote, a viewing, a wholesale order.',
		avoidWhen:
			'nobody is expected to write in: a site that only wants readers is served by add_about_page, which says who is behind it.',
	},
	{
		id: 'add_events_page',
		// Deliberately no `goals`, for the same reason as the contact page: running something on a date is
		// a property of the niche, not of the wizard goal — a yoga studio, a gallery, a band and a supper
		// club pick four different goals and all of them have dates to list.
		//
		// Fourth page task on the menu, so it has to be separable from the other three: About says who is
		// behind the site, contact opens a channel back, add_new_page defers to whichever fits, and this
		// one is for a site whose activity happens at a time people have to turn up for.
		what: 'Creates a draft Events page: a heading, an AI-written line, and three blank entries the user fills in with their own events.',
		pickWhen:
			'what the site offers happens on a date people show up for — gigs, classes, workshops, retreats, markets, screenings, meetups, exhibitions, open studios, supper clubs.',
		avoidWhen:
			'nothing here happens at a set time and place: one-off work arranged privately between two people is add_contact_page, not a listing.',
	},
	{
		id: 'add_video_page',
		// No `goals`, for the same reason the gallery has none: the medium is a property of the niche, not
		// of the wizard goal — a vlogger picks `write`, a music teacher `educate`, a dance company `build`,
		// and a goal affinity here would suppress the task for whichever of them it left out.
		//
		// Fifth page task, and the one most likely to collapse into another: a gallery and a video page are
		// both "show the work". The medium is the separator — still images you look at, video you watch —
		// and it is the only separator the model can act on, so it has to be in both directions.
		//
		// This is the only entry serving the video niche: the round that dropped a VideoPress
		// plugin-discovery task left nothing else behind it.
		what: 'Creates a draft Videos page: a heading, an AI-written line, and one empty video block the user drops their own video or video URL into.',
		pickWhen:
			'the work is watched rather than read or looked at - vlogs, tutorials and how-tos, showreels, performances, recorded talks and classes, video podcasts, trailers, walkthroughs.',
		avoidWhen:
			'the work is still images: photographs, illustration, craft and design are add_gallery_page, which shows several at once.',
	},
	{
		id: 'add_portfolio_piece',
		// No `goals`, and `portfolio` is the trap that makes saying so worth the lines. The goal slug looks
		// like the obvious hint and would be the wrong one: a copywriter with case studies picks `write`, a
		// studio picks `build`, a maker selling commissions picks `sell`, and a tutor showing past cohorts
		// picks `educate`. Hinting one suppresses the task for the rest, which is the mistake the gallery
		// annotation already documents.
		//
		// Sixth page task, and the one that has to earn its slot against two things already on the menu.
		// Against add_gallery_page: a gallery is many images and no words, a page judged by looking; a piece
		// is one job and the words about it. Against first_post_published: that publishes a dated post into
		// the feed with AI-written prose already in it; this is a permanent page with no prose at all.
		what: 'Creates a draft page for ONE project: an empty image block for the work, and a blank prompted line for what it was, who it was for, and what the user did. Unlike first_post_published, nothing on this page is AI-written — a project write-up is facts only the user has.',
		pickWhen:
			'the site is judged one piece of work at a time, and each piece needs the story behind it as much as the picture - design and architecture projects, case studies, commissions, builds, restorations, campaigns, client work.',
		avoidWhen:
			'the work speaks for itself as a set of images with nothing to explain: that is add_gallery_page, one page holding many pictures.',
	},
	{
		id: 'update_about_page',
		what: 'Reopens an existing About page to revise it.',
		pickWhen: 'the site already has an About page that still holds placeholder copy.',
		avoidWhen: 'the site has no About page yet — use add_about_page instead.',
	},
	{
		id: 'edit_page',
		what: 'Opens an existing page for editing.',
		pickWhen: 'the site already has pages whose starter copy needs replacing.',
		avoidWhen: 'the site is brand new and has no pages worth editing.',
	},
	{
		id: 'design_edited',
		what: 'Opens the Site Editor to change layout, colors, and typography beyond the theme defaults.',
		pickWhen: 'the look matters more than the words — visual, design-led, or brand-driven sites.',
		avoidWhen:
			'site_theme_selected is already on the list and the site has no strong visual identity yet.',
	},
	{
		id: 'domain_claim',
		what: "Claims the free one-year custom domain included with the site's plan.",
		pickWhen: 'the site is a business, brand, or professional presence that needs its own address.',
	},
	{
		id: 'domain_upsell',
		what: 'Browses and buys a custom domain.',
		pickWhen: 'the site needs a custom domain and no free one is available to claim.',
		avoidWhen: 'domain_claim is available — a free domain beats a paid one.',
	},
	{
		id: 'domain_customize',
		what: 'Manages DNS and settings for a domain already connected to the site.',
		pickWhen: 'the site already has a custom domain that needs configuring.',
		avoidWhen: 'the site is still on a wordpress.com subdomain.',
	},
	{
		id: 'verify_email',
		what: "Confirms the account's email address.",
		pickWhen: 'rarely — it is account housekeeping, not site building.',
	},
	{
		id: 'complete_profile',
		what: 'Fills in the public WordPress.com profile: display name, bio, avatar.',
		pickWhen: 'the person is the product — authors, coaches, consultants, freelancers, artists.',
		avoidWhen: 'the site represents a business or publication rather than an individual.',
	},
	{
		id: 'site_title',
		what: 'Sets the site title and tagline.',
		pickWhen: 'rarely — the wizard already collected a name and description and saved them.',
	},
	{
		id: 'setup_general',
		what: 'Opens general site settings, covering the title and tagline.',
		pickWhen: 'rarely — this duplicates site_title, and the wizard already set both fields.',
	},
	{
		id: 'site_launched',
		what: 'Takes the site public. The canonical launch task.',
		pickWhen: 'always, as the final task.',
	},
	{
		id: 'blog_launched',
		what: 'Takes the site public, worded for a blog. An alternative launch task.',
		pickWhen: 'never in preference to site_launched, which is canonical.',
	},
	{
		id: 'set_up_payments',
		what: 'Configures a payment method so the site can take money.',
		pickWhen: 'the site sells something or collects payments from an audience.',
		goals: [ 'sell', 'newsletter' ],
	},
	{
		id: 'stripe_connected',
		what: 'Connects a Stripe account so payments can be collected.',
		pickWhen: 'the site takes payments and has no processor connected.',
		goals: [ 'sell', 'newsletter' ],
	},
	{
		id: 'paid_offer_created',
		what: 'Creates a paid offer supporters can buy — a subscription, tier, or one-off product.',
		pickWhen: 'the site earns directly from its audience rather than from retail products.',
		goals: [ 'newsletter', 'educate' ],
	},
	{
		id: 'woo_products',
		what: 'Adds products to the WooCommerce store.',
		pickWhen: 'the site sells physical or digital goods and the store exists but is empty.',
		goals: [ 'sell' ],
	},
	{
		id: 'woo_customize_store',
		what: "Sets up the store's look and core settings in WooCommerce.",
		pickWhen: 'the site is a shop and the store has not been configured yet.',
		goals: [ 'sell' ],
	},
	{
		id: 'woo_woocommerce_payments',
		what: 'Turns on WooPayments so the store can accept card payments.',
		pickWhen: 'the store needs a way to take money and has no processor set up.',
		goals: [ 'sell' ],
	},
	{
		id: 'woo_tax',
		what: 'Configures sales tax collection for the store.',
		pickWhen: 'the store is far enough along that tax matters — rarely a first-week task.',
		goals: [ 'sell' ],
	},
	{
		id: 'woo_marketing',
		what: 'Opens WooCommerce marketing tools for promoting the store.',
		pickWhen: 'the store already has products and needs customers.',
		goals: [ 'sell' ],
	},
	{
		id: 'woo_add_domain',
		what: 'Adds a custom domain to the store.',
		pickWhen: 'the store needs its own address and no other domain task is on the list.',
		avoidWhen: 'domain_claim or domain_upsell is already offered.',
		goals: [ 'sell' ],
	},
	{
		id: 'add_10_email_subscribers',
		what: 'Guides the site toward its first ten email subscribers.',
		pickWhen: 'the site grows by email and has an audience to build from zero.',
		goals: [ 'newsletter' ],
	},
	{
		id: 'import_subscribers',
		what: 'Imports an existing subscriber list from another service.',
		pickWhen: 'the writer is moving an established audience over from elsewhere.',
		avoidWhen: 'the site is starting from nothing and has no list to bring.',
		goals: [ 'newsletter' ],
	},
	{
		id: 'newsletter_plan_created',
		what: 'Creates a paid newsletter tier readers can subscribe to.',
		pickWhen: 'the writing itself is the product and readers would pay for it.',
		goals: [ 'newsletter' ],
	},
	{
		id: 'customize_welcome_message',
		what: 'Writes the message new subscribers receive when they sign up.',
		pickWhen: 'the site collects subscribers and their first impression is worth shaping.',
		goals: [ 'newsletter', 'write' ],
	},
	{
		id: 'enable_subscribers_modal',
		what: 'Turns on the popup that invites readers to subscribe.',
		pickWhen: 'the site wants subscribers and has content worth signing up for.',
		avoidWhen: 'the site has no published content yet — the popup would interrupt an empty page.',
	},
	{
		id: 'manage_subscribers',
		what: 'Opens the subscriber management screen.',
		pickWhen: 'the site already has subscribers to manage.',
		avoidWhen: 'the subscriber list is empty — there is nothing to manage.',
	},
	{
		id: 'manage_paid_newsletter_plan',
		what: 'Opens management for an existing paid newsletter plan.',
		pickWhen: 'a paid plan already exists and needs adjusting.',
		avoidWhen: 'no paid plan has been created yet.',
	},
	{
		id: 'add_subscribe_block',
		what: 'Adds the Subscribe block to the site so visitors can sign up.',
		pickWhen: 'the site wants readers to subscribe and has no sign-up form in its layout.',
		goals: [ 'newsletter', 'write' ],
	},
	{
		id: 'earn_money',
		what: 'Opens the earnings tools for making money from the site.',
		pickWhen: 'the site has an audience and wants to start earning from it.',
		avoidWhen: 'the site has no content or audience yet.',
	},
	{
		id: 'connect_social_media',
		what: 'Connects social accounts so new posts share automatically.',
		pickWhen: 'the site publishes regularly and wants to reach people beyond direct visitors.',
	},
	{
		id: 'sensei_setup',
		what: 'Finishes setting up Sensei, the course-building plugin.',
		pickWhen: 'the site teaches through structured courses or lessons.',
		goals: [ 'educate' ],
	},
	{
		id: 'install_custom_plugin',
		what: 'Opens the plugin directory to browse and install any plugin, with none named in advance.',
		pickWhen:
			'the site clearly needs a capability WordPress does not ship with and no other task names it — booking and appointments, ticketing, directories, membership tiers, real-estate listings.',
		avoidWhen:
			'install_sensei_lms already names the plugin this site needs, or the need is vague — sending a new site owner to browse the directory unguided is a poor task.',
	},
	{
		id: 'setup_ssh',
		what: 'Sets up SSH access to the hosting environment.',
		pickWhen: 'the site is run by a developer who works from the command line.',
		avoidWhen: 'the owner is not technical — this is a developer tool.',
	},
	{
		id: 'site_monitoring_page',
		what: 'Opens uptime and performance metrics for the site.',
		pickWhen: 'the site is already live and its reliability matters.',
		avoidWhen: 'the site has not launched — there is nothing to monitor.',
	},
	{
		id: 'mobile_app_installed',
		what: 'Installs the Jetpack mobile app for managing the site from a phone.',
		pickWhen:
			'the owner will post from their phone — travel, food, photography, anything on the move.',
	},
	{
		id: 'share_site',
		what: 'Shares the site with other people.',
		pickWhen: 'the site is live and ready for its first visitors.',
		avoidWhen: 'the site has not launched or has no content worth sharing.',
	},
	{
		id: 'front_page_updated',
		what: 'Edits the homepage layout — the first thing every visitor sees.',
		pickWhen: 'the homepage carries the message, as on a business, portfolio, or brand site.',
		goals: [ 'build', 'portfolio', 'sell' ],
	},
	{
		id: 'start_building_your_audience',
		what: 'Opens the audience-growth tools.',
		pickWhen: 'the site is published and ready to find readers.',
		avoidWhen: 'nothing is published yet.',
	},
	{
		id: 'add_site_icon',
		// No `goals`: a mark in the browser tab is worth having whatever the site is for, and the menu's
		// problem is too few universal alternatives, not too many.
		what: "Uploads the site's logo or icon in Settings — the small square mark shown in browser tabs, bookmarks, and search results.",
		pickWhen:
			'the site has a name and identity people should recognize at a glance, and especially when a logo already exists to upload.',
	},
	{
		id: 'pick_fonts_colors',
		what: "Swaps the theme's fonts and color palette for one of its ready-made style variations, in one click and without editing any layout.",
		pickWhen:
			'the description implies a mood or palette the theme defaults will not carry — warm and rustic, stark and editorial, specific brand colors.',
		avoidWhen:
			'design_edited is already on the list: it opens the same editor and covers this plus layout.',
	},
	{
		id: 'add_gallery_page',
		// Deliberately no `goals`. The criterion is whether the site is visual, which no goal slug tracks: a
		// photographer or food blogger picks `write` as readily as a florist picks `build`. Hinting a goal here
		// would suppress the gallery for the very sites this task exists to reach.
		what: 'Creates a draft Gallery page: a heading, an AI-written line, and one empty gallery block the user fills with their own photographs.',
		pickWhen:
			"the site's value is visual and people judge it by looking — photography, art, craft, food, interiors, tattoo work, floristry, design.",
		avoidWhen: 'the site is text-first and has no images to show.',
	},
	/*
	 * Plugin discovery, currently one entry: the registry only carries Automattic's own plugins, since this
	 * is an official Automattic surface. It exists to be picked rarely and precisely — the model reaching
	 * for Sensei is the model saying "this site teaches courses", which is a stronger statement about the
	 * site than any subtitle it could write. So `pick when` names the kind of site rather than the benefit;
	 * a benefit phrased as "the site needs SEO" would match everything and select nothing.
	 *
	 * No `goals` line, deliberately. The signal is the niche, and no goal slug tracks it: a tutor selling a
	 * course picks `sell`, a school picks `build`, a coach writing lessons picks `write`. Hinting a goal
	 * would suppress the task for the sites it exists for.
	 */
	{
		id: 'install_sensei_lms',
		what: 'Installs Sensei LMS, which turns the site into a course platform: lessons, modules, quizzes, and student progress.',
		pickWhen:
			'the site teaches something in a set sequence people work through — a course, a curriculum, training, lessons, a certification, a multi-week program.',
		avoidWhen:
			'the site teaches informally through posts or videos, with nothing to enroll in and no progress to track.',
	},
];

/** The task ids the model may pick from, derived from the annotated table. */
export const TASK_MENU: readonly string[] = TASK_ANNOTATIONS.map( entry => entry.id );

// The AI must return exactly six tasks, so the offered menu needs comfortable headroom beyond six.
const MIN_TAILORING_MENU = 10;

/**
 * Pick the task ids the prompt's menu is filtered to: the actionable ids (renderable and not already complete),
 * unless completion leaves too few of them on the menu to fill a valid six-task list — then relax to every
 * renderable id, since a completed card still renders fine and beats making valid AI output impossible.
 *
 * @param actionableTaskIds - Renderable-and-not-completed ids from the available-tasks endpoint.
 * @param renderableTaskIds - All renderable ids, regardless of completion.
 * @return The ids to filter the menu to.
 */
export function chooseTailoringMenu(
	actionableTaskIds: readonly string[],
	renderableTaskIds: readonly string[]
): readonly string[] {
	const menuCount = TASK_MENU.filter( id => actionableTaskIds.includes( id ) ).length;
	return menuCount >= MIN_TAILORING_MENU ? actionableTaskIds : renderableTaskIds;
}

/**
 * Render one task as its annotated menu block.
 *
 * @param task - The annotation to render.
 * @return The menu block, one field per line.
 */
function renderMenuEntry( task: TaskAnnotation ): string {
	const lines = [
		`- id: ${ task.id }`,
		`  what: ${ task.what }`,
		`  pick when: ${ task.pickWhen }`,
	];
	if ( task.avoidWhen ) {
		lines.push( `  avoid when: ${ task.avoidWhen }` );
	}
	if ( task.goals?.length ) {
		lines.push( `  goals: ${ task.goals.join( ', ' ) }` );
	}
	return lines.join( '\n' );
}

/**
 * The rules whose violation the server actually rejects, stated to the model as a courtesy.
 *
 * Each one has a matching server-side check: ids the server cannot build are dropped and a list that
 * loses too many 422s, the schema pins `tasks` to exactly six, the launch task is checked explicitly,
 * and sanitize_subtitle() rejects markup.
 *
 * Note the first rule points the model at the menu but only promises what update_tailored() actually
 * checks, which is that the id resolves to something buildable — a task in the shared catalog or one
 * in AI_Launchpad_Task_Registry, which is where `add_gallery_page` on the menu below comes from. An id
 * from either source that the menu filter left off is still accepted.
 *
 * Nothing else belongs in this block. Its header promises the model that violations are rejected, so
 * an unenforced rule here claims an authority the code does not back — the same taste-versus-
 * enforcement confusion the annotated menu exists to remove. Guidance goes in the STEP sections
 * instead, and anything that must always hold goes in PHP.
 *
 * A rule that can be impossible to satisfy must never live here. "At least one task must create
 * content" used to, but the menu is filtered to actionable tasks: on a site that has already
 * published a post and written an About page, no content task is left to offer, so enforcing it
 * would 422 that site into the deterministic fallback on every run, permanently. It is now a
 * preference in STEP 2.
 *
 * Extracted from the prompt template only so this comment has somewhere to live — a comment inside
 * a template literal would render into the prompt.
 */
const HARD_RULES = `HARD RULES (do not break - the server rejects output that violates these):
- Every "id" MUST be copied verbatim from the menu below. Never invent IDs: the server drops any id it cannot recognize, and rejects the whole list if too few tasks survive.
- Return exactly 6 tasks.
- The 6th and final task MUST be a launch task: "site_launched" (canonical) or "blog_launched".
- Subtitles must be plain text: no URLs, no HTML, and no template syntax such as {{ }} or [[ ]].`;

/**
 * Build the single combined prompt sent to jetpack-ai-query, producing the
 * inferred blob, task list, and first-post draft in one JSON response. Hard rules
 * mirror the server-side validation so valid output is not rejected.
 *
 * @param input            - The collected wizard input.
 * @param availableTaskIds - Task ids that will render on this site+goal; the menu is filtered to these. Optional; the full menu is used when omitted or empty.
 * @return The prompt string.
 */
export function buildTailorPrompt(
	input: WizardInput,
	availableTaskIds?: readonly string[]
): string {
	const { goal, site_name, description } = input;

	// Offer only tasks that will actually render on this site+goal, so the model never spends a pick on a task the
	// server would drop. Falls back to the full menu when availability is unknown (e.g. the lookup failed).
	const menu =
		availableTaskIds && availableTaskIds.length
			? TASK_ANNOTATIONS.filter( task => availableTaskIds.includes( task.id ) )
			: TASK_ANNOTATIONS;

	return `You are helping a new WordPress.com user onboard. They have described their site in their own words. Your job is to make their onboarding checklist feel hand-picked for THIS site, not generic.

Produce a single JSON object with FOUR parts, in this order: an inferred-context blob, a tailored task list, a starter blog post draft, and a starter About-page draft. Add a FIFTH part, "page_intros", only when STEP 5 applies.

Site name: ${ site_name }
Goal: ${ goal }
User description: ${ description }

============ STEP 1 - inferred ============
First, read the description closely and infer the site's context. You will use this to choose and describe the tasks, so do it before anything else.
- "goal": echo the goal value above verbatim. One of: write, build, sell, newsletter, educate, portfolio. Required.
- "inferred_goal": the goal you would infer from ONLY the site name and user description, ignoring the "Goal:" line above. Same six values. Diagnostic only - it must NOT influence your task choices or anything else you produce.
- "brand_name": the site name. Per the name-resolution rule below.
- "niche": the specific subject area in a few words (e.g. "long-distance hiking", "handmade ceramics", "indie game reviews").
- "theme_category": the theme-showcase category that best matches what the site is about, used to suggest matching site designs. MUST be exactly one of these slugs (format: slug = human name):
  blog = Blog; portfolio = Portfolio; business = Business; store = Store; art-design = Art & Design; about = About; real-estate = Real Estate; health-wellness = Health & Wellness; authors-writers = Authors & Writers; newsletter = Newsletter; education = Education; magazine = Magazine; music = Music; restaurant = Restaurant; travel-lifestyle = Travel & Lifestyle; fashion-beauty = Fashion & Beauty; community-non-profit = Community & Non-Profit; podcast = Podcast; entertainment = Entertainment.
  Prefer the specific subject over the generic goal bucket when one fits: a bakery blog is "restaurant" (not "blog"), a hiking diary is "travel-lifestyle", a novelist's site is "authors-writers". Fall back to the goal bucket ("blog", "business", "store", "portfolio", "newsletter") only when no subject category matches. Always include this field.
- "vibe": aesthetic hint if implied (e.g. "minimal and editorial", "warm and personal"). Omit if neutral.
- "audience": who the site is for, if implied (e.g. "home cooks", "small-business owners").
- "tagline": a polished site tagline drafted from the description. Max 200 characters. Noun phrase or third person, not first-person.

============ STEP 2 - tasks ============
Now choose the 6 tasks from the menu below that are MOST RELEVANT to this site, judged against the site name, goal, description, and the niche/audience you just inferred. Each menu entry says what the task does, when it is a good fit, sometimes when to avoid it, and sometimes which goals it tends to suit - use that, not the id, to judge relevance. Treat the "goals" line as a soft affinity, never a filter: a task that does not list this site's goal is still fair game when it fits the site, and one that does list it still has to earn its place. Rank the whole menu and keep the top 6. Prefer a list that includes at least one task which creates something to publish (e.g. "first_post_published", "woo_products", or "add_about_page"), unless the menu offers none. Do not follow a fixed template - two different sites should get noticeably different lists.

For each chosen task write a "subtitle" (max 200 characters) that is specific and engaging: reference the user's niche, audience, or what they will actually publish or sell, so the checklist reads as written for them. Avoid generic, interchangeable phrasing.

GOOD vs BAD subtitles (illustrations - adapt to the user's own niche, do not copy):
- For a handmade-ceramics studio, "add_about_page" -> GOOD: "Share the story behind your studio and what makes each handmade piece one of a kind." BAD: "Tell visitors who you are."
- For a handmade-ceramics studio, "site_theme_selected" -> GOOD: "Pick a clean, gallery-style theme that lets your ceramics photos take center stage." BAD: "Choose a theme."
- For a weekly cycling newsletter, "first_post_published" -> GOOD: "Send your first issue with this week's route, ride notes, and gear picks." BAD: "Send your first newsletter."

One task is an exception to that push for specificity. For the social task "connect_social_media", keep the subtitle general - about growing the site's audience and engaging visitors (e.g. "Build the audience of your blog and engage with your visitors."). Do NOT name specific social networks (Instagram, Pinterest, X, Facebook, TikTok, etc.); the user has not said which platforms they use.

${ HARD_RULES }

============ STEP 3 - first_post_draft ============
Write a friendly starter blog post the user can edit and publish.
- "title": clear and evocative, max 8 words.
- "subtitle": ONE line, verb-led, max 10 words, describing what publishing this post does for them. Optional.
- "paragraphs": exactly 2 short paragraphs of opening body text. First introduces the topic in a warm, personal voice grounded in the user's niche; second invites the reader in. Plain English, no jargon. Avoid "Welcome to my blog" and "Hello world" cliches.

============ STEP 4 - about_page_draft ============
Write starter content for the site's About page, grounded in the user's own description - never generic filler.
- "title": the page title, max 4 words. Usually just "About" or "About" plus the brand name.
- "paragraphs": 2 or 3 short paragraphs in the same warm voice: who is behind the site, what visitors will find here (reference the niche and what the user actually does), and a closing invitation to look around or get in touch. Use first person where it reads naturally. Never use placeholders like "[your name]" - if a detail is unknown, write around it.

============ STEP 5 - page_intros (only when it applies) ============
Some tasks create a page whose content is already written except for the one line it opens with. Write that line here, keyed by the task id it belongs to. Include a key ONLY for a task you actually chose in STEP 2, omit "page_intros" entirely when you chose none of them, and never add a key that is not listed below.
- "add_contact_page": one sentence, max 200 characters, inviting the visitor to get in touch, grounded in what someone would really contact THIS site about - a commission, a booking, a quote, a wholesale order, a question about the work. The page already carries a working contact form, so do not put an email address, a phone number, opening hours, or a street address in this sentence, and never invent one.
- "add_events_page": one sentence, max 200 characters, saying what kind of thing THIS site runs and why someone would come - a class, a gig, a market stall, a screening, an open studio. The page leaves each event blank for the user to fill in, and only they know their own schedule, so do not put a date, a day, a time, a venue, an address, or a price in this sentence, and never invent one.
- "add_video_page": one sentence, max 200 characters, saying what THIS site's videos show and why someone would watch - a technique, a lesson, a performance, a walkthrough, an episode. The page holds one empty video block for the user to fill, so do not describe a specific video as if it were already there, do not promise how many there are, do not name a video platform or channel, and never invent one.
- "add_gallery_page": one sentence, max 200 characters, saying what THIS site's pictures show and why someone would look - the work, the place, the plates, the finished pieces, the process. The page holds one empty gallery block the user fills with their OWN photographs, so do not describe a particular image as if it were already there, do not promise how many there are, do not name a photo-sharing platform or account, and never invent one.

============ name resolution ============
Treat the "Site name:" value above as THE ONLY brand/name to use anywhere - in the title, subtitle, paragraphs, and inferred.brand_name. It overrides any name mentioned inside the user description. If the description names a different brand, ignore it and use the "Site name:" value.

============ available task menu ============
${ menu.map( renderMenuEntry ).join( '\n\n' ) }

============ format ============
Return only a JSON object matching this schema. Do not include prose, code fences, or commentary. The first character MUST be "{".

{
  "inferred": { "goal": "...", "inferred_goal": "...", "brand_name": "...", "niche": "...", "theme_category": "...", "vibe": "...", "audience": "...", "tagline": "..." },
  "tasks": [ { "id": "...", "subtitle": "..." }, ... 6 total ],
  "first_post_draft": { "title": "...", "subtitle": "...", "paragraphs": [ "...", "..." ] },
  "about_page_draft": { "title": "...", "paragraphs": [ "...", "..." ] },
  "page_intros": { "add_contact_page": "...", "add_events_page": "...", "add_video_page": "...", "add_gallery_page": "..." }
}

Leave "page_intros" out altogether unless STEP 5 applies.`;
}
