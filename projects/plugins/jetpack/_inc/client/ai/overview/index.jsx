/**
 * Overview view — usage meter, activity log, and documentation links.
 * Shown as the landing tab while the internal-testing gate is on.
 * Layout follows the i4 Overview frame (Free plan / Paid plan cards).
 */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ExternalLink, ProgressBar, Spinner } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { sprintf, __ } from '@wordpress/i18n';
import { list } from '@wordpress/icons';
import { Card, Notice, Stack, Text } from '@wordpress/ui';
import NavRow from '../components/nav-row';
import { normalizeUsage, useAiUsage } from './use-ai-usage';

import './style.scss';

// Walkthrough videos. Titles and durations come from the i4 frame; the cards
// open articles on WordPress.com rather than playing inline, so each is a
// link. NOTE: like the documentation slugs below, these are chosen here and
// not yet registered in the redirect service. Thumbnail artwork is still
// pending, so the cards render a neutral placeholder panel for now.
const WALKTHROUGH_VIDEOS = [
	{
		slug: 'jetpack-ai-settings-overview-video-connect-claude',
		title: __( 'Connect your site to Claude', 'jetpack' ),
		duration: '3:30',
	},
	{
		slug: 'jetpack-ai-settings-overview-video-build-page',
		title: __( 'Build a page from a single prompt', 'jetpack' ),
		duration: '2:36',
	},
	{
		slug: 'jetpack-ai-settings-overview-video-media-library',
		title: __( 'Manage your Media Library with AI', 'jetpack' ),
		duration: '3:27',
	},
	{
		slug: 'jetpack-ai-settings-overview-video-optimize-site',
		title: __( 'Optimize your site with AI', 'jetpack' ),
		duration: '3:39',
	},
];

// Redirect-service sources for the documentation links. NOTE: these slugs
// are chosen for this page but not yet registered in the redirect service —
// register them before the gate comes off.
const DOC_LINKS = [
	{
		slug: 'jetpack-ai-settings-overview-docs-mcp-guide',
		title: __( 'MCP integration guide', 'jetpack' ),
	},
	{
		slug: 'jetpack-ai-settings-overview-docs-features',
		title: __( 'AI features overview', 'jetpack' ),
	},
	{
		slug: 'jetpack-ai-settings-overview-docs-agent-setup',
		title: __( 'Setting up agentic workflows', 'jetpack' ),
	},
	{ slug: 'jetpack-ai-settings-overview-docs-billing', title: __( 'Billing & plans', 'jetpack' ) },
	{ slug: 'jetpack-ai-settings-overview-docs-mcp-tools', title: __( 'API reference', 'jetpack' ) },
];

/**
 * The requests/plan card, per the i4 Free plan / Paid plan components:
 * available requests over a meter on the left, plan + upgrade-or-renewal on
 * the right. Its remote fetch has card-scoped loading and error states so
 * the rest of the Overview renders immediately.
 *
 * @param {object} props            - Component props.
 * @param {string} props.upgradeUrl - Upgrade destination (shared with the MCP upsell).
 * @return {object} Component markup.
 */
function UsageCard( { upgradeUrl } ) {
	const { isLoading, data, error } = useAiUsage();
	const usage = normalizeUsage( data );
	const hasNumbers = usage.requestsAvailable !== null && usage.requestsLimit > 0;
	const meterValue = usage.unlimited
		? 100
		: hasNumbers && Math.min( ( usage.requestsAvailable / usage.requestsLimit ) * 100, 100 );

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

				{ ! isLoading && ! error && (
					<div className="jetpack-ai-overview__usage">
						<div className="jetpack-ai-overview__usage-cell">
							<Text as="p" variant="body-sm" className="jetpack-ai-overview__eyebrow">
								{ __( 'Available requests', 'jetpack' ) }
							</Text>
							<Stack direction="row" justify="space-between" align="baseline">
								{ usage.unlimited ? (
									<Text
										as="p"
										variant="body-md"
										className="jetpack-ai-overview__muted jetpack-ai-overview__unlimited"
									>
										{ __( 'Unlimited', 'jetpack' ) }
									</Text>
								) : (
									<>
										<Text as="p" variant="heading-2xl">
											{ hasNumbers ? usage.requestsAvailable : '—' }
										</Text>
										{ hasNumbers && (
											<Text as="p" variant="body-md" className="jetpack-ai-overview__muted">
												{ usage.requestsLimit }
											</Text>
										) }
									</>
								) }
							</Stack>
							{ ( usage.unlimited || hasNumbers ) && (
								<ProgressBar
									aria-label={ __( 'Available requests', 'jetpack' ) }
									className="jetpack-ai-overview__meter"
									value={ meterValue }
								/>
							) }
						</div>

						<div className="jetpack-ai-overview__usage-cell jetpack-ai-overview__usage-cell--plan">
							<Text as="p" variant="body-sm" className="jetpack-ai-overview__eyebrow">
								{ __( 'Plan', 'jetpack' ) }
							</Text>
							<Stack direction="row" justify="space-between" align="center" gap="md">
								{ usage.planLabel && (
									<Text as="p" variant="heading-2xl">
										{ usage.planLabel }
									</Text>
								) }
								{ usage.showUpgrade && upgradeUrl && (
									<Button variant="primary" href={ upgradeUrl }>
										{ __( 'Upgrade', 'jetpack' ) }
									</Button>
								) }
								{ ! usage.showUpgrade && usage.renewsOn && (
									<Text as="p" variant="body-md" className="jetpack-ai-overview__muted">
										{ sprintf(
											/* translators: %s: localized date the plan renews on. */
											__( 'Renews on: %s', 'jetpack' ),
											dateI18n( getDateSettings().formats.date, usage.renewsOn )
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
 * @param {object} props                  - Component props.
 * @param {string} [props.activityLogUrl] - URL for the site's activity log; row hidden without it.
 * @param {string} [props.upgradeUrl]     - Upgrade destination for the usage card.
 * @return {object} Component markup.
 */
export default function AiOverview( { activityLogUrl, upgradeUrl } ) {
	return (
		<Stack direction="column" gap="md">
			<UsageCard upgradeUrl={ upgradeUrl } />

			{ activityLogUrl && (
				// The row carries its own padding, so it sits directly in the
				// card: Card.FullBleed would cancel that padding out with its
				// negative margins (it is for edge-to-edge media).
				<Card.Root className="jetpack-ai-overview__row-card">
					<NavRow
						icon={ list }
						title={ __( 'Activity log', 'jetpack' ) }
						description={ __(
							'Review recent actions taken by AI agents on your site.',
							'jetpack'
						) }
						href={ activityLogUrl }
					/>
				</Card.Root>
			) }

			<div className="jetpack-ai-overview__videos">
				<Text as="h3" variant="heading-md">
					{ __( 'Walkthrough videos', 'jetpack' ) }
				</Text>
				<div className="jetpack-ai-overview__video-grid">
					{ WALKTHROUGH_VIDEOS.map( ( { slug, title, duration } ) => (
						<a className="jetpack-ai-overview__video" href={ getRedirectUrl( slug ) } key={ slug }>
							<span className="jetpack-ai-overview__video-thumb" />
							<span className="jetpack-ai-overview__video-meta">
								<Text as="span" variant="body-md">
									{ title }
								</Text>
								<Text as="span" variant="body-md" className="jetpack-ai-overview__muted">
									{ duration }
								</Text>
							</span>
						</a>
					) ) }
				</div>
			</div>

			<div className="jetpack-ai-overview__docs">
				<Text as="h3" variant="heading-md">
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
