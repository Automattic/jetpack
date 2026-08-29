/**
 * Overview view — usage meter, activity log, and documentation links.
 * Shown as the landing tab while the internal-testing gate is on.
 * Layout follows the i4 Overview frame (Free plan / Paid plan cards).
 */

import { AiIcon, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink, ProgressBar, Spinner, VisuallyHidden } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { list } from '@wordpress/icons';
import { Card, Link, LinkButton, Notice, Stack, Text } from '@wordpress/ui';
import NavRow from '../components/nav-row';
import AssistantBanner from './assistant-banner';
import buildPageThumb from './images/build-page.webp';
import connectClaudeThumb from './images/connect-claude.webp';
import mediaLibraryThumb from './images/media-library.webp';
import optimizeSiteThumb from './images/optimize-site.webp';
import { normalizeUsage, useAiUsage } from './use-ai-usage';

import './style.scss';

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
 * The "Available requests" readout shared by the standard card and the
 * depleted upsell: eyebrow, one hidden translatable summary sentence, the
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
	const srSummary = usage.unlimited
		? __( 'Unlimited requests', 'jetpack' )
		: hasNumbers &&
		  sprintf(
				/* translators: %1$d: requests still available. %2$d: total requests in the plan. */
				__( '%1$d of %2$d requests available', 'jetpack' ),
				usage.requestsAvailable,
				usage.requestsLimit
		  );
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
 * The requests/plan card per the i4 components: requests over a meter on the
 * left, plan + upgrade-or-renewal on the right. Once every request is used
 * (and an upgrade can actually be offered), the whole card swaps to an upsell
 * notice instead. Loading and error states stay inside the card so the rest
 * of the Overview renders immediately.
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
	// Out of requests, the whole card becomes the upsell notice — but only
	// when an upgrade can actually be offered: its copy is a pitch for the
	// button, so without one the plain card's zero tells the story instead.
	const showDepletedUpsell =
		! usage.unlimited &&
		hasNumbers &&
		usage.requestsAvailable === 0 &&
		usage.showUpgrade &&
		!! upgradeUrl;

	return (
		<Card.Root>
			<Card.Content>
				{ isLoading && (
					<div className="jetpack-ai-overview__loading">
						<Spinner />
					</div>
				) }

				{ ! isLoading && error && (
					<Notice.Root intent="error">
						<Notice.Description>{ error }</Notice.Description>
					</Notice.Root>
				) }

				{ ! isLoading && ! error && showDepletedUpsell && (
					// Mirrors the standard card's two-cell grid (minus the divider):
					// icon and pitch on the left, the same requests readout with the
					// Upgrade button on the right.
					<div className="jetpack-ai-overview__depleted">
						<div className="jetpack-ai-overview__depleted-content">
							{ /* The wrapper carries the layout class: AiIcon accepts no
						     className. currentColor tracks the heading, not JP green. */ }
							<div className="jetpack-ai-overview__depleted-icon">
								<AiIcon size={ 28 } color="currentColor" />
							</div>
							<Text render={ <h2 /> } variant="heading-lg">
								{ __( 'You’ve used all your requests', 'jetpack' ) }
							</Text>
							<Text render={ <p /> } variant="body-md" className="jetpack-ai-overview__muted">
								{ __(
									'Upgrade to keep drafting, rewriting, and illustrating without leaving the editor.',
									'jetpack'
								) }
							</Text>
						</div>
						{ /* The usage-cell primitive: eyebrow pinned top, readout
						     bottom-anchored, exactly as in the standard card. */ }
						<div className="jetpack-ai-overview__usage-cell">
							<RequestsMeter usage={ usage } />
							<LinkButton href={ upgradeUrl } className="jetpack-ai-overview__depleted-cta">
								{ __( 'Upgrade', 'jetpack' ) }
							</LinkButton>
						</div>
					</div>
				) }

				{ ! isLoading && ! error && ! showDepletedUpsell && (
					<div className="jetpack-ai-overview__usage">
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
								{ usage.showUpgrade && upgradeUrl && (
									<LinkButton href={ upgradeUrl } size="compact">
										{ __( 'Upgrade', 'jetpack' ) }
									</LinkButton>
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
	return (
		<Stack direction="column" gap="xl">
			<AssistantBanner />
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
				<Card.Root>
					<Card.Content>
						<Notice.Root intent="warning">
							<Notice.Title>
								{ __( 'Your WordPress.com account isn’t connected.', 'jetpack' ) }
							</Notice.Title>
							<Notice.Description>
								{ __( 'Connect your account to see your AI usage.', 'jetpack' ) }{ ' ' }
								<Link href="admin.php?page=my-jetpack#/connection">
									{ __( 'Connect account', 'jetpack' ) }
								</Link>
							</Notice.Description>
						</Notice.Root>
					</Card.Content>
				</Card.Root>
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
				<Card.Root>
					<Card.Content>
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
					</Card.Content>
				</Card.Root>
			) }

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

			<div className="jetpack-ai-overview__videos">
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
			</div>

			<div className="jetpack-ai-overview__docs">
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
			</div>
		</Stack>
	);
}
