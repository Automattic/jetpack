import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import AiOverview from '../index';
import { freePayload, tieredPayload, unlimitedPayload } from './fixtures';

// The usage hook fetches through @wordpress/api-fetch; stub it so nothing
// hits the network and each test controls the response.
jest.mock( '@wordpress/api-fetch' );

afterEach( () => {
	jest.resetAllMocks();
} );

const PROPS = {
	blogId: 1,
	activityLogUrl: 'https://example.com/activity',
	upgradeUrl: 'https://example.com/upgrade',
};

// The design-system Notice mirrors its text into a hidden wp.a11y.speak live
// region, so a bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

describe( 'AiOverview', () => {
	test( 'free tier: renders remaining requests against the free limit per the i4 card', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Free sites must get the full view — there is no plan gate. The card
		// counts what is AVAILABLE (limit − used), not what was used.
		await expect( screen.findByText( '8' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Available requests' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'progressbar', { name: 'Available requests' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Free' ) ).toBeInTheDocument();
	} );

	test( 'tiered plan: renders remaining period requests against the tier limit', async () => {
		apiFetch.mockResolvedValueOnce( tieredPayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( '160' ) ).resolves.toBeInTheDocument();
		// "500" renders twice: the meter's limit and the plan label (the
		// payload has no product name for tiers, so the readable limit
		// stands in — flagged for design).
		expect( screen.getAllByText( '500' ) ).toHaveLength( 2 );
		expect( screen.getByRole( 'progressbar', { name: 'Available requests' } ) ).toBeInTheDocument();
	} );

	test( 'legacy unlimited: full meter, renewal date, no upgrade', async () => {
		apiFetch.mockResolvedValueOnce( { ...tieredPayload(), 'current-tier': { value: 1 } } );

		render( <AiOverview { ...PROPS } /> );

		// The i4 paid card shows UNLIMITED over a full meter, a plan label
		// ("Unlimited" until the payload carries a product name), and a
		// renewal date where the free card has the Upgrade button.
		await expect( screen.findAllByText( 'Unlimited' ) ).resolves.toHaveLength( 2 );
		expect( screen.getByRole( 'progressbar', { name: 'Available requests' } ) ).toBeInTheDocument();
		expect( screen.getByText( /Renews on/ ) ).toBeInTheDocument();
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
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
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
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		// The rest of the tab is still useful while disconnected.
		expect( screen.getByRole( 'link', { name: /Activity log/ } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Walkthrough videos' ) ).toBeInTheDocument();
	} );

	test( 'activity log: absent without an activityLogUrl', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview blogId={ PROPS.blogId } upgradeUrl={ PROPS.upgradeUrl } /> );

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
} );
