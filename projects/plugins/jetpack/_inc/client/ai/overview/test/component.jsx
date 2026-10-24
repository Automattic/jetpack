import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import analytics from 'lib/analytics';
import AiOverview from '../index';
import { depletedPayload, freePayload, paidPayload, tieredPayload } from './fixtures';

// The usage hook fetches through @wordpress/api-fetch; stub it so nothing
// hits the network and each test controls the response.
jest.mock( '@wordpress/api-fetch' );
// The card announces the start and the end of the usage fetch through
// @wordpress/a11y's persistent live regions; stub it so both are assertable.
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
// The component imports the webpack-aliased 'lib/analytics', which does not
// resolve under jest; provide it virtually.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

const callsFor = eventName =>
	analytics.tracks.recordEvent.mock.calls
		.filter( call => call[ 0 ] === eventName )
		.map( call => call[ 1 ] );

// jsdom does not implement navigation; cancel the anchors' default action so
// clicks still reach React's handlers without a jsdom "not implemented" error.
const cancelNavigation = event => event.preventDefault();
beforeEach( () => {
	document.addEventListener( 'click', cancelNavigation );
	// The connect self-hosted tests flip isSelfHosted on this object.
	window.jetpackAiSettings = {};
	// The assistant banner has its own suite; dismissing it here keeps its
	// links from colliding with the connect card queries.
	dispatch( preferencesStore ).set( 'jetpack/ai', 'assistantBannerDismissed', true );
} );

// The assistant banner imports the webpack-aliased 'lib/analytics', which
// doesn't resolve under jest — provide it virtually.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

afterEach( () => {
	delete window.jetpackAiSettings;
	jest.resetAllMocks();
	document.removeEventListener( 'click', cancelNavigation );
	// The preferences store lives on the shared default registry, so state
	// written by one test survives into the next — reset the flag each time.
	dispatch( preferencesStore ).set( 'jetpack/ai', 'assistantBannerDismissed', undefined );
} );

const PROPS = {
	blogId: 1,
	activityLogUrl: 'https://example.com/activity',
	upgradeUrl: 'https://example.com/upgrade',
	showActivityLog: true,
};

// The design-system Notice mirrors its text into a hidden wp.a11y.speak live
// region, so a bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

describe( 'AiOverview', () => {
	test( 'free tier: renders remaining requests against the free limit', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Free sites must get the full view — there is no plan gate. The card
		// counts what is AVAILABLE (limit − used), not what was used.
		await expect( screen.findByText( '8' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Available requests' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'progressbar', { hidden: true } ) ).toBeInTheDocument();
	} );

	test( 'upsell: with requests left, the card pitches upgrading before they run out', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Same layout as the depleted state, softer copy: the upsell shows
		// whenever an upgrade is on offer, not just at zero.
		await expect(
			screen.findByRole( 'heading', { level: 2, name: 'Upgrade Jetpack AI' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByText(
				'Draft, rewrite, and illustrate posts without leaving the editor. Upgrade before you run out.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			'https://example.com/upgrade'
		);
		// No plan label anywhere — plan details live in My Jetpack.
		expect( screen.queryByText( 'Free' ) ).not.toBeInTheDocument();
	} );

	test( 'meter a11y: decorative bar, the text carries the counts', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// The bar and the loose value/limit nodes are decorative; one hidden,
		// fully translatable sentence carries the counts, so nothing is read
		// twice and no bare percentage is announced.
		await expect( screen.findByText( '8' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'progressbar', { hidden: true } ) ).toBeInTheDocument();
		expect( screen.getByText( '8 of 20 requests available' ) ).toBeInTheDocument();
	} );

	test( 'depleted: the copy hardens at zero requests', async () => {
		apiFetch.mockResolvedValueOnce( depletedPayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect(
			screen.findByRole( 'heading', { level: 2, name: 'You’ve used all your requests' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByText(
				'Upgrade to keep drafting, rewriting, and illustrating without leaving the editor.'
			)
		).toBeInTheDocument();
		// The requests readout keeps the standard card's shape and a11y: the
		// hidden sentence carries the counts, the empty bar stays decorative.
		expect( screen.getByText( '0' ) ).toBeInTheDocument();
		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.getByText( '0 of 20 requests available' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'progressbar', { hidden: true } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			'https://example.com/upgrade'
		);
		// No plan label anywhere — plan details live in My Jetpack.
		expect( screen.queryByText( 'Free' ) ).not.toBeInTheDocument();
		// The depleted state keeps its own, harder pitch.
		expect(
			screen.queryByRole( 'heading', { name: 'Upgrade Jetpack AI' } )
		).not.toBeInTheDocument();
	} );

	test( 'depleted: without an upgrade URL, the standard card stays', async () => {
		// Zero available with nowhere to upgrade to: the upsell copy is a
		// pitch for a button that could not exist, so it must not show.
		apiFetch.mockResolvedValueOnce( depletedPayload() );

		render( <AiOverview { ...PROPS } upgradeUrl={ undefined } /> );

		await expect( screen.findByText( '0' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Available requests' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'You’ve used all your requests' } )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	test( 'paid: no usage card at all', async () => {
		apiFetch.mockResolvedValueOnce( paidPayload() );

		// Without a named plan the upsell placeholder holds the slot, which is
		// also the only queryable handle for "the fetch settled".
		const { container } = render( <AiOverview { ...PROPS } /> );

		// Nothing to meter and nothing to sell: once the fetch lands the card
		// unmounts entirely.
		/* eslint-disable testing-library/no-container, testing-library/no-node-access --
		   The skeleton bars are decorative and aria-hidden, so Testing Library
		   has no query that reaches them; the layout class is the only handle. */
		await waitForElementToBeRemoved( () =>
			container.querySelector( '.jetpack-ai-overview__upsell' )
		);
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
		expect( screen.queryByText( 'Unlimited' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Available requests' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar', { hidden: true } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
		// The rest of the tab is unaffected.
		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Connect your AI agent' } )
		).toBeInTheDocument();
		// With nothing left inside it, the intro wrapper must be truly :empty
		// so the stylesheet can drop it and the outer gap doesn't double.
		/* eslint-disable testing-library/no-container, testing-library/no-node-access --
		   The wrapper is a bare layout div; the class is the only handle. */
		expect( container.querySelector( '.jetpack-ai-overview__intro' ) ).toBeEmptyDOMElement();
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
	} );

	test( 'fixed tier: treated as paid, no usage card', async () => {
		apiFetch.mockResolvedValueOnce( tieredPayload() );

		const { container } = render( <AiOverview { ...PROPS } /> );

		/* eslint-disable testing-library/no-container, testing-library/no-node-access --
		   The skeleton bars are decorative and aria-hidden, so Testing Library
		   has no query that reaches them; the layout class is the only handle. */
		await waitForElementToBeRemoved( () =>
			container.querySelector( '.jetpack-ai-overview__upsell' )
		);
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
		expect( screen.queryByText( 'Available requests' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	test( 'standard card: a free site without an upgrade URL shows no plan label either', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } upgradeUrl={ undefined } planName="Jetpack Complete" /> );

		await expect( screen.findByText( '8' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Free' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Jetpack Complete' ) ).not.toBeInTheDocument();
	} );

	test( 'sections: headed at level two under the page title', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect(
			screen.findByRole( 'heading', { level: 2, name: 'Documentation' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Connect your AI agent' } )
		).toBeInTheDocument();
	} );

	test( 'upgrade: links to the shared upgrade URL', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		const upgrade = await screen.findByRole( 'link', { name: 'Upgrade' } );
		expect( upgrade ).toHaveAttribute( 'href', 'https://example.com/upgrade' );
	} );

	test( 'loading: the usage card shows a skeleton while docs and activity render immediately', () => {
		// A held promise keeps the usage fetch in flight for the whole test.
		apiFetch.mockReturnValueOnce( new Promise( () => {} ) );

		render( <AiOverview { ...PROPS } /> );

		// The placeholder bars are decorative (Skeleton sets aria-hidden), so the
		// loading state is announced rather than mounted as a live region.
		expect( speak ).toHaveBeenCalledWith( 'Loading your AI usage…', 'polite' );
		// The remote usage call must not block the static sections.
		expect( screen.getByRole( 'link', { name: /Activity log/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /MCP integration guide/ } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar', { hidden: true } ) ).not.toBeInTheDocument();
	} );

	test( 'load failure: the usage card shows an error notice; docs and activity remain', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'Unable to fetch the requested data.' ) );

		render( <AiOverview { ...PROPS } /> );

		await expect(
			screen.findByText( 'Unable to fetch the requested data.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Activity log/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Available capabilities/ } ) ).toBeInTheDocument();
	} );

	test( 'activity log: renders as a link to the site activity log', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		const row = await screen.findByRole( 'link', { name: /Activity log/ } );
		// Same-site row: no new tab, unlike the connect buttons.
		expect( row ).not.toHaveAttribute( 'target' );
		expect( row ).toHaveAttribute( 'href', 'https://example.com/activity' );
	} );

	test( 'activity log: promises AI agent actions when the link is filtered', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } activityLogFiltered /> );

		await expect(
			screen.findByText( 'Review recent actions taken by AI agents on your site.' )
		).resolves.toBeInTheDocument();
	} );

	test( 'activity log: describes all actions when the link is not filtered', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } activityLogFiltered={ false } /> );

		await expect(
			screen.findByText( 'Review recent actions on your site.' )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( 'Review recent actions taken by AI agents on your site.' )
		).not.toBeInTheDocument();
	} );

	test( 'activity log: absent without the MCP preconditions', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } showActivityLog={ false } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Activity log/ } ) ).not.toBeInTheDocument();
	} );

	test( 'usage cannot be loaded: no card, and no request that could only fail', async () => {
		render( <AiOverview { ...PROPS } canLoadUsage={ false } /> );

		expect( screen.queryByText( 'Available requests' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
		expect( apiFetch ).not.toHaveBeenCalled();
		// The rest of the tab is unrelated to AI billing and stays.
		expect( screen.getByText( 'Documentation' ) ).toBeInTheDocument();
	} );

	test( 'no notice: the card is there from the first paint and asks straight away', () => {
		// A held promise keeps the fetch in flight, so this is the first frame.
		apiFetch.mockReturnValueOnce( new Promise( () => {} ) );

		render( <AiOverview { ...PROPS } /> );

		// The placeholder holds the card's space rather than the layout moving later.
		expect( speak ).toHaveBeenCalledWith( 'Loading your AI usage…', 'polite' );
		expect( apiFetch ).toHaveBeenCalled();
	} );

	test( 'activity log: absent without an activityLogUrl', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render(
			<AiOverview blogId={ PROPS.blogId } upgradeUrl={ PROPS.upgradeUrl } showActivityLog />
		);

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Activity log/ } ) ).not.toBeInTheDocument();
	} );

	test( 'walkthrough videos: the section is gone', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		expect(
			screen.queryByRole( 'heading', { name: 'Walkthrough videos' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /Connect your site to Claude/ } )
		).not.toBeInTheDocument();
	} );

	test( 'documentation: one card, a row per guide, through the redirect service', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Settle the usage fetch so it cannot update state after the test body.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		// Each guide is a nav row with its own description, opening in a new tab.
		const rows = {
			'MCP integration guide': [
				'jetpack-ai-hub-overview-docs-mcp-guide',
				'Connect an AI agent to your site.',
			],
			'AI features overview': [
				'jetpack-ai-hub-overview-docs-features',
				'Everything Jetpack AI can do on your site.',
			],
			'Billing & plans': [
				'jetpack-ai-hub-overview-docs-billing',
				'How requests, plans, and upgrades work.',
			],
			'Available capabilities': [
				'jetpack-ai-hub-overview-docs-mcp-tools',
				'What a connected agent can read and change.',
			],
		};
		const links = [];
		for ( const [ name, [ slug, description ] ] of Object.entries( rows ) ) {
			const link = screen.getByRole( 'link', { name: new RegExp( name ) } );
			expect( link ).toHaveAttribute( 'href', expect.stringMatching( `source=${ slug }(&|$)` ) );
			expect( link ).toHaveAccessibleDescription( description );
			expect( link ).toHaveAttribute( 'target', '_blank' );
			links.push( link );
		}
		// All four share one card.
		/* eslint-disable testing-library/no-node-access -- the card is a plain
		   container with no role, so its class is the only handle. */
		const cards = new Set( links.map( link => link.closest( '.jetpack-ai-overview__docs' ) ) );
		/* eslint-enable testing-library/no-node-access */
		expect( cards.size ).toBe( 1 );
		expect( [ ...cards ][ 0 ] ).not.toBeNull();
	} );

	test( 'tracks: a documentation row click records its slug', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'link', { name: /Billing & plans/ } ) );
		expect( callsFor( 'jetpack_ai_hub_link_click' ) ).toEqual( [
			expect.objectContaining( {
				link_type: 'docs',
				link: 'jetpack-ai-hub-overview-docs-billing',
			} ),
		] );
	} );

	test( 'skills hero: only with the Skills tab on', async () => {
		// The two layouts mount the usage card afresh, so it fetches again.
		apiFetch.mockResolvedValue( freePayload() );

		const { rerender } = render( <AiOverview { ...PROPS } /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Run your site from your AI agent' } )
		).not.toBeInTheDocument();

		window.jetpackAiSettings.featureFlags = { 'ai-hub-discover': true };
		rerender( <AiOverview { ...PROPS } /> );
		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Run your site from your AI agent' } )
		).toBeInTheDocument();
		// Let the remounted usage card's fetch land inside the test.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
	} );

	test( 'connect card: on Overview, pointing at Settings while MCP is off', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		const { rerender } = render( <AiOverview { ...PROPS } /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		const card = screen.getByRole( 'region', { name: 'Connect your AI agent' } );
		expect(
			within( card ).getByText(
				'Manage your site by chatting with Claude, ChatGPT, or another agent.'
			)
		).toBeInTheDocument();
		// No setup sub-view to open unless the hub is there.
		expect(
			within( card ).queryByRole( 'link', { name: 'Other agents' } )
		).not.toBeInTheDocument();

		rerender( <AiOverview { ...PROPS } isMcpEnabled={ false } showOtherAgents /> );
		expect( within( card ).getByRole( 'link', { name: 'Settings' } ) ).toHaveAttribute(
			'href',
			expect.stringMatching( /#\/mcp$/ )
		);
		expect( within( card ).getByRole( 'link', { name: 'Other agents' } ) ).toBeInTheDocument();
	} );

	test( 'section order: opening with connect, usage, skills, activity log, documentation', async () => {
		window.jetpackAiSettings.featureFlags = { 'ai-hub-discover': true };
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		const usage = await screen.findByText( 'Available requests' );
		// With Skills on, the connect buttons sit in the opening column, not a card.
		expect(
			screen.queryByRole( 'heading', { name: 'Connect your AI agent' } )
		).not.toBeInTheDocument();
		const sequence = [
			screen.getByRole( 'heading', { level: 2, name: 'Run your site from your AI agent' } ),
			screen.getByRole( 'link', { name: /^Connect Claude/ } ),
			// On a free plan the upgrade card comes before the skills.
			usage,
			screen.getByRole( 'group', { name: 'Start with a skill' } ),
			screen.getByRole( 'link', { name: /Activity log/ } ),
			screen.getByRole( 'heading', { level: 2, name: 'Documentation' } ),
		];
		for ( let i = 1; i < sequence.length; i++ ) {
			// DOCUMENT_POSITION_FOLLOWING === 4.
			expect( sequence[ i - 1 ].compareDocumentPosition( sequence[ i ] ) ).toBe( 4 );
		}
	} );

	test( 'tracks: an Activity log click records whether the link is filtered', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } activityLogFiltered /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'link', { name: /Activity log/ } ) );
		expect( callsFor( 'jetpack_ai_hub_link_click' ) ).toEqual( [
			{
				site_type: 'jetpack',
				is_a11n: 'false',
				is_test: 'false',
				link_type: 'activity_log',
				link: 'activity_log',
				filtered: 'true',
			},
		] );
	} );

	test( 'tracks: a connect button click records the agent', async () => {
		window.jetpackAiSettings.isSelfHosted = true;
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'link', { name: /Connect ChatGPT/ } ) );
		expect( callsFor( 'jetpack_ai_hub_link_click' ) ).toEqual( [
			{
				site_type: 'jetpack',
				is_a11n: 'false',
				is_test: 'false',
				link_type: 'overview_connect',
				link: 'chatgpt',
			},
		] );
	} );

	test( 'connect: self-hosted buttons go through the redirect service', async () => {
		window.jetpackAiSettings.isSelfHosted = true;
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Settle the usage fetch so it cannot update state after the test body.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		const slugByName = {
			'Connect Claude': 'jetpack-ai-hub-overview-quick-start-claude-self-hosted',
			'Connect ChatGPT': 'jetpack-ai-hub-overview-quick-start-chatgpt-self-hosted',
		};
		for ( const [ name, slug ] of Object.entries( slugByName ) ) {
			const card = screen.getByRole( 'link', { name: new RegExp( name ) } );
			expect( card ).toHaveAttribute( 'href', expect.stringMatching( `source=${ slug }(&|$)` ) );
		}
	} );

	test( 'connect: WordPress.com sites go straight to each agent’s directory', async () => {
		window.jetpackAiSettings.isSelfHosted = false;
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		expect( screen.getByRole( 'link', { name: /Connect Claude/ } ) ).toHaveAttribute(
			'href',
			'https://claude.ai/directory/wordpress-com'
		);
		expect( screen.getByRole( 'link', { name: /Connect ChatGPT/ } ) ).toHaveAttribute(
			'href',
			'https://chatgpt.com/plugins/wordpress-com?open_in_app'
		);
	} );

	test( 'connect: each button opens in a new tab and says so', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		for ( const title of [ 'Connect Claude', 'Connect ChatGPT' ] ) {
			// The new-tab warning rides in the accessible NAME — descriptions
			// are often skipped when scanning links; the description carries
			// only the row's own copy.
			const card = screen.getByRole( 'link', {
				name: new RegExp( `${ title }.*\\(opens in a new tab\\)` ),
			} );
			expect( card ).not.toHaveAccessibleDescription( /\(opens in a new tab\)/ );
			expect( card ).toHaveAttribute( 'target', '_blank' );
			expect( card ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		}
	} );
	test( 'loading: announces the usage summary once the fetch lands', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		// Removing a live region announces nothing, so completion has to be spoken. The
		// announcement trails the render it reports, so wait for it rather than assume it.
		await waitFor( () =>
			expect( speak ).toHaveBeenCalledWith( '8 of 20 requests available', 'polite' )
		);
	} );

	test( 'loading: a site that already names a plan gets no placeholder', () => {
		// A held promise keeps the usage fetch in flight for the whole test.
		apiFetch.mockReturnValueOnce( new Promise( () => {} ) );

		const { container } = render( <AiOverview { ...PROPS } planName="Jetpack Complete" /> );

		// A named plan means the likely outcome is no card at all — a skeleton
		// that then vanishes would be a resize for nothing, and announcing a
		// load that renders nothing is noise.
		/* eslint-disable testing-library/no-container, testing-library/no-node-access --
		   The placeholder bars are decorative and aria-hidden, so Testing Library
		   has no query that reaches them; the layout class is the only handle. */
		expect( container.querySelector( '.jetpack-ai-overview__upsell' ) ).toBeNull();
		expect( container.querySelector( '.jetpack-ai-overview__usage' ) ).toBeNull();
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
		expect( speak ).not.toHaveBeenCalled();
	} );

	test( 'section order: the activity log sits between the connect card and documentation', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		const connect = screen.getByRole( 'heading', { level: 2, name: 'Connect your AI agent' } );
		const activityLog = screen.getByRole( 'link', { name: /Activity log/ } );
		const docs = screen.getByRole( 'heading', { level: 2, name: 'Documentation' } );

		// DOCUMENT_POSITION_FOLLOWING === 4.
		expect( connect.compareDocumentPosition( activityLog ) ).toBe( 4 );
		expect( activityLog.compareDocumentPosition( docs ) ).toBe( 4 );
	} );
} );
