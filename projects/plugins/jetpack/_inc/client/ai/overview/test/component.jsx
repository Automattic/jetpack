import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { getSettings as getDateSettings, setSettings as setDateSettings } from '@wordpress/date';
import analytics from 'lib/analytics';
import AiOverview from '../index';
import { freePayload, tieredPayload, unlimitedPayload } from './fixtures';

// The usage hook fetches through @wordpress/api-fetch; stub it so nothing
// hits the network and each test controls the response.
jest.mock( '@wordpress/api-fetch' );
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
beforeEach( () => document.addEventListener( 'click', cancelNavigation ) );

afterEach( () => {
	jest.resetAllMocks();
	document.removeEventListener( 'click', cancelNavigation );
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

// The renewal line renders the date in its own nowrap span (the frame breaks
// after the label, never inside the date), so its text spans two nodes.
const renewalLine = expected => ( _, el ) =>
	el?.classList?.contains( 'jetpack-ai-overview__renewal' ) && el.textContent === expected;

describe( 'AiOverview', () => {
	test( 'free tier: renders remaining requests against the free limit per the i4 card', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Free sites must get the full view — there is no plan gate. The card
		// counts what is AVAILABLE (limit − used), not what was used.
		await expect( screen.findByText( '8' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Available requests' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'progressbar', { hidden: true } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Free' ) ).toBeInTheDocument();
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

	test( 'tiered plan: renders remaining period requests against the tier limit', async () => {
		apiFetch.mockResolvedValueOnce( tieredPayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( '160' ) ).resolves.toBeInTheDocument();
		// The limit shows once, on the meter — never repeated as a plan name.
		expect( screen.getAllByText( '500' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'progressbar', { hidden: true } ) ).toBeInTheDocument();
	} );

	test( 'legacy unlimited: full meter, renewal date, no upgrade', async () => {
		apiFetch.mockResolvedValueOnce( { ...tieredPayload(), 'current-tier': { value: 1 } } );

		render( <AiOverview { ...PROPS } /> );

		// The i4 paid card shows UNLIMITED over a full meter — once — and no
		// Upgrade. Without a purchase date there is no renewal line: the usage
		// period's rollover is a different date and must not stand in for it.
		await expect( screen.findAllByText( 'Unlimited' ) ).resolves.toHaveLength( 1 );
		expect( screen.getByRole( 'progressbar', { hidden: true } ) ).toBeInTheDocument();
		expect( screen.queryByText( /Renews on/ ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	test( 'plan name: the purchase name labels a paid state', async () => {
		apiFetch.mockResolvedValueOnce( unlimitedPayload() );

		render( <AiOverview { ...PROPS } planName="WordPress.com Business" /> );

		await expect( screen.findByText( 'WordPress.com Business' ) ).resolves.toBeInTheDocument();
	} );

	test( 'plan name: a free tier stays Free even with a stale purchase name', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } planName="Jetpack Complete" /> );

		// The usage endpoint owns the tier; an expired purchase must not
		// relabel a free site as paid.
		await expect( screen.findByText( 'Free' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Jetpack Complete' ) ).not.toBeInTheDocument();
	} );

	test( 'plan renewal: the purchase date wins over the usage-period rollover', async () => {
		// The payload's next-start is the monthly usage rollover; the Plan cell
		// shows the purchase's own renewal, matching My Jetpack (design QA).
		apiFetch.mockResolvedValueOnce( unlimitedPayload() );

		render(
			<AiOverview { ...PROPS } planName="Business" planRenewsOn="2026-12-23T00:00:00+00:00" />
		);

		await expect( screen.findByText( /December 23, 2026/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /September 1, 2026/ ) ).not.toBeInTheDocument();
	} );

	test( 'renewal date: reads as an expiry when the purchase does not auto-renew', async () => {
		// Auto-renew off means the date is the last day of service, not a
		// renewal — matching My Jetpack and the wpcom subscriptions page.
		apiFetch.mockResolvedValueOnce( unlimitedPayload() );

		render(
			<AiOverview
				{ ...PROPS }
				planName="Business"
				planRenewsOn="2026-12-23T00:00:00+00:00"
				planAutoRenew={ false }
			/>
		);

		await expect(
			screen.findByText( renewalLine( 'Expires on: December 23, 2026' ) )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /Renews on/ ) ).not.toBeInTheDocument();
	} );

	test( 'renewal date: an unknown auto-renew state keeps the renewal wording', async () => {
		// The flag is absent on payloads that predate it; unknown must not be
		// read as "off", which would mislabel every auto-renewing plan.
		apiFetch.mockResolvedValueOnce( unlimitedPayload() );

		render(
			<AiOverview { ...PROPS } planName="Business" planRenewsOn="2026-12-23T00:00:00+00:00" />
		);

		await expect(
			screen.findByText( renewalLine( 'Renews on: December 23, 2026' ) )
		).resolves.toBeInTheDocument();
	} );

	test( 'renewal date: follows the site timezone, as the other purchase surfaces do', async () => {
		// @wordpress/date defaults to offset 0 in jest, which would make the
		// assertion vacuous; pin a UTC-7 site for this test only.
		const saved = getDateSettings();
		setDateSettings( {
			...saved,
			timezone: { ...saved.timezone, offset: -7, string: '' },
		} );
		try {
			// A UTC-midnight purchase date is still the previous evening on a
			// western site, and the card names that local day — matching My
			// Jetpack rather than pinning the date to UTC.
			apiFetch.mockResolvedValueOnce( unlimitedPayload() );
			render(
				<AiOverview { ...PROPS } planName="Business" planRenewsOn="2026-12-23T00:00:00+00:00" />
			);
			await expect(
				screen.findByText( renewalLine( 'Renews on: December 22, 2026' ) )
			).resolves.toBeInTheDocument();
		} finally {
			setDateSettings( saved );
		}
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

	test( 'upgrade: links to the shared upgrade URL when a next tier exists', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		const upgrade = await screen.findByRole( 'link', { name: 'Upgrade' } );
		expect( upgrade ).toHaveAttribute( 'href', 'https://example.com/upgrade' );
	} );

	test( 'loading: the usage card shows a spinner while docs and activity render immediately', () => {
		// A held promise keeps the usage fetch in flight for the whole test.
		apiFetch.mockReturnValueOnce( new Promise( () => {} ) );

		render( <AiOverview { ...PROPS } /> );

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
		expect( screen.getByRole( 'link', { name: 'Connect account' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);
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

	test( 'documentation: renders all five links through the redirect service', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Settle the usage fetch so it cannot update state after the test body.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		// The i4 docs section is a plain list of external links (no rows).
		const slugByName = {
			'MCP integration guide': 'jetpack-ai-hub-overview-docs-mcp-guide',
			'AI features overview': 'jetpack-ai-hub-overview-docs-features',
			'Setting up agentic workflows': 'jetpack-ai-hub-overview-docs-agent-setup',
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

	test( 'quick start: renders the two connector cards through the redirect service', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Settle the usage fetch so it cannot update state after the test body.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 2, name: 'Quick start' } ) ).toBeInTheDocument();

		// The frame's Quick start row: Connect Claude / Connect ChatGPT, each a
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
			const card = screen.getByRole( 'link', {
				name: new RegExp( `${ title }.*\\(opens in a new tab\\)` ),
			} );
			expect( card ).toHaveAttribute( 'target', '_blank' );
			expect( card ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		}
	} );
} );
