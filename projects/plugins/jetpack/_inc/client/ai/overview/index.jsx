/**
 * Overview view — the opening column with the connect actions and two skills
 * (with the Skills tab on, in place of the assistant banner and the connect
 * card), usage meter, activity log, and documentation links. Shown as the landing tab
 * while the internal-testing gate is on. The usage card follows the i4
 * Overview frame (Free plan / Paid plan cards).
 */

import { AiIcon, getRedirectUrl } from '@automattic/jetpack-components';
import { speak } from '@wordpress/a11y';
import { ProgressBar } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { connection, list, payment, starEmpty, tool } from '@wordpress/icons';
import { Card, ButtonLink, Notice, Skeleton, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { getActivityLogDescription, onActivityLogClick } from '../activity-log';
import NavRow from '../components/nav-row';
import McpConnectAgents from '../mcp/connect-agents';
import { EVENTS, recordAiHubEvent } from '../tracks';
import AssistantBanner from './assistant-banner';
import SkillsHero from './skills-hero';
import { normalizeUsage, useAiUsage } from './use-ai-usage';

import './style.scss';

// Redirect-service sources for the documentation rows. All four are
// registered and resolving.
const DOC_LINKS = [
	{
		slug: 'jetpack-ai-hub-overview-docs-mcp-guide',
		title: __( 'MCP integration guide', 'jetpack' ),
		description: __( 'Connect an AI agent to your site.', 'jetpack' ),
		icon: connection,
	},
	{
		slug: 'jetpack-ai-hub-overview-docs-features',
		title: __( 'AI features overview', 'jetpack' ),
		description: __( 'Everything Jetpack AI can do on your site.', 'jetpack' ),
		icon: starEmpty,
	},
	{
		slug: 'jetpack-ai-hub-overview-docs-billing',
		title: __( 'Billing & plans', 'jetpack' ),
		description: __( 'How requests, plans, and upgrades work.', 'jetpack' ),
		icon: payment,
	},
	{
		slug: 'jetpack-ai-hub-overview-docs-mcp-tools',
		// The target lists agent capabilities, not an API reference (i4 thread).
		title: __( 'Available capabilities', 'jetpack' ),
		description: __( 'What a connected agent can read and change.', 'jetpack' ),
		icon: tool,
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
			{ srSummary && <VisuallyHidden render={ <p /> }>{ ` ${ srSummary } ` }</VisuallyHidden> }
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
 * readout over its meter (plan details are My Jetpack's job). Loading stays
 * inside the card and errors replace it, so the rest of the Overview renders
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
	// A notice already draws its own box, so it stands alone rather than
	// nesting in the card's border.
	if ( ! isLoading && error ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ error }</Notice.Description>
			</Notice.Root>
		);
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

				{ ! isLoading && showUpsell && (
					// Mirrors the standard card's two-cell grid (minus the divider):
					// icon and pitch on the left, the same requests readout with the
					// Upgrade button on the right.
					<div className="jetpack-ai-overview__upsell jetpack-ai-overview__fade-in">
						<div className="jetpack-ai-overview__upsell-content">
							{ /* The wrapper is the tile, as AiIcon accepts no className;
							     currentColor takes the tile's light green. */ }
							<div className="jetpack-ai-overview__upsell-icon">
								<AiIcon size={ 20 } color="currentColor" />
							</div>
							<Text render={ <h2 /> } variant="heading-lg">
								{ isDepleted
									? __( 'You’ve used all your requests', 'jetpack' )
									: __( 'Upgrade Jetpack AI', 'jetpack' ) }
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
							<ButtonLink href={ upgradeUrl } className="jetpack-ai-overview__upsell-cta">
								{ __( 'Upgrade', 'jetpack' ) }
							</ButtonLink>
						</div>
					</div>
				) }

				{ ! isLoading && ! showUpsell && (
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
 * @param {object}   props                       - Component props.
 * @param {string}   [props.activityLogUrl]      - URL for the site's activity log; row hidden without it.
 * @param {boolean}  [props.activityLogFiltered] - Whether the activity-log link opens filtered to AI agent actions.
 * @param {string}   [props.upgradeUrl]          - Upgrade destination for the usage card.
 * @param {string}   [props.planName]            - Purchase name granting AI, from the page data.
 * @param {boolean}  [props.showActivityLog]     - Whether the activity-log row applies; it needs MCP.
 * @param {boolean}  [props.canLoadUsage]        - Whether the usage endpoint can answer for this
 *                                               site; when it cannot, usage is neither shown nor asked for.
 * @param {boolean}  [props.isMcpEnabled]        - Whether agents can reach the site yet; the
 *                                               connect card points at Settings while they cannot.
 * @param {boolean}  [props.showOtherAgents]     - Whether the connect card links the setup steps.
 * @param {Function} [props.onMcpNavigate]       - Opens a Settings sub-view ('setup').
 * @return {object} Component markup.
 */
export default function AiOverview( {
	activityLogUrl,
	activityLogFiltered = false,
	upgradeUrl,
	planName,
	showActivityLog,
	canLoadUsage = true,
	isMcpEnabled = true,
	showOtherAgents = false,
	onMcpNavigate,
} ) {
	const recordLinkClick = ( linkType, slug ) => () =>
		recordAiHubEvent( EVENTS.LINK_CLICK, { link_type: linkType, link: slug } );
	// Every link in the hero lands on the Skills tab, so it shows only with it.
	const showSkills = !! window?.jetpackAiSettings?.featureFlags?.[ 'ai-hub-discover' ];
	const usageCard = canLoadUsage && <UsageCard upgradeUrl={ upgradeUrl } planName={ planName } />;
	// Without the Skills tab, the connect actions keep their card.
	const connectCard = (
		<McpConnectAgents
			isMcpEnabled={ isMcpEnabled }
			onNavigate={ onMcpNavigate }
			showOtherAgents={ showOtherAgents }
			onOverview
		/>
	);
	return (
		<Stack direction="column" gap="3xl">
			{ showSkills ? (
				// The opening says what the hub is for and how to connect, with
				// skills to start on.
				// On a free plan the upgrade card comes before the skills, while
				// the requests it meters are still the thing to act on.
				<SkillsHero
					isMcpEnabled={ isMcpEnabled }
					showOtherAgents={ showOtherAgents }
					onMcpNavigate={ onMcpNavigate }
					beforeSkills={ usageCard }
				/>
			) : (
				<>
					{ /* The banner and the usage card share a tighter rhythm than the
					     sections below. When neither renders, the stylesheet's :empty
					     rule drops the wrapper so the outer 3xl gap doesn't double. */ }
					<Stack direction="column" gap="xl" className="jetpack-ai-overview__intro">
						<AssistantBanner />
						{ /* Nothing to say about usage while the notice is saying why AI
						     is unavailable — and no request that could only fail. */ }
						{ usageCard }
					</Stack>
					{ connectCard }
				</>
			) }

			{ showActivityLog && activityLogUrl && (
				// The row pads itself, so it sits directly in the card —
				// Card.FullBleed's negative margins would cancel that padding.
				<Card.Root className="jetpack-ai-overview__row-card">
					<NavRow
						icon={ list }
						title={ __( 'Activity log', 'jetpack' ) }
						description={ getActivityLogDescription( activityLogFiltered ) }
						href={ activityLogUrl }
						onClick={ onActivityLogClick( activityLogFiltered ) }
						tone="neutral"
					/>
				</Card.Root>
			) }

			<Stack direction="column" gap="md">
				{ /* The same small label as "Start with a skill" above. */ }
				<Text render={ <h2 /> } variant="heading-sm" className="jetpack-ai-overview__section-label">
					{ __( 'Documentation', 'jetpack' ) }
				</Text>
				{ /* One card, a row per guide, split by the weak stroke as the
				     Discover list is. The rows pad themselves, as above. */ }
				<Card.Root className="jetpack-ai-overview__row-card jetpack-ai-overview__docs">
					{ DOC_LINKS.map( ( { slug, title, description, icon } ) => (
						<NavRow
							key={ slug }
							icon={ icon }
							title={ title }
							description={ description }
							href={ getRedirectUrl( slug ) }
							onClick={ recordLinkClick( 'docs', slug ) }
							tone="neutral"
							external
						/>
					) ) }
				</Card.Root>
			</Stack>
		</Stack>
	);
}
