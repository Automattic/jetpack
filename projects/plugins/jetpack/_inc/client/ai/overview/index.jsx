/**
 * Overview view — usage meter, activity log, and documentation links.
 * Shown as the landing tab while the internal-testing gate is on.
 * Layout follows the i4 Overview frame (Free plan / Paid plan cards).
 */

import { AiIcon, getRedirectUrl } from '@automattic/jetpack-components';
import { speak } from '@wordpress/a11y';
import { ExternalLink, ProgressBar, VisuallyHidden } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { createInterpolateElement, useEffect } from '@wordpress/element';
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

// Redirect-service sources for the documentation links. All five are
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
	{
		slug: 'jetpack-ai-hub-overview-docs-agent-setup',
		title: __( 'Setting up agentic workflows', 'jetpack' ),
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
 * fetch lands. Separate returns rather than a ternary: terser merges
 * `cond ? __( 'a' ) : __( 'b' )` into one call with a non-literal msgid, which
 * fails the i18n check at build time.
 *
 * @param {object} usage - Normalized usage from normalizeUsage().
 * @return {string} The summary, or '' when there are no numbers to state.
 */
function usageSummary( usage ) {
	if ( usage.unlimited ) {
		return __( 'Unlimited requests', 'jetpack' );
	}
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
 * Placeholder for the standard two-cell layout: requests over the meter on the
 * left, plan on the right. Used whenever no upgrade can be offered, so those
 * sites do not watch a tall upsell-shaped card collapse into a short one.
 *
 * @return {object} Component markup.
 */
function UsageSkeleton() {
	return (
		<div className="jetpack-ai-overview__usage">
			<div className="jetpack-ai-overview__usage-cell">
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--eyebrow" />
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--value" />
				<Skeleton className="jetpack-ai-overview__skeleton-meter" />
			</div>
			<div className="jetpack-ai-overview__usage-cell jetpack-ai-overview__usage-cell--plan">
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--eyebrow" />
				<Skeleton className="jetpack-ai-overview__skeleton-line jetpack-ai-overview__skeleton-line--value" />
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
	const showMeter = usage.unlimited || hasNumbers;
	const meterValue = usage.unlimited
		? 100
		: ( usage.requestsAvailable / usage.requestsLimit ) * 100;

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
				{ usage.unlimited ? (
					<Text
						render={ <p /> }
						variant="body-md"
						className="jetpack-ai-overview__muted jetpack-ai-overview__unlimited"
					>
						{ __( 'Unlimited', 'jetpack' ) }
					</Text>
				) : (
					<>
						<Text
							render={ <p /> }
							variant="heading-xl"
							className="jetpack-ai-overview__requests-value"
						>
							{ hasNumbers ? usage.requestsAvailable : '—' }
						</Text>
						{ hasNumbers && (
							<Text render={ <p /> } variant="body-md" className="jetpack-ai-overview__muted">
								{ usage.requestsLimit }
							</Text>
						) }
					</>
				) }
			</Stack>
			{ showMeter && (
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
 * The requests/plan card. Whenever an upgrade can actually be offered the
 * card renders as an upsell: icon and pitch on the left, the requests readout
 * with the Upgrade button on the right — with harder copy once every request
 * is used. Without an upgrade to offer it falls back to the i4 two-cell
 * layout: requests over a meter on the left, plan + renewal on the right.
 * Loading and error states stay inside the card so the rest of the Overview
 * renders immediately.
 *
 * @param {object}  props                 - Component props.
 * @param {string}  props.upgradeUrl      - Upgrade destination (shared with the MCP upsell).
 * @param {string}  [props.planName]      - Purchase name granting AI ("WordPress.com Business");
 *                                        preferred over the derived label when present.
 * @param {string}  [props.planRenewsOn]  - The purchase's own renewal date; preferred over
 *                                        the usage-period rollover, which is monthly.
 * @param {boolean} [props.planAutoRenew] - Whether the purchase auto-renews; decides
 *                                        whether the date reads Renews on or Expires on.
 * @return {object} Component markup.
 */
function UsageCard( { upgradeUrl, planName, planRenewsOn, planAutoRenew } ) {
	const { isLoading, data, error } = useAiUsage();
	const usage = normalizeUsage( data );
	// Only the purchase's own renewal belongs under "Renews on"; the usage
	// period's rollover is a different date. Rendered in the site's timezone to
	// match My Jetpack and the other purchase surfaces (review call).
	const renewsOnDisplay = planRenewsOn && dateI18n( getDateSettings().formats.date, planRenewsOn );
	// The purchase name only labels a paid state — the usage endpoint is
	// authoritative for the tier, so an expired purchase cannot relabel Free.
	const planLabel = ( ! usage.isFree && planName ) || usage.planLabel;
	const hasNumbers = usage.requestsAvailable !== null && usage.requestsLimit > 0;
	// The upsell copy is a pitch for the button, so it only shows when an
	// upgrade can actually be offered; otherwise the plain two-cell card
	// tells the story instead.
	const showUpsell = usage.showUpgrade && !! upgradeUrl;
	// Out of requests, the pitch hardens from "before you run out" to "you ran out".
	const isDepleted = ! usage.unlimited && hasNumbers && usage.requestsAvailable === 0;
	// Which shape to hold while the fetch is in flight. showUpsell needs the
	// response, so this is the best guess available before it: an upsell needs
	// somewhere to upgrade to, and a site that already names a paid plan is
	// usually not being sold one. Guessing wrong costs a resize, which is why
	// the fallback is the standard card rather than the taller upsell.
	const expectUpsell = !! upgradeUrl && ! planName;
	const srSummary = usageSummary( usage );

	// A live region that mounts with its text already inside it is not reliably
	// announced, and removing one announces nothing at all — so the region lives
	// in @wordpress/a11y, which keeps its own, and both ends of the fetch get
	// spoken. Errors are left alone: Notice announces those itself.
	useEffect( () => {
		if ( isLoading ) {
			speak( __( 'Loading your AI usage…', 'jetpack' ), 'polite' );
			return;
		}
		if ( error || ! srSummary ) {
			return;
		}
		speak( srSummary, 'polite' );
	}, [ isLoading, error, srSummary ] );

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
				{ isLoading && ( expectUpsell ? <UpsellSkeleton /> : <UsageSkeleton /> ) }

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

						<div className="jetpack-ai-overview__usage-cell jetpack-ai-overview__usage-cell--plan">
							<Text render={ <p /> } variant="heading-sm" className="jetpack-ai-overview__eyebrow">
								{ __( 'Plan', 'jetpack' ) }
							</Text>
							<Stack direction="row" justify="space-between" align="flex-end" gap="lg">
								{ planLabel && (
									<Text
										render={ <p /> }
										// Long names wrap to two lines, where XL reads too
										// heavy; the cutoff approximates the half-card column.
										variant={ ( planLabel?.length ?? 0 ) > 16 ? 'heading-lg' : 'heading-xl' }
										className="jetpack-ai-overview__plan-name"
									>
										{ planLabel }
									</Text>
								) }
								{ ! usage.showUpgrade && renewsOnDisplay && (
									<Text
										render={ <p /> }
										variant="body-sm"
										className="jetpack-ai-overview__muted jetpack-ai-overview__renewal"
									>
										{ createInterpolateElement(
											planAutoRenew !== false
												? sprintf(
														/* translators: %s: localized date the plan renews on. */
														__( 'Renews on: <date>%s</date>', 'jetpack' ),
														renewsOnDisplay
												  )
												: sprintf(
														/* translators: %s: localized date the plan expires on. */
														__( 'Expires on: <date>%s</date>', 'jetpack' ),
														renewsOnDisplay
												  ),
											{ date: <span className="jetpack-ai-overview__renewal-date" /> }
										) }
									</Text>
								) }
							</Stack>
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
 * @param {string}  [props.planRenewsOn]    - The purchase's renewal date, from the page data.
 * @param {boolean} [props.planAutoRenew]   - Whether that purchase auto-renews, from the page data.
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
	planRenewsOn,
	planAutoRenew,
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
			<AssistantBanner />
			{ /* The banner, connection notices, and usage card share a tighter
			     rhythm than the titled sections below. */ }
			<Stack direction="column" gap="xl">
				{ !! blogId && hostBlocked && (
					<Notice.Root intent="warning">
						<Notice.Description>
							{ __( 'AI has been turned off for this site.', 'jetpack' ) }
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
				{ !! blogId && ! hostBlocked && ! userUnlinked && (
					<UsageCard
						upgradeUrl={ upgradeUrl }
						planName={ planName }
						planRenewsOn={ planRenewsOn }
						planAutoRenew={ planAutoRenew }
					/>
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
