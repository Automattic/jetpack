import { __, sprintf } from '@wordpress/i18n';
import { key } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { isCrawlerBlocked } from '../../data/blocked-crawlers';
import getOutput from '../../data/get-output';
import CardHeaderIcon from './card-header-icon';
import StatusDot from './status-dot';
import styles from './style.module.scss';
import type { AiCrawler, GeoState } from '../../data/geo-types';
import type { FC } from 'react';

interface Props {
	data: NonNullable< GeoState[ 'crawlers' ] >;
	/**
	 * Whether search engines may index the site (`blog_public`). Overlaid from the
	 * Settings store by the Overview so a visibility toggle reflects here without a
	 * reload; the card's own bootstrap value can be stale.
	 */
	searchEnginesVisible: boolean;
	/** The llms.txt slice from the same `geoStore` the GEO tab uses. */
	llmsTxt: GeoState[ 'llmsTxt' ] | null;
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
	"AI crawlers can't reach this site while it's closed to search engines.",
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
const llmsPublishedLabel = __( 'llms.txt published', 'jetpack-seo' );
const llmsNotPublishedLabel = __( 'llms.txt not published', 'jetpack-seo' );
const llmsPausedLabel = __( 'llms.txt paused', 'jetpack-seo' );

/**
 * Overview card summarizing AI access. When the per-crawler settings
 * can't take effect — search engines blocked, a `*.wpcomstaging.com` staging
 * address, a static robots.txt file, a data-sharing opt-out, or a path-based
 * multisite network — that reason is the card's headline state. Otherwise it
 * shows a one-line summary of the crawler groups. Reads the same
 * `geoStore` slice that drives the GEO tab (no separate Overview payload), and the
 * "Manage" button deep-links there.
 *
 * @param props                      - Component props.
 * @param props.data                 - The crawler bootstrap (catalog + blocked crawlers + environment flags).
 * @param props.searchEnginesVisible - Whether search engines may index the site (overlaid from Settings).
 * @param props.llmsTxt              - The llms.txt slice, rendered as a third status row.
 * @param props.onManage             - Opens the GEO tab.
 * @return The AI access card.
 */
const AiCrawlerCard: FC< Props > = ( { data, searchEnginesVisible, llmsTxt, onManage } ) => {
	const canBeCrawled = searchEnginesVisible && ! data.restrictedSubdomain;
	// Per-crawler settings only take effect when the site is crawlable AND we can
	// write the virtual robots.txt without another policy overriding them.
	const settingsApply =
		canBeCrawled && ! data.staticRobotsTxt && ! data.dataSharingOptOut && ! data.pathBasedMultisite;

	const isBotBlocked = ( bot: AiCrawler ): boolean => isCrawlerBlocked( data.blocked, bot );
	const answerBots = data.catalog.filter( bot => bot.type === 'answer' );
	const trainingBots = data.catalog.filter( bot => bot.type === 'training' );
	const answerBlocked = answerBots.filter( isBotBlocked ).length;
	const trainingBlocked = trainingBots.filter( isBotBlocked ).length;

	// The card reports the state of optimization, not who owns it: `canServe` is false
	// when a static file or the host already answers /llms.txt, which reads as
	// published. While Jetpack's SEO output is paused `canServe` is false too, but
	// nothing is served, so the row says "paused" when llms.txt is switched on and
	// "not published" when it isn't.
	const { paused } = getOutput();
	const llmsPublished = ! paused && ( ! llmsTxt?.canServe || Boolean( llmsTxt?.enabled ) );
	let llmsLabel: string = llmsPublished ? llmsPublishedLabel : llmsNotPublishedLabel;
	if ( paused && llmsTxt?.enabled ) {
		llmsLabel = llmsPausedLabel;
	}

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
			<CardHeaderIcon icon={ key } title={ __( 'AI access', 'jetpack-seo' ) } />
			<Stack render={ <Card.Content /> } direction="column" className={ styles.cardContent }>
				{ settingsApply ? (
					<Stack direction="column" gap="xs">
						<StatusDot
							// Blocking every answer engine keeps the site out of AI answers.
							status={ answerBlocked < answerBots.length ? 'ok' : 'warn' }
							label={ sprintf(
								/* translators: %1$d is the number of blocked answer engines, %2$d the total. */
								__( 'Answer engines: %1$d of %2$d blocked', 'jetpack-seo' ),
								answerBlocked,
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
				{ /* llms.txt has its own availability rules, independent of crawler controls. */ }
				{ llmsTxt && searchEnginesVisible && (
					<StatusDot status={ llmsPublished ? 'ok' : 'warn' } label={ llmsLabel } />
				) }
				<Stack direction="row" justify="flex-end" className={ styles.footer }>
					<Button variant="solid" size="compact" onClick={ onManage }>
						{ __( 'Manage AI access', 'jetpack-seo' ) }
					</Button>
				</Stack>
			</Stack>
		</Card.Root>
	);
};

export default AiCrawlerCard;
