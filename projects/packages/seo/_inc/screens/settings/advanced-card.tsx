/* eslint-disable react/jsx-no-bind */

import { __ } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';
import { Button, Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import { isGated } from '../../data/is-gated';
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
						     would be 11px uppercase, which is the field-label role.

						     A real `h3` under the card's `h2`, so the setting has a name in the
						     heading outline: `Text` defaults to a `<span>`, which would leave a
						     screen-reader user navigating by heading with "Advanced" and nothing
						     under it. Renders identically — `Text` always applies both the `p` and
						     the heading global-CSS defenses, and every variant defines
						     `--_gcd-heading-font-size` next to `--_gcd-p-font-size`. */ }
						<Text variant="heading-md" render={ <h3 /> }>
							{ __( 'Disable Jetpack’s SEO tools', 'jetpack-seo' ) }
						</Text>
						{ /* Body copy, not the muted `body-sm` explainer style: the small light
						     treatment is for hints attached to a field, and this is the module's
						     own prose. Same for the list and the closing line below. */ }
						{ /* Jetpack already sets `jetpack_disable_seo_tools` for the eight SEO
						     plugins people actually mean — Yoast, Rank Math, AIOSEO, SEOPress and
						     friends (see `modules/seo-tools.php`) — so "they're conflicting" named
						     a problem the code prevents, and sent people here for nothing. */ }
						<Text variant="body-md" render={ <p /> }>
							{ __(
								'Use this only if you don’t want Jetpack optimizing this site. If you’re running another SEO plugin, Jetpack already steps aside for the major ones automatically — you’d only need this for one it doesn’t recognize.',
								'jetpack-seo'
							) }
						</Text>
					</Stack>

					<Stack direction="column" gap="sm">
						{ /* `heading-md` (13px medium), not `heading-sm` — that one is 11px
						     uppercase, the field-label treatment, which would render this
						     lead-in smaller than the list it introduces. */ }
						<Text variant="heading-md">{ __( 'While it’s off:', 'jetpack-seo' ) }</Text>
						{ /* What actually stops, which the old Overview footer link never said.
						     Most of this is front-end output rather than settings, and it's
						     ordered by what costs the most: the first two change what search
						     engines see immediately.

						     The front-end effects come from the legacy module — deactivating
						     `seo-tools` stops `Jetpack_SEO` from instantiating at all
						     (`modules/seo-tools.php`), taking with it the `pre_get_document_title`
						     and `wp_title` overrides, the `wp_head` meta output that carries both
						     the description and the `noindex` robots tag, and the
						     `jetpack_sitemap_skip_post` filter that keeps noindex'd posts out of
						     the sitemap. That last one is the only consequence here that can
						     surprise someone, so it gets its own line. The package side is
						     `Initializer::init()`, which skips `Schema_Builder`,
						     `Author_Schema_Node`, `Llms_Txt` and `Ai_Crawlers`. */ }
						{ /* Each item goes through `Text` so it carries the same typography as
						     the paragraphs around it, rather than inheriting whatever wp-admin
						     gives a bare `li`. */ }
						{ /* `role="list"` because `.effects` sets `list-style: none` to draw its
						     own bullets, and Safari/VoiceOver drops list semantics from a list
						     styled that way — losing the item-count cue that tells someone
						     there's a finite set of consequences to hear out. */ }
						<ul className={ styles.effects } role="list">
							<Text variant="body-md" render={ <li /> }>
								{ __(
									'Your saved titles and descriptions stop being used — search engines see your theme’s defaults again.',
									'jetpack-seo'
								) }
							</Text>
							<Text variant="body-md" render={ <li /> }>
								{ __(
									'Pages you hid from search stop being hidden, and go back into your sitemap.',
									'jetpack-seo'
								) }
							</Text>
							<Text variant="body-md" render={ <li /> }>
								{ __( 'Jetpack stops adding structured data to your pages.', 'jetpack-seo' ) }
							</Text>
							{ /* Only where those services run. `Initializer::init()` registers
							     `Llms_Txt` and `Ai_Crawlers` behind `! is_gated()`, and the AI tab
							     is hidden from gated sites — so this would promise a gated site
							     that something stops which it never had. Reachable because the
							     card is hidden on Simple but not on Atomic, and an Atomic site on
							     a plan below Premium is gated. */ }
							{ ! isGated() && (
								<Text variant="body-md" render={ <li /> }>
									{ __(
										'Your llms.txt file stops being served, and AI crawler rules are removed from robots.txt.',
										'jetpack-seo'
									) }
								</Text>
							) }
							<Text variant="body-md" render={ <li /> }>
								{ __(
									'These settings become unavailable until you turn SEO tools back on.',
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
							loadingAnnouncement={ __( 'Disabling SEO tools…', 'jetpack-seo' ) }
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
