import { Button, ToggleControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Link, Notice, Stack } from '@wordpress/ui';
import './style.scss';
import type { AiForm } from '../../data/use-ai';
import type { FC } from 'react';

interface Props {
	form: AiForm;
	searchEnginesVisible: boolean;
	onManageVisibility: () => void;
}

const llmsTxtHelp = __(
	'Publishes a curated, AI-readable map at /llms.txt to help AI assistants find and understand your supported content.',
	'jetpack-seo'
);
const enabledLabel = __( 'Enabled', 'jetpack-seo' );
const disabledLabel = __( 'Disabled', 'jetpack-seo' );

/**
 * GEO (Generative Engine Optimization) tab — internal id/route still keyed
 * `ai`. Stacks (in a single centered column matching the Settings tab's
 * width): llms.txt generation (free), then the plan-gated AI SEO Enhancer. AI
 * crawler controls land here later (tracked separately). State + auto-save live
 * in the `form` controller (passed from the page root so it survives tab
 * switches); this component is the presentation.
 *
 * @param props                      - Component props.
 * @param props.form                 - The AI form controller from `useAiForm`.
 * @param props.searchEnginesVisible - Whether the site allows search-engine indexing.
 * @param props.onManageVisibility   - Opens the Settings visibility controls.
 * @return The AI tab content.
 */
const AiScreen: FC< Props > = ( { form, searchEnginesVisible, onManageVisibility } ) => {
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

	const llmsTxtEffectivelyOn = Boolean( searchEnginesVisible && llmsTxt?.enabled );
	const llmsTxtStatusLabel = llmsTxtEffectivelyOn ? enabledLabel : disabledLabel;

	return (
		<div className="jetpack-seo-ai">
			{ llmsTxt && (
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Stack direction="row" justify="space-between" align="center" gap="sm">
							<Card.Title>{ __( 'llms.txt', 'jetpack-seo' ) }</Card.Title>
							<Badge intent={ llmsTxtEffectivelyOn ? 'stable' : 'draft' }>
								{ llmsTxtStatusLabel }
							</Badge>
						</Stack>
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
													'To enable llms.txt, turn on “Allow search engines to index this site”. <link>Manage site visibility</link>',
													'jetpack-seo'
												),
												{
													link: (
														<Button
															variant="link"
															className="jetpack-seo-ai__llms-notice-link"
															onClick={ onManageVisibility }
														/>
													),
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
