import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Stack } from '@wordpress/ui';
import StatusDot from './status-dot';
import type { AiCrawler, AiState } from '../../data/ai-types';
import type { FC } from 'react';

interface Props {
	data: NonNullable< AiState[ 'crawlers' ] >;
	/**
	 * Whether search engines may index the site (`blog_public`). Overlaid from the
	 * Settings store by the Overview so a visibility toggle reflects here without a
	 * reload; the card's own bootstrap value can be stale.
	 */
	searchEnginesVisible: boolean;
	onManage: () => void;
}

// Resolved at module scope so the production minifier can't fold an adjacent
// `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which would erase the literals
// from i18n extraction. See feedback_i18n_ternary_minifier_fold.
const cantCrawlStagingLabel = __(
	"AI crawlers can't reach this site while it's on a staging address",
	'jetpack-seo'
);
const cantCrawlIndexingLabel = __(
	"AI crawlers can't reach this site while search engines are blocked",
	'jetpack-seo'
);
const cantReachRobotsLabel = __(
	"Crawler settings can't apply — we can't reach this site's robots.txt file",
	'jetpack-seo'
);

/**
 * Overview card summarizing AI crawler access. When the per-crawler settings
 * can't take effect — search engines blocked, a `*.wpcomstaging.com` staging
 * address, or a host-managed robots.txt we can't reach — that reason is the
 * card's headline state. Otherwise it shows a one-line summary of the two crawler
 * groups. Reads the same
 * `aiStore` slice that drives the GEO tab (no separate Overview payload), and the
 * "Manage" button deep-links there.
 *
 * @param props                      - Component props.
 * @param props.data                 - The crawler bootstrap (catalog + overrides + environment flags).
 * @param props.searchEnginesVisible - Whether search engines may index the site (overlaid from Settings).
 * @param props.onManage             - Opens the GEO tab.
 * @return The AI crawler access card.
 */
const AiCrawlerCard: FC< Props > = ( { data, searchEnginesVisible, onManage } ) => {
	const canBeCrawled = searchEnginesVisible && ! data.restrictedSubdomain;
	// Per-crawler settings only take effect when the site is crawlable AND we can
	// reach its robots.txt to write the directives (see JETPACK-1834).
	const settingsApply = canBeCrawled && ! data.staticRobotsTxt;

	// A crawler is blocked when its override says so, else by its group default
	// (training blocked, answer allowed) — same resolution as the GEO tab.
	const isBotBlocked = ( bot: AiCrawler ): boolean =>
		data.overrides[ bot.slug ] ?? bot.type === 'training';
	const answerBots = data.catalog.filter( bot => bot.type === 'answer' );
	const trainingBots = data.catalog.filter( bot => bot.type === 'training' );
	const answerAllowed = answerBots.filter( bot => ! isBotBlocked( bot ) ).length;
	const trainingBlocked = trainingBots.filter( bot => isBotBlocked( bot ) ).length;

	// When the settings can't apply, which reason to show — ordered by precedence
	// (staging → not indexed → robots.txt out of reach). Module-scope labels keep
	// the i18n minifier from folding a `? __() : __()` ternary.
	// Typed `string` (not the inferred branded `TransformedText` of the first
	// label) so the branches below, each a different translated literal, assign.
	let blockedLabel: string = cantReachRobotsLabel;
	if ( data.restrictedSubdomain ) {
		blockedLabel = cantCrawlStagingLabel;
	} else if ( ! searchEnginesVisible ) {
		blockedLabel = cantCrawlIndexingLabel;
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'AI crawler access', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ settingsApply ? (
					<Stack direction="column" gap="xs">
						<StatusDot
							status={ answerAllowed > 0 ? 'ok' : 'warn' }
							label={ sprintf(
								/* translators: %1$d is the number of allowed answer engines, %2$d the total. */
								__( 'Answer engines: %1$d of %2$d allowed', 'jetpack-seo' ),
								answerAllowed,
								answerBots.length
							) }
						/>
						<StatusDot
							status="ok"
							label={ sprintf(
								/* translators: %1$d is the number of blocked training crawlers, %2$d the total. */
								__( 'Training crawlers: %1$d of %2$d blocked', 'jetpack-seo' ),
								trainingBlocked,
								trainingBots.length
							) }
						/>
					</Stack>
				) : (
					<StatusDot status="warn" label={ blockedLabel } />
				) }
				<div className="jetpack-seo-overview__card-footer">
					<Button variant="outline" tone="neutral" onClick={ onManage }>
						{ __( 'Manage AI crawlers', 'jetpack-seo' ) }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
};

export default AiCrawlerCard;
