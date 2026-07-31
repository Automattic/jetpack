/* eslint-disable react/jsx-no-bind */

import { __ } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';
import { Button, Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import useSeoToolsToggle from '../../data/use-seo-tools-toggle';
import styles from './style.module.scss';
import type { FC } from 'react';

/**
 * Higher-risk settings, kept together at the foot of the tab and away from the
 * everyday ones. Today that's turning SEO tools off; anything else with
 * site-wide consequences belongs here rather than inline among the normal
 * controls.
 *
 * The header carries no status or badge. A completion indicator would grade an
 * on/off preference — both answers are legitimate — and a state badge would
 * restate what the module's own control already says once you open it.
 *
 * Not rendered on WordPress.com Simple: `Modules::is_active()` reports every
 * module active there, so the control couldn't actually turn anything off (see
 * the caller in `screens/settings/index.tsx`).
 *
 * @return The Advanced settings module.
 */
const AdvancedCard: FC = () => {
	const { isToggling, setActive } = useSeoToolsToggle();

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Card.Title>
					{ /* The standard brand chip, not a warning tint: a second chip treatment
					     would make this read as a different kind of module. The `caution`
					     glyph says "read before acting"; the copy inside does the explaining. */ }
					<CardTitleIcon icon={ caution } title={ __( 'Advanced', 'jetpack-seo' ) } />
				</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="sm">
						{ /* Names the setting, since "Advanced" names the group rather than what
						     is in it. `heading-md` is the sub-heading treatment — `heading-sm`
						     would be 11px uppercase, which is the field-label role. */ }
						<Text variant="heading-md">{ __( 'Disable Jetpack’s SEO tools', 'jetpack-seo' ) }</Text>
						{ /* Body copy, not the muted `body-sm` explainer style: the small light
						     treatment is for hints attached to a field, and this is the module's
						     own prose. Same for the list and the closing line below. */ }
						<Text variant="body-md" render={ <p /> }>
							{ __(
								'Use this only if you don’t want Jetpack optimizing this site, or if another SEO plugin is managing the same things and they’re conflicting.',
								'jetpack-seo'
							) }
						</Text>
					</Stack>

					<Stack direction="column" gap="sm">
						{ /* `heading-md` (13px medium), not `heading-sm` — that one is 11px
						     uppercase, the field-label treatment, which would render this
						     lead-in smaller than the list it introduces. */ }
						<Text variant="heading-md">{ __( 'While it’s off:', 'jetpack-seo' ) }</Text>
						{ /* The three things that actually stop, which the old Overview footer
						     link never said. Structured data and llms.txt are front-end output,
						     not just settings — see `Initializer::init()`, which skips
						     `Schema_Builder`, `Author_Schema_Node`, `Llms_Txt` and `Ai_Crawlers`
						     while the module is inactive. */ }
						{ /* Each item goes through `Text` so it carries the same typography as
						     the paragraphs around it, rather than inheriting whatever wp-admin
						     gives a bare `li`. */ }
						<ul className={ styles.effects }>
							<Text variant="body-md" render={ <li /> }>
								{ __(
									'These settings become unavailable — titles, descriptions, sitemap, verification and schema.',
									'jetpack-seo'
								) }
							</Text>
							<Text variant="body-md" render={ <li /> }>
								{ __( 'Jetpack stops adding structured data to your pages.', 'jetpack-seo' ) }
							</Text>
							<Text variant="body-md" render={ <li /> }>
								{ __(
									'Your llms.txt file stops being served, and AI crawler rules are removed from robots.txt.',
									'jetpack-seo'
								) }
							</Text>
						</ul>
					</Stack>

					<Text variant="body-md" render={ <p /> }>
						{ __(
							'Everything you’ve entered here is kept, so turning it back on restores your setup.',
							'jetpack-seo'
						) }
					</Text>

					{ /* Plain `Button`, matching the Save buttons in the modules above — they
					     pass no `variant` either, so this tracks the default rather than
					     pinning `solid` and drifting if that default ever changes. */ }
					<Stack direction="row" justify="flex-end">
						<Button
							onClick={ () => setActive( false ) }
							loading={ isToggling }
							disabled={ isToggling }
						>
							{ __( 'Disable Jetpack SEO', 'jetpack-seo' ) }
						</Button>
					</Stack>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default AdvancedCard;
