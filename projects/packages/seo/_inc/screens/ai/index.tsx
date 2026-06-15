import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard, Notice } from '@wordpress/ui';
import type { AiForm } from '../../data/use-ai';
import type { FC } from 'react';

interface Props {
	form: AiForm;
}

/**
 * AI tab. Hosts the AI SEO Enhancer toggle today; llms.txt and AI-crawler
 * controls land here later (tracked separately). State + auto-save live in the
 * `form` controller (passed from the page root so it survives tab switches);
 * this component is the presentation.
 *
 * The tab itself is always shown — only the Enhancer card is plan-gated, so the
 * tab stays a home for the free AI settings still to come.
 *
 * @param props      - Component props.
 * @param props.form - The AI form controller from `useAiForm`.
 * @return The AI tab content.
 */
const AiScreen: FC< Props > = ( { form } ) => {
	const { enhancer, isSaving, setEnhancerEnabled } = form;

	if ( ! enhancer ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __( 'Unable to load AI settings.', 'jetpack-seo' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	// The Enhancer requires a supporting plan; when unavailable the card is
	// hidden (parity with the legacy Traffic page). The tab stays in place for
	// the free AI settings still to come.
	if ( ! enhancer.available ) {
		return (
			<Notice.Root intent="info">
				<Notice.Description>
					{ __( 'More AI tools for your SEO are on the way.', 'jetpack-seo' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<div className="jetpack-seo-ai">
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
		</div>
	);
};

export default AiScreen;
