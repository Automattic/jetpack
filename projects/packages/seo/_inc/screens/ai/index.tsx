import { ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard, Link, Notice, Stack } from '@wordpress/ui';
import type { AiCrawler } from '../../data/ai-types';
import type { AiForm } from '../../data/use-ai';
import type { FC } from 'react';

interface Props {
	form: AiForm;
}

interface CrawlerToggleProps {
	crawler: AiCrawler;
	blocked: boolean;
	disabled: boolean;
	onToggle: ( slug: string, blocked: boolean ) => void;
}

/**
 * A single "allow this crawler" toggle. Extracted so its change handler is a
 * stable callback (bound to the crawler's slug) rather than an inline arrow.
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

/**
 * AI tab. Hosts three sections: the plan-gated AI SEO Enhancer, plus the free
 * llms.txt and AI-crawler controls. State + auto-save live in the `form`
 * controller (passed from the page root so it survives tab switches); this
 * component is the presentation.
 *
 * The tab itself is always shown. Only the Enhancer card is plan-gated; the
 * free sections render regardless, so the tab is a home for AI settings whether
 * or not the site's plan includes the Enhancer.
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

	if ( ! enhancer ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __( 'Unable to load AI settings.', 'jetpack-seo' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<div className="jetpack-seo-ai">
			<Stack direction="column" gap="lg">
				{ /* The Enhancer requires a supporting plan; when unavailable the card
				     is hidden (parity with the legacy Traffic page) while the free
				     sections below carry the tab. */ }
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
									<Link href={ llmsTxt.url } openInNewTab rel="noopener noreferrer">
										{ __( 'View your llms.txt', 'jetpack-seo' ) }
									</Link>
								) }
							</Stack>
						</CollapsibleCard.Content>
					</CollapsibleCard.Root>
				) }

				{ crawlers && (
					<CollapsibleCard.Root defaultOpen>
						<CollapsibleCard.Header>
							<Card.Title>{ __( 'AI crawler access', 'jetpack-seo' ) }</Card.Title>
						</CollapsibleCard.Header>
						<CollapsibleCard.Content>
							<Stack direction="column" gap="md">
								<p className="jetpack-seo-ai__crawlers-intro">
									{ __(
										'Choose which AI crawlers may access your site. Blocked crawlers are disallowed in your robots.txt.',
										'jetpack-seo'
									) }
								</p>
								{ crawlers.catalog.map( crawler => (
									<CrawlerToggle
										key={ crawler.slug }
										crawler={ crawler }
										blocked={ crawlers.blocked.includes( crawler.slug ) }
										disabled={ isSaving }
										onToggle={ setCrawlerBlocked }
									/>
								) ) }
							</Stack>
						</CollapsibleCard.Content>
					</CollapsibleCard.Root>
				) }
			</Stack>
		</div>
	);
};

export default AiScreen;
