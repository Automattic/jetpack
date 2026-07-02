import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard, Link, Notice, Stack } from '@wordpress/ui';
import './style.scss';
import type { AiForm } from '../../data/use-ai';
import type { FC } from 'react';

interface Props {
	form: AiForm;
}

/**
 * GEO (Generative Engine Optimization) tab — internal id/route still keyed
 * `ai`. Stacks (in a single centered column matching the Settings tab's
 * width): llms.txt generation (free), then the plan-gated AI SEO Enhancer. AI
 * crawler controls land here later (tracked separately). State + auto-save live
 * in the `form` controller (passed from the page root so it survives tab
 * switches); this component is the presentation.
 *
 * @param props      - Component props.
 * @param props.form - The AI form controller from `useAiForm`.
 * @return The AI tab content.
 */
const AiScreen: FC< Props > = ( { form } ) => {
	const { enhancer, llmsTxt, isSaving, setEnhancerEnabled, setLlmsTxtEnabled } = form;

	if ( ! enhancer ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __( 'Unable to load GEO settings.', 'jetpack-seo' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

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
		</div>
	);
};

export default AiScreen;
