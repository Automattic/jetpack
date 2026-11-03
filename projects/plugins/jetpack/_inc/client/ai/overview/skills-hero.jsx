/**
 * The Overview's opening: what the hub is for, how to connect an agent, then
 * two skills to start it on, on the Skills tab's own cards, whose View skill
 * opens that tab's side panel. Shown only while the Skills tab is on, since
 * the cards' links land there.
 *
 * Laid out as a centred column (icon tile, heading, connect actions) over a
 * label and a row of two cards.
 */

import { createInterpolateElement, useCallback, useId, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';
import { Link, Text } from '@wordpress/ui';
import SkillCard from '../discover/skill-card';
import { IN_APP_HISTORY_KEY, getViewHref, openSkillPanel } from '../discover/skill-panel-state';
import { getCatalog } from '../discover/skills';
import useSendSkill from '../discover/use-send-skill';
import { useIsWordPressAgentAvailable } from '../discover/wordpress-agent';
import { ConnectAgentsActions } from '../mcp/connect-agents';
import { EVENTS, recordAiHubEvent } from '../tracks';

// Discover's card styles, which the suggestions reuse.
import '../discover/style.scss';

// The skills the row suggests, in order. Any this site can't run is
// skipped, and the catalog fills the gap.
export const SUGGESTED_SKILL_SLUGS = [
	'performance-audit',
	'monthly-site-report',
	'write-meta-descriptions',
];

const SUGGESTION_COUNT = 2;

// The Jetpack AI sparkle: the outlined four-point star in Jetpack green that
// marks Jetpack AI on jetpack.com (the jetpack-2026 theme's
// is-style-jetpack-with-ai-icon eyebrow).
const jetpackAiSparkle = (
	<SVG
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
	</SVG>
);

/**
 * The skills the row shows: the suggestions this site can run, topped up from
 * the catalog.
 *
 * @param {object[]} catalog - This site's skills, in catalog order.
 * @return {object[]} Up to two skills.
 */
export function pickSuggestedSkills( catalog ) {
	const suggested = SUGGESTED_SKILL_SLUGS.map( slug =>
		catalog.find( skill => skill.slug === slug )
	).filter( Boolean );
	const fill = catalog.filter( skill => ! suggested.includes( skill ) );
	return [ ...suggested, ...fill ].slice( 0, SUGGESTION_COUNT );
}

/**
 * Skills hero.
 *
 * @param {object}   props                   - Component props.
 * @param {boolean}  [props.isMcpEnabled]    - Whether agents can reach the site yet.
 * @param {boolean}  [props.showOtherAgents] - Whether to link the setup steps.
 * @param {Function} [props.onMcpNavigate]   - Opens a Settings sub-view ('setup').
 * @param {*}        [props.beforeSkills]    - Shown between the opening and the skills.
 * @return {object|null} Component markup, or null when this site has no skills to suggest.
 */
export default function SkillsHero( {
	isMcpEnabled = true,
	showOtherAgents = false,
	onMcpNavigate,
	beforeSkills,
} = {} ) {
	const isSelfHosted = window?.jetpackAiSettings?.isSelfHosted === true;
	const catalog = useMemo( () => getCatalog( isSelfHosted ), [ isSelfHosted ] );
	const suggestions = useMemo( () => pickSuggestedSkills( catalog ), [ catalog ] );
	const showWordPressAgent = useIsWordPressAgentAvailable();
	const { send } = useSendSkill( { location: 'overview_hero' } );
	const headingId = useId();
	const pickHeadingId = useId();

	// Told apart from Discover's sends in Tracks.
	const handleCardSend = useCallback(
		( skill, agent ) => send( skill, agent, 'overview_card' ),
		[ send ]
	);
	// One push writes the hash and the skill param together, so boot's router
	// sees a single navigation. Setting the hash first and then adding the
	// param was two, and the second cancelled the first's view transition with
	// an uncaught error. A push fires no hashchange, so the hub is told by
	// hand; as a navigation it switches to Discover and leaves the param alone.
	// Back returns to Overview in one step. As any source but 'link',
	// 'overview' hands focus to the panel's title, which keyboard users need
	// here: the card unmounts with the Overview. Tracks tells it from
	// Discover's. The card keeps modified clicks for the browser.
	const handleView = useCallback( skill => {
		recordAiHubEvent( EVENTS.LINK_CLICK, { link_type: 'overview_skill', link: skill.slug } );
		const oldURL = window.location.href;
		openSkillPanel( skill.slug, { source: 'overview' } );
		window.dispatchEvent(
			new window.HashChangeEvent( 'hashchange', { oldURL, newURL: window.location.href } )
		);
	}, [] );
	// Handled in place as the cards are: one push to Discover with no panel,
	// and the hub told by hand, since a push fires no hashchange. Following the
	// href instead would reload the page whenever it drops a leftover param.
	const handleBrowse = useCallback( event => {
		recordAiHubEvent( EVENTS.LINK_CLICK, { link_type: 'overview_skill', link: 'browse_all' } );
		if ( event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 ) {
			return;
		}
		event.preventDefault();
		const oldURL = window.location.href;
		window.history.pushState( { [ IN_APP_HISTORY_KEY ]: true }, '', getViewHref( 'discover' ) );
		window.dispatchEvent(
			new window.HashChangeEvent( 'hashchange', { oldURL, newURL: window.location.href } )
		);
	}, [] );

	// A hero with nothing to offer is no hero.
	if ( ! suggestions.length ) {
		return null;
	}

	return (
		<section className="jetpack-ai-overview__skills" aria-labelledby={ headingId }>
			<div className="jetpack-ai-overview__hero">
				<span className="jetpack-ai-overview__hero-icon" aria-hidden="true">
					{ jetpackAiSparkle }
				</span>
				<Text render={ <h2 /> } id={ headingId } variant="heading-xl">
					{ __( 'Run your site from your AI agent', 'jetpack' ) }
				</Text>
				<ConnectAgentsActions
					isMcpEnabled={ isMcpEnabled }
					onNavigate={ onMcpNavigate }
					showOtherAgents={ showOtherAgents }
					onOverview
					centered
					// Concrete asks sell the idea faster than "skills" does.
					description={ __(
						'Connect Claude, ChatGPT, or another agent once. Then ask it to write a post, fix your SEO, or speed up your site.',
						'jetpack'
					) }
				/>
				{ /* An agent that can edit the site is the worry; the read and
				     write controls on Settings are the answer. While access is
				     off, the copy above already points there. */ }
				{ isMcpEnabled && (
					<Text
						render={ <p /> }
						variant="body-sm"
						className="jetpack-ai-overview__muted jetpack-ai-overview__access-note"
					>
						{ createInterpolateElement(
							__(
								'You decide what agents can read and change. <link>Manage access</link>',
								'jetpack'
							),
							{ link: <Link href={ getViewHref( 'mcp' ) } /> }
						) }
					</Text>
				) }
			</div>

			{ beforeSkills }

			{ /* Names the cards below; a label, not a heading, so the cards' own
			     titles keep their level under the page's h2. */ }
			<Text
				render={ <p /> }
				id={ pickHeadingId }
				variant="heading-sm"
				className="jetpack-ai-overview__section-label jetpack-ai-overview__pick-label"
			>
				{ __( 'Start with a skill', 'jetpack' ) }
			</Text>
			{ /* The skills tab's cards on its grid, inside its root class so its
			     styles and its one-column breakpoint apply. */ }
			<div className="jetpack-ai-discover" role="group" aria-labelledby={ pickHeadingId }>
				<div className="jetpack-ai-discover__grid">
					{ suggestions.map( skill => (
						<SkillCard
							key={ skill.slug }
							skill={ skill }
							onView={ handleView }
							onSend={ handleCardSend }
							showWordPressAgent={ showWordPressAgent }
						/>
					) ) }
				</div>
			</div>

			{ /* Built without the skill param, so a panel left open before the
			     Overview doesn't come back with the link. */ }
			<div className="jetpack-ai-overview__browse">
				<Link href={ getViewHref( 'discover' ) } onClick={ handleBrowse }>
					{ __( 'Browse all skills', 'jetpack' ) }
				</Link>
			</div>
		</section>
	);
}
