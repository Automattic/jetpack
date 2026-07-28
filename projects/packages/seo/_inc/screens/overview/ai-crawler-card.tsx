import { __, sprintf } from '@wordpress/i18n';
import { key } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import CardHeaderIcon from './card-header-icon';
import StatusDot from './status-dot';
import styles from './style.module.scss';
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
	"AI crawlers can't reach this site while it's on a staging address.",
	'jetpack-seo'
);
const cantCrawlIndexingLabel = __(
	"AI crawlers can't reach this site while search engines are blocked.",
	'jetpack-seo'
);
const staticRobotsLabel = __(
	"Crawler settings can't apply while a static robots.txt file exists in the WordPress installation directory.",
	'jetpack-seo'
);
const dataSharingOptOutLabel = __(
	"Individual crawler settings are overridden by this site's data sharing opt-out.",
	'jetpack-seo'
);
const pathBasedMultisiteLabel = __(
	"Per-site crawler settings aren't available on this path-based multisite network.",
	'jetpack-seo'
);

/**
 * Overview card summarizing AI crawler access. When the per-crawler settings
 * can't take effect — search engines blocked, a `*.wpcomstaging.com` staging
 * address, a static robots.txt file, a data-sharing opt-out, or a path-based
 * multisite network — that reason is the card's headline state. Otherwise it
 * shows a one-line summary of the crawler groups. Reads the same
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
	// write the virtual robots.txt without another policy overriding them.
	const settingsApply =
		canBeCrawled && ! data.staticRobotsTxt && ! data.dataSharingOptOut && ! data.pathBasedMultisite;

	// A crawler is blocked when its override says so, else by its group default
	// (training blocked, other types allowed) — same resolution as the GEO tab.
	const isBotBlocked = ( bot: AiCrawler ): boolean =>
		data.overrides[ bot.slug ] ?? bot.type === 'training';
	const answerBots = data.catalog.filter( bot => bot.type === 'answer' );
	const trainingBots = data.catalog.filter( bot => bot.type === 'training' );
	const answerAllowed = answerBots.filter( bot => ! isBotBlocked( bot ) ).length;
	const trainingBlocked = trainingBots.filter( bot => isBotBlocked( bot ) ).length;

	// When the settings can't apply, choose the highest-precedence reason.
	// Module-scope labels keep
	// the i18n minifier from folding a `? __() : __()` ternary.
	// Typed `string` (not the inferred branded `TransformedText` of the first
	// label) so the branches below, each a different translated literal, assign.
	let blockedLabel: string = staticRobotsLabel;
	if ( data.pathBasedMultisite ) {
		blockedLabel = pathBasedMultisiteLabel;
	} else if ( data.restrictedSubdomain ) {
		blockedLabel = cantCrawlStagingLabel;
	} else if ( ! searchEnginesVisible ) {
		blockedLabel = cantCrawlIndexingLabel;
	} else if ( data.dataSharingOptOut ) {
		blockedLabel = dataSharingOptOutLabel;
	}

	return (
		<Card.Root>
			<CardHeaderIcon icon={ key } title={ __( 'AI crawler access', 'jetpack-seo' ) } />
			<Stack render={ <Card.Content /> } direction="column" className={ styles.cardContent }>
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
					// A full-sentence explanation, not a status — so no indicator dot
					// (the vertically-centred dot next to wrapping text reads oddly).
					<Text>{ blockedLabel }</Text>
				) }
				<Stack direction="row" justify="flex-end" className={ styles.footer }>
					<Button variant="solid" size="compact" onClick={ onManage }>
						{ __( 'Manage AI crawlers', 'jetpack-seo' ) }
					</Button>
				</Stack>
			</Stack>
		</Card.Root>
	);
};

export default AiCrawlerCard;
