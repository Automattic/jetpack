import { Button, ToggleControl } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { commentContent, details, key, page } from '@wordpress/icons';
import { Badge, Card, CollapsibleCard, Link, Notice, Stack } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import './style.scss';
import type { AiCrawler } from '../../data/ai-types';
import type { AiForm } from '../../data/use-ai';
import type { ComponentProps, FC, ReactNode } from 'react';

interface Props {
	form: AiForm;
	searchEnginesVisible: boolean;
	onManageVisibility: () => void;
}

// Jetpack's AI mark (three sparks), mirroring `AiIcon` in
// `@automattic/jetpack-components`. Restated here as an element with svg props
// because `@wordpress/ui`'s `Icon` spreads `icon.props` onto its own `SVG`
// rather than rendering what it is given — so a component like `AiIcon`, whose
// props are `size`/`color`, would spread those and produce an empty icon.
// `@wordpress/icons` has no AI or sparkle glyph to use instead. Kept in sync by
// hand; if Jetpack's AI mark changes, this needs the same paths.
const aiSparks = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor">
		<path d="M9.33301 5.33325L10.4644 8.20188L13.333 9.33325L10.4644 10.4646L9.33301 13.3333L8.20164 10.4646L5.33301 9.33325L8.20164 8.20188L9.33301 5.33325Z" />
		<path d="M21.3333 5.33333L22.8418 9.15817L26.6667 10.6667L22.8418 12.1752L21.3333 16L19.8248 12.1752L16 10.6667L19.8248 9.15817L21.3333 5.33333Z" />
		<path d="M14.6667 13.3333L16.5523 18.1144L21.3333 20L16.5523 21.8856L14.6667 26.6667L12.781 21.8856L8 20L12.781 18.1144L14.6667 13.3333Z" />
	</svg>
);

const llmsTxtHelp = __(
	'Publishes a curated, AI-readable map at /llms.txt to help AI assistants find and understand your supported content.',
	'jetpack-seo'
);
// Crawler-group status tags. Module-scope (not inline ternaries) so the
// production minifier can't fold `cond ? __() : __()` and break i18n extraction.
const allowedLabel = __( 'Allowed', 'jetpack-seo' );
const blockedLabel = __( 'Blocked', 'jetpack-seo' );
const partlyBlockedLabel = __( 'Partly blocked', 'jetpack-seo' );
const crawlerAccessTitle = __( 'AI crawler access', 'jetpack-seo' );

/**
 * The card that stands in for the crawler groups when site-level controls can't
 * take effect, wrapping the notice that explains why.
 *
 * The four blocked states are mutually exclusive and shared this header
 * verbatim, so it lives here once — which also keeps the chip and heading on all
 * four from drifting apart.
 *
 * @param props          - Component props.
 * @param props.children - The notice, and any action, explaining the state.
 * @return The crawler-access card.
 */
const CrawlerAccessCard: FC< { children: ReactNode } > = ( { children } ) => (
	<CollapsibleCard.Root defaultOpen>
		<CollapsibleCard.Header render={ <h2 /> }>
			<Card.Title>
				<CardTitleIcon icon={ key } title={ crawlerAccessTitle } />
			</Card.Title>
		</CollapsibleCard.Header>
		<CollapsibleCard.Content>{ children }</CollapsibleCard.Content>
	</CollapsibleCard.Root>
);

/**
 * Whether a crawler is currently blocked: an explicit override wins, otherwise
 * the per-type default (training crawlers blocked, other crawlers allowed).
 *
 * @param crawler   - The crawler to resolve.
 * @param overrides - The sparse override map (`slug => blocked`).
 * @return Whether the crawler is blocked.
 */
const isCrawlerBlocked = ( crawler: AiCrawler, overrides: Record< string, boolean > ): boolean =>
	overrides[ crawler.slug ] ?? crawler.type === 'training';

interface CrawlerToggleProps {
	crawler: AiCrawler;
	blocked: boolean;
	disabled: boolean;
	onToggle: ( slug: string, blocked: boolean ) => void;
}

/**
 * A single "allow this crawler" toggle. Extracted so its change handler is a
 * stable callback (bound to the crawler's slug) rather than an inline arrow.
 * Toggling the switch *on* means "allow" (blocked = false).
 *
 * @param props          - Component props.
 * @param props.crawler  - The crawler this row represents.
 * @param props.blocked  - Whether the crawler is currently blocked.
 * @param props.disabled - Whether the toggle is disabled (mid-save).
 * @param props.onToggle - Called with `(slug, blocked)` on change.
 * @return The crawler toggle.
 */
const CrawlerToggle: FC< CrawlerToggleProps > = ( { crawler, blocked, disabled, onToggle } ) => {
	const handleChange = useCallback(
		( allowed: boolean ) => onToggle( crawler.slug, ! allowed ),
		[ crawler.slug, onToggle ]
	);

	return (
		<ToggleControl
			label={ crawler.label }
			// Module-scope labels (see top of file) so the production minifier can't
			// fold `cond ? __() : __()` and break i18n extraction.
			help={ blocked ? blockedLabel : allowedLabel }
			checked={ ! blocked }
			onChange={ handleChange }
			disabled={ disabled }
			__nextHasNoMarginBottom
		/>
	);
};

interface CrawlerSectionProps {
	title: string;
	/** The chip glyph for this group's title. */
	icon: ComponentProps< typeof CardTitleIcon >[ 'icon' ];
	intro: string;
	crawlers: AiCrawler[];
	type: AiCrawler[ 'type' ];
	overrides: Record< string, boolean >;
	disabled: boolean;
	onToggle: ( slug: string, blocked: boolean ) => void;
	onToggleAll: ( type: AiCrawler[ 'type' ], blocked: boolean ) => void;
	/** The site's `/robots.txt` URL, linked under the description. */
	robotsTxtUrl: string;
	/** Shown at the top of the module (e.g. why the toggles are disabled). */
	notice?: ReactNode;
}

/**
 * A collapsible card listing one group of crawler toggles (answer engines or
 * training crawlers) with a one-line explanation of what the group does and an
 * "Allow all" master toggle for the group. Collapsed by default — the AI-crawler
 * controls sit at the bottom of the tab and most people won't need to open them.
 *
 * @param props              - Component props.
 * @param props.title        - Section title.
 * @param props.icon         - The chip glyph shown before the title.
 * @param props.intro        - One-line description of the group's purpose.
 * @param props.crawlers     - The crawlers in this group.
 * @param props.type         - The crawler group's type.
 * @param props.overrides    - The sparse override map (`slug => blocked`).
 * @param props.disabled     - Whether toggles are disabled (mid-save).
 * @param props.onToggle     - Called with `(slug, blocked)` on a single toggle.
 * @param props.onToggleAll  - Called with `(type, blocked)` on the "Allow all" toggle.
 * @param props.robotsTxtUrl - The site's `/robots.txt` URL, linked under the description.
 * @param props.notice       - Optional message shown at the top of the module.
 * @return The section card.
 */
const CrawlerSection: FC< CrawlerSectionProps > = ( {
	title,
	icon,
	intro,
	crawlers,
	type,
	overrides,
	disabled,
	onToggle,
	onToggleAll,
	robotsTxtUrl,
	notice,
} ) => {
	// "Allow all" is on only when every crawler in the group is allowed; toggling
	// it writes the whole group in one save (see `setCrawlerGroupBlocked`).
	const blockedCount = crawlers.filter( crawler => isCrawlerBlocked( crawler, overrides ) ).length;
	const allAllowed = blockedCount === 0;
	const allBlocked = crawlers.length > 0 && blockedCount === crawlers.length;

	// Header status tag: green when every crawler is allowed, red when every one is
	// blocked, amber in between. Red is the "stop" reading rather than a severity
	// claim — blocking training crawlers is a legitimate choice, and `intent` is a
	// CSS class with no `role` or `aria-*`, so every tag is announced alike.
	//
	// Amber matters because the mixed state used to be grey, identical to a module
	// that is simply switched off — the one state you couldn't read at a glance.
	//
	// `statusLabel` typed `string` (not the inferred branded `TransformedText` of the
	// first label) so the branches can assign other literals.
	let statusIntent: 'stable' | 'high' | 'medium' = 'medium';
	let statusLabel: string = partlyBlockedLabel;
	if ( allAllowed ) {
		statusIntent = 'stable';
		statusLabel = allowedLabel;
	} else if ( allBlocked ) {
		statusIntent = 'high';
		statusLabel = blockedLabel;
	}

	// Extracted (not an inline arrow) for a stable callback, matching CrawlerToggle.
	// Switching "Allow all" *on* means "allow the whole group" (blocked = false).
	const handleToggleAll = useCallback(
		( allowed: boolean ) => onToggleAll( type, ! allowed ),
		[ type, onToggleAll ]
	);

	return (
		// Collapsed by default — most people won't open these. A notice (e.g. why the
		// controls are disabled) sits between the header and the collapsible content,
		// so it stays visible while the module is closed; only Content collapses.
		<CollapsibleCard.Root>
			{ /* The heading wraps the trigger, per the W3C APG accordion pattern the
			   component's own docblock points at. */ }
			<CollapsibleCard.Header render={ <h2 /> }>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>
						<CardTitleIcon icon={ icon } title={ title } />
					</Card.Title>
					{ /* The status tag reflects the toggle state; hide it when the toggles
					   are governed elsewhere (the notice explains the state instead).
					   `HeaderDescription` renders it visibly but marks it `aria-hidden` and
					   wires `aria-describedby` on the trigger, so the state is announced as
					   a description instead of becoming part of the button's name — the
					   header wraps all its children in the trigger. */ }
					{ ! notice && (
						<CollapsibleCard.HeaderDescription>
							<Badge intent={ statusIntent }>{ statusLabel }</Badge>
						</CollapsibleCard.HeaderDescription>
					) }
				</Stack>
			</CollapsibleCard.Header>
			{ notice }
			<CollapsibleCard.Content>
				{ /* `lg` gap between the description group and the controls group gives the
				   "View your robots.txt" link room above the "Allow all" toggle; the controls
				   keep their own tighter `md` rhythm in the nested Stack. */ }
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="xs">
						<p className="jetpack-seo-ai__crawlers-intro">{ intro }</p>
						<Link
							className="jetpack-seo-ai__robots-link"
							href={ robotsTxtUrl }
							openInNewTab
							rel="noopener noreferrer"
						>
							{ __( 'View your robots.txt', 'jetpack-seo' ) }
						</Link>
					</Stack>
					<Stack direction="column" gap="md">
						<div className="jetpack-seo-ai__crawler-bulk">
							<ToggleControl
								label={ __( 'Allow all', 'jetpack-seo' ) }
								checked={ allAllowed }
								onChange={ handleToggleAll }
								disabled={ disabled }
								__nextHasNoMarginBottom
							/>
						</div>
						{ crawlers.map( crawler => (
							<CrawlerToggle
								key={ crawler.slug }
								crawler={ crawler }
								blocked={ isCrawlerBlocked( crawler, overrides ) }
								disabled={ disabled }
								onToggle={ onToggle }
							/>
						) ) }
					</Stack>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

/**
 * GEO (Generative Engine Optimization) tab — internal id/route still keyed `ai`.
 * Stacks (in a single centered column matching the Settings tab's width):
 * llms.txt, the plan-gated AI SEO Enhancer, then the AI-crawler controls — split
 * into answer-engine and training groups. When the controls can't take effect,
 * they are replaced by an explanation instead of ineffective toggles.
 *
 * State + auto-save live in the `form` controller (passed from the page root so
 * it survives tab switches); this component is the presentation.
 *
 * @param props                      - Component props.
 * @param props.form                 - The AI form controller from `useAiForm`.
 * @param props.searchEnginesVisible - Whether the site allows search-engine indexing.
 * @param props.onManageVisibility   - Opens the Settings visibility controls.
 * @return The AI tab content.
 */
const AiScreen: FC< Props > = ( { form, searchEnginesVisible, onManageVisibility } ) => {
	const {
		enhancer,
		llmsTxt,
		crawlers,
		isSaving,
		setEnhancerEnabled,
		setLlmsTxtEnabled,
		setCrawlerBlocked,
		setCrawlerGroupBlocked,
	} = form;

	if ( ! enhancer ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __( 'Unable to load GEO settings.', 'jetpack-seo' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	/**
	 * The AI-crawler portion of the tab: either the control sections or a card
	 * explaining why site-level controls cannot take effect.
	 *
	 * @return The crawler cards, or null when there's no crawler bootstrap.
	 */
	const renderCrawlers = () => {
		if ( ! crawlers ) {
			return null;
		}

		// Path-based multisite networks share one origin-level robots.txt, so a
		// site-level setting cannot safely represent its scope.
		if ( crawlers.pathBasedMultisite ) {
			return (
				<CrawlerAccessCard>
					<Notice.Root intent="info">
						<Notice.Description>
							{ __(
								'Per-site AI crawler controls are unavailable on this path-based multisite network because every site shares one robots.txt. Manage crawler access at the network level instead.',
								'jetpack-seo'
							) }
						</Notice.Description>
					</Notice.Root>
				</CrawlerAccessCard>
			);
		}

		// Staging subdomain blocks all crawling at the platform level, so even an
		// indexable site can't apply these — explain and stop.
		if ( crawlers.restrictedSubdomain ) {
			return (
				<CrawlerAccessCard>
					<Notice.Root intent="info">
						<Notice.Description>
							{ __(
								'This site uses a temporary staging address (a .wpcomstaging.com subdomain), where search engines and AI crawlers are blocked. These settings will take effect once the site is on its own domain.',
								'jetpack-seo'
							) }
						</Notice.Description>
					</Notice.Root>
				</CrawlerAccessCard>
			);
		}

		// Search engines (and therefore AI crawlers) are blocked site-wide — point
		// the user at the setting that turns indexing back on.
		if ( ! searchEnginesVisible ) {
			return (
				<CrawlerAccessCard>
					<Stack direction="column" gap="md">
						<Notice.Root intent="info">
							<Notice.Description>
								{ __(
									"Search engines and AI crawlers are all blocked because this site isn't set to be indexed. To choose which AI crawlers can access your site, allow search engines to index it first.",
									'jetpack-seo'
								) }
							</Notice.Description>
						</Notice.Root>
						<Button variant="link" onClick={ onManageVisibility }>
							{ __( 'Open site visibility settings', 'jetpack-seo' ) }
						</Button>
					</Stack>
				</CrawlerAccessCard>
			);
		}

		// A static robots.txt file in the WordPress installation is separate from
		// the virtual output these settings change.
		if ( crawlers.staticRobotsTxt ) {
			return (
				<CrawlerAccessCard>
					<Notice.Root intent="warning">
						<Notice.Description>
							{ __(
								"Jetpack detected a static robots.txt file in the WordPress installation directory. These settings only change WordPress's virtual robots.txt; edit or remove the static file to manage AI crawler access here.",
								'jetpack-seo'
							) }
						</Notice.Description>
					</Notice.Root>
				</CrawlerAccessCard>
			);
		}

		const answerCrawlers = crawlers.catalog.filter( crawler => crawler.type === 'answer' );
		const trainingCrawlers = crawlers.catalog.filter( crawler => crawler.type === 'training' );

		// WordPress.com's "Prevent third-party sharing" (Reading settings) is a
		// distinct privacy control that already governs whether AI partners may use
		// this site. While it's on, we let that setting rule: the modules stay
		// visible so the user can see what's here, but the toggles are disabled and
		// each explains why, with a link to the setting. Only reachable on
		// WordPress.com — the option doesn't exist on self-hosted.
		const managedByPrivacySetting = crawlers.dataSharingOptOut;
		const privacyNotice = managedByPrivacySetting ? (
			<Notice.Root intent="info" className="jetpack-seo-ai__crawler-notice">
				<Notice.Description>
					{ __(
						'AI crawler access is set by your privacy settings while third-party sharing is turned off. Turn sharing on to manage individual crawlers here.',
						'jetpack-seo'
					) }{ ' ' }
					<Link href={ crawlers.privacySettingsUrl }>
						{ __( 'Manage sharing settings', 'jetpack-seo' ) }
					</Link>
				</Notice.Description>
			</Notice.Root>
		) : undefined;

		return (
			<>
				<CrawlerSection
					title={ __( 'Answer engines', 'jetpack-seo' ) }
					icon={ commentContent }
					intro={ __(
						'These crawlers fetch your pages so AI assistants can cite you in their answers. Keep them allowed to stay visible in tools like ChatGPT, Perplexity, and Claude.',
						'jetpack-seo'
					) }
					crawlers={ answerCrawlers }
					type="answer"
					overrides={ crawlers.overrides }
					disabled={ isSaving || managedByPrivacySetting }
					onToggle={ setCrawlerBlocked }
					onToggleAll={ setCrawlerGroupBlocked }
					robotsTxtUrl={ crawlers.robotsTxtUrl }
					notice={ privacyNotice }
				/>
				<CrawlerSection
					title={ __( 'Training crawlers', 'jetpack-seo' ) }
					icon={ details }
					intro={ __(
						'These crawlers use your content to train AI models. Some — like Google Gemini — also power the AI answers shown above search results, so blocking them protects privacy but can cost you that visibility.',
						'jetpack-seo'
					) }
					crawlers={ trainingCrawlers }
					type="training"
					overrides={ crawlers.overrides }
					disabled={ isSaving || managedByPrivacySetting }
					onToggle={ setCrawlerBlocked }
					onToggleAll={ setCrawlerGroupBlocked }
					robotsTxtUrl={ crawlers.robotsTxtUrl }
					notice={ privacyNotice }
				/>
			</>
		);
	};

	const llmsTxtEffectivelyOn = Boolean( searchEnginesVisible && llmsTxt?.enabled );

	return (
		<div className="jetpack-seo-ai">
			{ llmsTxt && (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header render={ <h2 /> }>
						{ /* No status tag here, unlike the crawler groups: this module opens by
						   default, so its toggle — the same information, in the control that
						   changes it — is on screen already, and a tag would say it twice.
						   Collapsing the card does hide the state until it is reopened (a reload
						   reopens it). Accepted deliberately: collapsing is a choice to hide this
						   module's detail. The crawler groups differ because they open *closed*,
						   so a tag is the only state they would ever show. */ }
						<Card.Title>
							<CardTitleIcon icon={ page } title={ __( 'llms.txt', 'jetpack-seo' ) } />
						</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Stack direction="column" gap="md">
							{ searchEnginesVisible && ! llmsTxt.canServe && (
								<Notice.Root intent="warning">
									<Notice.Description>
										{ __(
											"Jetpack can't publish llms.txt on this site: a file at /llms.txt or your hosting setup is already handling that address, so this setting won't take effect. Remove that file (or check with your host) to let Jetpack manage it.",
											'jetpack-seo'
										) }
									</Notice.Description>
								</Notice.Root>
							) }
							<Stack direction="column" gap="xs">
								<ToggleControl
									label={ __( 'Generate an llms.txt file', 'jetpack-seo' ) }
									help={ llmsTxtHelp }
									checked={ llmsTxtEffectivelyOn }
									onChange={ setLlmsTxtEnabled }
									disabled={ isSaving || ! searchEnginesVisible }
									__nextHasNoMarginBottom
								/>
								{ ! searchEnginesVisible && (
									<Notice.Root intent="info" className="jetpack-seo-ai__llms-notice">
										<Notice.Description>
											{ createInterpolateElement(
												__(
													'To enable, allow search engines to index this site under <link>Settings</link>.',
													'jetpack-seo'
												),
												{
													link: <Button variant="link" onClick={ onManageVisibility } />,
												}
											) }
										</Notice.Description>
									</Notice.Root>
								) }
								{ llmsTxtEffectivelyOn && llmsTxt.canServe && (
									<Link
										className="jetpack-seo-ai__llms-link"
										href={ llmsTxt.url }
										openInNewTab
										rel="noopener noreferrer"
									>
										{ __( 'View your llms.txt', 'jetpack-seo' ) }
									</Link>
								) }
							</Stack>
						</Stack>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			) }

			{ enhancer.available && (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header render={ <h2 /> }>
						<Card.Title>
							<CardTitleIcon icon={ aiSparks } title={ __( 'AI SEO Enhancer', 'jetpack-seo' ) } />
						</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<ToggleControl
							label={ __(
								'Automatically generate SEO title, SEO description, and image alt text for new posts',
								'jetpack-seo'
							) }
							checked={ enhancer.enabled }
							onChange={ setEnhancerEnabled }
							disabled={ isSaving }
							__nextHasNoMarginBottom
						/>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			) }

			{ renderCrawlers() }
		</div>
	);
};

export default AiScreen;
