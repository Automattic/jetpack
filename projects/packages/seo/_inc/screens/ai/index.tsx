import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Card, CollapsibleCard, Link, Notice, Stack } from '@wordpress/ui';
import './style.scss';
import type { AiCrawler } from '../../data/ai-types';
import type { AiForm } from '../../data/use-ai';
import type { FC } from 'react';

interface Props {
	form: AiForm;
}

/**
 * Whether a crawler is currently blocked: an explicit override wins, otherwise
 * the per-type default (training crawlers blocked, answer engines allowed).
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
 * @return The crawler toggle row.
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
		<div className="jetpack-seo-ai__crawler-row">
			<ToggleControl
				label={ crawler.label }
				help={ blocked ? blockedLabel : allowedLabel }
				checked={ ! blocked }
				onChange={ handleChange }
				disabled={ disabled }
				__nextHasNoMarginBottom
			/>
			<Link
				className="jetpack-seo-ai__crawler-doc"
				href={ getRedirectUrl( crawler.redirectSlug ) }
				openInNewTab
				rel="noopener noreferrer"
			>
				{ sprintf(
					/* translators: %s is an AI crawler's user-agent name, e.g. "GPTBot". */
					__( 'Learn what %s does', 'jetpack-seo' ),
					crawler.userAgent
				) }
			</Link>
		</div>
	);
};

interface CrawlerSectionProps {
	title: string;
	intro: string;
	crawlers: AiCrawler[];
	overrides: Record< string, boolean >;
	disabled: boolean;
	onToggle: ( slug: string, blocked: boolean ) => void;
}

/**
 * A collapsible card listing one group of crawler toggles (answer engines or
 * training crawlers) with a one-line explanation of what the group does.
 * Collapsed by default — the AI-crawler controls sit at the bottom of the tab and
 * most people won't need to open them.
 *
 * @param props           - Component props.
 * @param props.title     - Section title.
 * @param props.intro     - One-line description of the group's purpose.
 * @param props.crawlers  - The crawlers in this group.
 * @param props.overrides - The sparse override map (`slug => blocked`).
 * @param props.disabled  - Whether toggles are disabled (mid-save).
 * @param props.onToggle  - Called with `(slug, blocked)` on change.
 * @return The section card.
 */
const CrawlerSection: FC< CrawlerSectionProps > = ( {
	title,
	intro,
	crawlers,
	overrides,
	disabled,
	onToggle,
} ) => (
	<CollapsibleCard.Root>
		<CollapsibleCard.Header>
			<Card.Title>{ title }</Card.Title>
		</CollapsibleCard.Header>
		<CollapsibleCard.Content>
			<Stack direction="column" gap="md">
				<p className="jetpack-seo-ai__crawlers-intro">{ intro }</p>
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

/**
 * GEO (Generative Engine Optimization) tab — internal id/route still keyed `ai`.
 * Stacks (in a single centered column matching the Settings tab's width):
 * llms.txt, the plan-gated AI SEO Enhancer, then the AI-crawler controls — split
 * into "Answer engines" (allowed by default, so the site stays citable in AI
 * answers) and "Training crawlers" (blocked by default). When the site can't be
 * crawled at all — search-engine indexing off, or a `*.wpcomstaging.com` staging
 * address — the crawler controls are replaced by an explanation instead of
 * toggles that can't take effect.
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
	} = form;

	const navigate = useNavigate();
	const goToVisibility = useCallback(
		() => navigate( { href: '/settings?focus=visibility' } ),
		[ navigate ]
	);

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
	 * The AI-crawler portion of the tab: either the two control sections, or — when
	 * the site can't be crawled — a single card explaining why.
	 *
	 * @return The crawler cards, or null when there's no crawler bootstrap.
	 */
	const renderCrawlers = () => {
		if ( ! crawlers ) {
			return null;
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
		if ( ! crawlers.searchEnginesVisible ) {
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

		const answerCrawlers = crawlers.catalog.filter( crawler => crawler.type === 'answer' );
		const trainingCrawlers = crawlers.catalog.filter( crawler => crawler.type === 'training' );

		return (
			<>
				{ crawlers.staticRobotsTxt && (
					<Notice.Root intent="warning">
						<Notice.Description>
							{ __(
								'A static robots.txt on your host may prevent these directives from taking effect. This is common on local, sandbox, and staging sites.',
								'jetpack-seo'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				<CrawlerSection
					title={ __( 'Answer engines', 'jetpack-seo' ) }
					intro={ __(
						'These crawlers fetch your pages so AI assistants can cite you in their answers. Keep them allowed to stay visible in tools like ChatGPT, Perplexity, and Claude.',
						'jetpack-seo'
					) }
					crawlers={ answerCrawlers }
					overrides={ crawlers.overrides }
					disabled={ isSaving }
					onToggle={ setCrawlerBlocked }
				/>
				<CrawlerSection
					title={ __( 'Training crawlers', 'jetpack-seo' ) }
					intro={ __(
						"These crawlers collect your content to train AI models. Blocking them protects your content and doesn't affect whether you appear in AI answers.",
						'jetpack-seo'
					) }
					crawlers={ trainingCrawlers }
					overrides={ crawlers.overrides }
					disabled={ isSaving }
					onToggle={ setCrawlerBlocked }
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
							{ llmsTxt.enabled && (
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
