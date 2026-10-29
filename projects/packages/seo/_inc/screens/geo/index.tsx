import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { commentContent, details, key, page } from '@wordpress/icons';
import { Link as RouteLink } from '@wordpress/route';
import {
	Badge,
	Card,
	CollapsibleCard,
	Link,
	Notice,
	Stack,
	SwitchControl,
	Text,
	Tooltip,
} from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import { ROUTE_BY_TAB } from '../../dashboard/dashboard-nav';
import { isCrawlerBlocked } from '../../data/blocked-crawlers';
import './style.scss';
import type { AiCrawler } from '../../data/geo-types';
import type { GeoForm } from '../../data/use-geo';
import type { ComponentProps, FC, ReactNode } from 'react';

interface Props {
	form: GeoForm;
	searchEnginesVisible: boolean;
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
const manageVisibilityLabel = __( 'Open site visibility settings', 'jetpack-seo' );
// The Settings tab's site visibility section, as a router link for `render` props.
const manageVisibilityLink = (
	<RouteLink to={ ROUTE_BY_TAB.settings } search={ { focus: 'visibility' } as unknown as never } />
);
// Crawler-group status tags. Module-scope (not inline ternaries) so the
// production minifier can't fold `cond ? __() : __()` and break i18n extraction.
const allowedLabel = __( 'Allowed', 'jetpack-seo' );
const blockedLabel = __( 'Blocked', 'jetpack-seo' );
const partlyBlockedLabel = __( 'Partly blocked', 'jetpack-seo' );
const crawlerAccessTitle = __( 'AI crawler access', 'jetpack-seo' );
const managedByPrivacyTooltip = __(
	'Set by your privacy settings while third-party sharing is turned off.',
	'jetpack-seo'
);

/**
 * The card that stands in for the crawler groups when site-level controls can't
 * take effect, wrapping the notice that explains why.
 *
 * The four blocked states are mutually exclusive and shared this header
 * verbatim, so it lives here once — which also keeps the icon and heading on all
 * four from drifting apart.
 *
 * @param props          - Component props.
 * @param props.children - The notice explaining the state.
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
 * Explains a disabled toggle on hover when another setting decides its state.
 *
 * @param props          - Component props.
 * @param props.reason   - Why the toggle is locked; renders the toggle alone when absent.
 * @param props.children - The toggle.
 * @return The toggle, wrapped in a tooltip when locked.
 */
const LockedTooltip: FC< { reason?: string; children: ReactNode } > = ( { reason, children } ) => {
	if ( ! reason ) {
		return <>{ children }</>;
	}
	// A div trigger, because a disabled input gets no hover events of its own.
	return (
		<Tooltip.Root>
			<Tooltip.Trigger render={ <div /> }>{ children }</Tooltip.Trigger>
			<Tooltip.Popup>{ reason }</Tooltip.Popup>
		</Tooltip.Root>
	);
};

interface CrawlerToggleProps {
	crawler: AiCrawler;
	blocked: boolean;
	disabled: boolean;
	lockedReason?: string;
	onToggle: ( slug: string, blocked: boolean ) => void;
}

/**
 * A single "Block this crawler" toggle: on means blocked. Extracted so its change
 * handler is a stable callback bound to the crawler's slug.
 *
 * @param props              - Component props.
 * @param props.crawler      - The crawler this row represents.
 * @param props.blocked      - Whether the crawler is currently blocked.
 * @param props.disabled     - Whether the toggle is disabled.
 * @param props.lockedReason - Tooltip text when another setting decides the state.
 * @param props.onToggle     - Called with `(slug, blocked)` on change.
 * @return The crawler toggle.
 */
const CrawlerToggle: FC< CrawlerToggleProps > = ( {
	crawler,
	blocked,
	disabled,
	lockedReason,
	onToggle,
} ) => {
	const handleChange = useCallback(
		( next: boolean ) => onToggle( crawler.slug, next ),
		[ crawler.slug, onToggle ]
	);

	return (
		<LockedTooltip reason={ lockedReason }>
			<SwitchControl
				label={ sprintf(
					/* translators: %s: AI crawler name, e.g. "ChatGPT". */
					__( 'Block %s', 'jetpack-seo' ),
					crawler.label
				) }
				description={ crawler.userAgents.join( ', ' ) }
				checked={ blocked }
				onCheckedChange={ handleChange }
				disabled={ disabled }
			/>
		</LockedTooltip>
	);
};

interface CrawlerSectionProps {
	title: string;
	/** The glyph shown before this group's title. */
	icon: ComponentProps< typeof CardTitleIcon >[ 'icon' ];
	intro: string;
	crawlers: AiCrawler[];
	type: AiCrawler[ 'type' ];
	/** The slugs blocked right now. */
	blockedSlugs: string[];
	disabled: boolean;
	/** Tooltip text for the disabled toggles when another setting decides their state. */
	lockedReason?: string;
	onToggle: ( slug: string, blocked: boolean ) => void;
	onToggleAll: ( type: AiCrawler[ 'type' ], blocked: boolean ) => void;
	/** The site's `/robots.txt` URL, linked under the description. */
	robotsTxtUrl: string;
	/** Shown at the top of the module (e.g. why the toggles are disabled). */
	notice?: ReactNode;
}

/**
 * A collapsible card listing one group of crawler toggles (answer engines or
 * training crawlers) with a one-line explanation of what the group does and a
 * "Block all" master toggle for the group. Collapsed by default — the AI-crawler
 * controls sit at the bottom of the tab and most people won't need to open them.
 *
 * @param props              - Component props.
 * @param props.title        - Section title.
 * @param props.icon         - The glyph shown before the title.
 * @param props.intro        - One-line description of the group's purpose.
 * @param props.crawlers     - The crawlers in this group.
 * @param props.type         - The crawler group's type.
 * @param props.blockedSlugs - The slugs blocked right now.
 * @param props.disabled     - Whether toggles are disabled.
 * @param props.lockedReason - Tooltip text when another setting decides the toggles' state.
 * @param props.onToggle     - Called with `(slug, blocked)` on a single toggle.
 * @param props.onToggleAll  - Called with `(type, blocked)` on the "Block all" toggle.
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
	blockedSlugs,
	disabled,
	lockedReason,
	onToggle,
	onToggleAll,
	robotsTxtUrl,
	notice,
} ) => {
	// "Block all" is on only when every crawler in the group is blocked; toggling
	// it writes the whole group in one save (see `setCrawlerGroupBlocked`).
	const isBlocked = ( crawler: AiCrawler ) => blockedSlugs.includes( crawler.slug );
	const blockedCount = crawlers.filter( isBlocked ).length;
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
	const handleToggleAll = useCallback(
		( next: boolean ) => onToggleAll( type, next ),
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
					{ /* `HeaderDescription` renders the status tag visibly but marks it
					   `aria-hidden` and wires `aria-describedby` on the trigger, so the state
					   is announced as a description instead of becoming part of the button's
					   name — the header wraps all its children in the trigger. */ }
					<CollapsibleCard.HeaderDescription>
						<Badge intent={ statusIntent }>{ statusLabel }</Badge>
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			{ notice }
			<CollapsibleCard.Content>
				{ /* `lg` gaps give the "View your robots.txt" link room above "Block all", and
				   keep each crawler's user-agent line closer to its own toggle than the next. */ }
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="xs">
						<p className="jetpack-seo-geo__crawlers-intro">{ intro }</p>
						<Link
							className="jetpack-seo-geo__robots-link"
							href={ robotsTxtUrl }
							openInNewTab
							rel="noopener noreferrer"
						>
							{ __( 'View your robots.txt', 'jetpack-seo' ) }
						</Link>
					</Stack>
					<Stack direction="column" gap="lg">
						<div className="jetpack-seo-geo__crawler-bulk">
							<LockedTooltip reason={ lockedReason }>
								<SwitchControl
									label={ __( 'Block all', 'jetpack-seo' ) }
									checked={ allBlocked }
									onCheckedChange={ handleToggleAll }
									disabled={ disabled }
								/>
							</LockedTooltip>
						</div>
						{ crawlers.map( crawler => (
							<CrawlerToggle
								key={ crawler.slug }
								crawler={ crawler }
								blocked={ isBlocked( crawler ) }
								disabled={ disabled }
								lockedReason={ lockedReason }
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
 * GEO (Generative Engine Optimization) tab. Stacks (in a single centered column
 * matching the Settings tab's width): a one-line intro spelling out "GEO",
 * llms.txt, the plan-gated AI SEO Enhancer, then the AI-crawler controls — split
 * into answer-engine and training groups. When the controls can't take effect,
 * they are replaced by an explanation instead of ineffective toggles.
 *
 * State + auto-save live in the `form` controller (passed from the page root so
 * it survives tab switches); this component is the presentation.
 *
 * @param props                      - Component props.
 * @param props.form                 - The GEO form controller from `useGeoForm`.
 * @param props.searchEnginesVisible - Whether the site allows search-engine indexing.
 * @return The GEO tab content.
 */
const GeoScreen: FC< Props > = ( { form, searchEnginesVisible } ) => {
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
					<Notice.Root intent="info">
						<Notice.Description>
							{ __(
								"Search engines and AI crawlers are all blocked because this site isn't set to be indexed. To choose which AI crawlers can access your site, allow search engines to index it first.",
								'jetpack-seo'
							) }
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionLink render={ manageVisibilityLink }>
								{ manageVisibilityLabel }
							</Notice.ActionLink>
						</Notice.Actions>
					</Notice.Root>
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

		// WordPress.com's "Prevent third-party sharing" wins over these toggles (see
		// `Ai_Crawlers::get_blocked_slugs()`), so they show its list, disabled.
		const managedByPrivacySetting = crawlers.dataSharingOptOut;
		const blockedSlugs = managedByPrivacySetting
			? crawlers.dataSharingBlocked
			: crawlers.catalog
					.filter( crawler => isCrawlerBlocked( crawlers.blocked, crawler ) )
					.map( crawler => crawler.slug );
		const lockedReason = managedByPrivacySetting ? managedByPrivacyTooltip : undefined;
		const privacyNotice = managedByPrivacySetting ? (
			<Notice.Root intent="info" className="jetpack-seo-geo__crawler-notice">
				<Notice.Description>
					{ __(
						'AI crawler access is set by your privacy settings while third-party sharing is turned off. Turn sharing on to manage individual crawlers here.',
						'jetpack-seo'
					) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionLink href={ crawlers.privacySettingsUrl }>
						{ __( 'Manage sharing settings', 'jetpack-seo' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			</Notice.Root>
		) : undefined;

		return (
			<>
				<CrawlerSection
					title={ __( 'Answer engines', 'jetpack-seo' ) }
					icon={ commentContent }
					intro={ __(
						'These crawlers fetch your pages so AI assistants like ChatGPT, Perplexity, and Claude can cite you in their answers. Blocking them can keep your site out of those answers.',
						'jetpack-seo'
					) }
					crawlers={ answerCrawlers }
					type="answer"
					blockedSlugs={ blockedSlugs }
					disabled={ isSaving || managedByPrivacySetting }
					lockedReason={ lockedReason }
					onToggle={ setCrawlerBlocked }
					onToggleAll={ setCrawlerGroupBlocked }
					robotsTxtUrl={ crawlers.robotsTxtUrl }
					notice={ privacyNotice }
				/>
				<CrawlerSection
					title={ __( 'Training crawlers', 'jetpack-seo' ) }
					icon={ details }
					intro={ __(
						'These crawlers collect your content to train AI models. Block them to keep your content out of that training. Blocking Google-Extended also keeps it out of Gemini app answers.',
						'jetpack-seo'
					) }
					crawlers={ trainingCrawlers }
					type="training"
					blockedSlugs={ blockedSlugs }
					disabled={ isSaving || managedByPrivacySetting }
					lockedReason={ lockedReason }
					onToggle={ setCrawlerBlocked }
					onToggleAll={ setCrawlerGroupBlocked }
					robotsTxtUrl={ crawlers.robotsTxtUrl }
					notice={ privacyNotice }
				/>
			</>
		);
	};

	const llmsTxtEffectivelyOn = Boolean( searchEnginesVisible && llmsTxt?.enabled );

	let enhancerHelp: string | undefined;
	if ( ! enhancer.aiSeoEnabled ) {
		enhancerHelp = enhancer.aiEnabled
			? __(
					'AI SEO is turned off for this site, so nothing is generated. Your choice is saved and applies again when AI SEO is turned back on.',
					'jetpack-seo'
				)
			: __(
					'Jetpack AI is turned off for this site, so nothing is generated. Your choice is saved and applies again when Jetpack AI is turned back on.',
					'jetpack-seo'
				);
	}

	return (
		<div className="jetpack-seo-geo">
			{ /* Spells out the acronym the tab is named after. */ }
			<Text variant="body-md" render={ <p /> } className="jetpack-seo-geo__intro">
				{ __(
					'GEO stands for generative engine optimization. These settings control how AI sees and uses your site.',
					'jetpack-seo'
				) }
			</Text>
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
								<SwitchControl
									label={ __( 'Generate an llms.txt file', 'jetpack-seo' ) }
									description={ llmsTxtHelp }
									checked={ llmsTxtEffectivelyOn }
									onCheckedChange={ setLlmsTxtEnabled }
									disabled={ isSaving || ! searchEnginesVisible }
								/>
								{ ! searchEnginesVisible && (
									<Notice.Root intent="info" className="jetpack-seo-geo__llms-notice">
										<Notice.Description>
											{ __( 'To enable, allow search engines to index this site.', 'jetpack-seo' ) }
										</Notice.Description>
										<Notice.Actions>
											<Notice.ActionLink render={ manageVisibilityLink }>
												{ manageVisibilityLabel }
											</Notice.ActionLink>
										</Notice.Actions>
									</Notice.Root>
								) }
								{ llmsTxtEffectivelyOn && llmsTxt.canServe && (
									<Link
										className="jetpack-seo-geo__llms-link"
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
						<SwitchControl
							label={ __(
								'Automatically generate SEO title, SEO description, and image alt text for new posts',
								'jetpack-seo'
							) }
							checked={ enhancer.enabled }
							onCheckedChange={ setEnhancerEnabled }
							disabled={ isSaving || ! enhancer.aiSeoEnabled }
							description={ enhancerHelp }
						/>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			) }

			{ renderCrawlers() }
		</div>
	);
};

export default GeoScreen;
