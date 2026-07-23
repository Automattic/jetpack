import { Button, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Card, CollapsibleCard, Link, Notice, Stack } from '@wordpress/ui';
import { settingsStore } from '../../data/settings-store';
import './style.scss';
import type { AiCrawler } from '../../data/ai-types';
import type { AiForm } from '../../data/use-ai';
import type { FC } from 'react';

interface Props {
	form: AiForm;
}

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

	// Named variables (not `cond ? __() : __()`) so the production minifier can't
	// fold the ternary into `__( cond ? … )`, which breaks i18n string extraction.
	const allowedLabel = __( 'Allowed', 'jetpack-seo' );
	const blockedLabel = __( 'Blocked', 'jetpack-seo' );

	return (
		<ToggleControl
			label={ crawler.label }
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
	intro: string;
	crawlers: AiCrawler[];
	type: AiCrawler[ 'type' ];
	overrides: Record< string, boolean >;
	disabled: boolean;
	onToggle: ( slug: string, blocked: boolean ) => void;
	onToggleAll: ( type: AiCrawler[ 'type' ], blocked: boolean ) => void;
}

/**
 * A collapsible card listing one group of crawler toggles (answer engines or
 * training crawlers) with a one-line explanation of what the group does and an
 * "Allow all" master toggle for the group. Collapsed by default — the AI-crawler
 * controls sit at the bottom of the tab and most people won't need to open them.
 *
 * @param props             - Component props.
 * @param props.title       - Section title.
 * @param props.intro       - One-line description of the group's purpose.
 * @param props.crawlers    - The crawlers in this group.
 * @param props.type        - The crawler group's type.
 * @param props.overrides   - The sparse override map (`slug => blocked`).
 * @param props.disabled    - Whether toggles are disabled (mid-save).
 * @param props.onToggle    - Called with `(slug, blocked)` on a single toggle.
 * @param props.onToggleAll - Called with `(type, blocked)` on the "Allow all" toggle.
 * @return The section card.
 */
const CrawlerSection: FC< CrawlerSectionProps > = ( {
	title,
	intro,
	crawlers,
	type,
	overrides,
	disabled,
	onToggle,
	onToggleAll,
} ) => {
	// "Allow all" is on only when every crawler in the group is allowed; toggling
	// it writes the whole group in one save (see `setCrawlerGroupBlocked`).
	const allAllowed = crawlers.every( crawler => ! isCrawlerBlocked( crawler, overrides ) );

	// Extracted (not an inline arrow) for a stable callback, matching CrawlerToggle.
	// Switching "Allow all" *on* means "allow the whole group" (blocked = false).
	const handleToggleAll = useCallback(
		( allowed: boolean ) => onToggleAll( type, ! allowed ),
		[ type, onToggleAll ]
	);

	return (
		<CollapsibleCard.Root>
			<CollapsibleCard.Header>
				<Card.Title>{ title }</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="md">
					<p className="jetpack-seo-ai__crawlers-intro">{ intro }</p>
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
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

/**
 * GEO (Generative Engine Optimization) tab — internal id/route still keyed `ai`.
 * Stacks (in a single centered column matching the Settings tab's width):
 * llms.txt, the plan-gated AI SEO Enhancer, then the AI-crawler controls — split
 * into answer, training, and mixed-use groups. When the controls can't take
 * effect, they are replaced by an explanation instead of ineffective toggles.
 *
 * State + auto-save live in the `form` controller (passed from the page root so
 * it survives tab switches); this component is the presentation.
 *
 * @param props      - Component props.
 * @param props.form - The AI form controller from `useAiForm`.
 * @return The AI tab content.
 */
const AiScreen: FC< Props > = ( { form } ) => {
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

	const navigate = useNavigate();
	const goToVisibility = useCallback(
		() => navigate( { href: '/settings?focus=visibility' } ),
		[ navigate ]
	);

	// Site-visibility lives on the Settings tab, so read it from the settings store
	// (updated on each save) and overlay it on the one-time crawler bootstrap —
	// otherwise flipping visibility on Settings and returning here without a reload
	// would leave this tab disagreeing with the Overview card, which overlays the
	// same live value.
	const settings = useSelect( select => select( settingsStore ).getSettings(), [] );

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

		const searchEnginesVisible = settings?.search_engines_visible ?? crawlers.searchEnginesVisible;

		// Path-based multisite networks share one origin-level robots.txt, so a
		// site-level setting cannot safely represent its scope.
		if ( crawlers.pathBasedMultisite ) {
			return (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>{ __( 'AI crawler access', 'jetpack-seo' ) }</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Notice.Root intent="info">
							<Notice.Description>
								{ __(
									'Per-site AI crawler controls are unavailable on this path-based multisite network because every site shares one robots.txt. Manage crawler access at the network level instead.',
									'jetpack-seo'
								) }
							</Notice.Description>
						</Notice.Root>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);
		}

		// Staging subdomain blocks all crawling at the platform level, so even an
		// indexable site can't apply these — explain and stop.
		if ( crawlers.restrictedSubdomain ) {
			return (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>{ __( 'AI crawler access', 'jetpack-seo' ) }</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Notice.Root intent="info">
							<Notice.Description>
								{ __(
									'This site uses a temporary staging address (a .wpcomstaging.com subdomain), where search engines and AI crawlers are blocked. These settings will take effect once the site is on its own domain.',
									'jetpack-seo'
								) }
							</Notice.Description>
						</Notice.Root>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);
		}

		// Search engines (and therefore AI crawlers) are blocked site-wide — point
		// the user at the setting that turns indexing back on.
		if ( ! searchEnginesVisible ) {
			return (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>{ __( 'AI crawler access', 'jetpack-seo' ) }</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Stack direction="column" gap="md">
							<Notice.Root intent="info">
								<Notice.Description>
									{ __(
										"Search engines and AI crawlers are all blocked because this site isn't set to be indexed. To choose which AI crawlers can access your site, allow search engines to index it first.",
										'jetpack-seo'
									) }
								</Notice.Description>
							</Notice.Root>
							<Button variant="link" onClick={ goToVisibility }>
								{ __( 'Open site visibility settings', 'jetpack-seo' ) }
							</Button>
						</Stack>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);
		}

		// WordPress.com's existing data-sharing policy runs after this feature and
		// remains authoritative, so don't offer controls it can override.
		if ( crawlers.dataSharingOptOut ) {
			return (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>{ __( 'AI crawler access', 'jetpack-seo' ) }</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Notice.Root intent="info">
							<Notice.Description>
								{ __(
									"Individual crawler controls are unavailable while this site's data sharing opt-out is enabled. Turn it off in the site's privacy settings to manage crawlers individually.",
									'jetpack-seo'
								) }
							</Notice.Description>
						</Notice.Root>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);
		}

		// A static robots.txt file in the WordPress installation is separate from
		// the virtual output these settings change.
		if ( crawlers.staticRobotsTxt ) {
			return (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>{ __( 'AI crawler access', 'jetpack-seo' ) }</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Notice.Root intent="warning">
							<Notice.Description>
								{ __(
									"Jetpack detected a static robots.txt file in the WordPress installation directory. These settings only change WordPress's virtual robots.txt; edit or remove the static file to manage AI crawler access here.",
									'jetpack-seo'
								) }
							</Notice.Description>
						</Notice.Root>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);
		}

		const answerCrawlers = crawlers.catalog.filter( crawler => crawler.type === 'answer' );
		const trainingCrawlers = crawlers.catalog.filter( crawler => crawler.type === 'training' );
		const mixedCrawlers = crawlers.catalog.filter( crawler => crawler.type === 'mixed' );

		return (
			<>
				<CrawlerSection
					title={ __( 'Answer engines', 'jetpack-seo' ) }
					intro={ __(
						'These crawlers fetch your pages so AI assistants can cite you in their answers. Keep them allowed to stay visible in tools like ChatGPT, Perplexity, and Claude.',
						'jetpack-seo'
					) }
					crawlers={ answerCrawlers }
					type="answer"
					overrides={ crawlers.overrides }
					disabled={ isSaving }
					onToggle={ setCrawlerBlocked }
					onToggleAll={ setCrawlerGroupBlocked }
				/>
				<CrawlerSection
					title={ __( 'Training crawlers', 'jetpack-seo' ) }
					intro={ __(
						'These crawlers collect your content to train AI models. Block them to limit that use.',
						'jetpack-seo'
					) }
					crawlers={ trainingCrawlers }
					type="training"
					overrides={ crawlers.overrides }
					disabled={ isSaving }
					onToggle={ setCrawlerBlocked }
					onToggleAll={ setCrawlerGroupBlocked }
				/>
				<CrawlerSection
					title={ __( 'AI answers and training', 'jetpack-seo' ) }
					intro={ __(
						'These crawlers can use your content both to improve AI models and to ground AI answers. Blocking them may reduce your visibility in AI answers.',
						'jetpack-seo'
					) }
					crawlers={ mixedCrawlers }
					type="mixed"
					overrides={ crawlers.overrides }
					disabled={ isSaving }
					onToggle={ setCrawlerBlocked }
					onToggleAll={ setCrawlerGroupBlocked }
				/>
			</>
		);
	};

	return (
		<div className="jetpack-seo-ai">
			{ llmsTxt && (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>{ __( 'llms.txt', 'jetpack-seo' ) }</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Stack direction="column" gap="md">
							{ ! llmsTxt.canServe && (
								<Notice.Root intent="warning">
									<Notice.Description>
										{ __(
											"Jetpack can't publish llms.txt on this site: a file at /llms.txt or your hosting setup is already handling that address, so this setting won't take effect. Remove that file (or check with your host) to let Jetpack manage it.",
											'jetpack-seo'
										) }
									</Notice.Description>
								</Notice.Root>
							) }
							<ToggleControl
								label={ __( 'Generate an llms.txt file', 'jetpack-seo' ) }
								help={ __(
									'Publishes a curated, AI-readable map of your content at /llms.txt to help AI assistants find and understand your pages and posts.',
									'jetpack-seo'
								) }
								checked={ llmsTxt.enabled }
								onChange={ setLlmsTxtEnabled }
								disabled={ isSaving }
								__nextHasNoMarginBottom
							/>
							{ llmsTxt.enabled && llmsTxt.canServe && (
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
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			) }

			{ enhancer.available && (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>{ __( 'AI SEO Enhancer', 'jetpack-seo' ) }</Card.Title>
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
