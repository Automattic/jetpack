/**
 * Overview view — usage meter, activity log, and documentation links.
 * Shown as the landing tab while the internal-testing gate is on.
 * Layout follows the i4 Overview frame (Free plan / Paid plan cards).
 */

import { AiIcon, getRedirectUrl } from '@automattic/jetpack-components';
import { speak } from '@wordpress/a11y';
import { ExternalLink, ProgressBar, VisuallyHidden } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { list } from '@wordpress/icons';
import { Card, Link, LinkButton, Notice, Skeleton, Stack, Text } from '@wordpress/ui';
import NavRow from '../components/nav-row';
import { EVENTS, recordAiHubEvent, useRecordOnce } from '../tracks';
import AssistantBanner from './assistant-banner';
import { chatGptIcon, claudeIcon } from './connector-icons';
import buildPageThumb from './images/build-page.webp';
import connectClaudeThumb from './images/connect-claude.webp';
import mediaLibraryThumb from './images/media-library.webp';
import optimizeSiteThumb from './images/optimize-site.webp';
import { normalizeUsage, useAiUsage } from './use-ai-usage';

import './style.scss';

// Quick start cards from the i4 Overview frame: each is a nav row to the
// connector's install page, through the redirect service.
const QUICK_START = [
	{
		slug: 'jetpack-ai-hub-overview-quick-start-chatgpt',
		title: __( 'Connect ChatGPT', 'jetpack' ),
		description: __( 'Give ChatGPT access to your site by installing the connector.', 'jetpack' ),
		icon: chatGptIcon,
	},
	{
		slug: 'jetpack-ai-hub-overview-quick-start-claude',
		title: __( 'Connect Claude', 'jetpack' ),
		description: __( 'Give Claude access to your site by installing the connector.', 'jetpack' ),
		icon: claudeIcon,
	},
];

// Lessons from the "Use AI agents with WordPress.com" course; each card links
// to its lesson page (no inline player). Durations are the live lesson
// lengths — re-check them if the videos change. Thumbnails are bundled.
const WALKTHROUGH_VIDEOS = [
	{
		slug: 'jetpack-ai-hub-overview-video-connect-claude',
		title: __( 'Connect your site to Claude', 'jetpack' ),
		duration: '3:18',
		thumbnail: connectClaudeThumb,
	},
	{
		slug: 'jetpack-ai-hub-overview-video-build-page',
		title: __( 'Build a page from a single prompt', 'jetpack' ),
		duration: '3:09',
		thumbnail: buildPageThumb,
	},
	{
		slug: 'jetpack-ai-hub-overview-video-media-library',
		title: __( 'Manage your Media Library with AI', 'jetpack' ),
		duration: '3:14',
		thumbnail: mediaLibraryThumb,
	},
	{
		slug: 'jetpack-ai-hub-overview-video-optimize-site',
		title: __( 'Optimize your site with AI', 'jetpack' ),
		duration: '3:15',
		thumbnail: optimizeSiteThumb,
	},
];

// Redirect-service sources for the documentation links. All four are
// registered and resolving (as are the four video sources above).
const DOC_LINKS = [
	{
		slug: 'jetpack-ai-hub-overview-docs-mcp-guide',
		title: __( 'MCP integration guide', 'jetpack' ),
	},
	{
		slug: 'jetpack-ai-hub-overview-docs-features',
		title: __( 'AI features overview', 'jetpack' ),
	},
	{ slug: 'jetpack-ai-hub-overview-docs-billing', title: __( 'Billing & plans', 'jetpack' ) },
	{
		slug: 'jetpack-ai-hub-overview-docs-mcp-tools',
		// The target lists agent capabilities, not an API reference (i4 thread).
		title: __( 'Available capabilities', 'jetpack' ),
	},
];

/**
 * The one sentence that states usage in words. Screen readers get this instead
 * of the loose value/limit pair, and it is also what gets announced when the
 * fetch lands.
 *
 * @param {object} usage - Normalized usage from normalizeUsage().
 * @return {string} The summary, or '' when there are no numbers to state.
 */
function usageSummary( usage ) {
	if ( usage.requestsAvailable === null || ! ( usage.requestsLimit > 0 ) ) {
		return '';
	}
	return sprintf(
		/* translators: %1$d: requests still available. %2$d: total requests in the plan. */
		__( '%1$d of %2$d requests available', 'jetpack' ),
		usage.requestsAvailable,
		usage.requestsLimit
	);
}

/**
 * Placeholder for the upsell layout: icon and pitch on the left, requests
 * readout and Upgrade button on the right. Reuses the loaded card's own grid
 * classes, and every bar reserves its whole line box, so the card is already
 * the height it will be once the text arrives.
 *
 * @return {object} Component markup.
 */
function UpsellSkeleton() {
	return (
		<div className="jetpack-ai-overview__upsell">
			<div className="jetpack-ai-overview__upsell-content">
				<div className="jetpack-ai-overview__upsell-icon">
					<Skeleton className="jetpack-ai-overview__skeleton-icon" />
				</div>
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--title" />
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--copy" />
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--copy jetpack-ai-overview__skeleton-line--copy-short" />
			</div>
			<div className="jetpack-ai-overview__usage-cell">
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--eyebrow" />
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--value" />
				<Skeleton className="jetpack-ai-overview__skeleton-meter" />
				<Skeleton className="jetpack-ai-overview__skeleton-cta" />
			</div>
		</div>
	);
}

/**
 * The "Available requests" readout shared by the standard card and the
 * upsell: eyebrow, one hidden translatable summary sentence, the
 * decorative value/limit pair, and the decorative meter.
 *
 * @param {object} props       - Component props.
 * @param {object} props.usage - Normalized usage from normalizeUsage().
 * @return {object} Component markup.
 */
function RequestsMeter( { usage } ) {
	const hasNumbers = usage.requestsAvailable !== null && usage.requestsLimit > 0;
	// One translatable sentence for screen readers; the visible value/limit
	// pair and the meter are its visual restatements.
	const srSummary = usageSummary( usage );
	// normalizeUsage floors availability at 0 and it can never exceed the
	// limit, so the ratio needs no clamping here.
	const meterValue = ( usage.requestsAvailable / usage.requestsLimit ) * 100;

	return (
		<>
			<Text render={ <p /> } variant="heading-sm" className="jetpack-ai-overview__eyebrow">
				{ __( 'Available requests', 'jetpack' ) }
			</Text>
			{ /* Its own paragraph, padded with spaces — clipped text glues
			     onto the neighboring heading in some screen readers. */ }
			{ srSummary && <VisuallyHidden as="p">{ ` ${ srSummary } ` }</VisuallyHidden> }
			<Stack
				direction="row"
				justify="space-between"
				align="baseline"
				// With a hidden summary sentence in place, the loose value
				// and limit nodes would only be read as fragments.
				aria-hidden={ srSummary ? 'true' : undefined }
			>
				<Text render={ <p /> } variant="heading-xl" className="jetpack-ai-overview__requests-value">
					{ hasNumbers ? usage.requestsAvailable : '—' }
				</Text>
				{ hasNumbers && (
					<Text render={ <p /> } variant="body-md" className="jetpack-ai-overview__muted">
						{ usage.requestsLimit }
					</Text>
				) }
			</Stack>
			{ hasNumbers && (
				// The bar only restates the visible numbers, so it is
				// decorative — screen readers get "8 of 20" from the text
				// (VoiceOver reads a named bar's label and percent again).
				<ProgressBar
					aria-hidden="true"
					className="jetpack-ai-overview__meter"
					value={ meterValue }
				/>
			) }
		</>
	);
}

/**
 * The requests card, free plans only — any paid plan has nothing to meter
 * and nothing to sell, so it renders no card at all. With an upgrade URL
 * the card renders as an upsell: icon and pitch on the left, the requests
 * readout with the Upgrade button on the right — with harder copy once
 * every request is used. Without one it falls back to the plain requests
 * readout over its meter (plan details are My Jetpack's job). Loading and
 * error states stay inside the card so the rest of the Overview renders
 * immediately.
 *
 * @param {object} props            - Component props.
 * @param {string} props.upgradeUrl - Upgrade destination (shared with the MCP upsell).
 * @param {string} [props.planName] - Purchase name granting AI ("WordPress.com Business");
 *                                  only steers the loading-shape guess below.
 * @return {object} Component markup.
 */
function UsageCard( { upgradeUrl, planName } ) {
	const { isLoading, data, error } = useAiUsage();
	const usage = normalizeUsage( data );
	const hasNumbers = usage.requestsAvailable !== null && usage.requestsLimit > 0;
	// The upsell copy is a pitch for the button, so it only shows when an
	// upgrade can actually be offered; otherwise the plain two-cell card
	// tells the story instead.
	const showUpsell = usage.showUpgrade && !! upgradeUrl;
	// Out of requests, the pitch hardens from "before you run out" to "you ran out".
	const isDepleted = hasNumbers && usage.requestsAvailable === 0;
	// Whether to hold the upsell shape while the fetch is in flight. The likely
	// outcome for a site that already names a paid plan is no card at all, so
	// only the expected-free case gets a placeholder — a skeleton that vanishes
	// would be a resize for nothing.
	const expectUpsell = !! upgradeUrl && ! planName;
	const srSummary = usageSummary( usage );

	// A live region that mounts with its text already inside it is not reliably
	// announced, and removing one announces nothing at all — so the region lives
	// in @wordpress/a11y, which keeps its own, and both ends of the fetch get
	// spoken. Errors are left alone: Notice announces those itself.
	useEffect( () => {
		if ( isLoading ) {
			// Only when a placeholder is on screen: announcing a load that
			// resolves to nothing rendered is noise.
			if ( expectUpsell ) {
				speak( __( 'Loading your AI usage…', 'jetpack' ), 'polite' );
			}
			return;
		}
		if ( error || ! srSummary ) {
			return;
		}
		speak( srSummary, 'polite' );
	}, [ isLoading, error, srSummary, expectUpsell ] );

	// Nothing to show while the fetch is in flight on an expected-paid site,
	// and nothing after it on any paid site.
	if ( isLoading && ! expectUpsell ) {
		return null;
	}
	if ( ! isLoading && ! error && ! usage.isFree ) {
		return null;
	}

	return (
		// The upsell breathes more than the standard card; the modifier widens
		// the ui Card's own padding token.
		<Card.Root
			className={
				// The upsell's wider padding belongs to whichever shape is on screen,
				// the placeholder included — otherwise the card resizes as the fetch
				// lands even when the layout does not change.
				( isLoading ? expectUpsell : showUpsell ) ? 'jetpack-ai-overview__card--upsell' : undefined
			}
		>
			<Card.Content>
				{ isLoading && <UpsellSkeleton /> }

				{ ! isLoading && error && (
					<Notice.Root intent="error">
						<Notice.Description>{ error }</Notice.Description>
					</Notice.Root>
				) }

				{ ! isLoading && ! error && showUpsell && (
					// Mirrors the standard card's two-cell grid (minus the divider):
					// icon and pitch on the left, the same requests readout with the
					// Upgrade button on the right.
					<div className="jetpack-ai-overview__upsell jetpack-ai-overview__fade-in">
						<div className="jetpack-ai-overview__upsell-content">
							{ /* The wrapper carries the layout class: AiIcon accepts no
						     className. currentColor tracks the heading, not JP green. */ }
							<div className="jetpack-ai-overview__upsell-icon">
								<AiIcon size={ 28 } color="currentColor" />
							</div>
							<Text render={ <h2 /> } variant="heading-lg">
								{ isDepleted
									? __( 'You’ve used all your requests', 'jetpack' )
									: __(
											'Upgrade Jetpack AI Assistant',
											'jetpack',
											/* dummy arg to avoid bad minification */ 0
									  ) }
							</Text>
							<Text render={ <p /> } variant="body-md" className="jetpack-ai-overview__muted">
								{ isDepleted
									? __(
											'Upgrade to keep drafting, rewriting, and illustrating without leaving the editor.',
											'jetpack'
									  )
									: __(
											'Draft, rewrite, and illustrate posts without leaving the editor. Upgrade before you run out.',
											'jetpack',
											/* dummy arg to avoid bad minification */ 0
									  ) }
							</Text>
						</div>
						{ /* The usage-cell primitive: eyebrow pinned top, readout
						     bottom-anchored, exactly as in the standard card. */ }
						<div className="jetpack-ai-overview__usage-cell">
							<RequestsMeter usage={ usage } />
							<LinkButton href={ upgradeUrl } className="jetpack-ai-overview__upsell-cta">
								{ __( 'Upgrade', 'jetpack' ) }
							</LinkButton>
						</div>
					</div>
				) }

				{ ! isLoading && ! error && ! showUpsell && (
					<div className="jetpack-ai-overview__usage jetpack-ai-overview__fade-in">
						<div className="jetpack-ai-overview__usage-cell">
							<RequestsMeter usage={ usage } />
						</div>
					</div>
				) }
			</Card.Content>
		</Card.Root>
	);
}

/**
 * Overview view.
 *
 * @param {object}  props                   - Component props.
 * @param {number}  [props.blogId]          - Current site's blog ID; falsy when not connected.
 * @param {string}  [props.activityLogUrl]  - URL for the site's activity log; row hidden without it.
 * @param {string}  [props.upgradeUrl]      - Upgrade destination for the usage card.
 * @param {string}  [props.planName]        - Purchase name granting AI, from the page data.
 * @param {boolean} [props.showActivityLog] - Whether the activity-log row applies: the row's
 *                                          copy promises AI-agent actions, which need MCP.
 * @param {boolean} [props.hostAllowsAi]    - The host's AI switch; when explicitly false, no
 *                                          usage is shown and no upgrade is ever offered.
 * @param {boolean} [props.isUserConnected] - Whether the current user's own WordPress.com
 *                                          account is linked; the usage fetch needs it.
 * @return {object} Component markup.
 */
export default function AiOverview( {
	blogId,
	activityLogUrl,
	upgradeUrl,
	planName,
	showActivityLog,
	hostAllowsAi,
	isUserConnected,
} ) {
	const hostBlocked = hostAllowsAi === false;
	const userUnlinked = isUserConnected === false;
	useRecordOnce( EVENTS.VIEWED, { tab: 'overview' } );
	const recordLinkClick = ( linkType, slug ) => () =>
		recordAiHubEvent( EVENTS.LINK_CLICK, { link_type: linkType, link: slug } );
	return (
		<Stack direction="column" gap="3xl">
			{ /* Connection notices first, then the banner, then the usage card:
			     the three share a tighter rhythm than the titled sections below.
			     On plans where nothing in here renders (banner dismissed, usage
			     card null after the fetch), the stylesheet's :empty rule drops
			     the wrapper so the outer 3xl gap doesn't double. */ }
			<Stack direction="column" gap="xl" className="jetpack-ai-overview__intro">
				{ !! blogId && hostBlocked && (
					<Notice.Root intent="warning">
						<Notice.Description>
							{ __( 'Jetpack AI is not available for this site.', 'jetpack' ) }{ ' ' }
							<ExternalLink href={ getRedirectUrl( 'jetpack-ai-hub-docs-wp-supports-ai' ) }>
								{ __( 'Learn more', 'jetpack' ) }
							</ExternalLink>
						</Notice.Description>
					</Notice.Root>
				) }
				{ !! blogId && ! hostBlocked && userUnlinked && (
					// The usage endpoint proxies as the current user, so without a
					// linked account the fetch can only fail — say so instead.
					<Notice.Root intent="warning">
						<Notice.Title>
							{ __( 'Your WordPress.com account isn’t connected.', 'jetpack' ) }
						</Notice.Title>
						<Notice.Description>
							<Link href="admin.php?page=my-jetpack#/connection">
								{ __( 'Connect your user account to see your AI usage.', 'jetpack' ) }
							</Link>
						</Notice.Description>
					</Notice.Root>
				) }
				{ ! blogId && (
					// Disconnected: skip the fetch (it can only fail) and explain
					// the actual problem instead of a fetch error.
					<Notice.Root intent="warning">
						<Notice.Title>
							{ __( 'Jetpack is not connected to WordPress.com.', 'jetpack' ) }
						</Notice.Title>
						<Notice.Description>
							{ __( 'Connect the site to see your AI usage.', 'jetpack' ) }{ ' ' }
							<Link href="admin.php?page=my-jetpack#/connection">
								{ __( 'Connect Jetpack', 'jetpack' ) }
							</Link>
						</Notice.Description>
					</Notice.Root>
				) }
				<AssistantBanner />
				{ !! blogId && ! hostBlocked && ! userUnlinked && (
					<UsageCard upgradeUrl={ upgradeUrl } planName={ planName } />
				) }
			</Stack>

			<Stack direction="column" gap="lg">
				<Text render={ <h2 /> } variant="heading-lg">
					{ __( 'Quick start', 'jetpack' ) }
				</Text>
				<div className="jetpack-ai-overview__quick-start-grid">
					{ QUICK_START.map( ( { slug, title, description, icon } ) => (
						<Card.Root key={ slug } className="jetpack-ai-overview__row-card">
							<NavRow
								icon={ icon }
								iconSize={ 28 }
								title={ title }
								description={ description }
								href={ getRedirectUrl( slug ) }
								onClick={ recordLinkClick( 'quick_start', slug ) }
								tone="neutral"
								external
							/>
						</Card.Root>
					) ) }
				</div>
			</Stack>

			<Stack direction="column" gap="lg">
				<Text render={ <h2 /> } variant="heading-lg">
					{ __( 'Walkthrough videos', 'jetpack' ) }
				</Text>
				<div className="jetpack-ai-overview__video-grid">
					{ WALKTHROUGH_VIDEOS.map( ( { slug, title, duration, thumbnail } ) => (
						<a
							className="jetpack-ai-overview__video"
							href={ getRedirectUrl( slug ) }
							key={ slug }
							target="_blank"
							rel="noopener noreferrer"
							onClick={ recordLinkClick( 'video', slug ) }
						>
							{ /* Decorative: the card's title carries the meaning. */ }
							<img
								className="jetpack-ai-overview__video-thumb"
								src={ thumbnail }
								alt=""
								width="644"
								height="348"
								loading="lazy"
							/>
							<span className="jetpack-ai-overview__video-meta">
								<Text render={ <span /> } variant="heading-md">
									{ title }
								</Text>
								<Text render={ <span /> } variant="body-md" className="jetpack-ai-overview__muted">
									{ duration }
								</Text>
							</span>
							{ /* The design leaves the cards unmarked, so announce the
							     new tab the way ExternalLink does, minus its arrow. */ }
							<VisuallyHidden>{ __( '(opens in a new tab)', 'jetpack' ) }</VisuallyHidden>
						</a>
					) ) }
				</div>
			</Stack>

			{ showActivityLog && activityLogUrl && (
				// The row pads itself, so it sits directly in the card —
				// Card.FullBleed's negative margins would cancel that padding.
				<Card.Root className="jetpack-ai-overview__row-card">
					<NavRow
						icon={ list }
						title={ __( 'Activity log', 'jetpack' ) }
						description={ __(
							'Review recent actions taken by AI agents on your site.',
							'jetpack'
						) }
						href={ activityLogUrl }
						tone="neutral"
					/>
				</Card.Root>
			) }

			<Stack direction="column" gap="lg">
				<Text render={ <h2 /> } variant="heading-lg">
					{ __( 'Documentation', 'jetpack' ) }
				</Text>
				<Stack direction="column" gap="sm" align="flex-start">
					{ DOC_LINKS.map( ( { slug, title } ) => (
						<ExternalLink key={ slug } href={ getRedirectUrl( slug ) }>
							{ title }
						</ExternalLink>
					) ) }
				</Stack>
			</Stack>
		</Stack>
	);
}
