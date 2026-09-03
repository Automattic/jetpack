import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import analytics from 'lib/analytics';
import AiOverview from '../index';
import { depletedPayload, freePayload, legacyTieredPayload, paidPayload } from './fixtures';

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
	// The assistant banner has its own suite; dismissing it here keeps its
	// links from colliding with the quick-start card queries.
	dispatch( preferencesStore ).set( 'jetpack/ai', 'assistantBannerDismissed', true );
} );

// The assistant banner imports the webpack-aliased 'lib/analytics', which
// doesn't resolve under jest — provide it virtually.
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

afterEach( () => {
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
			screen.findByRole( 'heading', { level: 2, name: 'Upgrade Jetpack AI Assistant' } )
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
			screen.queryByRole( 'heading', { name: 'Upgrade Jetpack AI Assistant' } )
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
		expect( screen.getByRole( 'heading', { level: 2, name: 'Quick start' } ) ).toBeInTheDocument();
	} );

	test( 'legacy tiered plan: treated as paid, no usage card', async () => {
		apiFetch.mockResolvedValueOnce( legacyTieredPayload() );

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
			screen.getByRole( 'heading', { level: 2, name: 'Walkthrough videos' } )
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
		// Same-site row: no new tab, unlike the external Quick start cards.
		expect( row ).not.toHaveAttribute( 'target' );
		expect( row ).toHaveAttribute( 'href', 'https://example.com/activity' );
	} );

	test( 'not connected: explains the connection instead of an API error, and skips the fetch', async () => {
		// Without a connection the usage endpoint can only fail, and a red
		// "Unable to fetch the requested data." is the wrong story to tell —
		// say what's actually wrong and don't make the request at all.
		render( <AiOverview { ...PROPS } blogId={ 0 } /> );

		await expect(
			screen.findByText( 'Jetpack is not connected to WordPress.com.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		// Same next step the Features view offers, so the two tabs agree.
		expect( screen.getByRole( 'link', { name: 'Connect Jetpack' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);
		expect( apiFetch ).not.toHaveBeenCalled();
		// A bare `blogId &&` guard would print the 0 itself.
		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar', { hidden: true } ) ).not.toBeInTheDocument();
		// The rest of the tab is still useful while disconnected.
		expect( screen.getByRole( 'link', { name: /Activity log/ } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Walkthrough videos' ) ).toBeInTheDocument();
	} );

	test( 'activity log: absent without the MCP preconditions', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } showActivityLog={ false } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Activity log/ } ) ).not.toBeInTheDocument();
	} );

	test( 'host AI off: a notice replaces the usage card and no upgrade is offered', async () => {
		render( <AiOverview { ...PROPS } hostAllowsAi={ false } /> );

		expect(
			screen.getByText( 'AI has been turned off for this site.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Available requests' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
		expect( apiFetch ).not.toHaveBeenCalled();
		// The rest of the tab is unrelated to AI billing and stays.
		expect( screen.getByText( 'Documentation' ) ).toBeInTheDocument();
	} );

	test( 'user account not linked: explains the account, does not fetch', async () => {
		render( <AiOverview { ...PROPS } isUserConnected={ false } /> );

		expect(
			screen.getByText( 'Your WordPress.com account isn’t connected.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Connect your user account to see your AI usage.' } )
		).toHaveAttribute( 'href', 'admin.php?page=my-jetpack#/connection' );
		expect( screen.queryByText( 'Available requests' ) ).not.toBeInTheDocument();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	test( 'activity log: absent without an activityLogUrl', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render(
			<AiOverview blogId={ PROPS.blogId } upgradeUrl={ PROPS.upgradeUrl } showActivityLog />
		);

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Activity log/ } ) ).not.toBeInTheDocument();
	} );

	test( 'walkthrough videos: renders the four cards with their durations', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Walkthrough videos' ) ).resolves.toBeInTheDocument();

		// Each card links to its course lesson; durations are the live lesson
		// lengths, not the design frame's stale numbers.
		const videos = [
			[ 'Connect your site to Claude', '3:18' ],
			[ 'Build a page from a single prompt', '3:09' ],
			[ 'Manage your Media Library with AI', '3:14' ],
			[ 'Optimize your site with AI', '3:15' ],
		];
		for ( const [ title, duration ] of videos ) {
			const card = screen.getByRole( 'link', { name: new RegExp( title ) } );
			expect( card ).toHaveTextContent( duration );
		}
	} );

	test( 'walkthrough videos: each card shows its thumbnail', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Walkthrough videos' ) ).resolves.toBeInTheDocument();

		// The artwork is decorative — the card's title carries the meaning —
		// so the images are alt-empty and queried by role="presentation".
		const thumbs = screen.getAllByRole( 'presentation' );
		expect( thumbs ).toHaveLength( 4 );
		thumbs.forEach( img => expect( img ).toHaveAttribute( 'src' ) );
	} );

	test( 'walkthrough videos: each card opens in a new tab and says so', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Walkthrough videos' ) ).resolves.toBeInTheDocument();

		// The cards carry no arrow (the design leaves them unmarked), so the
		// new tab is announced through each link's accessible name instead.
		for ( const title of [
			'Connect your site to Claude',
			'Build a page from a single prompt',
			'Manage your Media Library with AI',
			'Optimize your site with AI',
		] ) {
			const card = screen.getByRole( 'link', {
				name: new RegExp( `${ title }.*\\(opens in a new tab\\)` ),
			} );
			expect( card ).toHaveAttribute( 'target', '_blank' );
			expect( card ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		}
	} );

	test( 'walkthrough videos: each card links through the redirect service', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Walkthrough videos' ) ).resolves.toBeInTheDocument();

		const slugByName = {
			'Connect your site to Claude': 'jetpack-ai-hub-overview-video-connect-claude',
			'Build a page from a single prompt': 'jetpack-ai-hub-overview-video-build-page',
			'Manage your Media Library with AI': 'jetpack-ai-hub-overview-video-media-library',
			'Optimize your site with AI': 'jetpack-ai-hub-overview-video-optimize-site',
		};
		for ( const [ name, slug ] of Object.entries( slugByName ) ) {
			const card = screen.getByRole( 'link', { name: new RegExp( name ) } );
			expect( card ).toHaveAttribute( 'href', expect.stringContaining( slug ) );
		}
	} );

	test( 'documentation: renders all four links through the redirect service', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Settle the usage fetch so it cannot update state after the test body.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		// The i4 docs section is a plain list of external links (no rows).
		const slugByName = {
			'MCP integration guide': 'jetpack-ai-hub-overview-docs-mcp-guide',
			'AI features overview': 'jetpack-ai-hub-overview-docs-features',
			'Billing & plans': 'jetpack-ai-hub-overview-docs-billing',
			'Available capabilities': 'jetpack-ai-hub-overview-docs-mcp-tools',
		};
		for ( const [ name, slug ] of Object.entries( slugByName ) ) {
			const link = screen.getByRole( 'link', { name: new RegExp( name ) } );
			expect( link ).toHaveAttribute( 'href', expect.stringContaining( slug ) );
		}
	} );
	test( 'tracks: records the overview view once on mount', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( callsFor( 'jetpack_ai_hub_viewed' ) ).toEqual( [
			{ site_type: 'jetpack', is_a11n: 'false', is_test: 'false', tab: 'overview' },
		] );
	} );

	test( 'tracks: a video card click records the video slug', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'link', { name: /Connect your site to Claude/ } ) );
		expect( callsFor( 'jetpack_ai_hub_link_click' ) ).toEqual( [
			{
				site_type: 'jetpack',
				is_a11n: 'false',
				is_test: 'false',
				link_type: 'video',
				link: 'jetpack-ai-hub-overview-video-connect-claude',
			},
		] );
	} );

	test( 'tracks: a quick start card click records the connector slug', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'link', { name: /Connect ChatGPT/ } ) );
		expect( callsFor( 'jetpack_ai_hub_link_click' ) ).toEqual( [
			{
				site_type: 'jetpack',
				is_a11n: 'false',
				is_test: 'false',
				link_type: 'quick_start',
				link: 'jetpack-ai-hub-overview-quick-start-chatgpt',
			},
		] );
	} );

	test( 'quick start: renders the two connector cards through the redirect service', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Settle the usage fetch so it cannot update state after the test body.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 2, name: 'Quick start' } ) ).toBeInTheDocument();

		// The frame's Quick start row: Connect ChatGPT / Connect Claude, each a
		// nav row whose destination lives in the redirect service.
		const slugByName = {
			'Connect Claude': 'jetpack-ai-hub-overview-quick-start-claude',
			'Connect ChatGPT': 'jetpack-ai-hub-overview-quick-start-chatgpt',
		};
		for ( const [ name, slug ] of Object.entries( slugByName ) ) {
			const card = screen.getByRole( 'link', { name: new RegExp( name ) } );
			expect( card ).toHaveAttribute( 'href', expect.stringContaining( slug ) );
		}
		expect(
			screen.getByText( 'Give Claude access to your site by installing the connector.' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Give ChatGPT access to your site by installing the connector.' )
		).toBeInTheDocument();
	} );

	test( 'quick start: each card opens in a new tab and says so', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		for ( const title of [ 'Connect Claude', 'Connect ChatGPT' ] ) {
			// The row is named by its title alone; the description and the
			// new-tab announcement arrive via aria-describedby.
			const card = screen.getByRole( 'link', { name: title } );
			expect( card ).toHaveAccessibleDescription( /\(opens in a new tab\)/ );
			expect( card ).toHaveAttribute( 'target', '_blank' );
			expect( card ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		}
	} );
	test( 'loading: announces the usage summary once the fetch lands', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		// Removing a live region announces nothing, so completion has to be spoken.
		expect( speak ).toHaveBeenCalledWith( '8 of 20 requests available', 'polite' );
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

	test( 'section order: the activity log sits below the walkthrough videos', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		const videos = screen.getByRole( 'heading', { level: 2, name: 'Walkthrough videos' } );
		const activityLog = screen.getByRole( 'link', { name: /Activity log/ } );
		const docs = screen.getByRole( 'heading', { level: 2, name: 'Documentation' } );

		// DOCUMENT_POSITION_FOLLOWING === 4.
		expect( videos.compareDocumentPosition( activityLog ) ).toBe( 4 );
		expect( activityLog.compareDocumentPosition( docs ) ).toBe( 4 );
	} );

	test( 'quick start: each connector row carries its own mark', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		// A missing icon entry still renders the row, just with nothing in the icon
		// slot, so the mark itself has to be asserted. It is decorative and
		// aria-hidden by design, so Testing Library has no query that reaches it.
		/* eslint-disable testing-library/no-node-access */
		const marks = [ 'Connect ChatGPT', 'Connect Claude' ].map( name =>
			screen.getByRole( 'link', { name: new RegExp( name ) } ).querySelector( 'svg' )
		);

		for ( const mark of marks ) {
			// Inset on a 28px canvas rather than the icons' usual 24px grid.
			expect( mark ).toHaveAttribute( 'viewBox', '-4 -4 32 32' );
			expect( mark ).toHaveAttribute( 'width', '28' );
		}

		// The two rows must not share one mark.
		const paths = marks.map( mark => mark.querySelector( 'path' ).getAttribute( 'd' ) );
		/* eslint-enable testing-library/no-node-access */
		expect( paths[ 0 ] ).not.toBe( paths[ 1 ] );
	} );
} );
